# React + TypeScript + Nitro Full-Stack Starter

A production-ready full-stack starter template combining React 19 with TypeScript on the frontend and Nitro for the backend API. Built with Vite for blazing-fast development and optimized builds.

⭐ **Don't forget to star this repo if you find it useful!**

---

## Features

### Frontend

- ⚡ **React 19** with TypeScript and Vite
- 🎨 **Tailwind CSS 4** + **shadcn/ui** components
- 🗂️ **File-based routing** with `vite-plugin-pages`
- 🔄 **Auto-imports** for React hooks and components
- 🖼️ **SVG as React components** with `vite-plugin-svgr`
- 🔤 **Google Fonts** integration
- 📦 **Path aliases** (`@/components`, etc.)
- 🔑 **Auth Context** for global authentication state
- 📝 **Form validation** powered by React Hook Form + Zod
- ⚡ **TanStack Query** for data fetching, caching, and synchronization
- 📝 **Task management UI** with filters, table view, and modals
- � **Kanban board** with drag-and-drop task management
- ⌨️ **Keyboard accessible** drag-and-drop using dnd-kit
- ⚡ **Optimistic updates** for instant UI feedback
- �🎛️ **shadcn/ui Table, Dialog, Select, Textarea, Badge** components ready to compose

### Backend

- 🚀 **Nitro 3** server with H3 handler
- 🛣️ **File-based API routing** in `/routes`
- ⚡ **Fast development** with hot module replacement
- 🔧 **TypeScript** support out of the box
- 🗄️ **PostgreSQL** with **Drizzle ORM** for type-safe data access
- 📊 **Database migrations** powered by Drizzle Kit
- 🔐 **Authentication system** via encrypted H3 sessions
- 🔒 **Password hashing** with bcrypt
- 🍪 **HTTP-only cookies** for secure session storage
- 📋 **Task management API** with CRUD operations
- 🔒 **User-scoped tasks** enforced at the database layer
- 📊 **Task status tracking** (To Do, In Progress, Done)
- 📁 **File management API** with upload, download, and delete operations
- 💾 **Local file storage** backed by the Node.js filesystem
- 🔒 **File validation** via MIME-type whitelist and size limits
- 📊 **File metadata persistence** inside PostgreSQL with Drizzle

### Developer Experience

- ✅ **ESLint** + **Prettier** configured
- 🪝 **Husky** pre-commit hooks
- 🐳 **Docker** setup included
- 🤖 **Dependabot** for dependency updates
- 📝 **Workspace settings** for team collaboration

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

The dev server runs on:

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api/\*

## Database Setup

1. Ensure PostgreSQL is available locally or via a managed provider.
2. Copy `.env.example` to `.env` and update `DATABASE_URL` with your credentials.
3. Run `npm run db:push` to initialize the schema during development.
4. Optionally launch Drizzle Studio with `npm run db:studio` for a GUI explorer.

Available scripts:

- `npm run db:generate` — Create SQL migrations from schema changes.
- `npm run db:migrate` — Apply pending migrations to the database.
- `npm run db:push` — Push schema changes directly (development only).
- `npm run db:studio` — Start Drizzle Studio for interactive inspection.

See `db/README.md` for more detailed workflow guidance.

### Authentication

The auth stack combines encrypted server sessions with client-side state management:

1. **Session Management**: H3's `useSession` stores user IDs in encrypted, HTTP-only cookies with configurable TTL.
2. **Password Security**: Credentials are hashed with bcrypt (cost factor 12) before touching the database.
3. **API Routes**:

- `POST /api/auth/register` – Create a new user and issue a session cookie.
- `POST /api/auth/login` – Verify credentials and refresh the session.
- `POST /api/auth/logout` – Clear the active session cookie.
- `GET /api/auth/session` – Return the current authenticated user when the session is valid.

4. **Frontend State**: `AuthProvider` exposes `useAuth()` and `useAuthActions()` hooks for global access to auth status and actions.
5. **Protected Requests**: Middleware hydrates `event.context.user` so API handlers can gate access with a simple null check.

Auth-focused pages:

- `/auth/login` – Sign-in form with validation feedback.
- `/auth/register` – Registration form with password confirmation.

Security highlights:

- HTTP-only cookies mitigate XSS, while `sameSite="lax"` and `secure` (in production) protect session scope.
- Session payloads are encrypted with `SESSION_SECRET` on the server.
- Passwords are never stored in plaintext and comparisons run through bcrypt.
- API responses use generic error messaging to avoid leaking which credential was invalid.

### Task Management

Handle personal workstreams end-to-end with the built-in task manager:

1. **API Routes**

- `GET /api/tasks` – Fetch all tasks for the authenticated user
- `POST /api/tasks` – Create a new task
- `PATCH /api/tasks/:id` – Update an existing task
- `DELETE /api/tasks/:id` – Remove a task

