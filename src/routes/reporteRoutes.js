const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');
const { crearReporte, obtenerMisReportes } = require('../controllers/reporteController');

router.post('/', auth, upload.single('foto'), crearReporte);
router.get('/mis-reportes', auth, obtenerMisReportes);

module.exports = router;