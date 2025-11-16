# 🎮 Guía de Integración: Sistema de Puntajes con tu Juego

## ✅ Archivos Creados

1. **`src/AuthScreen.jsx`** - Pantalla de login/registro
2. **`src/AuthScreen.css`** - Estilos de autenticación
3. **`src/GameOverScreen.jsx`** - Pantalla de fin de juego con puntajes
4. **`src/GameOverScreen.css`** - Estilos de game over
5. **`src/App.jsx`** - Actualizado con lógica de autenticación

---

## 🔗 Conectar el Game Over con tu Sistema Actual

Tu juego actualmente usa `GameTracker.js` que muestra un modal cuando termina el juego. Necesitas modificarlo para que dispare un evento que React pueda capturar.

### Opción 1: Modificar GameTracker.js (Recomendado)

Abre `src/Experience/Utils/GameTracker.js` y modifica el método `showEndGameModal`:

```javascript
showEndGameModal(currentTime) {
    const best = this.getBestTimes()
    const ranking = best.map((t, i) => `#${i + 1}: ${t}s`).join('\n')

    // 🔥 AGREGAR ESTO: Disparar evento personalizado para React
    const coins = this.menu?.getCoins ? this.menu.getCoins() : 0
    window.dispatchEvent(new CustomEvent('game-over', {
        detail: {
            score: coins,  // Monedas recolectadas
            level: 1,      // Ajusta según tu sistema de niveles
            time: currentTime
        }
    }))

    // El resto del código existente...
    if (!this.modal || typeof this.modal.show !== 'function') {
        console.warn('⚠️ No se puede mostrar el modal de fin: modal no definido.')
        return
    }

    // ... resto del código
}
```

### Opción 2: Desde LevelManager.js

Si prefieres disparar el evento desde `LevelManager.js`, busca donde se llama a `showEndGameModal` y agrega antes:

```javascript
// En src/Experience/World/LevelManager.js (línea ~33)
// Antes de:
this.experience.tracker.showEndGameModal(elapsed);

// Agregar:
const coins = this.experience.world?.menu?.getCoins ? 
              this.experience.world.menu.getCoins() : 0;

window.dispatchEvent(new CustomEvent('game-over', {
    detail: {
        score: coins,
        level: this.currentLevel || 1,
        time: elapsed
    }
}));

// Luego la línea original:
this.experience.tracker.showEndGameModal(elapsed);
```

---

## 🎯 Obtener las Monedas Recolectadas

### Desde CircularMenu

Si las monedas están en el `CircularMenu`, asegúrate de tener un método `getCoins()`:

```javascript
// En src/controls/CircularMenu.js
export default class CircularMenu {
    constructor() {
        this.coins = 0
        // ... resto del código
    }

    setCoins(coins) {
        this.coins = coins
        // Actualizar UI
    }

    getCoins() {
        return this.coins
    }
}
```

### Desde World

O si las monedas están en `World.js`:

```javascript
// En src/Experience/World/World.js
// Método para obtener monedas
getCollectedCoins() {
    return this.collectedCoins || 0
}
```

---

## 🚀 Ejemplo Completo de Integración

### 1. En GameTracker.js

```javascript
showEndGameModal(currentTime) {
    // Guardar tiempo
    this.saveTime(currentTime)
    const best = this.getBestTimes()
    const ranking = best.map((t, i) => `#${i + 1}: ${t}s`).join('\n')

    // 🎮 Obtener datos del juego
    const experience = window.experience
    const coins = experience?.world?.menu?.coins || 0
    const level = experience?.world?.levelManager?.currentLevel || 1

    // 🔥 Disparar evento para React
    window.dispatchEvent(new CustomEvent('game-over', {
        detail: {
            score: coins,
            level: level,
            time: currentTime
        }
    }))

    console.log('🎮 Game Over disparado:', { coins, level, time: currentTime })

    // Mostrar modal tradicional (opcional, puedes comentarlo)
    if (!this.modal || typeof this.modal.show !== 'function') {
        console.warn('⚠️ No se puede mostrar el modal de fin: modal no definido.')
        return
    }

    this.modal.show({
        icon: '🏁',
        message: `¡Felicidades!\nTerminaste la partida.\n💰 Monedas: ${coins}\n⏱ Tiempo: ${currentTime}s\n\n🏆 Mejores tiempos:\n${ranking}`,
        buttons: [
            {
                text: '🔁 Reintentar',
                onClick: () => {
                    window.experience.resetGameToFirstLevel();
                }
            }
        ]
    })
}
```

### 2. En Experience.js

Asegúrate de que Experience sea accesible globalmente:

```javascript
// Al final del constructor de Experience.js
constructor(canvas) {
    // ... código existente

    // Hacer Experience accesible globalmente
    window.experience = this
}
```

---

## 🎨 Personalización del Sistema de Puntajes

### Cambiar qué se considera "puntaje"

Por defecto, el sistema usa las monedas. Si quieres usar otra métrica:

```javascript
// En GameTracker.js, cambiar:
const score = experience?.world?.menu?.coins || 0

