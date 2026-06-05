const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // 1. Extraer el token de los headers (formato: "Bearer eyJhbGci...")
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No hay token, permiso denegado' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        // 2. Verificar la firma del token con nuestra clave secreta
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Inyectar los datos del usuario en la petición para usarlos en el controlador
        req.usuario = cifrado.usuario;
        next(); // Permitir que la petición continúe
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};