const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload'); 
const auth = require('../middlewares/auth');

const { 
    crearReporte, obtenerMisReportes, obtenerReportesActivos, 
    aceptarReporte, obtenerMiRescateActivo, finalizarReporte, abortarReporte
} = require('../controllers/reporteController');

router.post('/', auth, upload.single('foto'), crearReporte);
router.get('/mis-reportes', auth, obtenerMisReportes);
router.get('/activos', auth, obtenerReportesActivos);
router.get('/mi-rescate', auth, obtenerMiRescateActivo);
router.put('/:id/aceptar', auth, aceptarReporte);
router.put('/:id/abortar', auth, abortarReporte); // NUEVA RUTA
router.put('/:id/finalizar', auth, finalizarReporte);

module.exports = router;