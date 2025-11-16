// AmbientSoundHowl.js
import { Howl } from 'howler'

export default class AmbientSoundHowl {
  constructor(url, initialVolume = 0.5) {
    this.howl = new Howl({
      src: [url],
      loop: true,
      volume: initialVolume, // 0.0 - 1.0
      html5: true // si quieres streaming para archivos grandes
    })
  }

  toggle() {
    if (this.howl.playing()) {
      this.howl.pause()
    } else {
      this.howl.play()
    }
  }

  setVolume(v) {
    const vol = Math.max(0, Math.min(1, Number(v)))
    this.howl.volume(vol)
  }

  dispose() {
    this.howl.unload()
  }
}

