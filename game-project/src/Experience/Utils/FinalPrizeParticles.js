// FinalPrizeParticles.js (versión mejorada con más efectos)
import * as THREE from 'three'

export default class FinalPrizeParticles {
  constructor({ scene, targetPosition, sourcePosition, experience }) {
    this.scene = scene
    this.experience = experience
    this.clock = new THREE.Clock()

    this.count = 120 // Más partículas para un efecto más impresionante
    this.angles = new Float32Array(this.count)
    this.radii = new Float32Array(this.count)
    this.speeds = new Float32Array(this.count)
    this.positions = new Float32Array(this.count * 3)
    this.colors = new Float32Array(this.count * 3)

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 3
      const y = Math.random() * 3

      this.angles[i] = angle
      this.radii[i] = radius
      this.speeds[i] = 0.5 + Math.random() * 1.5 // velocidad variable

      this.positions[i3 + 0] = sourcePosition.x + Math.cos(angle) * radius
      this.positions[i3 + 1] = sourcePosition.y + y
      this.positions[i3 + 2] = sourcePosition.z + Math.sin(angle) * radius

      // Gradiente de colores: cyan a amarillo
      const colorMix = i / this.count
      this.colors[i3 + 0] = colorMix // R
      this.colors[i3 + 1] = 1 // G
      this.colors[i3 + 2] = 1 - colorMix // B
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.4,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // Efecto brillante
      vertexColors: true // Usar colores por vértice
    })

    this.points = new THREE.Points(this.geometry, material)
    this.scene.add(this.points)

    this.target = targetPosition.clone()
    this.experience.time.on('tick', this.update)

    // Eliminar luego de unos segundos
    setTimeout(() => this.dispose(), 10000)
  }

  update = () => {
    const delta = this.clock.getDelta()

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3

      this.angles[i] += this.speeds[i] * 2 * delta // velocidad angular variable
      this.radii[i] *= 0.97 // espiral más ajustada

      this.positions[i3 + 0] = this.target.x + Math.cos(this.angles[i]) * this.radii[i]
      this.positions[i3 + 2] = this.target.z + Math.sin(this.angles[i]) * this.radii[i]
      this.positions[i3 + 1] += 0.02 * this.speeds[i] // subir con velocidad variable
    }

    this.geometry.attributes.position.needsUpdate = true
    
    // Pulsar la opacidad del material
    const pulse = Math.sin(this.clock.getElapsedTime() * 3) * 0.3 + 0.7
    this.points.material.opacity = pulse
  }

  dispose() {
    this.experience.time.off('tick', this.update)
    this.scene.remove(this.points)
    this.geometry.dispose()
    this.points.material.dispose()
  }
}
