const authService = require('../services/authService');

const registrarUsuario = async (req, res) => {
    try {
        const { nombre_completo, telefono, email, password, rol_id } = req.body;
        
        if (!nombre_completo || !telefono || !email || !password || !rol_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const resultado = await authService.registrarUsuario(req.body);
        
        return res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            ...resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const mensaje = status === 500 ? 'Error interno del servidor' : error.message;
        if (status === 500) console.error('Error en registro:', error);
        
        return res.status(status).json({ error: mensaje });
    }
};

const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Por favor ingresa correo y contraseña' });
        }

        const resultado = await authService.iniciarSesion(email, password);
        
        return res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            ...resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const mensaje = status === 500 ? 'Error interno del servidor' : error.message;
        if (status === 500) console.error('Error en login:', error);
        
        return res.status(status).json({ error: mensaje });
    }
};

module.exports = { registrarUsuario, iniciarSesion };