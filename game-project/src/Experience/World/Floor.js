import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export default class Floor {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.physics = this.experience.physics

        this.setGeometry()
        this.setTextures()
        this.setMaterial()
        this.setMesh()
        this.setPhysics()
    }

    setGeometry() {
        this.size = { width: 300, height: 3, depth: 500 }
        this.geometry = new THREE.BoxGeometry(
            this.size.width,
            this.size.height,
            this.size.depth
        )
    }

    setTextures() {
        const loader = new THREE.TextureLoader()
        this.textures = {}

        // Carga la textura desde public/textura/floor.jpg
        this.textures.color = loader.load('/textures/floor.jpg')

        // Ajuste del color space y repetición
        this.textures.color.colorSpace = THREE.SRGBColorSpace
        this.textures.color.wrapS = THREE.RepeatWrapping
        this.textures.color.wrapT = THREE.RepeatWrapping
        this.textures.color.repeat.set(50, 50) // Ajusta según necesites
    }

    setMaterial() {
        this.material = new THREE.MeshStandardMaterial({
            map: this.textures.color, // Usamos la textura cargada
            roughness: 0.8,
            metalness: 0.1
        })
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.set(0, -this.size.height / 2, 0)
        this.mesh.receiveShadow = true
        this.scene.add(this.mesh)
    }

    setPhysics() {
        const shape = new CANNON.Box(
            new CANNON.Vec3(
                this.size.width / 2,
                this.size.height / 2,
                this.size.depth / 2
            )
        )

        this.body = new CANNON.Body({
            mass: 0,
            shape: shape,
            position: new CANNON.Vec3(0, -this.size.height / 2, 0)
        })

        this.physics.world.addBody(this.body)
    }
}
