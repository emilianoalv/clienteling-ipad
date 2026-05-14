# 05 · Módulos de dominio (features)

> **Alcance:** qué hace cada feature, qué expone y qué pantallas / formularios / hooks contiene.
> Para el catálogo de UI reutilizable, ver `04-ui-components.md`. Para rutas y permisos, ver `06-routing-and-rbac.md`.

## Mapa de archivos actuales → features

| Archivo actual (`app/`) | Feature objetivo (`src/features/`) |
|---|---|
| `screens-home.jsx` (login + home) | `auth/` (login) y `dashboards/` (home por rol) |
| `screens-clients.jsx`, `screens-profile.jsx`, `screens-history.jsx` | `clients/` |
| `screens-ops.jsx` (appointments + followup + basket + samples) | `appointments/`, `communications/`, `purchases/` (basket), `samples/` |
| `screens-newappt.jsx` | `appointments/` |
| `screens-consult.jsx` (consultation + catalog) | `consultation/` y `catalog/` |
| `screens-dash.jsx`, `screens-dashboards.jsx` | `dashboards/` |
| `screens-extra.jsx` (purchases log, commlog, segments, reports, supervisor, admin) | `purchases/`, `communications/`, `clients/` (segments), `reports/`, `dashboards/` (supervisor), `admin/` |

## Convención de cada módulo

Estructura ya descrita en `01-architecture.md`. Aquí el detalle de **qué** vive en cada uno.

---

## `features/auth/`

Login, sesión, lockout, PIN, hidratación de `currentUser`.

| Pieza | Tipo | Notas |
|---|---|---|
| `LoginPage` | Server Component | Vive en `app/(auth)/login/page.tsx`, monta `<LoginForm />` |
| `LoginForm` | Client Component | Persona picker + PIN pad 6 dígitos |
| `signInAction` | Server Action | Valida PIN, marca cookie httpOnly, devuelve `{ ok, reason?, attemptsLeft? }` |
| `signOutAction` | Server Action | Borra cookie + revoca sesión |
| `getSession()` | Server util | Lee/valida la cookie en RSC |
| `useSession()` | Client hook | Suscripción al evento `session:changed` |
| `lockoutPolicy.ts` | Service | 3 fallos en 5 min → 5 min bloqueo (sustituye `app/auth.jsx:98-129`) |
| `personas.ts` | Config | Demo personas para el picker (sólo dev) |

**Decisiones clave**
- Sesión **httpOnly** en cookie firmada (no `localStorage`).
- TTL 12 h como hoy (`LX_SESSION_HOURS`).
- Lockout estado vive en server (Redis o tabla `auth_lockouts`).

---

## `features/clients/`

El módulo más grande. Contiene perfil 360 + alta + listas + historial.

### Componentes principales

| Componente | Origen actual | Tipo |
|---|---|---|
| `ClientList` | `ScreenClients` (`app/screens-clients.jsx:41`) | Server Component (lee server-side), wrapper con `<ClientFilters>` cliente |
| `ClientFilters` | inline en `ScreenClients` | Client Component (search + segment chips) |
| `ClientProfile` | `ScreenClientProfile` (`app/screens-profile.jsx:679`) | Server Component padre |
| `ClientProfileHeader` | inline | Identidad + acciones rápidas |
| `ClientProfileTabs` | inline | 6 tabs (timeline, purchases, recs, samples, msgs, consent) |
| `LuxeCircleCard`, `SkinProfileCard`, `InterestsCard`, `AffinitiesCard`, `UpcomingEventsCard`, `AppointmentsCard`, `AffinitiesCard`, `ArcoRightsCard` | secciones del panel lateral | Client/Server según interactividad |
| `ConsentMatrix` | exportado (`app/screens-profile.jsx:1184`) | Sube a `components/patterns/` si lo usa admin |
| `NewClientWizard` | `ScreenNewClient` (`app/screens-clients.jsx:128`) | Client, 3 pasos: identity / beauty / privacy |
| `RegisterVisitForm` | `ScreenRegisterVisit` | Client, schema-driven (ver `03-design-principles.md`) |
| `RegisterSaleForm` | `ScreenRegisterSale` | Client, integra `ProductPicker` |
| `ProductPicker` | inline en `screens-profile.jsx:358` | Si solo aquí, queda. Si se usa en consultation/basket, mover a `catalog/components/` |
| `HistoryTimeline`, `HistoryPurchases`, `HistoryRecs`, `HistorySamples`, `HistoryMessages` | `screens-history.jsx` | Todas usan la plantilla `HistoryScreen` del design system |

### Hooks

