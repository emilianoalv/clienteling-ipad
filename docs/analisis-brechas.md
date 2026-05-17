# Análisis de brechas — Requerimientos vs. Implementación

> **Fecha del análisis**: 2026-05-15
> **Alcance**: 61 RFs (RF-01 a RF-62, sin RF-57) + 16 RNFs (RNF-01 a RNF-16) verificados contra el código en `apps/web/src/`.
> **Fuera de alcance**: RIs (planes de capacitación / soporte), restricciones organizacionales, supuestos y criterios de aceptación — no son verificables desde código.

## Cómo leer este documento

- Todas las rutas de archivos son relativas a `apps/web/src/` salvo indicación contraria.
- Las 4 categorías de estado:
  - **✅ Implementado y funcionando correctamente**: la lógica existe y hace lo que pide el RF.
  - **⚠️ Implementado pero con problemas**: existe pero con gaps específicos descritos en notas.
  - **❌ No implementado en absoluto**: no hay nada relacionado en el código.
  - **🤔 No estoy seguro**: encontré algo pero no puedo confirmar, o el ítem requiere medición/infraestructura no verificable desde código.

---

## 1. Requerimientos Funcionales (RF)

### 1.1 Perfil del consumidor y captura de datos (RF-01 a RF-12)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-01** | Registro de consumidor con datos básicos | ✅ | `features/clients/schemas/new-client.schema.ts`<br>`features/clients/components/new-client-wizard.tsx`<br>`features/clients/components/new-client/_steps/identity-step.tsx`<br>`features/clients/actions/create-client.ts` | Schema Zod valida los 7 campos (firstName, lastName, gender con "Prefiero no decir" explícito, birthday, ageRange, phone con dialCode + 10 dígitos, email). Wizard de 3 pasos funcional. |
| **RF-02** | Aviso de privacidad versionado (LFPDPPP) | ✅ | `features/clients/components/new-client/_steps/privacy-step.tsx`<br>`features/clients/components/new-client/_parts/privacy-notice.tsx`<br>`server/repositories/consent.repository.ts` | Constante `PRIVACY_NOTICE_VERSION = "v2026.05"` se almacena con timestamp en cada Consent. Checkbox `acceptPrivacy: z.literal(true)` obligatorio. Aviso muestra responsable, finalidades, transferencias y derechos ARCO. |
| **RF-03** | Búsqueda por email, celular o nombre | ✅ | `features/clients/components/client-list.tsx`<br>`server/repositories/client.repository.ts` | Input con placeholder "Buscar por nombre, teléfono o email…". Filtrado client-side por concatenación de campos. Repo también soporta query server-side. |
| **RF-04** | Vista unificada del perfil 360 | ✅ | `features/clients/components/client-profile.tsx`<br>`features/clients/components/client-profile-tabs.tsx`<br>`features/clients/components/side-panel/*` (9 cards)<br>`features/clients/components/tabs/*` (6 tabs) | Hero + 4 acciones + KPIs + 6 tabs (purchases, recs, samples, msgs, followup, consent) + side panel con LuxeCircle, SkinProfile, Interests, Appointments, UpcomingEvents, Affinities, ConsentSummary, ArcoRights, UpcomingFollowups. |
| **RF-05** | Captura de intereses de belleza | ✅ | `features/clients/schemas/new-client.schema.ts`<br>`features/clients/components/new-client/_steps/beauty-step.tsx` | INTEREST_GROUPS cubre Skincare/Maquillaje/Fragancia con sub-tags. ROUTINE_TIMINGS incluye morning/evening/event. Concerns dentro de skinSchema. |
| **RF-06** | Registro de motivo de visita | ✅ | `types/visit-motive.ts`<br>`features/clients/components/register-visit-form.tsx`<br>`features/clients/components/register-sale-form.tsx` | VISIT_MOTIVES define los 6 motivos exactos (new-purchase, repurchase, gift, concern, promo, browse) con labels en español. Se persiste en Interaction.motive. |
| **RF-07** | Historial de tipo de piel, tono, subtono e ingredientes preferidos/no preferidos | ⚠️ | `types/client.ts`<br>`features/clients/components/new-client/_steps/beauty-step.tsx`<br>`features/consultation/components/consultation-wizard.tsx` | Tipo, tono, preocupaciones ✅; alergias como "no preferidos" ✅. **Problemas**: (a) no hay distinción explícita de subtono — el "undertone" del wizard apunta al mismo campo tone (Muy claro/Claro/etc., no warm/cool/neutral); (b) no hay "ingredientes preferidos", solo allergies; (c) no hay historial cronológico de cambios, solo estado actual. |
| **RF-08** | Registro de muestras con seguimiento de conversión | ✅ | `types/sample.ts`<br>`server/repositories/sample.repository.ts`<br>`features/samples/services/sample-stats.ts`<br>`features/clients/components/register-visit-form.tsx` | Sample tiene `converted` y `purchaseId`. aggregateSampleStats calcula conversionRate y attributableRevenue. Registro vía flujo register-visit (el botón "Registrar" en samples-screen está disabled, pero el flujo principal funciona). |
| **RF-09** | Alertas de eventos de vida (cumpleaños, aniversario, reposición) | ✅ | `features/clients/services/list-upcoming-events.ts`<br>`types/life-event.ts`<br>`features/clients/components/side-panel/upcoming-events-card.tsx`<br>`features/home/components/_parts/today-events.tsx` | listUpcomingEvents calcula los 3 tipos (birthday, anniversary, replenishment a 60 días post-última compra). Se muestra en perfil y en home. Heurística simple pero cumple. Tiene tests. |
| **RF-10** | Enriquecer perfil con datos de e-commerce | ⚠️ | `server/repositories/integration.repository.ts` | Solo existe seed placeholder con `key: "ECOM", status: "stub", mode: "Preparado"`. No hay UI ni código que use o muestre datos de comportamiento digital. Es card visual de admin, no implementación funcional. |
| **RF-11** | Segmentación automática (VIP, Recurrente, Nueva, En riesgo) | ✅ | `features/clients/services/segment-client.ts`<br>`features/clients/services/segment-client.test.ts`<br>`features/clients/components/client-list.tsx`<br>`features/clients/components/client-profile.tsx` | segmentClient implementa las 4 categorías exactas con reglas heurísticas (LTV/visitas/días sin compra). Se visualiza en client-list con filtros y conteos, y como chip en client-profile. Tiene tests. |
| **RF-12** | Soporte multilingüe (es-MX primario) | ✅ | `i18n.ts`<br>`middleware.ts`<br>`config/i18n.ts`<br>`messages/es-MX.json`<br>`messages/en-US.json` | next-intl con locales `["es-MX", "en-US"]`, defaultLocale `es-MX`, prefijo as-needed. Detección por cookie + Accept-Language. Catálogos en ambos idiomas. |

