# Handover — pre-Etapa 1 (Dashboards)

> **Fecha**: 2026-05-17
> **Audiencia**: la siguiente sesión de Claude Code que continúe el proyecto.
> **Propósito**: dejar todo el contexto necesario para implementar la Etapa 1 (queries de KPIs para los 4 dashboards) sin re-descubrir decisiones ni gaps.

---

## 0. TL;DR

El proyecto es una app Next.js 15 multi-tenant (3 tiendas × 2 marcas × ~17 usuarios) que sirve de PoC para el RFP de L'Oréal Luxe. Los últimos 5 commits dejaron el modelo de scope (tienda + marca) sólido y alineado al BRD. **Lo que sigue es construir queries de KPIs para 4 dashboards** (BA / Gerente / Supervisor / Admin) — solo lógica + tests en esta etapa, sin UI.

Branch actual: `main`, sincronizado con `origin/main`. Working tree limpio.

---

## 1. Commits recientes (orden cronológico)

| Commit | Mensaje | Qué dejó |
|---|---|---|
| `4b507f8` | docs: agrega PDF fuente de requerimientos del RFP | El PDF en `docss/REQUERIMIENTOS (1).pdf` (carpeta con doble s, intencional) |
| `4ca66f1` | docs: agrega transcripción estructurada de requerimientos | [`docs/requerimientos.md`](requerimientos.md) — 61 RFs + 16 RNFs + 10 RIs + restricciones + CAs |
| `03270c1` | Merge de origin/main | Trajo 14 commits de Emiliano (followup tasks, motivo de visita, historial detalle) |
| `1162aa2` | feat: scope multi-tienda completo (RF-52, RF-53, RF-54, RNF-14) | `storeId` en 5 entidades, `storeScopeFor()`, validación 404 silencioso en fetch* |
| `cb8fbc5` | docs: análisis de brechas vs requerimientos funcionales del RFP | [`docs/analisis-brechas.md`](analisis-brechas.md) — tabla por RF/RNF con estado actual |
| `bea2396` | refactor: alinea roles al BRD (renombra Gerente, elimina HQ, scope por marca para BA, brand en Recommendation) | 4 roles BRD-aligned, BA single-brand, `brandScopeFor()`, `Recommendation.brand` requerido, seeds reescritos (17 users, 15 clientas mix brand) |
| `31f6d23` | docs: actualiza análisis de brechas tras refactor de roles y scope por marca | Cobertura ✅ subió de 39% a 47% (36/77) |

**Cobertura actual de RFs**: 33 ✅ · 23 ⚠️ · 4 ❌ · 1 🤔 (de 61 RFs).
**Cobertura de RNFs**: 3 ✅ · 7 ⚠️ · 1 ❌ · 5 🤔 (de 16 RNFs).

---

## 2. Decisiones de diseño tomadas (con su "por qué")

### 2.1 Storage del scope tienda + marca (commits 1162aa2 + bea2396)