```ts
useClient(id)                  // perfil completo
useClientList({ query, segment, brand })
useClientSegments()            // counts por VIP / Recurrent / New / AtRisk
useClientEvents(id, { windowDays })   // birthdays / anniversary / replenishment
useClientHistory(id, kind)     // timeline | purchases | recs | samples | msgs
```

### Services puros (testables)

```ts
segmentClient(client): "VIP" | "Recurrent" | "New" | "AtRisk"
calculateLevelProgress(client): { current, next, hint, progress }
applyPurchaseToStats(stats, amount): ClientStats   // ← reemplaza la lógica duplicada
listUpcomingEvents(client, opts): Event[]
```

### Server Actions

```ts
createClient(input: NewClientInput)
registerVisit(input: RegisterVisitInput)
registerSale(input: RegisterSaleInput)
updateConsent(clientId, channel, status)
```

### Rutas
- `/ba/clients` — lista
- `/ba/clients/new` — alta
- `/ba/clients/[clientId]` — perfil
- `/ba/clients/[clientId]/timeline` — historial completo (uno por tab)
- `/ba/clients/[clientId]/visit` — registrar visita
- `/ba/clients/[clientId]/sale` — registrar venta

---

## `features/appointments/`

Calendario, creación, gestión (reagendar / cancelar).

### Componentes
- `AppointmentCalendar` (`ScreenAppointments`) con `Day` / `Week` / `Month` views.
- `AppointmentDetailModal` (`app/screens-ops.jsx:543-718`) con modos `view`, `reschedule`, `cancel`.
- `NewAppointmentForm` (`ScreenNewAppointment`).
- `AppointmentsHub` con tabs Calendario + Gestión (`ApptMgmtPanel`).
- `AvailabilityGrid` (refactor del slot picker 4×4).
- `AgendaRow` — específico, queda aquí (no en design system).

### Hooks
```ts
useAppointments({ from, to, baId?, brandId? })
useAvailability(baId, dateISO)
useUpcomingAppointments(clientId)
```

### Services puros
```ts
startOfIsoWeek(date)       // → `lib/date/`
hasConflict(slot, existing)
```

### Server Actions
```ts
createAppointment(input)
rescheduleAppointment(id, newAt)
cancelAppointment(id, reason?)
markCompleted(id)
confirmAppointment(id)
```

### Rutas
- `/ba/appointments` — hub
- `/ba/appointments/new` — wizard
- `/manager/appointments` y `/supervisor/appointments` — mismo hub con scope ampliado

---

## `features/catalog/`

Catálogo de productos por marca, búsqueda, detalle.

### Componentes
- `CatalogBrowser` (`ScreenCatalog`, `app/screens-consult.jsx:174`).
- `ProductDetailPanel` (sticky lateral).
- `ProductGrid` (cards con thumb + brand + precio).
- `BrandFilterTabs`, `CategoryChips`.

### Hooks / Server data
```ts
useProducts({ brand?, category?, query? })
useProduct(sku)
useProductStock(sku, storeId)
```

---

## `features/consultation/`

Diagnóstico 5 pasos: tipo de piel → concerns → undertone → rutina → recomendación.

### Componentes
- `ConsultationWizard` con `Stepper` reutilizable.
- `SkinTypePicker`, `ConcernPills`, `UndertonePicker`, `RoutineSummary`.
- `RecommendationsPanel` — consume `useProducts({ filter })`.
- `ModiFaceCapture` (placeholder hasta integración real).

### Salida
La consulta produce un objeto `Consultation` que se persiste y queda asociado al cliente (timeline + interactions).

---

## `features/samples/`

Registro y seguimiento de muestras + inventario de counter.

### Componentes
- `SampleList` (entregadas esta semana) — `app/screens-ops.jsx:461`.
- `SampleInventoryCard` (right column).
- `GiveSampleDialog` — disparable desde perfil cliente.
- `FollowUpButton` — abre `features/followup/` con contexto pre-llenado.

### Métricas
- Tasa de conversión muestra → compra.
- Stock disponible vs capacidad (alerta < 20 %).

---

## `features/purchases/`

Historial de compras + basket (checkout / handoff POS).

### Componentes
- `PurchasesTable` (`ScreenPurchases`, `app/screens-extra.jsx:9-95`).
- `Basket` (`ScreenBasket`, `app/screens-ops.jsx:382-459`) con `QrTicket` (placeholder), summary, loyalty points.
- `ManualSaleForm` — equivalente a `RegisterSaleForm` pero sin perfil de cliente bloqueado.

### Helpers
```ts
calculateBasketTotals(items): { subtotal, loyaltyPoints, vat, total }
```

