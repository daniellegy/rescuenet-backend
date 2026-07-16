const pool = require('../config/database');

const buscarPorEmail = async (email) => {
    const query = 'SELECT id, rol_id, password_hash, nombre_completo, activo FROM usuarios WHERE email = $1';
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
    // MODIFICADO: Ahora se incluye fcm_token para conocer el estado actual en la UI de Flutter
    const query = 'SELECT id, rol_id AS role, nombre_completo, telefono, email, curp, radio_notificaciones, fcm_token FROM usuarios WHERE id = $1';
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

// MODIFICADO: Permite limpiar el fcm_token enviando explícitamente 'CLEAR' desde la app
const actualizarPreferencias = async (id, radio, fcm_token) => {
    const query = `
        UPDATE usuarios 
        SET 
            radio_notificaciones = COALESCE($1, radio_notificaciones),
            fcm_token = CASE WHEN $2 = 'CLEAR' THEN NULL ELSE COALESCE($2, fcm_token) END
        WHERE id = $3
        RETURNING radio_notificaciones, fcm_token;
    `;
    const { rows } = await pool.query(query, [radio || null, fcm_token || null, id]);
    return rows[0] || {};
};

const actualizarUltimaUbicacion = async (id, lat, lng) => {
    const query = `
        UPDATE usuarios 
        SET ultima_ubicacion = ST_SetSRID(ST_MakePoint($1, $2), 4326)
        WHERE id = $3;
    `;
    await pool.query(query, [parseFloat(lng), parseFloat(lat), id]);
};

const obtenerTokensVoluntariosCercanos = async (lat, lng) => {
    const query = `
        SELECT fcm_token 
        FROM usuarios 
        WHERE rol_id = 2 
        AND fcm_token IS NOT NULL
        AND fcm_token <> ''
        AND ultima_ubicacion IS NOT NULL
        AND ST_DWithin(ultima_ubicacion::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, radio_notificaciones * 1000)
    `;
    const { rows } = await pool.query(query, [parseFloat(lng), parseFloat(lat)]);
    return rows.map(r => r.fcm_token);
};

const desactivarUsuario = async (usuarioId) => {
    const query = `
        UPDATE usuarios 
        SET activo = false, 
            fcm_token = NULL 
        WHERE id = $1 
        RETURNING id;
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows[0] || null;
};

module.exports = { buscarPorEmail, crearUsuario, obtenerPerfilPorId, actualizarPerfil, actualizarPreferencias, actualizarUltimaUbicacion, obtenerTokensVoluntariosCercanos, desactivarUsuario };