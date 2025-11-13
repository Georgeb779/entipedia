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

Entipedia es un MVP listo para producción para gestionar proyectos, tareas, archivos y clientes dentro de un entorno colaborativo. El frontend se apoya en React 19, Vite 7 y Tailwind CSS 4; el backend utiliza Nitro 3 (H3) con PostgreSQL 16 y Drizzle ORM para ofrecer una API segura y tipada.

Estado actual del proyecto:

- MVP funcional: autenticación básica, gestión de tareas y proyectos, carga/descarga de archivos.
- Enrutamiento SPA con fallback del lado del servidor solo en producción (para enlaces profundos).
- Modo de desarrollo dual (cliente y API) y modo integrado (solo cliente) documentados más abajo.

---

## Características clave

- Frontend moderno: React 19, TypeScript, Tailwind CSS 4 y componentes de shadcn/ui.
- Gestión de clientes: seguimiento de personas y empresas (tipos), valores de contrato, fechas de inicio/fin y edición en línea.
- Gestión de tareas: filtros avanzados, vista tabla, tablero Kanban y actualizaciones optimistas.
- Gestión de proyectos: tablero Kanban, vista tabla con fechas formateadas y acciones rápidas. Los proyectos contienen tareas y archivos (vía `projectId`).
- Autenticación segura: sesiones cifradas, cookies HTTP-only y validaciones con bcrypt.
- API robusta: rutas basadas en archivos, middleware de protección y respuestas consistentes.
- ORM tipado: Drizzle sobre PostgreSQL con migraciones automatizadas.
- Experiencia DX optimizada: ESLint, Husky, Docker, scripts de base de datos y documentación de despliegue.

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
| `npm run dev:integrated` | Modo integrado: Vite + Nitro integrados (un solo servidor).                       |
| `npm run build`          | Build de producción para cliente y servidor.                                      |
| `npm run preview`        | Vista previa del build generado.                                                  |
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
- API: http://localhost:5999/api/\* (con proxy desde Vite)

### Solo frontend

```bash
npm run dev:client
```

### Solo API Nitro

```bash
npm run dev:server
```

### Modo integrado (Vite + Nitro integrados)

```bash
npm run dev:integrated
```