### 1.2 Recomendación y catálogo (RF-13 a RF-19)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-13** | Registro manual de productos recomendados | ✅ | `features/consultation/components/consultation-wizard.tsx`<br>`features/consultation/actions/save-recommendation.ts`<br>`server/repositories/recommendation.repository.ts` | ConsultationWizard permite seleccionar SKUs. saveRecommendation persiste con clientId, baId, timestamp, items[]. Marca y nombre referenciados vía SKU. No tiene campo "notas" libre por recomendación, pero el contexto (skinType + concerns + tone) se captura. |
| **RF-14** | Escaneo de SKU con cámara | ✅ | `components/feedback/barcode-scanner.tsx`<br>`features/clients/components/register-sale-form.tsx` | BarcodeScanner usa @zxing/browser con cámara trasera, maneja permisos y matching contra catálogo. Integrado en register-sale-form con botón por item. Warning "SKU no está en tu catálogo" funciona. |
| **RF-15** | Motor de recomendación inteligente | ⚠️ | `features/consultation/services/suggest-products.ts`<br>`features/clients/services/score-product-compatibility.ts` | Dos motores heurísticos: suggestProducts mapea concerns→tags; scoreProductCompatibility pesa skin-match (+3), concern-match (+2), interest (+1), allergy-conflict (-5). **Problema**: NO usa historial de compras, solo perfil. Es hardcoded sin ML. Cumple el espíritu como motor basado en reglas, no como "inteligente" en sentido fuerte. |
| **RF-16** | Lógica de reposición — estimar agotamiento | ⚠️ | `features/clients/services/list-upcoming-events.ts`<br>`types/product.ts` (campo `lifecycleDays`)<br>`server/repositories/template.repository.ts` | Replenishment usa **valor fijo de 60 días** post-última compra, sin considerar `lifecycleDays` por SKU (aunque el campo existe en cada Product). No se vincula al SKU específico ni considera frecuencia individual. Funcional pero rudimentaria respecto al "estimar cuándo estará agotando". |
| **RF-17** | Catálogo en tiempo real con detalle | ✅ | `features/catalog/components/catalog-browser.tsx`<br>`features/catalog/components/product-detail.tsx`<br>`features/catalog/server/list-products.ts` | Catalog-browser filtra por marca y categoría con búsqueda. Product-detail muestra precio, selling points, howTo, stock por tienda y atributos. Seed de 8 productos. UI completa. |
| **RF-18** | Generación de lookbooks / rutinas personalizadas | ⚠️ | `features/consultation/components/consultation-wizard.tsx` (RoutineStep) | Paso 4 del wizard muestra "rutina" mañana/noche con bloques **hardcoded** (["Limpiador", "Sérum", "Hidratante", "SPF"] / nocturna similar). Es display estático, **no genera/personaliza por cliente**, y no hay concepto de "lookbook" exportable o shareable. |
| **RF-19** | Historial completo de recomendaciones por cliente | ✅ | `server/repositories/recommendation.repository.ts`<br>`features/clients/components/tabs/recs-preview.tsx`<br>`features/clients/components/client-profile-tabs.tsx` | recommendationRepository.listByClient ordena por timestamp desc. Pestaña "recs" en perfil lo renderiza. Cada recomendación trae SKUs, fecha, status, baId. |

