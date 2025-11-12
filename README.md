# Entipedia MVP – Guía Técnica

Documentación oficial del proyecto full-stack construido con React, TypeScript y Nitro. Esta guía explica la arquitectura, los requisitos y el flujo de trabajo recomendado para desarrollar, probar y desplegar Entipedia.

---

## Índice

- [Visión general](#visión-general)
- [Características clave](#características-clave)
- [Requisitos previos](#requisitos-previos)
- [Instalación y configuración](#instalación-y-configuración)
- [Variables de entorno](#variables-de-entorno)
- [Comandos disponibles](#comandos-disponibles)
- [Ejecución local](#ejecución-local)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujos funcionales principales](#flujos-funcionales-principales)
- [Buenas prácticas de desarrollo](#buenas-prácticas-de-desarrollo)
- [Despliegue](#despliegue)
- [Resolución de problemas](#resolución-de-problemas)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## Visión general

Entipedia es un MVP productivo para gestionar proyectos, tareas y archivos dentro de un entorno colaborativo. El frontend se apoya en React 19 con Vite y Tailwind, mientras que el backend utiliza Nitro (H3) con PostgreSQL y Drizzle ORM para ofrecer una API segura y tipada.

---

## Características clave

- **Frontend moderno**: React 19, TypeScript, Tailwind CSS 4 y componentes de shadcn/ui.
- **Gestión de tareas**: filtros avanzados, vista tabla, tablero Kanban y actualizaciones optimistas.
- **Gestión de proyectos**: tablero Kanban, vista tabla con fechas formateadas y acciones rápidas.
- **Autenticación segura**: sesiones cifradas, cookies HTTP-only y validaciones con bcrypt.
- **API robusta**: rutas basadas en archivos, middleware de protección y respuestas consistentes.
- **ORM tipado**: Drizzle sobre PostgreSQL con migraciones automatizadas.
- **Experiencia DX optimizada**: ESLint, Husky, Docker, scripts de base de datos y documentación de despliegue.

---

## Requisitos previos

Asegúrate de contar con las siguientes herramientas antes de comenzar:

- Node.js 20 o superior.
- npm 9 o superior.
- PostgreSQL 16 (local o remoto).
- Docker (opcional, para levantar PostgreSQL rápidamente).
- OpenSSL (opcional, para generar contraseñas seguras).

---

## Instalación y configuración

1. Clona el repositorio y entra al directorio del frontend:

   ```bash
   git clone <URL_DEL_REPO>
   cd entipedia-fe
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia el archivo de variables de entorno y ajusta los valores:

   ```bash
   cp .env.example .env
   ```

   Las claves obligatorias se detallan en la sección [Variables de entorno](#variables-de-entorno).

4. (Opcional) Levanta PostgreSQL con Docker:

   ```bash
   docker run --name entipedia-postgres \
     -e POSTGRES_PASSWORD=$(openssl rand -hex 16) \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_DB=entipedia \
     -p 5432:5432 \
     -d postgres:16
   ```

---

## Variables de entorno

Completa el archivo `.env` con los siguientes campos:

- `DATABASE_URL`: cadena de conexión a PostgreSQL, incluyendo usuario, contraseña, host, puerto y base de datos.
- `SESSION_SECRET`: clave de al menos 32 caracteres para cifrar las sesiones. Genera una distinta por entorno.

Valores opcionales adicionales se documentan en `db/README.md` y en los archivos de configuración correspondientes.

---

## Comandos disponibles

| Comando                  | Descripción                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `npm run dev`            | Levanta frontend (http://localhost:5000) y backend Nitro (http://localhost:5999). |
| `npm run dev:client`     | Ejecuta solo el cliente Vite.                                                     |
| `npm run dev:server`     | Ejecuta solo el servidor Nitro.                                                   |
| `npm run dev:integrated` | Nitro integrado dentro de Vite (modo legado).                                     |
| `npm run build`          | Build de producción para cliente y servidor.                                      |
| `npm run preview`        | Previsualización del build generado.                                              |
| `npm run lint`           | Revisa el código con ESLint.                                                      |
| `npm run db:push`        | Sincroniza el esquema de Drizzle con la base de datos (desarrollo).               |
| `npm run db:migrate`     | Aplica migraciones pendientes.                                                    |
| `npm run db:generate`    | Genera migraciones a partir del esquema.                                          |
| `npm run db:studio`      | Abre Drizzle Studio para explorar la base de datos.                               |

---

## Ejecución local

### Modo dual (recomendado)

```bash
npm run dev
```

- Frontend: http://localhost:5000
- API: http://localhost:5999/api/\* (proxied desde Vite)

### Solo frontend

```bash
npm run dev:client
```

### Solo API Nitro

```bash
npm run dev:server
```

### Modo integrado (Nitro dentro de Vite)

```bash
npm run dev:integrated
```

> Nota: Vite redirige automáticamente las peticiones a `/api/*` hacia Nitro cuando está activo en el puerto 5999.

---

## Base de datos y migraciones

1. Tras configurar `.env`, sincroniza el esquema:

   ```bash
   npm run db:push
   ```

2. Para generar nuevas migraciones al modificar el esquema:

   ```bash
   npm run db:generate
   ```

3. Aplica migraciones en otros entornos con:

   ```bash
   npm run db:migrate
   ```

4. Explora la base de datos gráficamente:

   ```bash
   npm run db:studio
   ```

Consulta `db/README.md` para más detalles sobre Drizzle y workflows de bases de datos.

---

## Estructura del proyecto

```
entipedia/
├── configs/              # Configuraciones compartidas (fuentes, etc.)
├── doc/                  # Documentación adicional (ej. despliegue)
├── middleware/           # Middlewares Nitro
├── public/               # Assets estáticos
├── routes/               # Rutas API Nitro
│   └── api/
│       ├── files/        # CRUD de archivos
│       └── tasks/        # CRUD de tareas y cambio de estado
├── scripts/              # Scripts auxiliares (deploy, etc.)
├── src/                  # Frontend React
│   ├── components/       # Componentes reutilizables (incluye UI y Kanban)
│   ├── pages/            # Rutas cliente (vite-plugin-pages)
│   ├── hooks/            # React Query y lógica cliente
│   ├── utils/            # Utilidades (formateo fechas, helpers)
│   ├── store/            # Estado global (si aplica)
│   └── types/            # Tipos TypeScript compartidos
├── tailwind.config.ts    # Configuración Tailwind
├── vite.config.ts        # Configuración Vite
└── package.json          # Dependencias y scripts
```

---

## Flujos funcionales principales

### Autenticación

- Registro, login y logout mediante `/api/auth/*`.
- Sesiones cifradas con cookies HTTP-only (`SESSION_SECRET`).
- Hooks `useAuth` y `useAuthActions` exponen el estado en el cliente.

### Gestión de tareas

- Endpoints REST bajo `/api/tasks`.
- Vistas: tabla con filtros y tablero Kanban con drag-and-drop accesible.
- Actualizaciones de estado optimistas con `useUpdateTaskStatus`.

### Gestión de proyectos

- Tablero Kanban y vista tabla con recuento de tareas.
- Acciones rápidas (ver, editar, eliminar) desde tarjetas y tablas.

### Gestión de archivos

- Subida, descarga y eliminación en `/api/files`.
- Validaciones de tipo MIME y tamaño (10 MB por defecto).
- Archivos almacenados en el directorio `uploads/` (ignorado por git).

---

## Buenas prácticas de desarrollo

- Ejecuta `npm run lint` antes de enviar cambios.
- Usa las rutas y tipos definidos para mantener la consistencia.
- Mantén separada la lógica de negocio en hooks y utilidades reutilizables.
- Evita introducir dependencias globales no tipadas; aprovecha TypeScript al máximo.
- Documenta nuevos comandos o procesos en esta guía o en `doc/`.

---

## Despliegue

### Build de producción

```bash
npm run build
npm run preview
```

### Docker

```bash
docker build -t entipedia-app .
docker run -p 5000:5000 entipedia-app
```

### VPS con nginx

Consulta `doc/DEPLOYMENT.md` para una guía paso a paso que cubre:

- Configuración de nginx como reverse proxy.
- Arranque del servidor con PM2 o systemd.
- Certificados SSL con Let’s Encrypt.
- Estrategias de actualización y monitoreo.

---

## Resolución de problemas

- **`npm run dev` no conecta con la base de datos**: verifica `DATABASE_URL` y que PostgreSQL esté escuchando en el puerto configurado.
- **Error `SESSION_SECRET` no definido**: asegúrate de definir esta variable antes de arrancar el servidor Nitro.
- **Fallos en migraciones**: limpia migraciones incompletas con `npm run db:push` o restablece la base de datos según sea necesario.
- **Problemas con drag-and-drop**: revisa que no existan errores en consola y verifica la configuración de `@dnd-kit`.

---

## Contribución

1. Crea un fork y una rama descriptiva (`feature/nueva-funcionalidad`).
2. Añade tests o validaciones cuando sea relevante.
3. Actualiza la documentación si cambias flujos o comandos.
4. Envía un Pull Request describiendo el contexto, cambios y pruebas realizadas.

¡Las contribuciones y sugerencias son bienvenidas!

---

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
