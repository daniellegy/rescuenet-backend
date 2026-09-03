const pool = require('../config/database');

const esParticipante = async (reporte_id, usuario_id) => {
    const { rows } = await pool.query(
        `SELECT 1 FROM reportes WHERE id = $1 AND (usuario_reportador_id = $2 OR usuario_rescatista_id = $2);`,
        [reporte_id, usuario_id]
    );
    return rows.length > 0;
};

const obtenerEstadoCanal = async (reporte_id) => {
    const { rows } = await pool.query(
        `SELECT canal_comunicacion_habilitado, canal_comunicacion_estado, fecha_apertura_canal, fecha_cierre_canal
         FROM reportes WHERE id = $1;`,
        [reporte_id]
    );
    return rows[0] || null;
};

const activarCanalSiCorresponde = async (reporte_id) => {
    const { rows } = await pool.query(
        `UPDATE reportes
         SET canal_comunicacion_estado = 'activo', fecha_apertura_canal = CURRENT_TIMESTAMP
         WHERE id = $1 AND canal_comunicacion_habilitado = TRUE AND canal_comunicacion_estado = 'inactivo'
         RETURNING id;`,
        [reporte_id]
    );
    return rows.length > 0;
};

const esReportador = async (reporte_id, usuario_id) => {
    const { rows } = await pool.query(
        `SELECT 1 FROM reportes WHERE id = $1 AND usuario_reportador_id = $2;`,
        [reporte_id, usuario_id]
    );
    return rows.length > 0;
};

const activarCanalManualmente = async (reporte_id) => {
    const { rows } = await pool.query(
        `UPDATE reportes
         SET canal_comunicacion_habilitado = TRUE,
             canal_comunicacion_estado = CASE WHEN estado = 'En_Proceso' THEN 'activo' ELSE 'inactivo' END,
             fecha_apertura_canal = CASE WHEN estado = 'En_Proceso' THEN CURRENT_TIMESTAMP ELSE fecha_apertura_canal END
         WHERE id = $1 AND canal_comunicacion_habilitado = FALSE
         RETURNING id;`,
        [reporte_id]
    );
    return rows.length > 0;
};

const cerrarCanal = async (reporte_id) => {
    const { rows } = await pool.query(
        `UPDATE reportes
         SET canal_comunicacion_estado = 'cerrado', fecha_cierre_canal = CURRENT_TIMESTAMP
         WHERE id = $1 AND canal_comunicacion_estado = 'activo'
         RETURNING id;`,
        [reporte_id]
    );
    return rows.length > 0;
};

const reactivarCanalSiCorresponde = async (reporte_id) => {
    const { rows } = await pool.query(
        `UPDATE reportes
         SET canal_comunicacion_estado = 'inactivo', fecha_apertura_canal = NULL, fecha_cierre_canal = NULL
         WHERE id = $1 AND canal_comunicacion_habilitado = TRUE
         RETURNING id;`,
        [reporte_id]
    );
    return rows.length > 0;
};

// Inserción y Join simultáneo para WebSockets
const crearMensaje = async (reporte_id, autor_id, contenido) => {
    const { rows } = await pool.query(
        `WITH insertado AS (
            INSERT INTO canal_mensajes (reporte_id, autor_id, contenido) VALUES ($1, $2, $3)
            RETURNING id, reporte_id, autor_id, contenido, creado_el
         )
         SELECT i.*, u.nombre_completo AS nombre_autor
         FROM insertado i
         JOIN usuarios u ON i.autor_id = u.id;`,
        [reporte_id, autor_id, contenido]
    );
    return rows[0];
};

const obtenerMensajes = async (reporte_id) => {
    const { rows } = await pool.query(
        `SELECT cm.id, cm.reporte_id, cm.autor_id, cm.contenido, cm.creado_el, u.nombre_completo AS nombre_autor
         FROM canal_mensajes cm
         LEFT JOIN usuarios u ON cm.autor_id = u.id
         WHERE cm.reporte_id = $1
         ORDER BY cm.creado_el ASC;`,
        [reporte_id]
    );
    return rows;
};

module.exports = { esParticipante, obtenerEstadoCanal, activarCanalSiCorresponde, cerrarCanal, reactivarCanalSiCorresponde, crearMensaje, obtenerMensajes, esReportador, activarCanalManualmente};