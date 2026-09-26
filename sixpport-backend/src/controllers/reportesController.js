const pool = require('../config/db');

const getDashboard = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        let whereFecha = '';
        const params = [];

        if (desde && hasta) {
            params.push(desde, hasta);
            whereFecha = `WHERE ra.timestamp_registro::date BETWEEN $${params.length - 1} AND $${params.length}`;
        }

        const cargasQuery = `
            SELECT p.categoria, COUNT(*) AS total
            FROM registros_acceso ra
            JOIN personas p ON ra.id_persona = p.id_persona
            ${whereFecha}
            GROUP BY p.categoria
            ORDER BY total DESC
        `;
        const cargasResult = await pool.query(cargasQuery, params);

        const flujoQuery = `
            SELECT ad.nombre AS punto, COUNT(*) AS total
            FROM registros_acceso ra
            LEFT JOIN areas_destino ad ON ra.id_area_destino = ad.id_area
            ${whereFecha}
            GROUP BY ad.nombre
            ORDER BY total DESC
        `;
        const flujoResult = await pool.query(flujoQuery, params);

        res.json({
            cargasPorCategoria: cargasResult.rows,
            flujoPorPunto: flujoResult.rows,
        });
    } catch (error) {
        console.error('Error al consultar dashboard de reportes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getReportes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, u.nombre_completo AS generado_por_nombre
            FROM reportes r
            LEFT JOIN usuarios u ON r.generado_por = u.id_usuario
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar reportes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createReporte = async (req, res) => {
    const { nombre, periodo_inicio, periodo_fin, categoria } = req.body;

    if (!nombre || !periodo_inicio || !periodo_fin || !categoria) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const categoriasPermitidas = ['Accesos', 'Seguridad', 'Turnos', 'Visitas', 'General'];
    if (!categoriasPermitidas.includes(categoria)) {
        return res.status(400).json({ error: 'Categoría no válida' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO reportes (nombre, periodo_inicio, periodo_fin, categoria, generado_por, estado, ruta_archivo)
             VALUES ($1, $2, $3, $4, $5, 'Procesando', $6)
             RETURNING *`,
            [nombre, periodo_inicio, periodo_fin, categoria, req.usuario.id_usuario, `/reportes/reporte_${Date.now()}.csv`]
        );

        // Simular procesamiento asíncrono: marcar como listo después de un breve delay
        setTimeout(async () => {
            try {
                await pool.query(
                    "UPDATE reportes SET estado = 'Listo para Descargar' WHERE id_reporte = $1",
                    [result.rows[0].id_reporte]
                );
            } catch (err) {
                console.error('Error al actualizar estado del reporte:', err);
            }
        }, 2000);

        res.status(201).json({ mensaje: 'Reporte en proceso', reporte: result.rows[0] });
    } catch (error) {
        console.error('Error al crear reporte:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const downloadReporte = async (req, res) => {
    const { id } = req.params;
    try {
        const reporteResult = await pool.query(
            `SELECT r.*, u.nombre_completo AS generado_por_nombre
             FROM reportes r
             LEFT JOIN usuarios u ON r.generado_por = u.id_usuario
             WHERE r.id_reporte = $1`,
            [id]
        );

        if (reporteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const reporte = reporteResult.rows[0];

        if (reporte.estado !== 'Listo para Descargar') {
            return res.status(400).json({ error: 'El reporte aún no está listo para descargar' });
        }

        let dataQuery;
        let params = [reporte.periodo_inicio, reporte.periodo_fin];

        switch (reporte.categoria) {
            case 'Seguridad':
                dataQuery = `
                    SELECT ln.tipo_entidad, ln.identificador, ln.motivo_bloqueo, ln.nivel_riesgo, ln.estado, ln.created_at
                    FROM lista_negra ln
                    WHERE ln.created_at::date BETWEEN $1 AND $2
                    ORDER BY ln.created_at DESC
                `;
                break;
            case 'Turnos':
                dataQuery = `
                    SELECT t.id_turno, u.nombre_completo AS vigilante, t.hora_inicio, t.hora_fin, t.estado, t.ultimo_checkin
                    FROM turnos t
                    JOIN usuarios u ON t.id_usuario = u.id_usuario
                    WHERE t.hora_inicio::date BETWEEN $1 AND $2
                    ORDER BY t.hora_inicio DESC
                `;
                break;
            case 'Visitas':
                dataQuery = `
                    SELECT p.nombre_completo, p.dni, p.categoria, pt.codigo_acceso, pt.vigencia_inicio, pt.vigencia_fin, pt.estado
                    FROM pases_temporales pt
                    JOIN personas p ON pt.id_persona = p.id_persona
                    WHERE pt.vigencia_inicio::date BETWEEN $1 AND $2
                    ORDER BY pt.vigencia_inicio DESC
                `;
                break;
            case 'Accesos':
            default:
                dataQuery = `
                    SELECT ra.id_registro, p.nombre_completo, p.dni, p.categoria, v.placa, ad.nombre AS punto,
                           ra.tipo_movimiento, ra.timestamp_registro
                    FROM registros_acceso ra
                    LEFT JOIN personas p ON ra.id_persona = p.id_persona
                    LEFT JOIN vehiculos v ON ra.id_vehiculo = v.id_vehiculo
                    LEFT JOIN areas_destino ad ON ra.id_area_destino = ad.id_area
                    WHERE ra.timestamp_registro::date BETWEEN $1 AND $2
                    ORDER BY ra.timestamp_registro DESC
                `;
                break;
        }

        const dataResult = await pool.query(dataQuery, params);
        const rows = dataResult.rows;

        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        const csvHeader = headers.join(',');
        const csvRows = rows.map((row) =>
            headers
                .map((h) => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    const str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                })
                .join(',')
        );
        const csv = [csvHeader, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reporte.nombre.replace(/\s+/g, '_')}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error al descargar reporte:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getDashboard, getReportes, createReporte, downloadReporte };
