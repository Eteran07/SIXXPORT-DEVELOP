const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Consultar todos los usuarios
const getUsers = async (req, res) => {
    try {
        const query = `
            SELECT u.id_usuario, u.nombre_completo, u.dni, u.email, u.estado, u.ultimo_ingreso, r.id_rol, r.nombre as rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Consultar un usuario por ID
const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.id_usuario, u.nombre_completo, u.dni, u.email, u.estado, u.ultimo_ingreso, r.id_rol, r.nombre as rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al consultar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
    const { id_rol, nombre_completo, dni, email, password, estado = 'Activo' } = req.body;

    if (!id_rol || !nombre_completo || !dni || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: id_rol, nombre_completo, dni, password' });
    }

    try {
        // Verificar que el rol exista
        const rolExiste = await pool.query('SELECT id_rol FROM roles WHERE id_rol = $1', [id_rol]);
        if (rolExiste.rows.length === 0) {
            return res.status(400).json({ error: 'El rol especificado no existe' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO usuarios (id_rol, nombre_completo, dni, email, password_hash, estado)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_usuario, id_rol, nombre_completo, dni, email, estado, ultimo_ingreso
        `;
        const result = await pool.query(query, [id_rol, nombre_completo, dni, email, passwordHash, estado]);
        res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El DNI o email ya están registrados' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { id_rol, nombre_completo, dni, email, estado } = req.body;

    try {
        const campos = [];
        const valores = [];
        let idx = 1;

        if (id_rol !== undefined) {
            campos.push(`id_rol = $${idx++}`);
            valores.push(id_rol);
        }
        if (nombre_completo !== undefined) {
            campos.push(`nombre_completo = $${idx++}`);
            valores.push(nombre_completo);
        }
        if (dni !== undefined) {
            campos.push(`dni = $${idx++}`);
            valores.push(dni);
        }
        if (email !== undefined) {
            campos.push(`email = $${idx++}`);
            valores.push(email);
        }
        if (estado !== undefined) {
            campos.push(`estado = $${idx++}`);
            valores.push(estado);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        valores.push(id);
        const query = `
            UPDATE usuarios
            SET ${campos.join(', ')}
            WHERE id_usuario = $${idx}
            RETURNING id_usuario, id_rol, nombre_completo, dni, email, estado, ultimo_ingreso
        `;
        const result = await pool.query(query, valores);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Usuario actualizado exitosamente', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El DNI o email ya están registrados' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Cambiar contraseña de un usuario
const changePassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'La contraseña es obligatoria' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2 RETURNING id_usuario',
            [passwordHash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Inactivar o eliminar usuario
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const { permanente } = req.query;

    try {
        // Evitar que un usuario se elimine a sí mismo
        if (parseInt(id) === req.usuario.id_usuario) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        }

        if (permanente === 'true') {
            const result = await pool.query('DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            return res.json({ mensaje: 'Usuario eliminado permanentemente' });
        }

        const result = await pool.query(
            "UPDATE usuarios SET estado = 'Inactivo' WHERE id_usuario = $1 RETURNING id_usuario, estado",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ mensaje: 'Usuario inactivado correctamente', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error al eliminar/inactivar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getUsers, getUserById, createUser, updateUser, changePassword, deleteUser };
