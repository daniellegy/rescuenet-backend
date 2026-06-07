const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');
const { generarToken } = require('../utils/jwtHelper');

// Función de ayuda para lanzar errores limpios
const lanzarError = (mensaje, statusCode) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    throw error;
};

const registrarUsuario = async (datos) => {
    const { nombre_completo, telefono, email, password, rol_id, curp } = datos;

    // Validación de negocio
    const usuarioExistente = await usuarioModel.buscarPorEmail(email);
    if (usuarioExistente) lanzarError('El correo ya está registrado', 409);

    // Encriptación
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Persistencia
    const nuevoUsuario = await usuarioModel.crearUsuario(rol_id, nombre_completo, telefono, email, passwordHash, curp);

    // Generación de Token
    const token = generarToken(nuevoUsuario);

    return { token, usuario: nuevoUsuario };
};

const iniciarSesion = async (email, password) => {
    const usuario = await usuarioModel.buscarPorEmail(email);
    if (!usuario) lanzarError('Credenciales inválidas', 401);

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) lanzarError('Credenciales inválidas', 401);

    const token = generarToken(usuario);

    return {
        token,
        usuario: { id: usuario.id, rol_id: usuario.rol_id, nombre: usuario.nombre_completo }
    };
};

module.exports = { registrarUsuario, iniciarSesion };