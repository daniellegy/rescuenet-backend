const canalModel = require('../models/canalModel');

const obtenerEstado = async (reporte_id, usuario_id) => {
    const esParticipante = await canalModel.esParticipante(reporte_id, usuario_id);
    if (!esParticipante) throw { statusCode: 403, message: 'No tienes acceso a este caso.' };

    const estado = await canalModel.obtenerEstadoCanal(reporte_id);
    if (!estado) throw { statusCode: 404, message: 'Reporte no encontrado.' };
    return estado;
};

const listarMensajes = async (reporte_id, usuario_id) => {
    const esParticipante = await canalModel.esParticipante(reporte_id, usuario_id);
    if (!esParticipante) throw { statusCode: 403, message: 'No tienes acceso a este caso.' };

    const estado = await canalModel.obtenerEstadoCanal(reporte_id);
    if (!estado || estado.canal_comunicacion_estado === 'inactivo') {
        throw { statusCode: 400, message: 'El canal de comunicación aún no está activo para este caso.' };
    }
    return await canalModel.obtenerMensajes(reporte_id);
};

const enviarMensaje = async (reporte_id, usuario_id, contenido) => {
    if (!contenido || !contenido.trim()) {
        throw { statusCode: 400, message: 'El mensaje no puede estar vacío.' };
    }

    const esParticipante = await canalModel.esParticipante(reporte_id, usuario_id);
    if (!esParticipante) throw { statusCode: 403, message: 'No tienes acceso a este caso.' };

    const estado = await canalModel.obtenerEstadoCanal(reporte_id);
    if (!estado || estado.canal_comunicacion_estado !== 'activo') {
        throw { statusCode: 400, message: 'El canal de comunicación no está activo.' };
    }

    return await canalModel.crearMensaje(reporte_id, usuario_id, contenido.trim());
};

const cerrarCanalManual = async (reporte_id, usuario_id) => {
    const esParticipante = await canalModel.esParticipante(reporte_id, usuario_id);
    if (!esParticipante) throw { statusCode: 403, message: 'No tienes acceso a este caso.' };

    const cerrado = await canalModel.cerrarCanal(reporte_id);
    if (!cerrado) throw { statusCode: 400, message: 'El canal ya estaba cerrado o inactivo.' };
    return { mensaje: 'Canal de comunicación cerrado.' };
};

// =========================================================================
// ZONA C: NUEVA FUNCIÓN PARA ACTIVAR EL CANAL MANUALMENTE DESDE EL SERVICIO
// =========================================================================
const activarCanalManual = async (reporte_id, usuario_id) => {
    // Valida que únicamente el reportante inicial pueda abrir el canal a posteriori
    const esReportador = await canalModel.esReportador(reporte_id, usuario_id);
    if (!esReportador) throw { statusCode: 403, message: 'Solo el reportante puede activar el canal.' };

    const activado = await canalModel.activarCanalManualmente(reporte_id);
    if (!activado) throw { statusCode: 400, message: 'El canal ya estaba activado.' };
    return { mensaje: 'Canal de comunicación activado.' };
};

module.exports = { obtenerEstado, listarMensajes, enviarMensaje, cerrarCanalManual, activarCanalManual};