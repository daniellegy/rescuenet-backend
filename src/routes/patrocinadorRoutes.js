const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    obtenerCatalogo,
    crearItemCatalogo,
    actualizarItemCatalogo,
    eliminarItemCatalogo
} = require('../controllers/patrocinadorController');

router.get('/catalogo', auth, obtenerCatalogo);
router.post('/catalogo', auth, crearItemCatalogo);
router.put('/catalogo/:id', auth, actualizarItemCatalogo);
router.delete('/catalogo/:id', auth, eliminarItemCatalogo);

module.exports = router;