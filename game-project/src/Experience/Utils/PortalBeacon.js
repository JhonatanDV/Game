// PortalBeacon.js - Haz de luz vertical para indicar la posición del portal
import * as THREE from 'three'

export default class PortalBeacon {
    constructor({ scene, position, experience, color = 0x00ffff }) {
        this.scene = scene
        this.experience = experience
        this.position = position.clone()
        this.color = color
        
        this.createBeacon()
        this.createRings()
        this.createGlow()
        
        // Animación
        this.time = 0
        this.experience.time.on('tick', this.update)
        
        // Auto-destruir después de que el portal sea recogido
        this.isActive = true
    }

    createBeacon() {
        // Haz de luz vertical (cilindro hueco brillante)
        const beaconHeight = 50 // Altura del haz
        const beaconRadius = 0.8
        
        const beaconGeometry = new THREE.CylinderGeometry(
            beaconRadius, 
            beaconRadius * 0.3, // más angosto en la parte superior
            beaconHeight, 
            32, 
            1, 
            true // abierto en los extremos
        )
        
        const beaconMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
        
        this.beacon = new THREE.Mesh(beaconGeometry, beaconMaterial)
        this.beacon.position.copy(this.position)
        this.beacon.position.y += beaconHeight / 2
        this.scene.add(this.beacon)
        
        // Luz puntual en la base
        this.light = new THREE.PointLight(this.color, 2, 30)
        this.light.position.copy(this.position)
        this.light.position.y += 1
        this.scene.add(this.light)
        
        // Luz direccional hacia arriba (más sutil)
        const topLight = new THREE.SpotLight(this.color, 1.5, 50, Math.PI / 6, 0.5, 2)
        topLight.position.copy(this.position)
        topLight.position.y += 0.5
        topLight.target.position.set(this.position.x, this.position.y + 50, this.position.z)
        this.scene.add(topLight)
        this.scene.add(topLight.target)
        this.topLight = topLight
    }

    createRings() {
        // Anillos expansivos en el suelo
        this.rings = []
        const ringCount = 3
        
        for (let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 32)
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: this.color,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial)
            ring.rotation.x = -Math.PI / 2
            ring.position.copy(this.position)
            ring.position.y += 0.1
            ring.userData.delay = i * 0.7 // desfase temporal
            ring.userData.scale = 1
            
            this.scene.add(ring)
            this.rings.push(ring)
        }
    }

    createGlow() {
        // Esfera brillante en la base
        const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
        
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial)
        this.glow.position.copy(this.position)
        this.glow.position.y += 1
        this.scene.add(this.glow)
    }

    update = () => {
        if (!this.isActive) return
        
        const delta = this.experience.time.delta * 0.001 // convertir a segundos
        this.time += delta
        
        // Animar el haz de luz (pulsación)
        if (this.beacon) {
            const pulse = Math.sin(this.time * 2) * 0.15 + 0.85
            this.beacon.material.opacity = 0.4 * pulse
            this.beacon.rotation.y += delta * 0.5
        }
        
        // Animar la luz
        if (this.light) {
            const lightPulse = Math.sin(this.time * 3) * 0.5 + 1.5
            this.light.intensity = 2 * lightPulse
        }
        
        // Animar anillos expansivos
        this.rings.forEach((ring, i) => {
            const phase = (this.time + ring.userData.delay) % 2
            const scale = 1 + phase * 3
            ring.scale.set(scale, scale, 1)
            ring.material.opacity = Math.max(0, 0.6 - phase * 0.3)
        })
        
        // Animar resplandor
        if (this.glow) {
            const glowPulse = Math.sin(this.time * 2.5) * 0.3 + 1
            this.glow.scale.set(glowPulse, glowPulse, glowPulse)
            this.glow.material.opacity = 0.2 * (Math.sin(this.time * 2) * 0.5 + 0.5)
        }
    }

    dispose() {
        this.isActive = false
        this.experience.time.off('tick', this.update)
        
        // Limpiar haz
        if (this.beacon) {
            this.scene.remove(this.beacon)
            this.beacon.geometry.dispose()
            this.beacon.material.dispose()
        }
        
        // Limpiar luces
        if (this.light) this.scene.remove(this.light)
        if (this.topLight) {
            this.scene.remove(this.topLight)
            this.scene.remove(this.topLight.target)
        }
        
        // Limpiar anillos
        this.rings.forEach(ring => {
            this.scene.remove(ring)
            ring.geometry.dispose()
            ring.material.dispose()
        })
        
        // Limpiar resplandor
        if (this.glow) {
            this.scene.remove(this.glow)
            this.glow.geometry.dispose()
            this.glow.material.dispose()
        }
    }
}
