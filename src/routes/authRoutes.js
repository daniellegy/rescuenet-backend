const express = require('express');
const router = express.Router();
const { 
    registrarUsuario, 
    iniciarSesion, 
    obtenerPerfil, 
    actualizarPerfil, 
    verificarToken // <-- Solución: La función ahora está importada correctamente
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// Ruta: POST /api/auth/register
router.post('/register', registrarUsuario);

// Ruta: POST /api/auth/login
router.post('/login', iniciarSesion);

// Ruta: GET /api/auth/verify
router.get('/verify', authMiddleware, verificarToken);

// Ruta: GET /api/auth/perfil
router.get('/perfil', authMiddleware, obtenerPerfil);

// Ruta: PUT /api/auth/perfil
router.put('/perfil', authMiddleware, actualizarPerfil);

module.exports = router;