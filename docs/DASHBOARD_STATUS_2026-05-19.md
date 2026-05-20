# Dashboard Status Report — 2026-05-19

> **Propósito**: status report para retomar el rediseño de dashboards tras pérdida de contexto.
> **Branch**: `main` · sincronizada con `origin/main` · working tree limpio.
> **Tests**: 387/387 verdes · `pnpm typecheck` limpio.

---

## 1. ANÁLISIS DE BRECHAS

**Archivo localizado**: [`docs/analisis-brechas.md`](docs/analisis-brechas.md) (238 líneas; actualizado 2026-05-17 tras commit `bea2396`).

**No existen** archivos con nombres `gap_analysis`, `requirements`, `brecha`, `REQUIREMENTS`. El doc oficial es `analisis-brechas.md`. Hay también `docs/requerimientos.md` (transcripción del PDF del RFP).

### Estado por RF de dashboards/reportes (RF-40 a RF-50)

| RF | Tema | Estado código | Marca |
|----|------|---|---|
| **RF-40** | Dashboard ejecutivo tienda con KPIs | ⚠️ UI existe, datos hardcoded | **IN PROGRESS** |
| **RF-41** | Métricas de citas (objetivo, total, nuevas, reagendadas) | ⚠️ ManagementPanel real; "objetivo semanal" falta | **IN PROGRESS** |
| **RF-42** | Reportes filtrables (fechas, tienda, marca, BA) | ⚠️ ScopePills decorativas sin state/onChange | **IN PROGRESS** |
| **RF-43** | Reporte de clientes exportable con columnas específicas | ⚠️ Botón "Exportar" sin onClick; faltan columnas | **IN PROGRESS** |
| **RF-44** | Top marcas y ventas por categoría (gráficos) | ⚠️ SplitBar + BarChart renderizan; datos hardcoded | **IN PROGRESS** |
| **RF-45** | Reporte de desempeño por BA | ⚠️ `BA_RANKING` array literal; sin export | **IN PROGRESS** |
| **RF-46** | Reporte de agenda exportable | ⚠️ Datos en pantalla; botón "Descargar" sin handler | **IN PROGRESS** |
| **RF-47** | Conversión (rec→compra, seguimiento→revisita) | ⚠️ Literales "58%", "41%"; queries reales existen pero desconectadas | **IN PROGRESS** |
| **RF-48** | Dashboard de retención (activos vs en riesgo) | ⚠️ KPIs literales; `segmentClient` real en client-list | **IN PROGRESS** |
| **RF-49** | Exportación Excel/CSV | ❌ 0 handlers; sin librería xlsx/csv | **PENDING** |
| **RF-50** | Acceso desde móvil + escritorio | 🤔 No verificado en mobile real | **PENDING** |

### Estado por RF de roles y permisos (RF-51 a RF-55)

| RF | Tema | Estado código | Marca |
|----|------|---|---|
| **RF-51** | 4 roles diferenciados (BA, Gerente, Supervisor, Admin) | ✅ Alineado al BRD post-`bea2396`; HQ eliminado | **DONE** |
| **RF-52** | BA solo ve clientes de su tienda + marca | ✅ Single-brand, scope dual store+brand, 31 tests | **DONE** |
| **RF-53** | Gerente ve toda su tienda (ambas marcas) | ✅ `storeScopeFor(gerente) = [storeId]`, brands undefined | **DONE** |
| **RF-54** | Supervisor ve múltiples tiendas | ✅ `storeIds: [Polanco, Santa Fe]` (Perisur fuera) | **DONE** |
| **RF-55** | Admin global (configuraciones, marcas, tiendas, usuarios) | ✅ Scope undefined; **deuda menor**: CRUDs sin onClick | **DONE** (scope) / **IN PROGRESS** (CRUDs) |

### Cobertura global

