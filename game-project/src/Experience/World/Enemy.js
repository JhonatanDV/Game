// Enemy.js (Vite/ESM compatible, robusto para SkinnedMesh y visibilidad)
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import FinalPrizeParticles from '../Utils/FinalPrizeParticles.js'
import Sound from './Sound.js'

export default class Enemy {
    constructor({ scene, physicsWorld, playerRef, model, position = new THREE.Vector3(), experience, debug = true, scale = 1.0 }) {
        this.experience = experience
        this.scene = scene
        this.physicsWorld = physicsWorld
        this.playerRef = playerRef
        this.baseSpeed = 2.5 // Velocidad aumentada de 1.0 a 2.5
        this.speed = this.baseSpeed
        this.debug = debug
        this.customScale = scale // Escala personalizada para enemigos especiales

        // Sonido de proximidad
        this.proximitySound = new Sound('/sounds/alert2.mp3', { loop: true, volume: 0 })
        this.proximitySound.play()

        // Guardar referencia original para debug
        this._originalModelPassed = model

        // Obtener scene y animaciones
        let sourceScene = null
        let sourceClips = []

        if (!model) {
            console.error('[Enemy] No se pasó "model" al constructor.')
            return
        } else if (model.scene && model.scene.isObject3D) {
            sourceScene = model.scene
            sourceClips = model.animations || []
        } else if (model.isObject3D) {
            sourceScene = model
            sourceClips = model.animations || (this.experience?.resources?.items?.zombieModel?.animations) || []
        } else {
            sourceScene = model.scene || model
            sourceClips = model.animations || []
        }

        if (!sourceScene) {
            console.error('[Enemy] No se pudo obtener sourceScene del model pasado.')
            return
        }

        if (debug) {
            console.log('[Enemy] Constructor: spawnPos=', position)
            console.log('[Enemy] Clips disponibles:', sourceClips.length)
        }

        // Clonar de forma segura
        try {
            this.model = SkeletonUtils.clone(sourceScene)
            if (debug) console.log('[Enemy] Clonado con SkeletonUtils OK')
        } catch (err) {
            this.model = sourceScene.clone(true)
            console.warn('[Enemy] SkeletonUtils.clone falló, usando clone(true).', err)
        }

        // Prevenir añadir el modelo original a la escena por accidente
        if (this._originalModelPassed?.scene && this.scene.children.includes(this._originalModelPassed.scene)) {
            console.warn('[Enemy] ¡El GLTF original ya está en la escena! Usa siempre clones.')
        }

        // Asegurar visibilidad y sombras
        this.model.traverse((c) => {
            if (c.isMesh) {
                c.castShadow = true
                c.receiveShadow = true
                c.visible = true
                c.frustumCulled = false
                if (c.material) {
                    c.material.needsUpdate = true
                    if (c.material.transparent) {
                        c.material.transparent = false
                        c.material.opacity = 1
                    }
                }
            }
            if (c.isSkinnedMesh) {
                c.frustumCulled = false
                if (c.skeleton?.bones?.length > 0) {
                    c.bind(c.skeleton, c.bindMatrix)
                }
            }
        })

        // -------------------------------
        // Contenedor que seguirá la física
        // -------------------------------
        this.container = new THREE.Group()
        // Aplicar escala personalizada (para giant_mutant será 5 * 3 = 15)
        const finalScale = 3 * this.customScale;
        this.container.scale.set(finalScale, finalScale, finalScale)
        this.container.position.copy(position)
        this.scene.add(this.container)
        this.container.add(this.model)
        this.model.position.set(0, 0, 0) // in-place animation

        // Preparar mixer y acciones
        this.mixer = null
        this.actions = {}
        this.currentAction = null

        const clips = sourceClips.length ? sourceClips : (this._originalModelPassed?.animations || [])
        if (clips.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model)

            const findClip = (names) => names.map(n => n.toLowerCase()).map(n => clips.find(c => c.name.toLowerCase() === n)).find(c => c)
            
            // Buscar animaciones, evitando static pose
            const runClip = findClip(['giant run', 'giantrun', 'run', 'running', 'sprint', 'attack', 'bite'])
            const walkClip = findClip(['walk', 'walking', 'idle_walk', 'walkcycle', 'idle'])
            const deathClip = findClip(['death', 'die', 'dying', 'dead'])

            // Filtrar clips que no sean static pose o T-pose
            const validClips = clips.filter(c => {
                const name = c.name.toLowerCase()
                return !name.includes('static') && !name.includes('t-pose') && !name.includes('tpose') && !name.includes('bind')
            })

            // Configurar animación de movimiento (priorizar run, luego walk, luego cualquier válida)
            let moveClip = runClip || walkClip
            if (!moveClip && validClips.length > 0) {
                // Si no encontramos run/walk, usar la primera animación válida que no sea death
                moveClip = validClips.find(c => !c.name.toLowerCase().includes('death'))
            }

            if (moveClip) {
                const moveAction = this.mixer.clipAction(moveClip)
                moveAction.setLoop(THREE.LoopRepeat)
                moveAction.clampWhenFinished = false
                moveAction.enabled = true
                // Activar con peso 1 inmediatamente para que se vea desde el inicio
                try { moveAction.setEffectiveWeight(1) } catch { moveAction.weight = 1 }
                moveAction.play()
                this.actions.walk = moveAction
                this.currentAction = moveAction // Establecer como acción actual
                if (debug) console.log(`[Enemy] ✅ Usando animación: "${moveClip.name}" para movimiento`)
            } else {
                console.warn('[Enemy] ⚠️ No se encontró animación de movimiento válida')
            }

            // Configurar animación de death
            if (deathClip) {
                const deathAction = this.mixer.clipAction(deathClip)
                deathAction.setLoop(THREE.LoopOnce)
                deathAction.clampWhenFinished = true
                deathAction.enabled = false
                this.actions.death = deathAction
                if (debug) console.log(`[Enemy] ✅ Animación death cargada: "${deathClip.name}"`)
            }

            if (debug) console.log('[Enemy] 📋 Clips disponibles:', clips.map(c => c.name).join(', '))
        }

