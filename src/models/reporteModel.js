const pool = require('../config/database');

const crearReporteConFoto = async (datos) => {
    // ... (Mantén tu código actual de esta función sin cambios, es largo, te doy el archivo completo aquí)
    const { usuario_id, latitud, longitud, especie, color_dominante, sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales, urgencia, url_archivo } = datos;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertReporteQuery = `INSERT INTO reportes (usuario_reportador_id, ubicacion, especie, color_dominante, sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales, urgencia, estado) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Nuevo') RETURNING id;`;
        const resReporte = await client.query(insertReporteQuery, [usuario_id, parseFloat(longitud), parseFloat(latitud), especie, color_dominante, sexo || 'Desconocido', edad_aprox || 'Cachorro', tamano || null, agresividad || 1, raza_aprox || null, caracteristicas_especiales || null, notas_adicionales || null, urgencia || 'media']);
        const reporte_id = resReporte.rows[0].id;
        await client.query(`INSERT INTO reporte_multimedia (reporte_id, tipo, url_archivo) VALUES ($1, 'Foto_Animal', $2);`, [reporte_id, url_archivo]);
        await client.query('COMMIT');
        return { reporte_id, ubicacion: { latitud: parseFloat(latitud), longitud: parseFloat(longitud) }, urgencia: urgencia || 'media', foto_url: url_archivo };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const _baseSelectQuery = `
    SELECT 
        r.id, r.especie, r.color_dominante, r.sexo, r.edad_aprox, r.agresividad, r.tamano, r.raza_aprox, r.caracteristicas_especiales, r.notas_adicionales, r.urgencia, r.estado, r.usuario_rescatista_id, r.usuario_reportador_id,
        r.animal_avistado, r.lugar_traslado, r.destino_final, r.costo_rescate, r.condicion_rescate,
        ST_Y(r.ubicacion::geometry) AS latitud, ST_X(r.ubicacion::geometry) AS longitud,
        m1.url_archivo AS foto_url, m2.url_archivo AS foto_evidencia_url,
        r.creado_el AS fecha_creacion, u_rep.nombre_completo AS nombre_reportador, u_resc.nombre_completo AS nombre_rescatista
    FROM reportes r
    LEFT JOIN reporte_multimedia m1 ON r.id = m1.reporte_id AND m1.tipo = 'Foto_Animal'
    LEFT JOIN reporte_multimedia m2 ON r.id = m2.reporte_id AND m2.tipo = 'Evidencia_Rescate'
    LEFT JOIN usuarios u_rep ON r.usuario_reportador_id = u_rep.id
    LEFT JOIN usuarios u_resc ON r.usuario_rescatista_id = u_resc.id
`;

const obtenerHistorial = async (usuario_id) => {
    const { rows } = await pool.query(`${_baseSelectQuery} WHERE r.usuario_reportador_id = $1 OR r.usuario_rescatista_id = $1 ORDER BY r.id DESC;`, [usuario_id]);
    return rows;
};

const obtenerReportesActivos = async () => {
    const { rows } = await pool.query(`${_baseSelectQuery} WHERE r.estado IN ('Nuevo', 'En_Proceso') ORDER BY r.id DESC;`);
    return rows;
};

const verificarRescateActivo = async (voluntario_id) => {
    const { rows } = await pool.query(`SELECT id FROM reportes WHERE usuario_rescatista_id = $1 AND estado = 'En_Proceso'`, [voluntario_id]);
    return rows.length > 0 ? rows[0] : null;
};

const obtenerMiRescateActivo = async (voluntario_id) => {
    const { rows } = await pool.query(`${_baseSelectQuery} WHERE r.usuario_rescatista_id = $1 AND r.estado = 'En_Proceso' LIMIT 1;`, [voluntario_id]);
    return rows[0] || null;
};

const actualizarEstadoReporte = async (reporte_id, voluntario_id, estado) => {
    const query = `UPDATE reportes SET estado = $1, usuario_rescatista_id = $2, actualizado_el = CURRENT_TIMESTAMP WHERE id = $3 AND estado = 'Nuevo' RETURNING id;`;
    const { rows } = await pool.query(query, [estado, voluntario_id, reporte_id]);
    if (rows.length === 0) throw { statusCode: 404, message: 'Reporte no encontrado o ya fue aceptado' };
    return rows[0];
};

const abortarRescate = async (reporte_id, voluntario_id) => {
    const query = `UPDATE reportes SET estado = 'Nuevo', usuario_rescatista_id = NULL, animal_avistado = NULL, lugar_traslado = NULL, actualizado_el = CURRENT_TIMESTAMP WHERE id = $1 AND usuario_rescatista_id = $2 AND estado = 'En_Proceso' RETURNING id;`;
    const { rows } = await pool.query(query, [reporte_id, voluntario_id]);
    if (rows.length === 0) throw { statusCode: 404, message: 'Rescate no encontrado o sin permisos' };
    return rows[0];
};

// NUEVA FUNCIÓN: Actualizar progreso en tiempo real
const actualizarProgresoRescate = async (reporte_id, voluntario_id, animal_avistado, lugar_traslado) => {
    const query = `
        UPDATE reportes 
        SET 
            animal_avistado = COALESCE($1, animal_avistado),
            lugar_traslado = COALESCE($2, lugar_traslado),
            actualizado_el = CURRENT_TIMESTAMP
        WHERE id = $3 AND usuario_rescatista_id = $4 AND estado = 'En_Proceso'
        RETURNING id;
    `;
    const { rows } = await pool.query(query, [animal_avistado, lugar_traslado, reporte_id, voluntario_id]);
    if (rows.length === 0) throw { statusCode: 404, message: 'Rescate no encontrado o sin permisos' };
    return rows[0];
};

const finalizarEstadoRescate = async (reporte_id, voluntario_id, detalles, evidencia_url) => {
    const { costo, destino, condicion, conclusion } = detalles;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updateQuery = `
            UPDATE reportes 
            SET estado = 'Rescatado', costo_rescate = $3, destino_final = $4, condicion_rescate = $5,
                notas_adicionales = CASE 
                    WHEN $6::text IS NOT NULL AND $6::text <> '' THEN CONCAT(notas_adicionales, CHR(10), 'Conclusión: ', $6::text)
                    ELSE notas_adicionales 
                END,
                actualizado_el = CURRENT_TIMESTAMP
            WHERE id = $1 AND usuario_rescatista_id = $2 AND estado = 'En_Proceso' RETURNING id;
        `;
        const { rows } = await client.query(updateQuery, [reporte_id, voluntario_id, costo || 0, destino, condicion, conclusion]);
        if (rows.length === 0) throw { statusCode: 404, message: 'Rescate no encontrado o sin permisos' };

        // Insertar foto de evidencia si existe
        if (evidencia_url) {
            await client.query(`INSERT INTO reporte_multimedia (reporte_id, tipo, url_archivo) VALUES ($1, 'Evidencia_Rescate', $2);`, [reporte_id, evidencia_url]);
        }
        await client.query('COMMIT');
        return rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { crearReporteConFoto, obtenerHistorial, obtenerReportesActivos, verificarRescateActivo, obtenerMiRescateActivo, actualizarEstadoReporte, abortarRescate, actualizarProgresoRescate, finalizarEstadoRescate };