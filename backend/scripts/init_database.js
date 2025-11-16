const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');

// Modelos
const Block = require('../models/Block');
const User = require('../models/User');

async function initDatabase() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Eliminar todas las colecciones
        console.log('🗑️  Limpiando base de datos...');
        await Block.deleteMany({});
        await User.deleteMany({});
        console.log('✅ Base de datos limpiada');

        // Cargar bloques desde archivos JSON
        const blockFiles = [
            'toy_car_blocks.json',
            'toy_car_blocks2.json',
            'toy_car_blocks3.json'
        ];

        let totalBlocks = 0;

        for (const fileName of blockFiles) {
            const filePath = path.join(__dirname, '../data', fileName);
            
            if (fs.existsSync(filePath)) {
                const blocksData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                
                // Asegurar que cada bloque tenga el campo level
                const blocksWithLevel = Array.isArray(blocksData) 
                    ? blocksData.map(block => ({
                        ...block,
                        level: block.level || 1
                    }))
                    : blocksData;

                const blocks = Array.isArray(blocksWithLevel) ? blocksWithLevel : [blocksWithLevel];
                await Block.insertMany(blocks);
                totalBlocks += blocks.length;
                console.log(`✅ ${fileName}: ${blocks.length} bloques insertados`);
            } else {
                console.log(`⚠️  Archivo no encontrado: ${fileName}`);
            }
        }

        console.log(`\n📦 Total de bloques insertados: ${totalBlocks}`);
        console.log('🎉 Base de datos inicializada correctamente');

        // Cerrar conexión
        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error('❌ Error al inicializar la base de datos:', err);
        process.exit(1);
    }
}

initDatabase();
