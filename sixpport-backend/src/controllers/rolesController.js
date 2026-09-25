const pool = require('../config/db');

const getRoles = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id_rol ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar roles:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getRolById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM roles WHERE id_rol = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al consultar rol:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createRol = async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre del rol es obligatorio' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING *',
            [nombre, descripcion]
        );
        res.status(201).json({ mensaje: 'Rol creado exitosamente', rol: result.rows[0] });
    } catch (error) {
        console.error('Error al crear rol:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateRol = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    try {
        const campos = [];
        const valores = [];
        let idx = 1;

        if (nombre !== undefined) {
            campos.push(`nombre = $${idx++}`);
            valores.push(nombre);
        }
        if (descripcion !== undefined) {
            campos.push(`descripcion = $${idx++}`);
            valores.push(descripcion);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        valores.push(id);
        const query = `UPDATE roles SET ${campos.join(', ')} WHERE id_rol = $${idx} RETURNING *`;
        const result = await pool.query(query, valores);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        res.json({ mensaje: 'Rol actualizado exitosamente', rol: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const deleteRol = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si hay usuarios asignados a este rol
        const usuariosAsignados = await pool.query('SELECT COUNT(*) FROM usuarios WHERE id_rol = $1', [id]);
        if (parseInt(usuariosAsignados.rows[0].count) > 0) {
            return res.status(409).json({ error: 'No se puede eliminar el rol porque tiene usuarios asignados' });
        }

        const result = await pool.query('DELETE FROM roles WHERE id_rol = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        res.json({ mensaje: 'Rol eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getRoles, getRolById, createRol, updateRol, deleteRol };
