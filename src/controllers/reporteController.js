const pool = require('../config/database');

const crearReporte = async (req, res) => {
    // 1. Validar que la imagen se haya subido correctamente a Cloudinary
    if (!req.file) {
        return res.status(400).json({ error: 'La fotografía del animal es obligatoria' });
    }
    const url_archivo = req.file.path; // Cloudinary nos devuelve la URL pública aquí

    // 2. Extraer datos (en peticiones con archivos, los datos llegan como cadenas de texto)
    const { latitud, longitud, especie, color_dominante, referencias } = req.body;
    const usuario_id = req.usuario.id; // Lo obtenemos del token gracias al middleware

    if (!latitud || !longitud || !especie || !color_dominante) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (GPS, especie o color)' });
    }

    // Solicitamos un cliente exclusivo para hacer la transacción
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Iniciar Transacción

        // 3. Insertar Reporte (IMPORTANTE: ST_MakePoint requiere LONGITUD primero, luego LATITUD)
        const insertReporteQuery = `
            INSERT INTO reportes (
                usuario_reportador_id, 
                ubicacion, 
                especie, 
                color_dominante, 
                referencias
            ) VALUES (
                $1, 
                ST_SetSRID(ST_MakePoint($2, $3), 4326), 
                $4, 
                $5, 
                $6
            ) RETURNING id;
        `;
        
        const reporteValues = [
            usuario_id, 
            parseFloat(longitud), 
            parseFloat(latitud), 
            especie, 
            color_dominante, 
            referencias || null
        ];

        const resReporte = await client.query(insertReporteQuery, reporteValues);
        const reporte_id = resReporte.rows[0].id;

        // 4. Insertar la URL de la imagen vinculada al reporte
        const insertFotoQuery = `
            INSERT INTO reporte_multimedia (reporte_id, url_archivo, tipo)
            VALUES ($1, $2, 'Foto_Animal');
        `;
        await client.query(insertFotoQuery, [reporte_id, url_archivo]);

        await client.query('COMMIT'); // Confirmar Transacción (Guardar todo)

        res.status(201).json({
            mensaje: 'Reporte de rescate creado con éxito',
            reporte_id: reporte_id,
            foto_url: url_archivo
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Si algo falla, revertimos todos los cambios
        console.error('Error al guardar reporte:', error);
        res.status(500).json({ error: 'Error interno al procesar el reporte' });
    } finally {
        client.release(); // Devolver el cliente al pool
    }
};

module.exports = { crearReporte };