---

## `features/communications/`

Bitácora de mensajes + composer + plantillas.

### Componentes
- `CommLog` (`ScreenCommLog`).
- `FollowupComposer` (`ScreenFollowup`, `app/screens-ops.jsx:272-380`) con `TemplatePicker`, `ChannelToggle`, `WhatsAppPreview`.
- `TemplateLibrary` — admin.

### Hooks
```ts
useTemplates({ brand?, channel?, category? })
useCommunications({ from, clientId?, brandId? })
```

### Server Actions
```ts
sendCommunication(input)
saveDraft(input)
```

---

## `features/followup/`

Atajos para seguimientos masivos a clientas (post-visita, cumpleaños, reposición). Comparte composer con `communications/`.

---

## `features/dashboards/`

Vistas analíticas por rol.

| Dashboard | Audiencia | Componente |
|---|---|---|
| `BaDashboard` | BA | refactor de `DashBA` + `ScreenBAPerf` |
| `ManagerDashboard` | Manager | refactor de `DashManager` + `ScreenManager` |
| `SupervisorDashboard` | Supervisor | refactor de `DashSupervisor` + `ScreenSupervisor` |
| `HqDashboard` | HQ / Director | refactor de `DashDirector` + `ScreenHQ` |

Cada dashboard se monta dentro de su `app/(app)/<role>/page.tsx`. Los gráficos se importan de `components/charts/` (`KpiCard`, `LineChart`, `Heatmap`, `ScatterPlot`, `SplitBar`).

### Servicios

```ts
buildBaMetrics(baId, period): BaMetrics
buildStoreMetrics(storeId, period): StoreMetrics
buildZoneMetrics(zoneId, period): ZoneMetrics
buildBusinessMetrics(period): BusinessMetrics
```

Fórmulas (todas testeables aparte):

| Métrica | Fórmula |
|---|---|
| % vs objetivo | `sales / goal` |
| Growth YoY | `(curr - prev) / prev` |
| Conversion | `conversions / total` |
| Sample ROI | `salesAfterSample / sampleCount` |
| Retention 12m | `active12m / baseYearAgo` |
| Adoption | `activeBAs / totalBAs` |

---

## `features/devices/`

Gestión de flota de iPads.

- `DeviceList` (`ScreenDevices`).
- `SyncQueue` (`ScreenSync`).
- `OfflineStatus`.

---

## `features/tickets/`

Sistema de soporte técnico (`ScreenTickets`).

- `TicketList`, `TicketFilters`.
- Métricas de SLA, tiempo medio de resolución.

---

## `features/reports/`

Reportes ejecutivos + constructor ad-hoc.

- `ReportLibrary` (`ScreenReports`).
- `AdHocReportBuilder`.
- Server Action `generateReport(spec): Promise<Blob>` con jobs en cola (BullMQ o equivalente).

---

## `features/admin/`

Gobernanza: usuarios, roles, catálogo, integraciones, auditoría.

- `UserAdmin` (`ScreenAdmin` parte de usuarios).
- `RoleMatrix` (visualización de permisos).
- `CatalogGovernance`.
- `Integrations` (`ScreenIntegrations`).
- `SegmentRules` (`ScreenSegments`) — admin define reglas; el resto consume.
- `AuditLog`.

---

## Cómo coexisten en una página

Una `page.tsx` típica orquesta varios features:

```tsx
// src/app/(app)/ba/page.tsx
import { GreetingHero }       from "@/features/dashboards/components/greeting-hero";
import { QuickActions }       from "@/features/dashboards/components/quick-actions";
import { UpcomingEventsList } from "@/features/clients/components/upcoming-events-list";
import { PendingTasks }       from "@/features/dashboards/components/pending-tasks";
import { TodayAgenda }        from "@/features/appointments/components/today-agenda";

export default async function BaHome() {
  return (
    <>
      <GreetingHero />
      <QuickActions />
      <UpcomingEventsList />
      <div className="grid">
        <PendingTasks />
        <TodayAgenda />
      </div>
    </>
  );
}
```

La página no contiene lógica de dominio: importa, compone, devuelve JSX.

## Reglas de oro entre features

1. Si dos features necesitan **el mismo** componente, sube a `components/patterns/`.
2. Si dos features necesitan **el mismo dato**, sube a `src/server/services/` o `src/types/`.
3. Un feature **no** importa otro feature directo. Para "abrir cliente desde appointments", usa la URL (`<Link href={\`/ba/clients/${id}\`}>`), no un import.
4. Cada feature publica su API en `index.ts`. Los demás solo consumen ese barrel.
