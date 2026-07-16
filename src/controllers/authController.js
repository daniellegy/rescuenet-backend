const authService = require('../services/authService');
const usuarioModel = require('../models/usuarioModel');

const registrarUsuario = async (req, res) => {
    try {
        const resultado = await authService.registrarUsuario(req.body);
        return res.status(201).json({ mensaje: 'Usuario registrado exitosamente', ...resultado });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error interno del servidor' });
    }
};

const iniciarSesion = async (req, res) => {
    try {
        const resultado = await authService.iniciarSesion(req.body.email, req.body.password);

        return res.status(200).json({ mensaje: 'Inicio de sesión exitoso', ...resultado });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error al iniciar sesión' });
    }
};

/*

const verificarToken = async (req, res) => {
    try {
        return res.status(200).json({ mensaje: 'Token válido', usuario: req.usuario });
    } catch (error) {
        // ✅ SOLUCIÓN: Imprimimos el error en consola para depurar y usamos sus datos
        console.error('Error en verificarToken:', error);
        
        return res.status(500).json({ 
            error: 'Error al verificar la sesión',
            detalle: error.message // O simplemente manejarlo mandando el error real
        });
    }
};

*/
const verificarToken = async (req, res) => {
    try {
        return res.status(200).json({ mensaje: 'Token válido', usuario: req.usuario });
    } catch (error) {
        console.error('Error en verificarToken:', error);
        return res.status(500).json({ error: 'Error al verificar la sesión', detalle: error.message});
    }
};


const obtenerPerfil = async (req, res) => {
    try {
        const perfil = await authService.obtenerPerfil(req.usuario.id);
        return res.status(200).json(perfil);
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error interno al cargar el perfil' });
    }
};

const actualizarPerfil = async (req, res) => {
    try {
        const perfil = await authService.actualizarPerfil(req.usuario.id, req.body);
        
        const { radio_notificaciones, fcm_token } = req.body;
        if (radio_notificaciones !== undefined || fcm_token !== undefined) {
             const extras = await usuarioModel.actualizarPreferencias(req.usuario.id, radio_notificaciones, fcm_token);
             perfil.radio_notificaciones = extras.radio_notificaciones || perfil.radio_notificaciones;
             // MODIFICADO: Mapea de vuelta el fcm_token actualizado (o eliminado) para sincronizar el estado de la app
             perfil.fcm_token = extras.fcm_token !== undefined ? extras.fcm_token : perfil.fcm_token;
        }

        return res.status(200).json({ mensaje: 'Perfil actualizado exitosamente', usuario: perfil });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Error interno al actualizar perfil' });
    }
};


const eliminarCuenta = async (req, res) => {
    try {
        // Obtenemos el ID desde el objeto 'req.usuario' inyectado por tu 'authMiddleware'
        const usuarioId = req.usuario.id;

        // Desactivar el usuario en la base de datos poniendo 'activo = false'
        // Puedes mandar a llamar una función dedicada en tu modelo:
        await usuarioModel.desactivarUsuario(usuarioId);

        return res.status(200).json({ 
            mensaje: 'Cuenta dada de baja exitosamente en los servidores.' 
        });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ 
            error: error.message || 'Error interno al intentar eliminar la cuenta' 
        });
    }
};

module.exports = { registrarUsuario, iniciarSesion, verificarToken, obtenerPerfil, actualizarPerfil, eliminarCuenta };