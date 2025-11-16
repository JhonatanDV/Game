const mongoose = require('mongoose')

const levelConfigSchema = new mongoose.Schema({
    level: { type: Number, required: true, unique: true },
    coinGoal: { type: Number, required: true, default: 10 },
    enemyCount: { type: Number, default: 1 },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LevelConfig', levelConfigSchema)