| Categoría | RFs (61) | RNFs (16) | Total (77) | % |
|---|---:|---:|---:|---:|
| ✅ DONE | 33 | 3 | 36 | **47%** |
| ⚠️ IN PROGRESS | 23 | 7 | 30 | **39%** |
| ❌ PENDING | 4 | 1 | 5 | **6%** |
| 🤔 No verificable | 1 | 5 | 6 | **8%** |

---

## 2. INVENTARIO DE ARCHIVOS DE DASHBOARDS

### 2.1 Backend (queries + utils + tipos)

**Carpeta**: `apps/web/src/features/dashboards/server/` — 77 archivos totales.

| Tipo | Conteo |
|---|---:|
| Queries (`.ts`) | 30 |
| Tests de queries (`.test.ts`) | 28 |
| Utils + types + errors | 7 |
| Test fixtures | 1 |

**Líneas de código clave** (timestamps de creación 2026-05-17 a 2026-05-18):

| Archivo | Líneas | Última mod. |
|---|---:|---|
| `features/dashboards/server/types.ts` | 44 | 2026-05-17 |
| `features/dashboards/server/errors.ts` | 16 | 2026-05-17 |
| `features/dashboards/server/utils/scope-merge.ts` | 52 | 2026-05-17 |
| `features/dashboards/server/utils/date-ranges.ts` | 68 | 2026-05-17 |
| `features/dashboards/server/utils/period-comparison.ts` | 31 | 2026-05-17 |
| `features/dashboards/server/utils/category-mapping.ts` | 42 | 2026-05-17 |
| `features/dashboards/server/queries/get-operational-alerts.ts` | 221 | 2026-05-18 |
| `features/dashboards/server/queries/get-counter-averages.ts` | 185 | 2026-05-17 |
| `features/dashboards/server/queries/get-sparkline-data.ts` | 157 | 2026-05-18 |
| `features/dashboards/server/queries/get-sales-by-brand.ts` | 137 | 2026-05-18 |
| `features/dashboards/server/queries/get-estimated-replenishments.ts` | 125 | 2026-05-17 |
| ... (otras 25 queries) | 25–106 c/u | 2026-05-17 |

### 2.2 UI de dashboards (componentes visuales)

**Carpeta**: `apps/web/src/features/dashboards/components/` — todas modificadas **2026-05-15** (antes del trabajo de queries).

| Archivo | Líneas | Última mod. |
|---|---:|---|
| `_shared/dash-block.tsx` | 42 | 2026-05-15 |
| `_shared/dash-header.tsx` | 62 | 2026-05-15 |
| `_shared/dash-kpi.tsx` | 112 | 2026-05-15 |
| `ba-dashboard.tsx` | 191 | 2026-05-15 |
| `manager-dashboard.tsx` | 167 | 2026-05-15 |
| `supervisor-dashboard.tsx` | 364 | 2026-05-15 |

**🚨 Brecha clara**: 3 días entre el último cambio de UI (15-may) y el primer cambio de queries (17-may). **Los componentes UI NO han sido actualizados desde que se creó el backend**.

### 2.3 Admin (único con datos reales)

**Carpeta**: `apps/web/src/features/admin/components/`

| Archivo | Líneas | Última mod. |
|---|---:|---|
| `admin-home.tsx` | 134 | 2026-05-17 |
| `audit-log.tsx` | 49 | 2026-05-15 |
| `users-screen.tsx` | 51 | 2026-05-15 |
| `integrations-screen.tsx` | 59 | 2026-05-15 |
| `segments-screen.tsx` | 94 | 2026-05-15 |

### 2.4 Páginas (rutas Next.js)

| Ruta | Líneas | Última mod. |
|---|---:|---|
| `app/(app)/ba/performance/page.tsx` | 11 | 2026-05-15 |
| `app/(app)/gerente/page.tsx` | 11 | 2026-05-17 |
| `app/(app)/supervisor/page.tsx` | 7 | 2026-05-15 |
| `app/(app)/admin/page.tsx` | 30 | 2026-05-15 |

---

### 2.5 Detalle por dashboard

#### BA — "Mi desempeño"

