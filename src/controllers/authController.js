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

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({
                mensaje: 'Usuario registrado exitosamente',
                token: token,
                usuario: {
                    id: usuario.id,
                    rol_id: usuario.rol_id,
                    nombre: usuario.nombre_completo
                }
            });
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const iniciarSesion = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Por favor ingresa correo y contraseña' });
    }

    try {
        const result = await pool.query('SELECT id, rol_id, password_hash, nombre_completo FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];
        const isMatch = await bcrypt.compare(password, usuario.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const payload = {
            usuario: {
                id: usuario.id,
                rol_id: usuario.rol_id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
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
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
    }
};

const verificarToken = async (req, res) => {
    try {
        return res.status(200).json({
            mensaje: 'Token válido',
            usuario: req.usuario
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error al verificar la sesión' });
    }
};

const obtenerPerfil = async (req, res) => {
    try {
        const query = 'SELECT id, rol_id AS role, nombre_completo, telefono, email, curp FROM usuarios WHERE id = $1';
        const result = await pool.query(query, [req.usuario.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({ error: 'Error interno al cargar el perfil' });
    }
};

const actualizarPerfil = async (req, res) => {
    // AÑADIDO: Recibir la curp
    const { telefono, email, role, curp } = req.body; 
    const usuario_id = req.usuario.id; 

    try {
        if (telefono && !/^[0-9\-()+\s]{10,15}$/.test(telefono)) {
            return res.status(400).json({ error: 'Formato de teléfono inválido' });
        }

        if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            return res.status(400).json({ error: 'Formato de correo inválido' });
        }

        if (role && role !== 1 && role !== 2) {
            return res.status(403).json({ error: 'Acción denegada. Rol inválido.' });
        }

        // AÑADIDO: Validación de seguridad para la CURP
        if (curp && curp.trim().length !== 18) {
            return res.status(400).json({ error: 'El CURP proporcionado es inválido (debe tener 18 caracteres).' });
        }

        // AÑADIDO: curp en el COALESCE
        const updateQuery = `
            UPDATE usuarios 
            SET 
                telefono = COALESCE($1, telefono),
                email = COALESCE($2, email),
                rol_id = COALESCE($3, rol_id),
                curp = COALESCE($4, curp)
            WHERE id = $5
            RETURNING id, rol_id AS role, nombre_completo, telefono, email, curp;
        `;
        
        const result = await pool.query(updateQuery, [telefono || null, email || null, role || null, curp || null, usuario_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json({
            mensaje: 'Perfil actualizado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505' && error.constraint === 'usuarios_email_key') {
            return res.status(409).json({ error: 'El correo electrónico ya está en uso por otra cuenta.' });
        }
        console.error('Error al actualizar el perfil:', error);
        return res.status(500).json({ error: 'Error interno al actualizar perfil' });
    }
};

module.exports = { registrarUsuario, iniciarSesion, verificarToken, obtenerPerfil, actualizarPerfil };