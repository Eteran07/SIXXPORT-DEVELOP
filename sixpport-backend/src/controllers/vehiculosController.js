const pool = require('../config/db');

const getVehiculos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vehiculos ORDER BY id_vehiculo ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar vehículos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getVehiculoById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM vehiculos WHERE id_vehiculo = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al consultar vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createVehiculo = async (req, res) => {
    const { placa, modelo, color } = req.body;

    if (!placa) {
        return res.status(400).json({ error: 'La placa es obligatoria' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO vehiculos (placa, modelo, color) VALUES ($1, $2, $3) RETURNING *',
            [placa.toUpperCase(), modelo, color]
        );
        res.status(201).json({ mensaje: 'Vehículo registrado exitosamente', vehiculo: result.rows[0] });
    } catch (error) {
        console.error('Error al crear vehículo:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un vehículo con esa placa' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateVehiculo = async (req, res) => {
    const { id } = req.params;
    const { placa, modelo, color } = req.body;

    try {
        const campos = [];
        const valores = [];
        let idx = 1;

        if (placa !== undefined) {
            campos.push(`placa = $${idx++}`);
            valores.push(placa.toUpperCase());
        }
        if (modelo !== undefined) {
            campos.push(`modelo = $${idx++}`);
            valores.push(modelo);
        }
        if (color !== undefined) {
            campos.push(`color = $${idx++}`);
            valores.push(color);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        valores.push(id);
        const query = `UPDATE vehiculos SET ${campos.join(', ')} WHERE id_vehiculo = $${idx} RETURNING *`;
        const result = await pool.query(query, valores);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        res.json({ mensaje: 'Vehículo actualizado exitosamente', vehiculo: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un vehículo con esa placa' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const deleteVehiculo = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM vehiculos WHERE id_vehiculo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        res.json({ mensaje: 'Vehículo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getVehiculos, getVehiculoById, createVehiculo, updateVehiculo, deleteVehiculo };
