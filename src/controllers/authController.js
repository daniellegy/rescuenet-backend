const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const registrarUsuario = async (req, res) => {
    const { nombre_completo, telefono, email, password, rol_id, curp } = req.body;

    if (!nombre_completo || !telefono || !email || !password || !rol_id) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const insertQuery = `
            INSERT INTO usuarios (rol_id, nombre_completo, telefono, email, password_hash, curp)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, rol_id, nombre_completo, email;
        `;
        const values = [rol_id, nombre_completo, telefono, email, passwordHash, curp || null];
        
        const nuevoUsuario = await pool.query(insertQuery, values);
        const usuario = nuevoUsuario.rows[0];

        const payload = {
            usuario: {
                id: usuario.id,
                rol_id: usuario.rol_id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' }, 
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    mensaje: 'Usuario registrado exitosamente',
                    token: token,
                    usuario: usuario
                });
            }
        );

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
    }
};

const iniciarSesion = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Por favor ingresa correo y contraseña' });
    }

    try {
        const query = 'SELECT id, rol_id, password_hash, nombre_completo FROM usuarios WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const payload = {
            usuario: {
                id: usuario.id,
                rol_id: usuario.rol_id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    mensaje: 'Inicio de sesión exitoso',
                    token: token,
                    usuario: {
                        id: usuario.id,
                        rol_id: usuario.rol_id,
                        nombre: usuario.nombre_completo
                    }
                });
            }
        );

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
    }
};

// NUEVA FUNCIÓN: Validar token al abrir la app
const verificarToken = async (req, res) => {
    // Si llega a este punto, el middleware auth.js ya confirmó que el token es real y no ha expirado
    try {
        return res.status(200).json({
            mensaje: 'Token válido',
            usuario: req.usuario // req.usuario contiene id y rol_id insertados por el middleware
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error al verificar la sesión' });
    }
};

module.exports = { registrarUsuario, iniciarSesion, verificarToken };