// Robot.js
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Sound from './Sound.js'

export default class Robot {
    constructor(experience, spawnPos) {
        this.experience = experience
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.physics = this.experience.physics
        this.keyboard = this.experience.keyboard
        this.debug = this.experience.debug || false
        this.points = 0

    // Estado de sprint (true mientras Shift esté pulsado)
    this._sprinting = false

        // Configurables
        this.bodyRadius = 0.4
        this.groundCheckMargin = 0.12

        this.visualGroundOffset = 0
        this.spawnPos = spawnPos || { x: 0, y: this.bodyRadius + 0.2, z: 0 }
        this.sprintMultiplier = 1.6

        // Attack cooldown (segundos)
        this.attackCooldown = 0.5
        this._lastAttackAt = -Infinity

        // Para detectar borde de tecla (press edge)
        this._attackKeyPrev = false

        this.setModel()
        this.setSounds()
        this.setPhysics()
        this.setAnimation()
    }

    setModel() {
        this.model = this.resources.items.robotModel.scene
        if (!this.model) {
            console.error('Robot: no se encontró model en resources.items.robotModel.scene')
            return
        }

        this.model.scale.set(1.7, 1.7, 1.7)
        this.model.position.set(0, -0.1, 0)

        this.group = new THREE.Group()
        this.group.add(this.model)
        this.scene.add(this.group)

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true
            }
        })

        this.model.updateMatrixWorld(true)
        const bbox = new THREE.Box3().setFromObject(this.model)
        this.visualGroundOffset = Math.abs(bbox.min.y - this.group.position.y)
        if (this.debug) console.log('visualGroundOffset', this.visualGroundOffset)
    }

    setPhysics() {
        const shape = new CANNON.Sphere(this.bodyRadius)

        const startPos = new CANNON.Vec3(
            this.spawnPos.x,
            this.spawnPos.y,
            this.spawnPos.z
        )

        this.body = new CANNON.Body({
            mass: 2,
            shape: shape,
            position: startPos,
            linearDamping: 0.05,
            angularDamping: 0.9
        })

        this.body.angularFactor.set(0, 1, 0)
        this.body.velocity.setZero()
        this.body.angularVelocity.setZero()

        if (this.physics && this.physics.robotMaterial) {
            this.body.material = this.physics.robotMaterial
        }

        this.physics.world.addBody(this.body)

        setTimeout(() => {
            if (this.body) this.body.wakeUp()
        }, 100)

        this.group.position.x = this.body.position.x
        this.group.position.z = this.body.position.z
        this.group.position.y = this.body.position.y - this.bodyRadius + this.visualGroundOffset
    }

    setSounds() {
        this.walkSound = new Sound('/sounds/robot/walking.mp3', { loop: true, volume: 0.5 })
        this.jumpSound = new Sound('/sounds/robot/jump.mp3', { volume: 0.8 })
        // this.attackSound = new Sound('/sounds/robot/attack.mp3', { volume: 0.9 })
    }

    _getClipByNameOrIndex(name, fallbackIndex) {
        const clips = (this.resources.items.robotModel && this.resources.items.robotModel.animations) || []
        for (let i = 0; i < clips.length; i++) {
            if (clips[i].name && clips[i].name.toLowerCase() === name.toLowerCase()) {
                return clips[i]
            }
        }
        return clips[fallbackIndex] || null
    }

    setAnimation() {
        this.animation = {}
        // seguridad: si no hay modelo o animaciones, salimos
        if (!this.model) {
            console.error('Robot: no hay model para crear AnimationMixer')
            return
        }

        this.animation.mixer = new THREE.AnimationMixer(this.model)
        this.animation.actions = {}

        // prints de debug de los clips disponibles
        const clips = (this.resources.items.robotModel && this.resources.items.robotModel.animations) || []
        if (this.debug) console.log('Robot: clips disponibles ->', clips.map(c => ({ name: c.name, duration: c.duration })))

        const walkClip = this._getClipByNameOrIndex('Armature.558|[toko_10] walk_1', 4)
        const idleClip = this._getClipByNameOrIndex('Armature.558|[toko_10] idle', 2)
        const runClip  = this._getClipByNameOrIndex('Armature.558|[toko_10] run_1', 5)
        const jumpClip = this._getClipByNameOrIndex('Armature.558|[toko_10] run_1', 3)
        const deathClip = this._getClipByNameOrIndex('Death', 1)
        const danceClip = this._getClipByNameOrIndex('Dance', 0)
        const attackClip = this._getClipByNameOrIndex('Combat_Attack_1', null)

        if (danceClip) this.animation.actions.dance = this.animation.mixer.clipAction(danceClip)
        if (deathClip) this.animation.actions.death = this.animation.mixer.clipAction(deathClip)
        if (idleClip) this.animation.actions.idle = this.animation.mixer.clipAction(idleClip)
        if (jumpClip) this.animation.actions.jump = this.animation.mixer.clipAction(jumpClip)
        if (walkClip) this.animation.actions.walking = this.animation.mixer.clipAction(walkClip)
        if (runClip) this.animation.actions.run = this.animation.mixer.clipAction(runClip)
        if (attackClip) this.animation.actions.attack = this.animation.mixer.clipAction(attackClip)

        // Asegurarnos que la animación de 'run' esté en loop (no termine sola) y que dure un poco más
        if (this.animation.actions.run) {
            try {
                // Forzamos loop repetido para que el mixer no dispare 'finished' sobre run
                // y pedimos muchas repeticiones (segunda arg) por si la implementación lo usa
                this.animation.actions.run.setLoop(THREE.LoopRepeat, Infinity)
            } catch (e) {
                // fallback si la API no acepta repetitions
                try { this.animation.actions.run.setLoop(THREE.LoopRepeat) } catch (err) { this.animation.actions.run.loop = THREE.LoopRepeat }
            }
            this.animation.actions.run.clampWhenFinished = false
            this.animation.actions.run.enabled = true
            // Reducir la velocidad de reproducción para que cada ciclo dure más (0.6-0.8 es razonable)
            try { this.animation.actions.run.setEffectiveTimeScale(0.7) } catch (e) { this.animation.actions.run.timeScale = 0.7 }
        }

        // Configuraciones seguras por cada action (no reset global)
        for (const name in this.animation.actions) {
            const act = this.animation.actions[name]
            act.enabled = true
            // iniciar con peso 0 salvo idle que pondremos explícitamente a 1
            try { act.setEffectiveWeight(0) } catch (e) { act.weight = 0 }
            try { act.setEffectiveTimeScale(1) } catch (e) { act.timeScale = 1 }
            act.clampWhenFinished = false
            act.loop = act.loop || THREE.LoopRepeat
        }

        // Iniciar idle o fallback (con peso 1) - esto evita quedarnos en T
        if (this.animation.actions.idle) {
            const idleAction = this.animation.actions.idle
            idleAction.setLoop(THREE.LoopRepeat)
            // NO llamar reset() a todas; reset solo en el action que vamos a reproducir directamente
            idleAction.reset()
            try { idleAction.setEffectiveWeight(1) } catch (e) { idleAction.weight = 1 }
            idleAction.play()
            this.animation.actions.current = idleAction
            if (this.debug) console.log('Robot: idle iniciado')
        } else if (this.animation.actions.walking) {
            const w = this.animation.actions.walking
            w.reset()
            try { w.setEffectiveWeight(1) } catch (e) { w.weight = 1 }
            w.play()
            this.animation.actions.current = w
            if (this.debug) console.log('Robot: fallback walking iniciado')
        } else {
            this.animation.actions.current = null
            if (this.debug) console.warn('Robot: no se encontró idle ni walking; puede mostrarse pose T si no hay action activa')
        }

        // Config especiales para jump / attack
        if (this.animation.actions.jump) {
            const a = this.animation.actions.jump
            a.setLoop(THREE.LoopOnce)
            a.clampWhenFinished = false
            a.enabled = true
        }

        if (this.animation.actions.attack) {
            const atk = this.animation.actions.attack
            atk.setLoop(THREE.LoopOnce)
            atk.clampWhenFinished = false
            atk.enabled = true
            // set timeScale si quieres ralentizar:
            try { atk.setEffectiveTimeScale(0.6) } catch (e) { atk.timeScale = 0.17 }
        }

        // Método para reproducir animaciones con fadeIn / fadeOut (patrón fiable)
        this.animation.play = (name, { fade = 0.25 } = {}) => {
            const newAction = this.animation.actions[name]
            const oldAction = this.animation.actions.current

            if (!newAction) {
                if (this.debug) console.warn('Robot.play: action no encontrada ->', name)
                return
            }

            if (oldAction === newAction) {
                // ya está reproduciéndose
                return
            }

            // Preparar newAction: resetear para que empiece desde 0 (pero cuidadoso con T)
            try {
                newAction.reset()
            } catch (e) {}

            newAction.enabled = true
            try { newAction.setEffectiveWeight(1) } catch (e) { newAction.weight = 1 }

            // Si no hay oldAction, simplemente fadeIn y play
            if (!oldAction) {
                try { newAction.fadeIn(fade) } catch (e) {}
                newAction.play()
                this.animation.actions.current = newAction
                if (this.debug) console.log('Robot.play -> started', name)
                return
            }

            // Si hay oldAction, hacemos fadeOut/fadeIn (evitamos reset global que provoca snap)
            try {
                oldAction.fadeOut(fade)
            } catch (e) {}
            try {
                newAction.fadeIn(fade)
                newAction.play()
            } catch (e) {
                try { newAction.play() } catch (err) {}
            }

            this.animation.actions.current = newAction
            if (this.debug) console.log('Robot.play -> crossfade', oldAction._clip?.name || 'old', '->', name)
        }

        // Listener del mixer para cuando termina una acción (más fiable que onFinished en cada action)
        this.animation.mixer.addEventListener('finished', (event) => {
            const finishedAction = event.action
            if (this.debug) {
                console.log('Robot.mixer finished:', finishedAction._clip ? finishedAction._clip.name : finishedAction)
            }

            // Si terminó 'run' pero la tecla de sprint sigue pulsada -> reiniciamos run
            if (finishedAction === this.animation.actions.run) {
                try {
                    const keys = this.keyboard.getState()
                    const sprintNow = !!(
                        keys.shift || keys.shiftLeft || keys.shiftRight || keys.shiftKey || keys.Shift
                    )
                    if (sprintNow || this._sprinting) {
                        // Reiniciamos la acción de run inmediatamente para evitar fallbacks a idle/walk
                        try { finishedAction.reset() } catch (e) {}
                        try { finishedAction.play() } catch (e) {}
                        return
                    }
                } catch (e) {
                    // Si falla la comprobación, dejamos que el resto del handler actúe
                }
            }

            // Si terminó ataque -> volver a idle/walking
            if (finishedAction === this.animation.actions.attack) {
                try { finishedAction.stop() } catch (e) {}
                if (this.isGrounded() && this.animation.actions.idle) {
                    this.animation.play('idle', { fade: 0.12 })
                } else if (this.animation.actions.walking) {
                    this.animation.play('walking', { fade: 0.12 })
                }
            }

            // Si terminó salto -> volver a idle/walking
            if (finishedAction === this.animation.actions.jump) {
                try { finishedAction.stop() } catch (e) {}
                if (this.isGrounded() && this.animation.actions.idle) {
                    this.animation.play('idle', { fade: 0.12 })
                } else if (this.animation.actions.walking) {
                    this.animation.play('walking', { fade: 0.12 })
                }
            }
        })
    }

    isGrounded() {
        try {
            const checkDistance = this.bodyRadius + this.groundCheckMargin
            const from = new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
            const to = new CANNON.Vec3(this.body.position.x, this.body.position.y - checkDistance, this.body.position.z)

            if (typeof CANNON.Ray === 'function') {
                const ray = new CANNON.Ray(from, to)
                const result = new CANNON.RaycastResult()
                ray.intersectWorld(this.physics.world, { collisionFilterMask: -1, skipBackfaces: true }, result)
                if (result.hasHit) {
                    const hitDist = result.distance || (this.body.position.y - result.hitPointWorld.y)
                    return hitDist <= checkDistance + 0.01
                }
            }

            const bottomY = this.body.position.y - this.bodyRadius
            return bottomY <= 0.05 + this.groundCheckMargin
        } catch (err) {
            const bottomY = this.body.position.y - this.bodyRadius
            return bottomY <= 0.05 + this.groundCheckMargin
        }
    }

    update() {
        if (!this.body) return
        if (!this.animation || !this.animation.mixer) return
        if (this.animation.actions.current === this.animation.actions.death) return

        const delta = this.time.delta * 0.001
        this.animation.mixer.update(delta)

        const keys = this.keyboard.getState()
        const baseMoveForce = 300
    // Reducir la velocidad de giro si estamos en el Nivel 1 (solo afecta giros)
    const currentLevel = this.experience.world?.levelManager?.currentLevel || 0
    const turnSpeed = (currentLevel === 1) ? 3.0 : 5.5
        let isMoving = false

        const sprintPressed = !!(
            keys.shift ||
            keys.shiftLeft ||
            keys.shiftRight ||
            keys.shiftKey ||
            keys.Shift
        )

        // Actualizamos estado interno de sprint para poder usarlo fuera del scope local
        this._sprinting = sprintPressed

        const currentMultiplier = sprintPressed ? this.sprintMultiplier : 1.0

        const maxSpeed = 140 * currentMultiplier
        this.body.velocity.x = Math.max(Math.min(this.body.velocity.x, maxSpeed), -maxSpeed)
        this.body.velocity.z = Math.max(Math.min(this.body.velocity.z, maxSpeed), -maxSpeed)

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion)

        // Salto
        if (keys.space && this.isGrounded()) {
            this.body.applyImpulse(new CANNON.Vec3(forward.x * 0.5, 3, forward.z * 0.5), this.body.position)
            this.animation.play('jump')
        }

        if (this.body.position.y > 10) {
            console.warn(' Robot fuera del escenario. Reubicando...')
            this.respawnAt(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z)
        }

        // Movimiento adelante/atrás
        if (keys.up) {
            const f = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion)
            const appliedMoveForce = baseMoveForce * currentMultiplier
            this.body.applyForce(new CANNON.Vec3(f.x * appliedMoveForce, 0, f.z * appliedMoveForce), this.body.position)
            isMoving = true
        }
        if (keys.down) {
            const b = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion)
            const appliedMoveForce = baseMoveForce * currentMultiplier
            this.body.applyForce(new CANNON.Vec3(b.x * appliedMoveForce, 0, b.z * appliedMoveForce), this.body.position)
            isMoving = true
        }

        // Rotación
        if (keys.left) {
            this.group.rotation.y += turnSpeed * delta
            this.body.quaternion.setFromEuler(0, this.group.rotation.y, 0)
        }
        if (keys.right) {
            this.group.rotation.y -= turnSpeed * delta
            this.body.quaternion.setFromEuler(0, this.group.rotation.y, 0)
        }

        // Manejo de animaciones: si estamos en ataque, no forzamos transiciones
        const currentAction = this.animation.actions.current
        const attackAction = this.animation.actions.attack

        if (currentAction !== attackAction) {
            if (isMoving) {
                if (sprintPressed && this.animation.actions.run) {
                    if (this.animation.actions.current !== this.animation.actions.run) this.animation.play('run', { fade: 0.18 })
                } else {
                    if (this.animation.actions.current !== this.animation.actions.walking) this.animation.play('walking', { fade: 0.18 })
                }
            } else {
                if (this.isGrounded() && this.animation.actions.current !== this.animation.actions.idle) {
                    if (this.animation.actions.idle) {
                        this.animation.play('idle', { fade: 0.18 })
                    }
                }
            }
        }

        // Ataque (edge detect)
        const now = performance.now() / 1000
        if (keys.attack && !this._attackKeyPrev) {
            if (this.animation.actions.attack) {
                const cur = this.animation.actions.current
                if (cur !== this.animation.actions.attack && (now - this._lastAttackAt) >= this.attackCooldown) {
                    this._lastAttackAt = now
                    this.animation.play('attack', { fade: 0.12 })
                    // if (this.attackSound) this.attackSound.play()
                }
            }
        }
        this._attackKeyPrev = !!keys.attack

        // Sincronización física -> visual
        this.group.position.x = this.body.position.x
        this.group.position.z = this.body.position.z
        this.group.position.y = this.body.position.y - this.bodyRadius + this.visualGroundOffset
    }

    // Resto de métodos (moveInDirection, respawnAt, etc.) sin cambios
    moveInDirection(dir, speed) {
        if (!window.userInteracted || !this.experience.renderer.instance.xr.isPresenting) return

        const mobile = window.experience?.mobileControls
        if (mobile?.intensity > 0) {
            const dir2D = mobile.directionVector
            const dir3D = new THREE.Vector3(dir2D.x, 0, dir2D.y).normalize()
            const adjustedSpeed = 250 * mobile.intensity
            const force = new CANNON.Vec3(dir3D.x * adjustedSpeed, 0, dir3D.z * adjustedSpeed)
            this.body.applyForce(force, this.body.position)
            if (this.animation.actions.current !== this.animation.actions.walking) this.animation.play('walking')
            const angle = Math.atan2(dir3D.x, dir3D.z)
            this.group.rotation.y = angle
            this.body.quaternion.setFromEuler(0, this.group.rotation.y, 0)
        }
    }

    respawnAt(x, y, z, setRotationY = 0) {
        if (!this.body) {
            console.warn('respawnAt: body no existe. Ignorando.')
            return
        }

        this.body.position.set(x, y, z)
        this.body.velocity.set(0, 0, 0)
        this.body.angularVelocity.set(0, 0, 0)
        this.body.quaternion.setFromEuler(0, setRotationY, 0)
        this.body.wakeUp()

        this.group.position.x = this.body.position.x
        this.group.position.z = this.body.position.z
        this.group.position.y = this.body.position.y - this.bodyRadius + this.visualGroundOffset
        this.group.rotation.y = setRotationY
    }

    respawnRandom(area = { minX: -50, maxX: 50, minZ: -250, maxZ: 250, y: this.spawnPos.y }) {
        const x = Math.random() * (area.maxX - area.minX) + area.minX
        const z = Math.random() * (area.maxZ - area.minZ) + area.minZ
        const y = area.y
        this.respawnAt(x, y, z, Math.random() * Math.PI * 2)
    }

    isPositionFree(x, z, minDistance = 1.0) {
        if (!this.physics || !this.physics.world) return true
        for (const b of this.physics.world.bodies) {
            if (b === this.body) continue
            const dx = (b.position.x || 0) - x
            const dz = (b.position.z || 0) - z
            if ((dx * dx + dz * dz) < (minDistance * minDistance)) return false
        }
        return true
    }

    respawnRandomSafe(area = { minX: -50, maxX: 50, minZ: -250, maxZ: 250, y: this.spawnPos.y }, tries = 10) {
        for (let i = 0; i < tries; i++) {
            const x = Math.random() * (area.maxX - area.minX) + area.minX
            const z = Math.random() * (area.maxZ - area.minZ) + area.minZ
            if (this.isPositionFree(x, z, 1.5)) {
                this.respawnAt(x, area.y, z)
                return true
            }
        }
        this.respawnAt(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z)
        return false
    }

    die() {
        if (this.animation.actions.current !== this.animation.actions.death) {
            this.animation.actions.current.fadeOut(0.2)
            this.animation.actions.death.reset().fadeIn(0.2).play()
            this.animation.actions.current = this.animation.actions.death

            this.walkSound.stop()

            if (this.body && this.physics.world.bodies.includes(this.body)) {
                this.physics.world.removeBody(this.body)
            }
            this.body = null

            this.group.position.y -= 0.5
            this.group.rotation.x = -Math.PI / 2

            console.log(' Robot ha muerto')
        }
    }
}
