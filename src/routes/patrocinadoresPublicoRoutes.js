const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { listar, obtenerCatalogo } = require('../controllers/patrocinadoresPublicoController');

// Requiere estar logueado (cualquier rol), pero NO restringe por dueño
// a diferencia de /api/patrocinador, que solo deja ver/editar el propio catálogo.
router.get('/', auth, listar);
router.get('/:id/catalogo', auth, obtenerCatalogo);

module.exports = router;