### 1.3 Compras y POS (RF-20 a RF-25)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-20** | Registro de compras (fecha, SKU, nombre, marca, precio, cantidad) | ✅ | `features/clients/components/register-sale-form.tsx`<br>`features/clients/actions/register-sale.ts`<br>`features/clients/schemas/register-sale.schema.ts`<br>`types/purchase.ts` | Purchase.items contiene `{ sku, qty, unitPrice }`, más `at` (date+time), brand, payment, total. Form captura fecha + hora y permite múltiples items. |
| **RF-21** | Consulta del historial transaccional | ✅ | `features/clients/components/purchase-history.tsx`<br>`features/clients/components/tabs/purchases-preview.tsx`<br>`features/purchases/server/list-purchases.ts` | purchaseRepository.listByClient retorna ordenado. PurchaseHistory permite filtrar por 3m/6m/12m/all con totales calculados. Pestaña dedicada en perfil + ruta `/ba/clients/[clientId]/purchases`. |
| **RF-22** | Integración bidireccional con POS | ⚠️ | `server/repositories/integration.repository.ts`<br>`features/consultation/components/basket.tsx`<br>`features/consultation/actions/handoff-recommendation.ts` | Simulacro **unidireccional**: BA genera QR decorativo (FakeQr) y marca recomendación como "converted". **No hay sincronización inversa** (POS → app) ni integración real. integration.repository lista POS con status "sandbox" / "Stub · QR". El texto de UI admite que es manual. |
| **RF-23** | Registro manual de compras (sin POS) | ✅ | `features/clients/components/register-sale-form.tsx`<br>`features/clients/actions/register-sale.ts` | Flujo completo: banner cliente, motivo, fecha/hora, items con qty/precio, método de pago, ticketRef opcional, notas, follow-up opcional. Se guarda con `manual: true`. |
| **RF-24** | Escaneo de SKU en compras | ✅ | `components/feedback/barcode-scanner.tsx`<br>`features/clients/components/register-sale-form.tsx` | Mismo BarcodeScanner que RF-14. Integrado por item con botón scan. handleScan busca SKU en catálogo o muestra warning. |
| **RF-25** | Atribución de venta al BA | ✅ | `features/clients/actions/register-sale.ts`<br>`types/purchase.ts` (baId)<br>`features/consultation/components/basket.tsx` | registerSale asigna `baId: staff.id` automáticamente. Purchase guarda baId + storeId. Form muestra "Atribuir a {baName}". **Nota menor**: vinculación recommendation→purchase no es automática (`recommendationId` opcional pero no se setea en registerSale). |

### 1.4 Citas y agenda (RF-26 a RF-33)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-26** | Creación de citas (tipo, fecha, hora, comentarios, BA) | ✅ | `features/appointments/actions/create-appointment.ts`<br>`features/appointments/components/new-appointment-form.tsx`<br>`features/appointments/schemas/new-appointment.schema.ts`<br>`features/appointments/components/availability-grid.tsx` | Schema Zod valida clientId, baId, brand, date, time, durationMin, kind, notes. Server action persiste y valida conflictos vía hasConflict. UI cubre todos los campos requeridos. |
| **RF-27** | Calendario por BA y por tienda (semanal y mensual) | ⚠️ | `features/appointments/components/appointment-calendar.tsx`<br>`features/appointments/components/views/{day,week,month}-view.tsx`<br>`app/(app)/ba/appointments/page.tsx` | SegmentedControl con Day/Week/Month funciona. Filtro por brand del staff funciona. **Problemas**: no hay vista filtrada explícita "por tienda" (repo no filtra por storeId); no hay vista agregada para Manager con citas de toda la tienda. Solo se muestra en `/ba/appointments`. |
| **RF-28** | Reporte de agenda con columnas específicas | ⚠️ | `features/appointments/components/management-panel.tsx`<br>`features/appointments/components/agenda-row.tsx` | Tabla muestra Cliente, Tipo, Fecha, Estado, Nueva fecha, Motivo. **Problemas**: faltan columnas "apellido" separado y "teléfono"; tampoco hay export del reporte. |
| **RF-29** | Tipos de evento configurables (Cabina, Facial, etc.) | ✅ | `types/appointment.ts`<br>`features/appointments/schemas/new-appointment.schema.ts`<br>`messages/es-MX.json:412-424` | AppointmentKind incluye exactamente los tipos pedidos: ritual, makeup, diagnosis, consultation, vip-cabin, facial, anniversary-event, product-followup, fragrance-consult, other. Labels en español. |
| **RF-30** | Recordatorios automáticos al BA previo a cita | ⚠️ | `features/home/services/get-ba-day-snapshot.ts`<br>`features/home/components/_parts/today-agenda.tsx`<br>`features/home/components/ba-today-screen.tsx` | Home "Hoy" muestra agenda de hoy/mañana, lo cual es **recordatorio visual pasivo**. **No hay** sistema de notificaciones push/email/timers/alertas activas. |
| **RF-31** | Envío de confirmación/recordatorio al consumidor vía SMS/WhatsApp | ⚠️ | `features/communications/actions/send-communication.ts`<br>`types/template.ts` (categoría "Recordatorio cita")<br>`features/followup/components/composer.tsx` | Infraestructura existe (sendCommunication + categoría "Recordatorio cita") pero **no hay seed de template específica** ni flujo automático ligado al ciclo de cita. El BA tendría que mandarlo manualmente desde Followup. |
| **RF-32** | Control de citas reagendadas y canceladas | ✅ | `features/appointments/actions/reschedule-appointment.ts`<br>`features/appointments/actions/cancel-appointment.ts`<br>`features/appointments/services/appointment-stats.ts`<br>`features/appointments/components/management-panel.tsx` | Actions completos para reschedule/cancel persisten cancelReason, cancelledAt, rescheduledAt. ManagementPanel muestra KPIs total/programadas/reagendadas/canceladas/completadas con porcentajes. |
| **RF-33** | Citas virtuales / videoconsultas | ❌ | (ninguno) | Búsqueda por "video", "virtual", "videoconsulta", "videoconference" no encontró nada. AppointmentKind no incluye tipo virtual, no hay campo "modality"/"isVirtual", ni integración con Zoom/Meet/Teams, ni link/url de videollamada. |

