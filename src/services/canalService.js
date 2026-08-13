// services/canalService.js
const canalModel = require('../models/canalModel');
const pool = require('../config/database');
const { getMessaging } = require('firebase-admin/messaging');

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
        throw { statusCode: 400, message: 'El canal de comunicación no está activo para este caso.' };
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
    const mensaje = await canalModel.crearMensaje(reporte_id, usuario_id, contenido.trim());

    try {
        const query = `
            SELECT u.fcm_token FROM reportes r
            JOIN usuarios u ON (
                CASE WHEN r.usuario_reportador_id = $2 THEN r.usuario_rescatista_id ELSE r.usuario_reportador_id END = u.id
            )
            WHERE r.id = $1 AND u.fcm_token IS NOT NULL
        `;
        const res = await pool.query(query, [reporte_id, usuario_id]);
        if (res.rows.length > 0) {
            await getMessaging().send({
                token: res.rows[0].fcm_token,
                notification: {
                    title: `Mensaje de ${mensaje.nombre_autor}`,
                    body: contenido.length > 30 ? contenido.substring(0, 30) + '...' : contenido
                },
                data: { reporte_id: String(reporte_id), tipo: 'chat' },
                android: { priority: 'high' },
                apns: { payload: { aps: { sound: 'default', contentAvailable: true } } }
            });
        }
    } catch (err) {
        console.error("Error push en chat:", err);
    }
    return mensaje;
};

const cerrarCanalManual = async (reporte_id, usuario_id) => {
    const esParticipante = await canalModel.esParticipante(reporte_id, usuario_id);
    if (!esParticipante) throw { statusCode: 403, message: 'No tienes acceso a este caso.' };
    const cerrado = await canalModel.cerrarCanal(reporte_id);
    if (!cerrado) throw { statusCode: 400, message: 'El canal ya estaba cerrado o inactivo.' };
    return { mensaje: 'Canal de comunicación cerrado.' };
};

const activarCanalManual = async (reporte_id, usuario_id) => {
    const esReportador = await canalModel.esReportador(reporte_id, usuario_id);
    if (!esReportador) throw { statusCode: 403, message: 'Solo el reportante puede activar el canal.' };
    const activado = await canalModel.activarCanalManualmente(reporte_id);
    if (!activado) throw { statusCode: 400, message: 'El canal ya estaba activado.' };
    return { mensaje: 'Canal de comunicación activado.' };
};

module.exports = { obtenerEstado, listarMensajes, enviarMensaje, cerrarCanalManual, activarCanalManual };