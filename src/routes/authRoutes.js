const express = require('express');
const router = express.Router();
const { registrarUsuario, iniciarSesion, obtenerPerfil, actualizarPerfil } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// Ruta: POST /api/auth/register
router.post('/register', registrarUsuario);

// Ruta: POST /api/auth/login
router.post('/login', iniciarSesion);

// Ruta: GET /api/auth/perfil
router.get('/perfil', authMiddleware, obtenerPerfil);

router.put('/perfil', authMiddleware, actualizarPerfil);

module.exports = router;