- **a) ¿Existe?** ✅ Sí · [`ba-dashboard.tsx`](apps/web/src/features/dashboards/components/ba-dashboard.tsx) (191 líneas, 2026-05-15)
- **b) KPIs/cards/charts actuales** (3 DashBlocks):
  - *Impacto de negocio*: Ventas mes, Ventas trimestre, % vs objetivo, Ticket promedio, Conversión recomendación → compra, Clientes nuevos, Recompra 90 días
  - *Gestión de cartera*: Clientes activos, En riesgo, Seguimientos hoy, Citas semana, Eventos, Muestras conversión
  - *Adopción*: Perfiles semana (con BarChart), Completitud perfil, Días consecutivos, Ranking adopción (bar chart sin labels)
- **c) Librería de gráficos**: **propia / SVG inline** (`components/charts/bar-chart.tsx`, etc.). **NO usa Recharts, Chart.js, D3, Victory ni Tremor** (verificado en `package.json`).
- **d) TODOs/FIXMEs**: línea 18 → `// Numbers are hardcoded prototype values; F4 will wire them to a real KPI service`
- **e) Origen de datos**: 🔴 **constantes locales hardcoded** (`const RANKING_BARS = [95, 92, ...]`, `MY_POSITION = 3`, literales `486_200`, `1_264_000`, etc.). **NO** lee de queries, repos, contexto global, CSV ni SQLite.

#### Gerente de Tienda — "Mi tienda"

- **a) ¿Existe?** ✅ Sí · [`manager-dashboard.tsx`](apps/web/src/features/dashboards/components/manager-dashboard.tsx) (167 líneas, 2026-05-15)
- **b) KPIs/cards/charts actuales** (4 DashBlocks):
  - *Performance*: Ventas MTD, QTD, YTD, % vs objetivo, Ticket promedio, Ventas clienteling, SplitBar Lancôme vs YSL (60/40), highlight "Lift clienteling +38%"
  - *Equipo*: Ranking BAs (lista con 6 BAs), Adopción equipo, BAs inactivos, Perfiles nuevos, Calidad perfiles
  - *Clientes*: Activos, En riesgo, VIP (top 20%), Retención 12m, NPS
  - *Operación*: Citas, No-show, Seguimientos, Eventos
- **c) Librería de gráficos**: **propia / SVG inline** (SplitBar, BarChart custom)
- **d) TODOs/FIXMEs**: ninguno explícito en el archivo (pero el patrón hardcoded es evidente)
- **e) Origen de datos**: 🔴 **constantes locales hardcoded** (`const BA_RANKING = [{name: "Valentina R.", sales: 486_200, pct: 108}, ...]`). Sin conexión a backend.

#### Supervisor de Zona — "Mis tiendas"

- **a) ¿Existe?** ✅ Sí · [`supervisor-dashboard.tsx`](apps/web/src/features/dashboards/components/supervisor-dashboard.tsx) (364 líneas, 2026-05-15)
- **b) KPIs/cards/charts actuales** (5 DashBlocks):
  - *Overview*: Ventas, % objetivo, Growth YoY, Adopción, Clientes activos
  - *Semáforo de tiendas*: tabla de 5 tiendas con StatusLight (verde/amarillo/rojo), columnas Tienda/Estado/Ventas/% obj/YoY/Adopción/Acción
  - *Ranking*: RankCard Top/Bottom Ventas, RankCard Top/Bottom Adopción, ScatterPlot (adopción vs ventas), error box desviación
  - *Operación*: % iPads activos, Tickets abiertos, Tiempo resolución, Categorías tickets
  - *Tendencias*: 4 gráficos — 3 LineCharts (Ventas zona 12 sem, Adopción zona 12 sem, Liverpool vs Palacio) + Heatmap México (12 regiones)
- **c) Librería de gráficos**: **propia / SVG inline** (`LineChart`, `ScatterPlot`, `Heatmap`, `StatusLight`)
- **d) TODOs/FIXMEs**: ninguno explícito
- **e) Origen de datos**: 🔴 **constantes locales hardcoded** (`const STORES = [{id, label, sales, pct, yoy, ...}, ...]` con 5 tiendas literales, `TREND_WEEKS`, etc.)

