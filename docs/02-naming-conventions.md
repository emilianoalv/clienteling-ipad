# 02 · Convenciones de nombres

> **Alcance:** cómo se nombran archivos, símbolos, eventos, rutas, ramas y commits.
> Para qué carpeta usar, ver `01-architecture.md`. Para el catálogo de componentes, ver `04-ui-components.md`.

## Principio rector

Los nombres describen **qué es** la cosa, no **cómo está implementada** ni **qué framework la usa**. Coinciden con la nomenclatura de la industria: React docs, Next.js docs y libros como *Clean Code* / *Domain-Driven Design*.

## Tabla maestra

| Elemento | Convención | Ejemplo | Anti-ejemplo |
|---|---|---|---|
| Archivos de código | `kebab-case` | `client-list-row.tsx` | `ClientListRow.tsx`, `clientListRow.tsx` |
| Componentes React | `PascalCase` | `ClientListRow` | `clientListRow`, `client_list_row` |
| Hooks | `camelCase` con prefijo `use` | `useClientSegments` | `ClientSegments`, `get_client_segments` |
| Funciones / variables | `camelCase` | `formatCurrency`, `appointmentsByDay` | `FormatCurrency`, `appointments_by_day` |
| Constantes inmutables | `SCREAMING_SNAKE_CASE` | `MAX_PIN_ATTEMPTS`, `SESSION_HOURS` | `maxPinAttempts` |
| Tipos / interfaces TS | `PascalCase`, sin prefijo `I` | `Client`, `AppointmentStatus` | `IClient`, `TClient` |
| Enums (literal union) | `PascalCase` valores `kebab-case` o `PascalCase` | `'in-progress' \| 'cancelled'` | mezcla espacios/Spanish |
| Tipos genéricos | `PascalCase` 1-letra o palabra | `T`, `TData`, `TError` | `t`, `data_t` |
| Carpetas | `kebab-case` plural si agrupan | `features/clients/`, `components/charts/` | `Features`, `Client` |
| Server Actions | `verbo-objeto.ts` | `create-client.ts`, `register-sale.ts` | `clientNew.ts` |
| Variables de entorno | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `NEXT_PUBLIC_API_BASE` | `databaseUrl` |
| CSS classes (CSS Modules) | `camelCase` | `styles.cardLuxe` | `styles['card-luxe']` |
| CSS vars (tokens) | `--kebab-case` | `--ink`, `--lancome-rose-deep` | `--Ink`, `--inkColor` |
| Ramas git | `tipo/short-descr` | `feat/client-profile-tabs`, `fix/pin-lockout` | `Feature-client-profile` |
| Commits | Conventional Commits | `feat(clients): add register visit flow` | `update`, `wip` |

## Archivos por tipo

### React (Server o Client Components)

`kebab-case.tsx` — el componente exportado por default va en `PascalCase`.

```tsx
// src/features/clients/components/client-list-row.tsx
export function ClientListRow({ client }: { client: Client }) { ... }
```

### Hooks

`use-xxx.ts` con función `useXxx`.

```ts
// src/features/clients/hooks/use-client.ts
export function useClient(id: ClientId) { ... }
```

### Schemas (zod)

`<accion>.schema.ts` exportando `<accion>Schema` y su tipo.

```ts
// src/features/clients/schemas/new-client.schema.ts
export const newClientSchema = z.object({ ... });
export type NewClientInput = z.infer<typeof newClientSchema>;
```

### Server Actions

`verbo-objeto.ts` con función nombrada (no default), `"use server"` al inicio.

```ts
// src/features/clients/actions/register-sale.ts
"use server";
export async function registerSale(input: RegisterSaleInput) { ... }
```

### Tipos de dominio

Un archivo por agregado en `src/types/`, nombre singular.

```ts
// src/types/client.ts
export interface Client { ... }
export type ClientId = Client["id"];
export type ClientTier = "Signature" | "Icon" | "Atelier";
```

### Tests

Co-localizados con el archivo bajo prueba.

| Archivo | Test |
|---|---|
| `segment-client.ts` | `segment-client.test.ts` |
| `client-list-row.tsx` | `client-list-row.test.tsx` |
| E2E | `tests/e2e/<flow>.spec.ts` |

## Patrones de nombrado por capa

### Componentes (`components/`)

Familia visual + variante. Sin prefijo de marca del proyecto.

| Capa | Patrón | Ejemplos |
|---|---|---|
| Primitive (atom) | sustantivo | `Button`, `Input`, `Avatar`, `Chip`, `Icon` |
| Pattern (molecule) | sustantivo compuesto | `KpiCard`, `SegmentedControl`, `KvRow`, `EmptyState`, `Stepper` |
| Layout (organism) | sustantivo de rol | `Shell`, `Rail`, `TopBar`, `IpadFrame` |
| Chart | tipo de gráfico | `Sparkline`, `BarChart`, `LineChart`, `Donut`, `ScatterPlot`, `Heatmap` |
| Feedback | nombre de patrón UX | `Toast`, `Modal`, `ConfirmDialog`, `Drawer`, `Sheet` |

