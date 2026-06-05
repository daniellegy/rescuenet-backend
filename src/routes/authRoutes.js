const express = require('express');
const router = express.Router();
const { registrarUsuario } = require('../controllers/authController');

// Ruta: POST /api/auth/register
router.post('/register', registrarUsuario);

module.exports = router;