# 07 · Estado y capa de datos

> **Alcance:** modelo de dominio, persistencia, mutaciones, caché y estado de cliente.
> Para autenticación y roles, ver `06-routing-and-rbac.md`. Para los módulos que consumen este estado, ver `05-feature-modules.md`.

## Modelo de dominio (tipos `src/types/`)

Cada agregado se define una sola vez en TypeScript. Los nombres y campos heredan del prototipo (`app/data.jsx`).

```ts
// src/types/client.ts
export type ClientId = string & { readonly brand: unique symbol };

export type ClientTier  = "Signature" | "Icon" | "Atelier";
export type SkinType    = "Mixta" | "Seca" | "Grasa" | "Madura" | "Normal";
export type Routine     = "Básica" | "Intermedia" | "Avanzada" | "Profesional";
export type Segment     = "VIP" | "Recurrent" | "New" | "AtRisk";

export interface Client {
  id: ClientId;
  name: string;
  phone: string;
  email: string;
  birthday: string;                        // ISO date
  city: string;
  age: number | null;
  preferredLang: "es-MX" | "en-US";
  since: string;                           // ISO date
  tier: ClientTier;
  brands: BrandId[];
  skin: { type: SkinType; concerns: string[]; tone: string };
  allergies: string[];
  loyalty: { name: string; tier: ClientTier; points: number; toNext: number };
  stats:   { ltv: number; visits: number; avgTicket: number; lastPurchase: string | null };
  affinities: string[];
  interests: string[];
  routine: Routine;
}
```

Agregados análogos en archivos separados:

| Tipo | Archivo |
|---|---|
| `BA`, `Manager`, `Supervisor`, `Admin`, `Staff` (union) | `src/types/staff.ts` |
| `Product`, `Sku`, `Brand`, `BrandId` | `src/types/product.ts` |
| `Purchase`, `PurchaseItem`, `PaymentMethod` | `src/types/purchase.ts` |
| `Recommendation` | `src/types/recommendation.ts` |
| `Sample` | `src/types/sample.ts` |
| `Interaction`, `InteractionKind` | `src/types/interaction.ts` |
| `Communication`, `Channel` | `src/types/communication.ts` |
| `Appointment`, `AppointmentStatus`, `AppointmentKind` | `src/types/appointment.ts` |
| `Task` | `src/types/task.ts` |
| `Template` | `src/types/template.ts` |
| `Store` | `src/types/store.ts` |
| `Consent` | `src/types/consent.ts` |
| `Device` | `src/types/device.ts` |
| `Ticket` | `src/types/ticket.ts` |
| `Integration` | `src/types/integration.ts` |

Los IDs llevan **branded types** (`& { readonly brand: unique symbol }`) para evitar mezclar `ClientId` con `StoreId` accidentalmente.

## Capas de datos

```text
[ Server Components / Server Actions ]
        │
        ▼
[ services/  ]   ← lógica de caso de uso
        │
        ▼
[ repositories/ ] ← acceso al agregado
        │
        ▼
[ db/ ]          ← Drizzle/Prisma o cliente HTTP a backend real
```

- **Repositorios** exponen operaciones por agregado: `clientRepository.findById`, `clientRepository.recordPurchase`.
- **Servicios** orquestan reglas de negocio: `purchaseService.register(input, staff)` valida, persiste y emite efectos.
- **DB** es intercambiable. Durante la migración apunta a un mock en memoria que reproduce las colecciones actuales (`CLIENTS`, `PURCHASES`, etc.).

### Repositorio de ejemplo

```ts
// src/server/repositories/client.repository.ts
export interface ClientRepository {
  findById(id: ClientId): Promise<Client | null>;
  list(filter: ClientListFilter, scope: Scope): Promise<Client[]>;
  create(input: NewClientInput): Promise<Client>;
  patchStats(id: ClientId, stats: ClientStats): Promise<void>;
}
```

Hay una sola implementación por entorno (mock, dev, prod). Se inyecta desde `src/server/container.ts`.

## Estado de servidor en el cliente: TanStack Query

Solo se usa para **datos** mostrados al cliente que necesitan refetch / mutaciones optimistas.

```ts
// src/features/clients/hooks/use-client.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "../api/fetch-client";

export function useClient(id: ClientId) {
  return useQuery({
    queryKey: ["client", id],
    queryFn:  () => fetchClient(id),
    staleTime: 60_000,
  });
}
```

Reglas:

1. **Una query key por entidad + variantes** (`["client", id]`, `["clients", filter]`, `["appointments", { from, to }]`).
2. Mutaciones siempre vía Server Action; revalida la query con `queryClient.invalidateQueries`.
3. Lecturas iniciales en `page.tsx` (Server Component); `useQuery` solo si el cliente re-fetchea.

## Estado de cliente: Zustand

Para estado **puramente UI** que la URL no puede modelar:

| Store | Estado | Por qué Zustand |
|---|---|---|
| `brand-lock.store` | `lock: BrandId \| null` | Filtro global, se cambia desde TopBar |
| `basket.store` | `items: BasketItem[]` | Carrito antes de checkout |
| `toast.store` | `toasts: Toast[]` | Notificaciones globales |
| `modal-stack.store` | `stack: ModalDef[]` | Modales apilados (AppointmentDetailModal, etc.) |

Ejemplo:

