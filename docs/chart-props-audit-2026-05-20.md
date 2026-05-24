# Chart Props Audit — Etapa 2 UI ↔ Queries Wiring

> **Fecha**: 2026-05-19 (timestamp del plan: 2026-05-20)
> **Propósito**: cruzar shapes de los componentes de chart con outputs de las queries de `features/dashboards/server/queries/` para identificar **adapters necesarios** antes de conectar UI ↔ data en Etapa 2.
> **Alcance**: 8 componentes (7 en `components/charts/` + `RankCard` interno) × 4 queries críticas.
> **Acción tomada**: NINGUNA. Esto es un reporte de read-only.

---

## 1. Inventario de componentes de charts

| Componente | Ruta | Props clave (shape) | Acepta data genérica |
|---|---|---|---|
| `<Sparkline>` | [`components/charts/sparkline.tsx`](../apps/web/src/components/charts/sparkline.tsx) | `values: readonly number[]` | ❌ array crudo de números |
| `<BarChart>` | [`components/charts/bar-chart.tsx`](../apps/web/src/components/charts/bar-chart.tsx) | `values: readonly number[]`, `labels?: readonly string[]`, `highlight?: number` | ❌ array crudo |
| `<LineChart>` | [`components/charts/line-chart.tsx`](../apps/web/src/components/charts/line-chart.tsx) | `series: ReadonlyArray<readonly number[]>`, `labels: readonly string[]`, `legend?` | ❌ matriz de números |
| `<Heatmap>` | [`components/charts/heatmap.tsx`](../apps/web/src/components/charts/heatmap.tsx) | `cells: Array<{region, value, intensity}>` | ✅ object array |
| `<ScatterPlot>` | [`components/charts/scatter-plot.tsx`](../apps/web/src/components/charts/scatter-plot.tsx) | `points: Array<{label, adoption, sales}>` | ✅ object array |
| `<SplitBar>` | [`components/charts/split-bar.tsx`](../apps/web/src/components/charts/split-bar.tsx) | `a: number, b: number, aLabel: string, bLabel: string` | ❌ dos números |
| `<StatusLight>` | [`components/charts/status-light.tsx`](../apps/web/src/components/charts/status-light.tsx) | `status: "verde"\|"amarillo"\|"rojo"` | ❌ enum |
| `<RankCard>` *(interno)* | [`features/dashboards/components/supervisor-dashboard.tsx:316-364`](../apps/web/src/features/dashboards/components/supervisor-dashboard.tsx) | `title: string`, `rows: Array<{label, value}>` | ✅ object array |

**Defaults notables**:
- `LineChart` colores: `[ink, ok, lancome-rose-deep, ysl-gold]`
- `ScatterPlot` ejes: `yMid = 3_200_000`, `xMid = 60`, `yMax = 5_000_000` (hardcoded a magnitudes del seed actual — puede chocar con scope acotado)
- `SplitBar` colores: `aClassName = "bg-ink"`, `bClassName = "bg-ysl-gold"` (asume orden Lancôme=a, YSL=b)

---

## 2. Cruces query → chart

### 2.1 `getSparklineData` ↔ `<Sparkline>`

- **Output query**: `Array<{ date: Date; value: number }>` (`SparklineBucket[]`)
- **Espera Sparkline**: `readonly number[]`
- **Match?** ❌ NO
- **Adapter sugerido**:
  ```ts
  <Sparkline values={data.map((b) => b.value)} />
  ```
- **Pérdida de información**: el eje X (fechas) se descarta. Aceptable porque `Sparkline` actual no muestra labels temporales — es solo un trend visual. Si en el futuro se quiere tooltip con la fecha del bucket, extender el componente con prop `dates?: readonly Date[]`.

### 2.2 `getStoreRanking` ↔ `<RankCard>` *(componente interno de Supervisor)*

- **Output query**: `Array<StoreRankingEntry>` con 8 campos por tienda (`storeId`, `storeName`, `franchiseName`, `salesAmount`, `transactionsCount`, `activeBas`, `activeClients`, `rank`)
- **Espera RankCard**: `Array<{ label: string; value: string }>`
- **Match?** ❌ NO
- **Adapter sugerido**:
  ```ts
  <RankCard
    title="Top ventas"
    rows={data.map((s) => ({
      label: s.storeName,
      value: formatCurrency(s.salesAmount),
    }))}
  />
  ```
- **Pérdida**: `transactionsCount`, `activeBas`, `activeClients`, `franchiseName`, `rank` no se muestran. Si se quiere un RankCard "rico", el componente actual tendría que ampliar `rows` a `{label, value, sub?, badge?}` o crearse uno paralelo (`<RankCardRich>`).

### 2.3 `getStoreRanking` ↔ `<ScatterPlot>`

