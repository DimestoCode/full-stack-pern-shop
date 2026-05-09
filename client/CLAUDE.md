# Client — Online Store

## Project Overview

Client application for a device/electronics online store. Communicates with an Express + PostgreSQL backend API in the sibling **`../server`** directory (this file documents the client; keep API paths in sync with `server/routes`).

## Tech Stack (mandatory — do not substitute)

| Layer            | Technology                                    |
| ---------------- | --------------------------------------------- |
| Framework        | React 19 SPA (Vite 7)                         |
| Language         | TypeScript — strict mode, no `any`            |
| Routing          | TanStack Router — file-based (`src/routes/`)  |
| Server state     | TanStack Query — all API calls go through it  |
| Styling          | Tailwind CSS 4 (v4 `@import` syntax)          |
| UI components    | shadcn/ui (new-york style, lucide icons)      |
| Linting/Format   | Biome — tabs for indentation, double quotes   |
| Env validation   | T3 Env (`@t3-oss/env-core`) + Zod             |
| Testing          | Vitest + Testing Library                      |
| Package manager  | pnpm (no npm/yarn)                            |
| React Compiler   | Enabled via babel-plugin-react-compiler       |

## Code Style

- **Indentation:** tabs (not spaces)
- **Quotes:** double quotes for strings
- **Imports:** use `#/` alias (maps to `./src/`). Example: `import { cn } from "#/lib/utils"`
- **Formatting:** run `pnpm check` to verify. Biome handles formatting and linting
- **Export style:** named exports preferred. Default exports only for route components and integration modules
- **Component style:** function declarations (`function MyComponent()`) for route components; arrow functions are acceptable for small internal components

## Directory Structure

```
src/
├── components/        # Shared app components (Header, Footer, etc.)
│   └── ui/            # shadcn/ui-style primitives — add new ones via CLI; match existing patterns if hand-adding
├── hooks/             # Custom React hooks
├── lib/               # Utility functions (cn, api helpers, constants)
├── integrations/      # Third-party integration wrappers (TanStack Query provider)
├── routes/            # TanStack Router file-based routes
│   └── __root.tsx     # Root layout (providers, header/footer)
├── env.ts             # T3 Env config — all env vars declared here
├── router.tsx         # Router factory
└── styles.css         # Global styles + Tailwind imports + design tokens
```

## Routing Conventions

Routes live in `src/routes/` and use TanStack Router file-based routing.

- Each route file exports `Route` created via `createFileRoute`:
  ```typescript
  import { createFileRoute } from "@tanstack/react-router"

  export const Route = createFileRoute("/shop")({ component: ShopPage })

  function ShopPage() { /* ... */ }
  ```
- Layouts: use `_layout` files or nested directories
- The route tree is auto-generated into `src/routeTree.gen.ts` — never edit this file
- Root layout is in `src/routes/__root.tsx`

## Data Fetching

All API communication MUST go through TanStack Query. Never use raw `fetch` in components.

- Define query/mutation functions in dedicated files (e.g., `src/lib/api/devices.ts`)
- Use `queryOptions` factory pattern for queries:
  ```typescript
  import { queryOptions } from "@tanstack/react-query"

  export const devicesQueryOptions = queryOptions({
  	queryKey: ["devices"],
  	queryFn: () => fetchDevices(),
  })
  ```
- Use `useSuspenseQuery` when the query key is stable for the route (e.g. device detail, brands/types on shop) and you want the route to block until data exists
- For **search-param or filter-driven** lists whose query key changes often (e.g. shop device grid), prefer **`useQuery`** with **`placeholderData: keepPreviousData`** so the UI does not suspend and flash the whole Suspense fallback on every filter change
- Use route `loader` for prefetching:
  ```typescript
  export const Route = createFileRoute("/shop")({
  	loader: ({ context }) => {
  		context.queryClient.ensureQueryData(devicesQueryOptions)
  	},
  	component: ShopPage,
  })
  ```
- Mutations via `useMutation` with appropriate `onSuccess` invalidation

## Backend API Reference

Base URL: `http://localhost:7000/api` (configure via env var)

Auth uses JWT Bearer tokens: `Authorization: Bearer <token>`

### Endpoints

| Method | Path                     | Auth | Body / Params                          | Response              |
| ------ | ------------------------ | ---- | -------------------------------------- | --------------------- |
| POST   | /api/user/registration   | No   | `{ email, password, role? }`           | `{ token }`           |
| POST   | /api/user/login          | No   | `{ email, password }`                  | `{ token }`           |
| GET    | /api/user/auth           | Yes  | —                                      | `{ token }`           |
| GET    | /api/device              | No   | query: `brandId`, `typeId`, `limit`, `page` | `{ count, rows }` |
| GET    | /api/device/:id          | No   | —                                      | Device + info         |
| POST   | /api/device              | No   | FormData: `name, price, brandId, typeId, img, info[]` | Device |
| GET    | /api/brand               | No   | —                                      | Brand[]               |
| POST   | /api/brand               | No   | `{ name }`                             | Brand                 |
| GET    | /api/type                | No   | —                                      | Type[]                |
| POST   | /api/type                | No   | `{ name }`                             | Type                  |
| GET    | /api/cart/:userId        | Yes  | —                                      | CartDevice[]          |
| PATCH  | /api/cart/:userId/add    | Yes  | `{ deviceId }`                         | Cart                  |
| PATCH  | /api/cart/:userId/remove | Yes  | `{ deviceId }`                         | Cart                  |
| DELETE | /api/cart/:userId        | Yes  | —                                      | —                     |
| GET    | /api/review/:deviceId    | No   | —                                      | `{ averageRating, deviceReviews }` — reviews include nested `user` (`email`) when present |
| POST   | /api/review/:deviceId    | Yes  | `{ rate, review }` — `deviceId` is in the URL; **`userId` comes from the JWT** (do not rely on body) | Review row |

### Data Models

- **User:** id, email, password, role (`"USER"` | `"ADMIN"`)
- **Device:** id, name, price, **rating** (catalog / denormalized display on cards), img, typeId, brandId
- **DeviceInfo:** id, title, description, deviceId
- **Type:** id, name
- **Brand:** id, name
- **Cart:** id, userId → has many CartDevice
- **CartDevice:** id, cartId, deviceId
- **Review:** id, **rate** (1–5), **review** (text), userId, deviceId — customer reviews; averages are computed from reviews for the device detail page

### UI Conventions (device detail)

- Product detail route: **`src/routes/shop/$deviceId.tsx`** — hero (image, price, **read-only** average stars), then **Tabs**: **Specifications** (spec table) and **Reviews** (list + form). Client API: **`src/lib/api/review.ts`** (`deviceReviewsQueryOptions`, `createReviewFn`).

## Adding shadcn/ui Components

Always use the CLI — never copy-paste component source:

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`. Use `cn()` from `#/lib/utils` for conditional classes.

## Environment Variables

Declare all env vars in `src/env.ts` using T3 Env + Zod. Client-side vars MUST be prefixed with `VITE_`.

## What NOT to Do

- Do not use `any` — define proper types for all API responses and component props
- Do not fetch data outside of TanStack Query
- Do not install alternative state management (no Redux, Zustand, Jotai, etc.)
- Do not use CSS modules, styled-components, or Emotion — use Tailwind + shadcn only
- Do not use ESLint or Prettier — Biome handles both
- Do not manually edit `routeTree.gen.ts`. For **new** shadcn primitives, prefer the CLI; avoid drive-by edits to unrelated `components/ui/*` files
- Do not use `npm` or `yarn` — use `pnpm` exclusively