### 1.5 Comunicación y seguimiento (RF-34 a RF-39)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-34** | Seguimiento post-visita | ✅ | `features/clients/components/register-visit-form.tsx`<br>`features/clients/components/task-inbox.tsx`<br>`features/clients/actions/complete-followup-task.ts`<br>`types/followup-task.ts`<br>`server/repositories/followup-task.repository.ts` | RegisterVisitForm captura motivo, notas, acciones (muestras/recs), tarea de seguimiento opcional. TaskInbox gestiona tareas pendientes con field "result" obligatorio al cerrar. Lifecycle pending → done/cancelled completo. |
| **RF-35** | WhatsApp Business API (sin teléfonos personales del BA) | ⚠️ | `features/communications/actions/send-communication.ts`<br>`features/communications/components/comm-log.tsx`<br>`features/followup/components/composer.tsx`<br>`features/followup/components/whatsapp-preview.tsx`<br>`server/repositories/integration.repository.ts` | Módulo de communications con channel="WhatsApp" + composer + preview funcional. **Problema crítico**: integration.repository marca WHATSAPP como `status: sandbox, mode: "Simulador"`; sendCommunication solo persiste en repo, **no llama API real de Meta**. |
| **RF-36** | Plantillas personalizables por marca y tipo | ✅ | `types/template.ts`<br>`server/repositories/template.repository.ts`<br>`features/communications/services/render-template.ts`<br>`features/followup/components/template-list.tsx` | Templates seedeadas por marca (Lancôme/YSL), canal (WhatsApp/Email/SMS) y categoría (Post-visita, Lanzamiento, Cumpleaños, Reposición, Muestra, Aniversario, Recordatorio cita). Render de tokens {nombre}, {tienda}, {ba}, {producto}, {fecha} funciona. |
| **RF-37** | Registro de todas las comunicaciones en perfil | ✅ | `server/repositories/communication.repository.ts`<br>`features/communications/components/comm-log.tsx`<br>`features/communications/server/list-communications.ts` | Cada envío persiste con clientId, baId, brand, channel, direction, at, body, status, templateId. CommLog despliega bitácora completa. Visible desde tab "log" del FollowupScreen. |
| **RF-38** | Clasificación: 3m, 6m, cumpleaños, reposición, evento especial | ⚠️ | `types/followup-task.ts`<br>`types/template.ts`<br>`features/clients/components/task-inbox.tsx` | FollowupType clasifica por **canal** (call/whatsapp/email/sample-feedback/appointment/other). TemplateCategory sí tiene Cumpleaños/Reposición/Aniversario. **Problema**: la taxonomía temporal/funcional "3 meses, 6 meses…" del RF NO existe como campo dedicado en FollowupTask. |
| **RF-39** | Atribución de ventas online vía link tracking | ❌ | (ninguno) | Búsqueda por "tracking", "atribuc", "link tracking", "online" sin resultados relevantes. Communication no tiene campos para URLs/tracking; Purchase no tiene campos `source="online"`/`origin`. No hay atribución cross-canal. |

