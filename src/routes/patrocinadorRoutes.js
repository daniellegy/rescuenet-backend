const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
    obtenerConfiguracion,
    guardarConfiguracion,
    guardarLogo,
    obtenerCatalogo,
    crearItemCatalogo,
    actualizarItemCatalogo,
    eliminarItemCatalogo
} = require('../controllers/patrocinadorController');

router.get('/configuracion', auth, obtenerConfiguracion);
router.put('/configuracion', auth, guardarConfiguracion);
router.put('/configuracion/logo', auth, upload.single('logo'), guardarLogo);

router.get('/catalogo', auth, obtenerCatalogo);
router.post('/catalogo', auth, crearItemCatalogo);
router.put('/catalogo/:id', auth, actualizarItemCatalogo);
router.delete('/catalogo/:id', auth, eliminarItemCatalogo);

module.exports = router;