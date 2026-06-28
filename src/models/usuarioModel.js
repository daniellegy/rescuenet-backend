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

const obtenerPerfilPorId = async (id) => {
    const query = 'SELECT id, rol_id AS role, nombre_completo, telefono, email, curp FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

const actualizarPerfil = async (client, id, telefono, email, role, curp) => {
    const updateQuery = `
        UPDATE usuarios 
        SET 
            telefono = COALESCE($1, telefono),
            email = COALESCE($2, email),
            rol_id = COALESCE($3, rol_id),
            curp = COALESCE($4, curp),
            actualizado_el = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, rol_id AS role, nombre_completo, telefono, email, curp;
    `;
    const values = [telefono || null, email || null, role || null, curp || null, id];
    const db = client || pool;
    const result = await db.query(updateQuery, values);
    return result.rows[0] || null;
};

module.exports = { buscarPorEmail, crearUsuario, obtenerPerfilPorId, actualizarPerfil };