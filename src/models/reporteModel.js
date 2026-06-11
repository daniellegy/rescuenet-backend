const pool = require('../config/database');

const crearReporteConFoto = async (datos) => {
    const { 
        usuario_id, latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales,
        url_archivo 
    } = datos;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const insertReporteQuery = `
            INSERT INTO reportes (
                usuario_reportador_id, ubicacion, especie, color_dominante, 
                sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales, estado
            ) 
            VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Nuevo') 
            RETURNING id;
        `;
        const reporteValues = [
            usuario_id, parseFloat(longitud), parseFloat(latitud), especie, color_dominante,
            sexo || 'Desconocido', edad_aprox || 'Cachorro', tamano || null, agresividad || 1,
            raza_aprox || null, caracteristicas_especiales || null, notas_adicionales || null
        ];
        
        const resReporte = await client.query(insertReporteQuery, reporteValues);
        const reporte_id = resReporte.rows[0].id;

        const insertFotoQuery = `
            INSERT INTO reporte_multimedia (reporte_id, url_archivo, tipo)
            VALUES ($1, $2, 'Foto_Animal');
        `;
        await client.query(insertFotoQuery, [reporte_id, url_archivo]);

        await client.query('COMMIT');
        
        return { reporte_id, foto_url: url_archivo };
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
            r.tamano, r.raza_aprox, r.caracteristicas_especiales, r.notas_adicionales, r.estado,
            ST_Y(r.ubicacion::geometry) AS latitud, ST_X(r.ubicacion::geometry) AS longitud,
            m.url_archivo AS foto_url
        FROM reportes r
        LEFT JOIN reporte_multimedia m ON r.id = m.reporte_id AND m.tipo = 'Foto_Animal'
        WHERE r.usuario_reportador_id = $1 ORDER BY r.id DESC;
    `;
    const { rows } = await pool.query(query, [usuario_id]);
    return rows;
};

// Exclusivo para Voluntarios: Reportes con estado 'Nuevo'
const obtenerReportesActivos = async () => {
    const query = `
        SELECT
            r.id, r.especie, r.color_dominante, r.sexo, r.edad_aprox, r.agresividad,
            r.tamano, r.raza_aprox, r.caracteristicas_especiales, r.notas_adicionales, r.estado,
            ST_Y(r.ubicacion::geometry) AS latitud, ST_X(r.ubicacion::geometry) AS longitud,
            m.url_archivo AS foto_url
        FROM reportes r
        LEFT JOIN reporte_multimedia m ON r.id = m.reporte_id AND m.tipo = 'Foto_Animal'
        WHERE r.estado = 'Nuevo' ORDER BY r.id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const actualizarEstadoReporte = async (reporte_id, voluntario_id, estado) => {
    const query = `
        UPDATE reportes
        SET estado = $1, usuario_rescatista_id = $2, actualizado_el = CURRENT_TIMESTAMP
        WHERE id = $3 RETURNING id;
    `;
    await pool.query(query, [estado, voluntario_id, reporte_id]);
};

module.exports = { crearReporteConFoto, obtenerHistorial, obtenerReportesActivos, actualizarEstadoReporte };