const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

module.exports = async function(req, res, next) {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No hay token, permiso denegado' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
        // Verificar la firma y expiración del token
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Extraemos el id del usuario contenido en el payload
        const query = 'SELECT activo FROM usuarios WHERE id = $1';
        const { rows } = await pool.query(query, [cifrado.usuario.id]);
        
        // Si el usuario no existe o fue dado de baja (activo === false)
        if (rows.length === 0 || rows[0].activo === false || rows[0].activo === 'f') {
            return res.status(403).json({ error: 'Acceso denegado. La cuenta ha sido desactivada o eliminada.' });
        }
        
        // Inyectar los datos del usuario en la petición
        req.usuario = cifrado.usuario;
        next();
    } catch (error) {
        // Diferenciar entre token expirado o manipulado
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.' });
        }
        res.status(401).json({ error: 'Token inválido o corrupto.' });
    }
};