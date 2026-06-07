const reporteService = require('../services/reporteService');

const crearReporte = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        const resultado = await reporteService.crearNuevoReporte(usuario_id, req.body, req.file);

        return res.status(201).json({
            mensaje: 'Reporte de rescate creado con éxito',
            ...resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const mensaje = status === 500 ? 'Error interno al procesar el reporte' : error.message;
        if (status === 500) console.error('Error al guardar reporte:', error);
        
        return res.status(status).json({ error: mensaje });
    }
};

const obtenerMisReportes = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        const historial = await reporteService.obtenerMisReportes(usuario_id);
        
        return res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({ error: 'Error interno al cargar el historial' });
    }
};

module.exports = { crearReporte, obtenerMisReportes };