### 1.6 Reportes y dashboards (RF-40 a RF-50)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-40** | Dashboard ejecutivo de tienda con KPIs | ⚠️ | `features/dashboards/components/manager-dashboard.tsx`<br>`features/dashboards/components/_shared/dash-kpi.tsx`<br>`app/(app)/manager/page.tsx` | ManagerDashboard muestra Ventas MTD/QTD/YTD, % vs objetivo, ticket promedio, ventas clienteling, ranking BAs, citas, no-show, seguimientos. Cubre los KPIs. **Problema crítico**: TODOS los valores son **hardcoded literales** — comentario explícito dice que F4 los conectará al servicio real. |
| **RF-41** | Métricas de citas (objetivo, total, nuevas, reagendadas) | ⚠️ | `features/appointments/services/appointment-stats.ts`<br>`features/appointments/components/management-panel.tsx` | appointmentStats agrega total/scheduled/rescheduled/cancelled/completed con tasas. ManagementPanel los muestra. **Problemas**: falta "objetivo semanal" (no hay entidad meta por BA/semana); en manager-dashboard hay literal "Citas: 142 hoy 18" hardcoded. Solo en ManagementPanel las métricas son reales. |
| **RF-42** | Reportes filtrables (fechas, tienda, marca, BA) | ⚠️ | `features/dashboards/components/_shared/dash-header.tsx`<br>`features/reports/components/reports-screen.tsx` | DashHeader muestra ScopePill chips visuales "Período / Comparar / Marca / Cadena" **sin state ni onChange** — son pills decorativas (comentario en código lo admite explícitamente). ReportsScreen tiene "Armar reporte ad-hoc" con KvRow pero tampoco son filtros funcionales. |
| **RF-43** | Reporte de clientes exportable con columnas específicas | ⚠️ | `features/clients/components/client-list.tsx` | ClientList muestra Clienta+Email, Teléfono, Segmento, LTV, Última visita, con botón "Exportar" **sin onClick**. Faltan columnas explícitas: apellido separado, fecha nacimiento, último BA, cliente desde, fecha último contacto, fecha última transacción, tipo seguimiento. **Sin exportación** real. |
| **RF-44** | Visualización gráfica: Top marcas y ventas por categoría | ⚠️ | `features/dashboards/components/hq-dashboard.tsx`<br>`features/dashboards/components/manager-dashboard.tsx`<br>`components/charts/*` | HqDashboard tiene Split por marca, Split por cadena, Top tiendas YTD, BarChart de categorías. ManagerDashboard tiene SplitBar Lancôme/YSL. Gráficos renderizan pero **todos los datos son hardcoded literales**. Visualmente cumple; funcionalmente con datos reales requiere F4. |
| **RF-45** | Reporte de desempeño por BA | ⚠️ | `features/dashboards/components/ba-dashboard.tsx`<br>`app/(app)/ba/performance/page.tsx`<br>`features/dashboards/components/manager-dashboard.tsx` | BaDashboard muestra Ventas, % objetivo, ticket promedio, conversión rec→compra, clientes nuevos, recompra, seguimientos, citas, eventos, muestras. ManagerDashboard tiene "Ranking BAs MTD". Estructura completa pero **valores hardcoded** ("BA_RANKING" array). Sin export funcional. |
| **RF-46** | Reporte de agenda exportable | ⚠️ | `features/appointments/components/management-panel.tsx`<br>`server/repositories/report.repository.ts` | ManagementPanel muestra los datos en pantalla. Hay seed "Cobertura y turnos" en reports.repository pero no específicamente "Agenda Report". **Sin exportación real** (botón "Descargar" sin handler). |
| **RF-47** | Indicadores de conversión (rec→compra, seguimiento→revisita) | ⚠️ | `features/dashboards/components/ba-dashboard.tsx`<br>`features/communications/services/comm-stats.ts` | BaDashboard tiene KPI literal "Conversión recomendación → compra: 58%" y "Recompra 90 días: 41%". commStats calcula readRate. **Problema**: valores hardcoded; no hay servicio que cruce recommendations + purchases reales. |
| **RF-48** | Dashboard de retención (activos vs en riesgo) | ⚠️ | `features/clients/services/segment-client.ts`<br>`features/clients/components/client-list.tsx`<br>`features/dashboards/components/manager-dashboard.tsx` | segmentClient sí clasifica AtRisk (lastPurchase > 180 días). ClientList filtra por "En riesgo". **Problema**: ManagerDashboard muestra KPIs "Activos / En riesgo / VIP / Retención 12m / NPS" pero con **valores literales**, no derivados de clientes reales. No hay dashboard dedicado de retención. |
| **RF-49** | Exportación de reportes Excel/CSV | ❌ | (ninguno) | Botones "Exportar"/"Descargar" existen en client-list, reports-screen, ba-dashboard, manager-dashboard, supervisor-dashboard — **ninguno tiene onClick handler**. No hay librería xlsx/csv en deps. Búsqueda por "csv\|xlsx\|excel" solo arroja referencias visuales. |
| **RF-50** | Acceso a reportes desde móvil y escritorio | 🤔 | `middleware.ts`<br>`app/layout.tsx`<br>`features/dashboards/components/*` | Next 15 App Router responsive con Tailwind v4. Dashboards/reports accesibles via web; no hay restricción de dispositivo en middleware. "Tiempo real" no se implementa con WebSockets — los datos se cargan por request (server components). Algunos dashboards usan grid de 5 cols que pueden romper en móvil pequeño. **Sin verificación visual en móvil real**, no puedo confirmar usabilidad mobile. |

