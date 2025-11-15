# Entipedia MVP

Sistema de gestión de proyectos, tareas, archivos y clientes. Construido con React 19, Nitro 3 y PostgreSQL 16.

## ¿Qué es esto?

Entipedia es un MVP funcional que permite:

- Gestionar proyectos con tableros Kanban
- Organizar tareas con filtros y vistas personalizadas
- Administrar clientes y contratos
- Subir y organizar archivos por proyecto
- Autenticación segura con sesiones

## Requisitos

- Node.js 20+
- npm 9+
- PostgreSQL 14 o 16 (con extensiones `uuid-ossp`/`pgcrypto` disponibles)
- Cuenta de Cloudflare (R2) y un bucket configurado

## Puesta en marcha rápida

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Georgeb779/entipedia.git
cd entipedia/entipedia-fe
npm install
```

### 2. Configurar base de datos local

#### macOS con Homebrew

```bash
brew install postgresql@14
brew services start postgresql@14

# Crear usuario y base de datos esperados por el proyecto
/opt/homebrew/opt/postgresql@14/bin/createuser -s postgres
/opt/homebrew/opt/postgresql@14/bin/createdb entipedia
```

#### Windows (PowerShell)

- Instala PostgreSQL 14 con `winget` o el instalador oficial:

  ```powershell
  winget install PostgreSQL.PostgreSQL.14
  # o
  choco install postgresql14 -y
  ```

- Agrega el directorio `bin` a tu `PATH` si el instalador no lo hizo (por defecto `C:\Program Files\PostgreSQL\14\bin`).
- Inicia el servicio desde el panel de servicios o ejecuta:

  ```powershell
  net start postgresql-x64-14
  ```

- Crea el usuario y la base de datos si no existen (ajustando la ruta si instalaste en otra carpeta):

  ```powershell
  "C:\Program Files\PostgreSQL\14\bin\createuser.exe" -s postgres
  "C:\Program Files\PostgreSQL\14\bin\createdb.exe" entipedia
  ```

#### Alternativa con Docker

```bash
docker run --name entipedia-postgres \
  -e POSTGRES_PASSWORD=$(openssl rand -hex 16) \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=entipedia \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto y completa:

```env
DATABASE_URL=postgresql://postgres:@localhost:5432/entipedia
SESSION_SECRET=tu-clave-secreta-de-al-menos-32-caracteres

# Cloudflare R2 (obligatorio para subida/descarga de archivos)
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=entipedia
```

### 4. Inicializar el esquema de la base de datos

```bash
npm run db:push
```

Si prefieres migraciones versionadas: `npm run db:generate` seguido de `npm run db:migrate`.

### 5. Ejecutar el entorno de desarrollo

```bash
npm run dev
```

El frontend queda en http://localhost:5000 y la API en http://localhost:5999/api/\*

## PostgreSQL con Docker (opcional)

Si no tienes PostgreSQL instalado:

```bash
docker run --name entipedia-postgres \
  -e POSTGRES_PASSWORD=$(openssl rand -hex 16) \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=entipedia \
  -p 5432:5432 \
  -d postgres:16
```

## Comandos útiles

| Comando                  | Descripción                            |
| ------------------------ | -------------------------------------- |
| `npm run dev`            | Inicia frontend y backend en paralelo  |
| `npm run dev:client`     | Solo frontend (Vite)                   |
| `npm run dev:server`     | Solo backend (Nitro)                   |
| `npm run dev:integrated` | Modo integrado (un solo servidor)      |
| `npm run build`          | Build de producción                    |
| `npm run start`          | Inicia servidor de producción          |
| `npm run db:push`        | Sincroniza esquema de BD (desarrollo)  |
| `npm run db:migrate`     | Aplica migraciones                     |
| `npm run db:studio`      | Abre Drizzle Studio (explorador de BD) |
| `npm run lint`           | Revisa el código con ESLint            |

## Estructura del proyecto

```
entipedia-fe/
├── routes/api/          # Endpoints de la API (Nitro)
│   ├── auth/           # Autenticación
│   ├── projects/       # Proyectos
│   ├── tasks/          # Tareas
│   ├── clients/        # Clientes
│   └── files/          # Archivos
├── src/
│   ├── pages/          # Páginas de la aplicación
│   ├── components/     # Componentes React reutilizables
│   ├── hooks/          # Hooks personalizados (React Query)
│   └── utils/          # Utilidades y helpers
├── db/
│   └── schema.ts       # Esquema de base de datos (Drizzle)
└── middleware/         # Middlewares de Nitro
```

## Tecnologías principales

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, shadcn/ui
- **Backend**: Nitro 3 (H3), Drizzle ORM, Cloudflare R2 (AWS SDK v3)
- **Base de datos**: PostgreSQL 16
- **Autenticación**: Sesiones con cookies HTTP-only

## Problemas comunes

**No conecta a la base de datos:**

- Verifica que PostgreSQL esté corriendo
- Revisa que `DATABASE_URL` en `.env` sea correcta

**Error de SESSION_SECRET:**

- Asegúrate de tener `SESSION_SECRET` en tu `.env`
- Debe tener al menos 32 caracteres

**Problemas con migraciones:**

- En desarrollo, usa `npm run db:push` para sincronizar
- En producción, usa `npm run db:migrate`

**Errores al subir/descargar archivos (R2):**

- Verifica que todas las variables `R2_*` existan y sean correctas
- Asegúrate de que el bucket existe y las credenciales tienen permisos de lectura/escritura
- El endpoint usado es `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com` con `region=auto`

## Archivos: almacenamiento en Cloudflare R2

La gestión de archivos usa Cloudflare R2 a través del SDK de AWS (S3 compatible). El backend expone endpoints autenticados y valida permisos por usuario.

### Variables de entorno necesarias

- `R2_ACCOUNT_ID`: ID de cuenta de Cloudflare
- `R2_ACCESS_KEY_ID`: Access Key de R2
- `R2_SECRET_ACCESS_KEY`: Secret Key de R2
- `R2_BUCKET_NAME`: Nombre del bucket en R2

Si falta cualquiera de estas variables, el servidor fallará al iniciar.

### Límites y formatos

- Tamaño máximo por archivo: definido en `MAX_FILE_SIZE` (ver `src/constants`)
- Tipos permitidos: ver `ALLOWED_FILE_TYPES`
- Los archivos se asocian opcionalmente a un proyecto y pueden tener descripción

### Endpoints

- `POST /api/files` — Subir un archivo
  - FormData esperado: `file` (obligatorio), `projectId` (opcional), `description` (opcional)
  - Respuesta: metadata del archivo almacenado

- `GET /api/files/:id` — Descargar un archivo
  - Responde como stream con headers `Content-Type`, `Content-Disposition` y `Content-Length`

- `PATCH /api/files/:id` — Actualizar metadatos
  - Cuerpo JSON: `{ "projectId?": string | "all", "description?": string }`
  - Permite cambiar proyecto y/o descripción después de la subida

- `DELETE /api/files/:id` — Eliminar un archivo

- `GET /api/storage/health` — Salud de R2 (requiere sesión)

### Flujo en la UI

- En la página de Archivos puedes:
  - Subir con arrastrar/soltar o selector
  - Filtrar por proyecto o tipo
  - Editar proyecto y descripción tras la subida (diálogo “Editar Archivo”)
  - Descargar o eliminar

## Despliegue

```bash
npm run build
npm run start
```

Para más detalles de despliegue, consulta `doc/DEPLOYMENT.md`.
