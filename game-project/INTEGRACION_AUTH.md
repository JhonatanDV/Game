# 🎮 Integración de Autenticación en el Frontend

## Archivos Creados

1. **`public/login.html`** - Página de login/registro lista para usar
2. **`src/GameAuthManager.js`** - Clase para manejar autenticación

---

## 🚀 Cómo Integrar

### Paso 1: Importar GameAuthManager

En tu archivo principal del juego (por ejemplo, `main.jsx` o `App.jsx`):

```javascript
import { GameAuthManager } from './GameAuthManager.js';

// Crear instancia global
const authManager = new GameAuthManager('http://localhost:3001/api');

// O si prefieres, expórtala
export { authManager };
```

### Paso 2: Verificar Autenticación al Iniciar

```javascript
// En tu componente principal o archivo de inicio
async function initApp() {
    // Verificar si el usuario está autenticado
    const isAuth = await authManager.init();
    
    if (!isAuth) {
        // Redirigir a login
        window.location.href = '/login.html';
        return;
    }
    
    // Usuario autenticado, mostrar nombre
    console.log(`Bienvenido ${authManager.getUserName()}!`);
    
    // Iniciar el juego
    startGame();
}

initApp();
```

### Paso 3: Guardar Puntajes

```javascript
// Cuando el jugador termina el juego
async function onGameOver(finalScore, level) {
    if (!authManager.isAuthenticated()) {
        console.log('No autenticado');
        return;
    }
    
    // Guardar puntaje
    const result = await authManager.saveScore(finalScore, level);
    
    if (result.success) {
        if (result.data.isNewRecord) {
            // Mostrar notificación de nuevo récord
            showNotification('🎉 ¡Nuevo récord personal!');
        }
        
        console.log('Puntaje guardado:', finalScore);
    }
}
```

### Paso 4: Mostrar Leaderboard

```javascript
// Obtener y mostrar la tabla de clasificación
async function showLeaderboard() {
    const result = await authManager.getLeaderboard(10);
    
    if (result.success) {
        console.log('Top 10 Jugadores:');
        result.data.forEach(player => {
            console.log(`#${player.rank} - ${player.name}: ${player.highestScore} pts`);
        });
        
        // Renderizar en tu interfaz
        renderLeaderboard(result.data);
    }
}
```

---

## 📱 Ejemplo de Integración en React

### En tu componente App.jsx o similar:

```jsx
import { useEffect, useState } from 'react';
import { GameAuthManager } from './GameAuthManager.js';

const authManager = new GameAuthManager();

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState('');
    const [highestScore, setHighestScore] = useState(0);

    useEffect(() => {
        const checkAuth = async () => {
            const isAuth = await authManager.init();
            
            if (isAuth) {
                setIsAuthenticated(true);
                setUserName(authManager.getUserName());
                setHighestScore(authManager.getHighestScore());
            } else {
                // Redirigir a login
                window.location.href = '/login.html';
            }
        };
        
        checkAuth();
    }, []);

    const handleGameOver = async (score, level) => {
        const result = await authManager.saveScore(score, level);
        
        if (result.success && result.data.isNewRecord) {
            setHighestScore(result.data.highestScore);
            alert('🎉 ¡Nuevo récord personal!');
        }
    };

    const handleLogout = () => {
        authManager.logout();
        window.location.href = '/login.html';
    };

    if (!isAuthenticated) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="app">
            <header>
                <h1>Bienvenido, {userName}!</h1>
                <p>Tu mejor puntaje: {highestScore}</p>
                <button onClick={handleLogout}>Cerrar Sesión</button>
            </header>
            
            {/* Tu juego aquí */}
            <YourGame onGameOver={handleGameOver} />
        </div>
    );
}

export default App;
```

---

## 🎯 Ejemplo Completo de Flujo

### 1. Página de Inicio (`index.html` o `main.jsx`)

```javascript
import { GameAuthManager } from './GameAuthManager.js';
import { Experience } from './Experience/Experience.js';

const authManager = new GameAuthManager();

class Game {
    constructor() {
        this.authManager = authManager;
        this.currentScore = 0;
        this.currentLevel = 1;
    }

    async init() {
        // Verificar autenticación
        const isAuth = await this.authManager.init();
        
        if (!isAuth) {
            window.location.href = '/login.html';
            return;
        }

        // Mostrar información del usuario
        this.showUserInfo();
        
        // Iniciar experiencia del juego
        this.experience = new Experience(document.querySelector('canvas.webgl'));
        
        // Escuchar evento de game over
        this.experience.on('gameOver', (score, level) => {
            this.handleGameOver(score, level);
        });
    }

    showUserInfo() {
        const userName = this.authManager.getUserName();
        const highestScore = this.authManager.getHighestScore();
        
        document.getElementById('userName').textContent = userName;
        document.getElementById('highestScore').textContent = highestScore;
    }

