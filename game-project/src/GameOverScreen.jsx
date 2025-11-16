import { useState, useEffect } from 'react';
import './GameOverScreen.css';

const GameOverScreen = ({ score, level, onPlayAgain, onShowLeaderboard, onLogout, offlineMode }) => {
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [saving, setSaving] = useState(!offlineMode);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    useEffect(() => {
        if (!offlineMode) {
            saveScore();
        }
    }, []);

    const saveScore = async () => {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('http://localhost:3001/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ score, level: level || 1 })
            });

            const data = await response.json();

            if (data.success && data.data.isNewRecord) {
                setIsNewRecord(true);
                localStorage.setItem('highestScore', data.data.highestScore);
            }
        } catch (error) {
            console.error('Error guardando puntaje:', error);
        } finally {
            setSaving(false);
        }
    };

    const loadLeaderboard = async () => {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('http://localhost:3001/api/scores/leaderboard?limit=10', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setLeaderboard(data.data);
                setShowLeaderboard(true);
            }
        } catch (error) {
            console.error('Error cargando leaderboard:', error);
        }
    };

    return (
        <div className="game-over-overlay">
            <div className="game-over-container">
                {saving ? (
                    <>
                        <div className="game-over-spinner"></div>
                        <p>Guardando puntaje...</p>
                    </>
                ) : (
                    <>
                        <h1 className="game-over-title">
                            {offlineMode ? '🎮 Juego Terminado' : isNewRecord ? '🎉 ¡Nuevo Récord!' : '🎮 Juego Terminado'}
                        </h1>

                        {offlineMode && (
                            <div className="offline-warning">
                                ⚠️ Modo Sin Conexión - El puntaje no se guardó
                            </div>
                        )}

                        <div className="game-over-stats">
                            <div className="stat-item">
                                <span className="stat-label">Puntaje</span>
                                <span className="stat-value">{score}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Nivel</span>
                                <span className="stat-value">{level || 1}</span>
                            </div>
                        </div>

                        {!offlineMode && isNewRecord && (
                            <div className="new-record-badge">
                                ⭐ ¡Has superado tu mejor puntaje! ⭐
                            </div>
                        )}

                        {!showLeaderboard ? (
                            <div className="game-over-buttons">
                                <button className="game-over-btn primary" onClick={onPlayAgain}>
                                    🔄 Jugar de Nuevo
                                </button>
                                {!offlineMode && (
                                    <>
                                        <button className="game-over-btn secondary" onClick={loadLeaderboard}>
                                            🏆 Ver Clasificación
                                        </button>
                                        <button className="game-over-btn tertiary" onClick={onLogout}>
                                            🚪 Cerrar Sesión
                                        </button>
                                    </>
                                )}
                                {offlineMode && (
                                    <button className="game-over-btn tertiary" onClick={() => window.location.reload()}>
                                        🚪 Volver al Inicio
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="leaderboard-container">
                                    <h2>🏆 Top 10 Jugadores</h2>
                                    <div className="leaderboard-list">
                                        {leaderboard.map((player) => (
                                            <div key={player.userId} className="leaderboard-item">
                                                <span className="player-rank">#{player.rank}</span>
                                                <span className="player-name">{player.name}</span>
                                                <span className="player-score">{player.highestScore}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="game-over-buttons">
                                    <button className="game-over-btn primary" onClick={onPlayAgain}>
                                        🔄 Jugar de Nuevo
                                    </button>
                                    <button className="game-over-btn secondary" onClick={() => setShowLeaderboard(false)}>
                                        ⬅️ Volver
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GameOverScreen;
