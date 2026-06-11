const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload'); 
const auth = require('../middlewares/auth');
const { crearReporte, obtenerMisReportes, obtenerReportesActivos, aceptarReporte } = require('../controllers/reporteController');

router.post('/', auth, upload.single('foto'), crearReporte);
router.get('/mis-reportes', auth, obtenerMisReportes);
router.get('/activos', auth, obtenerReportesActivos); // NUEVA
router.put('/:id/aceptar', auth, aceptarReporte);     // NUEVA

module.exports = router;