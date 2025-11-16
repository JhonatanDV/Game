const express = require('express');
const scoreController = require('../controllers/scoreController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

/**
 * @route   POST /api/scores
 * @desc    Guardar un nuevo puntaje
 * @access  Private
 */
router.post('/', scoreController.saveScore);

/**
 * @route   GET /api/scores/my-scores
 * @desc    Obtener puntajes del usuario autenticado
 * @access  Private
 */
router.get('/my-scores', scoreController.getMyScores);

/**
 * @route   GET /api/scores/leaderboard
 * @desc    Obtener tabla de clasificación
 * @access  Private
 */
router.get('/leaderboard', scoreController.getLeaderboard);

/**
 * @route   GET /api/scores/stats
 * @desc    Obtener estadísticas del usuario
 * @access  Private
 */
router.get('/stats', scoreController.getStats);

module.exports = router;
