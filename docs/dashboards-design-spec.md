# Dashboards Design Spec — Etapa 2

> **Audiencia**: Claude Code agents implementando Etapa 2 + Isa Valdez (referencia)
> **Fecha**: 2026-05-20
> **Versión**: 1.0 (cierre del design workshop)
> **Scope**: BA · Gerente · Supervisor · Admin
> **Out of scope**: F4 (cohort analysis, YoY profundo, virtual try-on, RF-39 link tracking)

---

## Tabla de contenidos

1. [Executive Summary](#1-executive-summary)
2. [Design System (cross-cutting)](#2-design-system-cross-cutting)
3. [Dashboard Specs](#3-dashboard-specs)
   - 3.1 [BA Dashboard](#31-ba-dashboard-baperformance)
   - 3.2 [Gerente Dashboard](#32-gerente-dashboard-gerente)
   - 3.3 [Supervisor Dashboard](#33-supervisor-dashboard-supervisor)
   - 3.4 [Admin Dashboard](#34-admin-dashboard-admin)
4. [Component Inventory](#4-component-inventory)
5. [Implementation Plan (días 2-10)](#5-implementation-plan)
6. [Appendix · patrones de código](#6-appendix-patrones-de-código)

---

## 1. Executive Summary

### Propósito

Especificación final de los 4 dashboards de la app Clienteling L'Oréal Luxe México. Documento ejecutable para implementación: cada dashboard tiene blueprint, KPIs, queries de respaldo, y visualizaciones definidas.

### Filosofía de diseño

- **Status first, action second** — los dashboards son herramientas reflexivas/estratégicas; las acciones operacionales viven en las pantallas operativas (`/ba`, `/ba/clients/[id]`, etc.).
- **Variedad visual** — cada sección usa una técnica visual distinta a la adyacente. Sin paredes de stat cards repetidas.
- **Comparativa silenciosa** — cuando es posible mostrar "tu valor vs benchmark", se hace. Counter para BA, marca/tienda para Gerente, zona para Supervisor, país para Admin.
- **Inteligencia derivada** — insights, coaching, forecast, compliance score son valores agregados que diferencian la app de un reporte plano.
- **Modal-first drill-downs** — no creamos rutas nuevas por cada detalle. Modales con summary preservan contexto.

### Principios técnicos

- Next.js 15 App Router · grupo `(app)` · middleware role-gate (ya implementado).
- Server Components por defecto · Client Components solo para interacciones (FilterBar, drill-down modales).
- Filtros vía `searchParams` (URL state) · re-fetch automático del Server Component.
- Datos: 30 queries en `features/dashboards/server/queries/` (Etapa 1, completo).
- RBAC: 4 roles · scope dual store+brand · 31 tests verdes.

### Cobertura RFP

| Criterio RFP | Cobertura post-Etapa 2 |
|---|---|
| CA-01 Cobertura funcional (30%) | RF-01 a RF-33 ✓ (visible en demo) |
| CA-02 Compliance LFPDPPP | Compliance Score en Admin + aviso + RtBF UI |
| CA-03 Seguridad técnica (15%) | SSL/TLS + MFA admins + RBAC declarativo |
| CA-04 IA y personalización (15%) | Recomendaciones + segmentación + Coaching Insights |
| CA-06 Performance / disponibilidad | ≤2s con SSR + cache de queries |
| CA-07 Dashboards y reportes | Los 4 dashboards + RF-49 Exportación Excel/CSV |
| CA-09 TCO 3 años (10%) | Business Case (entregable separado) |
| CA-10 Escalabilidad multi-marca | Arquitectura scope dual probada |

---

## 2. Design System (cross-cutting)

### 2.1 Filtros

#### Period selector

| Aspecto | Valor |
|---|---|
| Posición | Top-right del header del dashboard, sticky en scroll |
| Default | MTD (mes en curso) |
| Opciones | MTD · Último mes · QTD · YTD · Custom range |
| Implementación | Client Component `<PeriodPicker>` que actualiza `searchParams.period` |

#### Scope filters por rol

| Rol | Period | Tienda | Marca | BA específico |
|---|:-:|:-:|:-:|:-:|
| **BA** | ✓ | — | — | — |
| **Gerente** | ✓ | — | ✓ (toggle LCM/YSL/ambas) | ✓ (dropdown de sus 4 BAs) |
| **Supervisor** | ✓ | ✓ (toggle entre tiendas de su zona) | ✓ | ✓ |
| **Admin** | ✓ | ✓ (todas las tiendas país) | ✓ | — |

#### Pattern técnico

```
URL: /gerente?period=mtd&brand=lcm&baId=us-ba-pol-lcm-1
       ↓
Server Component (page.tsx)
  ↓ lee searchParams
  ↓ llama queries con filters
  ↓ renderiza HTML
       ↓
<FilterBar> (Client Component, recibe roleConfig)
  ↓ user cambia filtro
  ↓ router.push(`?period=qtd&brand=lcm`)
  ↓ Next 15 re-renderiza Server Component automáticamente
```

`<FilterBar>` recibe `roleConfig: { period: true, store: false, brand: true, baId: true }` y muestra solo los filtros aplicables al rol.

### 2.2 Sistema de alertas

#### Severity tiers (3)

| Tier | Color | Uso |
|---|---|---|
| **Critical** | Rojo (`hsl(0, 70%, 50%)`) | Regulatorio (consent expiry inminente), cliente VIP perdiéndose, integración caída |
| **Warning** | Ámbar (`hsl(38, 92%, 50%)`) | BA bajo cuota, tienda con tendencia negativa, follow-up vencido |
| **Info** | Gris-azulado (`hsl(215, 16%, 47%)`) | Sugerencias contextuales, recordatorios |

#### Placement por rol

| Rol | Banner top | Sección dedicada | Integradas en sections |
|---|:-:|:-:|:-:|
| **BA** | — | — | ✓ (badges en Cartera y Próximos pasos) |
| **Gerente** | ✓ (solo Critical) | — | ✓ |
| **Supervisor** | ✓ (Critical) | ✓ pequeña al final | ✓ |
| **Admin** | ✓ (Critical) | ✓ "Alertas operacionales" | — |

#### Alert primitive (visual)

Card con borde izquierdo color severity + icon + content + action:

```
┌─────────────────────────────────────────────┐
│ ▌ Crítica · Consent expira en 3 días        │
│ ▌ Andrea Constanza López              ⓘ →  │
└─────────────────────────────────────────────┘
```

Banner top colapsa a una línea:

```
══════════════════════════════════════════════
● 3 críticas · 5 warnings · 12 info  [Ver →]
══════════════════════════════════════════════
```

Badge integrado en título de sección:

```
Mi cartera   ●3 alertas
```

### 2.3 Patrón comparativo (toolkit)

3 patrones que se usan según contexto. Aplican en los 4 dashboards.

| Patrón | Cuándo usar | Ejemplo |
|---|---|---|
| **Inline** | Stat cards en hero o medianas | `$486K` (grande) + `vs counter $412K · ↑+18%` (chico debajo) |
| **Bar comparison** | Cuando la comparación ES el punto | Barra horizontal `tu %` con línea de referencia `counter %` |
| **Delta chip** | Espacios apretados, tablas | `$486K` + chip `[↑+18%]` verde/rojo |

#### Convención de colores delta

- **Verde** (`hsl(142, 71%, 45%)`) = mejor que benchmark
- **Rojo** (`hsl(0, 70%, 50%)`) = peor que benchmark
- **Gris** (`hsl(215, 16%, 47%)`) = neutral / igual
- **Amarillo NUNCA en deltas** (reservado exclusivamente para warning alerts)

### 2.4 Formato de números y fechas

| Contexto | Currency | Percentage | Counts | Dates |
|---|---|---|---|---|
| Stat cards / KPIs | `$1.2M` `$486K` `$2,450` | `72%` `+8pp` | `1.2K` `245` | "hace 3 días" |
| Tablas | `$486,200` | `72.3%` | `1,245` | "15 abr" |
| Exports | `$486,200.00 MXN` | `0.723` | `1245` | "2026-04-15" |
| Detalle de evento | full | full | full | "15 abr 2026" |

Locale: Mexican peso. Símbolo `$` solo en pantalla (no agregar "MXN" — contexto es implícito).

### 2.5 Empty states

#### Tono

Amable + positivo + sugiere acción cuando aplique. NUNCA "No data found" o lenguaje de error.

#### Visual

- Icon muted (gris claro) centrado
- Texto centrado debajo
- Botón de acción opcional (solo si hay siguiente paso claro)
- Sin ilustraciones grandes (overkill para dashboard)

#### Banco de copies

| Sección | Empty state | Acción opcional |
|---|---|---|
| Cartera (BA) | "Aún no registras clientas. Tu primera visita arranca aquí." | [Ir a Hoy] |
| Pendientes (BA) | "Estás al día. No tienes follow-ups pendientes." | — |
| Próximos eventos | "No hay cumpleaños ni aniversarios en los próximos 30 días." | — |
| Alertas críticas | "Sin alertas críticas. Todo en orden." | — |
| Ranking BAs (Gerente) | "Configura al menos un BA en tu tienda para ver el ranking." | [Ir a Admin] |
| Tendencias (Supervisor) | "Aún no hay datos suficientes para mostrar tendencias. Vuelve en unos días." | — |
| Sin actividad en período | "Sin actividad en este período. Prueba ampliando el rango." | [Cambiar período] |

### 2.6 Drill-down policy

| Click en... | Comportamiento | Razón |
|---|---|---|
| Nombre de cliente (cualquier dashboard) | Ruta existente `/ba/clients/[id]` | Ya existe |
| Pendiente de follow-up | Ruta existente `/ba/followup` | Ya existe |
| Evento próximo (cumple/aniv) | Perfil del cliente del evento | Ya existe |
| BA del ranking (Gerente, Supervisor) | **Modal con summary** del BA + sus KPIs + 3 alertas | NO crear `/gerente/ba/[id]` |
| Tienda del semáforo (Supervisor) | **Modal con summary** de la tienda | NO crear `/supervisor/store/[id]` |
| Stat card | No-op o tooltip con definición | Solo lectura |
| Marca / categoría en chart | Filtra el dashboard (actualiza searchParams) | Re-fetch automático |
| Top product | Tooltip con detalle (sin nueva ruta) | Sin ruta de producto en scope |

---

## 3. Dashboard Specs

### 3.1 BA Dashboard (`/ba/performance`)

**Foco**: desempeño personal del BA.
**Audiencia**: Beauty Advisor de UN counter (1 tienda · 1 marca).
**Narrativa**: status first (70%) · action second (30%).
**Filtros disponibles**: solo period.

#### Wireframe

```
┌─ HERO ──────────────────────────────────────────────┐
│  [Ventas mes vs obj GRANDE] │ [Posición counter]    │
│  $486K / $1.2M  72%         │ [Ticket promedio]     │
│  ↑+12.4% | sparkline        │ [Conv reco→compra]    │
│  Pacing: vas adelantado por $42K (↑+12% sobre meta) │
└─────────────────────────────────────────────────────┘
1. Comparativa con counter    [Tabla con 4 métricas + delta]
2. Conversiones del clienteling [3 barras horizontales comparativas]
3. Mi mix de ventas           [Donut categorías + lista top productos]
4. Mi cartera                 [2 stats grandes + lista top clientas]
5. Próximos pasos             [Timeline + lista pendientes]
```

#### Hero detallado

| Componente | Contenido | Queries |
|---|---|---|
| Big card (60% ancho) | `$486K / $1.2M · 72%` + progress bar + delta `↑+12.4%` + sparkline 30d + pacing text | `getSalesAmount`, `BA.monthlyTarget`, `getPeriodDelta`, `getSparklineData` |
| Small card 1 | "Posición en counter: **#2 de 4**" + mini-bar percentil | `getBaRankingInCounter` |
| Small card 2 | "Ticket promedio: **$2,450**" + delta `↑+5.2%` | `getAverageTicket` + `getPeriodDelta` |
| Small card 3 | "Conv reco→compra: **32%**" + comparativa silenciosa "vs counter 24%" | `getRecoToPurchaseRate` + `getCounterAverages` |

**Pacing text — fórmula**:

```
diasDelMes = endOfMonth - startOfMonth
diasTranscurridos = today - startOfMonth
diasRestantes = diasDelMes - diasTranscurridos
ritmoNecesarioDiario = (monthlyTarget - salesAmount) / diasRestantes
ritmoActualDiario = salesAmount / diasTranscurridos
proyeccionFinDeMes = ritmoActualDiario * diasDelMes

Si proyeccion >= target:
  "Vas adelantado por $X · proyección $Y (↑+Z% sobre meta)"
Si proyeccion < target:
  "Estás $X por debajo del ritmo · necesitas $Y/día los próximos Z días"
```

#### Secciones

##### Sección 1 — Comparativa con counter (tabla)

| Métrica | Tú | Counter avg | Δ |
|---|---|---|---|
| Transacciones | **198** | 165 | ↑ +20% |
| Clientes nuevos | **12** | 9 | ↑ +33% |
| Follow-ups enviados | **47** | 38 | ↑ +24% |
| Recompra 90d | **38%** | 31% | ↑ +7pp |

Queries: `getTransactionsCount`, `getNewClientsCount`, `getFollowUpsCount`, `getRepurchaseRate` + `getCounterAverages`.

##### Sección 2 — Conversiones del clienteling (barras horizontales)

```
Reco → compra        ████████████░░░░  32%   vs counter 24% (+8pp)
Sample → compra      ██████░░░░░░░░░░  18%   vs counter 22% (-4pp)
Followup → revisita  ███████████░░░░░  44%   vs counter 39% (+5pp)
```

Componente: `<ConversionBar tu={32} counter={24} label="Reco → compra" />` con barra principal + línea vertical de referencia counter + delta a la derecha.

Queries: `getRecoToPurchaseRate`, `getSampleToPurchaseRate`, `getFollowupToRevisitRate` + `getCounterAverages`.

##### Sección 3 — Mi mix de ventas

| Lado izquierdo (50%) | Lado derecho (50%) |
|---|---|
| Donut chart de ventas por categoría (Skincare 45% / Makeup 30% / Fragrance 25%) | Top 5 productos del mes (nombre + SKU + unidades + ingresos) |

Queries: `getSalesByCategory` + `getTopProducts`.

##### Sección 4 — Mi cartera

| Lado izquierdo (50%) | Lado derecho (50%) |
|---|---|
| Stats grandes:<br>"**127** clientas activas"<br>"**14** en riesgo" (dot rojo sutil) | Lista "Top 5 clientas por valor":<br>nombre · ticket promedio · última visita |

Queries: `getActiveClients`, `getAtRiskClients`, `getTopClients`.

##### Sección 5 — Próximos pasos (única sección de "acción")

- **Arriba**: timeline horizontal de próximos 30 días con marcadores por evento (cumpleaños, aniversario, reposición)
- **Abajo**: lista de pendientes de follow-up con nombre + tipo + días desde última interacción

Click en evento → perfil del cliente. Click en pendiente → `/ba/followup`.

Queries: `getPendingFollowups`, `getUpcomingBirthdays`, `getUpcomingAnniversaries`, `getEstimatedReplenishments`.

#### Alertas en BA

Solo integradas. Badges en títulos de sección 4 (cartera, alertas tipo "VIP en riesgo") y sección 5 (próximos pasos, alertas tipo "consent expira"). Sin banner top.

---

### 3.2 Gerente Dashboard (`/gerente`)

**Foco**: tienda completa (ambas marcas LCM + YSL).
**Audiencia**: Gerente de Tienda con 4 BAs (2 LCM + 2 YSL) a su cargo.
**Narrativa**: gestión de equipo + comparativa de marcas + alertas operacionales.
**Filtros disponibles**: period + marca + BA específico.

#### Wireframe

```
┌─ HERO ───────────────────────────────────────────────┐
│  [Ventas tienda vs obj]  │ [Mix LCM/YSL]            │
│  $1.8M / $2.4M  75%      │ [BAs activos hoy]         │
│  ↑+8% | sparkline        │ [Conv reco→compra avg]    │
│  Forecast: cierre $2.42M (↑+1% sobre meta)           │
└──────────────────────────────────────────────────────┘
1. Coaching Insights + Ranking de mi equipo
2. Comparativa entre marcas (LCM vs YSL)
3. Conversion Funnel del store
4. Mix de productos
5. Salud de la cartera
6. Operación + Acción (alertas + agenda + pendientes equipo)
```

#### Hero detallado

| Componente | Contenido | Queries |
|---|---|---|
| Big card | Ventas tienda + sparkline + **forecast con proyección** | `getSalesAmount`, store target, `getSparklineData`, `getPeriodDelta` |
| Small 1 | Mix LCM/YSL con mini-SplitBar (e.g., "55% LCM / 45% YSL") | `getSalesByBrand` |
| Small 2 | "BAs activos hoy: **4 de 4**" + dot indicator | derivado de `interactionRepository` filtrado por today |
| Small 3 | "Conv reco→compra promedio: **28%**" | `getRecoToPurchaseRate` agregado |

**Forecast text** — extiende el pacing del BA con escenario de simulación:

```
"proyección con ritmo actual: $2.42M (↑+1% sobre meta)
 proyección si Diego recupera: $2.51M (↑+5%)" ← simulación
```

La simulación toma el peor BA del ranking y calcula qué pasaría si volviera a su promedio.

#### Sección 1 — Coaching Insights + Ranking

##### Coaching Insights (arriba de la tabla)

3 cards de insights derivados. Algoritmo:

```
Insight 1 (positivo): BA con mayor crecimiento % vs período anterior
  → "↑ {nombre} creció +{X}% vs mes anterior · Reconoce su esfuerzo"

Insight 2 (warning conversión): BA con conversión más baja vs counter
  → "⚠ {nombre} tiene conversión {Xpp} menor al counter ({brand}) · Programa coaching"

Insight 3 (urgente): BA con menor % de cumplimiento de objetivo
  → "⚠ {nombre} está al {X}% del objetivo · ritmo proyecta {Y}% · Necesita atención urgente"
```

Componente: `<CoachingInsightCard severity icon title description action />`.

##### Ranking BAs (tabla)

| BA | Marca | Ventas | % obj | Conv | Adopción | Estado |
|---|---|---|---|---|---|---|
| Valentina R. | LCM | $486K | 108% | 32% | 95% | ✓ Top |
| Sofía C. | LCM | $412K | 92% | 20% | 82% | ⚠ Conv baja |
| Daniela M. | YSL | $390K | 88% | 26% | 88% | — |
| Diego F. | YSL | $312K | 58% | 22% | 75% | 🔴 Urgente |

Click en BA → modal con: KPIs detallados + sparkline 30d + sus 3 alertas + botón "Programar 1:1".

Queries: `getBaRanking`, `getOperationalAlerts` filtrado por BA, `getRecoToPurchaseRate` por BA.

#### Sección 2 — Comparativa entre marcas

| Visual | Contenido |
|---|---|
| **Izquierda (40%)**: SplitBar grande LCM/YSL con porcentajes y valores absolutos | $990K LCM (55%) / $810K YSL (45%) |
| **Derecha (60%)**: 2 columnas de KPIs paralelos | Por marca: ventas · ticket promedio · conv reco→compra · top SKU · tendencia 30d (mini sparkline) |

Queries: `getSalesByBrand`, `getAverageTicket` por brand, `getRecoToPurchaseRate` por brand, `getTopProducts` por brand.

#### Sección 3 — Conversion Funnel del store

Visual: funnel con 4 etapas, mostrando counts absolutos y % conversión entre etapas.

```
       Interacciones registradas         ████████████████  524
                       ↓ 78% engagement
       Recomendaciones hechas            ████████████      408
                       ↓ 32% conversión
       Compras tras recomendación        █████████         131
                       ↓ 41% retención
       Recompra en 90 días               ████              54
```

Componente nuevo: `<Funnel stages={[{label, count}, ...]} />` que calcula y muestra conversión entre etapas.

Queries: `getInteractions`-derived count, `getRecommendations`-derived count, `getRecoToPurchaseRate` (deriva el count de compras), `getRepurchaseRate`.

#### Sección 4 — Mix de productos

| Lado izquierdo | Lado derecho |
|---|---|
| Donut categorías | 2 listas top SKUs (una por marca) |

Queries: `getSalesByCategory`, `getTopProducts` con filtro de brand.

#### Sección 5 — Salud de la cartera

Stats grandes + segmentación + lista VIP:

- **Stats**: Activos · En riesgo · Recompra 90d
- **Segmentos**: dist por categoría (VIP / Recurrente / Nuevo / En riesgo) — barra apilada
- **Lista**: Top 10 VIPs con ticket promedio + última visita + BA asignado

Queries: `getActiveClients`, `getAtRiskClients`, `getRepurchaseRate`, `getTopClients`.

#### Sección 6 — Operación + Acción

- Alertas operacionales integradas (todas las non-critical)
- Métricas agenda: citas semana, no-show, reagendadas
- Pendientes del equipo (agregado de los 4 BAs)

Queries: `getOperationalAlerts`, `getAppointmentMetrics`, `getPendingFollowups` agregado.

#### Banner top del Gerente

Activo cuando hay alguna alerta CRITICAL. Ejemplos:

- "1 BA crítico requiere atención inmediata · Diego F. al 58% objetivo"
- "2 consents de clientes VIP expiran en 48h"
- "iPad de la tienda con error de sincronización"

---

### 3.3 Supervisor Dashboard (`/supervisor`)

**Foco**: zona con múltiples tiendas (Polanco + Santa Fe; Perisur deliberadamente fuera).
**Audiencia**: Supervisor zona Centro.
**Narrativa**: el más visual de los 4 — multi-tienda permite comparaciones cross-store únicas.
**Filtros disponibles**: period + tienda (toggle) + marca + BA.

#### Wireframe

```
┌─ HERO ────────────────────────────────────────────────┐
│  [Ventas zona vs obj]     │ [Mix LCM/YSL zona]        │
│  $3.2M / $4.5M  71%       │ [Tiendas en verde: 1/2]   │
│  ↑+6% | sparkline         │ [BAs activos: 7/8]        │
│  Forecast: cierre $4.48M (↑+0.4% sobre meta)          │
└───────────────────────────────────────────────────────┘
1. Semáforo + Store Health Score
2. Coaching Insights + Ranking BAs cross-store
3. Best Practices Identification (insights cross-store)
4. Tendencias zona vs tiendas (multi-line chart)
5. Conversion Funnel zona
6. Comparativa marcas zona
7. Side-by-side: tienda fuerte vs débil
8. Alertas + Operación
```

#### Hero

Patrón paralelo al Gerente pero a nivel zona. Forecast incluye proyección zona y opcionalmente "qué pasaría si la tienda débil mejora".

#### Sección 1 — Semáforo + Store Health Score

Cards grandes side-by-side, una por tienda:

```
LIVERPOOL POLANCO              PALACIO SANTA FE
                                                     
  STORE HEALTH                   STORE HEALTH         
       82/100                          64/100         
    ━━━━━━━━━░                      ━━━━━━━░░░       
    VERDE · saludable               ÁMBAR · atención 
                                                     
  Ventas mes      $1.9M           Ventas mes    $1.3M
  % objetivo      96%             % objetivo    62%  
  YoY             ↑+8%            YoY           ↑+2% 
  Adopción BAs    100%            Adopción BAs  85%  
  Alertas         1 warning       Alertas       2 critical
```

**Store Health Score — fórmula**:

```
healthScore = round(
  0.40 * (% del objetivo de ventas) +
  0.20 * (% de adopción BAs activos / total BAs) +
  0.20 * (100 - % alertas críticas) +
  0.20 * (% de uso de iPad / sesiones)
)

≥ 80 = verde · 60-79 = ámbar · < 60 = rojo
```

Componente nuevo: `<StoreHealthCard store healthScore />`.

Click en card → modal con detalle de la tienda (todos sus BAs, sus métricas, sus alertas).

#### Sección 2 — Coaching Insights + Ranking BAs cross-store

Igual al Gerente pero la tabla muestra BAs de AMBAS tiendas, agrupados.

| BA | Tienda | Marca | Ventas | % obj | Conv | Estado |
|---|---|---|---|---|---|---|
| Valentina R. | Polanco | LCM | $486K | 108% | 32% | ✓ Top |
| Daniela M. | Polanco | YSL | $462K | 102% | 28% | ✓ |
| Sofía C. | Santa Fe | LCM | $312K | 78% | 20% | ⚠ |
| ... | | | | | | |

Coaching Insights detecta patrones cross-store ("3 de tus 4 BAs Top están en Polanco").

#### Sección 3 — Best Practices Identification

Insights derivados que identifican qué hace bien una tienda que la otra podría replicar.

```
┌─ MEJORES PRÁCTICAS DE LA ZONA ─────────────────────────┐
│  Polanco tiene 18% más conversión sample→compra que   │
│  Santa Fe                                              │
│  → Considera transferir el approach del counter LCM    │
│    Polanco a Santa Fe                                  │
├────────────────────────────────────────────────────────┤
│  Santa Fe registra 2.3x más perfiles nuevos por día   │
│  → Pregunta a Daniela qué método usa al onboarding     │
└────────────────────────────────────────────────────────┘
```

**Algoritmo**:

```
para cada métrica clave (conv_reco, conv_sample, conv_followup,
                         ticket_promedio, perfiles_dia, adopcion):
  compara tienda_A vs tienda_B
  si diferencia > 15%:
    emit insight con tienda ganadora + métrica + sugerencia accionable
```

Componente: `<BestPracticeInsight ganadora perdedora metrica diferencia accion />`.

#### Sección 4 — Tendencias zona vs tiendas

Multi-line chart con 3 líneas:

- Línea **gruesa**: zona (suma de las 2 tiendas)
- Línea **delgada azul**: Polanco
- Línea **delgada verde**: Santa Fe
- Eje X: últimos 12 weeks · Eje Y: ventas

Si las tiendas divergen mucho, lo identifica visualmente.

Queries: `getSparklineData` por scope (zone, Polanco, Santa Fe).

#### Sección 5 — Conversion Funnel zona

Igual al del Gerente pero agregado a nivel zona.

#### Sección 6 — Comparativa marcas zona

Patrón del Gerente extendido: SplitBar de zona + breakdown por tienda. Permite ver por ejemplo "Polanco LCM > Polanco YSL > Santa Fe LCM > Santa Fe YSL".

#### Sección 7 — Side-by-side: tienda fuerte vs débil

Vista comparativa profunda de las 2 tiendas, columna por tienda:

| Métrica | Polanco | Santa Fe | Δ |
|---|---|---|---|
| Ventas mes | $1.9M | $1.3M | -32% |
| % objetivo | 96% | 62% | -34pp |
| Ticket promedio | $2,450 | $1,890 | -23% |
| Conv reco→compra | 30% | 22% | -8pp |
| Adopción BAs | 100% | 85% | -15pp |
| Top categoría | Skincare | Makeup | — |

Permite identificar de un vistazo dónde está la brecha mayor.

#### Sección 8 — Alertas + Operación

Banner top + sección dedicada al final ("Alertas operacionales") + integradas en secciones.

---

### 3.4 Admin Dashboard (`/admin`)

**Foco**: gobernanza nacional + estrategia país.
**Audiencia**: dirección general L'Oréal Luxe México.
**Narrativa**: vista panorámica nacional + compliance + adopción + system health.
**Filtros disponibles**: period + tienda + marca.

#### Wireframe

```
┌─ HERO ─────────────────────────────────────────────────┐
│  [Ventas nacionales vs obj] │ [Mix LCM/YSL país]      │
│  $5.0M / $6.9M  72%         │ [Tiendas activas: 3/3]  │
│  ↑+9% YoY                   │ [BAs activos: 15/15]    │
│  Forecast nacional: cierre $6.95M (↑+1% sobre meta)    │
└────────────────────────────────────────────────────────┘
1. Ranking nacional (top tiendas + top BAs país)
2. Conversion Funnel + Strategic Insights nacional  ← N1
3. Comparativa marcas país (LCM vs YSL)
4. Mix de productos país
5. Compliance Posture  ← N2 (cumple CA-02 del RFP)
6. Adoption Tracker    ← N3
7. Gobernanza del sistema (usuarios, permisos, catálogo)
8. Alertas + System Health (integraciones + audit log)
```

#### Hero del Admin

Patrón paralelo a Supervisor pero a nivel país. Hay valor en mostrar YoY (no period delta) si el seed lo permite.

#### Sección 1 — Ranking nacional

Dos tablas side-by-side:

| Top tiendas | | Top BAs |
|---|---|---|
| Polanco $1.9M ↑+8% | | Valentina R. $486K |
| Santa Fe $1.3M ↑+2% | | Daniela M. $462K |
| Perisur $1.1M ↓-3% | | ... |

Click en tienda → modal. Click en BA → modal.

Queries: `getStoreRanking`, `getBaRanking` agregado nacional.

#### Sección 2 — Conversion Funnel + Strategic Insights nacional

Funnel nacional (como Gerente/Supervisor) **+** Strategic Insights:

```
┌─ STRATEGIC INSIGHTS ──────────────────────────────────────┐
│  El clienteling generó $1.2M adicionales este mes        │
│  vs benchmark sin clienteling                            │
├──────────────────────────────────────────────────────────┤
│  Si todo el país tuviera la conversión de Polanco        │
│  generaría $480K adicionales/mes                         │
├──────────────────────────────────────────────────────────┤
│  Lancôme creció +12% vs YSL +5% este mes                 │
│  → Considera revisar estrategia comercial YSL Q3         │
└──────────────────────────────────────────────────────────┘
```

**Algoritmos** para los 3 insights:

```
Insight 1 (valor agregado):
  bechmark = total_sales * (1 - avg_conversion_rate_reco_to_purchase)
  actual_clienteling = total_sales - benchmark
  emit: "El clienteling generó ${actual_clienteling} adicionales este mes"

Insight 2 (opportunity gap):
  best_store_conv = max(store.conv_reco_to_purchase)
  national_avg = avg(all_stores.conv_reco_to_purchase)
  gap = (best_store_conv - national_avg) * national_sales
  emit: "Si todo el país tuviera la conversión de {top_store}, generaría ${gap} adicionales"

Insight 3 (brand strategy):
  growth_lcm = period_delta(brand=LCM)
  growth_ysl = period_delta(brand=YSL)
  diff = growth_lcm - growth_ysl
  si abs(diff) > 5pp:
    emit: "{brand1} creció +{X}% vs {brand2} +{Y}% · Considera revisar estrategia comercial..."
```

#### Sección 3 — Comparativa marcas país

Patrón del Gerente/Supervisor a nivel país. SplitBar + tendencia comparada (line chart de 90d para ambas marcas).

#### Sección 4 — Mix de productos país

Donut categorías + top 10 SKUs nacional (sin breakdown por marca; ya está cubierto en sección 3).

#### Sección 5 — Compliance Posture (CRÍTICO para RFP CA-02)

```
COMPLIANCE LFPDPPP                       97/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ EXCELENTE

✓ Consents activos             98.2%  (147 de 150 clientes)
⚠ RtBF requests pendientes     2      (atender en 48h)
✓ Aviso de privacidad         v2026.03 vigente
✓ Audit log                   28 días retención
✓ Datos en jurisdicción MX    100%
```

**Compliance Score — fórmula**:

```
score = round(
  0.30 * (% consents activos / total clientes) +
  0.25 * (100 si RtBF requests pendientes < 5 días else degradar) +
  0.15 * (100 si aviso privacidad vigente) +
  0.15 * (100 si audit log activo) +
  0.15 * (100 si todos datos en MX)
)

≥ 95 = excelente · 85-94 = bueno · 70-84 = atención · < 70 = crítico
```

Componente nuevo: `<ComplianceScore breakdown />`.

#### Sección 6 — Adoption Tracker

```
ADOPCIÓN DE LA PLATAFORMA          Última semana

Por rol:
BA          ████████████████░░░░  82%   12 de 14 activos
Gerente     ████████████████████ 100%   3 de 3
Supervisor  ████████████████████ 100%   1 de 1
Admin       ████████████████████ 100%   1 de 1

Por tienda:
Polanco         ████████████████░░░░  85%
Perisur         █████████░░░░░░░░░░░  45%   ← atención
Santa Fe        ███████████████████░  95%
```

**Cálculo**: usuario activo = al menos 1 interaction registrada en últimos 7 días.

Componente nuevo: `<AdoptionTracker byRole byStore />`.

#### Sección 7 — Gobernanza del sistema

YA EXISTE en código (`admin-home.tsx`). Solo necesita:
- Conectar a `<PreviewDialog>` (FIX 2 del Día 1)
- Mantener: usuarios, permisos, catálogo, plantillas, AuditLog

#### Sección 8 — Alertas + System Health

- **System Health**: estado de integraciones (POS, WhatsApp API, e-commerce), uptime últimos 7 días
- **Alertas críticas operacionales**: RtBF pendientes, consents masivos por expirar, integraciones caídas
- **Audit log** (de la sección 7, también referenciado aquí)

---

## 4. Component Inventory

### 4.1 Existentes (reusar sin cambios)

| Componente | Ubicación | Uso |
|---|---|---|
| `<BarChart>` | `components/charts/` | Ranking, mix |
| `<LineChart>` | `components/charts/` | Tendencias, sparklines grandes |
| `<ScatterPlot>` | `components/charts/` | Adopción vs ventas (Supervisor opcional) |
| `<Heatmap>` | `components/charts/` | Si se decide usar (12 regiones) |
| `<SplitBar>` | `components/charts/` | Mix LCM/YSL |
| `<Sparkline>` | `components/charts/` | Hero, tendencias compactas |
| `<StatusLight>` | `components/charts/` | Semáforo de tiendas |
| `<RankCard>` | `components/charts/` | Ranking top/bottom |
| `<DashBlock>` | `features/dashboards/components/_shared/` | Contenedor de sección |
| `<DashHeader>` | `features/dashboards/components/_shared/` | Header con título + filtros |
| `<DashKpi>` | `features/dashboards/components/_shared/` | Stat card primitivo |
| `<AuditLog>` | `features/admin/components/` | Audit log Admin |

### 4.2 Adapters a crear (después de FIX 3 audit)

| Adapter | De → A | Razón |
|---|---|---|
| `toSparklinePoints` | `getSparklineData` output → `<Sparkline>` props | Shape mismatch probable |
| `toBarChartData` | `getBaRanking` output → `<BarChart>` props | TBD según audit |
| (otros) | TBD | Determinados por el audit del FIX 3 |

### 4.3 Nuevos a construir

| Componente | Sirve para | Prioridad | Día |
|---|---|---|---|
| `<FilterBar>` | Filtros reutilizables por rol | CRÍTICA | 2 |
| `<PeriodPicker>` | Selector de período (parte de FilterBar) | CRÍTICA | 2 |
| `<PreviewDialog>` | Dialog "funcionalidad en preview" Admin | BAJA | 1 (FIX 2) |
| `<AlertCard>` | Alert primitive con severity | ALTA | 2-3 |
| `<AlertBanner>` | Banner top colapsible | ALTA | 2-3 |
| `<AlertBadge>` | Badge en título de sección | ALTA | 2-3 |
| `<ComparisonTable>` | Tabla con columna delta (BA Sec 1) | MEDIA | 3 |
| `<ConversionBar>` | Barra horizontal con línea de referencia | MEDIA | 3 |
| `<HeroBlock>` | Hero pattern (1 big + 3 small) | ALTA | 3 |
| `<PacingText>` / `<ProjectionChart>` | Pacing + forecast | MEDIA | 3-4 |
| `<CoachingInsightCard>` | Insight derivado | MEDIA | 4 |
| `<Funnel>` | Conversion funnel | ALTA | 4 |
| `<BADrillDownModal>` | Modal con summary del BA | ALTA | 4-5 |
| `<StoreHealthCard>` | Card con health score por tienda | ALTA | 5 |
| `<StoreDrillDownModal>` | Modal de tienda | ALTA | 5 |
| `<BestPracticeInsight>` | Insight cross-store | MEDIA | 5 |
| `<StrategicInsight>` | Insight nacional Admin | MEDIA | 6 |
| `<ComplianceScore>` | Score 0-100 LFPDPPP | ALTA (RFP) | 6 |
| `<AdoptionTracker>` | Barras de adopción por rol/tienda | MEDIA | 6 |
| `<MiniCalendar>` | Calendar para eventos VIP (opcional) | BAJA | 7 |

### 4.4 Utilities/Helpers a crear

| Helper | Sirve para | Día |
|---|---|---|
| `lib/format/number.ts` | Currency compact/full, percentage, large counts | 2 |
| `lib/format/date.ts` | Relativa/corta/larga | 2 |
| `lib/dashboard/pacing.ts` | Cálculo de pacing y forecast | 3 |
| `lib/dashboard/insights.ts` | Algoritmos de coaching, best practices, strategic | 4-6 |
| `lib/dashboard/health-score.ts` | Cálculo store health score | 5 |
| `lib/dashboard/compliance-score.ts` | Cálculo compliance LFPDPPP | 6 |
| `lib/dashboard/adapters.ts` | Adapters query → chart props | 2 |

---

## 5. Implementation Plan

### Status hoy (mié 20 may)

- ✅ Workshop de diseño completo (este documento)
- 🟡 FIX 2 + FIX 3 lanzados en paralelo (revisar resultados)

### Plan día por día

| Día | Fecha | Foco | Entregable concreto |
|---|---|---|---|
| **2** | **jue 21 may** | Infraestructura compartida | `<FilterBar>`, `<PeriodPicker>`, formatters, adapters (post audit), `<AlertCard>`+`<AlertBanner>`+`<AlertBadge>`, `<HeroBlock>` |
| **3** | **vie 22 may** | BA Dashboard | Implementar las 5 secciones + hero, conectar a queries reales, empty states, pacing text |
| **4** | **sáb 23 may** | Gerente Dashboard | Implementar 6 secciones + hero, `<CoachingInsightCard>`, `<Funnel>`, `<BADrillDownModal>`, banner top de alertas |
| **5** | **dom 24 may** | Supervisor Dashboard | Implementar 8 secciones + hero, `<StoreHealthCard>`, `<StoreDrillDownModal>`, `<BestPracticeInsight>`, multi-line tendencias |
| **6** | **lun 25 may** | Admin Dashboard | Implementar 8 secciones + hero, `<ComplianceScore>`, `<AdoptionTracker>`, `<StrategicInsight>`, KPIs nacionales |
| **7** | **mar 26 may** | RF-49 Exportación | Instalar SheetJS, agregar handlers Export a todos los reportes/dashboards, mappers a Excel/CSV |
| **8** | **mié 27 may** | UX polish + alertas UX | Refinamiento visual, animaciones sutiles, drill-down modales completos, dark mode si tiempo |
| **9** | **jue 28 may** | RF-50 Mobile verification | Testing en iPad real, ajustes responsive, touch interactions |
| **10** | **vie 29 may** | Buffer + commit final + demo prep | Bugfixes, grabación demo, screenshots, push final, prep pitch del 3 jun |

### Por dashboard: orden de implementación intra-día

Para días 3-6, el orden recomendado dentro del día:

1. **Estructura + Hero** (45-90 min) — layout, hero block, conexión a queries del hero
2. **Secciones principales** (3-4 horas) — secciones 1-4 en orden, una por una
3. **Sección de acción** (45 min) — última sección con alerts integradas
4. **Empty states + drill-down modales** (1 hora) — los detalles UX
5. **Smoke test + commit** (30 min) — typecheck, test, commit, push

### Quality gates por día

- `pnpm typecheck` verde antes de commit
- `pnpm test` verde (tests existentes no romperse)
- Lighthouse score >= 90 mobile (Day 9 verification)
- Cada dashboard renderiza con seed real sin runtime errors
- Empty states verificados artificialmente (period sin data)

### Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Charts retro-compat necesita refactor | Media | Audit del FIX 3 lo detecta; adapter en lib/dashboard/adapters.ts |
| `<Funnel>` complejo, toma > 1 día | Media | Versión MVP día 4 (sin animaciones), refinamiento día 8 |
| Mobile breaking en iPad | Media | Testing temprano cada día, no esperar día 9 |
| Compliance Score requiere modelo de Consent.expiresAt no existente | ALTA | Aproximar con default (90 días tras consent), documentar deuda F4 |
| RtBF requests tracking inexistente | ALTA | Mostrar `0 pendientes` por default; documentar como F4 |

---

## 6. Appendix — patrones de código

### 6.1 Server Component pattern (página de dashboard)

```typescript
// app/(app)/gerente/page.tsx
import { getSession } from "@/server/auth/session";
import { ManagerDashboard } from "@/features/dashboards/components/manager-dashboard";
import {
  getSalesAmount, getSalesByBrand, getBaRanking, /* ... */
} from "@/features/dashboards/server/queries";
import { parseFilters } from "@/lib/dashboard/parse-filters";

export default async function GerentePage({ searchParams }: { searchParams: Record<string, string> }) {
  const session = await getSession();
  const staff = await userToStaff(session.userId);
  const filters = parseFilters(searchParams, { defaultPeriod: "mtd" });

  // Paralelo: todas las queries del Gerente
  const [
    salesAmount, salesByBrand, baRanking, operationalAlerts,
    /* ... */
  ] = await Promise.all([
    getSalesAmount(staff, filters),
    getSalesByBrand(staff, filters),
    getBaRanking(staff, filters),
    getOperationalAlerts(staff, filters),
    /* ... */
  ]);

  return (
    <ManagerDashboard
      filters={filters}
      data={{ salesAmount, salesByBrand, baRanking, operationalAlerts, /* ... */ }}
    />
  );
}
```

### 6.2 FilterBar pattern (Client Component)

```typescript
// features/dashboards/components/_shared/filter-bar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

type RoleConfig = {
  period: boolean;
  store: boolean;
  brand: boolean;
  baId: boolean;
};

export function FilterBar({ roleConfig, scopeOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="filter-bar">
      {roleConfig.period && <PeriodPicker value={searchParams.get("period") ?? "mtd"} onChange={(v) => updateFilter("period", v)} />}
      {roleConfig.store && <StoreSelect options={scopeOptions.stores} value={searchParams.get("storeId")} onChange={(v) => updateFilter("storeId", v)} />}
      {roleConfig.brand && <BrandSelect value={searchParams.get("brand")} onChange={(v) => updateFilter("brand", v)} />}
      {roleConfig.baId && <BaSelect options={scopeOptions.bas} value={searchParams.get("baId")} onChange={(v) => updateFilter("baId", v)} />}
    </div>
  );
}
```

### 6.3 Alert primitive

```typescript
// features/dashboards/components/_shared/alert-card.tsx
type Severity = "critical" | "warning" | "info";

export function AlertCard({ severity, title, description, action }: Props) {
  return (
    <div className={`alert-card alert-${severity}`}>
      <div className="alert-icon">{iconForSeverity(severity)}</div>
      <div className="alert-content">
        <p className="alert-title">{title}</p>
        {description && <p className="alert-description">{description}</p>}
      </div>
      {action && <a href={action.href} className="alert-action">{action.label} →</a>}
    </div>
  );
}
```

### 6.4 Number formatting

```typescript
// lib/format/number.ts
export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString("es-MX")}`;
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatPercentDelta(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}pp`;
}
```

---

## Fin del documento

Cualquier cambio a este spec requiere actualizar la versión en el header y dejar nota de qué cambió. Para implementación, este documento es la fuente de verdad de la Etapa 2.
