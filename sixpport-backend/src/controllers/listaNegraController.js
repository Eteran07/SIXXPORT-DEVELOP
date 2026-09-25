const pool = require('../config/db');

const getListaNegra = async (req, res) => {
    try {
        const query = `
            SELECT ln.*, u.nombre_completo as reportado_por_nombre
            FROM lista_negra ln
            LEFT JOIN usuarios u ON ln.reportado_por = u.id_usuario
            ORDER BY ln.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar lista negra:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getBloqueoById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT ln.*, u.nombre_completo as reportado_por_nombre
            FROM lista_negra ln
            LEFT JOIN usuarios u ON ln.reportado_por = u.id_usuario
            WHERE ln.id_bloqueo = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al consultar lista negra:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createBloqueo = async (req, res) => {
    const { tipo_entidad, identificador, motivo_bloqueo, nivel_riesgo } = req.body;

    if (!tipo_entidad || !identificador || !motivo_bloqueo || !nivel_riesgo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!['Persona', 'Vehiculo'].includes(tipo_entidad)) {
        return res.status(400).json({ error: 'tipo_entidad debe ser Persona o Vehiculo' });
    }

    if (!['Crítico', 'Alto', 'Bajo'].includes(nivel_riesgo)) {
        return res.status(400).json({ error: 'nivel_riesgo debe ser Crítico, Alto o Bajo' });
    }

    try {
        const query = `
            INSERT INTO lista_negra (tipo_entidad, identificador, motivo_bloqueo, nivel_riesgo, reportado_por, estado)
            VALUES ($1, $2, $3, $4, $5, 'Activo')
            RETURNING *
        `;
        const result = await pool.query(query, [
            tipo_entidad,
            identificador.toUpperCase(),
            motivo_bloqueo,
            nivel_riesgo,
            req.usuario.id_usuario,
        ]);
        res.status(201).json({ mensaje: 'Bloqueo registrado exitosamente', bloqueo: result.rows[0] });
    } catch (error) {
        console.error('Error al registrar bloqueo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateBloqueo = async (req, res) => {
    const { id } = req.params;
    const { motivo_bloqueo, nivel_riesgo, estado } = req.body;

    try {
        const campos = [];
        const valores = [];
        let idx = 1;

        if (motivo_bloqueo !== undefined) {
            campos.push(`motivo_bloqueo = $${idx++}`);
            valores.push(motivo_bloqueo);
        }
        if (nivel_riesgo !== undefined) {
            if (!['Crítico', 'Alto', 'Bajo'].includes(nivel_riesgo)) {
                return res.status(400).json({ error: 'nivel_riesgo debe ser Crítico, Alto o Bajo' });
            }
            campos.push(`nivel_riesgo = $${idx++}`);
            valores.push(nivel_riesgo);
        }
        if (estado !== undefined) {
            if (!['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ error: 'estado debe ser Activo o Inactivo' });
            }
            campos.push(`estado = $${idx++}`);
            valores.push(estado);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        valores.push(id);
        const query = `UPDATE lista_negra SET ${campos.join(', ')} WHERE id_bloqueo = $${idx} RETURNING *`;
        const result = await pool.query(query, valores);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        res.json({ mensaje: 'Bloqueo actualizado exitosamente', bloqueo: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar bloqueo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const deleteBloqueo = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM lista_negra WHERE id_bloqueo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json({ mensaje: 'Bloqueo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar bloqueo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getListaNegra, getBloqueoById, createBloqueo, updateBloqueo, deleteBloqueo };
