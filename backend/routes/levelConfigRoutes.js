const express = require('express')
const router = express.Router()
const levelConfigController = require('../controllers/levelConfigController')

// Rutas para configuración de niveles
router.get('/config', levelConfigController.getLevelConfig)
router.get('/configs', levelConfigController.getAllLevelConfigs)
router.post('/config', levelConfigController.updateLevelConfig)
router.post('/init', levelConfigController.initializeLevelConfigs)

module.exports = router
