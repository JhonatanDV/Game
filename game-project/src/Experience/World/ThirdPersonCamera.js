import * as THREE from 'three'
import isMobileDevice from '../Utils/Device.js'

export default class ThirdPersonCamera {
    constructor(experience, target) {
        this.experience = experience
        this.camera = experience.camera.instance
        this.target = target

        const isMobile = isMobileDevice()

        // 📏 Distancia base más lejana
        this.baseOffset = isMobile
            ? new THREE.Vector3(0, 5.5, -12)  // móvil: más alto y lejos
            : new THREE.Vector3(0, 4.5, -10)  // PC: más alto y lejos

        this.offset = this.baseOffset.clone()

        // Altura base fija
        this.fixedY = isMobile ? 5.5 : 4.5

        // 🔍 Configuración del ZOOM
        this.zoomLevel = 1.0   // nivel actual
        this.minZoom = 0.6     // más cerca del robot
        this.maxZoom = 2.8     // mucho más lejos
        this.zoomSpeed = 0.25  // sensibilidad (sube si quieres más rápido)

        // Escuchar scroll del mouse
        window.addEventListener('wheel', (event) => this.onZoom(event))
    }

    onZoom(event) {
        // Cambiar el nivel de zoom según el scroll
        this.zoomLevel += event.deltaY * 0.001 * this.zoomSpeed

        // Limitar rango
        this.zoomLevel = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoomLevel))

        // Aplicar zoom escalando offset (más zoom = más lejos)
        this.offset.z = this.baseOffset.z * this.zoomLevel
        this.offset.y = this.baseOffset.y * (0.9 * this.zoomLevel)
    }

    update() {
        if (!this.target) return

        const basePosition = this.target.position.clone()

        // Dirección del robot
        const direction = new THREE.Vector3(0, 0, 1).applyEuler(this.target.rotation).normalize()

        // Posición de la cámara basada en zoom
        const cameraPosition = new THREE.Vector3(
            basePosition.x + direction.x * this.offset.z,
            this.fixedY * this.zoomLevel,
            basePosition.z + direction.z * this.offset.z
        )

        // Evitar que la cámara atraviese objetos: raycast desde la 'cabeza' del robot hacia la posición deseada
        try {
            const head = basePosition.clone().add(new THREE.Vector3(0, 1.5 * this.zoomLevel, 0))
            const desired = cameraPosition.clone()
            const rayDir = desired.clone().sub(head).normalize()
            const maxDist = desired.distanceTo(head)

            const raycaster = new THREE.Raycaster(head, rayDir, 0.05, maxDist)
            const intersects = raycaster.intersectObjects(this.experience.scene.children, true)

            const valid = intersects.filter(i => {
                let obj = i.object
                while (obj) {
                    if (obj === this.target) return false
                    obj = obj.parent
                }
                return true
            })

            let finalPos = desired
            if (valid.length > 0) {
                const hit = valid[0]
                const backOff = rayDir.clone().multiplyScalar(-0.18)
                finalPos = hit.point.clone().add(backOff)
            }

            // Suavizar el movimiento; hacer más lento en Nivel 1 para un seguimiento más suave
            const currentLevel = this.experience.world?.levelManager?.currentLevel || 0
            const lerpSpeed = (currentLevel === 1) ? 0.08 : 0.15
            this.camera.position.lerp(finalPos, lerpSpeed)

            // Enfocar al centro del robot
            const lookAt = basePosition.clone().add(new THREE.Vector3(0, 1.5 * this.zoomLevel, 0))
            this.camera.lookAt(lookAt)
        } catch (e) {
            // Fallback seguro
            this.camera.position.lerp(cameraPosition, 0.15)
            const lookAt = basePosition.clone().add(new THREE.Vector3(0, 1.5 * this.zoomLevel, 0))
            this.camera.lookAt(lookAt)
        }
    }
}