| Decisión | Por qué |
|---|---|
| **1A — Desnormalizar `storeId`** en `Purchase`, `Appointment`, `Communication`, `Recommendation` | La tienda donde ocurrió la transacción es dato propio del registro. Soporta reportes por tienda sin joins costosos. |
| **2-single — `Client.storeId: StoreId`** singular | Una clienta pertenece a UNA tienda principal. RF-52 implica ownership claro. Compras pueden ocurrir en otras tiendas vía `Purchase.storeId`. |
| **3-404 silencioso** en `fetchClient`/`fetchAppointment`/`fetchBasketContext`/`fetchConsultationContext` cuando staff está fuera de scope | No leak de existencia. Consistente con `docs/06-routing-and-rbac.md`. Mismo response que "no existe". |
| **BA single-brand** (`BA.brand: BrandId` singular, requerido) | Por instrucción explícita del profesor: un BA representa un counter de UNA marca específica (Lancôme **o** YSL, no ambas). |
| **Gerente/Supervisor/Admin** con `brands?: readonly BrandId[]` opcional (undefined = todas) | Esos roles ven ambas marcas dentro de su scope de tienda(s). El campo opcional permite restricciones explícitas futuras sin cambio de schema. |
| **Opción A — multi-brand client = intersección** | Una clienta con `brands: ["Lancôme", "YSL"]` es visible para los 2 BAs (LCM y YSL) del counter. Refleja realidad de retail de lujo donde dos BAs colaboran con la misma VIP. |
| **HQ eliminado** | No estaba en el BRD; sus permisos de read-only operacional ya los tiene `Admin`. Reduce confusión al hacer demo. |
| **Manager → Gerente** | Match exacto con nombre del BRD ("Gerente de Tienda"). Ruta también renombrada a `/gerente`. |
| **`Recommendation.brand` requerido** | Cierra gap pre-existente del análisis de brechas. Una recomendación SIEMPRE se hace en contexto de UNA marca específica. |
| **`storeScopeFor(staff)` devuelve `undefined` para Admin** (en vez de array de todas las tiendas) | Optimización de query path: `undefined` = "no aplicar filtro" en repos. Evita inclusion-checks innecesarios. |
| **`brandScopeFor(staff)` mismo patrón** | Symmetric con storeScopeFor. |
| **Cache keys `__clienteling.{entity}.v3`** | El `_persist.ts` cachea en `globalThis` para sobrevivir HMR. Cambios de schema necesitan bump de version key para invalidar el cache. **Importante para el next agent**: si modificas seeds, sube a `.v4`. |

### 2.2 Roles y matriz RBAC final

```ts
// types/staff.ts
Role = "BA" | "Gerente" | "Supervisor" | "Admin"  // 4 roles, BRD-aligned

BA         = { id, name, initials, role: "BA",         storeId, brand: BrandId }       // single-brand
Gerente    = { id, name, initials, role: "Gerente",    storeId, brands?: BrandId[] }   // multi-brand opcional
Supervisor = { id, name, initials, role: "Supervisor", storeIds, brands?: BrandId[] }  // multi-store
Admin      = { id, name, initials, role: "Admin",                brands?: BrandId[] }  // global
```

### 2.3 Seed actual (17 usuarios, 15 clientas, 12 compras, 12 citas, 6 recs, 10 comms)

3 tiendas: `st-pol` (Liverpool Polanco), `st-per` (Liverpool Perisur), `st-stf` (Palacio Santa Fe).

Por tienda: 2 BAs Lancôme + 2 BAs YSL + 1 Gerente.

1 Supervisor "zona Centro" cubre **Polanco + Santa Fe** (Perisur deliberadamente fuera — útil para tests de exclusión).

1 Admin Central.

15 clientas distribuidas 5/5/5 entre las 3 tiendas, con mix de marcas: ~6 multi-brand · ~5 LCM-only · ~4 YSL-only.

---

## 3. Decisiones para Etapa 1 (Dashboards)

Antes de cerrar la sesión, evaluamos 5 preguntas (P1-P5) y tomamos las siguientes decisiones:

### P1 — Alcance del PR: **Camino B** (Fase 0 + Fase 1 en un solo commit)

- **Fase 0** (~30 min, prerequisito): agregar `storeId` a `Interaction` y `Sample`, `brand` a `Sample`, exponer `interactionRepository.list({brands, storeIds, from, to})`, actualizar seeds, bump cache a `.v4`.
- **Fase 1**: las ~30 queries en `features/dashboards/server/queries/` + helpers + tests.

Razón: la Fase 0 desbloquea 5 queries dependientes (`getActiveClients`, `getAtRiskClients`, `getFollowUp2RevisitRate`, `getPendingFollowUps`, `getSample2PurchaseRate`). Sin ella, el dashboard queda incompleto.

### P2 — Bugfixes pre-existentes: **arreglar followup-task ahora, product después**

- **Bug B (followup-task)**: arreglar al inicio del PR de Etapa 1 (5 min). Sus clientIds + BA_DEMO obsoletos rompen los KPIs de pending follow-ups.
- **Bug A (product.repository)**: dejar para un commit aparte. No bloquea las queries de dashboards (los reports usan purchases, no productRepository stock directly).