#### Administrador Central — "Gobernanza del sistema"

- **a) ¿Existe?** ✅ Sí · [`admin-home.tsx`](apps/web/src/features/admin/components/admin-home.tsx) (134 líneas, 2026-05-17)
- **b) KPIs/cards/charts actuales** (Grid 3 cols + hero + footer):
  - Hero card "Admin Central · L'Oréal Luxe México · Gobernanza del sistema"
  - Card *Usuarios & roles*: conteo total + lista de los 5 primeros con role chip + botón "Crear usuario"
  - Card *Permisos por rol*: lista de 4 roles (BA/Gerente/Supervisor/Admin) con sus scopes
  - Card *Catálogo · gobernanza*: SKUs Lancôme, SKUs YSL, plantillas seguimiento, aviso de privacidad (v2026.03)
  - `<AuditLog>` con últimos 4 eventos
- **c) Librería de gráficos**: ninguna (no usa gráficos; es card-based)
- **d) TODOs/FIXMEs**: ninguno
- **e) Origen de datos**: 🟢 **REALES** — page.tsx hace `Promise.all([listUsers(), listProducts({}), templateRepository.list(), listAuditEvents(), storeRepository.list()])` y pasa los resultados como props.

#### Bonus: BA "Hoy" (no es dashboard de KPIs pero comparte ruta)

- **Ruta**: [`app/(app)/ba/page.tsx`](apps/web/src/app/(app)/ba/page.tsx) → renderiza `BaTodayScreen`
- **Componente**: `features/home/components/ba-today-screen.tsx`
- **Origen de datos**: **híbrido** — `getBaDaySnapshot(staff)` real para pendientes y agenda; meta del mes (`monthGoalPct = 72`, `monthGoalAmount = 1_184_020`) hardcoded
- **TODO**: línea 19 → `// KPIs (pendientes, meta) remain prototype-frozen until F4`

---

## 3. GIT LOG RELEVANTE

### 3.1 Últimos 30 commits (todos)

```
218c132 feat: infraestructura de queries para dashboards (Fase 0 prep + 30 queries + helpers + tests)
4da8f51 feat: agrega storeId a Interaction y storeId+brand a Sample (Fase 0 prep dashboards)
c53c79a fix: actualiza ids obsoletos en followup-task seed (post-refactor bea2396)
68f273c docs: handover para siguiente sesión - estado pre-etapa1 dashboards
31f6d23 docs: actualiza análisis de brechas tras refactor de roles y scope por marca
bea2396 refactor: alinea roles al BRD (renombra Gerente, elimina HQ, scope por marca para BA, brand en Recommendation)
cb8fbc5 docs: análisis de brechas vs requerimientos funcionales del RFP
1162aa2 feat: scope multi-tienda completo (RF-52, RF-53, RF-54, RNF-14)
03270c1 Merge branch 'main' of https://github.com/emilianoalv/clienteling-ipad
4ca66f1 docs: agrega transcripción estructurada de requerimientos
4b507f8 docs: agrega PDF fuente de requerimientos del RFP
0232fb5 feat(home): Pendientes del Hoy con FollowupTasks reales
d74a48b feat(sale): seguimiento opcional al final del form de venta
1192e94 refactor(followup): tabs Tareas + Comunicaciones en /ba/followup
dc8954f chore(profile): quitar Dar muestra del action strip + wiring Seguimiento
4caf2e9 feat(profile): tareas de seguimiento — side card + tab + actions
a2b5766 feat(visit): rediseño con disclosure (muestra + recomendación + seguimiento)
72f3a66 feat(sale): motivo de visita arriba del form de venta
5a5bb0c feat(services): scoreProductCompatibility + rankProductsForClient
e6e39eb feat(server): followupTaskRepository with persistent seed
46f75f3 feat(types): VisitMotive + FollowupTask + Interaction.motive
97d9190 feat: historial de compras con detalle por ticket
be8d211 feat: rediseñar pantalla de registro de venta (banner + hora + textarea + side panel POS)
faa314c fix: uniformar estilo del botón Recomendar en perfil de cliente
7d18cef feat: Incluir el año en la fecha del hero de Hoy
8363c37 chore: initial commit — F3 complete + F3.11 QA sprint
```

