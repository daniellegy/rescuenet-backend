const reporteService = require('../services/reporteService');

const crearReporte = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        const resultado = await reporteService.crearNuevoReporte(usuario_id, req.body, req.file);
        return res.status(201).json({ mensaje: 'Reporte creado', ...resultado });
    } catch (error) {
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
        const activos = await reporteService.obtenerActivos();
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
        return res.status(500).json({ error: 'Error al procesar la aceptación' });
    }
};

module.exports = { crearReporte, obtenerMisReportes, obtenerReportesActivos, aceptarReporte };