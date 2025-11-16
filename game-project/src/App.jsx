import { useEffect, useRef, useState } from 'react'
import Experience from './Experience/Experience'
import AuthScreen from './AuthScreen'
import GameOverScreen from './GameOverScreen'
import './styles/loader.css'

const App = () => {
  const canvasRef = useRef()
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [finalLevel, setFinalLevel] = useState(1)
  const experienceRef = useRef(null)

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const userName = localStorage.getItem('userName')
      
      if (token && userName) {
        // Verificar que el token sea válido
        try {
          const response = await fetch('http://localhost:3001/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          const data = await response.json()
          
          if (data.success) {
            setUserData({
              name: userName,
              token: token,
              highestScore: localStorage.getItem('highestScore') || 0
            })
            setIsAuthenticated(true)
          } else {
            // Token inválido, limpiar localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('userName')
            localStorage.removeItem('userId')
            localStorage.removeItem('highestScore')
          }
        } catch (error) {
          console.error('Error verificando token:', error)
        }
      }
      
      setCheckingAuth(false)
    }
    
    checkAuth()
  }, [])

  // Iniciar el juego solo cuando esté autenticado
  useEffect(() => {
    if (isAuthenticated && canvasRef.current && !experienceRef.current) {
      experienceRef.current = new Experience(canvasRef.current)

      const handleProgress = (e) => setProgress(e.detail)
      const handleComplete = () => setLoading(false)
      
      // Escuchar evento de game over (puedes personalizarlo según tu juego)
      const handleGameOver = (e) => {
        const { score, level, coins } = e.detail || {}
        setFinalScore(coins || score || 0)
        setFinalLevel(level || 1)
        setGameOver(true)
      }

      window.addEventListener('resource-progress', handleProgress)
      window.addEventListener('resource-complete', handleComplete)
      window.addEventListener('game-over', handleGameOver)

      return () => {
        window.removeEventListener('resource-progress', handleProgress)
        window.removeEventListener('resource-complete', handleComplete)
        window.removeEventListener('game-over', handleGameOver)
      }
    }
  }, [isAuthenticated])

  const handleAuthSuccess = (data) => {
    setUserData(data)
    setIsAuthenticated(true)
  }

  const handlePlayOffline = () => {
    console.log('🎮 Modo offline activado')
    setOfflineMode(true)
    setIsAuthenticated(true)
    setUserData({ 
      name: 'Invitado', 
      isOffline: true,
      highestScore: 0 
    })
    setCheckingAuth(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('userId')
    localStorage.removeItem('highestScore')
    setIsAuthenticated(false)
    setUserData(null)
    // Recargar la página para limpiar el estado del juego
    window.location.reload()
  }

  const handlePlayAgain = () => {
    setGameOver(false)
    setFinalScore(0)
    setFinalLevel(1)
    
    // Reiniciar el juego usando tu sistema existente
    if (window.experience && window.experience.resetGameToFirstLevel) {
      window.experience.resetGameToFirstLevel()
    } else if (window.experience && window.experience.resetGame) {
      window.experience.resetGame()
    } else {
      window.location.reload()
    }
  }

  // Mostrar pantalla de carga mientras verifica autenticación
  if (checkingAuth) {
    return (
      <div id="loader-overlay">
        <div id="loader-text">Verificando sesión...</div>
      </div>
    )
  }

  // Mostrar pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess} 
        onPlayOffline={handlePlayOffline}
      />
    )
  }

  return (
    <>
      {loading && (
        <div id="loader-overlay">
          <div id="loader-bar" style={{ width: `${progress}%` }}></div>
          <div id="loader-text">Cargando... {progress}%</div>
        </div>
      )}
      
      {/* Información del usuario */}
      {!gameOver && (
        <div className="user-info-overlay">
          <div className="user-info">
            <span className="user-name">👤 {userData?.name}</span>
            <span className="user-score">🏆 {localStorage.getItem('highestScore') || userData?.highestScore || 0}</span>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Salir
            </button>
          </div>
        </div>
      )}
      
      {/* Pantalla de Game Over */}
      {gameOver && (
        <GameOverScreen
          score={finalScore}
          level={finalLevel}
          onPlayAgain={handlePlayAgain}
          onLogout={handleLogout}
          offlineMode={offlineMode}
        />
      )}
      
      <canvas ref={canvasRef} className="webgl" />
    </>
  )
}

export default App
