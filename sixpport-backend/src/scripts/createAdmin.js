const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function createAdmin() {
    try {
        const passwordPlain = 'Admin123!';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);

        // Asumimos que el rol 'Gerencia' tiene el id_rol = 1 (creado en el script SQL previo)
        const query = `
            INSERT INTO usuarios (id_rol, nombre_completo, dni, email, password_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [1, 'José Luis De Abreu', '12345678', 'admin@sixpport.com', passwordHash];

        const res = await pool.query(query, values);
        console.log('✅ Administrador creado con éxito:', res.rows[0].email);
        console.log('Contraseña temporal:', passwordPlain);
        process.exit();
    } catch (err) {
        console.error('❌ Error creando administrador:', err);
        process.exit(1);
    }
}

createAdmin();