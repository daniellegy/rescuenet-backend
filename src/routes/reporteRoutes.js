/*const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const upload = require('../middlewares/upload'); 
const auth = require('../middlewares/auth');
const cloudinary = require('../config/cloudinary'); // Requerimos cloudinary para limpiar archivos huérfanos
const { crearReporte, obtenerMisReportes, obtenerReportesActivos, aceptarReporte, obtenerMiRescateActivo, finalizarReporte, abortarReporte, actualizarProgreso, activarCanalManual } = require('../controllers/canalController');
const { obtenerEstadoCanal, listarMensajesCanal, enviarMensajeCanal, cerrarCanalManual } = require('../controllers/canalController');

const validarCreacionReporte = [
    body('especie').isIn(['Perro', 'Gato', 'Silvestre']).withMessage('Especie inválida'),
    body('latitud').isFloat({ min: -90, max: 90 }).withMessage('Latitud fuera de rango'),
    body('longitud').isFloat({ min: -180, max: 180 }).withMessage('Longitud fuera de rango'),
    body('urgencia').optional().isIn(['alta', 'media', 'baja']).withMessage('Urgencia fuera de rango'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Si la validación falla, eliminamos la imagen recién subida a Cloudinary
            if (req.file && req.file.filename) {
                try {
                    await cloudinary.uploader.destroy(req.file.filename);
                } catch (cloudErr) {
                    console.error('Error al eliminar archivo huérfano (Validación):', cloudErr);
                }
            }
            return res.status(400).json({ error: 'Datos de entrada inválidos', detalles: errors.array() });
        }
        next();
    }
];

router.post('/', auth, upload.single('foto'), validarCreacionReporte, crearReporte);
router.get('/mis-reportes', auth, obtenerMisReportes);
router.get('/activos', auth, obtenerReportesActivos);
router.get('/mi-rescate', auth, obtenerMiRescateActivo);
router.put('/:id/aceptar', auth, aceptarReporte);
router.put('/:id/abortar', auth, abortarReporte);
router.put('/:id/progreso', auth, actualizarProgreso);
router.put('/:id/finalizar', auth, upload.single('evidencia'), finalizarReporte);
router.get('/:id/canal', auth, obtenerEstadoCanal);
router.get('/:id/canal/mensajes', auth, listarMensajesCanal);
router.post('/:id/canal/mensajes', auth, enviarMensajeCanal);
router.put('/:id/canal/cerrar', auth, cerrarCanalManual);
router.put('/:id/canal/activar', auth, activarCanalManual);

module.exports = router;*/

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const upload = require('../middlewares/upload'); 
const auth = require('../middlewares/auth');
const cloudinary = require('../config/cloudinary'); 

// ===== CORRECCIÓN: Funciones del reporte van a reporteController =====
const { 
    crearReporte, 
    obtenerMisReportes, 
    obtenerReportesActivos, 
    aceptarReporte, 
    obtenerMiRescateActivo, 
    finalizarReporte, 
    abortarReporte, 
    actualizarProgreso 
} = require('../controllers/reporteController');

// ===== CORRECCIÓN: Funciones del chat van a canalController =====
const { 
    obtenerEstadoCanal, 
    listarMensajesCanal, 
    enviarMensajeCanal, 
    cerrarCanalManual, 
    activarCanalManual 
} = require('../controllers/canalController');

const validarCreacionReporte = [
    body('especie').isIn(['Perro', 'Gato', 'Silvestre']).withMessage('Especie inválida'),
    body('latitud').isFloat({ min: -90, max: 90 }).withMessage('Latitud fuera de rango'),
    body('longitud').isFloat({ min: -180, max: 180 }).withMessage('Longitud fuera de rango'),
    body('urgencia').optional().isIn(['alta', 'media', 'baja']).withMessage('Urgencia fuera de rango'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file && req.file.filename) {
                try {
                    await cloudinary.uploader.destroy(req.file.filename);
                } catch (cloudErr) {
                    console.error('Error al eliminar archivo huérfano (Validación):', cloudErr);
                }
            }
            return res.status(400).json({ error: 'Datos de entrada inválidos', detalles: errors.array() });
        }
        next();
    }
];

// Rutas principales del reporte
router.post('/', auth, upload.single('foto'), validarCreacionReporte, crearReporte);
router.get('/mis-reportes', auth, obtenerMisReportes);
router.get('/activos', auth, obtenerReportesActivos);
router.get('/mi-rescate', auth, obtenerMiRescateActivo);
router.put('/:id/aceptar', auth, aceptarReporte);
router.put('/:id/abortar', auth, abortarReporte);
router.put('/:id/progreso', auth, actualizarProgreso);
router.put('/:id/finalizar', auth, upload.single('evidencia'), finalizarReporte);

// Rutas asociadas al canal de comunicación
router.get('/:id/canal', auth, obtenerEstadoCanal);
router.get('/:id/canal/mensajes', auth, listarMensajesCanal);
router.post('/:id/canal/mensajes', auth, enviarMensajeCanal);
router.put('/:id/canal/cerrar', auth, cerrarCanalManual);
router.put('/:id/canal/activar', auth, activarCanalManual);

module.exports = router;