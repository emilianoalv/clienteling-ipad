# Etapa 2 — Resumen ejecutivo

> **Cierre**: 2026-05-25 (Día 10)
> **Stack**: Next.js 15 App Router · TypeScript · Tailwind v4 · React 19 RC · SheetJS
> **Estado**: ENTREGABLE — 4 dashboards conectados, exports operativos, iPad-ready

## Cobertura

- 4 dashboards de producción (BA · Gerente · Supervisor · Admin) **conectados a las 30 queries de Etapa 1**.
- **11 export points** Excel + CSV (RF-43, RF-46, RF-49) respetando filtros + scope dual.
- **iPad responsive** (768 portrait · 1024 landscape) con touch targets ≥40px (RNF-08).
- **533 tests verdes** (+131 vs el inicio de Etapa 2 = 402).
- 0 hardcoded business values en los 4 dashboards.
- `pnpm next build` verde para los 4 routes con bundles ≤ 161 kB First Load JS.

## Componentes producidos (14 nuevos)

**Charts genéricos** (`components/charts/`)
- `<ConversionBar>` — barra horizontal con tick de referencia counter
- `<Donut>` — SVG donut con leyenda
- `<Funnel>` — embudo multi-etapa con % de conversión inter-stage
- `<RankCard>` — ranking top/bottom con badges TOP/BOTTOM (extracción)

**Layout** (`features/dashboards/components/_shared/`)
- `<HeroBlock>` — 1 big + 3 small (responsive 3fr/2fr)

**Filtros**
- `<FilterBar>` — role-aware, drives `searchParams`
- `<PeriodPicker>` — pill dropdown MTD/Último mes/QTD/YTD

**Alertas**
- `<AlertCard>` — primitive severity-bordered
- `<AlertBanner>` — colapsible top-of-dashboard
- `<AlertBadge>` — badge en títulos de sección

**Domain cards** (dashboard-specific)
- `<StoreHealthCard>` — score 0-100 + grade verde/ámbar/rojo
- `<StrategicInsightCard>` — insights nacionales del Admin
- `<ComplianceScoreCard>` — LFPDPPP score (RFP CA-02)
- `<AdoptionTracker>` — % adopción por rol y por tienda

**Drill-downs**
- `<BADrillDownModal>` — modal con KPIs + sparkline 30d + alertas
- `<StoreDrillDownModal>` — paralelo para tiendas

**Exports**
- `<ExportButton>` — dropdown XLSX/CSV con loading state + toast

## Utilities (helpers puros, testables)

`features/dashboards/lib/`
- `adapters.ts` — 6 adapters query→chart (A1/A2/A4/A5/A6 + toMultiSeriesLineData)
- `parse-filters.ts` — `searchParams` → `DashboardFilters`
- `pacing.ts` — pacing text + forecast con simulation
- `counter-averages.ts` — agregación de baRanking por brand
- `coaching-insights.ts` — 3 algoritmos (top growth · low conv · low target)
- `best-practices.ts` — comparativa cross-store ≥15% gap
- `strategic-insights.ts` — 3 algoritmos nacionales (valor · opportunity · brand)
- `store-health.ts` — score 0-100 ponderado 40/20/20/20
- `compliance-score.ts` — LFPDPPP ponderado 30/25/15/15/15
- `adoption-tracker.ts` — agregación activity últimos 7 días

`lib/format/`
- `number.ts` — currency/percent/count compact + full + delta
- `date.ts` — relative/short/long/export/smart

`lib/export/`
- `build-workbook.ts` — SheetJS XLSX + CSV builder con metadata y formato por columna
- `filename.ts` — slug semántico con role + identifier + period

## Cobertura del RFP (CA-XX)

| Criterio | Cobertura | Notas |
|---|---|---|
| **CA-01 Cobertura funcional (30%)** | ✓ | RF-01 a RF-33 visibles via los 4 dashboards |
| **CA-02 Compliance LFPDPPP** | ✓ | Compliance Score en Admin Sec 5 |
| **CA-03 Seguridad técnica (15%)** | ✓ (heredado) | RBAC + scope dual + middleware role-gate |
| **CA-04 IA / personalización (15%)** | ⚠ Parcial | Coaching · Best Practices · Strategic Insights = inteligencia derivada |
| **CA-06 Performance** | ✓ | SSR + paralelización Promise.all por dashboard |
| **CA-07 Dashboards y reportes (10%)** | ✓ | 4 dashboards + drill-downs + FilterBar + AlertBanner + exports |
| **CA-09 TCO 3 años (10%)** | — | Fuera del scope técnico |
| **CA-10 Escalabilidad multi-marca** | ✓ | Scope dual storeIds × brands probado en 4 roles |

## Cobertura por RF (visible en demo)

