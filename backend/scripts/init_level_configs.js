const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const LevelConfig = require('../models/LevelConfig')

async function initializeLevelConfigs() {
    try {
        console.log('🔄 Conectando a MongoDB...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Conectado a MongoDB')

        const defaultConfigs = [
            { 
                level: 1, 
                coinGoal: 10, 
                enemyCount: 1, 
                description: 'Nivel 1 - Tutorial: Familiarízate con los controles' 
            },
            { 
                level: 2, 
                coinGoal: 15, 
                enemyCount: 3, 
                description: 'Nivel 2 - Intermedio: Mayor desafío con más enemigos' 
            },
            { 
                level: 3, 
                coinGoal: 20, 
                enemyCount: 3, 
                description: 'Nivel 3 - Avanzado: Enfréntate al Giant Mutant' 
            }
        ]

        console.log('🔄 Inicializando configuraciones de niveles...')
        
        for (const config of defaultConfigs) {
            const result = await LevelConfig.findOneAndUpdate(
                { level: config.level },
                config,
                { upsert: true, new: true }
            )
            console.log(`✅ Nivel ${config.level}: coinGoal=${config.coinGoal}, enemyCount=${config.enemyCount}`)
        }

        console.log('✅ Configuraciones de niveles inicializadas correctamente')
        
        // Mostrar todas las configuraciones
        const allConfigs = await LevelConfig.find().sort({ level: 1 })
        console.log('\n📋 Configuraciones actuales:')
        allConfigs.forEach(config => {
            console.log(`   Nivel ${config.level}: ${config.coinGoal} monedas, ${config.enemyCount} enemigos`)
        })

        await mongoose.connection.close()
        console.log('\n👋 Desconectado de MongoDB')
        process.exit(0)
        
    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }
}

initializeLevelConfigs()