### P3 — UI de dashboards: **NO tocar en Etapa 1**

Mantener estrictamente "lógica + tests" en esta etapa. Los componentes `BaDashboard`, `ManagerDashboard`, `SupervisorDashboard` siguen con datos hardcoded. La Etapa 2 conectará UI ↔ queries.

### P4 — Cuando una query no aplica al rol: **throw `RoleNotPermittedError`**

Ej: BA llamando a `getStoreRanking` (ranking de tiendas no tiene sentido para un BA). Preferimos throw explícito sobre `return []` silencioso — facilita debugging y evita confusión.

Definir `RoleNotPermittedError` en `features/dashboards/server/errors.ts` (extends `Error`).

### P5 — Scope merge: cuando intersección es vacía, **devolver `[]` silencioso**

Ej: Gerente Polanco con `filters.storeIds: [st-stf]` (filtro pide tienda fuera de su scope). La intersección es ∅ → la query devuelve array vacío.

Razón: la intersección vacía es un estado válido (el usuario no tiene match), no un error de programación. No throw — solo `[]`.

**Importante**: este patrón aplica a queries de listado. Para queries que devuelven un solo objeto (futuro), evaluar caso por caso.

---

## 4. Spec tentativo de los 4 dashboards

(Derivado de las 14 categorías de queries que el usuario pidió. Sin diseño visual — solo qué KPI debe mostrar cada dashboard.)

### 4.1 BA Dashboard (`/ba/performance`)

**Foco**: desempeño personal del BA.

- KPIs principales: ventas del mes, transacciones, ticket promedio, nuevas clientas, follow-ups enviados.
- Conversiones: reco→compra, sample→compra, follow-up→revisita.
- Ranking dentro del counter (su tienda + su marca).
- Promedios del counter (para comparación silenciosa).
- Sparkline de ventas últimos 30 días.
- Próximos eventos (cumpleaños / aniversarios / reposiciones).
- Pendientes de follow-up.
- Top clientas.
- Agenda hoy + próximos 7 días.

### 4.2 Gerente Dashboard (`/gerente`)

**Foco**: tienda completa (ambas marcas).

- KPIs agregados de la tienda.
- Métricas por marca dentro de la tienda (Lancôme vs YSL).
- Ranking de BAs del counter (4 BAs por tienda).
- Top productos vendidos en la tienda.
- Ventas por categoría.
- Métricas de agenda (citas nuevas / reagendadas / canceladas).
- Alertas operacionales: BAs bajo cuota, clientas en riesgo, consentimientos vencidos.

### 4.3 Supervisor Dashboard (`/supervisor`)

**Foco**: zona (múltiples tiendas).

- KPIs agregados de la zona.
- Ranking de tiendas (comparar Polanco vs Santa Fe, p. ej.).
- Ranking de BAs cross-store.
- Métricas por marca a nivel zona.
- Tendencias de período (vs período anterior).
- Alertas operacionales agregadas.

### 4.4 Admin Dashboard (`/admin`)

**Foco**: nacional.

- KPIs globales (todas las tiendas, todas las marcas).
- Ventas por marca (Lancôme vs YSL país completo).
- Ventas por tienda (las 3).
- Top productos / categorías nacionales.
- Tendencias YoY (cuando F4 traiga histórico).
- Alertas críticas: derecho al olvido pendiente, integraciones caídas, etc.

---

## 5. Lo que falta hacer en Etapa 1

### 5.1 Fase 0 — Prerequisitos (~30 min)

