const pool = require('../config/database');

const crearReporteConFoto = async (datos) => {
    const { usuario_id, latitud, longitud, especie, color_dominante, referencias, url_archivo } = datos;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insertar Reporte
        const insertReporteQuery = `
            INSERT INTO reportes (usuario_reportador_id, ubicacion, especie, color_dominante, referencias) 
            VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6) 
            RETURNING id;
        `;
        const reporteValues = [usuario_id, parseFloat(longitud), parseFloat(latitud), especie, color_dominante, referencias || null];
        const resReporte = await client.query(insertReporteQuery, reporteValues);
        const reporte_id = resReporte.rows[0].id;

        // Insertar Multimedia
        const insertFotoQuery = `
            INSERT INTO reporte_multimedia (reporte_id, url_archivo, tipo)
            VALUES ($1, $2, 'Foto_Animal');
        `;
        await client.query(insertFotoQuery, [reporte_id, url_archivo]);

        await client.query('COMMIT');
        
        return { reporte_id, foto_url: url_archivo };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error; // Propagamos el error para que el controlador lo maneje
    } finally {
        client.release();
    }
};

const obtenerHistorial = async (usuario_id) => {
    const query = `
        SELECT
            r.id, r.especie, r.color_dominante, r.referencias,
            ST_Y(r.ubicacion::geometry) AS latitud,
            ST_X(r.ubicacion::geometry) AS longitud,
            m.url_archivo AS foto_url
        FROM reportes r
        LEFT JOIN reporte_multimedia m ON r.id = m.reporte_id AND m.tipo = 'Foto_Animal'
        WHERE r.usuario_reportador_id = $1
        ORDER BY r.id DESC;
    `;
    const { rows } = await pool.query(query, [usuario_id]);
    return rows;
};

module.exports = { crearReporteConFoto, obtenerHistorial };