// Prize.js (Modificado)
import * as THREE from 'three'

export default class Prize {
    constructor({
        model,
        position,
        scene,
        role = 'default',
        sound = null,
        robotRef = null,
        onCollect = null
    }) {
        this.scene = scene
        this.collected = false
        this.role = role
        this.sound = sound
        this.robotRef = robotRef
        this.onCollect = onCollect
        this.collectDistance = 1.5

        this.pivot = new THREE.Group()
        this.pivot.position.copy(position)
        this.pivot.userData.interactivo = true
        this.pivot.userData.collected = false

        const modelToClone = model.scene ? model.scene : model;

        if (typeof modelToClone.clone !== 'function') {
            console.error('Error en Prize: el modelo proporcionado no es clonable.', model);
            return;
        }

        this.model = modelToClone.clone();

        const visual = this.model.children.find(child => child.isMesh) || this.model
        visual.userData.interactivo = true

        const bbox = new THREE.Box3().setFromObject(visual)
        const center = new THREE.Vector3()
        bbox.getCenter(center)
        visual.position.sub(center)

        this.pivot.add(visual)
        this.scene.add(this.pivot)

        // OJO: Los cofres (role='chest') SÍ son visibles.
        // Los 'finalPrize' (como el portal del Nivel 1) empiezan ocultos.
        this.pivot.visible = role !== 'finalPrize'

        if (!this.robotRef) {
            console.warn(`Prize (role: ${this.role}) creado SIN 'robotRef'. No se podrá auto-recolectar.`, this.pivot.position);
        }
    }

    update(delta) {
        if (this.collected) return

        // Solo rotar si NO es el portal final
        if (this.role !== 'finalPrize') {
            this.pivot.rotation.y += delta * 1.5
        }

        if (this.robotRef && this.robotRef.body) {
            const robotPosition = this.robotRef.body.position;
            if (robotPosition) {
                const distance = this.pivot.position.distanceTo(robotPosition);
                if (distance < this.collectDistance) {
                    this.collect();
                }
            }
        }
    }

    collect() {
        if (this.collected) return
        this.collected = true // Marcar como recogido INMEDIATAMENTE

        // NO reproducir sonido aquí si es 'finalPrize', 
        // World.js lo hará (con 'winner.mp3')
        if (this.role !== 'finalPrize' && this.sound && typeof this.sound.play === 'function') {
            this.sound.play()
        }

        if (this.onCollect) {
            try {
                // Llamar a World.js (handleChestCollect)
                // Pasa 'this' (la instancia de Prize)
                this.onCollect(this);
            } catch (e) {
                console.error('Error en el callback onCollect de Prize:', e);
            }
        }

        this.pivot.traverse(child => {
            child.userData.collected = true
        })
        this.scene.remove(this.pivot)
        this.destroy();
    }

    // --- INICIO DE LA MODIFICACIÓN ---
    /**
     * Transforma este cofre (chest) en un premio final.
     * Lo hace visible y cambia su rol.
     */
    transformToFinalPrize() {
        if (this.collected) return;

        this.role = 'finalPrize';

        // Importante: Hacerlo visible, ya que los 'finalPrize'
        // (como el portal) pueden empezar ocultos.
        this.pivot.visible = true;

        // NOTA: No necesitamos cambiar el 'onCollect'.
        // Seguirá llamando a 'handleChestCollect' de World.js,
        // pero ahora World.js verá que 'prize.role' es 'finalPrize'
        // y ejecutará la lógica de victoria.
    }
    // --- FIN DE LA MODIFICACIÓN ---

    destroy() {
        try {
            this.pivot.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.pivot);
        } catch (e) { }
        this.collected = true;
        this.robotRef = null;
        this.onCollect = null;
    }
}