| RF | Estado | Dónde |
|---|---|---|
| RF-01 a RF-25 (clienteling, perfil, interacciones, recos) | ✓ heredado | Pantallas operativas + reflejadas en dashboards |
| RF-26 a RF-27 (agenda, citas) | ✓ heredado | `/ba/appointments` + agenda exportable |
| **RF-28 Reporte de agenda columnas exactas** | ✓ | `exportAgendaReport` |
| RF-29 a RF-33 (tipos de evento, recordatorios, virtual, etc.) | ✓ parcial | Agenda real + tipos en seed |
| RF-34 a RF-42 (compras, samples, follow-ups) | ✓ heredado | Refleja en Funnel + ventas |
| **RF-43 Reporte de clientes (9 columnas)** | ✓ | `exportClientsReport` |
| RF-44 Top franquicias/marcas + ventas categoría | ✓ | Gerente/Supervisor/Admin Comparativa marcas + Donut |
| RF-45 Desempeño por BA | ✓ | Ranking BAs (Gerente/Supervisor/Admin) + drill-down |
| **RF-46 Reporte de agenda exportable** | ✓ | `exportAgendaReport` |
| RF-47 Tasas de conversión | ✓ | ConversionBar BA + Funnel Gerente+ |
| RF-48 Dashboard retención (activos vs en riesgo) | ✓ | Salud de la cartera section |
| **RF-49 Exportación Excel/CSV** | ✓ | SheetJS XLSX + CSV con BOM UTF-8 |
| **RF-50 Acceso desde móvil/escritorio** | ✓ | Responsive 768/1024 verificado |
| RF-51 a RF-62 (RBAC, integraciones, auditoría) | ✓/⚠ | RBAC heredado · integraciones placeholder en Admin Sec 8 |

## Tech debt registrada para F4

| Item | Ubicación | Descripción |
|---|---|---|
| Consent `expiresAt` | `get-operational-alerts.ts:205` | Modelo Consent carece de fecha de expiración → alerta "Consents próximos a vencer" silenciosa |
| RtBF queue | `get-operational-alerts.ts:208` | Modelo RtBF (derecho al olvido) no existe → `ComplianceScore` aproxima vía regex en audit log |
| Date-range picker custom | `period-picker.tsx:25` | Opción "Rango personalizado" muestra placeholder; necesita componente real |
| System Health real telemetry | `admin-dashboard.tsx:963` | Sec 8 Integraciones muestra dots verdes estáticos · falta wiring real a POS/WhatsApp/e-commerce |
| Audit log de exports | `auditEventRepository` | Repo solo expone `list()`; agregar `create()` para trazabilidad de exportaciones (RNF compliance) |
| `Client.firstName/lastName` separados | `types/client.ts` | RF-43 quiere split; hoy se hace por espacio del `name` |
| `PurchaseItem.productName` | `types/purchase.ts` | `exportBaSales` muestra SKU porque no hay productName denormalizado |
| `Heatmap` regional distribution | `components/charts/heatmap.tsx` | Componente disponible pero sin query (`getRegionalDistribution`) que lo alimente |
| Per-store conv reco | — | `exportBrandComparison` aprox vía promedio BA-level; F4 podría exponer query nativa |
| `Supervisor.zone` / `Admin.country` | `types/staff.ts` | Lookup actual via `userRepository.list()` ad-hoc |

## Commits Etapa 2

| Hash | Día | Descripción |
|---|---|---|
| `48e6368` | 2 | refactor: extract RankCard to components/charts |
| `6d18872` | 2 | feat: foundation utilities (formatters + adapters + parse-filters) |
| `c353b1f` | 3 | feat: shared UI primitives (FilterBar, AlertCard, HeroBlock…) |
| `34b543c` | 4 | feat(ba-dashboard): wire all sections to real queries |
| `18670b5` | 5 | feat(gerente-dashboard): wire all sections + coaching + funnel + drill-down |
| `225d436` | 6 | feat(supervisor-dashboard): wire 8 secciones + StoreHealthCard + BestPractices |
| `2e9ad1d` | 7 | feat(admin-dashboard): wire 8 secciones + Strategic + Compliance + Adoption |
| `e91e9bf` | 8 | feat(export): RF-43 RF-46 RF-49 — Excel + CSV exports across dashboards |
| `1144476` | 9 | feat(dashboards): iPad responsive + FilterBar→Export wiring |
| (today) | 10 | chore(etapa-2): polish + cleanup pre-entrega |

## Próximos pasos (F4)

- Resolver tech debt listada arriba (10 items).
- Lighthouse audit completo + accessibility pass.
- E2E Playwright tests para los 4 dashboards + flujo de export.
- Telemetría de exports + dashboards (cuál se usa, qué se exporta).
- Date-range picker custom funcional.
- Heatmap regional si Supervisor lo pide.
