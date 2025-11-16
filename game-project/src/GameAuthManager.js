/**
 * GameAuthManager - Gestión de Autenticación para el Juego 3D
 * 
 * Esta clase maneja toda la autenticación y gestión de puntajes
 * de forma simple y centralizada.
 * 
 * Uso:
 * import { GameAuthManager } from './GameAuthManager.js';
 * const authManager = new GameAuthManager();
 */

export class GameAuthManager {
    constructor(apiUrl = 'http://localhost:3001/api') {
        this.apiUrl = apiUrl;
    }

    /**
     * Registrar nuevo usuario
     * @param {string} name - Nombre del usuario
     * @param {string} email - Email (puede ser ficticio)
     * @param {string} password - Contraseña (mínimo 6 caracteres)
     * @returns {Promise} Respuesta de la API
     */
    async register(name, email, password) {
        try {
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
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    /**
     * Iniciar sesión
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @returns {Promise} Respuesta de la API
     */
    async login(email, password) {
        try {
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
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    /**
     * Guardar información de autenticación en localStorage
     * @param {Object} data - Datos del usuario
     */
    saveAuth(data) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userId', data._id);
        localStorage.setItem('highestScore', data.highestScore || 0);
        
        console.log(`✅ Usuario autenticado: ${data.name}`);
    }

    /**
     * Cerrar sesión
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('highestScore');
        
        console.log('👋 Sesión cerrada');
    }

    /**
     * Verificar si el usuario está autenticado
     * @returns {boolean} True si está autenticado
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    /**
     * Obtener el token JWT
     * @returns {string|null} Token o null
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Obtener el nombre del usuario
     * @returns {string|null} Nombre o null
     */
    getUserName() {
        return localStorage.getItem('userName');
    }

    /**
     * Obtener el ID del usuario
     * @returns {string|null} ID o null
     */
    getUserId() {
        return localStorage.getItem('userId');
    }

    /**
     * Obtener el puntaje más alto del usuario
     * @returns {number} Puntaje más alto
     */
    getHighestScore() {
        return parseInt(localStorage.getItem('highestScore')) || 0;
    }

    /**
     * Verificar si el token es válido
     * @returns {Promise} Respuesta de la API
     */
    async verifyToken() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al verificar token:', error);
            return { success: false };
        }
    }

    /**
     * Obtener perfil completo del usuario
     * @returns {Promise} Respuesta de la API
     */
    async getProfile() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            return { success: false };
        }
    }

    /**
     * Guardar un puntaje
     * @param {number} score - Puntaje obtenido
     * @param {number} level - Nivel alcanzado (opcional)
     * @returns {Promise} Respuesta de la API
     */
    async saveScore(score, level = 1) {
        try {
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
                console.log('🎉 ¡Nuevo récord personal!', data.data.highestScore);
            }
            
            return data;
        } catch (error) {
            console.error('Error al guardar puntaje:', error);
            return { success: false };
        }
    }

    /**
     * Obtener todos los puntajes del usuario
     * @returns {Promise} Respuesta de la API
     */
    async getMyScores() {
        try {
            const response = await fetch(`${this.apiUrl}/scores/my-scores`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener puntajes:', error);
            return { success: false };
        }
    }

    /**
     * Obtener la tabla de clasificación
     * @param {number} limit - Número de usuarios a mostrar (por defecto 10)
     * @returns {Promise} Respuesta de la API
     */
    async getLeaderboard(limit = 10) {
        try {
            const response = await fetch(`${this.apiUrl}/scores/leaderboard?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener leaderboard:', error);
            return { success: false };
        }
    }

    /**
     * Obtener estadísticas del usuario
     * @returns {Promise} Respuesta de la API
     */
    async getStats() {
        try {
            const response = await fetch(`${this.apiUrl}/scores/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return { success: false };
        }
    }

    /**
     * Redirigir a login si no está autenticado
     * @param {string} loginUrl - URL de la página de login
     */
    requireAuth(loginUrl = '/login.html') {
        if (!this.isAuthenticated()) {
            console.log('⚠️ No autenticado. Redirigiendo a login...');
            window.location.href = loginUrl;
            return false;
        }
        return true;
    }

    /**
     * Inicializar autenticación en la página
     * Verifica si el usuario está autenticado y muestra información
     */
    async init() {
        if (!this.isAuthenticated()) {
            console.log('❌ Usuario no autenticado');
            return false;
        }

        console.log('✅ Usuario autenticado:', this.getUserName());
        console.log('🏆 Puntaje más alto:', this.getHighestScore());

        // Verificar que el token sea válido
        const verifyResult = await this.verifyToken();
        if (!verifyResult.success) {
            console.log('⚠️ Token inválido o expirado');
            this.logout();
            return false;
        }

        return true;
    }
}

// Exportar como default también para compatibilidad
export default GameAuthManager;