```ts
// src/stores/brand-lock.store.ts
"use client";
import { create } from "zustand";

interface BrandLockState {
  lock: BrandId | null;
  setLock: (b: BrandId | null) => void;
}

export const useBrandLock = create<BrandLockState>((set) => ({
  lock: null,
  setLock: (lock) => set({ lock }),
}));
```

Reemplaza el `BrandLockContext` actual de `app/components.jsx:64-65`.

## Lo que **no** se conserva del prototipo

| Pieza actual | Reemplazo |
|---|---|
| `window.CLIENTS`, `window.APPOINTMENTS`, etc. | Repositorios server-side |
| `window.LxState.update/add/remove` | Server Actions específicas (`createAppointment`, `registerSale`...) |
| `window.LxState.subscribe` (eventos `lx-state`) | `queryClient.invalidateQueries` tras la mutación |
| `window.CURRENT_BA` | `getSession()` en server, `useSession()` en cliente |
| `window.CURRENT_PROFILE_CLIENT_ID` | `useParams().clientId` (URL como source of truth) |
| `localStorage` namespaces `lx-clienteling:v1:*` | Cookie de sesión + Postgres/SQLite real |
| `setSessionTick` + `addEventListener('lx-session')` | React contexts vía `<SessionProvider>` |

## Persistencia

| Dato | Donde vive |
|---|---|
| Sesión | Cookie httpOnly firmada |
| Lockout | DB (`auth_lockouts` con `ip`, `userId`, `until`) |
| Preferencia de idioma | Cookie `locale` (next-intl) |
| Datos de negocio | DB |
| Borradores de formulario | `sessionStorage` cliente (opcional, key por feature) |
| Cola offline iPad | IndexedDB + Service Worker (Background Sync), reemplaza la simulación de `ScreenSync` |

## Validación: schemas zod compartidos

Cada Server Action recibe input validado contra un schema co-localizado:

```ts
// src/features/clients/schemas/new-client.schema.ts
import { z } from "zod";

export const newClientSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  phone:     z.string().regex(/^\d{10,}$/),
  email:     z.string().email(),
  birthday:  z.string().date(),
  gender:    z.enum(["Femenino", "Masculino", "Otro", "Prefiere no decir"]),
  skin: z.object({
    type:     z.enum(["Mixta", "Seca", "Grasa", "Madura", "Normal"]),
    concerns: z.array(z.string()).min(1),
    tone:     z.string(),
  }),
  interests: z.array(z.string()).min(1),
  consents:  z.array(z.object({
    channel: z.enum(["SMS", "Email", "WhatsApp"]),
    status:  z.enum(["granted", "revoked"]),
  })),
});

export type NewClientInput = z.infer<typeof newClientSchema>;
```

El **mismo** schema se usa en cliente (`react-hook-form` con `zodResolver`) y en servidor (validación de la Server Action). Reemplaza los `if` manuales de `ScreenNewClient` (`app/screens-clients.jsx:169`).

## ID generation

`window.LxState.newId('cl')` se sustituye por:

```ts
// src/lib/id/generate-id.ts
import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
export function generateId(prefix: string): string {
  return `${prefix}-${nano()}`;
}
```

## Eventos del dominio

Hoy hay tres eventos `window`: `lx-state`, `lx-session`, `lx-i18n`. En el nuevo mundo:

- Sesión: `SessionProvider` propaga cambios; `useSession()` en hooks.
- Idioma: `next-intl` lo maneja vía cookie + provider.
- Mutaciones de datos: `queryClient.invalidateQueries(...)` o `revalidatePath('/...')` en Server Action.

No queda `window.dispatchEvent`.

## Estrategia de cache

| Recurso | TTL | Política |
|---|---|---|
| `useQuery(['client', id])` | 60 s stale | Revalida tras mutación |
| `useQuery(['clients', filter])` | 30 s stale | Revalida tras `createClient` |
| `useQuery(['appointments', range])` | 15 s stale | Revalida tras CRUD de cita |
| Catálogo de productos | 5 min | Cache de Next.js (`revalidate: 300`) |
| Tokens / config | build-time | Forma parte del bundle |

## Estado por flujo

| Flujo | Donde vive |
|---|---|
| Cliente activo en perfil | URL `[clientId]` |
| Brand lock | `useBrandLock()` (Zustand) |
| Filtros de lista (segmento, búsqueda) | `searchParams` de la URL (compartible) |
| Filtros de historial (período, status) | `searchParams` |
| Wizard de nuevo cliente | `react-hook-form` (estado local, persistido en `sessionStorage` por seguridad) |
| Selección de cita en agenda | estado local del componente (modal abierto) |
| Items del basket | `useBasket()` (Zustand persistido en `localStorage`) |

## Resumen de cambios respecto al prototipo

| Patrón actual | Reemplazo |
|---|---|
| Arrays globales en `window.*` | DB + repositorios + queries |
| Mutación + `dispatchEvent` | Server Action + `invalidateQueries` |
| `localStorage` namespaces v1 | Cookie httpOnly + DB |
| Sin tipado, mocks como fuente | Tipado estricto + schemas zod compartidos |
| `setTimeout(onBack, 1400)` en cada form | `useFormState` + redirect server-side |
| `BrandLockContext` (React Context) | `useBrandLock()` (Zustand) — más simple, sin Provider extra |
