const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const registrarUsuario = async (req, res) => {
    // 1. Extraemos los datos que envía la app móvil (Flutter)
    const { nombre_completo, telefono, email, password, rol_id, curp } = req.body;

    // 2. Validación estricta de campos obligatorios
    if (!nombre_completo || !telefono || !email || !password || !rol_id) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        // 3. Verificar si el correo ya existe en la base de datos
        const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }

        // 4. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 5. Insertar el usuario en la base de datos
        const insertQuery = `
            INSERT INTO usuarios (rol_id, nombre_completo, telefono, email, password_hash, curp)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, rol_id, nombre_completo, email;
        `;
        const values = [rol_id, nombre_completo, telefono, email, passwordHash, curp || null];
        
        const nuevoUsuario = await pool.query(insertQuery, values);
        const usuario = nuevoUsuario.rows[0];

        // 6. Generar el Token JWT
        const payload = {
            usuario: {
                id: usuario.id,
                rol_id: usuario.rol_id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' }, // El token será válido por 30 días
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

// ... código previo de registrarUsuario ...

const iniciarSesion = async (req, res) => {
    const { email, password } = req.body;

    // 1. Validar que se envíen los datos
    if (!email || !password) {
        return res.status(400).json({ error: 'Por favor ingresa correo y contraseña' });
    }

    try {
        // 2. Buscar al usuario por su correo
        const query = 'SELECT id, rol_id, password_hash, nombre_completo FROM usuarios WHERE email = $1';
        const result = await pool.query(query, [email]);

        // Si no existe el correo, devolvemos un error genérico por seguridad
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // 3. Comparar la contraseña enviada con el Hash de la base de datos
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 4. Si es válida, generamos el Token JWT
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

// Actualizamos la exportación para incluir ambas funciones
module.exports = { registrarUsuario, iniciarSesion };