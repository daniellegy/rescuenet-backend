const pool = require('../config/database');

const obtenerPatrocinadorId = async (usuario_id) => {
    const { rows } = await pool.query(
        `SELECT id FROM patrocinadores WHERE usuario_id = $1;`,
        [usuario_id]
    );

    if (rows.length > 0) {
        return rows[0].id;
    }

    const { rows: nuevo } = await pool.query(
        `INSERT INTO patrocinadores (usuario_id, nombre)
         VALUES ($1, $2)
         RETURNING id;`,
        [usuario_id, 'Mi negocio']
    );
    return nuevo[0].id;
};

// Trae nombre, dirección, teléfono, logo y los datos de perfil público del negocio
const obtenerDatosNegocio = async (usuario_id) => {
    const patrocinador_id = await obtenerPatrocinadorId(usuario_id);
    const { rows } = await pool.query(
        `SELECT nombre, direccion, telefono, logo_url, enlace_contacto, tipo_patrocinio, bio
         FROM patrocinadores
         WHERE id = $1;`,
        [patrocinador_id]
    );
    return rows[0] || null;
};

// Actualiza nombre, dirección, teléfono y los datos de perfil público del negocio.
// Como obtenerPatrocinadorId ya garantiza que la fila existe (la crea si falta),
// acá solo hace falta un UPDATE, no un upsert manual.
const actualizarDatosNegocio = async (usuario_id, { nombre, direccion, telefono, enlace_contacto, tipo_patrocinio, bio }) => {
    const patrocinador_id = await obtenerPatrocinadorId(usuario_id);
    const { rows } = await pool.query(
        `UPDATE patrocinadores
         SET nombre = $1,
             direccion = $2,
             telefono = $3,
             enlace_contacto = $4,
             tipo_patrocinio = $5,
             bio = $6,
             actualizado_el = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING nombre, direccion, telefono, logo_url, enlace_contacto, tipo_patrocinio, bio;`,
        [nombre, direccion, telefono, enlace_contacto || null, tipo_patrocinio || null, bio || null, patrocinador_id]
    );
    return rows[0];
};

// Actualiza solo el logo_url del patrocinador
const actualizarLogo = async (usuario_id, logo_url) => {
    const patrocinador_id = await obtenerPatrocinadorId(usuario_id);
    const { rows } = await pool.query(
        `UPDATE patrocinadores
         SET logo_url = $1,
             actualizado_el = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING logo_url;`,
        [logo_url, patrocinador_id]
    );
    return rows[0];
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
        // O no existe ese item, o pertenece a otro patrocinador
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

const eliminarLogo = async (usuario_id) => {
    const query = `UPDATE patrocinadores SET logo_url = NULL WHERE usuario_id = $1 RETURNING *`;
    const result = await pool.query(query, [usuario_id]);
    return result.rows[0];
};

module.exports = {
    obtenerPatrocinadorId,
    obtenerDatosNegocio,
    actualizarDatosNegocio,
    actualizarLogo,
    obtenerCatalogo,
    crearItemCatalogo,
    actualizarItemCatalogo,
    eliminarItemCatalogo,
    eliminarLogo
};