### 3.2 Filtrados a dashboards / KPIs / charts / redesign

| Hash | Fecha | Mensaje | Archivos tocados (resumen) |
|---|---|---|---|
| `218c132` | 2026-05-18 | feat: infraestructura de queries para dashboards (Fase 0 prep + 30 queries + helpers + tests) | **77 files / +6,052 líneas** — backend completo: 30 queries en `features/dashboards/server/queries/`, 4 utils, errors.ts, fixtures, 28 test files. **No tocó UI**. |
| `bea2396` | 2026-05-17 | refactor: alinea roles al BRD (renombra Gerente, elimina HQ, scope por marca para BA, brand en Recommendation) | Rename `app/(app)/manager/` → `app/(app)/gerente/`; eliminó `app/(app)/hq/`. **Tocó `manager-dashboard.tsx` solo cosméticamente** (no datos). |
| `1162aa2` | 2026-05-16 | feat: scope multi-tienda completo (RF-52, RF-53, RF-54, RNF-14) | Agregó `storeId` a 5 entidades + `storeScopeFor()` + 31 tests. **No tocó componentes de dashboards directamente**, sí preparó el sustrato de scope. |
| `8363c37` | 2026-05-15 | chore: initial commit — F3 complete + F3.11 QA sprint | **Creó los componentes UI iniciales** de los 3 dashboards (BA, Manager, Supervisor) — siguen siendo los actuales. |

**📊 Resultado clave del git log**: solo 4 commits han tocado archivos de dashboards. **Ningún commit posterior al `8363c37` (initial)** ha modificado el contenido funcional de `ba-dashboard.tsx`, `manager-dashboard.tsx`, `supervisor-dashboard.tsx`. El trabajo del 17–18 de mayo fue **100% backend** (queries + tests) sin conectarlo a UI.

### 3.3 ¿Hay artefactos del "mini-proyecto de rediseño"?

❌ **No encontré ningún commit con "redesign", "redesign dashboards", "ui dashboards", "filter bar", "period picker"** en los últimos 30 commits. Tampoco ningún doc nuevo en `docs/` describiendo nueva estructura visual. El último handover ([`docs/handover-etapa1.md`](docs/handover-etapa1.md), 2026-05-17, commit `68f273c`) define **spec tentativo de qué KPIs van por dashboard**, no un rediseño visual.

---

## 4. RUTAS Y NAVEGACIÓN

### 4.1 Routing hacia cada dashboard

Next.js 15 App Router con grupo `(app)`:

| Rol | Ruta | Componente renderizado |
|---|---|---|
| BA | `/ba/performance` | `BaDashboard` |
| BA (home) | `/ba` | `BaTodayScreen` (no es KPI-dashboard, es operativo) |
| Gerente | `/gerente` | `ManagerDashboard` |
| Supervisor | `/supervisor` | `SupervisorDashboard` |
| Admin | `/admin` | `AdminHome` |

### 4.2 Control de acceso por rol (RF-52 a RF-55)

✅ **Implementado** en 3 capas defensivas:

#### Capa 1 — Middleware ([`apps/web/src/middleware.ts`](apps/web/src/middleware.ts))

```typescript
// 4. Role gate by URL prefix (/ba, /gerente, /supervisor, /admin)
const segment = pathname.split("/").filter(Boolean)[0];
if (segment && ["ba", "gerente", "supervisor", "admin"].includes(segment)) {
  if (!canAccessRolePrefix(session.role, segment)) {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }
}
```

Si BA intenta entrar a `/admin`, es redirigido a `homeFor("BA") = "/ba"`. Admin pasa cualquier prefijo (`canAccessRolePrefix` lo permite).

