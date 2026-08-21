require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Importamos el módulo HTTP nativo de Node.js
const pool = require('./src/config/database');
const socketConfig = require('./src/config/socket'); // 2. Importamos tu nueva configuración de WebSockets

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');
const patrocinadorRoutes = require('./src/routes/patrocinadorRoutes');
const patrocinadoresPublicoRoutes = require('./src/routes/patrocinadoresPublicoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/patrocinador', patrocinadorRoutes);
app.use('/api/directorio-patrocinadores', patrocinadoresPublicoRoutes);

app.get('/api/health', async (req, res) => {
    try {
        const dbRes = await pool.query('SELECT NOW()');
        res.status(200).json({ 
            status: 'OK', 
            message: 'Servidor RescueNet operando correctamente',
            db_time: dbRes.rows[0].now 
        });
    } catch (error) {
        console.error('Fallo en la conexión a la base de datos:', error);
        res.status(500).json({ status: 'ERROR', message: 'Base de datos inaccesible' });
    }
});

// 3. Creamos el servidor HTTP explícitamente y le inyectamos la app de Express
const server = http.createServer(app);

// 4. Inicializamos WebSockets enganchándolo a nuestro servidor HTTP
socketConfig.init(server);

// 5. Sustituimos app.listen por server.listen
server.listen(PORT, () => {
    console.log(`Servidor RescueNet ejecutándose en el puerto ${PORT} (con WebSockets habilitados)`);
});