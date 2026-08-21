const pool = require('../config/database');

const listarPatrocinadores = async () => {
    const { rows } = await pool.query(
        `SELECT id, nombre, direccion, telefono
         FROM patrocinadores
         ORDER BY nombre;`
    );
    return rows;
};

const obtenerPatrocinadorPorId = async (patrocinador_id) => {
    const { rows } = await pool.query(
        `SELECT id, nombre, direccion, telefono
         FROM patrocinadores
         WHERE id = $1;`,
        [patrocinador_id]
    );
    return rows[0] || null;
};

const obtenerCatalogoPorPatrocinador = async (patrocinador_id) => {
    const { rows } = await pool.query(
        `SELECT id, nombre, tipo, precio
         FROM catalogo_patrocinador
         WHERE patrocinador_id = $1
         ORDER BY id;`,
        [patrocinador_id]
    );
    return rows;
};

module.exports = { listarPatrocinadores, obtenerPatrocinadorPorId, obtenerCatalogoPorPatrocinador };