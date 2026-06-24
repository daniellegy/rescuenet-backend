const pool = require('../config/database');

const crearReporteConFoto = async (datos) => {
    const { 
        usuario_id, latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales,
        urgencia, url_archivo 
    } = datos;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const insertReporteQuery = `
            INSERT INTO reportes (
                usuario_reportador_id, ubicacion, especie, color_dominante, 
                sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales, urgencia, estado
            ) 
            VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Nuevo') 
            RETURNING id;
        `;
        const reporteValues = [
            usuario_id, parseFloat(longitud), parseFloat(latitud), especie, color_dominante,
            sexo || 'Desconocido', edad_aprox || 'Cachorro', tamano || null, agresividad || 1,
            raza_aprox || null, caracteristicas_especiales || null, notas_adicionales || null, urgencia || 'media'
        ];
        
        const resReporte = await client.query(insertReporteQuery, reporteValues);
        const reporte_id = resReporte.rows[0].id;

        const insertMultimediaQuery = `
            INSERT INTO reporte_multimedia (reporte_id, tipo, url_archivo)
            VALUES ($1, 'Foto_Animal', $2);
        `;
        await client.query(insertMultimediaQuery, [reporte_id, url_archivo]);

        await client.query('COMMIT');
        
        return { 
            reporte_id, 
            ubicacion: { latitud: parseFloat(latitud), longitud: parseFloat(longitud) },
            urgencia: urgencia || 'media',
            foto_url: url_archivo 
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const obtenerHistorial = async (usuario_id) => {
    const query = `
        SELECT 
            r.id, r.especie, r.color_dominante, r.sexo, r.edad_aprox, r.agresividad,
            r.tamano, r.raza_aprox, r.caracteristicas_especiales, r.notas_adicionales, r.urgencia, r.estado,
            r.usuario_rescatista_id, r.usuario_reportador_id,
            ST_Y(r.ubicacion::geometry) AS latitud, ST_X(r.ubicacion::geometry) AS longitud,
            m.url_archivo AS foto_url
        FROM reportes r
        LEFT JOIN reporte_multimedia m ON r.id = m.reporte_id AND m.tipo = 'Foto_Animal'
        WHERE r.usuario_reportador_id = $1 OR r.usuario_rescatista_id = $1 
        ORDER BY r.id DESC;
    `;
    const { rows } = await pool.query(query, [usuario_id]);
    return rows;
};

const obtenerReportesActivos = async () => {
    const query = `
        SELECT 
            r.id, r.especie, r.color_dominante, r.sexo, r.edad_aprox, r.agresividad,
            r.tamano, r.raza_aprox, r.caracteristicas_especiales, r.notas_adicionales, r.urgencia, r.estado,
            r.usuario_rescatista_id,
            ST_Y(r.ubicacion::geometry) AS latitud, ST_X(r.ubicacion::geometry) AS longitud,
            m.url_archivo AS foto_url
        FROM reportes r
        LEFT JOIN reporte_multimedia m ON r.id = m.reporte_id AND m.tipo = 'Foto_Animal'
        WHERE r.estado IN ('Nuevo', 'En_Proceso') 
        ORDER BY r.id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

// NUEVA: Verifica si el voluntario ya tiene un rescate
const verificarRescateActivo = async (voluntario_id) => {
    const query = `SELECT id FROM reportes WHERE usuario_rescatista_id = $1 AND estado = 'En_Proceso'`;
    const { rows } = await pool.query(query, [voluntario_id]);
    return rows.length > 0 ? rows[0] : null;
};

// NUEVA: Obtiene todos los detalles del rescate actual del voluntario
const obtenerMiRescateActivo = async (voluntario_id) => {
    const query = `
        SELECT 
            r.id, r.especie, r.color_dominante, r.sexo, r.edad_aprox, r.agresividad,
            r.tamano, r.raza_aprox, r.caracteristicas_especiales, r.notas_adicionales, r.urgencia, r.estado,
            r.usuario_rescatista_id,
            ST_Y(r.ubicacion::geometry) AS latitud, ST_X(r.ubicacion::geometry) AS longitud,
            m.url_archivo AS foto_url
        FROM reportes r
        LEFT JOIN reporte_multimedia m ON r.id = m.reporte_id AND m.tipo = 'Foto_Animal'
        WHERE r.usuario_rescatista_id = $1 AND r.estado = 'En_Proceso'
        LIMIT 1;
    `;
    const { rows } = await pool.query(query, [voluntario_id]);
    return rows[0] || null;
};

const actualizarEstadoReporte = async (reporte_id, voluntario_id, estado) => {
    const query = `
        UPDATE reportes 
        SET estado = $1, usuario_rescatista_id = $2, actualizado_el = CURRENT_TIMESTAMP
        WHERE id = $3 AND estado = 'Nuevo'
        RETURNING id;
    `;
    const { rows } = await pool.query(query, [estado, voluntario_id, reporte_id]);
    if (rows.length === 0) throw { statusCode: 404, message: 'Reporte no encontrado o ya fue aceptado' };
    return rows[0];
};

// NUEVA: Finalizar el rescate
const finalizarEstadoRescate = async (reporte_id, voluntario_id) => {
    const query = `
        UPDATE reportes 
        SET estado = 'Rescatado', actualizado_el = CURRENT_TIMESTAMP
        WHERE id = $1 AND usuario_rescatista_id = $2 AND estado = 'En_Proceso'
        RETURNING id;
    `;
    const { rows } = await pool.query(query, [reporte_id, voluntario_id]);
    if (rows.length === 0) throw { statusCode: 404, message: 'Rescate no encontrado o no tienes permisos' };
    return rows[0];
};

module.exports = { 
    crearReporteConFoto, obtenerHistorial, obtenerReportesActivos, 
    verificarRescateActivo, obtenerMiRescateActivo, actualizarEstadoReporte, finalizarEstadoRescate 
};