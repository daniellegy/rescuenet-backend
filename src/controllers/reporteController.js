const reporteService = require('../services/reporteService');
const cloudinary = require('../config/cloudinary');

const crearReporte = async (req, res) => {
    try {
        const resultado = await reporteService.crearNuevoReporte(req.usuario, req.body, req.file);
        return res.status(201).json({ mensaje: 'Reporte creado', ...resultado });
    } catch (error) {
        // Hacemos rollback del archivo en Cloudinary si falla la inserción en la base de datos (Ej: caída de BD)
        if (req.file && req.file.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (cloudErr) {
                console.error('Error al limpiar imagen huérfana (BD Fallida):', cloudErr);
            }
        }
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error interno' });
    }
};

const obtenerMisReportes = async (req, res) => {
    try {
        const historial = await reporteService.obtenerMisReportes(req.usuario.id);
        return res.status(200).json(historial);
    } catch (error) {
        return res.status(500).json({ error: 'Error al cargar el historial' });
    }
};

const obtenerReportesActivos = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const offset = (page - 1) * limit;

        const activos = await reporteService.obtenerActivos(limit, offset);
        return res.status(200).json(activos);
    } catch (error) {
        return res.status(500).json({ error: 'Error al cargar reportes activos' });
    }
};

const aceptarReporte = async (req, res) => {
    try {
        const reporte_id = req.params.id;
        const voluntario_id = req.usuario.id;
        await reporteService.aceptarRescate(reporte_id, voluntario_id);
        return res.status(200).json({ mensaje: 'Rescate aceptado exitosamente' });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al aceptar el rescate' });
    }
};

const obtenerMiRescateActivo = async (req, res) => {
    try {
        const voluntario_id = req.usuario.id;
        const rescate = await reporteService.obtenerRescateAsignado(voluntario_id);
        return res.status(200).json(rescate || null);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener tu rescate activo' });
    }
};

const abortarReporte = async (req, res) => {
    try {
        await reporteService.abortarRescateAsignado(req.params.id, req.usuario.id);
        return res.status(200).json({ mensaje: 'Rescate abortado, el reporte vuelve a estar activo.' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al abortar el rescate' });
    }
};

const actualizarProgreso = async (req, res) => {
    try {
        await reporteService.actualizarProgreso(req.params.id, req.usuario.id, req.body);
        return res.status(200).json({ mensaje: 'Progreso actualizado' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al actualizar progreso' });
    }
};

const finalizarReporte = async (req, res) => {
    try {
        await reporteService.finalizarRescateAsignado(req.params.id, req.usuario.id, req.body, req.file);
        return res.status(200).json({ mensaje: 'Rescate finalizado con éxito' });
    } catch (error) {
        // Limpiamos la evidencia en Cloudinary si falla finalizar
        if (req.file && req.file.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (cloudErr) {
                console.error('Error al limpiar evidencia huérfana:', cloudErr);
            }
        }
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al finalizar el rescate' });
    }
};

module.exports = { crearReporte, obtenerMisReportes, obtenerReportesActivos, aceptarReporte, obtenerMiRescateActivo, abortarReporte, actualizarProgreso, finalizarReporte };