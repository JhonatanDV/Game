const User = require('../models/User');

// Guardar nuevo puntaje
exports.saveScore = async (req, res) => {
    try {
        const { score, level } = req.body;
        const userId = req.user.id;

        // Validar que el puntaje sea un número válido
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({
                success: false,
                message: 'El puntaje debe ser un número válido y positivo'
            });
        }

        // Encontrar al usuario
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Agregar nuevo puntaje
        user.scores.push({
            score,
            level: level || 1,
            date: new Date()
        });

        // Actualizar el puntaje más alto si es necesario
        user.updateHighestScore(score);

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Puntaje guardado exitosamente',
            data: {
                score,
                level: level || 1,
                highestScore: user.highestScore,
                isNewRecord: score === user.highestScore
            }
        });
    } catch (error) {
        console.error('Error al guardar puntaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar puntaje',
            error: error.message
        });
    }
};

// Obtener puntajes del usuario autenticado
exports.getMyScores = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('name scores highestScore');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Ordenar puntajes por fecha descendente
        const sortedScores = user.scores.sort((a, b) => b.date - a.date);

        res.status(200).json({
            success: true,
            data: {
                name: user.name,
                highestScore: user.highestScore,
                scores: sortedScores,
                totalGames: sortedScores.length
            }
        });
    } catch (error) {
        console.error('Error al obtener puntajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener puntajes',
            error: error.message
        });
    }
};

// Obtener tabla de clasificación (leaderboard)
exports.getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Obtener los usuarios con los puntajes más altos
        const users = await User.find()
            .select('name highestScore createdAt')
            .sort({ highestScore: -1 })
            .limit(limit);

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            name: user.name,
            highestScore: user.highestScore,
            userId: user._id
        }));

        res.status(200).json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error al obtener leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tabla de clasificación',
            error: error.message
        });
    }
};

// Obtener estadísticas del usuario
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('name scores highestScore');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Calcular estadísticas
        const totalGames = user.scores.length;
        const totalScore = user.scores.reduce((sum, score) => sum + score.score, 0);
        const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

        // Encontrar el puntaje más bajo
        const lowestScore = totalGames > 0 
            ? Math.min(...user.scores.map(s => s.score))
            : 0;

        // Últimos 5 puntajes
        const recentScores = user.scores
            .sort((a, b) => b.date - a.date)
            .slice(0, 5)
            .map(s => ({ score: s.score, level: s.level, date: s.date }));

        res.status(200).json({
            success: true,
            data: {
                name: user.name,
                stats: {
                    totalGames,
                    highestScore: user.highestScore,
                    lowestScore,
                    averageScore,
                    totalScore
                },
                recentScores
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};
