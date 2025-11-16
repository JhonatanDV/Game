import { Howl, Howler } from 'howler'

export default class Sound {
    constructor(src, options = {}) {
        this.sound = new Howl({
            src: [src],
            ...options
        })

        this._retryCount = 0
        this._maxRetries = 5
    }

    async play() {
        // Verifica que el usuario haya interactuado antes de reproducir
        if (!window.userInteracted) {
            // Esperar interacción de forma silenciosa (no mostrar warning cada vez)
            document.addEventListener('click', () => this.play(), { once: true })
            return
        }

        const ctx = Howler.ctx

        if (ctx.state === 'suspended') {
            try {
                await ctx.resume()
            } catch (e) {
                // Silencioso: esperaremos a que el usuario interactúe más
                return
            }
        }

        // Solo reproducir si el contexto está activo y no se está reproduciendo ya
        if (ctx.state === 'running') {
            if (!this.sound.playing()) {
                this.sound.play()
                this._retryCount = 0 // reset
            }
        } else {
            if (this._retryCount < this._maxRetries) {
                // Reintento silencioso
                this._retryCount++
                setTimeout(() => {
                    this.play()
                }, 500)
            }
        }
    }

    stop() {
        this.sound.stop()
        this._retryCount = 0
    }

    setVolume(volume) {
        if (this.sound && typeof this.sound.volume === 'function') {
            this.sound.volume(volume)
        }
        // Silencioso: no mostrar warning si falla ajustar volumen
    }

}