// Por ejemplo, para usar tiempo como puntaje (menor es mejor):
const score = currentTime

// O para usar una combinación:
const coins = experience?.world?.menu?.coins || 0
const timeBonus = Math.max(0, 300 - currentTime) // Bonus por tiempo
const score = coins * 10 + timeBonus
```

### Agregar más niveles

El sistema ya soporta niveles. Solo asegúrate de pasar el nivel correcto:

```javascript
// Si tienes múltiples niveles
const level = experience?.world?.levelManager?.currentLevel || 1

window.dispatchEvent(new CustomEvent('game-over', {
    detail: {
        score: coins,
        level: level,  // Se guardará en la base de datos
        time: currentTime
    }
}))
```

---

## 🧪 Probar el Sistema

### 1. Iniciar el Servidor Backend

```powershell
cd backend
node app.js
```

Deberías ver:
```
✅ Servidor corriendo en puerto 3001
✅ Conectado a MongoDB
```

### 2. Iniciar el Frontend

```powershell
cd game-project
npm run dev
```

### 3. Flujo de Prueba

1. ✅ Al abrir el juego, debe aparecer la pantalla de login
2. ✅ Registra un usuario nuevo
3. ✅ Deberías ver tu nombre arriba a la derecha
4. ✅ Juega y recoge monedas
5. ✅ Cuando termines, debe aparecer la pantalla de Game Over
6. ✅ El puntaje se guarda automáticamente
7. ✅ Puedes ver el leaderboard
8. ✅ Puedes jugar de nuevo

---

## 🐛 Troubleshooting

### El evento 'game-over' no se dispara

**Problema:** La pantalla de Game Over no aparece.

**Solución:**
1. Abre la consola del navegador (F12)
2. Verifica que se dispare el evento:
```javascript
// Agregar en GameTracker.js antes de dispatchEvent
console.log('🎮 Disparando game-over con:', { score, level, time })
```

3. Verifica en `App.jsx` que el listener esté activo:
```javascript
// Agregar en el useEffect
console.log('👂 Escuchando evento game-over')
```

### Las monedas son 0

**Problema:** Siempre muestra 0 monedas.

**Solución:**
1. Verifica cómo se almacenan las monedas en tu código
2. Usa `console.log` para ver dónde están:
```javascript
const experience = window.experience
console.log('Experience:', experience)
console.log('World:', experience?.world)
console.log('Menu:', experience?.world?.menu)
console.log('Coins:', experience?.world?.menu?.coins)
```

### El puntaje no se guarda

**Problema:** No aparece en el leaderboard.

**Solución:**
1. Verifica que el servidor backend esté corriendo
2. Abre la consola del navegador y revisa si hay errores
3. Verifica el token:
```javascript
console.log('Token:', localStorage.getItem('token'))
```

---

## 📊 Estructura del Evento game-over

El evento que debes disparar debe tener esta estructura:

```javascript
window.dispatchEvent(new CustomEvent('game-over', {
    detail: {
        score: 100,      // Número: puntaje (monedas, puntos, etc)
        level: 1,        // Número: nivel alcanzado
        time: 45,        // Número: tiempo en segundos (opcional)
        coins: 10        // Número: monedas específicas (opcional)
    }
}))
```

App.jsx capturará estos valores y los usará para:
- Guardar el puntaje en la base de datos
- Mostrar la pantalla de Game Over
- Actualizar el récord personal si es necesario

---

## ✅ Checklist de Integración

- [ ] Servidor backend corriendo en puerto 3001
- [ ] Frontend corriendo (npm run dev)
- [ ] Pantalla de login aparece al inicio
- [ ] Puedes registrarte e iniciar sesión
- [ ] Tu nombre aparece arriba a la derecha
- [ ] Modificaste GameTracker.js para disparar el evento
- [ ] El evento game-over se dispara correctamente
- [ ] La pantalla de Game Over aparece al terminar
- [ ] El puntaje se guarda en la base de datos
- [ ] El leaderboard muestra los mejores jugadores
- [ ] Puedes jugar de nuevo después de terminar

---

## 🎉 ¡Listo!

Tu juego ahora tiene:
- ✅ Sistema de login/registro
- ✅ Autenticación persistente
- ✅ Guardado automático de puntajes
- ✅ Tabla de clasificación
- ✅ Sistema de récords personales
- ✅ Interfaz completa de Game Over

¡Disfruta tu juego con sistema de puntajes! 🚀
