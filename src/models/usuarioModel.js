const pool = require('../config/database');

const buscarPorEmail = async (email) => {
    const query = 'SELECT id, rol_id, password_hash, nombre_completo FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
};

const crearUsuario = async (rol_id, nombre_completo, telefono, email, passwordHash, curp) => {
    const insertQuery = `
        INSERT INTO usuarios (rol_id, nombre_completo, telefono, email, password_hash, curp)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, rol_id, nombre_completo, email;
    `;
    const values = [rol_id, nombre_completo, telefono, email, passwordHash, curp || null];
    const result = await pool.query(insertQuery, values);
    return result.rows[0];
};

module.exports = { buscarPorEmail, crearUsuario };