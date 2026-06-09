const reporteModel = require('../models/reporteModel');

const crearNuevoReporte = async (usuario_id, body, file) => {
    if (!file) {
        const error = new Error('La fotografía del animal es obligatoria');
        error.statusCode = 400;
        throw error;
    }

    // Extraemos todos los campos nuevos enviados por la app de tu compañero
    const { 
        latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, raza_aprox, caracteristicas_especiales, notas_adicionales 
    } = body;

    // Validación básica
    if (!latitud || !longitud || !especie || !color_dominante) {
        const error = new Error('Faltan datos obligatorios (GPS, especie o color)');
        error.statusCode = 400;
        throw error;
    }

    const datosReporte = {
        usuario_id,
        latitud,
        longitud,
        especie,
        color_dominante,
        sexo,
        edad_aprox,
        tamano,
        raza_aprox,
        caracteristicas_especiales,
        notas_adicionales,
        url_archivo: file.path
    };

    return await reporteModel.crearReporteConFoto(datosReporte);
};

const obtenerMisReportes = async (usuario_id) => {
    return await reporteModel.obtenerHistorial(usuario_id);
};

module.exports = { crearNuevoReporte, obtenerMisReportes };