#### Capa 2 — RBAC declarativo ([`apps/web/src/config/rbac.ts`](apps/web/src/config/rbac.ts))

`Permission` con 19 acciones granulares. `ROLE_PERMISSIONS` mapea cada rol a un `Set<Permission>`:

| Rol | Permisos | Notable |
|---|---:|---|
| BA | 11 | sin `reports:read`, sin `devices:write`, sin `users:write` |
| Gerente | 15 | tiene `reports:read`, `devices:read/write` |
| Supervisor | 9 | scope read-mostly (no `purchases:write`, sí `reports:read`) |
| Admin | 19 (todos) | `users:write`, `integrations:write`, `stores:write`, `admin:read` |

`can(role, permission)` se llama en server actions para gating fino.

#### Capa 3 — Scope dual store+brand ([`apps/web/src/server/auth/scope.ts`](apps/web/src/server/auth/scope.ts))

`storeScopeFor(staff)` y `brandScopeFor(staff)` retornan `readonly StoreId[] | undefined` y `readonly BrandId[] | undefined`. Los repos los aplican como filtros; `undefined` = sin restricción (Admin).

**31 tests en [`apps/web/src/server/auth/scope.test.ts`](apps/web/src/server/auth/scope.test.ts)** verifican que:
- BA Polanco LCM ve solo clientas POL × LCM (excluye YSL Polanco y todo Perisur/Santa Fe)
- Gerente Polanco ve las 5 clientas POL (ambas marcas)
- Supervisor zona Centro ve Polanco + Santa Fe, **excluido de Perisur** (caso intencional)
- Admin ve las 15 clientas, 16 compras, 12 citas nacionales

**Conclusión RF-52 a RF-55**: ✅ **DONE**. Multi-capa, testeado, robusto.

---

## 5. RESUMEN EJECUTIVO

### Tabla de estado por dashboard

| Dashboard | Estado | KPIs actuales | Pendientes detectados |
|-----------|--------|---------------|------------------------|
| **BA** | 🔴 IN PROGRESS (UI vieja, datos hardcoded) | 3 DashBlocks: Impacto negocio (7 KPIs), Gestión cartera (6 KPIs), Adopción (3 KPIs + ranking bar) | Conectar a queries reales (`getSalesAmount`, `getBaRankingInCounter`, `getCounterAverages`, etc.); reemplazar 14 literales; agregar filtros funcionales |
| **Gerente** | 🔴 IN PROGRESS (UI vieja, datos hardcoded) | 4 DashBlocks: Performance, Equipo, Clientes, Operación. SplitBar Lancôme/YSL, ranking de 6 BAs literal | Conectar `getSalesByBrand`, `getBaRanking`, `getOperationalAlerts`, `getAtRiskClients`; reemplazar `BA_RANKING` literal |
| **Supervisor** | 🔴 IN PROGRESS (UI vieja, datos hardcoded) | 5 DashBlocks: Overview, Semáforo tiendas, Ranking, Operación, Tendencias. Tabla 5 tiendas + 3 LineCharts + Heatmap | Conectar `getStoreRanking`, `getSparklineData`, `getOperationalAlerts`; eliminar `STORES` array literal de 5 tiendas (no coincide con seed real de 3 tiendas) |
| **Admin** | 🟢 PARCIALMENTE DONE | Hero + 3 Cards (Usuarios, Permisos, Catálogo) + AuditLog. Conteos reales | Cablear botones CRUD ("Crear usuario", "Nueva plantilla", "Actualizar catálogo") sin onClick; agregar KPIs derivados nacionales |

### Estado consolidado del trabajo

#### ✅ DONE

