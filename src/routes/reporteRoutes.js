const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary'); // El middleware de Multer/Cloudinary
const auth = require('../middlewares/auth'); // El middleware del JWT
const { crearReporte, obtenerMisReportes } = require('../controllers/reporteController');

// POST /api/reportes
// El orden importa: 1. Verifica usuario -> 2. Sube foto -> 3. Guarda en Base de Datos
router.post('/', auth, upload.single('foto'), crearReporte);
router.get('/mis-reportes', auth, obtenerMisReportes);

module.exports = router;