        // Física
        const enemyMaterial = new CANNON.Material('enemyMaterial')
        enemyMaterial.friction = 0.0
        const shape = new CANNON.Sphere(0.5)
        this.body = new CANNON.Body({
            mass: 5,
            shape,
            material: enemyMaterial,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0.01
        })

        if (!this.physicsWorld) console.warn('[Enemy] physicsWorld no disponible, enemigo será visual solo.')
        else this.physicsWorld.addBody(this.body)

        this.body.sleepSpeedLimit = 0.0
        this.body.wakeUp()
        this.model.userData.physicsBody = this.body

        // Colisión con jugador
        this._onCollide = (event) => {
            if (event.body === this.playerRef?.body) {
                if (typeof this.playerRef.die === 'function') this.playerRef.die()
                this.proximitySound?.stop()
                if (this.container.parent) {
                    new FinalPrizeParticles({
                        scene: this.scene,
                        targetPosition: this.body.position,
                        sourcePosition: this.body.position,
                        experience: this.experience
                    })
                    this.destroy()
                }
            }
        }
        if (this.body?.addEventListener) this.body.addEventListener('collide', this._onCollide)

        // Movimiento
        this.turnSpeed = 6.0
        this.moveThreshold = 0.5
        this.isDying = false // Estado para controlar la animación de muerte

        if (debug) console.log('[Enemy] Inicializado OK. Pos:', position)
    }

    playDeath() {
        if (this.isDying || !this.actions.death) return
        this.isDying = true
        
        // Detener movimiento
        if (this.body) {
            this.body.velocity.set(0, 0, 0)
            this.body.angularVelocity.set(0, 0, 0)
        }
        
        // Reproducir animación de muerte
        if (this.currentAction) {
            this.currentAction.fadeOut(0.3)
        }
        
        const deathAction = this.actions.death
        deathAction.enabled = true
        deathAction.reset()
        deathAction.setLoop(THREE.LoopOnce)
        deathAction.clampWhenFinished = true
        try { deathAction.setEffectiveWeight(1) } catch { deathAction.weight = 1 }
        deathAction.fadeIn(0.3)
        deathAction.play()
        this.currentAction = deathAction
        
        if (this.debug) console.log('[Enemy] Reproduciendo animación de muerte')
        
        // Detener sonido de proximidad
        this.proximitySound?.stop()
    }

    _setAction(actionName, { fade = 0.18 } = {}) {
        if (!this.mixer || !this.actions[actionName]) return
        const newAction = this.actions[actionName]
        const oldAction = this.currentAction
        if (oldAction === newAction) {
            try { newAction.setEffectiveWeight(1) } catch { newAction.weight = 1 }
            return
        }
        newAction.enabled = true
        newAction.reset()
        try { newAction.setEffectiveWeight(1) } catch { newAction.weight = 1 }
        newAction.fadeIn(fade)
        newAction.play()
        if (oldAction) oldAction.fadeOut(fade)
        this.currentAction = newAction
    }

    update(delta) {
        if (!this.body || !this.playerRef?.body) return

        // Actualizar animación
        this.mixer?.update(delta)
        
        // Si está muriendo, solo actualizar animación y salir
        if (this.isDying) {
            this.container.position.copy(this.body.position)
            this.model.position.set(0, 0, 0)
            return
        }

        const targetPos = this.playerRef.body.position
        const enemyPos = this.body.position

        const dx = targetPos.x - enemyPos.x
        const dz = targetPos.z - enemyPos.z
        const dist2D = Math.hypot(dx, dz)

        this.speed = dist2D < 4 ? 4.0 : this.baseSpeed // Velocidad de sprint aumentada

        const maxDistance = 10
        const clampedDistance = Math.min(dist2D, maxDistance)
        const proximityVolume = 1 - (clampedDistance / maxDistance)
        this.proximitySound?.setVolume(proximityVolume * 0.8)

        if (dist2D > this.moveThreshold) {
            const nx = dx / dist2D
            const nz = dz / dist2D
            this.body.velocity.x = nx * this.speed
            this.body.velocity.z = nz * this.speed

            this.actions.walk && this._setAction('walk', { fade: 0.12 })

            // Rotación del contenedor hacia el jugador
            const targetAngle = Math.atan2(nx, nz)
            const qTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetAngle, 0))
            this.container.quaternion.slerp(qTarget, Math.min(1, this.turnSpeed * delta))
        } else {
            this.body.velocity.x = 0
            this.body.velocity.z = 0
            if (this.actions.walk && this.currentAction === this.actions.walk) {
                try { this.actions.walk.fadeOut(0.12) } catch {}
                this.currentAction = null
            }
        }

        // -------------------------------
        // Forzar in-place animation usando contenedor
        // -------------------------------
        this.container.position.copy(this.body.position)
        this.model.position.set(0, 0, 0) // eliminar root motion
    }

    destroy() {
        if (this.container) this.scene.remove(this.container)
        this.proximitySound?.stop()
        if (this.body) {
            try { this.body.removeEventListener('collide', this._onCollide) } catch {}
            this.physicsWorld?.removeBody?.(this.body)
            this.body = null
        }
        if (this.mixer) {
            try { this.mixer.stopAllAction() } catch {}
            this.mixer = null
        }
    }
}