> **Migración:** los componentes actuales con prefijo `Lx*` (`LxAvatar`, `LxKV`, `LxStat`, `LxSeg`, `LxSpark`, `LxProgress`) pierden el prefijo. El prefijo `Lx` describía **el origen** (L'Oréal Luxe), no **la naturaleza** del componente; la naturaleza ya queda implícita por estar bajo `src/components/`.

### Features (`features/<dominio>/`)

El sustantivo de dominio en **plural** cuando agrupa (`clients`, `appointments`), **singular** cuando es un caso de uso único (`consultation`).

Dentro del feature, los componentes empiezan con el sustantivo de dominio:

| Feature | Componente | Hook |
|---|---|---|
| `clients` | `ClientList`, `ClientProfile`, `ClientProfileHeader` | `useClient`, `useClientSegments` |
| `appointments` | `AppointmentCalendar`, `AppointmentDetailModal`, `NewAppointmentForm` | `useAppointments`, `useUpcomingAppointments` |
| `samples` | `SampleList`, `SampleInventoryCard` | `useSamples`, `useSampleConversion` |

### Iconos

El módulo actual `I` (47 SVG en `app/components.jsx`) se renombra a `<Icon name="..." />` con un map tipado:

```ts
// src/components/primitives/icon.tsx
export type IconName =
  | "search" | "home" | "user" | "users" | "calendar"
  | "bag" | "sparkle" | "chart" | "message" | "gift"
  | "device" | "ticket" | "cloud" | "plug" | "download"
  | "plus" | "arrow-right" | "arrow-left" | "bell"
  | "check" | "x" | "more" | "chevron-right" | "chevron-down"
  | "power" | "shield" | "heart" | "star" | "wifi" | "wifi-off"
  | "filter" | "scan" | "excel" | "pdf" | "camera"
  | "whatsapp" | "email" | "sms" | "warning" | "lock"
  | "trash" | "eye" | "loreal-logo";
```

Los nombres siguen la convención de **lucide-react** (referencia de la industria): `arrow-right`, `chevron-down`, `wifi-off`.

## Nombres de eventos custom

Los eventos `lx-state`, `lx-session`, `lx-i18n` actuales se conservan pero migran a un único bus tipado:

```ts
// src/lib/events.ts
type AppEvent =
  | { type: "state:changed"; collection: CollectionName; id: string }
  | { type: "session:changed"; userId: string | null }
  | { type: "locale:changed"; locale: Locale };
```

Patrón: `<dominio>:<accion-en-pasado>`. Reemplaza el prefijo `lx-` del prototipo.

## Rutas (App Router)

Carpetas de ruta en `kebab-case`, segmentos dinámicos entre corchetes:

| Ruta | Archivo |
|---|---|
| `/ba` | `src/app/(app)/ba/page.tsx` |
| `/ba/clients` | `src/app/(app)/ba/clients/page.tsx` |
| `/ba/clients/[clientId]` | `src/app/(app)/ba/clients/[clientId]/page.tsx` |
| `/ba/clients/[clientId]/timeline` | `.../[clientId]/timeline/page.tsx` |
| `/ba/appointments/new` | `.../appointments/new/page.tsx` |

Parámetros: **camelCase singular** (`clientId`, `appointmentId`), no `id` desnudo (ambiguo a varios niveles).

## Bandera "boolean"

Prefijos consistentes: `is`, `has`, `can`, `should`.

```ts
isLoading, isLocked, hasConsent, canEdit, shouldRedirect
```

## Funciones puras de dominio

Verbo + objeto. No "get" para cómputo (reservar `get` para acceso simple).

| Bien | Mal |
|---|---|
| `segmentClient(client)` | `getSegment(client)` (ambiguo) |
| `calculateLevelProgress(client)` | `getProgress(client)` |
| `formatCurrency(amount)` | `currency(amount)` |
| `findClientById(id)` | `client(id)` |
| `listUpcomingEvents(client)` | `events(client)` |

## Tipos discriminados

Usar `kind` (no `type`, que choca con la palabra reservada):

```ts
type Notification =
  | { kind: "appointment-reminder"; appointmentId: string }
  | { kind: "birthday-today"; clientId: string }
  | { kind: "low-stock"; sku: string };
```

## Imports y barrels

- Cada `features/<dominio>/index.ts` re-exporta **solo** la API pública del módulo.
- No hay `export *` desde directorios profundos (rompe tree-shaking y rastreo de uso).
- Imports siempre por alias `@/...`, nunca `../../../`.

## Anti-patrones prohibidos

| Patrón | Por qué se prohíbe |
|---|---|
| `utils.ts`, `helpers.ts`, `misc.ts` | Sin pista del contenido; siempre crece sin control |
| `index.tsx` que **contiene** un componente | Dificulta navegar (todas las pestañas se llaman "index") |
| Sufijo `Component` (`ButtonComponent`) | Redundante; en `components/` ya es un componente |
| Prefijo `I` en interfaces | Convención C#, no TS moderno |
| Mezclar español e inglés en código | Mantener inglés en el código, español en `messages/es-MX.json` |
| Abreviaturas crípticas (`btn`, `ctx`, `usr`) | OK en variables muy locales; **nunca** en API pública |
