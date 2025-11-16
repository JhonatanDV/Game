export default class LevelManager {
  constructor(experience) {
    this.experience = experience;
    this.currentLevel = 1;
    this.totalLevels = 3; // 🔹 Asegúrate que este sea el número total de niveles
  }

  // ***** CORRECCIÓN CLAVE 1 *****
  // Se convierte la función en async
  async nextLevel() {
    if (this.currentLevel < this.totalLevels) {
      this.currentLevel++;
      console.log(`➡️ Pasando al nivel ${this.currentLevel}`);

      this.experience.world.clearCurrentScene();
      
      // ***** CORRECCIÓN CLAVE 2 *****
      // Se usa await para ESPERAR a que la función async loadLevel termine
      await this.experience.world.loadLevel(this.currentLevel);

      // ***** CORRECCIÓN CLAVE 3 *****
      // Se ELIMINA el setTimeout que reseteaba la posición,
      // porque loadLevel(this.currentLevel) ya lo hace
      // con el spawnPoint correcto.
      
    } else {
      // 🔹 Si ya estás en el último nivel → termina el juego
      console.log("🎉 ¡Juego completado! Todos los niveles superados.");
      try {
        if (this.experience.tracker) {
          const elapsed = this.experience.tracker.stop();
          this.experience.tracker.saveTime(elapsed);
          this.experience.tracker.showEndGameModal(elapsed);
        } else {
          // Fallback si no hay tracker
          this.experience.world.ambientSound.stop();
          if(window.userInteracted) this.experience.world.winner.play();
          alert("🏆 ¡Has completado el juego!");
        }
      } catch (e) {
        console.warn("Error mostrando fin del juego:", e);
      }
    }
  }

  resetLevel() {
    // Esta función también debería ser async si loadLevel lo es
    this.currentLevel = 1;
    this.experience.world.clearCurrentScene();
    this.experience.world.loadLevel(this.currentLevel);
  }

  getCurrentLevelTargetPoints() {
    // Esta es solo una función de ejemplo, 
    // tu lógica de 'coinGoal' está dentro de World.js
    return this.pointsToComplete?.[this.currentLevel] || 10;
  }
}