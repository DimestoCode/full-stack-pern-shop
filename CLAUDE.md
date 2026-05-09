# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo with two separate `pnpm` packages — no root `package.json`. Run all commands from within the respective directory.

```
online-store/
├── client/   # React 19 SPA — see client/CLAUDE.md for full client conventions
└── server/   # Express 5 + Sequelize 6 + PostgreSQL API
```

## Commands

### Client (`cd client`)

| Task | Command |
|------|---------|
| Dev server (port 3000) | `pnpm dev` |
| Production build | `pnpm build` |
| Lint + format check | `pnpm check` |
| Run tests | `pnpm test` |
| Run a single test file | `pnpm test src/path/to/file.test.ts` |
| Add a shadcn/ui component | `pnpm dlx shadcn@latest add <name>` |

### Server (`cd server`)

| Task | Command |
|------|---------|
| Dev server with auto-reload | `pnpm dev` |
| Seed database | `pnpm seed` |
| Import images from directory | `pnpm import-images` |

**Package manager:** `pnpm` exclusively — never `npm` or `yarn`.

## Architecture Overview

### Request Flow

```
Browser → React (TanStack Router) → TanStack Query → apiFetch()
       → Express /api → Router → Controller → Sequelize → PostgreSQL
```

- All client API calls are routed through `apiFetch()` in `client/src/lib/api/client.ts`, which injects the JWT `Authorization` header automatically.
- The server mounts all routes under `/api` (defined in `server/routes/index.js`) and serves uploaded images as static files at `/static`.

### Authentication

- JWT tokens are stored in `localStorage` (key defined in `client/src/lib/api/client.ts`).
- `AuthProvider` (`client/src/components/AuthProvider.tsx`) decodes the token on mount and verifies it with `GET /api/user/auth`.
- Server middleware (`server/middleware/checkRoleMiddleware.js`) decodes the JWT and attaches `req.user`. Controllers read `userId` from `req.user.id` — never from the request body.

### Server Conventions

**Adding a new resource:**
1. Define the Sequelize model and associations in `server/models/models.js`.
2. Create a controller in `server/controllers/` using `ErrorHandler` for all error paths.
3. Create a router in `server/routes/` and mount it in `server/routes/index.js`.
4. Update `server/scripts/seed.js` TRUNCATE list if the model has seed data.

**Error handling:** Always use `ErrorHandler` static methods (`badRequest`, `internal`, `forbidden`) and pass errors to `next(err)` — do not call `res.status(...).json(...)` directly on error paths.

**Database sync:** The server calls `sequelize.sync({ alter: true })` on startup, which alters existing tables to match model definitions. There are no migration files.

**File uploads:** Images are saved to `server/static/` via `express-fileupload`. Store only the filename in the `img` column (the full URL is composed on the client using `VITE_STATIC_URL`).

### Client Conventions

See `client/CLAUDE.md` for the full reference including:
- Tech stack (React 19, Vite 7, TanStack Router/Query, Tailwind CSS 4, shadcn/ui, Biome)
- Routing, data fetching, and state management patterns
- Complete API endpoint reference and data models
- What NOT to do

### Environment Variables

**Client** (`client/.env` or `client/.env.local`):
```
VITE_API_URL=http://localhost:7000/api
VITE_STATIC_URL=http://localhost:7000/static
VITE_APP_TITLE=Online Store
```
All client env vars must be declared in `client/src/env.ts` using T3 Env + Zod.

**Server** (`server/.env`):
```
PORT=7000
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=...
```