- [ ] Agregar `storeId: StoreId` a `types/interaction.ts`
- [ ] Agregar `storeId: StoreId` + `brand: BrandId` a `types/sample.ts`
- [ ] Agregar `list({brands, storeIds, from, to}): Promise<Interaction[]>` a `interactionRepository`
- [ ] Agregar `storeIds?` filter a `sampleRepository.list()`
- [ ] Actualizar seeds (3 interactions + 1 sample) con los nuevos campos
- [ ] Bump persistent cache keys a `.v4` en los repos modificados
- [ ] Fix bug B: reescribir el SEED de `followup-task.repository.ts` con `BA_DEMO` válido (e.g. `us-ba-pol-lcm-1`) y `clientId`s que existen en el seed actual (`cl-constanza`, `cl-ofelia`, etc.)
- [ ] Correr `pnpm typecheck` + `pnpm test` para asegurar que la Fase 0 no rompió nada existente

### 5.2 Fase 1 — Queries + helpers + tests

Crear estructura:
```
features/dashboards/
└── server/
    ├── errors.ts                         ← RoleNotPermittedError
    ├── types.ts                          ← DashboardFilters
    ├── utils/
    │   ├── date-ranges.ts                ← thisMonth(), last7Days(), comparablePeriod()
    │   ├── period-comparison.ts          ← comparePeriods(current, previous)
    │   └── scope-merge.ts                ← mergeScope(staff, filters): { storeIds, brands }
    └── queries/
        ├── get-sales-amount.ts
        ├── get-transactions-count.ts
        ├── get-new-clients-count.ts
        ├── get-follow-ups-count.ts
        ├── get-average-ticket.ts
        ├── get-reco-to-purchase-rate.ts
        ├── get-sample-to-purchase-rate.ts
        ├── get-followup-to-revisit-rate.ts
        ├── get-repurchase-rate.ts
        ├── get-active-clients.ts
        ├── get-at-risk-clients.ts
        ├── get-ba-ranking-in-counter.ts
        ├── get-counter-averages.ts
        ├── get-sparkline-data.ts
        ├── get-period-delta.ts
        ├── get-upcoming-birthdays.ts
        ├── get-upcoming-anniversaries.ts
        ├── get-estimated-replenishments.ts
        ├── get-pending-followups.ts
        ├── get-top-clients.ts
        ├── get-today-appointments.ts
        ├── get-upcoming-appointments.ts
        ├── get-appointment-metrics.ts
        ├── get-top-products.ts
        ├── get-sales-by-category.ts
        ├── get-ba-ranking.ts
        ├── get-store-ranking.ts
        ├── get-sales-by-brand.ts
        └── get-operational-alerts.ts
```

≈ 29 queries + 3 utils + 1 errors.ts + 1 types.ts.

### 5.3 Tests obligatorios por query

- **Happy path** con datos del seed actual.
- **Scope test**: BA Lancôme Polanco no ve datos de YSL ni de otras tiendas.
- **Scope merge test**: si un Gerente filtra por BA de otra tienda → intersección vacía → `[]`.
- **Período test**: filtros de fechas correctos (inclusión/exclusión en bordes).
- **Cálculo test**: con dataset controlado, el número que devuelve es el esperado.
- **Role-permission test** (cuando aplique): BA llamando a `getStoreRanking` debe throw `RoleNotPermittedError`.

### 5.4 Cierre

- [ ] `pnpm typecheck` verde
- [ ] `pnpm test` verde
- [ ] Commit con mensaje: `feat: infraestructura de queries para dashboards (KPIs, rankings, tendencias, alertas)`
- [ ] Push a GitHub
- [ ] Reportar resumen al usuario: cantidad de queries, cantidad de tests, cobertura

---

## 6. Bugs detectados pero NO arreglados

### Bug A — `product.repository.ts` con storeIds obsoletos (NO arreglar en Etapa 1)

```ts
// apps/web/src/server/repositories/product.repository.ts (líneas 5-7)
const ST_POLANCO = "st-polanco" as StoreId;       // ❌ ya no existe; debería ser "st-pol"
const ST_SANTA_FE = "st-santa-fe" as StoreId;     // ❌ ahora "st-stf"
const ST_PALACIO = "st-palacio-polanco" as StoreId; // ❌ ahora "st-per" o "st-stf"
```

