require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/auth', authRoutes);

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

app.listen(PORT, () => {
    console.log(`Servidor RescueNet ejecutándose en el puerto ${PORT}`);
});