2. **Task Properties**

- Title (required) and description (optional)
- Status: To Do, In Progress, Done
- Priority: Low, Medium, High (optional)
- Due date (optional) and future project association

3. **React Query Integration**

- `useTasks()` – Fetch and filter tasks with caching
- `useCreateTask()` – Create mutation with automatic cache invalidation
- `useUpdateTask()` – Partial updates with consistent cache refresh
- `useDeleteTask()` – Remove tasks and refresh stale data

4. **UI Features**

- Task table with status and priority badges
- Filters for status and priority
- Create/edit dialogs powered by React Hook Form + Zod
- Due date formatting via shared utilities
- Delete confirmation for protection against accidental removal

5. **Security**

- Middleware hydrates `event.context.user` before handlers run
- All queries scope tasks by the authenticated user ID
- Ownership is revalidated before updates and deletes

Relevant code: `routes/api/tasks`, `src/hooks/useTasks.ts`, `src/utils/task.ts`, `src/constants/index.ts`, and the `/tasks` page.

### Kanban Board

Deliver a visual workflow for tasks with a fully interactive Kanban experience.

1. **Drag-and-Drop Interface**

- Three-column layout: To Do, In Progress, Done
- Drag tasks between columns to instantly update status
- Smooth motion and hover feedback for card moves
- Drag overlay previews the card currently in motion

2. **Accessibility**

- Full keyboard support (Tab to focus, Space/Enter to pick/drop, Arrow keys to move)
- Screen reader-friendly roles, labels, and announcements
- 8px pointer activation threshold to avoid accidental drags
- High-contrast styling consistent with the dark theme

3. **Performance Optimizations**

- Dedicated status endpoint (`PATCH /api/tasks/:id/status`) keeps payloads minimal
- Optimistic cache updates for immediate visual feedback
- Automatic rollback when the mutation fails
- React Query manages cache invalidation to stay in sync with the server

4. **React Query Integration**

- `useUpdateTaskStatus()` handles status mutations with optimistic updates
- Shared query keys ensure list and project summaries stay fresh
- Pending states surface to the board for subtle visual feedback
- Session refresh triggers on 401 responses for resilient UX

5. **Component Architecture**

- Reusable `KanbanBoard` component at `src/components/KanbanBoard.tsx`
- Internal column and card components keep responsibilities focused
- Props-driven design to hook into any page
- Dark theme matches existing task and project views

6. **dnd-kit Integration**

- `DndContext` powers drag events with `closestCorners` collision detection
- `PointerSensor` and `KeyboardSensor` deliver inclusive interactions
- `SortableContext` + `useSortable` handle per-column ordering
- `@dnd-kit/utilities` smooths animations with CSS transforms

Kanban routes live at `/kanban`, providing a drag-and-drop alternative to the table view.

Relevant code: `routes/api/tasks/[id]/status.patch.ts`, `src/hooks/use-tasks.ts`, `src/components/KanbanBoard.tsx`, and `src/pages/kanban/index.tsx`.

### Keyboard Navigation

- **Tab**: Move focus between task cards across columns
- **Arrow keys**: Navigate within a column while a card is focused
- **Space / Enter**: Pick up or drop the focused task
- **Escape**: Cancel the current drag interaction
- **Mouse / Touch**: Click or tap and drag tasks between columns

### File Management

Bring secure, metadata-aware file handling to the platform with the dedicated file API and local storage pipeline.

1. **API Routes**

- `GET /api/files` – Retrieve all files owned by the authenticated user
- `POST /api/files` – Upload a file via multipart/form-data with validation
- `GET /api/files/:id` – Stream the stored file back with download headers
- `DELETE /api/files/:id` – Remove a file from both disk storage and the database

2. **File Properties**

- Original filename (displayed in the UI)
- Stored filename (unique, collision-resistant)
- MIME type and size for validation and headers
- Relative storage path (`uploads/<name>`)
- Optional project association for contextual filtering
- Upload timestamp

3. **Storage Model**

- Files are persisted beneath the project `uploads/` directory
- Unique filenames generated with timestamp + random suffix
- Metadata lives in PostgreSQL via the existing `files` table
- Cleanup ensures disk and database stay in sync

4. **Validation Rules**

- Whitelisted MIME types guard against unsafe uploads
- 10 MB maximum size (configurable via `MAX_FILE_SIZE`)
- Server-side guards mirror client validation for defense in depth

5. **Security**

- Each request is scoped by `event.context.user`
- Ownership verified before download or deletion
- Filesystem writes occur in a controlled directory outside the repo
- Cleanup handles partial failures to avoid orphaned files

Relevant code: `routes/api/files`, `src/constants/index.ts`, `src/utils/file.ts`.

