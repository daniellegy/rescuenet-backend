const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');
const { generarToken } = require('../utils/jwtHelper');
const pool = require('../config/database');
const AppError = require('../utils/AppError');

const registrarUsuario = async (datos) => {
    const { nombre_completo, telefono, email, password, rol_id, curp } = datos;
    
    const usuarioExistente = await usuarioModel.buscarPorEmail(email);
    if (usuarioExistente) throw new AppError('El correo ya está registrado', 409);
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    let nuevoUsuario;
    try {
        nuevoUsuario = await usuarioModel.crearUsuario(rol_id, nombre_completo, telefono, email, passwordHash, curp);
    } catch (error) {
        if (error.code === '23505' && error.constraint === 'usuarios_curp_key') {
            throw new AppError('El CURP ingresado ya está registrado en otra cuenta de voluntario.', 409);
        }
        throw error;
    }
    
    const token = generarToken(nuevoUsuario);
    return { token, usuario: { id: nuevoUsuario.id, rol_id: nuevoUsuario.rol_id, nombre: nuevoUsuario.nombre_completo } };
};

const iniciarSesion = async (email, password) => {
    const usuario = await usuarioModel.buscarPorEmail(email);
    if (!usuario) throw new AppError('Credenciales inválidas', 401);
    
    if (usuario.activo === false || usuario.activo === 'f') {
        throw new AppError('Esta cuenta ha sido eliminada. Registra una nueva si deseas ingresar.', 403);
    }
    
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) throw new AppError('Credenciales inválidas', 401);
    
    const token = generarToken(usuario);
    return {
        token,
        usuario: { id: usuario.id, rol_id: usuario.rol_id, nombre: usuario.nombre_completo }
    };
};

const obtenerPerfil = async (usuario_id) => {
    const perfil = await usuarioModel.obtenerPerfilPorId(usuario_id);
    if (!perfil) throw new AppError('Usuario no encontrado', 404);
    return perfil;
};

const actualizarPerfil = async (usuario_id, datos) => {
    const { telefono, email, role, curp, perfil_privado } = datos;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const perfilActualizado = await usuarioModel.actualizarPerfil(client, usuario_id, telefono, email, role, curp, perfil_privado);
        
        if (!perfilActualizado) throw new AppError('Usuario no encontrado', 404);
        
        await client.query('COMMIT');
        return perfilActualizado;
    } catch (error) {
        await client.query('ROLLBACK');
        
        if (error.code === '23505' && error.constraint === 'usuarios_email_key') {
            throw new AppError('El correo electrónico ya está en uso por otra cuenta.', 409);
        }
        if (error.code === '23505' && error.constraint === 'usuarios_curp_key') {
            throw new AppError('El CURP ingresado ya está registrado en otra cuenta.', 409);
        }
        throw error;
    } finally {
        client.release();
    }
};

const actualizarFotoPerfil = async (usuario_id, file) => {
    if (!file) throw new AppError('No se recibió ninguna imagen', 400);
    const urlFoto = file.path; 
    
    const resultado = await usuarioModel.actualizarFotoPerfil(usuario_id, urlFoto);
    if (!resultado) throw new AppError('No se pudo actualizar la foto de perfil', 500);
    
    return resultado.foto_perfil;
};

const obtenerEstadisticasUsuario = async (usuario_id) => {
    const estadisticas = await usuarioModel.obtenerEstadisticasUsuario(usuario_id);
    if (!estadisticas) throw new AppError('Usuario no encontrado', 404);
    return estadisticas;
};

module.exports = { registrarUsuario, iniciarSesion, obtenerPerfil, actualizarPerfil, actualizarFotoPerfil, obtenerEstadisticasUsuario };