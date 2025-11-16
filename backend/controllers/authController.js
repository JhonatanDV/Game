const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generar token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_default', {
        expiresIn: '30d'
    });
};

// Registrar nuevo usuario
exports.register = async (req, res) => {
    try {
        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { name, email, password } = req.body;

        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false,
                message: 'El email ya está registrado' 
            });
        }

        // Crear nuevo usuario
        const user = await User.create({
            name,
            email,
            password
        });

        // Generar token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                highestScore: user.highestScore,
                token
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al registrar usuario',
            error: error.message 
        });
    }
};

// Iniciar sesión
exports.login = async (req, res) => {
    try {
        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // Verificar si el usuario existe
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Credenciales inválidas' 
            });
        }

        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Credenciales inválidas' 
            });
        }

        // Generar token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                highestScore: user.highestScore,
                token
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message 
        });
    }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
    try {
        // req.user viene del middleware de autenticación
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }

        // Ordenar puntajes por fecha descendente
        user.scores.sort((a, b) => b.date - a.date);

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                highestScore: user.highestScore,
                scores: user.scores,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener perfil',
            error: error.message 
        });
    }
};

// Verificar si el token es válido
exports.verifyToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                highestScore: user.highestScore
            }
        });
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al verificar token',
            error: error.message 
        });
    }
};