### File Upload Limits

- **Maximum size**: 10 MB per file (configured via `MAX_FILE_SIZE` in `src/constants/index.ts`)
- **Allowed types**: Images, documents, archives, JSON, and web text assets (see `ALLOWED_FILE_TYPES`)
- **Storage location**: Files persist under the git-ignored `uploads/` directory
- **Production tip**: For multi-instance or cloud deployments, back the upload path with persistent storage (e.g., S3, R2, or mounted volumes)

### Environment Variables

- `DATABASE_URL` – PostgreSQL connection string used by Drizzle and postgres.js.
- `SESSION_SECRET` – Minimum 32-character secret for encrypting H3 sessions (set locally in `.env` and remotely via hosting provider env config).

> **Tip:** Configure `SESSION_SECRET` in `.env` before running `npm run dev` so authentication works immediately. The middleware skips gracefully when it is missing, but protected routes require the secret.

---

## Client-Side Routing (Frontend)

### File-Based Routing with vite-plugin-pages

Routes are automatically generated from files in `src/pages/`. Each `.tsx` file becomes a route.

**Documentation**: [vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages)

### Route Structure

```
src/pages/
├── index.tsx           → /
├── about.tsx           → /about
├── users/
│   ├── index.tsx       → /users
│   ├── [id].tsx        → /users/:id (dynamic route)
│   └── profile.tsx     → /users/profile
└── [...all].tsx        → /* (catch-all/404)
```

### Creating Pages

All page components must use **default exports**:

```tsx
// src/pages/about.tsx
const About = () => {
  return (
    <div>
      <h1>About Page</h1>
    </div>
  );
};

export default About;
```

### Dynamic Routes

Use square brackets for dynamic segments:

```tsx
// src/pages/users/[id].tsx
const UserDetail = () => {
  const { id } = useParams(); // auto-imported from react-router

  return (
    <div>
      <h1>User ID: {id}</h1>
    </div>
  );
};

export default UserDetail;
```

### Catch-All Routes

Use `[...all].tsx` for 404 pages or catch-all routes:

```tsx
// src/pages/[...all].tsx or not-found.tsx
const NotFound = () => {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
    </div>
  );
};

export default NotFound;
```

### Navigation

Use React Router hooks (auto-imported):

```tsx
const MyComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return <button onClick={() => navigate("/about")}>Go to About</button>;
};
```

---

## Server-Side Routing (Backend API)

### File-Based API Routing with Nitro

