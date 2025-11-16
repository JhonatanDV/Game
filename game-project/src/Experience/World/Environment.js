import * as THREE from 'three'

export default class Environment {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        // Debug
        if (this.debug?.active) {
            this.debugFolder = this.debug.ui.addFolder('environment')
        }

        // Por defecto asumimos día; puedes activar la noche llamando this.setNight(true)
        this.isNight = true // <-- cambia a false si quieres volver al día

        this.setSunLight()
        this.setEnvironmentMap()
        this.setBackground() // establece el fondo (día/noche)
    }

    setSunLight() {
        // Si es de noche, luz tipo "luna" azulada y tenue
        if (this.isNight) {
            // Luz direccional simulando luna
            this.sunLight = new THREE.DirectionalLight(0x99bbff, 0.6) // color azul pálido, intensidad baja
            this.sunLight.position.set(50, 100, -50)
            this.sunLight.castShadow = true
            this.sunLight.shadow.camera.far = 500
            this.sunLight.shadow.mapSize.set(2048, 2048)
            this.sunLight.shadow.normalBias = 0.05

            // Luz ambiental tenue azulada
            this.ambientLight = new THREE.AmbientLight(0x22264a, 0.35)
        } else {
            // Día: sol blanco más intenso
            this.sunLight = new THREE.DirectionalLight('#ffffff', 4)
            this.sunLight.position.set(3.5, 2, -1.25)
            this.sunLight.castShadow = true
            this.sunLight.shadow.camera.far = 15
            this.sunLight.shadow.mapSize.set(1024, 1024)
            this.sunLight.shadow.normalBias = 0.05

            this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        }

        this.scene.add(this.sunLight)
        this.scene.add(this.ambientLight)

        // Debug
        if (this.debug?.active) {
            const folder = this.debugFolder
            folder
                .add(this.sunLight, 'intensity')
                .name('sunLightIntensity')
                .min(0)
                .max(10)
                .step(0.001)

            folder
                .add(this.sunLight.position, 'x')
                .name('sunLightX')
                .min(-500)
                .max(500)
                .step(0.1)

            folder
                .add(this.sunLight.position, 'y')
                .name('sunLightY')
                .min(-500)
                .max(500)
                .step(0.1)

            folder
                .add(this.sunLight.position, 'z')
                .name('sunLightZ')
                .min(-500)
                .max(500)
                .step(0.1)
        }
    }

    setEnvironmentMap() {
        // Mantener el comportamiento actual para environmentMap (si tienes uno cargado)
        this.environmentMap = {}
        this.environmentMap.intensity = this.isNight ? 0.3 : 0.4
        this.environmentMap.texture = this.resources.items.environmentMapTexture
        if (this.environmentMap.texture) {
            this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace
            this.scene.environment = this.environmentMap.texture
        } else {
            // Si no tienes envMap, asegúrate de no asignar undefined
            this.scene.environment = null
        }

        this.environmentMap.updateMaterials = () => {
            this.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.envMap = this.environmentMap.texture || null
                    child.material.envMapIntensity = this.environmentMap.intensity
                    child.material.needsUpdate = true
                }
            })
        }
        this.environmentMap.updateMaterials()

        // Debug
        if (this.debug?.active) {
            this.debugFolder
                .add(this.environmentMap, 'intensity')
                .name('envMapIntensity')
                .min(0)
                .max(4)
                .step(0.001)
                .onChange(this.environmentMap.updateMaterials)
        }
    }

    setBackground() {
        // Opción A: si cargaste la textura de noche en resources (this.resources.items.nightTexture)
        if (this.isNight && this.resources?.items?.nightTexture) {
            const tex = this.resources.items.nightTexture
            tex.colorSpace = THREE.SRGBColorSpace
            tex.wrapS = THREE.RepeatWrapping
            tex.wrapT = THREE.RepeatWrapping
            tex.repeat.set(1, 1)
            this.scene.background = tex
            return
        }

        // Opción B: cargar desde public/textura/night_sky.jpg (ruta: /textura/night_sky.jpg)
        if (this.isNight) {
            const loader = new THREE.TextureLoader()
            const nightBg = loader.load('/textures/night_sky.jpg',
                () => {
                    // callback onLoad (opcional)
                },
                undefined,
                (err) => {
                    console.warn('No se pudo cargar /textures/night_sky.jpg', err)
                }
            )
            if (nightBg) {
                nightBg.colorSpace = THREE.SRGBColorSpace
                nightBg.wrapS = THREE.RepeatWrapping
                nightBg.wrapT = THREE.RepeatWrapping
                nightBg.repeat.set(1, 1)
                this.scene.background = nightBg
            }
            return
        }

        // Si no es noche, puedes usar el environmentMap texture como fondo o un color claro
        if (!this.isNight && this.resources?.items?.environmentMapTexture) {
            this.scene.background = this.resources.items.environmentMapTexture
        } else {
            this.scene.background = new THREE.Color(0xbfd1e5) // azul cielo diurno por defecto
        }
    }

    // Método útil por si quieres alternar día/noche en runtime
    toggleDayNight(isNight) {
        this.isNight = typeof isNight === 'boolean' ? isNight : !this.isNight

        // Removemos luces previas
        if (this.sunLight) this.scene.remove(this.sunLight)
        if (this.ambientLight) this.scene.remove(this.ambientLight)

        // Re-crear iluminación y fondo
        this.setSunLight()
        this.setBackground()

        // Ajustar intensidad del environment map si existe
        if (this.environmentMap) {
            this.environmentMap.intensity = this.isNight ? 0.3 : 0.4
            this.environmentMap.updateMaterials()
        }
    }
}
