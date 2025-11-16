import * as THREE from 'three'

export default class Fox {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug

        // Propiedades de IA
        this.target = null 
        this.walkSpeed = 1.5   
        this.runSpeed = 3.5    
        this.stopDistance = 2.5  
        this.runDistance = 6.0   
        
        // NUEVO: Propiedades de Teletransporte
        this.teleportDistance = 40.0 // Distancia máxima antes de teleport
        this.stuckTimer = 0.0        // Contador de tiempo atascado
        this.stuckCheckTime = 3.0    // Segundos atascado para teleport
        this.lastCheckPosition = new THREE.Vector3() // Posición en el último chequeo
        this.stuckMoveThreshold = 0.5 // Mínimo movimiento para no estar "atascado"

        // Debug
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('fox')
            
            this.debugFolder.add(this, 'walkSpeed', 0, 5, 0.1).name('Walk Speed')
            this.debugFolder.add(this, 'runSpeed', 0, 10, 0.1).name('Run Speed')
            this.debugFolder.add(this, 'stopDistance', 0, 10, 0.1).name('Stop Distance')
            this.debugFolder.add(this, 'runDistance', 0, 10, 0.1).name('Run Distance')
            // NUEVO: Debug de Teleport
            this.debugFolder.add(this, 'teleportDistance', 10, 50, 1).name('Teleport Distance')
            this.debugFolder.add(this, 'stuckCheckTime', 1, 10, 0.5).name('Stuck Time (s)')
        }

        // Resource
        this.resource = this.resources.items.foxModel

        this.setModel()
        this.setAnimation()

        if (this.experience.world && this.experience.world.robot) {
            this.setTarget(this.experience.world.robot)
        }
    }

    setTarget(robotInstance) {
        if (robotInstance && robotInstance.group) {
            this.target = robotInstance.group 
            console.log('Fox: Objetivo establecido -> Robot');
            // NUEVO: Iniciar la posición de chequeo
            this.lastCheckPosition.copy(this.model.position)
        } else {
            console.warn('Fox: No se pudo establecer el objetivo. Instancia de robot inválida.');
        }
    }

    setModel() {
        this.model = this.resource.scene
        this.model.scale.set(0.02, 0.02, 0.02)
        this.model.position.set(3, 0, 3) 
        this.scene.add(this.model)
        
        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true
            }
        })
    }
    
    setAnimation() {
        this.animation = {}
        this.animation.mixer = new THREE.AnimationMixer(this.model)
        this.animation.actions = {}

        this.animation.actions.idle = this.animation.mixer.clipAction(this.resource.animations[0])
        this.animation.actions.walking = this.animation.mixer.clipAction(this.resource.animations[1])
        this.animation.actions.running = this.animation.mixer.clipAction(this.resource.animations[2])

        this.animation.actions.current = this.animation.actions.idle
        this.animation.actions.current.play()

        this.animation.play = (name) => {
            const newAction = this.animation.actions[name]
            const oldAction = this.animation.actions.current

            if (newAction === oldAction) {
                return
            }

            newAction.reset()
            newAction.play()
            newAction.crossFadeFrom(oldAction, 0.5) 

            this.animation.actions.current = newAction
        }

        // Debug
        if (this.debug.active) {
            const debugObject = {
                playIdle: () => { this.animation.play('idle') },
                playWalking: () => { this.animation.play('walking') },
                playRunning: () => { this.animation.play('running') }
            }
            this.debugFolder.add(debugObject, 'playIdle')
            this.debugFolder.add(debugObject, 'playWalking')
            this.debugFolder.add(debugObject, 'playRunning')
        }
    }

    // NUEVO: Método para teletransportar al zorro cerca del objetivo
    teleportToTarget() {
        if (!this.target) return;

        // 1. Calcular un vector "detrás" del robot
        // Usamos una distancia segura (stopDistance + 1)
        const spawnRadius = this.stopDistance + 1.0; 
        const behindVector = new THREE.Vector3(0, 0, -1); // Vector "hacia atrás" local
        
        // Aplicar la rotación del robot (target) a ese vector
        behindVector.applyQuaternion(this.target.quaternion);
        
        // Multiplicar por la distancia deseada
        behindVector.multiplyScalar(spawnRadius);

        // 2. Definir la nueva posición
        const targetPos = this.target.position;
        const newPosX = targetPos.x + behindVector.x;
        const newPosZ = targetPos.z + behindVector.z;
        // Mantenemos la 'y' actual del zorro (asumimos que está en el suelo y=0)
        // Si tu suelo no es y=0, tendrás que cambiar esto.
        const newPosY = this.model.position.y; 

        // 3. Ejecutar el teletransporte
        this.model.position.set(newPosX, newPosY, newPosZ);
        console.log(`Fox: Teletransportado a ${newPosX.toFixed(2)}, ${newPosY}, ${newPosZ.toFixed(2)}`);

        // 4. Forzar al zorro a mirar al robot inmediatamente
        this.model.lookAt(targetPos.x, newPosY, targetPos.z);
        
        // 5. Forzar la animación a 'idle' para que re-evalúe
        this.animation.play('idle');

        // 6. Resetear los contadores de "atascado"
        this.stuckTimer = 0;
        this.lastCheckPosition.copy(this.model.position);
    }

    // Lógica principal de seguimiento (IA)
    followTarget() {
        // 1. Verificar si el objetivo (target) existe
        if (!this.target) {
            if (this.experience.world && this.experience.world.robot) {
                this.setTarget(this.experience.world.robot);
            }
            if (!this.target) {
                this.animation.play('idle');
                return;
            }
        }

        // 2. Calcular la distancia y la dirección hacia el objetivo
        const targetPosition = this.target.position;
        const foxPosition = this.model.position;

        const direction = new THREE.Vector3().subVectors(targetPosition, foxPosition);
        direction.y = 0; // Ignoramos la altura (eje Y)
        const distance = direction.length();

        // NUEVO: Chequeo de "muy lejos"
        // Si está más lejos que la distancia de teleport, ejecutar y salir.
        if (distance > this.teleportDistance) {
            console.log('Fox: Demasiado lejos. Preparando teletransporte...');
            this.teleportToTarget();
            return; // Salimos de la función. La lógica se re-evaluará en el sig. frame
        }

        // 3. Decidir qué hacer (moverse o parar)
        if (distance > this.stopDistance) {
            // --- MOVERSE ---
            this.model.lookAt(targetPosition.x, foxPosition.y, targetPosition.z);

            let currentSpeed;
            if (distance > this.runDistance) {
                currentSpeed = this.runSpeed;
                this.animation.play('running');
            } else {
                currentSpeed = this.walkSpeed;
                this.animation.play('walking');
            }

            direction.normalize();
            const moveAmount = currentSpeed * (this.time.delta * 0.001); 
            
            this.model.position.x += direction.x * moveAmount;
            this.model.position.z += direction.z * moveAmount;

        } else {
            // --- PARAR ---
            this.animation.play('idle');
            this.model.lookAt(targetPosition.x, foxPosition.y, targetPosition.z);
        }
    }

    // NUEVO: Lógica para detectar si está atascado
    checkIfStuck(deltaTime) {
        // Solo chequear si tenemos un objetivo
        if (!this.target) return;

        const currentAction = this.animation.actions.current;
        const isTryingToMove = (
            currentAction === this.animation.actions.walking || 
            currentAction === this.animation.actions.running
        );

        if (isTryingToMove) {
            // Si intenta moverse, sumar al contador
            this.stuckTimer += deltaTime;

            // Si el contador supera el umbral de chequeo
            if (this.stuckTimer >= this.stuckCheckTime) {
                // Calcular cuánto se ha movido desde el último chequeo
                const distanceMoved = this.model.position.distanceTo(this.lastCheckPosition);

                if (distanceMoved < this.stuckMoveThreshold) {
                    // ¡Atascado! Se movió muy poco en X segundos
                    console.log(`Fox: ¡Atascado! (Movido: ${distanceMoved.toFixed(2)}m en ${this.stuckCheckTime}s). Teletransportando...`);
                    this.teleportToTarget();
                }

                // Resetear el contador y la posición de chequeo
                this.stuckTimer = 0;
                this.lastCheckPosition.copy(this.model.position);
            }
        } else {
            // Si no se está moviendo (ej: 'idle'), resetear todo
            this.stuckTimer = 0;
            this.lastCheckPosition.copy(this.model.position);
        }
    }


    update() {
        // Delta time en segundos
        const deltaTime = this.time.delta * 0.001;
        
        // Actualizar el mixer de animación
        this.animation.mixer.update(deltaTime);

        // Llamar a la lógica de seguimiento (Moverse, Parar, "Muy Lejos")
        this.followTarget();
        
        // NUEVO: Llamar a la lógica de "atascado"
        this.checkIfStuck(deltaTime);
    }
}