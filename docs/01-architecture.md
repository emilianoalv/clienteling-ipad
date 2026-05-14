# 01 · Arquitectura

> **Alcance:** estructura de carpetas, capas y reglas de dependencia.
> Para nombres concretos de archivos, ver `02-naming-conventions.md`. Para módulos de dominio, ver `05-feature-modules.md`.

## Stack objetivo

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | RSC, layouts anidados, route groups, server actions |
| Lenguaje | **TypeScript** (strict) | Contratos de dominio explícitos para Client / Purchase / Sample / etc. |
| Estado servidor | **TanStack Query** + Server Actions | Cache, refetch, mutaciones optimistas |
| Estado UI | **Zustand** (slices) + Context React | Carrito, brand-lock, modal stack |
| Formularios | **react-hook-form** + **zod** | Validación tipada compartida cliente/servidor |
| Estilos | **Tailwind CSS v4** (CSS-first) | Tokens en `@theme {}` dentro de `globals.css` — sin archivo de config, sin CSS Modules. Ver `docs/08-styling-and-tokens.md` |
| i18n | **next-intl** | RSC-friendly, mensajes por locale |
| Tests | **Vitest** + **Testing Library** + **Playwright** (E2E iPad viewport) | Cobertura unit / integration / e2e |
| Lint | **eslint** + **prettier** + `eslint-plugin-boundaries` | Hace cumplir las reglas de dependencia entre capas |

## Estructura de carpetas

```text
clienteling-ipad/
├─ src/
│  ├─ app/                          # Next.js App Router (solo rutas y layouts)
│  │  ├─ (auth)/
│  │  │  └─ login/page.tsx
│  │  ├─ (app)/                     # Sub-tree autenticado
│  │  │  ├─ layout.tsx              # Shell (Rail + TopBar) compartido
│  │  │  ├─ ba/
│  │  │  ├─ manager/
│  │  │  ├─ supervisor/
│  │  │  ├─ hq/
│  │  │  └─ admin/
│  │  ├─ api/                       # Route Handlers (boundary HTTP)
│  │  ├─ layout.tsx                 # Providers globales
│  │  └─ globals.css                # Hereda de styles/tokens.css
│  │
│  ├─ features/                     # Módulos de DOMINIO (vertical slices)
│  │  ├─ clients/
│  │  ├─ appointments/
│  │  ├─ catalog/
│  │  ├─ consultation/
│  │  ├─ samples/
│  │  ├─ purchases/
│  │  ├─ communications/
│  │  ├─ followup/
│  │  ├─ dashboards/
│  │  ├─ devices/
│  │  ├─ tickets/
│  │  └─ admin/
│  │
│  ├─ components/                   # Design system (UI agnóstico de dominio)
│  │  ├─ primitives/                # Button, Input, Avatar, Icon, Chip...
│  │  ├─ patterns/                  # KpiCard, KvRow, SegmentedControl...
│  │  ├─ charts/                    # Sparkline, BarChart, LineChart, Donut, Scatter, Heatmap
│  │  ├─ layout/                    # Shell, Rail, TopBar, IpadFrame
│  │  └─ feedback/                  # Toast, Modal, ConfirmDialog, EmptyState
│  │
│  ├─ lib/                          # Utilidades agnósticas (sin React, sin dominio)
│  │  ├─ format/                    # formatCurrency, formatDate, formatRelative
│  │  ├─ date/                      # startOfWeek, addDays, isoWeek
│  │  ├─ id/                        # generateId
│  │  └─ assert/                    # invariant, exhaustive
│  │
│  ├─ hooks/                        # Hooks transversales (UI)
│  │  ├─ use-media-query.ts
│  │  ├─ use-debounced-value.ts
│  │  └─ use-on-click-outside.ts
│  │
│  ├─ stores/                       # Zustand slices globales (UI client-state)
│  │  ├─ brand-lock.store.ts
│  │  ├─ basket.store.ts
│  │  └─ toast.store.ts
│  │
│  ├─ providers/                    # Provider tree wrappers
│  │  ├─ query-provider.tsx
│  │  ├─ session-provider.tsx
│  │  └─ i18n-provider.tsx
│  │
│  ├─ server/                       # Solo código de servidor (importable en Server Components / Actions)
│  │  ├─ db/                        # Drizzle / Prisma client
│  │  ├─ services/                  # Casos de uso (createAppointment, registerSale, ...)
│  │  ├─ repositories/              # Acceso a datos por agregado
│  │  └─ auth/                      # Sesión, rotación, lockout
│  │
│  ├─ types/                        # Tipos TS de dominio (compartidos cliente+servidor)
│  │  ├─ client.ts
│  │  ├─ appointment.ts
│  │  ├─ product.ts
│  │  └─ index.ts
│  │
│  ├─ config/
│  │  ├─ env.ts                     # zod schema de process.env
│  │  ├─ rbac.ts                    # mapping rol → permisos
│  │  └─ routes.ts                  # constantes de rutas
│  │
│  ├─ messages/                     # next-intl: es-MX.json, en-US.json
│  └─ middleware.ts                 # Auth + locale + redirects por rol
│
├─ public/                          # Estáticos (logos, fuentes locales si aplica)
├─ docs/                            # ← esta carpeta
├─ tests/
│  ├─ e2e/                          # Playwright
│  └─ fixtures/                     # Mocks reproducibles
│
├─ .eslintrc.cjs
├─ next.config.mjs
├─ tsconfig.json
└─ package.json
```

