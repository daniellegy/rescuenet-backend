const pool = require('../config/database');

const obtenerPatrocinadorId = async (usuario_id) => {
    const { rows } = await pool.query(
        `SELECT id FROM patrocinadores WHERE usuario_id = $1;`,
        [usuario_id]
    );

    if (rows.length > 0) {
        return rows[0].id;
    }

    // No existía perfil de patrocinador para este usuario: lo creamos al vuelo
    // en vez de fallar. "nombre" es NOT NULL en la tabla, así que le ponemos
    // un placeholder — el usuario lo puede editar después desde Configuración.
    const { rows: nuevo } = await pool.query(
        `INSERT INTO patrocinadores (usuario_id, nombre)
         VALUES ($1, $2)
         RETURNING id;`,
        [usuario_id, 'Mi negocio']
    );
    return nuevo[0].id;
};

const obtenerCatalogo = async (usuario_id) => {
    const patrocinador_id = await obtenerPatrocinadorId(usuario_id);
    const { rows } = await pool.query(
        `SELECT id, nombre, tipo, precio
         FROM catalogo_patrocinador
         WHERE patrocinador_id = $1
         ORDER BY id;`,
        [patrocinador_id]
    );
    return rows;
};

const crearItemCatalogo = async (usuario_id, { nombre, tipo, precio }) => {
    const patrocinador_id = await obtenerPatrocinadorId(usuario_id);
    const { rows } = await pool.query(
        `INSERT INTO catalogo_patrocinador (patrocinador_id, nombre, tipo, precio)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nombre, tipo, precio;`,
        [patrocinador_id, nombre, tipo, precio]
    );
    return rows[0];
};

// item_id: el id de la fila en catalogo_patrocinador que se quiere editar
const actualizarItemCatalogo = async (usuario_id, item_id, { nombre, tipo, precio }) => {
    const patrocinador_id = await obtenerPatrocinadorId(usuario_id);
    const { rows } = await pool.query(
        `UPDATE catalogo_patrocinador
         SET nombre = $1, tipo = $2, precio = $3
         WHERE id = $4 AND patrocinador_id = $5
         RETURNING id, nombre, tipo, precio;`,
        [nombre, tipo, precio, item_id, patrocinador_id]
    );

    if (rows.length === 0) {
        // O no existe ese item, o pertenece a otro patrocinador (intento de acceso indebido)
        throw { statusCode: 404, message: 'Item no encontrado en tu catálogo' };
    }
    return rows[0];
};

const eliminarItemCatalogo = async (usuario_id, item_id) => {
    const patrocinador_id = await obtenerPatrocinadorId(usuario_id);
    const { rows } = await pool.query(
        `DELETE FROM catalogo_patrocinador
         WHERE id = $1 AND patrocinador_id = $2
         RETURNING id;`,
        [item_id, patrocinador_id]
    );

    if (rows.length === 0) {
        throw { statusCode: 404, message: 'Item no encontrado en tu catálogo' };
    }
    return rows[0];
};

module.exports = {
    obtenerPatrocinadorId,
    obtenerCatalogo,
    crearItemCatalogo,
    actualizarItemCatalogo,
    eliminarItemCatalogo
};