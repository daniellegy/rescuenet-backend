const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');
const { generarToken } = require('../utils/jwtHelper');
const pool = require('../config/database');

const lanzarError = (mensaje, statusCode) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    throw error;
};

// Expresión Regular Oficial para CURP
const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;

const registrarUsuario = async (datos) => {
    const { nombre_completo, telefono, email, password, rol_id, curp } = datos;
    if (!nombre_completo || !telefono || !email || !password || !rol_id) {
        lanzarError('Faltan campos obligatorios', 400);
    }

    if (rol_id === 2) {
        if (!curp || !curpRegex.test(curp)) {
            lanzarError('El CURP proporcionado no tiene un formato válido.', 400);
        }
    }

    const usuarioExistente = await usuarioModel.buscarPorEmail(email);
    if (usuarioExistente) lanzarError('El correo ya está registrado', 409);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let nuevoUsuario;
    try {
        nuevoUsuario = await usuarioModel.crearUsuario(rol_id, nombre_completo, telefono, email, passwordHash, curp);
    } catch (error) {
        // Captura explícita de duplicidad de CURP lanzada por PostgreSQL
        if (error.code === '23505' && error.constraint === 'usuarios_curp_key') {
            lanzarError('El CURP ingresado ya está registrado en otra cuenta de voluntario.', 409);
        }
        throw error;
    }

    const token = generarToken(nuevoUsuario);

    return { token, usuario: { id: nuevoUsuario.id, rol_id: nuevoUsuario.rol_id, nombre: nuevoUsuario.nombre_completo } };
};

const iniciarSesion = async (email, password) => {
    if (!email || !password) lanzarError('Por favor ingresa correo y contraseña', 400);

    const usuario = await usuarioModel.buscarPorEmail(email);
    if (!usuario) lanzarError('Credenciales inválidas', 401);

    if (usuario.activo === false || usuario.activo === 'f') {
        lanzarError('Esta cuenta ha sido eliminada. Registra una nueva si deseas ingresar.', 403);
    }
    
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) lanzarError('Credenciales inválidas', 401);

    const token = generarToken(usuario);

    return {
        token,
        usuario: { id: usuario.id, rol_id: usuario.rol_id, nombre: usuario.nombre_completo }
    };
};

const obtenerPerfil = async (usuario_id) => {
    const perfil = await usuarioModel.obtenerPerfilPorId(usuario_id);
    if (!perfil) lanzarError('Usuario no encontrado', 404);
    return perfil;
};

const actualizarPerfil = async (usuario_id, datos) => {
    const { telefono, email, role, curp } = datos;

    if (telefono && !/^[0-9\-()+\s]{10,15}$/.test(telefono)) lanzarError('Formato de teléfono inválido', 400);
    if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) lanzarError('Formato de correo inválido', 400);
    if (role && role !== 1 && role !== 2) lanzarError('Acción denegada. Rol inválido.', 403);
    
    if (curp) {
        if (!curpRegex.test(curp.trim().toUpperCase())) {
            lanzarError('El formato del CURP proporcionado es inválido.', 400);
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const perfilActualizado = await usuarioModel.actualizarPerfil(client, usuario_id, telefono, email, role, curp);
        if (!perfilActualizado) lanzarError('Usuario no encontrado', 404);
        await client.query('COMMIT');
        return perfilActualizado;
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505' && error.constraint === 'usuarios_email_key') {
            lanzarError('El correo electrónico ya está en uso por otra cuenta.', 409);
        }
        if (error.code === '23505' && error.constraint === 'usuarios_curp_key') {
            lanzarError('El CURP ingresado ya está registrado en otra cuenta.', 409);
        }
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { registrarUsuario, iniciarSesion, obtenerPerfil, actualizarPerfil };