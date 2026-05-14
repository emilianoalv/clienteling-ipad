# 06 · Rutas y control de acceso (RBAC)

> **Alcance:** estructura de `app/`, route groups, middleware de autenticación, mapeo rol → permisos.
> Para la lógica de sesión, ver `07-state-and-data.md`. Para la organización por dominio, ver `05-feature-modules.md`.

## Modelo de roles

Heredado del prototipo (`app/rbac.jsx`), con discriminación explícita por tipo:

```ts
// src/types/staff.ts
export type Role = "BA" | "Manager" | "Supervisor" | "HQ" | "Admin";

export type Permission =
  | "clients:read"  | "clients:write"
  | "purchases:read" | "purchases:write"
  | "appointments:read" | "appointments:write"
  | "communications:read" | "communications:write"
  | "templates:read" | "templates:write"
  | "reports:read"
  | "devices:read"  | "devices:write"
  | "users:write"
  | "integrations:write"
  | "stores:write"
  | "admin:read";
```

### Matriz rol → permisos

| Permiso | BA | Manager | Supervisor | HQ | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| `clients:read` | ✓ (su tienda + marca) | ✓ (su tienda) | ✓ (su zona) | ✓ (todas) | ✓ |
| `clients:write` | ✓ | ✓ | ✓ | – | ✓ |
| `purchases:write` | ✓ | ✓ | – | – | ✓ |
| `appointments:write` | ✓ | ✓ | ✓ | – | ✓ |
| `communications:write` | ✓ | ✓ | – | – | ✓ |
| `templates:write` | – | ✓ | ✓ | ✓ | ✓ |
| `reports:read` | – | ✓ | ✓ | ✓ | ✓ |
| `devices:write` | – | ✓ | – | ✓ | ✓ |
| `users:write` | – | – | – | – | ✓ |
| `integrations:write` | – | – | – | – | ✓ |
| `stores:write` | – | – | – | – | ✓ |

### Scope (alcance de datos)

Además del permiso, cada rol tiene un scope:

```ts
// src/server/auth/scope.ts
export interface Scope {
  storeIds: StoreId[];          // tiendas visibles
  brandIds: BrandId[];          // marcas visibles
  canSeeClient(c: Client): boolean;
  canSeeBA(b: BA): boolean;
  canSeeStore(s: Store): boolean;
}

export function scopeFor(staff: Staff): Scope { ... }
```

Reglas (idénticas al prototipo en `app/rbac.jsx:46-75`):

- **BA** — `storeIds = [user.storeId]`, `brandIds = user.brands`. Clientes filtrados por marca ∩ tienda (la tienda se deriva por compras si no hay storeId directo).
- **Manager** — `storeIds = [user.storeId]`, `brandIds = todas`.
- **Supervisor** — `storeIds = user.storeIds`, `brandIds = todas`.
- **HQ** / **Admin** — sin restricción.

## Estructura del App Router

```text
src/app/
├─ layout.tsx                          # Providers globales (Query, i18n, Session)
├─ globals.css                         # Importa styles/tokens.css
├─ middleware.ts                       # Ver más abajo
│
├─ (auth)/
│  └─ login/
│     └─ page.tsx                      # ScreenLogin actual
│
├─ (app)/                              # Solo accesible con sesión válida
│  ├─ layout.tsx                       # <Shell><Shell.Rail/><Shell.TopBar/>{children}</Shell>
│  │
│  ├─ ba/
│  │  ├─ page.tsx                      # Home BA
│  │  ├─ clients/
│  │  │  ├─ page.tsx                   # Lista
│  │  │  ├─ new/page.tsx               # Wizard
│  │  │  └─ [clientId]/
│  │  │     ├─ page.tsx                # Perfil 360
│  │  │     ├─ visit/page.tsx          # Registrar visita
│  │  │     ├─ sale/page.tsx           # Registrar venta
│  │  │     ├─ timeline/page.tsx       # Historial completo
│  │  │     ├─ purchases/page.tsx
│  │  │     ├─ recommendations/page.tsx
│  │  │     ├─ samples/page.tsx
│  │  │     └─ messages/page.tsx
│  │  ├─ appointments/
│  │  │  ├─ page.tsx                   # Hub (calendario + gestión)
│  │  │  └─ new/page.tsx
│  │  ├─ catalog/page.tsx
│  │  ├─ consultation/page.tsx
│  │  ├─ basket/page.tsx
│  │  ├─ samples/page.tsx
│  │  ├─ followup/page.tsx
│  │  ├─ communications/page.tsx
│  │  └─ performance/page.tsx          # BaDashboard
│  │
│  ├─ manager/
│  │  ├─ page.tsx                      # ManagerDashboard
│  │  ├─ team/page.tsx                 # ScreenClients con scope tienda
│  │  ├─ segments/page.tsx
│  │  ├─ appointments/page.tsx
│  │  ├─ devices/page.tsx
│  │  └─ reports/page.tsx
│  │
│  ├─ supervisor/
│  │  ├─ page.tsx                      # SupervisorDashboard
│  │  ├─ stores/page.tsx
│  │  ├─ reports/page.tsx
│  │  └─ tickets/page.tsx
│  │
│  ├─ hq/
│  │  ├─ page.tsx                      # HqDashboard
│  │  ├─ stores/page.tsx
│  │  ├─ catalog/page.tsx
│  │  ├─ devices/page.tsx
│  │  ├─ reports/page.tsx
│  │  └─ integrations/page.tsx
│  │
│  └─ admin/
│     ├─ page.tsx                      # Admin home
│     ├─ users/page.tsx
│     ├─ segments/page.tsx
│     ├─ integrations/page.tsx
│     ├─ reports/page.tsx
│     └─ audit/page.tsx
│
└─ api/
   ├─ auth/
   │  ├─ login/route.ts
   │  └─ logout/route.ts
   └─ webhooks/
      ├─ pos/route.ts
      └─ whatsapp/route.ts
```

