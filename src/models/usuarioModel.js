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
    const query = 'SELECT id, rol_id AS role, nombre_completo, telefono, email, curp, radio_notificaciones, fcm_token, foto_perfil, perfil_privado FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

const actualizarPerfil = async (client, id, telefono, email, role, curp, perfil_privado) => {
    const updateQuery = `
        UPDATE usuarios 
        SET 
            telefono = COALESCE($1, telefono),
            email = COALESCE($2, email),
            rol_id = COALESCE($3, rol_id),
            curp = COALESCE($4, curp),
            perfil_privado = COALESCE($5, perfil_privado),
            actualizado_el = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, rol_id AS role, nombre_completo, telefono, email, curp, foto_perfil, perfil_privado;
    `;
    // Verificamos si perfil_privado es undefined para que COALESCE tome el valor actual
    const valorPrivacidad = perfil_privado !== undefined ? perfil_privado : null;
    const values = [telefono || null, email || null, role || null, curp || null, valorPrivacidad, id];
    
    const db = client || pool;
    const result = await db.query(updateQuery, values);
    return result.rows[0] || null;
};

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

const actualizarFotoPerfil = async (id, urlFoto) => {
    const query = `
        UPDATE usuarios 
        SET foto_perfil = $1, actualizado_el = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING foto_perfil;
    `;
    const { rows } = await pool.query(query, [urlFoto, id]);
    return rows[0] || null;
};

const obtenerEstadisticasUsuario = async (id) => {
    const query = `
        SELECT 
            u.id, 
            u.nombre_completo, 
            u.foto_perfil, 
            u.rol_id AS role,
            u.perfil_privado,
            (SELECT COUNT(*) FROM reportes WHERE usuario_reportador_id = u.id) AS reportes_creados,
            (SELECT COUNT(*) FROM reportes WHERE usuario_rescatista_id = u.id AND estado = 'Rescatado') AS rescates_realizados
        FROM usuarios u
        WHERE u.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
};

module.exports = { 
    buscarPorEmail, 
    crearUsuario, 
    obtenerPerfilPorId, 
    actualizarPerfil, 
    actualizarPreferencias, 
    actualizarUltimaUbicacion, 
    obtenerTokensVoluntariosCercanos, 
    desactivarUsuario,
    actualizarFotoPerfil,
    obtenerEstadisticasUsuario
};