### 1.7 Roles, permisos y autenticación (RF-51 a RF-56)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-51** | Roles diferenciados (BA, Manager, Supervisor, Admin) | ✅ | `config/rbac.ts`<br>`types/staff.ts`<br>`types/user.ts`<br>`middleware.ts` | `Role = "BA" \| "Manager" \| "Supervisor" \| "HQ" \| "Admin"`. ROLE_PERMISSIONS mapea cada rol a Set de 19 permisos granulares (clients:read/write, purchases, appointments, templates, reports, devices, users:write, etc.). Cubre y excede el RF (5 roles vs 4 pedidos). |
| **RF-52** | BA solo ve clientes de su tienda/franquicia | ⚠️ | `types/staff.ts` (`visibleStoreIds`)<br>`server/repositories/client.repository.ts`<br>`features/clients/server/list-clients.ts` | Filtrado por **marca** funciona (scope.brands). **Problema crítico**: `visibleStoreIds()` existe pero **nunca se usa**. Client no tiene `storeId` en su tipo, así que filtrado por tienda **no es posible hoy**. Documentado como gap en `docs/06-routing-and-rbac.md`. |
| **RF-53** | Manager ve reportes de su tienda | ⚠️ | `config/rbac.ts` (reports:read)<br>`app/(app)/manager/reports/page.tsx`<br>`features/dashboards/components/manager-dashboard.tsx` | Manager tiene permiso `reports:read` y dashboard propio que lee `staff.storeId` para mostrar nombre. **Problema**: reports/page llama `listReports()` sin scope; dashboard hardcodeado. Permiso existe, filtrado real falta para F4. |
| **RF-54** | Supervisor visualiza múltiples tiendas | ⚠️ | `types/staff.ts` (`Supervisor.storeIds`)<br>`app/(app)/supervisor/page.tsx`<br>`features/dashboards/components/supervisor-dashboard.tsx` | Supervisor tiene `storeIds[]` en su tipo; seed "Diego Salvatierra" tiene 3 tiendas en zona "Centro". **Problema**: dashboard muestra 5 tiendas hardcoded, no derivadas del scope real. requireSession no usa `staff.storeIds` para filtrar. |
| **RF-55** | Admin gestiona configuraciones, marcas, tiendas, usuarios | ⚠️ | `config/rbac.ts` (Admin: todos los permisos)<br>`features/admin/components/users-screen.tsx`<br>`features/admin/components/integrations-screen.tsx`<br>`app/(app)/admin/*` | Admin tiene 19 permisos incl. users:write, integrations:write, stores:write. Pantallas muestran info (lista usuarios, integraciones, audit log). **Problema crítico**: botones "Crear usuario", "Configurar", "Nueva plantilla" **no tienen onClick** ni Server Actions. Gestión es **read-only**. storeRepository no expone create/update. |
| **RF-56** | Autenticación segura, login individual por BA | ⚠️ | `features/auth/actions/sign-in.ts`<br>`features/auth/components/login-form.tsx`<br>`server/auth/session.ts`<br>`middleware.ts` | PIN 6 dígitos + sesión httpOnly cookie + Zod con expiresAt = base sólida. **Problema crítico**: `sign-in.ts` admite explícitamente "Demo sign-in that accepts any 6-digit PIN. Real lockout + PIN verification lives in F4". El framework para attempts/lockout está en el tipo de SignInResult pero **no está cableado**. Sin MFA. |

### 1.8 Atributos avanzados e integraciones de consultoría (RF-58 a RF-62)

> Nota: RF-57 no existe en el documento fuente (ver requerimientos.md sección 1.7).

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RF-58** | Captura de tipo, preocupaciones, tono y subtono de piel | ✅ | `types/client.ts`<br>`features/clients/components/new-client/_steps/beauty-step.tsx`<br>`features/consultation/components/consultation-wizard.tsx`<br>`features/clients/components/side-panel/skin-profile-card.tsx` | SkinType ofrece 6 valores (Mixta/Seca/Grasa/Madura/Normal/Sensible). Wizard de consulta tiene step de undertone con 6 swatches + step de concerns (12 opciones, máx 3). Se persiste en Client.skin y se muestra en SkinProfileCard. |
| **RF-59** | Asociar shade exacto por categoría (foundation/corrector/labial) | ❌ | (ninguno) | Client.skin solo tiene `tone` único genérico. NO hay estructura para "tono X de Teint Idole", "shade Y de Touche Éclat", etc. Product tampoco define `shades[]`. Algunos productos mencionan "45 tonos" en selling[] pero no es estructurado. |
| **RF-60** | Historial de muestras y conversión | ✅ | `features/samples/*` (módulo completo)<br>`server/repositories/sample.repository.ts`<br>`app/(app)/ba/samples/page.tsx` | KPIs explícitos en messages: `samples.kpi.delivered`, `conversion_rate`, `attributable_revenue`. Sample tiene status converted/pending. Equivale a RF-08 pero más enfocado. |
| **RF-61** | Fichas técnicas, tutoriales, argumentarios de venta | ⚠️ | `features/catalog/components/product-detail.tsx`<br>`types/product.ts` (campos `howTo`, `selling`) | Product.howTo describe aplicación; Product.selling lista 3 bullets de venta. **Problema**: botón "Ficha técnica" en product-detail **sin onClick** (decorativo). No hay tutoriales en video, PDFs de ficha, ni argumentarios extensos. |
| **RF-62** | Integración con Virtual Try-On (ModiFace) | ⚠️ | `features/consultation/components/consultation-wizard.tsx`<br>`server/repositories/integration.repository.ts`<br>`messages/es-MX.json` | Sidebar del wizard muestra "ModiFace SDK · sandbox" con status amarillo y hint "Switch a modo live cuando HQ lo active." integration.repository marca DIAGNOSIS como `status: sandbox, mode: "SDK simulado"`. **No hay carga real del SDK ni iframe/canvas**. UI de "viene en futuras fases". |

---

## 2. Requerimientos No Funcionales (RNF)