### Por qué route groups con paréntesis

- `(auth)` y `(app)` agrupan rutas sin añadir segmento de URL.
- Permiten dos `layout.tsx` distintos: uno sin Shell para login, otro con Shell para la app.
- Sustituye el `lx-app-fullbleed` vs `lx-app-viewport` actual de `app.html:307-348`.

### Por qué un sub-tree por rol

- El **prefijo de URL identifica el rol** y elimina el `switch(role)` actual de `app.html:160-205`.
- La home del rol es siempre `/{role}` — sin que la app tenga que recordar la pantalla por defecto.
- Permite redireccionar tras login a `/${role.toLowerCase()}` directamente.
- Habilita política de cache distinta por sub-tree.

## Middleware

`src/middleware.ts` corre antes de cualquier render. Tres responsabilidades:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionCookie } from "@/server/auth/cookie";
import { homeFor } from "@/config/rbac";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Locale (next-intl). Ver 09-i18n.md.
  // ... handled by next-intl/middleware

  // 2. Auth
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  const session = await verifySessionCookie(req.cookies.get("session")?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Role gate por prefijo de URL
  const requiredRole = pathname.split("/")[1]; // 'ba' | 'manager' | ...
  if (!canAccessRole(session.role, requiredRole)) {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Reglas `canAccessRole`

```ts
// Admin entra a cualquier prefijo. Los demás solo al suyo.
function canAccessRole(role: Role, urlRole: string) {
  if (role === "Admin") return true;
  return role.toLowerCase() === urlRole;
}
```

### Home por defecto

```ts
// src/config/rbac.ts
export function homeFor(role: Role): string {
  switch (role) {
    case "BA":         return "/ba";
    case "Manager":    return "/manager";
    case "Supervisor": return "/supervisor";
    case "HQ":         return "/hq";
    case "Admin":      return "/admin";
  }
}
```

## Autorización a nivel de página y de acción

El middleware bloquea por **rol**. La autorización fina (por **permiso** y **scope**) ocurre dentro de cada Server Component / Server Action:

```ts
// Server Component
export default async function ClientPage({ params }: { params: { clientId: string } }) {
  const { staff, scope } = await requireSession();
  const client = await getClient(params.clientId);

  if (!scope.canSeeClient(client)) notFound();   // 404 silencioso

  return <ClientProfile client={client} />;
}
```

```ts
// Server Action
"use server";
export async function registerSale(input: RegisterSaleInput) {
  const { staff } = await requireSession();
  if (!can(staff.role, "purchases:write")) throw new ForbiddenError();

  const client = await getClient(input.clientId);
  if (!scopeFor(staff).canSeeClient(client)) throw new ForbiddenError();

  return await purchaseService.create(input, staff);
}
```

El helper `can(role, permission)` lee la matriz declarada arriba (`src/config/rbac.ts`). No se duplica nunca esa tabla.

## Nav items por rol

El sidebar `Shell.Rail` se alimenta de un config único (sustituye `app/shell.jsx:3-44`):

```ts
// src/config/nav.ts
type NavItem = { id: string; href: string; label: string; icon: IconName };

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  BA: [
    { id: "home",       href: "/ba",                label: "rail.home",       icon: "home" },
    { id: "clients",    href: "/ba/clients",        label: "rail.clients",    icon: "users" },
    { id: "calendar",   href: "/ba/appointments",   label: "rail.appointments", icon: "calendar" },
    { id: "catalog",    href: "/ba/catalog",        label: "rail.catalog",    icon: "bag" },
    { id: "samples",    href: "/ba/samples",        label: "rail.samples",    icon: "gift" },
    { id: "followup",   href: "/ba/followup",       label: "rail.followup",   icon: "message" },
    { id: "performance",href: "/ba/performance",    label: "rail.perf",       icon: "chart" },
  ],
  Manager: [ ... ],
  Supervisor: [ ... ],
  HQ: [ ... ],
  Admin: [ ... ],
};
```

El `Shell.Rail` se renderiza desde el `layout.tsx` de cada sub-tree leyendo este config + `usePathname()` para resaltar el activo. **No** hay `RAIL_MAP` con mapeos especiales: la URL es la fuente de verdad.

## Boundary auth ↔ UI

```text
Request
  └─ middleware.ts          ← decide /login vs /<role>/...
       └─ layout (app)/
            └─ requireSession() en el RSC root
                 └─ Página individual usa session + scope
                      └─ Server Action revalida session + permiso
```

## Notas de seguridad

- **No** confiar en el rol que envía el cliente. Siempre `getSession()` en server.
- **No** usar `localStorage` para guardar el rol; el cliente sólo recibe lo que el servidor le da en SSR/SSO.
- Cookie de sesión: `httpOnly`, `secure`, `sameSite=Lax`, firmada con secret de entorno.
- Rotación de sesión tras login exitoso (regenera ID).
- Lockout (`features/auth/`) persistido server-side, no en `localStorage`.
- Logs de auditoría para acciones con `:write` (alimenta `ScreenAdmin` → auditoría).
