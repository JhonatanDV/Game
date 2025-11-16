// Experience/Utils/KeyboardControls.js
import EventEmitter from './EventEmitter.js'

export default class KeyboardControls extends EventEmitter {
    constructor() {
        super()

        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false,
            shift: false,
            attack: false // 👊 nuevo: atacar con tecla K
        }

        this.setListeners()
    }

    setListeners() {
        // Teclado presionado
        window.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w': this.keys.up = true; break
                case 's': this.keys.down = true; break
                case 'a': this.keys.left = true; break
                case 'd': this.keys.right = true; break
                case ' ': this.keys.space = true; break
                case 'shift': this.keys.shift = true; break
                case 'k': this.keys.attack = true; break // 👈 atacar
            }
            this.trigger('change', this.keys)
        })

        // Teclado liberado
        window.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w': this.keys.up = false; break
                case 's': this.keys.down = false; break
                case 'a': this.keys.left = false; break
                case 'd': this.keys.right = false; break
                case ' ': this.keys.space = false; break
                case 'shift': this.keys.shift = false; break
                case 'k': this.keys.attack = false; break // 👈 detener ataque
            }
            this.trigger('change', this.keys)
        })
    }

    getState() {
        return this.keys
    }
}