Toda la propiedad `stock` de los productos usa estas keys obsoletas, por lo que el catálogo muestra "sin stock" en cualquier tienda real. RF-17 roto silenciosamente.

**Plan**: fix en un commit aparte después de Etapa 1. ~10 min.

### Bug B — `followup-task.repository.ts` con clientIds + baId obsoletos (arreglar en Fase 0)

```ts
// apps/web/src/server/repositories/followup-task.repository.ts (línea 13)
const BA_DEMO = "demo-ba" as StaffId;             // ❌ no existe usuario con este id

// y los SEEDs referencian (líneas ~30-90):
clientId: "cl-andrea" | "cl-valentina" | "cl-renata"  // ❌ todos renombrados
```

**Síntoma actual**: pending tasks aparecen con cliente "—" en la UI; getPendingFollowUps daría resultados incorrectos.

**Plan**: parte de Fase 0 de Etapa 1.

---

## 7. Estructura técnica clave

### 7.1 Repos disponibles

Ubicación: `apps/web/src/server/repositories/`

| Repo | Métodos relevantes | Notas |
|---|---|---|
| `clientRepository` | `findById`, `list({query, brand, brands, storeIds})`, `create`, `patchStats` | scope brand + store ✅ |
| `purchaseRepository` | `findById`, `list({brands, storeIds, query})`, `listByClient`, `create` | scope ✅ |
| `appointmentRepository` | `findById`, `list({baId, from, to, brands, storeIds})`, `listByClient`, `create`, `patch` | scope + date range ✅ |
| `recommendationRepository` | `findById`, `list({brands, storeIds})`, `listByClient`, `create`, `patch` | scope ✅ |
| `communicationRepository` | `list({brands, storeIds, channel})`, `listByClient`, `create` | scope ✅ |
| `sampleRepository` | `list({brands})`, `listByClient`, `listInventory`, `create` | **falta storeIds + storeId/brand en tipo** |
| `interactionRepository` | `listByClient`, `create` | **falta list() + storeId en tipo** |
| `followupTaskRepository` | `listByBA`, `listByClient`, `create`, `complete`, `cancel` | **seed roto** (Bug B) |
| `userRepository` | `list`, `findById`, `findFirstByRole` | scope-aware via `userToStaff` |
| `storeRepository` | `list`, `findById` | sin filtros |
| `productRepository` | `list({brands})`, `findBySku` | **stock keys rotas** (Bug A) |
| `templateRepository` | `list({brands, channel, category})` | scope brand ✅ |

### 7.2 Helpers existentes a reusar

| Helper | Ubicación | Para qué |
|---|---|---|
| `storeScopeFor(staff)` | `server/auth/scope.ts` | Devuelve `readonly StoreId[] \| undefined` |
| `brandScopeFor(staff)` | `server/auth/scope.ts` | Devuelve `readonly BrandId[] \| undefined` |
| `isStoreInScope(staff, storeId)` | `server/auth/scope.ts` | Predicate para guards |
| `isBrandInScope(staff, brand)` | `server/auth/scope.ts` | Predicate para guards |
| `homeStoreFor(staff)` | `server/auth/scope.ts` | Stamp para create-* actions |
| `homeBrandFor(staff)` | `server/auth/scope.ts` | Stamp para create-* actions |
| `startOfDay`, `addDays`, `addMonths`, `startOfMonth`, `endOfMonth`, `isoWeekNumber`, `daysBetween`, `isSameDay`, `startOfIsoWeek` | `lib/date/week.ts` | Primitivos de fecha — bien tested |
| `formatCurrency`, `formatDate` | `lib/format/` | UI helpers (no necesarios en queries) |
| `generateId(prefix)` | `lib/id/generate-id.ts` | Para crear entidades |

### 7.3 Patrón de query (template)

```ts
// features/dashboards/server/queries/get-sales-amount.ts
import "server-only";
import type { Staff } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

export async function getSalesAmount(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands } = mergeScope(staff, filters);
  const purchases = await purchaseRepository.list({ storeIds, brands });
  const inPeriod = purchases.filter((p) => {
    const at = new Date(p.at);
    return at >= filters.period.from && at <= filters.period.to;
  });
  return inPeriod.reduce((sum, p) => sum + p.total, 0);
}
```

