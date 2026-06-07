const reporteModel = require('../models/reporteModel');

const crearNuevoReporte = async (usuario_id, body, file) => {
    if (!file) {
        const error = new Error('La fotografía del animal es obligatoria');
        error.statusCode = 400;
        throw error;
    }

    const { latitud, longitud, especie, color_dominante, referencias } = body;

    if (!latitud || !longitud || !especie || !color_dominante) {
        const error = new Error('Faltan datos obligatorios (GPS, especie o color)');
        error.statusCode = 400;
        throw error;
    }

    // Estructuramos los datos para enviarlos al modelo
    const datosReporte = {
        usuario_id,
        latitud,
        longitud,
        especie,
        color_dominante,
        referencias,
        url_archivo: file.path // URL pública generada por Cloudinary
    };

    return await reporteModel.crearReporteConFoto(datosReporte);
};

const obtenerMisReportes = async (usuario_id) => {
    return await reporteModel.obtenerHistorial(usuario_id);
};

module.exports = { crearNuevoReporte, obtenerMisReportes };