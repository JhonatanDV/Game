import { useState } from 'react';
import './AuthScreen.css';

const API_URL = 'http://localhost:3001/api';

const AuthScreen = ({ onAuthSuccess, onPlayOffline }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Estados para registro
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                // Guardar token y datos del usuario
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('userName', data.data.name);
                localStorage.setItem('userId', data.data._id);
                localStorage.setItem('highestScore', data.data.highestScore || 0);

                setSuccess('¡Inicio de sesión exitoso!');
                
                setTimeout(() => {
                    onAuthSuccess(data.data);
                }, 500);
            } else {
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Error de conexión. Verifica que el servidor esté corriendo.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: registerName,
                    email: registerEmail,
                    password: registerPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                // Guardar token y datos del usuario
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('userName', data.data.name);
                localStorage.setItem('userId', data.data._id);
                localStorage.setItem('highestScore', data.data.highestScore || 0);

                setSuccess('¡Registro exitoso! Bienvenido al juego.');
                
                setTimeout(() => {
                    onAuthSuccess(data.data);
                }, 500);
            } else {
                if (data.errors) {
                    setError(data.errors.map(e => e.msg).join(', '));
                } else {
                    setError(data.message || 'Error al registrar');
                }
            }
        } catch (err) {
            setError('Error de conexión. Verifica que el servidor esté corriendo.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-container">
                <div className="auth-logo">
                    <h1>🎮 Juego 3D</h1>
                    <p>Recoge todas las monedas y evita los obstáculos</p>
                </div>

                <div className="auth-tabs">
                    <button 
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => {
                            setIsLogin(true);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        Iniciar Sesión
                    </button>
                    <button 
                        className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => {
                            setIsLogin(false);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        Registrarse
                    </button>
                </div>

                {error && (
                    <div className="auth-message error">
                        ❌ {error}
                    </div>
                )}

                {success && (
                    <div className="auth-message success">
                        ✅ {success}
                    </div>
                )}

                {isLogin ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="loginEmail">Email</label>
                            <input
                                type="email"
                                id="loginEmail"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="loginPassword">Contraseña</label>
                            <input
                                type="password"
                                id="loginPassword"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="Tu contraseña"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="form-group">
                            <label htmlFor="registerName">Nombre</label>
                            <input
                                type="text"
                                id="registerName"
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value)}
                                placeholder="Tu nombre"
                                minLength="3"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="registerEmail">Email</label>
                            <input
                                type="email"
                                id="registerEmail"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="registerPassword">Contraseña</label>
                            <input
                                type="password"
                                id="registerPassword"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                minLength="6"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrarse'}
                        </button>

                        <p className="auth-info">
                            💡 El email puede ser ficticio
                        </p>
                    </form>
                )}

                <div className="offline-section">
                    <div className="divider">
                        <span>o</span>
                    </div>
                    <button 
                        type="button" 
                        className="offline-button"
                        onClick={onPlayOffline}
                        disabled={loading}
                    >
                        🎮 Jugar sin conexión
                    </button>
                    <p className="offline-info">
                        ⚠️ Sin conexión no se guardarán tus puntajes
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
