const pool = require('../config/database');

const crearReporteConFoto = async (datos) => {
    const { 
        usuario_id, latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, raza_aprox, caracteristicas_especiales, notas_adicionales,
        url_archivo 
    } = datos;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insertar Reporte con los nuevos campos
        const insertReporteQuery = `
            INSERT INTO reportes (
                usuario_reportador_id, ubicacion, especie, color_dominante, 
                sexo, edad_aprox, tamano, raza_aprox, caracteristicas_especiales, notas_adicionales
            ) 
            VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING id;
        `;
        const reporteValues = [
            usuario_id, parseFloat(longitud), parseFloat(latitud), especie, color_dominante,
            sexo || 'Desconocido', edad_aprox || 'Cachorro', tamano || null, 
            raza_aprox || null, caracteristicas_especiales || null, notas_adicionales || null
        ];
        
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
        throw error;
    } finally {
        client.release();
    }
};

const obtenerHistorial = async (usuario_id) => {
    // Agregamos los nuevos campos a la consulta de lectura
    const query = `
        SELECT
            r.id, r.especie, r.color_dominante, r.sexo, r.edad_aprox, 
            r.tamano, r.raza_aprox, r.caracteristicas_especiales, r.notas_adicionales,
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