const patrocinadorService = require('../services/patrocinadorService');
const cloudinary = require('../config/cloudinary');

const obtenerConfiguracion = async (req, res) => {
    try {
        const datos = await patrocinadorService.obtenerDatosNegocio(req.usuario.id);
        return res.status(200).json(datos);
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al cargar los datos del negocio' });
    }
};

const guardarConfiguracion = async (req, res) => {
    try {
        const actualizado = await patrocinadorService.actualizarDatosNegocio(req.usuario.id, req.body);
        return res.status(200).json(actualizado);
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al guardar los datos del negocio' });
    }
};

const guardarLogo = async (req, res) => {
    try {
        const resultado = await patrocinadorService.actualizarLogo(req.usuario.id, req.file);
        return res.status(200).json({ mensaje: 'Logo actualizado correctamente', logo_url: resultado.logo_url });
    } catch (error) {
        // Si algo falla después de que Cloudinary ya subió el archivo, lo borramos para no dejar basura
        if (req.file && req.file.filename) {
            try { await cloudinary.uploader.destroy(req.file.filename); } catch (e) {}
        }
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al actualizar el logo' });
    }
};

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

const eliminarLogo = async (req, res, next) => {
    try {
        await patrocinadorService.eliminarLogo(req.usuario.id);
        res.json({ message: 'Logo eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    obtenerConfiguracion,
    guardarConfiguracion,
    guardarLogo,
    obtenerCatalogo,
    crearItemCatalogo,
    actualizarItemCatalogo,
    eliminarItemCatalogo,
    eliminarLogo
};