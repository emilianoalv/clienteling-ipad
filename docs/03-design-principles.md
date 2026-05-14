# 03 · Principios de diseño aplicados

> **Alcance:** SOLID, DRY y KISS aplicados a este proyecto, con casos reales del código actual.
> Para el árbol de carpetas que materializa estos principios, ver `01-architecture.md`.

## SOLID

### S — Single Responsibility

Cada módulo tiene **una** razón para cambiar.

**Caso actual.** `app/screens-profile.jsx` (65 KB, ~1 200 líneas) mezcla:

- Render del perfil del cliente.
- Formulario "Registrar visita".
- Formulario "Registrar venta".
- Componente `ProductPicker`.
- Componente `ConsentMatrix`.
- Cálculo de stats (LTV, avgTicket, visits) duplicado en dos sitios.

**Refactor objetivo.** Cada responsabilidad se separa:

```text
features/clients/components/
  ├─ client-profile.tsx
  ├─ register-visit-form.tsx
  ├─ register-sale-form.tsx
  ├─ product-picker.tsx          → si solo se usa en sales, queda aquí
  └─ consent-matrix.tsx          → si se usa también desde admin, sube a components/patterns/

features/clients/services/
  └─ update-client-stats.ts      → fórmula LTV/avgTicket UNA SOLA VEZ
```

### O — Open/Closed

Abierto a extensión, cerrado a modificación.

**Caso actual.** En `ScreenRegisterVisit` el render condicional por tipo de visita es un bloque `if isVenta / if isConsulta / if isMuestra / if isDevolucion` (líneas 248–320 de `app/screens-profile.jsx`). Añadir un nuevo tipo requiere tocar ese bloque y posiblemente romper otros.

**Refactor objetivo.** Schema declarativo por tipo:

```ts
// features/clients/config/visit-fields.ts
type FieldSpec = { name: string; label: string; kind: "number" | "skus" | "text"; required?: boolean };

export const VISIT_FIELDS: Record<VisitKind, FieldSpec[]> = {
  sale:       [{ name: "amount", label: "Monto", kind: "number", required: true }],
  consult:    [{ name: "durationMin", label: "Duración (min)", kind: "number" }],
  sample:     [{ name: "skus", label: "Productos", kind: "skus", required: true }],
  return:     [{ name: "amount", label: "Monto devuelto", kind: "number", required: true }],
  courtesy:   [],
  followUp:   [{ name: "notes", label: "Notas", kind: "text" }],
};
```

Añadir un tipo nuevo = agregar una entrada al mapa. El componente `<DynamicFields spec={VISIT_FIELDS[kind]} />` queda cerrado.

### L — Liskov Substitution

Los subtipos deben poder usarse en lugar del tipo base sin romper expectativas.

**Caso actual.** El union `BA | Admin/Supervisor/Manager` se mezcla en `window.BAS` vs `window.USERS` (ver `app/data.jsx`). El consumidor a veces hace `user.storeId` y a veces `user.storeIds`, según el rol. Eso rompe LSP porque el "subtipo" Admin no satisface el contrato BA.

**Refactor objetivo.** Tipos discriminados con campos explícitos:

```ts
type StaffBase = { id: string; name: string; initials: string; brands: BrandId[] };

type BA          = StaffBase & { role: "BA";         storeId: StoreId };
type Manager     = StaffBase & { role: "Manager";    storeId: StoreId };
type Supervisor  = StaffBase & { role: "Supervisor"; storeIds: StoreId[] };
type Admin       = StaffBase & { role: "Admin" };

type Staff = BA | Manager | Supervisor | Admin;

function visibleStores(s: Staff): StoreId[] {
  switch (s.role) {
    case "BA":
    case "Manager":    return [s.storeId];
    case "Supervisor": return s.storeIds;
    case "Admin":      return /* todas */ allStoreIds();
  }
}
```

El compilador exige el `switch` exhaustivo. Ningún consumidor accede a un campo que no exista para su rol.

### I — Interface Segregation

Las interfaces deben ser pequeñas y específicas para su consumidor.

**Caso actual.** `Shell` recibe 12 props (`role`, `active`, `onNav`, `title`, `subtitle`, `brandContext`, `setBrandContext`, `online`, `children`, `rightBar`, `onLogout`, `demoMenuState`) — muchas son ortogonales y solo una mitad las usa cada llamada.

**Refactor objetivo.** Partir `Shell` en piezas con APIs pequeñas y usar **composición**:

```tsx
<Shell>
  <Shell.Rail role={role} active={active} onNavigate={navigate} />
  <Shell.TopBar
    title={user.name}
    subtitle={subtitleFor(user)}
    onLogout={logout}
    right={<SyncBadge online={isOnline} />}
  />
  <Shell.Content>{children}</Shell.Content>
</Shell>
```

Cada subcomponente tiene 2–4 props con responsabilidad clara.

### D — Dependency Inversion

Depender de abstracciones, no de implementaciones concretas.

**Caso actual.** Las pantallas leen `window.CLIENTS`, `window.APPOINTMENTS`, `window.LxState.update(...)` directamente. Eso ata todo el código a esa implementación específica (arrays globales en `data.jsx`) y dificulta probar o cambiar a una API real.

**Refactor objetivo.** Cada feature consume **hooks/Server Actions** que abstraen el origen:

```ts
// features/clients/hooks/use-client.ts (cliente)
export function useClient(id: ClientId) {
  return useQuery({ queryKey: ["client", id], queryFn: () => fetchClient(id) });
}

// features/clients/actions/register-sale.ts (servidor)
"use server";
export async function registerSale(input: RegisterSaleInput) {
  const repo = getClientRepository();   // ← abstracción
  await repo.recordPurchase(input);
}
```

La implementación de `getClientRepository()` puede ser un mock en tests, una DB en prod o el array global durante la migración. Los consumidores no se enteran.

## DRY — Don't Repeat Yourself

DRY aplica al **conocimiento**, no a la similitud sintáctica accidental. Algunos ejemplos reales del código actual:

### 1. Lógica de filtrado por estado

`ScreenHistoryRecs`, `ScreenHistorySamples`, `ScreenHistoryPurchases` repiten:

```js
const [status, setStatus] = useState("Todas");
const filtered = status === "Todas"
  ? items
  : items.filter(i => status === "Convertidas" ? i.converted : !i.converted);
```

**Solución.** Hook reutilizable + componente de filtro:

```ts
// hooks/use-filter.ts
export function useFilter<T>(items: T[], predicates: Record<string, (i: T) => boolean>) {
  const [key, setKey] = useState<string>("all");
  const filtered = useMemo(
    () => (key === "all" ? items : items.filter(predicates[key])),
    [items, key, predicates],
  );
  return { key, setKey, filtered };
}
```

### 2. Header de pantallas de historial

`ScreenHistoryPurchases`, `ScreenHistoryRecs`, `ScreenHistorySamples`, `ScreenHistoryMsgs`, `ScreenHistoryTimeline` comparten estructura: breadcrumb + back + chips de filtro + stats row + lista scrollable + empty state.

**Solución.** Plantilla genérica:

```tsx
<HistoryScreen
  title={t("history.purchases")}
  filters={<PeriodChips value={period} onChange={setPeriod} />}
  stats={<StatStrip stats={summary} />}
  onBack={onBack}
>
  {items.map(p => <PurchaseRow key={p.id} purchase={p} />)}
</HistoryScreen>
```

### 3. Actualización de `client.stats`

Hoy se calcula en `ScreenRegisterVisit` (línea 131-140) **y** en `ScreenRegisterSale` (línea 469-473) con la misma fórmula.

**Solución.** Una sola función de dominio:

```ts
// features/clients/services/update-client-stats.ts
export function applyPurchase(stats: ClientStats, amount: number): ClientStats {
  const visits = stats.visits + 1;
  const ltv    = stats.ltv + amount;
  return { ...stats, visits, ltv, avgTicket: Math.round(ltv / visits), lastPurchase: new Date().toISOString() };
}
```

Tests unitarios sobre esa función. Los formularios la invocan.

### 4. Toast de éxito + redirect

Se replica en `RegisterVisit`, `RegisterSale` y `NewClient`:

```js
setSaved(true);
setTimeout(() => onBack?.(), 1400);
```

**Solución.** Hook:

```ts
export function useSaveAndRedirect(redirect: () => void, delayMs = 1400) { ... }
```

## KISS — Keep It Simple, Stupid

KISS no es "menos código", es "menos conceptos". Reglas concretas para este proyecto:

### Una pantalla = una página

En el código actual, `app.html:142-206` tiene una función `renderScreen(role, screen, navTo, ...)` que selecciona el componente con `switch` y mapas por rol. Eso re-implementa un router.

**KISS.** Usar el App Router de Next.js. Cada combinación rol+pantalla es un archivo `page.tsx`. No hay `renderScreen`, no hay `RAIL_MAP`, no hay tabla de mapeo.

### Los datos son objetos planos

Nada de clases ni herencia. Funciones puras que transforman objetos. Si necesitas inyectar dependencias, pásalas como parámetros.

### No re-inventar primitivas

Estado de servidor → **TanStack Query**.
Validación → **zod**.
Form → **react-hook-form**.
Calendario → **`date-fns`** (`startOfWeek`, `addDays`, `isoWeek` ya existen en él; hoy se re-implementan en `screens-ops.jsx`).
Tabla → **TanStack Table** si la lógica supera dos columnas con filtro y orden.

### Una sola fuente de verdad por pieza de estado

Hoy `currentClientId` vive en localStorage **y** en estado React **y** en `window.CURRENT_PROFILE_CLIENT_ID`. Es fácil que se desincronicen.

**KISS.** La URL es la fuente de verdad para el cliente activo: `/ba/clients/[clientId]`. Los componentes lo leen con `useParams()`. localStorage queda solo para la persistencia de sesión.

### Limites de complejidad medibles

Estos números no son arbitrarios; son los umbrales por defecto de `eslint` que adoptaremos:

| Métrica | Tope |
|---|---|
| Líneas por archivo | 300 |
| Líneas por función | 50 |
| Complejidad ciclomática | 10 |
| Anidamiento `if/else` | 3 |
| Props por componente | 7 (más → composición o config object) |

Si superas un tope, parte el archivo o extrae lógica. No hay excepción salvo data tablas (`messages/es-MX.json`).

## Anti-patrón estrella a evitar

> **Renderizado por gran `switch` con tablas de mapeo a componentes.**

`app.html:142-206` lo hace. Es legible al principio y rapidísimo de degradar: cualquier "tipo nuevo" obliga a tocar tres lugares (el `switch`, el `RAIL_MAP`, el `ROLE_TITLE`). El router de Next.js sustituye los tres con cero código.
