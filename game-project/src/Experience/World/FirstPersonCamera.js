import * as THREE from 'three'

export default class FirstPersonCamera {
    constructor(experience, targetObject) {
        this.experience = experience
        this.scene = experience.scene
        this.camera = experience.camera.instance
        this.target = targetObject // normalmente: robot.group
        this.offset = new THREE.Vector3(0, 6.5, 0) // altura de los ojos
    }

    update() {
        if (!this.target) return

        // Posición real del robot
        const basePosition = this.target.position.clone()

        // Punto de cámara (ligeramente adelantado)
        const direction = new THREE.Vector3(0, 0, -3)
        direction.applyEuler(this.target.rotation).normalize()

        const cameraPosition = basePosition
            .clone()
            .add(this.offset)
            .add(direction.clone().multiplyScalar(0.2)) // un poco hacia adelante

        // Evitar que la cámara atraviese objetos: raycast desde la "cabeza" hacia la posición deseada
        try {
            const head = basePosition.clone().add(new THREE.Vector3(0, 1.5 * this.zoomLevel, 0))
            const desired = cameraPosition.clone()
            const rayDir = desired.clone().sub(head).normalize()
            const maxDist = desired.distanceTo(head)

            const raycaster = new THREE.Raycaster(head, rayDir, 0.05, maxDist)
            // Intersectar con todos los objetos de la escena
            const intersects = raycaster.intersectObjects(this.scene.children, true)

            // Filtrar intersecciones que sean parte del propio robot (target)
            const valid = intersects.filter(i => {
                let obj = i.object
                // Subir por la jerarquía para comprobar si está dentro del target
                while (obj) {
                    if (obj === this.target) return false
                    obj = obj.parent
                }
                return true
            })

            let finalPos = desired
            if (valid.length > 0) {
                // Tomar la colisión más cercana
                const hit = valid[0]
                // Poner la cámara un poco antes del punto de impacto (offset hacia atrás)
                const backOff = rayDir.clone().multiplyScalar(-0.18)
                finalPos = hit.point.clone().add(backOff)
            }

            // Posicionar la cámara con lerp; lerp más lento en nivel 1
            const currentLevel = this.experience.world?.levelManager?.currentLevel || 0
            const lerpSpeed = (currentLevel === 1) ? 0.12 : 0.3
            this.camera.position.lerp(finalPos, lerpSpeed)
        } catch (e) {
            // Fallback seguro si algo falla (no bloquear)
            const currentLevel = this.experience.world?.levelManager?.currentLevel || 0
            const lerpSpeed = (currentLevel === 1) ? 0.12 : 0.3
            this.camera.position.lerp(cameraPosition, lerpSpeed)
        }

        // Mirar hacia adelante en la misma dirección que el robot
        const lookAt = basePosition.clone().add(direction)
        this.camera.lookAt(lookAt)
    }
}