- **Output query**: `StoreRankingEntry[]` (sin `adoption`)
- **Espera ScatterPlot**: `Array<{ label: string; adoption: number; sales: number }>`
- **Match?** ❌ NO — **GAP DE SCHEMA**
- **Problema**: `StoreRankingEntry` no expone `adoption` (% de adopción de BAs en la tienda). El ScatterPlot del Supervisor lo necesita para clasificar tiendas en 4 cuadrantes (alta/baja adopción × alta/baja ventas).
- **Opciones**:
  - **A**) Agregar campo `adoption: number` a `StoreRankingEntry`. La query tendría que computarlo (probablemente count de BAs con ≥1 venta en período / total BAs del counter × 100).
  - **B**) Crear query separada `getStoreAdoption(staff, filters): Promise<Array<{storeId, adoption}>>` y mergear en componente.
  - **C**) Definir "adopción" más amplio (uso real de la app, no solo ventas) y diferirlo hasta tener telemetría.
- **Adapter** (asumiendo opción A):
  ```ts
  <ScatterPlot
    points={data.map((s) => ({
      label: s.storeName,
      adoption: s.adoption,
      sales: s.salesAmount,
    }))}
  />
  ```
- ⚠️ También revisar: `ScatterPlot.yMax = 5_000_000` hardcoded. En PoC con seed actual (max sales ≈ $28K) **todos los puntos caen en el cuadrante inferior**. Si se conecta tal cual, visual rota. Necesita prop `yMax` calculado dinámicamente o reset de defaults.

### 2.4 `getSalesByBrand` ↔ `<SplitBar>`

- **Output query**: `{ Lancome: BrandStats; YSL: BrandStats }` (objeto, no array)
- **Espera SplitBar**: `{ a: number; b: number; aLabel: string; bLabel: string }`
- **Match?** ❌ NO
- **Adapter sugerido**:
  ```ts
  <SplitBar
    a={data.Lancome.salesAmount}
    b={data.YSL.salesAmount}
    aLabel="Lancôme"
    bLabel="YSL"
  />
  ```
- **Pérdida masiva**: SplitBar solo usa `salesAmount`. Los otros 5 campos de `BrandStats` (`transactionsCount`, `averageTicket`, `reco2PurchaseRate`, `activeClients`, `topProducts[]`) quedan disponibles para **otros componentes** del mismo card (KpiCard por métrica, lista de top products, etc.).

### 2.5 `getBaRanking` ↔ `<BarChart>` *(usado en BA dashboard para "Ranking adopción")*

- **Output query**: `Array<BaRankingEntry>` (9 campos por BA: `baId`, `name`, `storeId`, `storeName`, `brand`, `salesAmount`, `transactionsCount`, `conversionRate`, `rank`)
- **Espera BarChart**: `values: readonly number[]`, `labels?`, `highlight?: number`
- **Match?** ❌ NO
- **Adapter sugerido** (asumiendo "ranking por sales", staff es el BA actual):
  ```ts
  const myIndex = data.findIndex((b) => b.baId === currentStaffId);
  <BarChart
    values={data.map((b) => b.salesAmount)}
    labels={data.map((b) => b.name)}
    highlight={myIndex >= 0 ? myIndex : undefined}
  />
  ```
- **Nota visual**: en el BA dashboard actual, el ranking es **anónimo** (`RANKING_BARS = [95, 92, 90, ...]`). Conectar a `getBaRanking` reales **revelará nombres de pares**. Decisión de UX pendiente: ¿se mantiene anónimo (solo posición) o se expone nombres? El `BarChart` con `labels` permite ambos modos según se pase o no la prop.

### 2.6 `getBaRanking` ↔ `<RankCard>` *(equivalente al uso del Supervisor pero para BAs)*

- **Adapter**:
  ```ts
  <RankCard
    title="Top BAs · ventas mes"
    rows={data.map((b) => ({
      label: b.name,
      value: formatCurrency(b.salesAmount),
    }))}
  />
  ```

---

## 3. Tabla resumen de adapters necesarios

| Adapter | Query | Chart | Transformación | Pérdida / Gap |
|---|---|---|---|---|
| **A1 — Sparkline values** | `getSparklineData` | `<Sparkline>` | `d.map(b => b.value)` | Pierde fechas (aceptable para trend) |
| **A2 — RankCard tiendas** | `getStoreRanking` | `<RankCard>` | `d.map(s => ({label: s.storeName, value: formatCurrency(s.salesAmount)}))` | Pierde 5 campos auxiliares |
| **A3 — ScatterPlot tiendas** | `getStoreRanking` (+gap) | `<ScatterPlot>` | `d.map(s => ({label, adoption: s.adoption, sales: s.salesAmount}))` | ⚠️ **GAP**: falta `adoption` en query; revisar yMax |
| **A4 — SplitBar marcas** | `getSalesByBrand` | `<SplitBar>` | `{a: d.Lancome.salesAmount, b: d.YSL.salesAmount, aLabel:"Lancôme", bLabel:"YSL"}` | Pierde 5 campos por marca → usar en KpiCards |
| **A5 — BarChart ranking BAs** | `getBaRanking` | `<BarChart>` | `{values: d.map(b => b.salesAmount), labels: d.map(b => b.name), highlight: myIdx}` | Decisión UX: anónimo vs nombres |
| **A6 — RankCard BAs** | `getBaRanking` | `<RankCard>` | `d.map(b => ({label: b.name, value: formatCurrency(b.salesAmount)}))` | Pierde `conversionRate`, `rank` |