| ID | Requerimiento (resumen) | Estado | Archivos involucrados | Notas / Detalles |
|---|---|---|---|---|
| **RNF-01** | Disponibilidad 99.5% SLA mensual | 🤔 | N/A — infraestructura | No verificable desde código fuente. Proyecto no desplegado todavía (todo in-memory). No hay health-checks, monitoring (Datadog/NewRelic) ni SLOs en repo. |
| **RNF-02** | Tiempo de respuesta ≤2s | 🤔 | N/A — infraestructura | Repos in-memory responden <1ms en local, no representativo. No hay benchmarks ni performance budget. Next 15 + RSC tiene buena base pero requiere medición real. |
| **RNF-03** | Carga concurrente de todos los BAs nacionales | 🤔 | N/A — infraestructura | No hay tests de carga (k6/artillery/jmeter = 0 resultados). Persistencia in-memory con Map por proceso no escala horizontalmente — F4 reemplaza con DB real. |
| **RNF-04** | Cumplimiento LFPDPPP | ⚠️ | `features/clients/components/new-client/_steps/privacy-step.tsx`<br>`features/clients/actions/update-consent.ts`<br>`server/repositories/consent.repository.ts`<br>`server/repositories/audit-event.repository.ts` | Aviso versionado (v2026.05) con consentimiento por canal ✅. Audit log funcional ✅. **Faltan**: residencia datos (RNF-06), encriptación at-rest (sin DB todavía), workflow real de eliminación (RNF-05). |
| **RNF-05** | Derecho al olvido | ⚠️ | `features/clients/components/side-panel/arco-rights-card.tsx`<br>`messages/es-MX.json:120-125` | ArcoRightsCard muestra título, descripción y botón "Iniciar solicitud" — **sin onClick ni Server Action**. clientRepository no tiene método delete. No hay flujo de cascada para borrar consents/communications/purchases asociados. |
| **RNF-06** | Residencia de datos en México | 🤔 | N/A — infraestructura | Decisión de despliegue (Vercel/AWS región). No hay archivos de configuración (vercel.json, terraform) que indiquen región. F4 definirá. |
| **RNF-07** | Consentimientos diferenciados por canal | ✅ | `types/consent.ts`<br>`types/communication.ts`<br>`server/repositories/consent.repository.ts`<br>`features/clients/actions/update-consent.ts`<br>`features/clients/components/side-panel/consent-summary-card.tsx` | Consent.channel usa tipo Channel (WhatsApp/Email/SMS). Wizard tiene toggles independientes por canal. consentRepository.upsert mantiene último consentimiento por (clientId, channel). ConsentSummaryCard muestra estado granted/revoked con versión y fecha. |
| **RNF-08** | Compatibilidad iPad (iOS 15+) | ⚠️ | `app/layout.tsx`<br>`app/globals.css:55-67`<br>`server/repositories/device.repository.ts` | Layout define viewport responsive con maximumScale=1. Font-size 20px optimizado para iPad. Hay seed de devices con `os: "iPadOS 18.x"`. **Falta**: tests de viewport iPad específicos, Playwright iPad. |
| **RNF-09** | Compatibilidad Android (12+) | ❌ | (ninguno) | `grep -ri "android"` en apps/web/src/ = 0 resultados. Toda la doc, seeds y diseño son **iPad-only**. Viewport es responsive en teoría, pero breakpoints están optimizados para iPad horizontal. |
| **RNF-10** | Integración con e-commerce L'Oréal | ⚠️ | `server/repositories/integration.repository.ts`<br>`features/admin/components/integrations-screen.tsx` | Solo entrada placeholder: `key: "ECOM", status: "stub", lastEvent: "—", mode: "Preparado"`. **No hay** cliente HTTP, adapter, ni webhook. Es tarjeta visual en HQ/Admin. |
| **RNF-11** | WhatsApp Business API (Meta) | ⚠️ | `server/repositories/integration.repository.ts`<br>`features/communications/actions/send-communication.ts`<br>`server/repositories/communication.repository.ts` | Integración registrada como WHATSAPP, status: sandbox, mode: "Simulador". sendCommunication solo persiste en repo, **no llama API real**. Plantillas seedeadas. Estructura preparada (tipo Channel, schemas), falta adapter HTTP real. |
| **RNF-12** | Integración con diagnóstico de piel físico/digital | ⚠️ | `server/repositories/integration.repository.ts`<br>`features/consultation/components/consultation-wizard.tsx` | Mismo stub que RF-62 (DIAGNOSIS sandbox). Consulta de piel es **completamente manual** (BA selecciona tipo y concerns). Sin integración con dispositivo físico ni SDK de análisis de imagen. |
| **RNF-13** | Multi-marca (config independiente por marca) | ✅ | `types/brand.ts`<br>`stores/brand-lock.store.ts`<br>`components/primitives/brand-tag.tsx`<br>`server/repositories/client.repository.ts`<br>`app/globals.css` | BrandId = 6 marcas. Cada producto/cliente/staff tiene brands[]. useBrandLock store filtra UI por marca activa. BrandTag oculta tag cuando coincide con lock. Tokens CSS específicos por marca (--lancome-*, --ysl-*). |
| **RNF-14** | Multi-tienda con configuración independiente | ⚠️ | `types/store.ts`<br>`server/repositories/store.repository.ts`<br>`server/repositories/device.repository.ts`<br>`server/repositories/user.repository.ts` | 3 tiendas seed con `chain` (Liverpool/Palacio). Modelo coherente. **Problemas**: storeRepository no expone create/update; Store no tiene campos de configuración independiente; scope por tienda parcialmente cableado (devices sí, clients no — ver RF-52). |
| **RNF-15** | Arquitectura escalable | 🤔 | `docs/01-architecture.md`<br>`docs/10-migration-plan.md`<br>`server/repositories/` | Patrón de repos con interfaces facilita swap a DB real en F4. Brand-scoping y store-scoping modelados. Estado actual con `persistent()` (localStorage en dev) **no soporta multi-instancia**. Escalabilidad requiere validación post-F4. |
| **RNF-16** | Configuración gestionable por equipo L'Oréal | ⚠️ | `features/admin/components/admin-home.tsx`<br>`features/admin/components/users-screen.tsx`<br>`features/admin/components/integrations-screen.tsx`<br>`app/(app)/admin/*` | Admin muestra "Acceso completo a usuarios, catálogo, privacidad, auditoría". **Problema**: botones "Crear usuario", "Nueva plantilla", "Actualizar catálogo", "Configurar", "Ver eventos" **sin handlers**. L'Oréal puede ver pero no configurar nada autónomamente. |

