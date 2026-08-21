const patrocinadorModel = require('../models/patrocinadorModel');

const obtenerCatalogo = async (usuario_id) => {
    return await patrocinadorModel.obtenerCatalogo(usuario_id);
};

const TIPOS_VALIDOS = ['Alimento', 'Medicamento', 'Servicio', 'Material'];

const validarDatosItem = ({ nombre, tipo, precio }) => {
    if (!nombre || !tipo || precio === undefined || precio === null) {
        throw { statusCode: 400, message: 'Nombre, tipo y precio son obligatorios' };
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
        throw { statusCode: 400, message: `Tipo inválido. Debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` };
    }
    if (isNaN(precio) || Number(precio) < 0) {
        throw { statusCode: 400, message: 'El precio debe ser un número válido' };
    }
};

const crearItemCatalogo = async (usuario_id, datos) => {
    validarDatosItem(datos);
    return await patrocinadorModel.crearItemCatalogo(usuario_id, datos);
};

const actualizarItemCatalogo = async (usuario_id, item_id, datos) => {
    validarDatosItem(datos);
    return await patrocinadorModel.actualizarItemCatalogo(usuario_id, item_id, datos);
};

const eliminarItemCatalogo = async (usuario_id, item_id) => {
    return await patrocinadorModel.eliminarItemCatalogo(usuario_id, item_id);
};

module.exports = { obtenerCatalogo, crearItemCatalogo, actualizarItemCatalogo, eliminarItemCatalogo };