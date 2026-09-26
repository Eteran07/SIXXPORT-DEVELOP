-- ==========================================
-- 1. CONFIGURACIÓN DE ROLES Y USUARIOS
-- ==========================================
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES roles(id_rol) ON DELETE RESTRICT,
    nombre_completo VARCHAR(150) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    ultimo_ingreso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. INFRAESTRUCTURA Y TURNOS (Apertura/Cierre)
-- ==========================================
CREATE TABLE areas_destino (
    id_area SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE turnos (
    id_turno SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    hora_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hora_fin TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'Iniciada' CHECK (estado IN ('Iniciada', 'Cerrada')),
    ultimo_checkin TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Soporte para el "Watchdog" de anomalías
);

-- ==========================================
-- 3. ENTIDADES Y SEGURIDAD (Lista Negra)
-- ==========================================
CREATE TABLE personas (
    id_persona SERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Trabajador', 'Visitante', 'Contratista', 'Proveedor', 'Organismo Oficial')),
    empresa VARCHAR(150)
);

CREATE TABLE vehiculos (
    id_vehiculo SERIAL PRIMARY KEY,
    placa VARCHAR(20) UNIQUE NOT NULL,
    modelo VARCHAR(100),
    color VARCHAR(50)
);

CREATE TABLE lista_negra (
    id_bloqueo SERIAL PRIMARY KEY,
    tipo_entidad VARCHAR(20) CHECK (tipo_entidad IN ('Persona', 'Vehiculo')),
    identificador VARCHAR(20) NOT NULL, -- DNI o Placa
    motivo_bloqueo TEXT NOT NULL,
    nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('Crítico', 'Alto', 'Bajo')),
    reportado_por INT REFERENCES usuarios(id_usuario),
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. OPERACIONES DE GARITA Y AUDITORÍA
-- ==========================================
CREATE TABLE pases_temporales (
    id_pase SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES personas(id_persona) ON DELETE CASCADE,
    anfitrion VARCHAR(150),
    id_area_destino INT REFERENCES areas_destino(id_area),
    codigo_acceso VARCHAR(50) UNIQUE NOT NULL, -- Código QR o Clave alfanumérica
    vigencia_inicio TIMESTAMP NOT NULL,
    vigencia_fin TIMESTAMP NOT NULL,
    estado VARCHAR(20) DEFAULT 'Emitido' CHECK (estado IN ('Emitido', 'Utilizado', 'Expirado', 'Revocado'))
);

CREATE TABLE registros_acceso (
    id_registro SERIAL PRIMARY KEY,
    id_persona INT REFERENCES personas(id_persona) ON DELETE RESTRICT,
    id_vehiculo INT REFERENCES vehiculos(id_vehiculo) ON DELETE SET NULL,
    id_turno INT NOT NULL REFERENCES turnos(id_turno) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(10) CHECK (tipo_movimiento IN ('Entrada', 'Salida')),
    id_area_destino INT REFERENCES areas_destino(id_area),
    timestamp_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE novedades (
    id_novedad SERIAL PRIMARY KEY,
    id_turno INT NOT NULL REFERENCES turnos(id_turno) ON DELETE RESTRICT,
    tipo_incidencia VARCHAR(50) NOT NULL, -- Ej: 'Falla Infraestructura', 'Robo', 'Ausencia'
    descripcion TEXT NOT NULL,
    nivel_alerta VARCHAR(20) CHECK (nivel_alerta IN ('Informativo', 'Advertencia', 'Crítico')),
    timestamp_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. REPORTES Y AUDITORÍA EXPORTABLES
-- ==========================================
CREATE TABLE reportes (
    id_reporte SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Accesos', 'Seguridad', 'Turnos', 'Visitas', 'General')),
    generado_por INT REFERENCES usuarios(id_usuario),
    estado VARCHAR(20) DEFAULT 'Procesando' CHECK (estado IN ('Listo para Descargar', 'Procesando', 'Error')),
    ruta_archivo VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles iniciales para poder crear el primer usuario administrador
INSERT INTO roles (nombre, descripcion) VALUES 
('Gerencia', 'Acceso total al sistema y reportes'),
('Recursos Humanos', 'Gestión de personal y accesos web'),
('Vigilante Garita', 'Operación de control de acceso y bitácoras');





-- CONSULTAS--


SELECT 
    column_name AS columna, 
    data_type AS tipo_dato, 
    character_maximum_length AS longitud_maxima, 
    is_nullable AS acepta_nulos, 
    column_default AS valor_por_defecto
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

SELECT id_usuario, id_rol, nombre_completo, dni, email, estado 
FROM usuarios;

SELECT 
    table_catalog AS base_datos,
    table_schema AS esquema,
    table_name AS tabla,
    ordinal_position AS posicion,
    column_name AS columna, 
    data_type AS tipo_dato, 
    character_maximum_length AS max_caracteres, 
    character_octet_length AS max_bytes,
    numeric_precision AS precision_numerica,
    numeric_scale AS escala_numerica,
    datetime_precision AS precision_fecha_hora,
    is_nullable AS acepta_nulos, 
    column_default AS valor_por_defecto,
    is_updatable AS es_actualizable,
    is_identity AS es_identidad
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;