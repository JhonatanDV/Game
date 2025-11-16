const LevelConfig = require('../models/LevelConfig')

// Obtener configuración de un nivel
exports.getLevelConfig = async (req, res) => {
    try {
        const level = parseInt(req.query.level) || 1;
        
        let config = await LevelConfig.findOne({ level: level });
        
        // Si no existe configuración, crear una por defecto
        if (!config) {
            const defaultGoals = { 1: 10, 2: 15, 3: 20 };
            config = await LevelConfig.create({
                level: level,
                coinGoal: defaultGoals[level] || 10,
                enemyCount: level,
                description: `Nivel ${level}`
            });
        }
        
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener configuración del nivel', error });
    }
};

// Obtener todas las configuraciones
exports.getAllLevelConfigs = async (req, res) => {
    try {
        const configs = await LevelConfig.find().sort({ level: 1 });
        res.json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener configuraciones', error });
    }
};

// Actualizar configuración de un nivel
exports.updateLevelConfig = async (req, res) => {
    try {
        const { level, coinGoal, enemyCount, description } = req.body;
        
        const config = await LevelConfig.findOneAndUpdate(
            { level: level },
            { coinGoal, enemyCount, description },
            { new: true, upsert: true }
        );
        
        res.json({ message: 'Configuración actualizada', config });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar configuración', error });
    }
};

// Inicializar configuraciones por defecto
exports.initializeLevelConfigs = async (req, res) => {
    try {
        const defaultConfigs = [
            { level: 1, coinGoal: 10, enemyCount: 1, description: 'Nivel 1 - Tutorial' },
            { level: 2, coinGoal: 15, enemyCount: 3, description: 'Nivel 2 - Intermedio' },
            { level: 3, coinGoal: 20, enemyCount: 3, description: 'Nivel 3 - Avanzado' }
        ];
        
        for (const config of defaultConfigs) {
            await LevelConfig.findOneAndUpdate(
                { level: config.level },
                config,
                { upsert: true }
            );
        }
        
        res.json({ message: 'Configuraciones inicializadas correctamente', count: defaultConfigs.length });
    } catch (error) {
        res.status(500).json({ message: 'Error al inicializar configuraciones', error });
    }
};
