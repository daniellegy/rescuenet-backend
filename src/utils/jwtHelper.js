const jwt = require('jsonwebtoken');
require('dotenv').config();

const generarToken = (usuario) => {
    const payload = {
        usuario: {
            id: usuario.id,
            rol_id: usuario.rol_id,
            nombre_completo: usuario.nombre_completo // 🌟 AHORA EL TOKEN LLEVARÁ EL NOMBRE
        }
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { generarToken };
