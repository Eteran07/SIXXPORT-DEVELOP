const bcrypt = require('bcrypt');
const pool = require('../config/db');

const PASSWORD_DEFAULT = 'Sixxport2026!';
const SALT_ROUNDS = 10;

const roles = [
  { id: 1, nombre: 'Gerencia', descripcion: 'Acceso total al sistema y reportes' },
  { id: 2, nombre: 'Recursos Humanos', descripcion: 'Gestión de personal y accesos web' },
  { id: 3, nombre: 'Vigilante Garita', descripcion: 'Operación de control de acceso y bitácoras' },
];

const usuarios = [
  { id_rol: 1, nombre_completo: 'José Luis De Abreu', dni: '12345678', email: 'admin@sixxport.com', estado: 'Activo' },
  { id_rol: 1, nombre_completo: 'Ing. Pablo K.', dni: '87654321', email: 'pablo.k@sixxport.com', estado: 'Activo' },
  { id_rol: 2, nombre_completo: 'Marcela Alvarado L.', dni: '18245922', email: 'marcela.alvarado@sixxport.com', estado: 'Inactivo' },
  { id_rol: 3, nombre_completo: 'Cap. Julián Silva', dni: '23456789', email: 'julian.silva@sixxport.com', estado: 'Activo' },
  { id_rol: 3, nombre_completo: 'Vig. Tomás Cáceres', dni: '34567890', email: 'tomas.caceres@sixxport.com', estado: 'Activo' },
  { id_rol: 3, nombre_completo: 'Sgto. R. Mendoza', dni: '45678901', email: 'r.mendoza@sixxport.com', estado: 'Activo' },
  { id_rol: 3, nombre_completo: 'Carlos Fuentes L.', dni: '56789012', email: 'carlos.fuentes@sixxport.com', estado: 'Activo' },
  { id_rol: 3, nombre_completo: 'Ana Ríos P.', dni: '67890123', email: 'ana.rios@sixxport.com', estado: 'Activo' },
];

const areasDestino = [
  { nombre: 'Garita 1 (Acceso Norte)', descripcion: 'Acceso principal vehicular y peatonal norte' },
  { nombre: 'Garita 2 (Bahía Logística)', descripcion: 'Control de carga y descarga logística' },
  { nombre: 'Corporativa Central', descripcion: 'Oficinas administrativas centrales' },
  { nombre: 'Sur-Industrial', descripcion: 'Planta industrial sur' },
  { nombre: 'Este-Logística', descripcion: 'Centro de distribución este' },
];

const personas = [
  { dni: '11111111', nombre_completo: 'Pedro Gómez', categoria: 'Trabajador', empresa: 'Sixxport' },
  { dni: '22222222', nombre_completo: 'Lucía Torres', categoria: 'Visitante', empresa: 'Consultora Externa' },
  { dni: '33333333', nombre_completo: 'Miguel Ángel Pérez', categoria: 'Contratista', empresa: 'Constructora Alfa' },
  { dni: '44444444', nombre_completo: 'Sofía Herrera', categoria: 'Proveedor', empresa: 'Suministros Beta' },
  { dni: '55555555', nombre_completo: 'Comisario Rodrigo Díaz', categoria: 'Organismo Oficial', empresa: 'Policía Local' },
  { dni: '66666666', nombre_completo: 'Juan Carlos Ruiz', categoria: 'Trabajador', empresa: 'Sixxport' },
];

const vehiculos = [
  { placa: 'ABC123', modelo: 'Toyota Hilux', color: 'Blanco' },
  { placa: 'XYZ789', modelo: 'Ford Ranger', color: 'Negro' },
  { placa: 'DEF456', modelo: 'Chevrolet D-Max', color: 'Gris' },
  { placa: 'GHI012', modelo: 'Nissan Frontier', color: 'Rojo' },
];