API routes are automatically generated from files in `routes/`. Powered by [Nitro](https://nitro.unjs.io/) and [H3](https://h3.unjs.io/).

**Documentation**:

- [Nitro Routing](https://nitro.unjs.io/guide/routing)
- [H3 Handlers](https://h3.unjs.io/guide)

### Route Structure

```
routes/
├── api/
│   ├── hello.ts        → GET/POST /api/hello
│   ├── users/
│   │   ├── index.ts    → GET/POST /api/users
│   │   └── [id].ts     → GET/POST /api/users/:id
│   └── auth/
│       ├── login.ts    → POST /api/auth/login
│       └── logout.ts   → POST /api/auth/logout
└── health.ts           → GET /health
```

### Creating API Handlers

Use `defineEventHandler` from H3:

```typescript
// routes/api/hello.ts
export default defineEventHandler((event) => {
  return {
    message: "Hello from API!",
    timestamp: new Date().toISOString(),
  };
});
```

### HTTP Methods

Handle different HTTP methods:

```typescript
// routes/api/users/index.ts
export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    return { users: [] };
  }

  if (method === "POST") {
    const body = await readBody(event);
    return { created: true, user: body };
  }

  return { error: "Method not allowed" };
});
```

Or use method-specific handlers:

```typescript
// routes/api/users/index.get.ts
export default defineEventHandler(() => {
  return { users: [] };
});

// routes/api/users/index.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return { created: true, user: body };
});
```

### Dynamic Routes

Use square brackets for dynamic parameters:

```typescript
// routes/api/users/[id].ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");

  return {
    user: {
      id,
      name: "John Doe",
    },
  };
});
```

### Request Handling

Common H3 utilities:

```typescript
import {
  readBody, // Parse request body
  getQuery, // Get query parameters
  getRouterParam, // Get route parameters
  getCookie, // Get cookies
  setCookie, // Set cookies
  getHeader, // Get headers
  setResponseStatus, // Set response status
  sendRedirect, // Send redirect
} from "h3";

export default defineEventHandler(async (event) => {
  // Get query params: /api/search?q=test
  const query = getQuery(event);
  console.log(query.q); // 'test'

  // Get route params: /api/users/123
  const id = getRouterParam(event, "id");

  // Parse JSON body
  const body = await readBody(event);

  // Get headers
  const auth = getHeader(event, "authorization");

  // Set response status
  setResponseStatus(event, 201);

  return { success: true };
});
```

### Error Handling

```typescript
export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required",
    });
  }

  // Your logic here
  return { id };
});
```

### Middleware

Create middleware in `routes/` with `.ts` extension:

```typescript
// routes/middleware/auth.ts
export default defineEventHandler((event) => {
  const token = getHeader(event, "authorization");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Add user to context
  event.context.user = { name: "John" };
});
```

---

## Vite Plugins Guide

### vite-plugin-svgr

Import SVGs as React components by adding `?react` query:

```tsx
import Logo from "@/assets/react.svg?react";

export const App = () => {
  return (
    <div>
      <Logo />
    </div>
  );
};
```

### unplugin-fonts

Configure Google Fonts in `configs/fonts.config.ts`:

```typescript
export const fonts = [
  {
    name: "Inter",
    styles: "wght@300;400;500;600;700",
  },
  {
    name: "Space Grotesk",
    styles: "wght@300;400;500;700",
  },
];
```

[Documentation](https://github.com/cssninjaStudio/unplugin-fonts)

### unplugin-auto-import

Automatically imports React hooks and React Router hooks. No need to import `useState`, `useEffect`, `useNavigate`, etc.

```tsx
// No imports needed!
export function Counter() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  return (
    <div>
      <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
    </div>
  );
}
```

To enable auto-import for shadcn/ui components, uncomment in `vite.config.ts`:

```typescript
AutoImport({
  imports: ["react", "react-router"],
  dirs: ["./src/components/ui"], // Uncomment this line
});
```

---

## Project Structure

```
.
├── src/
│   ├── assets/          # Static assets (images, SVGs)
│   ├── components/      # React components
│   │   ├── KanbanBoard.tsx     # Kanban board component
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── QueryProvider.tsx  # React Query provider
│   ├── pages/          # Frontend routes (file-based)
│   │   ├── kanban/
│   │   │   └── index.tsx      # Kanban board page
│   │   └── tasks/
│   │       └── index.tsx      # Task management page
│   ├── hooks/          # Custom React hooks
│   │   ├── index.ts
│   │   ├── use-auth.ts
│   │   ├── use-tasks.ts       # Task CRUD hooks + status mutation helper
│   │   └── use-files.ts       # File CRUD hooks
│   ├── utils/          # Utility functions
│   │   ├── auth-user.ts
│   │   ├── cn.ts
│   │   ├── task.ts            # Task data helpers
│   │   └── file.ts            # File data helpers
│   ├── types/          # TypeScript types
│   ├── constants/      # App constants
│   ├── data/           # Static data
│   ├── store/          # State management
│   └── main.tsx        # App entry point
├── routes/             # Backend API routes (file-based)
│   └── api/           # API endpoints
│       ├── files/          # File CRUD API routes
│       │   ├── index.get.ts
│       │   ├── index.post.ts
│       │   ├── [id].get.ts
│       │   └── [id].delete.ts
│       └── tasks/          # Task CRUD API routes
│           ├── index.get.ts
│           ├── index.post.ts
│           ├── [id].delete.ts
│           ├── [id].patch.ts
│           └── [id]/
│               └── status.patch.ts  # Status-only update endpoint
├── configs/            # Configuration files
│   └── fonts.config.ts
├── db/                 # Database schema and connection
│   ├── schema.ts      # Drizzle ORM schema definitions
│   ├── index.ts       # Database connection utility
│   └── README.md      # Database documentation
├── uploads/            # Local file storage (git-ignored)
│   └── .gitkeep
├── drizzle/           # Generated migration files (git-ignored)
├── drizzle.config.ts  # Drizzle Kit configuration
├── .env.example       # Environment variables template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
└── package.json
```

---

## Path Aliases

Use `@/` to import from `src/`:

```tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import type { User } from "@/types";
```

---

## Deployment

### Docker

```bash
# Build and run with Docker
docker build -t react-ts-starter .
docker run -p 5000:5000 react-ts-starter
```

### VPS Deployment with nginx

For production deployment on a VPS with nginx, PM2, and SSL configuration, see the complete guide:

📖 **[VPS Deployment Guide](./DEPLOYMENT.md)**

The guide includes:

- nginx configuration for serving static files and proxying API requests
- PM2 or systemd setup for running the Nitro server
- SSL certificate setup with Let's Encrypt
- Monitoring and troubleshooting tips
- Update and maintenance procedures

---

## Notes

- This is a **client-side rendered (CSR)** application
- For SEO or Server-Side Rendering, consider Next.js, Remix, or Astro
- The Nitro backend is perfect for APIs, serverless functions, and edge deployments

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## License

MIT
