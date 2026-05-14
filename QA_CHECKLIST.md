# QA Checklist — Clienteling iPad

Matriz de pruebas a recorrer por **ambos integrantes** del equipo antes de marcar el sprint listo. Marca `[x]` cuando completes el flujo. Si encuentras un bug, abre Issue con label `bug` y referencia el ítem (ej. "QA: BA-3.2").

## Setup previo

- [ ] Cloné y `pnpm install` corrió sin errores
- [ ] `pnpm dev` arrancó en `http://localhost:3000`
- [ ] `pnpm typecheck` pasó
- [ ] `pnpm test` pasó (58 tests al cierre de F3.11)

---

## BA · Beauty Advisor

> Login: rol **BA**, PIN cualquier 6 dígitos.

### BA-1 · Landing "Hoy" (`/ba`)

- [ ] **BA-1.1** — Saluda con "Demo User" y fecha actual
- [ ] **BA-1.2** — 3 stats visibles (Citas hoy / Pendientes / Meta del mes)
- [ ] **BA-1.3** — Gauge "Meta del mes" muestra 72% + monto $1,184,020
- [ ] **BA-1.4** — 4 quick actions con link funcional (Nueva clienta / Buscar / Registrar venta / Agendar cita)
- [ ] **BA-1.5** — "Próximos eventos · 45 días" muestra cumpleaños y reposiciones
- [ ] **BA-1.6** — Lista de pendientes (5+ filas) con CTAs visibles
- [ ] **BA-1.7** — Agenda hoy + preview mañana muestran citas con avatar y BrandTag

### BA-2 · Clientas (`/ba/clients`)

- [ ] **BA-2.1** — Tabla con header (CLIENTA · EMAIL / TELÉFONO / SEGMENTO / LTV / ÚLTIMA VISITA)
- [ ] **BA-2.2** — Buscar por nombre/email filtra en vivo
- [ ] **BA-2.3** — Chips de segmento (Todas / VIP / Recurrente / Nueva / En riesgo) con counts
- [ ] **BA-2.4** — Click en chip filtra la tabla
- [ ] **BA-2.5** — Click en una fila abre el perfil
- [ ] **BA-2.6** — Sólo "Clientas" queda marcada en la sidebar (NO también "Hoy")

### BA-3 · Crear clienta (`/ba/clients/new`)

- [ ] **BA-3.1** — Stepper de 3 pasos visible (Datos básicos / Intereses / Aviso de privacidad)
- [ ] **BA-3.2** — Paso 1: campos requeridos validan al dar "Continuar" sin llenar (bordes rojos + mensajes)
- [ ] **BA-3.3** — Paso 1: dropdown lada muestra "MX +52" (sin duplicar "MX MX")
- [ ] **BA-3.4** — Paso 1: campo teléfono no permite escribir más de 10 dígitos
- [ ] **BA-3.5** — Paso 1: campo fecha de nacimiento permite seleccionar cualquier fecha
- [ ] **BA-3.6** — Paso 1: chips de género y rango de edad seleccionables
- [ ] **BA-3.7** — Paso 2: 3 cards (Skincare / Maquillaje / Fragancia) con chips multi-select
- [ ] **BA-3.8** — Paso 2: cards de "¿Cuándo aplica rutina?" + "Nivel de elaboración"
- [ ] **BA-3.9** — Paso 2: campo alergias acepta texto libre
- [ ] **BA-3.10** — Paso 3: aviso de privacidad scrollable visible
- [ ] **BA-3.11** — Paso 3: 3 toggles (SMS / Email / WhatsApp)
- [ ] **BA-3.12** — Paso 3: checkbox de aceptación
- [ ] **BA-3.13** — Paso 3: card de "Resumen para guardar" muestra los datos capturados
- [ ] **BA-3.14** — Si la validación falla, el wizard salta al primer paso con errores
- [ ] **BA-3.15** — Submit exitoso → redirige al perfil de la clienta creada
- [ ] **BA-3.16** — La nueva clienta aparece en `/ba/clients` al volver

### BA-4 · Perfil de clienta (`/ba/clients/[id]`)

- [ ] **BA-4.1** — Hero card con avatar + nombre + tier + segmento
- [ ] **BA-4.2** — 5 botones de acción: Recomendar / Registrar visita / Registrar venta / Dar muestra / Seguimiento
- [ ] **BA-4.3** — KPI strip (LTV / Ticket promedio / Última compra)
- [ ] **BA-4.4** — Side panel con cards: Luxe Circle / Piel / Intereses / Citas / Eventos / Afinidades / Consentimientos / ARCO
- [ ] **BA-4.5** — Tabs (Timeline / Compras / Recs / Muestras / Mensajes / Consentimientos) funcionan

### BA-5 · Registrar venta (`/ba/clients/[id]/sale`)

- [ ] **BA-5.1** — Selector de productos abre lista filtrable
- [ ] **BA-5.2** — Agregar producto incrementa unidades y total
- [ ] **BA-5.3** — Cambiar método de pago no rompe el form
- [ ] **BA-5.4** — Submit registra la venta y vuelve al perfil con la compra visible

### BA-6 · Registrar visita (`/ba/clients/[id]/visit`)

- [ ] **BA-6.1** — Selector de tipo (consultation / makeup / facial / etc.) funciona
- [ ] **BA-6.2** — Selector de razón coherente
- [ ] **BA-6.3** — Submit registra la visita

### BA-7 · Citas (`/ba/appointments` y `/ba/appointments/new`)

