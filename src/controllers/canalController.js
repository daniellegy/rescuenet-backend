const canalService = require('../services/canalService');
const socketIo = require('../config/socket');

const obtenerEstadoCanal = async (req, res) => {
    try {
        const estado = await canalService.obtenerEstado(req.params.id, req.usuario.id);
        return res.status(200).json(estado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al obtener el estado del canal' });
    }
};

const listarMensajesCanal = async (req, res) => {
    try {
        const mensajes = await canalService.listarMensajes(req.params.id, req.usuario.id);
        return res.status(200).json(mensajes);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al obtener los mensajes' });
    }
};

const enviarMensajeCanal = async (req, res) => {
    try {
        // Guardamos el mensaje en la base de datos
        const mensaje = await canalService.enviarMensaje(req.params.id, req.usuario.id, req.body.contenido);
        
        // Emitimos el mensaje en tiempo real a la "sala" del reporte
        socketIo.getIO().to(`canal_${req.params.id}`).emit('nuevo_mensaje', mensaje);

        return res.status(201).json(mensaje);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al enviar el mensaje' });
    }
};

const cerrarCanalManual = async (req, res) => {
    try {
        const resultado = await canalService.cerrarCanalManual(req.params.id, req.usuario.id);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al cerrar el canal' });
    }
};

const activarCanalManual = async (req, res) => {
    try {
        const resultado = await canalService.activarCanalManual(req.params.id, req.usuario.id);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Error al activar el canal' });
    }
};

module.exports = { obtenerEstadoCanal, listarMensajesCanal, enviarMensajeCanal, cerrarCanalManual, activarCanalManual };