---

## 4. Sorpresas y observaciones

### 4.1 `<RankCard>` está enterrado en `supervisor-dashboard.tsx`

No está en `components/charts/`, está como función local en líneas 316-364 del `supervisor-dashboard.tsx`. Para reusarlo en BA dashboard hay que **extraerlo a `components/charts/rank-card.tsx`** (o `components/patterns/`) y exportarlo. **Acción sugerida**: refactor mínimo antes de conectar queries.

### 4.2 `<ScatterPlot>` tiene defaults frágiles para el seed actual

`yMax = 5_000_000` hardcoded (línea ~38 del archivo). El seed actual produce sales por tienda en el rango **$13K – $28K** para abril 2026. **Todos los puntos caerían en el ~0.5% inferior del gráfico** → visual muerto.

**Recomendación**: el adapter debe **calcular `yMax` dinámico** = `max(points.sales) * 1.2` y pasarlo como prop:
```ts
const yMax = Math.max(...data.map(s => s.salesAmount)) * 1.2;
const xMid = 60; // o calcular si tenemos adoption
<ScatterPlot points={...} yMax={yMax} xMid={xMid} />
```

### 4.3 `<SplitBar>` color hardcoded YSL

`bClassName: "bg-ysl-gold"` por default. Si en el futuro se quiere SplitBar para otros pares (ej. tiendas Liverpool vs Palacio), hay que pasar `aClassName`/`bClassName` explícitos. **No es bloqueante para Etapa 2.**

### 4.4 `<Heatmap>` y `<StatusLight>` no tienen query directa

- `<Heatmap>` (mapa México por regiones) — no hay query que devuelva `{region, value, intensity}`. El Supervisor lo usa con data inline literal. **Si se quiere dinámico, hay que crear `getRegionalDistribution()` o equivalente.** No estaba en el spec de Etapa 1.
- `<StatusLight>` (verde/amarillo/rojo) — no hay query directa, pero `getOperationalAlerts` retorna `severity: "info"|"warning"|"critical"` que mapea trivial: `critical→rojo`, `warning→amarillo`, `info→verde`. Adapter de 1 línea.

### 4.5 `<LineChart>` requiere serie temporal por categoría

Espera `series: number[][]` (múltiples líneas) + `labels: string[]` para eje X. El Supervisor lo usa con 3 LineCharts (ventas zona 12 sem, adopción zona 12 sem, Liverpool vs Palacio). **`getSparklineData` retorna 1 sola serie**. Para alimentar LineChart multi-serie habría que:
- Opción A: llamar `getSparklineData` N veces con distintos `filters.storeIds` o `filters.brands` y combinar en el componente
- Opción B: extender la query para devolver `Array<{date, valuesByKey: Record<string, number>}>`

**No bloqueante** para Etapa 2 si solo se usa LineChart con 1 serie inicialmente.

### 4.6 Magnitudes del seed vs defaults de gráficos

`<ScatterPlot.yMid = 3_200_000>` y `<ScatterPlot.yMax = 5_000_000>` asumen ventas mensuales en millones. El seed actual genera ~$70K total nacional en abril. **Los defaults asumen un escenario de producción que el PoC no replica**. Reportar como deuda visual: dashboards con datos reales del seed se verán "vacíos" hasta poblar más volumen.

### 4.7 No falta ningún componente core

Las 4 queries del spec cruzan con componentes existentes (a veces con adapters). **No hay que crear** `<Card>`, `<Table>`, `<Tooltip>`, etc. desde cero — todo lo necesario está en `components/`. El trabajo de Etapa 2 UI es **adapters + composición + extracción de `RankCard`**.

---

## 5. Orden recomendado para Día 1 de Etapa 2

1. **Extraer `RankCard` a `components/charts/rank-card.tsx`** (~10 min). Refactor mínimo, no rompe nada.
2. **Decidir gap RF-A3 (ScatterPlot adoption)** antes del primer commit que toque Supervisor. Recomendación: agregar `adoption` opcional a `StoreRankingEntry` con cálculo simple `activeBas / totalBasInStore * 100`.
3. **Crear archivo de adapters** `features/dashboards/lib/adapters.ts` con las 6 funciones tipadas (A1–A6). Tests unitarios cortos.
4. **Conectar BA dashboard primero** (es el más simple, pocas queries, datos del scope más acotado).
5. **Después Gerente** (más KPIs pero misma estructura).
6. **Supervisor al final** (charts más complejos, scatter requiere fix de yMax dinámico, semáforo necesita query nueva o derivación in-place).

---

_Generado automáticamente del análisis de [`components/charts/`](../apps/web/src/components/charts/) y [`features/dashboards/server/queries/`](../apps/web/src/features/dashboards/server/queries/)._
