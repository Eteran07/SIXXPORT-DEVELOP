# Sixxport Ops

Sistema de control de acceso y operaciones de garita para Sixxport.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 14+
- npm (incluido con Node.js)

---

## Estructura del proyecto

```
SIXXPORT-DEVELOP/
├── .env                        # Variables de entorno del backend
├── sixpport-backend/           # API REST con Express + PostgreSQL
│   ├── database/init.sql       # Script de creación de tablas
│   ├── server.js               # Punto de entrada del servidor
│   └── src/scripts/
│       ├── seedDatabase.js     # Poblado de datos de prueba
│       └── createAdmin.js      # Creación manual de administrador
└── sixpport-frontend/          # Aplicación React + Vite + Tailwind
    └── vite.config.js
```

---

## 1. Configurar la base de datos

1. Crear la base de datos en PostgreSQL:

```sql
CREATE DATABASE sixpport_ops;
```

2. Ajustar las credenciales en el archivo `.env` de la raíz:

```env
PORT=3000
DB_USER=postgres
DB_PASSWORD=1234
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sixpport_ops
JWT_SECRET=secreto_super_seguro
```

> Cambia `DB_USER`, `DB_PASSWORD` y demás valores según tu entorno local.

3. Ejecutar el script de creación de tablas:

```bash
psql -U postgres -d sixpport_ops -f sixpport-backend/database/init.sql
```

> Si usas Windows puedes usar la consola `psql` o herramientas como pgAdmin.

---

## 2. Levantar el backend

```bash
cd sixpport-backend
npm install
npm run dev
```

La API quedará disponible en: `http://localhost:3000`

### Endpoints principales

| Ruta                  | Descripción              |
|-----------------------|--------------------------|
| `POST /api/auth/login`| Login de usuarios        |
| `/api/usuarios`       | CRUD de usuarios         |
| `/api/roles`          | CRUD de roles            |
| `/api/vehiculos`      | CRUD de vehículos        |
| `/api/conductores`    | CRUD de personas         |
| `/api/lista-negra`    | Lista negra              |

---

## 3. Ejecutar los seeders

El seeder principal crea roles, usuarios, áreas, turnos, personas, vehículos, lista negra, pases temporales, registros de acceso y novedades.

```bash
cd sixpport-backend
npm run seed
```

### Credenciales de prueba generadas por el seeder

- **Email:** `admin@sixxport.com`
- **Contraseña:** `Sixxport2026!`

> El seeder **limpia las tablas existentes** antes de insertar los datos.

### Crear solo el administrador (alternativa)

Si solo necesitas un usuario administrador sin datos de prueba:

```bash
cd sixpport-backend
npm run create-admin
```

- **Email:** `admin@sixxport.com`
- **Contraseña:** `Admin123!`

> Asegúrate de haber ejecutado previamente `database/init.sql` para que exista la tabla `roles`.

---

## 4. Levantar el frontend

```bash
cd sixpport-frontend
npm install
npm run dev
```

La aplicación se abrirá por defecto en: `http://localhost:5173`

El frontend se conecta automáticamente al backend usando la variable de entorno `VITE_API_URL`. Si no está definida, usa `http://localhost:3000/api`.

Para apuntar a otra URL de la API:

```bash
# Windows PowerShell
$env:VITE_API_URL="http://localhost:3000/api"; npm run dev

# Git Bash / Linux / macOS
VITE_API_URL=http://localhost:3000/api npm run dev
```

---

## Resumen de comandos

```bash
# Base de datos
psql -U postgres -d sixpport_ops -f sixpport-backend/database/init.sql

# Backend
cd sixpport-backend
npm install
npm run dev

# Seeders
cd sixpport-backend
npm run seed
# o
npm run create-admin

# Frontend
cd sixpport-frontend
npm install
npm run dev
```

---

## Notas adicionales

- El backend usa `dotenv` y carga las variables del archivo `.env` ubicado en la raíz del proyecto.
- Asegúrate de que PostgreSQL esté corriendo antes de iniciar el backend o ejecutar los seeders.
- Si el puerto `3000` está ocupado, cambia `PORT` en el archivo `.env`.
- Si el puerto `5173` está ocupado, Vite automáticamente sugerirá otro puerto.
