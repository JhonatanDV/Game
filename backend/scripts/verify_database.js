const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Block = require('../models/Block');

async function verifyDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Contar bloques por nivel
        const levels = await Block.aggregate([
            { $group: { _id: '$level', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log('\n📊 Bloques por nivel:');
        levels.forEach(level => {
            console.log(`   Nivel ${level._id}: ${level.count} bloques`);
        });

        // Total de bloques
        const total = await Block.countDocuments();
        console.log(`\n📦 Total de bloques: ${total}`);

        // Mostrar algunos ejemplos
        const samples = await Block.find().limit(5).select('name x y z level -_id');
        console.log('\n🔍 Ejemplos de bloques:');
        samples.forEach(block => {
            console.log(`   ${block.name} - Nivel ${block.level} - (${block.x.toFixed(2)}, ${block.y.toFixed(2)}, ${block.z.toFixed(2)})`);
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

verifyDatabase();