- [ ] **BA-7.1** — Calendario muestra citas de hoy y siguientes días
- [ ] **BA-7.2** — Vistas día / semana / mes accesibles
- [ ] **BA-7.3** — Agendar nueva cita exitoso (clienta + slot + duración + tipo)
- [ ] **BA-7.4** — Reagendar / cancelar / confirmar una cita existente

### BA-8 · Catálogo (`/ba/catalog`)

- [ ] **BA-8.1** — Grid de productos visible
- [ ] **BA-8.2** — Filtros (marca / categoría) responden
- [ ] **BA-8.3** — Click en producto abre detalle con info + stock por tienda

### BA-9 · Muestras (`/ba/samples`)

- [ ] **BA-9.1** — KPI de muestras dadas + tasa de conversión
- [ ] **BA-9.2** — Lista de muestras con estado (pendiente / convertida)
- [ ] **BA-9.3** — Inventario por marca visible

### BA-10 · Compras (`/ba/purchases`)

- [ ] **BA-10.1** — Lista de historial de ventas
- [ ] **BA-10.2** — Filtros por marca / búsqueda funcionan

### BA-11 · Seguimiento (`/ba/followup`)

- [ ] **BA-11.1** — Composer de comunicaciones (template + variables)
- [ ] **BA-11.2** — Preview de WhatsApp se ve realista
- [ ] **BA-11.3** — Submit registra la comunicación

### BA-12 · Mi KPI (`/ba/performance`)

- [ ] **BA-12.1** — Dashboard "Mi desempeño" carga
- [ ] **BA-12.2** — KPIs de impacto / cartera / adopción visibles
- [ ] **BA-12.3** — Ranking sin nombres en el bloque de adopción

### BA-13 · Consultoría (desde perfil → "Recomendar")

- [ ] **BA-13.1** — Wizard de 5 pasos carga
- [ ] **BA-13.2** — Sugerencias de producto basadas en perfil
- [ ] **BA-13.3** — Basket final con QR fake para handoff
- [ ] **BA-13.4** — Submit cambia el status de la recomendación

---

## Manager

> Login: rol **Manager**, PIN cualquier 6 dígitos.

- [ ] **MGR-1** — Landing `/manager` muestra dashboard de equipo
- [ ] **MGR-2** — `/manager/team` lista BAs con KPIs
- [ ] **MGR-3** — `/manager/segments` muestra los 4 segmentos con sample clients
- [ ] **MGR-4** — `/manager/devices` lista de dispositivos + reasignación posible
- [ ] **MGR-5** — `/manager/reports` carga reportes disponibles para el rol
- [ ] **MGR-6** — Sidebar correcta: sólo el item activo queda marcado

---

## Supervisor

> Login: rol **Supervisor**, PIN cualquier 6 dígitos.

- [ ] **SUP-1** — Landing `/supervisor` carga dashboard de zona
- [ ] **SUP-2** — `/supervisor/zone` muestra performance multi-tienda
- [ ] **SUP-3** — `/supervisor/tickets` inbox de tickets, abrir un ticket OK
- [ ] **SUP-4** — Comentar en un ticket persiste el comentario
- [ ] **SUP-5** — `/supervisor/reports` reportes accesibles
- [ ] **SUP-6** — Permisos: NO debería poder hacer acciones de write fuera de su scope

---

## HQ

> Login: rol **HQ**, PIN cualquier 6 dígitos.

- [ ] **HQ-1** — Landing `/hq` carga dashboard estratégico
- [ ] **HQ-2** — `/hq/integrations` muestra estado de las 4 integraciones (POS / ECOM / DIAGNOSIS / WHATSAPP)
- [ ] **HQ-3** — `/hq/devices` fleet global accesible
- [ ] **HQ-4** — `/hq/reports` reportes a nivel HQ
- [ ] **HQ-5** — Read-only en su mayoría: confirma que no aparezcan CTAs de write

---

## Admin

> Login: rol **Admin**, PIN cualquier 6 dígitos.

- [ ] **ADM-1** — Landing `/admin` (governance hub) con cards: usuarios / permisos / catálogo / audit
- [ ] **ADM-2** — `/admin/users` lista de usuarios con roles y scope
- [ ] **ADM-3** — `/admin/segments` 4 segmentos visibles
- [ ] **ADM-4** — `/admin/integrations` 2-col grid con status chips
- [ ] **ADM-5** — `/admin/audit` log de eventos
- [ ] **ADM-6** — Admin tiene acceso a TODAS las pestañas (sidebar muestra todo)

---

## Cross-cutting

- [ ] **CR-1** — Hot reload funciona: editar un archivo refresca el navegador sin reiniciar el server
- [ ] **CR-2** — Crear una clienta como BA, cerrar sesión, volver a entrar como BA → la clienta sigue ahí
- [ ] **CR-3** — Cambiar de rol via logout y nuevo login NO se rompe
- [ ] **CR-4** — Navegación entre tabs es fluida (<200 ms percibidos)
- [ ] **CR-5** — Sin errores en la consola del navegador (ignorar warnings de Heurio si está la extensión)
- [ ] **CR-6** — `pnpm build` corre sin warnings críticos

---

## Plantilla para reportar bugs

Cuando encuentres algo:

```
**Item:** QA: <CODIGO> (ej. BA-3.4)
**Rol:** <BA / Manager / Supervisor / HQ / Admin>
**Pasos:**
1. ...
2. ...
**Esperado:**
**Obtenido:**
**Screenshot/console log:** (adjuntar)
**Severidad:** blocker / major / minor / cosmetic
```

Abre la Issue en GitHub con labels `bug` + `qa-<rol>`. Asigna a quien vea primero el bug; etiqueta a la otra persona para visibilidad.
