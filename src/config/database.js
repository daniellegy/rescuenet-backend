const { Pool } = require('pg');
require('dotenv').config();

// Verificamos que la URL exista en el entorno
if (!process.env.DATABASE_URL) {
    console.error("Error: Falta la variable DATABASE_URL en el archivo .env");
    process.exit(-1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Requerido para conexiones serverless cifradas como NeonDB
    }
});

pool.on('error', (err, client) => {
    console.error('Error crítico inesperado en la base de datos NeonDB:', err);
    process.exit(-1);
});

module.exports = pool;