    async handleGameOver(finalScore, level) {
        // Guardar puntaje
        const result = await this.authManager.saveScore(finalScore, level);
        
        if (result.success) {
            if (result.data.isNewRecord) {
                this.showNotification('🎉 ¡Nuevo récord personal!');
            }
            
            // Actualizar UI
            this.showUserInfo();
        }
        
        // Mostrar pantalla de game over
        this.showGameOverScreen(finalScore, level);
    }

    showNotification(message) {
        // Tu lógica de notificación
        console.log(message);
    }

    showGameOverScreen(score, level) {
        // Mostrar pantalla de game over con opciones:
        // - Jugar de nuevo
        // - Ver leaderboard
        // - Cerrar sesión
    }

    async showLeaderboard() {
        const result = await this.authManager.getLeaderboard(10);
        
        if (result.success) {
            // Renderizar leaderboard
            const leaderboardHTML = result.data.map(player => `
                <div class="player-rank">
                    <span>#${player.rank}</span>
                    <span>${player.name}</span>
                    <span>${player.highestScore} pts</span>
                </div>
            `).join('');
            
            document.getElementById('leaderboard').innerHTML = leaderboardHTML;
        }
    }

    logout() {
        this.authManager.logout();
        window.location.href = '/login.html';
    }
}

// Iniciar el juego
const game = new Game();
game.init();
```

---

## 🔧 Métodos Disponibles

### Autenticación

```javascript
// Registrar usuario
await authManager.register(name, email, password);

// Iniciar sesión
await authManager.login(email, password);

// Cerrar sesión
authManager.logout();

// Verificar si está autenticado
authManager.isAuthenticated(); // true/false

// Obtener información
authManager.getUserName(); // string
authManager.getUserId(); // string
authManager.getHighestScore(); // number
authManager.getToken(); // string
```

### Puntajes

```javascript
// Guardar puntaje
await authManager.saveScore(1500, 3);

// Obtener mis puntajes
await authManager.getMyScores();

// Obtener leaderboard
await authManager.getLeaderboard(10);

// Obtener estadísticas
await authManager.getStats();
```

---

## 💡 Tips de Implementación

### 1. Proteger Rutas

```javascript
// En cada página que requiera autenticación
import { authManager } from './GameAuthManager.js';

// Al inicio de la página
if (!authManager.requireAuth('/login.html')) {
    // Se redirigirá automáticamente
}
```

### 2. Sincronizar Estado

```javascript
// Escuchar cambios en localStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
        // El usuario cerró sesión en otra pestaña
        if (!e.newValue) {
            window.location.href = '/login.html';
        }
    }
});
```

### 3. Manejar Errores

```javascript
async function saveScoreWithRetry(score, level) {
    const result = await authManager.saveScore(score, level);
    
    if (!result.success) {
        // Token expirado o error de red
        if (result.message.includes('Token')) {
            // Redirigir a login
            authManager.logout();
            window.location.href = '/login.html';
        } else {
            // Error de red, reintentar
            console.log('Error, reintentando...');
            setTimeout(() => saveScoreWithRetry(score, level), 3000);
        }
    }
}
```

---

## 🎨 UI Recomendada

### Agregar info del usuario en la interfaz:

```html
<!-- En tu index.html o componente principal -->
<div class="user-info">
    <span id="userName">Usuario</span>
    <span id="highestScore">0</span>
    <button onclick="showLeaderboard()">🏆 Leaderboard</button>
    <button onclick="authManager.logout()">Cerrar Sesión</button>
</div>
```

### CSS para la UI:

```css
.user-info {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 15px;
    border-radius: 10px;
    display: flex;
    gap: 15px;
    align-items: center;
}

.user-info button {
    padding: 8px 15px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}
```

---

## 📦 Archivos Necesarios

✅ `/public/login.html` - Ya creado  
✅ `/src/GameAuthManager.js` - Ya creado  
⬜ Integrar en tu `main.jsx` o archivo principal  
⬜ Agregar UI de usuario en tu juego  
⬜ Implementar lógica de guardado de puntajes  

---

## 🆘 Solución de Problemas

### Error: "Token inválido"
**Solución:** El token expiró (30 días). Cierra sesión y vuelve a iniciar sesión.

### Error: "Network error"
**Solución:** Verifica que el servidor backend esté corriendo en `http://localhost:3001`

### El usuario se queda en loop de redirección
**Solución:** Verifica que `login.html` no llame a `requireAuth()` o `init()`

---

## ✅ Checklist de Integración

- [ ] Importar `GameAuthManager` en tu proyecto
- [ ] Verificar autenticación al inicio de la app
- [ ] Mostrar información del usuario (nombre, puntaje)
- [ ] Implementar guardado de puntajes al terminar el juego
- [ ] Agregar botón de "Cerrar sesión"
- [ ] Opcional: Mostrar leaderboard en el juego
- [ ] Opcional: Mostrar estadísticas del usuario
- [ ] Probar flujo completo: registro → juego → puntaje → leaderboard

---

¡Listo para integrar! 🎮🚀
