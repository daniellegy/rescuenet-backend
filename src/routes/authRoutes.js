const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const upload = require('../middlewares/upload');
const rateLimit = require('express-rate-limit');

// Límite de seguridad para evitar ataques de fuerza bruta
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Limita a 10 intentos fallidos por IP
    message: { error: 'Demasiados intentos desde esta IP, por favor intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const { 
    registrarUsuario, 
    iniciarSesion, 
    obtenerPerfil, 
    actualizarPerfil, 
    verificarToken,
    eliminarCuenta,
    actualizarFoto,
    obtenerEstadisticas
} = require('../controllers/authController');

const authMiddleware = require('../middlewares/auth');

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Datos de entrada inválidos', detalles: errors.array() });
    }
    next();
};

const validacionRegistro = [
    body('nombre_completo').notEmpty().withMessage('El nombre completo es obligatorio').isString(),
    body('telefono').notEmpty().withMessage('El teléfono es obligatorio').matches(/^[0-9\-()+\s]{10,15}$/).withMessage('Formato de teléfono inválido'),
    body('email').isEmail().withMessage('Formato de correo inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol_id').isIn([1, 2]).withMessage('Rol inválido'),
    body('curp')
        .if(body('rol_id').equals('2'))
        .matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/).withMessage('El CURP proporcionado no tiene un formato válido.'),
    validarCampos
];

const validacionLogin = [
    body('email').isEmail().withMessage('Por favor ingresa un correo válido'),
    body('password').notEmpty().withMessage('Por favor ingresa tu contraseña'),
    validarCampos
];

const validacionActualizarPerfil = [
    body('telefono').optional().matches(/^[0-9\-()+\s]{10,15}$/).withMessage('Formato de teléfono inválido'),
    body('email').optional().isEmail().withMessage('Formato de correo inválido'),
    body('role').optional().isIn([1, 2]).withMessage('Acción denegada. Rol inválido.'),
    body('curp').optional().matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/).withMessage('El formato del CURP proporcionado es inválido.'),
    body('perfil_privado').optional().isBoolean().withMessage('El valor de privacidad debe ser booleano.'), // <-- NUEVO
    validarCampos
];

router.post('/register', authLimiter, validacionRegistro, registrarUsuario);
router.post('/login', authLimiter, validacionLogin, iniciarSesion);

router.get('/verify', authMiddleware, verificarToken);
router.get('/perfil', authMiddleware, obtenerPerfil);
router.put('/perfil', authMiddleware, validacionActualizarPerfil, actualizarPerfil);
router.delete('/perfil', authMiddleware, eliminarCuenta);

router.put('/perfil/foto', authMiddleware, upload.single('foto'), actualizarFoto);
router.get('/usuario/:id/estadisticas', authMiddleware, obtenerEstadisticas);

module.exports = router;