- Un solo servidor de desarrollo: Vite sirve el frontend y Nitro embebido expone `/api/*` en el mismo origen (p. ej., http://localhost:5000).
- No necesitas ejecutar `npm run dev:server` en este modo.
- El fallback SPA del lado del servidor está desactivado en desarrollo para evitar conflictos con Vite.

---

## Documentación de la API

- Interfaz interactiva de Swagger: http://localhost:5000/docs (o la ruta equivalente en producción)
- Especificación OpenAPI: http://localhost:5000/openapi

Notas:

- La especificación inicial es mínima y cubre los endpoints existentes. Podemos enriquecer esquemas y ejemplos progresivamente.
- La interfaz de Swagger se sirve desde un archivo de ruta (`routes/docs.get.ts`) y referencia la especificación en `/openapi`.
- Los recursos (`swagger-ui.css`, `swagger-ui-bundle.js`, etc.) se sirven localmente desde el paquete `swagger-ui` mediante rutas dedicadas bajo `/docs/*`.

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

## Esquema de base de datos

Tablas principales y relaciones (ver `db/schema.ts`):

- `users`: id, email, password, name, createdAt, updatedAt.
- `projects`: id, name, description, status (todo/in_progress/done), priority (low/medium/high), userId (FK), createdAt, updatedAt.
- `tasks`: id, title, description, status (todo/in_progress/done), priority, dueDate, userId (FK), projectId (FK), createdAt, updatedAt.
- `files`: id, filename, storedFilename, mimeType, size, path, description, userId (FK), projectId (FK), createdAt.
- `clients`: id, name, type (person/company), value, startDate, endDate, userId (FK), createdAt, updatedAt.

Relaciones clave:

- Un usuario es propietario de proyectos, tareas, archivos y clientes.
- Un proyecto contiene tareas y archivos mediante `projectId`.

Enums utilizados:

- `taskStatusEnum`, `projectStatusEnum`, `projectPriorityEnum`, `clientTypeEnum`.

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
│       ├── auth/         # Auth (login, register, logout, session)
│       ├── clients/      # CRUD de clientes
│       ├── files/        # CRUD de archivos
│       ├── projects/     # CRUD de proyectos
│       ├── tasks/        # CRUD de tareas y cambio de estado
│       └── users/        # Endpoints de usuarios
├── scripts/              # Scripts auxiliares (deploy, etc.)
├── src/                  # Frontend React
│   ├── components/       # Componentes reutilizables (incluye UI y Kanban)
│   ├── pages/            # Rutas cliente (vite-plugin-pages)
│   │   ├── auth/         # Registro/Login
│   │   ├── dashboard/    # Resumen y accesos rápidos
│   │   ├── clients/      # Gestión de clientes
│   │   ├── files/        # Exploración y subida de archivos
│   │   ├── tasks/        # Tareas (tabla/kanban)
│   │   ├── projects/     # Proyectos (tabla/kanban y detalle)
│   │   └── users/        # Listado/detalle de usuarios
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

### Gestión de clientes

- Endpoints REST bajo `/api/clients` (listar, crear, actualizar y eliminar).
- Tipos de cliente: persona y empresa (`clientTypeEnum`).
- Seguimiento de valor de contrato (`value`) y rango de fechas (`startDate`, `endDate`).
- Edición en línea en el cliente (navegación por teclado y actualización rápida en `src/pages/clients`).

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
- Asociación a proyectos mediante `projectId` para mantener el contexto.
- Clasificación automática en seis categorías: imagen, documento, video, audio, archivo y otros.

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

- Configuración de nginx como proxy inverso.
- Arranque del servidor con PM2 o systemd.
- Certificados SSL con Let’s Encrypt.
- Estrategias de actualización y monitoreo.

---

### SPA y enlaces profundos en producción

- En producción, Nitro sirve los assets compilados desde `dist/` con los tipos MIME correctos.
- Existe una ruta catch‑all `routes/[...spa].get.ts` que entrega `index.html` exclusivamente para navegaciones de documento (GET/HEAD con Accept: text/html), sin interceptar `/api/*` ni archivos estáticos.
- Esto permite recargar o abrir enlaces profundos (p. ej., `/about`, `/tasks/123`) sin errores 404.

---

## Resolución de problemas

- `npm run dev` no conecta con la base de datos: verifica `DATABASE_URL` y que PostgreSQL esté escuchando en el puerto configurado.
- Error `SESSION_SECRET` no definido: asegúrate de definir esta variable antes de arrancar el servidor Nitro.
- Fallos en migraciones: limpia migraciones incompletas con `npm run db:push` o restablece la base de datos según sea necesario.
- Problemas con drag-and-drop: revisa que no existan errores en consola y verifica la configuración de `@dnd-kit`.

- “Failed to load module script… MIME type ‘text/html’”:
  - En desarrollo integrado, asegúrate de no tener un fallback del servidor activo. Este repo desactiva el fallback SPA en dev y solo lo habilita en producción.
  - Verifica que los assets se sirvan desde Vite (http://localhost:5000) y que las rutas solicitadas terminen en `/assets/*.js` con `Content-Type: application/javascript`.
  - En producción, confirma que `nitro.config.ts` tiene `publicAssets` habilitado y que el HTML compilado referencia rutas absolutas correctas (`/assets/...`).
  - Limpia la caché del navegador o prueba una ventana privada si persisten rutas antiguas.

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

Entipedia es un MVP productivo para gestionar proyectos, tareas, archivos y clientes dentro de un entorno colaborativo. El frontend se apoya en React 19, Vite 7 y Tailwind CSS 4; el backend utiliza Nitro 3 (H3) con PostgreSQL 16 y Drizzle ORM para ofrecer una API segura y tipada.

Estado actual del proyecto:

- MVP funcional: autenticación básica, gestión de tareas y proyectos, carga/descarga de archivos.
- Enrutamiento SPA con fallback del lado del servidor solo en producción (para enlaces profundos).
- Modo de desarrollo dual (cliente y API) y modo integrado (solo cliente) documentados abajo.

---

## Características clave

- **Frontend moderno**: React 19, TypeScript, Tailwind CSS 4 y componentes de shadcn/ui.
- **Gestión de clientes**: seguimiento de personas y empresas (tipos), valores de contrato, fechas de inicio/fin y edición en línea.
- **Gestión de tareas**: filtros avanzados, vista tabla, tablero Kanban y actualizaciones optimistas.
- **Gestión de proyectos**: tablero Kanban, vista tabla con fechas formateadas y acciones rápidas. Los proyectos contienen tareas y archivos (vía `projectId`).
- **Autenticación segura**: sesiones cifradas, cookies HTTP-only y validaciones con bcrypt.
- **API robusta**: rutas basadas en archivos, middleware de protección y respuestas consistentes.
- **ORM tipado**: Drizzle sobre PostgreSQL con migraciones automatizadas.
- **Experiencia DX optimizada**: ESLint, Husky, Docker, scripts de base de datos y documentación de despliegue.

---

## Requisitos previos

Asegúrate de contar con las siguientes herramientas antes de comenzar:
Entipedia es un MVP listo para producción para gestionar proyectos, tareas, archivos y clientes dentro de un entorno colaborativo. El frontend se apoya en React 19, Vite 7 y Tailwind CSS 4; el backend utiliza Nitro 3 (H3) con PostgreSQL 16 y Drizzle ORM para ofrecer una API segura y tipada.

- Node.js 20 o superior.
  Modo de desarrollo dual (cliente y API) y modo integrado (solo cliente) documentados más abajo.
- PostgreSQL 16 (local o remoto).
- Docker (opcional, para levantar PostgreSQL rápidamente).
- OpenSSL (opcional, para generar contraseñas seguras).

---

| `npm run preview` | Vista previa del build generado. |

1. Clona el repositorio y entra al directorio del frontend:

   ```bash
   git clone <URL_DEL_REPO>
   cd entipedia-fe
   ```

2. Instala las dependencias:
   npm install

   ````

   ```bash
   cp .env.example .env
   ````

- La especificación inicial es mínima y cubre los endpoints existentes. Podemos enriquecer esquemas y ejemplos progresivamente.
- La interfaz de Swagger se sirve desde un archivo de ruta (`routes/docs.get.ts`) y referencia la especificación en `/openapi`.
- Los recursos (`swagger-ui.css`, `swagger-ui-bundle.js`, etc.) se sirven localmente desde el paquete `swagger-ui` mediante rutas dedicadas bajo `/docs/*`.

4. (Opcional) Levanta PostgreSQL con Docker:

   ```bash
   docker run --name entipedia-postgres \
     -e POSTGRES_PASSWORD=$(openssl rand -hex 16) \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_DB=entipedia \
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
| `npm run dev:integrated` | Modo integrado: Vite + Nitro integrados (un solo servidor).                       |
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

### Modo integrado (Vite + Nitro integrados)

```bash
npm run dev:integrated
```

- Un solo servidor de desarrollo: Vite sirve el frontend y Nitro embebido expone `/api/*` en el mismo origen (p. ej., http://localhost:5000).
- No necesitas ejecutar `npm run dev:server` en este modo.
- El fallback SPA del lado del servidor está desactivado en desarrollo para evitar conflictos con Vite.

---

## Documentación de la API

- UI interactiva de Swagger: http://localhost:5000/docs (o la ruta equivalente en producción)
- Especificación OpenAPI: http://localhost:5000/openapi

Notas:

- La especificación inicial es mínima y cubre los endpoints existentes. Podemos enriquecer esquemas y ejemplos progresivamente.
- La UI de Swagger se sirve desde un archivo de ruta (`routes/docs.get.ts`) y referencia la especificación en `/openapi`.
- Los assets (`swagger-ui.css`, `swagger-ui-bundle.js`, etc.) se sirven localmente desde el paquete `swagger-ui` mediante rutas dedicadas bajo `/docs/*`.

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

## Esquema de base de datos

Tablas principales y relaciones (ver `db/schema.ts`):

- `users`: id, email, password, name, createdAt, updatedAt.
- `projects`: id, name, description, status (todo/in_progress/done), priority (low/medium/high), userId (FK), createdAt, updatedAt.
- `tasks`: id, title, description, status (todo/in_progress/done), priority, dueDate, userId (FK), projectId (FK), createdAt, updatedAt.
- `files`: id, filename, storedFilename, mimeType, size, path, description, userId (FK), projectId (FK), createdAt.
- `clients`: id, name, type (person/company), value, startDate, endDate, userId (FK), createdAt, updatedAt.

Relaciones clave:

- Un usuario es propietario de proyectos, tareas, archivos y clientes.
- Un proyecto contiene tareas y archivos mediante `projectId`.

Enums utilizados:

- `taskStatusEnum`, `projectStatusEnum`, `projectPriorityEnum`, `clientTypeEnum`.

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
│       ├── auth/         # Auth (login, register, logout, session)
│       ├── clients/      # CRUD de clientes
│       ├── files/        # CRUD de archivos
│       ├── projects/     # CRUD de proyectos
│       ├── tasks/        # CRUD de tareas y cambio de estado
│       └── users/        # Endpoints de usuarios
├── scripts/              # Scripts auxiliares (deploy, etc.)
├── src/                  # Frontend React
│   ├── components/       # Componentes reutilizables (incluye UI y Kanban)
│   ├── pages/            # Rutas cliente (vite-plugin-pages)
│   │   ├── auth/         # Registro/Login
│   │   ├── dashboard/    # Resumen y accesos rápidos
│   │   ├── clients/      # Gestión de clientes
│   │   ├── files/        # Exploración y subida de archivos
│   │   ├── tasks/        # Tareas (tabla/kanban)
│   │   ├── projects/     # Proyectos (tabla/kanban y detalle)
│   │   └── users/        # Listado/detalle de usuarios
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

### Gestión de clientes

- Endpoints REST bajo `/api/clients` (listar, crear, actualizar y eliminar).
- Tipos de cliente: persona y empresa (`clientTypeEnum`).
- Seguimiento de valor de contrato (`value`) y rango de fechas (`startDate`, `endDate`).
- Edición en línea en el cliente (navegación por teclado y actualización rápida en `src/pages/clients`).

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
- Asociación a proyectos mediante `projectId` para mantener el contexto.
- Clasificación automática en seis categorías: imagen, documento, video, audio, archivo y otros.

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

### SPA y enlaces profundos en producción

- En producción, Nitro sirve los assets compilados desde `dist/` con los tipos MIME correctos.
- Existe una ruta catch‑all `routes/[...spa].get.ts` que entrega `index.html` exclusivamente para navegaciones de documento (GET/HEAD con Accept: text/html), sin interceptar `/api/*` ni archivos estáticos.
- Esto permite recargar o abrir enlaces profundos (p. ej., `/about`, `/tasks/123`) sin errores 404.

---

## Resolución de problemas

- **`npm run dev` no conecta con la base de datos**: verifica `DATABASE_URL` y que PostgreSQL esté escuchando en el puerto configurado.
- **Error `SESSION_SECRET` no definido**: asegúrate de definir esta variable antes de arrancar el servidor Nitro.
- **Fallos en migraciones**: limpia migraciones incompletas con `npm run db:push` o restablece la base de datos según sea necesario.
- **Problemas con drag-and-drop**: revisa que no existan errores en consola y verifica la configuración de `@dnd-kit`.

- **“Failed to load module script… MIME type ‘text/html’”**:
  - En desarrollo integrado, asegúrate de no tener un fallback del servidor activo. Este repo desactiva el fallback SPA en dev y solo lo habilita en producción.
  - Verifica que los assets se sirvan desde Vite (http://localhost:5000) y que las rutas solicitadas terminen en `/assets/*.js` con `Content-Type: application/javascript`.
  - En producción, confirma que `nitro.config.ts` tiene `publicAssets` habilitado y que el HTML compilado referencia rutas absolutas correctas (`/assets/...`).
  - Limpia la caché del navegador o prueba una ventana privada si persisten rutas antiguas.

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
