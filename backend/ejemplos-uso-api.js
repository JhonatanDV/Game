// ============================================
// EJEMPLOS DE USO DE LA API - JUEGO 3D
// ============================================

const API_URL = 'http://localhost:3001/api';

// ============================================
// 1. AUTENTICACIÓN
// ============================================

// Registrar un nuevo usuario
async function ejemploRegistro() {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Juan Pérez',
                email: 'juan@ejemplo.com',
                password: '123456'
            })
        });

        const data = await response.json();
        console.log('Registro exitoso:', data);
        
        // Guardar token en localStorage
        if (data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('userName', data.data.name);
            localStorage.setItem('userId', data.data._id);
        }
        
        return data;
    } catch (error) {
        console.error('Error en registro:', error);
    }
}

// Iniciar sesión
async function ejemploLogin() {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'juan@ejemplo.com',
                password: '123456'
            })
        });

        const data = await response.json();
        console.log('Login exitoso:', data);
        
        if (data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('userName', data.data.name);
            localStorage.setItem('userId', data.data._id);
        }
        
        return data;
    } catch (error) {
        console.error('Error en login:', error);
    }
}

// Verificar si el usuario está autenticado
async function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('No hay token guardado');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Token válido:', data);
        return data.success;
    } catch (error) {
        console.error('Error al verificar token:', error);
        return false;
    }
}

// Obtener perfil del usuario
async function obtenerPerfil() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Perfil del usuario:', data);
        return data;
    } catch (error) {
        console.error('Error al obtener perfil:', error);
    }
}

// ============================================
// 2. PUNTAJES
// ============================================

// Guardar un nuevo puntaje
async function guardarPuntaje(score, level = 1) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                score,
                level
            })
        });

        const data = await response.json();
        console.log('Puntaje guardado:', data);
        
        if (data.data.isNewRecord) {
            console.log('🎉 ¡Nuevo récord personal!');
        }
        
        return data;
    } catch (error) {
        console.error('Error al guardar puntaje:', error);
    }
}

// Obtener mis puntajes
async function obtenerMisPuntajes() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/scores/my-scores`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Mis puntajes:', data);
        return data;
    } catch (error) {
        console.error('Error al obtener puntajes:', error);
    }
}

// Obtener tabla de clasificación
async function obtenerLeaderboard(limit = 10) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/scores/leaderboard?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Leaderboard:', data);
        return data;
    } catch (error) {
        console.error('Error al obtener leaderboard:', error);
    }
}

// Obtener estadísticas
async function obtenerEstadisticas() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/scores/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Estadísticas:', data);
        return data;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
    }
}

// ============================================
// 3. CLASE PARA INTEGRAR EN TU JUEGO
// ============================================

class GameAuthManager {
    constructor(apiUrl = 'http://localhost:3001/api') {
        this.apiUrl = apiUrl;
    }

    // Registrar usuario
    async register(name, email, password) {
        const response = await fetch(`${this.apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (data.success) {
            this.saveAuth(data.data);
        }
        return data;
    }

    // Iniciar sesión
    async login(email, password) {
        const response = await fetch(`${this.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (data.success) {
            this.saveAuth(data.data);
        }
        return data;
    }

    // Guardar información de autenticación
    saveAuth(data) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userId', data._id);
        localStorage.setItem('highestScore', data.highestScore);
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('highestScore');
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    // Obtener token
    getToken() {
        return localStorage.getItem('token');
    }

    // Obtener nombre de usuario
    getUserName() {
        return localStorage.getItem('userName');
    }

    // Guardar puntaje
    async saveScore(score, level = 1) {
        const response = await fetch(`${this.apiUrl}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ score, level })
        });
        
        const data = await response.json();
        if (data.success && data.data.isNewRecord) {
            localStorage.setItem('highestScore', data.data.highestScore);
        }
        return data;
    }

    // Obtener leaderboard
    async getLeaderboard(limit = 10) {
        const response = await fetch(`${this.apiUrl}/scores/leaderboard?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            }
        });
        return await response.json();
    }

    // Obtener estadísticas
    async getStats() {
        const response = await fetch(`${this.apiUrl}/scores/stats`, {
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            }
        });
        return await response.json();
    }
}

// ============================================
// 4. USO EN TU JUEGO
// ============================================

// Crear instancia del manager
const authManager = new GameAuthManager();

// Ejemplo de flujo completo
async function ejemploFlujoCompleto() {
    console.log('=== EJEMPLO DE FLUJO COMPLETO ===\n');

    // 1. Registrar usuario
    console.log('1. Registrando usuario...');
    await authManager.register('María García', 'maria@ejemplo.com', '123456');
    
    // 2. Verificar autenticación
    console.log('\n2. Usuario autenticado:', authManager.isAuthenticated());
    console.log('   Nombre:', authManager.getUserName());
    
    // 3. Jugar y guardar puntaje
    console.log('\n3. Guardando puntaje...');
    await authManager.saveScore(1500, 3);
    
    // 4. Guardar más puntajes
    console.log('\n4. Guardando más puntajes...');
    await authManager.saveScore(1800, 4);
    await authManager.saveScore(2100, 5);
    
    // 5. Obtener estadísticas
    console.log('\n5. Obteniendo estadísticas...');
    const stats = await authManager.getStats();
    console.log('Estadísticas:', stats);
    
    // 6. Ver leaderboard
    console.log('\n6. Obteniendo leaderboard...');
    const leaderboard = await authManager.getLeaderboard(5);
    console.log('Top 5:', leaderboard);
    
    // 7. Cerrar sesión
    console.log('\n7. Cerrando sesión...');
    authManager.logout();
    console.log('   Usuario autenticado:', authManager.isAuthenticated());
}

// ============================================
// 5. INTEGRACIÓN EN PANTALLA DE JUEGO
// ============================================

// Cuando el jugador termina el juego
function onGameOver(finalScore, level) {
    const authManager = new GameAuthManager();
    
    if (authManager.isAuthenticated()) {
        // Guardar puntaje automáticamente
        authManager.saveScore(finalScore, level)
            .then(result => {
                if (result.data.isNewRecord) {
                    // Mostrar mensaje de nuevo récord
                    console.log('¡Nuevo récord personal!');
                    mostrarNotificacion('🎉 ¡Nuevo récord personal!');
                }
            });
    } else {
        // Redirigir a pantalla de login
        mostrarPantallaLogin();
    }
}

function mostrarNotificacion(mensaje) {
    // Implementa tu lógica de notificación aquí
    console.log(mensaje);
}

function mostrarPantallaLogin() {
    // Implementa tu pantalla de login aquí
    console.log('Mostrando pantalla de login...');
}

// Exportar para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameAuthManager,
        ejemploRegistro,
        ejemploLogin,
        guardarPuntaje,
        obtenerLeaderboard,
        obtenerEstadisticas
    };
}
