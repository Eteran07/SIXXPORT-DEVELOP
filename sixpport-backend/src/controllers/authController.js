const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar si el usuario existe
        const userQuery = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = userQuery.rows[0];

        // 2. Verificar si está activo
        if (user.estado !== 'Activo') {
            return res.status(403).json({ error: 'Usuario inactivo. Contacte a soporte.' });
        }

        // 3. Comparar contraseñas
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 4. Generar Token JWT
        const token = jwt.sign(
            { id_usuario: user.id_usuario, id_rol: user.id_rol, dni: user.dni },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                nombre: user.nombre_completo,
                rol: user.id_rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { login };