## Capas y reglas de dependencia

Las capas se ordenan de **menos** a **más** específicas. Una capa puede importar de las inferiores; nunca al revés.

```text
                ┌──────────────────────────────┐
   más          │  app/  (rutas, layouts)      │
  específica    └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  features/<dominio>/         │
                │  (UI + lógica de un dominio) │
                └─────┬───────────────┬────────┘
                      ▼               ▼
        ┌─────────────────────┐ ┌───────────────────┐
        │ components/         │ │ server/services/  │
        │ (design system)     │ │ (casos de uso)    │
        └─────────┬───────────┘ └─────────┬─────────┘
                  ▼                       ▼
                ┌──────────────────────────────┐
                │  hooks/ · stores/ · lib/     │
                └──────────────┬───────────────┘
                               ▼
   menos        ┌──────────────────────────────┐
  específica    │  types/  ·  config/          │
                └──────────────────────────────┘
```

### Reglas concretas

1. `components/` **no** importa de `features/` ni de `server/`.
2. `features/<a>/` **no** importa de `features/<b>/`. Si hay solapamiento, el código se eleva a `components/`, `lib/` o `types/`.
3. `app/` solo orquesta: importa de `features/` y `components/`. No contiene lógica de negocio.
4. `server/` **nunca** se importa desde un Client Component (`"use client"`). El boundary es Server Action o Route Handler.
5. `lib/` no importa nada de React.
6. `types/` no importa nada (solo declara).

Estas reglas se hacen cumplir con `eslint-plugin-boundaries` en `.eslintrc.cjs`.

## Tipos de componentes en App Router

| Tipo | Cuándo | Marca |
|---|---|---|
| **Server Component** (default) | Lecturas de datos, render inicial pesado, SEO | sin directiva |
| **Client Component** | Interactividad (forms, drag, listeners) | `"use client"` al inicio |
| **Server Action** | Mutaciones (crear cita, registrar venta) | `"use server"` |
| **Route Handler** | Endpoints HTTP (webhooks, integraciones externas) | `app/api/.../route.ts` |

## Anatomía de un módulo `features/<dominio>/`

```text
features/clients/
├─ components/                       # UI específica del dominio (no reutilizable)
│  ├─ client-list.tsx
│  ├─ client-list-row.tsx
│  ├─ client-profile-header.tsx
│  ├─ client-profile-tabs.tsx
│  └─ sections/                      # Tarjetas del panel lateral del perfil
│     ├─ luxe-circle-card.tsx
│     ├─ skin-profile-card.tsx
│     └─ interests-card.tsx
│
├─ hooks/                            # Hooks específicos del dominio
│  ├─ use-client.ts                  # consulta TanStack por id
│  ├─ use-client-segments.ts
│  └─ use-client-events.ts           # birthdays / replenishment
│
├─ schemas/                          # Validación zod (compartida cliente+servidor)
│  ├─ new-client.schema.ts
│  └─ register-visit.schema.ts
│
├─ actions/                          # Server Actions
│  ├─ create-client.ts
│  ├─ register-visit.ts
│  └─ register-sale.ts
│
├─ services/                         # Funciones puras de dominio (testables)
│  ├─ segment-client.ts              # VIP / Recurrent / New / AtRisk
│  ├─ update-client-stats.ts         # LTV / visits / avgTicket
│  └─ level-progress.ts
│
├─ types/                            # Tipos locales del feature (los compartidos viven en src/types/)
└─ index.ts                          # Barrel ÚNICAMENTE de la API pública del módulo
```

Detalle por feature en [`05-feature-modules.md`](05-feature-modules.md).

## Boundaries clave (server vs client)

```text
[ Server Component ]
     ↓ props serializables
[ Client Component ]   ←──── Server Action ("use server")
     ↓                              ↑
[ Zustand / TanStack ]      [ services/ → repositories/ → db/ ]
```

- **No** se pasan funciones ni clases entre Server y Client (solo datos planos).
- Las mutaciones del cliente nunca tocan `db/` directamente: pasan por Server Action → service → repository.
- Los formularios usan `useFormState` + `useFormStatus` para errores de servidor.

## Path aliases (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*":             ["src/*"],
      "@/components/*":  ["src/components/*"],
      "@/features/*":    ["src/features/*"],
      "@/lib/*":         ["src/lib/*"],
      "@/hooks/*":       ["src/hooks/*"],
      "@/stores/*":      ["src/stores/*"],
      "@/server/*":      ["src/server/*"],
      "@/types/*":       ["src/types/*"],
      "@/config/*":      ["src/config/*"]
    }
  }
}
```

## Build, dev y deploy

| Entorno | Comando | Notas |
|---|---|---|
| Dev | `pnpm dev` | Sustituye al actual `start.cmd` (servidor estático en 127.0.0.1:8765) |
| Prod | `pnpm build && pnpm start` | Output estándar de Next.js |
| Tests | `pnpm test` (unit) · `pnpm e2e` (Playwright) | |
| Lint | `pnpm lint` (eslint + tsc --noEmit) | CI bloquea si falla |

El despliegue objetivo en iPad sigue siendo una PWA (manifest + service worker para modo offline parcial, como hoy `ScreenSync` lo simula).
