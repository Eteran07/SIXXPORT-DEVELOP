const pool = require('../config/db');

// Consultar todos los usuarios
const getUsers = async (req, res) => {
    try {
        const query = `
            SELECT u.id_usuario, u.nombre_completo, u.dni, u.email, u.estado, r.nombre as rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getUsers };