function fecha(diasAtras = 0, horas = 8, minutos = 0) {
  const date = new Date();
  date.setDate(date.getDate() - diasAtras);
  date.setHours(horas, minutos, 0, 0);
  return date.toISOString();
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Limpiar tablas en orden inverso para respetar FK
    console.log('🧹 Limpiando tablas existentes...');
    await client.query('TRUNCATE TABLE reportes, novedades, registros_acceso, pases_temporales, lista_negra, vehiculos, personas, turnos, areas_destino, usuarios, roles RESTART IDENTITY CASCADE');

    // 2. Insertar roles
    console.log('👥 Insertando roles...');
    for (const rol of roles) {
      await client.query(
        'INSERT INTO roles (id_rol, nombre, descripcion) VALUES ($1, $2, $3)',
        [rol.id, rol.nombre, rol.descripcion]
      );
    }

    // 3. Insertar usuarios
    console.log('🔐 Insertando usuarios...');
    const usuariosIds = [];
    for (const u of usuarios) {
      const passwordHash = await hashPassword(PASSWORD_DEFAULT);
      const ultimoIngreso = fecha(Math.floor(Math.random() * 5), 6 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      const result = await client.query(
        `INSERT INTO usuarios (id_rol, nombre_completo, dni, email, password_hash, estado, ultimo_ingreso)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario`,
        [u.id_rol, u.nombre_completo, u.dni, u.email, passwordHash, u.estado, ultimoIngreso]
      );
      usuariosIds.push(result.rows[0].id_usuario);
    }

    // 4. Insertar áreas de destino
    console.log('🏢 Insertando áreas de destino...');
    const areasIds = [];
    for (const area of areasDestino) {
      const result = await client.query(
        'INSERT INTO areas_destino (nombre, descripcion) VALUES ($1, $2) RETURNING id_area',
        [area.nombre, area.descripcion]
      );
      areasIds.push(result.rows[0].id_area);
    }

    // 5. Insertar turnos
    console.log('🕒 Insertando turnos...');
    const turnosIds = [];
    for (let i = 0; i < usuariosIds.length; i++) {
      const idUsuario = usuariosIds[i];
      const horaInicio = fecha(Math.floor(Math.random() * 3), 6, 0);
      const horaFin = fecha(Math.floor(Math.random() * 3), 18, 0);
      const estado = Math.random() > 0.3 ? 'Iniciada' : 'Cerrada';
      const ultimoCheckin = fecha(Math.floor(Math.random() * 2), 14, 30);
      const result = await client.query(
        `INSERT INTO turnos (id_usuario, hora_inicio, hora_fin, estado, ultimo_checkin)
         VALUES ($1, $2, $3, $4, $5) RETURNING id_turno`,
        [idUsuario, horaInicio, horaFin, estado, ultimoCheckin]
      );
      turnosIds.push(result.rows[0].id_turno);
    }

    // 6. Insertar personas
    console.log('🧑 Insertando personas...');
    const personasIds = [];
    for (const p of personas) {
      const result = await client.query(
        'INSERT INTO personas (dni, nombre_completo, categoria, empresa) VALUES ($1, $2, $3, $4) RETURNING id_persona',
        [p.dni, p.nombre_completo, p.categoria, p.empresa]
      );
      personasIds.push(result.rows[0].id_persona);
    }

    // 7. Insertar vehículos
    console.log('🚗 Insertando vehículos...');
    const vehiculosIds = [];
    for (const v of vehiculos) {
      const result = await client.query(
        'INSERT INTO vehiculos (placa, modelo, color) VALUES ($1, $2, $3) RETURNING id_vehiculo',
        [v.placa, v.modelo, v.color]
      );
      vehiculosIds.push(result.rows[0].id_vehiculo);
    }

    // 8. Insertar lista negra
    console.log('🚫 Insertando lista negra...');
    const listaNegra = [
      { tipo: 'Persona', identificador: '22222222', motivo: 'Intento de acceso no autorizado', riesgo: 'Alto', reportadoPor: usuariosIds[0] },
      { tipo: 'Vehiculo', identificador: 'XYZ789', motivo: 'Vehículo reportado en incidente', riesgo: 'Crítico', reportadoPor: usuariosIds[3] },
      { tipo: 'Persona', identificador: '66666666', motivo: 'Contrabando detectado', riesgo: 'Crítico', reportadoPor: usuariosIds[4] },
    ];
    for (const item of listaNegra) {
      await client.query(
        `INSERT INTO lista_negra (tipo_entidad, identificador, motivo_bloqueo, nivel_riesgo, reportado_por, estado)
         VALUES ($1, $2, $3, $4, $5, 'Activo')`,
        [item.tipo, item.identificador, item.motivo, item.riesgo, item.reportadoPor]
      );
    }

    // 9. Insertar pases temporales
    console.log('🎫 Insertando pases temporales...');
    for (let i = 0; i < 4; i++) {
      const idPersona = personasIds[i + 1];
      const idArea = areasIds[i % areasIds.length];
      const vigenciaInicio = fecha(0, 8, 0);
      const vigenciaFin = fecha(0, 18, 0);
      const codigo = `PASE-${1000 + i}`;
      await client.query(
        `INSERT INTO pases_temporales (id_persona, anfitrion, id_area_destino, codigo_acceso, vigencia_inicio, vigencia_fin, estado)
         VALUES ($1, $2, $3, $4, $5, $6, 'Emitido')`,
        [idPersona, usuariosIds[1], idArea, codigo, vigenciaInicio, vigenciaFin]
      );
    }

    // 10. Insertar registros de acceso (datos de hoy para que el dashboard de reportes muestre información)
    console.log('📝 Insertando registros de acceso...');
    const movimientos = ['Entrada', 'Salida'];
    // Peso mayor para Garita 1 y Garita 2 para reflejar el diseño de reportes
    const areaWeights = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4];
    for (let i = 0; i < 40; i++) {
      const idPersona = personasIds[i % personasIds.length];
      const idVehiculo = i % 3 === 0 ? vehiculosIds[i % vehiculosIds.length] : null;
      const idTurno = turnosIds[i % turnosIds.length];
      const idArea = areasIds[areaWeights[i % areaWeights.length] % areasIds.length];
      const movimiento = movimientos[i % 2];
      const hora = 6 + Math.floor(Math.random() * 14);
      const minuto = Math.floor(Math.random() * 60);
      const timestamp = fecha(0, hora, minuto);
      await client.query(
        `INSERT INTO registros_acceso (id_persona, id_vehiculo, id_turno, tipo_movimiento, id_area_destino, timestamp_registro)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [idPersona, idVehiculo, idTurno, movimiento, idArea, timestamp]
      );
    }

    // 11. Insertar novedades
    console.log('⚠️ Insertando novedades...');
    const novedades = [
      { tipo: 'Falla Infraestructura', descripcion: 'Cámara de garita norte sin señal', alerta: 'Advertencia' },
      { tipo: 'Robo', descripcion: 'Herramientas reportadas como sustraídas del depósito', alerta: 'Crítico' },
      { tipo: 'Ausencia', descripcion: 'Retraso en relevo de turno Alfa', alerta: 'Informativo' },
    ];
    for (let i = 0; i < novedades.length; i++) {
      const n = novedades[i];
      const idTurno = turnosIds[i % turnosIds.length];
      const timestamp = fecha(Math.floor(Math.random() * 2), 10 + i, 0);
      await client.query(
        `INSERT INTO novedades (id_turno, tipo_incidencia, descripcion, nivel_alerta, timestamp_reporte)
         VALUES ($1, $2, $3, $4, $5)`,
        [idTurno, n.tipo, n.descripcion, n.alerta, timestamp]
      );
    }

    // 12. Insertar reportes exportables de ejemplo
    console.log('📊 Insertando reportes exportables...');
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - 7);
    const reportes = [
      {
        nombre: 'Consolidado de Accesos Semanal',
        periodo_inicio: inicioSemana.toISOString().slice(0, 10),
        periodo_fin: hoy.toISOString().slice(0, 10),
        categoria: 'Accesos',
        generado_por: usuariosIds[4],
        estado: 'Listo para Descargar',
      },
      {
        nombre: 'Historial Crítico de Lista Negra',
        periodo_inicio: hoy.toISOString().slice(0, 10),
        periodo_fin: hoy.toISOString().slice(0, 10),
        categoria: 'Seguridad',
        generado_por: usuariosIds[3],
        estado: 'Listo para Descargar',
      },
      {
        nombre: 'Bitácora de Novedades Turno Alfa',
        periodo_inicio: hoy.toISOString().slice(0, 10),
        periodo_fin: hoy.toISOString().slice(0, 10),
        categoria: 'Turnos',
        generado_por: usuariosIds[4],
        estado: 'Procesando',
      },
      {
        nombre: 'Auditoría Visitas Especiales Q1',
        periodo_inicio: `${hoy.getFullYear()}-01-01`,
        periodo_fin: `${hoy.getFullYear()}-03-31`,
        categoria: 'Visitas',
        generado_por: usuariosIds[1],
        estado: 'Listo para Descargar',
      },
    ];
    for (const r of reportes) {
      await client.query(
        `INSERT INTO reportes (nombre, periodo_inicio, periodo_fin, categoria, generado_por, estado, ruta_archivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [r.nombre, r.periodo_inicio, r.periodo_fin, r.categoria, r.generado_por, r.estado, `/reportes/reporte_${Date.now()}.csv`]
      );
    }

    await client.query('COMMIT');

    console.log('\n✅ Base de datos poblada correctamente.');
    console.log(`   • ${roles.length} roles`);
    console.log(`   • ${usuarios.length} usuarios`);
    console.log(`   • ${areasDestino.length} áreas de destino`);
    console.log(`   • ${turnosIds.length} turnos`);
    console.log(`   • ${personas.length} personas`);
    console.log(`   • ${vehiculos.length} vehículos`);
    console.log(`   • ${listaNegra.length} registros en lista negra`);
    console.log(`   • 4 pases temporales`);
    console.log(`   • 40 registros de acceso`);
    console.log(`   • ${novedades.length} novedades`);
    console.log(`\n🔑 Credenciales de prueba:`);
    console.log(`   Email: ${usuarios[0].email}`);
    console.log(`   Contraseña: ${PASSWORD_DEFAULT}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error poblando la base de datos:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
