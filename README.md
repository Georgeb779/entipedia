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
- PostgreSQL 16
- npm 9+

## Instalación rápida

1. **Instala dependencias:**

   ```bash
   npm install
   ```

2. **Configura variables de entorno:**

   Crea un archivo `.env` en la raíz del proyecto:

   ```env
   DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/entipedia
   SESSION_SECRET=tu-clave-secreta-de-al-menos-32-caracteres
   ```

3. **Prepara la base de datos:**

   ```bash
   npm run db:push
   ```

4. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

¡Listo! El frontend estará en http://localhost:5000 y la API en http://localhost:5999/api/\*

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
- **Backend**: Nitro 3 (H3), Drizzle ORM
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

## Despliegue

```bash
npm run build
npm run start
```

Para más detalles de despliegue, consulta `doc/DEPLOYMENT.md`.