### 7.4 Tipos compartidos esperados

```ts
// features/dashboards/server/types.ts
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

export type DashboardFilters = {
  period: { from: Date; to: Date };
  storeIds?: readonly StoreId[];
  brands?: readonly BrandId[];
  baId?: StaffId;
};
```

### 7.5 Error class

```ts
// features/dashboards/server/errors.ts
export class RoleNotPermittedError extends Error {
  constructor(roleAttempted: string, queryName: string) {
    super(`Role ${roleAttempted} cannot call query ${queryName}`);
    this.name = "RoleNotPermittedError";
  }
}
```

---

## 8. Próximos pasos en orden

1. **Leer este documento de cabo a rabo** y los 2 docs referenciados ([requerimientos.md](requerimientos.md), [analisis-brechas.md](analisis-brechas.md)).
2. **Verificar working tree limpio** con `git status` (si no, parar y averiguar qué quedó pendiente).
3. **Fase 0 — Prerequisitos**:
   1. Modificar `types/interaction.ts` agregando `storeId: StoreId`.
   2. Modificar `types/sample.ts` agregando `storeId: StoreId` + `brand: BrandId`.
   3. Agregar `interactionRepository.list({brands?, storeIds?, from?, to?})`.
   4. Agregar `storeIds?` filter a `sampleRepository.list()`.
   5. Actualizar seeds (interacciones, samples) con los nuevos campos.
   6. Fix Bug B: reemplazar `BA_DEMO` y los clientIds obsoletos en `followup-task.repository.ts`.
   7. Bump cache keys a `.v4`.
   8. Correr `pnpm typecheck` + `pnpm test` → todo verde.
4. **Fase 1 — Queries**:
   1. Crear `features/dashboards/server/{types,errors}.ts`.
   2. Crear los 3 utils (`date-ranges`, `period-comparison`, `scope-merge`).
   3. Implementar las 29 queries (orden sugerido en el spec original del usuario).
   4. Para cada query, escribir tests (happy + scope + scope-merge + período + cálculo).
5. **`pnpm typecheck` + `pnpm test`** verdes (el agente humano-equivalente debe iterar hasta verde, no quedarse en parcial).
6. **Commit + push** con el mensaje exacto: `feat: infraestructura de queries para dashboards (KPIs, rankings, tendencias, alertas)`.
7. **Reportar resumen al usuario**: cantidad de queries, cantidad de tests, decisiones que requirieron interpretación, cualquier gap nuevo encontrado.

---

## 9. Notas importantes para la siguiente sesión

- **No tocar UI** (componentes de dashboards) en Etapa 1. Solo lógica + tests. La Etapa 2 conectará UI.
- **Mantener el patrón de scope simétrico**: cada query recibe `(staff, filters)` y aplica `mergeScope` que interseca staff-scope con filter-overrides.
- **Cuando una intersección sea vacía → return `[]`** (no throw).
- **Cuando un rol no aplica a una query → throw `RoleNotPermittedError`** (ej: BA llamando `getStoreRanking`).
- **Bump de cache keys**: cualquier cambio en seeds o schema de entidades requiere subir las keys de `_persist` a la siguiente versión (`.v4` después de Fase 0).
- **El dev server puede estar corriendo** con cache vieja en memoria — apagar y reiniciar `pnpm dev` después de Fase 0 para que cargue seeds nuevos.
- **Si encuentras nuevos gaps en el seed** durante la implementación de queries, documentarlos en este handover (o en un nuevo handover si la sesión cierra antes de Etapa 1 terminado).
- **La sesión anterior usó la cuenta Isavaldezz**; el repo es `emilianoalv/clienteling-ipad`. Ya hay credenciales `gh` configuradas en `~/.gh-config/`, no requiere re-auth.

---

_Generado al cierre de la sesión 2026-05-17 después del commit `31f6d23`._