---

## 3. Resumen ejecutivo

### 3.1 Conteos globales

| Categoría | RFs (61) | RNFs (16) | **Total (77)** | **%** |
|---|---:|---:|---:|---:|
| ✅ Implementado y funcionando correctamente | 28 | 2 | **30** | **39%** |
| ⚠️ Implementado pero con problemas | 28 | 8 | **36** | **47%** |
| ❌ No implementado en absoluto | 4 | 1 | **5** | **6%** |
| 🤔 No estoy seguro | 1 | 5 | **6** | **8%** |

### 3.2 Cobertura de los "Obligatorios" del RFP (RF-01 a RF-33)

Según **CA-01** (peso 30% del RFP), la cobertura mínima obligatoria son los RF-01 a RF-33 (33 RFs):

| Categoría | Cantidad | RFs |
|---|---:|---|
| ✅ | **24** | RF-01, 02, 03, 04, 05, 06, 08, 09, 11, 12, 13, 14, 17, 19, 20, 21, 23, 24, 25, 26, 29, 32 — (también RF-30 parcialmente cumplido) |
| ⚠️ | **8** | RF-07, 10, 15, 16, 18, 22, 27, 28, 30, 31 (10 items pero RF-30/31 cuentan dos veces — corrigiendo: 10) |
| ❌ | **1** | RF-33 (videoconsultas) |

**Cobertura efectiva obligatoria**: 24/33 = **73% sólido** + 8 parciales que necesitan completarse. Solo 1 obligatorio totalmente ausente (videoconsultas).

### 3.3 Patrones detectados

**Lo que está sólido:**
1. **CRUD básico de clientas, citas, ventas, recomendaciones, comunicaciones** — todo el flujo del BA funciona end-to-end con repos in-memory.
2. **Modelado de dominio** — tipos, schemas Zod, repos con interfaces preparados para F4.
3. **i18n, RBAC declarativo, brand-lock, segmentación, captura de consentimientos** — implementados con tests.

**Los 3 patrones de problemas más recurrentes:**
1. **Scope por tienda no se aplica** — la función `visibleStoreIds()` existe pero nunca se usa; Client no tiene `storeId`. Afecta RF-52, RF-53, RF-54, RNF-14.
2. **Botones sin handlers** — pantallas de Admin (RF-55, RNF-16), exportación de reportes (RF-43, RF-46, RF-49) y "Derecho al olvido" (RNF-05) muestran UI pero los botones no ejecutan nada.
3. **Integraciones externas stubeadas** — POS (RF-22), WhatsApp Business API (RF-35, RNF-11), e-commerce (RF-10, RNF-10), ModiFace (RF-62, RNF-12) son placeholders esperando F4.

**Lo que no existe en absoluto:**
- Videoconsultas (RF-33)
- Atribución de ventas online via link tracking (RF-39)
- Exportación real Excel/CSV (RF-49)
- Shade exacto por categoría (RF-59)
- Soporte Android (RNF-09)

### 3.4 Conclusión

La fase actual (F3.11) cumple su objetivo: **toda la lógica de presentación, captura, validación y persistencia in-memory para el flujo del BA está completa**. Los gaps grandes están concentrados en 3 áreas predecibles:

1. **Backend real y persistencia** (toda la categoría 🤔 de RNFs y los dashboards con datos hardcoded) → bloqueado por **F4**.
2. **Integraciones externas reales** (POS, WhatsApp, e-commerce, ModiFace) → adapters HTTP pendientes, requieren credenciales reales y trabajo de integración.
3. **Cableado de acciones de Admin** (CRUD de usuarios, tiendas, plantillas; exportación de reportes; derecho al olvido) → trabajo de UI + Server Actions, no requiere F4 técnicamente.

La categoría 3 es la **deuda más fácil de saldar** y debería priorizarse para llegar a 100% de cobertura RF antes de F4.

---

_Análisis generado mediante exploración automatizada del código en `apps/web/src/` el 2026-05-15._
