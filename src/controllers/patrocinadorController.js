const patrocinadorService = require('../services/patrocinadorService');

const obtenerCatalogo = async (req, res) => {
    try {
        const catalogo = await patrocinadorService.obtenerCatalogo(req.usuario.id);
        return res.status(200).json(catalogo);
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al cargar el catálogo' });
    }
};

const crearItemCatalogo = async (req, res) => {
    try {
        const nuevo = await patrocinadorService.crearItemCatalogo(req.usuario.id, req.body);
        return res.status(201).json(nuevo);
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al crear el ítem' });
    }
};

const actualizarItemCatalogo = async (req, res) => {
    try {
        const { id } = req.params;
        const actualizado = await patrocinadorService.actualizarItemCatalogo(req.usuario.id, id, req.body);
        return res.status(200).json(actualizado);
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al actualizar el ítem' });
    }
};

const eliminarItemCatalogo = async (req, res) => {
    try {
        const { id } = req.params;
        await patrocinadorService.eliminarItemCatalogo(req.usuario.id, id);
        return res.status(200).json({ mensaje: 'Item eliminado correctamente' });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al eliminar el ítem' });
    }
};

module.exports = { obtenerCatalogo, crearItemCatalogo, actualizarItemCatalogo, eliminarItemCatalogo };