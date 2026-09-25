const pool = require('../config/db');

const getConductores = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM personas WHERE categoria = 'Contratista' OR categoria = 'Trabajador' ORDER BY id_persona ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar conductores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getConductorById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM personas WHERE id_persona = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al consultar conductor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createConductor = async (req, res) => {
    const { dni, nombre_completo, empresa, categoria = 'Contratista' } = req.body;

    if (!dni || !nombre_completo) {
        return res.status(400).json({ error: 'DNI y nombre completo son obligatorios' });
    }

    const categoriasPermitidas = ['Trabajador', 'Visitante', 'Contratista', 'Proveedor', 'Organismo Oficial'];
    if (!categoriasPermitidas.includes(categoria)) {
        return res.status(400).json({ error: 'Categoría no válida' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO personas (dni, nombre_completo, categoria, empresa) VALUES ($1, $2, $3, $4) RETURNING *',
            [dni, nombre_completo, categoria, empresa]
        );
        res.status(201).json({ mensaje: 'Conductor registrado exitosamente', conductor: result.rows[0] });
    } catch (error) {
        console.error('Error al crear conductor:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una persona con ese DNI' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateConductor = async (req, res) => {
    const { id } = req.params;
    const { dni, nombre_completo, empresa, categoria } = req.body;

    try {
        const campos = [];
        const valores = [];
        let idx = 1;

        if (dni !== undefined) {
            campos.push(`dni = $${idx++}`);
            valores.push(dni);
        }
        if (nombre_completo !== undefined) {
            campos.push(`nombre_completo = $${idx++}`);
            valores.push(nombre_completo);
        }
        if (empresa !== undefined) {
            campos.push(`empresa = $${idx++}`);
            valores.push(empresa);
        }
        if (categoria !== undefined) {
            const categoriasPermitidas = ['Trabajador', 'Visitante', 'Contratista', 'Proveedor', 'Organismo Oficial'];
            if (!categoriasPermitidas.includes(categoria)) {
                return res.status(400).json({ error: 'Categoría no válida' });
            }
            campos.push(`categoria = $${idx++}`);
            valores.push(categoria);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        valores.push(id);
        const query = `UPDATE personas SET ${campos.join(', ')} WHERE id_persona = $${idx} RETURNING *`;
        const result = await pool.query(query, valores);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado' });
        }

        res.json({ mensaje: 'Conductor actualizado exitosamente', conductor: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar conductor:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una persona con ese DNI' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const deleteConductor = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM personas WHERE id_persona = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado' });
        }
        res.json({ mensaje: 'Conductor eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar conductor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getConductores, getConductorById, createConductor, updateConductor, deleteConductor };
