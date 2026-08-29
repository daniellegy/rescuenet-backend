const patrocinadorModel = require('../models/patrocinadorModel');

const obtenerDatosNegocio = async (usuario_id) => {
    return await patrocinadorModel.obtenerDatosNegocio(usuario_id);
};

const validarDatosNegocio = ({ nombre, direccion, telefono, enlace_contacto, tipo_patrocinio, bio }) => {
    if (!nombre || !nombre.trim()) {
        throw { statusCode: 400, message: 'El nombre del emprendimiento/local es obligatorio' };
    }
    if (nombre.length > 150) {
        throw { statusCode: 400, message: 'El nombre no puede superar los 150 caracteres' };
    }
    if (direccion && direccion.length > 255) {
        throw { statusCode: 400, message: 'La dirección no puede superar los 255 caracteres' };
    }
    if (telefono && telefono.length > 20) {
        throw { statusCode: 400, message: 'El teléfono no puede superar los 20 caracteres' };
    }
    if (enlace_contacto && enlace_contacto.length > 300) {
        throw { statusCode: 400, message: 'El enlace de contacto no puede superar los 300 caracteres' };
    }
    if (tipo_patrocinio && tipo_patrocinio.length > 100) {
        throw { statusCode: 400, message: 'El tipo de patrocinio no puede superar los 100 caracteres' };
    }
    if (bio && bio.length > 300) {
        throw { statusCode: 400, message: 'La biografía no puede superar los 300 caracteres' };
    }
};

const actualizarDatosNegocio = async (usuario_id, datos) => {
    validarDatosNegocio(datos);
    return await patrocinadorModel.actualizarDatosNegocio(usuario_id, datos);
};

// Recibe el archivo ya subido por multer/cloudinary (req.file) y guarda su URL
const actualizarLogo = async (usuario_id, file) => {
    if (!file) {
        throw { statusCode: 400, message: 'La imagen del logo es obligatoria' };
    }
    return await patrocinadorModel.actualizarLogo(usuario_id, file.path);
};

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

module.exports = {
    obtenerDatosNegocio,
    actualizarDatosNegocio,
    actualizarLogo,
    obtenerCatalogo,
    crearItemCatalogo,
    actualizarItemCatalogo,
    eliminarItemCatalogo
};