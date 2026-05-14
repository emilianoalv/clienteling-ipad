# @clienteling/web

Next.js 15 (App Router) implementation of the L'Oréal Luxe clienteling iPad app.

> Why this folder exists and what lives where is documented in the monorepo's
> [`docs/`](../../docs) — start with [`docs/README.md`](../../docs/README.md).
> Architectural decisions in this app follow that documentation 1:1.

## Stack

- **Next.js 15** · App Router, Server Components, Server Actions
- **TypeScript** strict, branded IDs, schema-validated env vars
- **next-intl** for `es-MX` / `en-US`
- **TanStack Query** for client-side data caching
- **Zustand** for purely-UI client state (brand lock, basket, toasts)
- **react-hook-form + zod** for forms and shared validation
- **Tailwind CSS v4** — CSS-first config in `src/app/globals.css` (no `tailwind.config`); tokens declared in `@theme {}`. See `docs/08-styling-and-tokens.md`.

## Setup

```pwsh
# From the monorepo root (one level up):
pnpm install

# Copy env template
Copy-Item apps/web/.env.example apps/web/.env.local

# Start dev server (port 3000)
pnpm dev
```

Visit <http://localhost:3000> — you will be redirected to `/login`. Any 6-digit
PIN logs you in during F0–F3 of the migration plan.

## Scripts

| Command | Action |
|---|---|
| `pnpm dev` | Start Next.js dev server with Fast Refresh |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint over `src/` (boundaries plugin enforces layer rules) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright end-to-end tests |

## Folder map

```text
src/
├─ app/                          # Routes & layouts (App Router)
│  ├─ (auth)/login/              # Public sign-in page
│  ├─ (app)/                     # Authenticated tree (Shell wraps all)
│  │  ├─ ba/  manager/  supervisor/  hq/  admin/
│  ├─ layout.tsx                 # Providers (i18n, React Query)
│  ├─ globals.css                # @import "tailwindcss" + @theme {} (design tokens)
│  └─ page.tsx                   # Server-side redirect to /<role>
├─ middleware.ts                 # Auth + locale + role gate
├─ i18n.ts                       # next-intl request config
├─ messages/                     # es-MX.json, en-US.json
├─ components/                   # Design system (presentational only)
│  ├─ primitives/                # Button, Icon, Avatar, Chip, ...
│  ├─ layout/                    # Shell + Rail + TopBar
│  ├─ patterns/                  # KpiCard, KvRow, ... (to be built)
│  ├─ charts/                    # Sparkline, BarChart, ... (to be built)
│  └─ feedback/                  # Toast, Modal, ... (to be built)
├─ features/                     # Domain modules (vertical slices)
│  ├─ auth/                      # Implemented: login + sign-in/out actions
│  ├─ clients/  appointments/  catalog/  consultation/
│  ├─ samples/  purchases/  communications/  followup/
│  ├─ dashboards/  devices/  tickets/  reports/  admin/
├─ server/                       # Server-only (auth, repositories, services, db)
├─ providers/                    # Client providers (React Query, ...)
├─ stores/                       # Zustand slices (brand-lock, basket, ...)
├─ hooks/                        # Cross-cutting hooks (use-media-query, ...)
├─ lib/                          # Pure utilities (cn, format, id, assert)
├─ types/                        # Domain types (Client, Staff, Appointment, ...)
└─ config/                       # env, rbac, nav, routes, i18n
```

## Layer rules

`eslint-plugin-boundaries` blocks imports that violate the architecture:

```text
types ← config ← lib ← hooks/stores ← components ← features ← app
```

A `features/clients/...` file may import from `components/` and `lib/`. A
`components/...` file may not import from any `features/`. See
[`docs/01-architecture.md`](../../docs/01-architecture.md) and
[`.eslintrc.cjs`](.eslintrc.cjs).

## What's wired up out of the box

- Tailwind v4 with tokens declared in `@theme {}` (no external CSS dependency).
- `next-intl` with two locales, ICU plurals, typed messages.
- Authenticated route group `(app)` with the Shell + Rail + TopBar.
- Public route group `(auth)` with login form + sign-in/out server actions.
- httpOnly session cookie + 12 h TTL + role-prefix routing.
- ESLint boundaries + TypeScript strict + Vitest + Playwright config.

## What's intentionally left as TODO

Everything inside `src/features/<dominio>/` other than `auth/` exports an empty
barrel `index.ts` with a TSDoc pointing at the spec section in
[`docs/05-feature-modules.md`](../../docs/05-feature-modules.md). Follow the
phases in [`docs/10-migration-plan.md`](../../docs/10-migration-plan.md) to fill
them in.

## Why a monorepo

The `apps/` convention leaves room for additional surfaces (a mobile app, a
back-office, a marketing site) without restructuring. The root
[`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) declares `apps/*` and
`packages/*`; share code via packages later, not by reaching across `apps/`.
