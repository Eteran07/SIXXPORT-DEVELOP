const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

pool.connect()
    .then(() => console.log('✅ Conectado a la base de datos PostgreSQL'))
    .catch(err => console.error('❌ Error de conexión a la base de datos', err.stack));

module.exports = pool;