- **Backend de queries**: 30 queries implementadas, tipadas, con 293 tests verdes (`features/dashboards/server/queries/`)
- **Infraestructura**: `types.ts` (DashboardFilters, MergedScope con isEmpty defensivo), `errors.ts` (RoleNotPermittedError), 4 utils (`scope-merge`, `date-ranges`, `period-comparison`, `category-mapping`)
- **Scope multi-tienda + multi-marca**: aplicado end-to-end en 5 repos (commits `1162aa2` + `bea2396`), 31 tests dedicados
- **Roles BRD-aligned**: 4 roles (`BA / Gerente / Supervisor / Admin`), HQ eliminado, BA single-brand
- **RBAC declarativo**: 19 permisos granulares, mapping por rol, `can()` y `canAccessRolePrefix()`
- **Middleware de routing**: auth check + role-prefix gate + i18n
- **Admin Dashboard funcional**: único con datos reales (conteos de users, products, templates, audit events)
- **Seeds enriquecidos para tests**: monthlyTarget en BAs/stores, 4 purchases históricas (cohort), 3 followup tasks absolutas, 4 appointments con Escenario A
- **Documentación**: `analisis-brechas.md`, `requerimientos.md`, `handover-etapa1.md` actualizados

#### 🟡 IN PROGRESS (archivos específicos)

- [`apps/web/src/features/dashboards/components/ba-dashboard.tsx`](apps/web/src/features/dashboards/components/ba-dashboard.tsx) — **191 líneas con 14+ literales hardcoded**, sin conexión a queries
- [`apps/web/src/features/dashboards/components/manager-dashboard.tsx`](apps/web/src/features/dashboards/components/manager-dashboard.tsx) — **167 líneas, `BA_RANKING` literal**
- [`apps/web/src/features/dashboards/components/supervisor-dashboard.tsx`](apps/web/src/features/dashboards/components/supervisor-dashboard.tsx) — **364 líneas, `STORES` literal con 5 tiendas (seed real tiene 3)**
- [`apps/web/src/features/dashboards/components/_shared/dash-header.tsx`](apps/web/src/features/dashboards/components/_shared/dash-header.tsx) — ScopePills **decorativos sin state ni onChange**
- [`apps/web/src/app/(app)/ba/performance/page.tsx`](apps/web/src/app/(app)/ba/performance/page.tsx) (11 líneas) y [`gerente/page.tsx`](apps/web/src/app/(app)/gerente/page.tsx), [`supervisor/page.tsx`](apps/web/src/app/(app)/supervisor/page.tsx) — **NO llaman queries, solo renderizan componentes con props mínimas**
- [`apps/web/src/features/dashboards/server/queries/get-operational-alerts.ts`](apps/web/src/features/dashboards/server/queries/get-operational-alerts.ts:194-198) — 2 TODOs `(F4)` para Consent expiry + RtBF (modelos pendientes)
- [`apps/web/src/features/admin/components/admin-home.tsx`](apps/web/src/features/admin/components/admin-home.tsx) — botones "Crear usuario", "Nueva plantilla", "Actualizar catálogo" **sin handlers**

#### 🔴 PENDING

- **RF-49 Exportación Excel/CSV**: 0 handlers, sin librería xlsx/csv en deps
- **RF-50 Verificación mobile real**: ningún test de viewport iPad/responsive
- **RF-33 Videoconsultas**: no existe campo `modality` en Appointment ni integración Zoom/Meet
- **RF-39 Atribución ventas online (link tracking)**: sin campos `source`/`origin` en Purchase
- **RF-59 Shade exacto por categoría**: Client.skin solo tiene `tone` genérico
- **RNF-09 Android 12+**: 0 referencias a Android en repo
- **Componente `<FilterBar>` / `<PeriodPicker>`**: no existe
- **Selector de usuario en runtime**: no hay; cambio de rol requiere logout + login
- **Drill-downs cross-dashboard**: rutas tipo `/gerente/ba/[baId]/detail` no existen
- **Modelos faltantes para alertas críticas**: `Consent.expiresAt` (compliance), modelo RtBF (derecho al olvido) — bloqueado por F4

#### ❓ DUDAS / BLOCKERS (decisiones de diseño que no están claras en el código)

1. **Layout objetivo**: ¿Los 3 dashboards principales (BA/Gerente/Supervisor) mantienen la estructura visual actual de `DashBlock`s, o el "rediseño" propone otra estructura (grid/tabs/widgets)? **No hay artefacto en `docs/` que lo defina**. El último handover solo lista qué KPIs van por dashboard, no cómo se organizan visualmente.

2. **Filtros**: ¿Período seleccionable por el usuario (MTD/QTD/YTD/custom range)? Las queries soportan `DashboardFilters.period` arbitrario, pero la UI no expone selector. **Decisión pendiente**: ¿`searchParams` (RSC) o estado client-side con `useState`?

3. **Inconsistencia Supervisor**: el array `STORES` literal tiene **5 tiendas** ("Liverpool Polanco", "Liverpool Interlomas", "Palacio Polanco", "Palacio Santa Fe", "Liverpool Perisur"), pero el seed real tiene **3 tiendas** ("Liverpool Polanco", "Liverpool Perisur", "Palacio Santa Fe"). ¿Se mantiene la ficción visual de 5 o se ajusta a 3?

4. **`getCounterAverages` vs visualización**: existe la query, pero **¿qué visualización tendrá** en el BA Dashboard? ¿Comparativa lado a lado (mi número vs promedio), barra delta, sparkline overlay? **No hay mock visual**.

5. **Alertas operacionales — UX**: `getOperationalAlerts` retorna entries con `{severity, category, title, description, count, affectedIds, link}`. **¿Dónde se renderizan?** ¿Banner top, tab dedicada "Alertas", drawer lateral, mezcladas en cada DashBlock por categoría?

6. **Charts retro-compatibilidad**: los componentes `LineChart`, `Heatmap`, `ScatterPlot`, `BarChart` actuales reciben datos hardcoded inline. **¿Tienen API estable para recibir datos dinámicos de queries?** Revisar firma de props antes de conectar.

7. **`getSparklineData` para Sparkline**: el componente `<Sparkline>` existe en [`components/charts/sparkline.tsx`](apps/web/src/components/charts/sparkline.tsx). **No verifiqué si su API coincide con el output de `getSparklineData()`** (que devuelve `Array<{date, value}>`). Posible adapter necesario.

8. **Server vs Client Components para filtros**: dashboards actuales son Server Components puros. Si se agregan filtros interactivos (date pickers, dropdowns), **¿se convierte el dashboard a Client Component, o se refactoriza a `<ServerShell>` + `<ClientFilterBar>` con `searchParams` re-fetch?** Patrón ortodoxo Next 15 sugiere lo segundo, pero no hay decisión documentada.

9. **Admin Dashboard scope**: hoy Admin muestra solo gobernanza (usuarios, catálogo, auditoría). **¿Se agregan KPIs nacionales** (ventas totales nacional, top tiendas, top BAs país)? Las queries `getSalesByBrand`, `getStoreRanking`, `getBaRanking` lo permiten — falta UI.

10. **Drill-downs entre dashboards**: ¿clic en un BA del ranking del Gerente abre **drill-down**? ¿Existe ruta `/gerente/ba/[baId]/detail`? **No existe** en el árbol de rutas.

---

## Apéndice — Comandos para reproducir este análisis

```bash
# Tests + typecheck
pnpm test               # 387 tests verdes
pnpm -F @clienteling/web typecheck   # limpio

# Inventario de archivos con timestamps
find apps/web/src/features/dashboards -type f -name "*.ts*" \
  | while read f; do echo "$(wc -l <"$f") | $(stat -f '%Sm' -t '%F %R' "$f") | $f"; done

# Commits que tocan dashboards
git log --oneline --all -- 'apps/web/src/features/dashboards/' 'apps/web/src/features/admin/'

# Verificación de libs de gráficos (no hay)
grep -E '"(recharts|chart\.js|victory|d3|nivo|tremor)"' apps/web/package.json
```

---

_Reporte generado tras lectura exhaustiva del repo. **No se modificó ningún archivo de código**._
