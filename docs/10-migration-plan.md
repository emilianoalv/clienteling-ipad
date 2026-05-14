# 10 · Plan de migración

> **Alcance:** cómo pasar del prototipo Babel-standalone actual al diseño Next.js descrito en `01–09`.
> Es el único documento que asume cronología; el resto describe el estado objetivo.

## Premisas

- El prototipo **funciona** y se sigue usando para demos. La migración corre en paralelo, sin romper `start.cmd` ni el archivo `app.html`.
- Trabajo iterativo en una rama larga (`feat/nextjs-migration`) con merges periódicos a `main` tras cada fase verde.
- Cada fase tiene tests E2E que reproducen el flujo equivalente del prototipo (mismo viewport iPad 1194×834).

## Fases

```text
[F0] Bootstrap  →  [F1] Tokens & DS  →  [F2] Auth & Shell  →  [F3] Dominios uno a uno  →  [F4] Datos reales  →  [F5] Apagado del prototipo
```

---

### F0 · Bootstrap (1-2 días)

Inicializar el proyecto Next.js sin tocar el prototipo.

- [ ] `pnpm create next-app@latest` con TypeScript, App Router, ESLint.
- [ ] Mover el prototipo a `legacy/` (queda servible vía `start.cmd`).
- [ ] Configurar `tsconfig.json` con los aliases `@/*` (`01-architecture.md` § Path aliases).
- [ ] Instalar dependencias base: `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `next-intl`, `date-fns`, `nanoid`.
- [ ] Configurar `eslint-plugin-boundaries` con las reglas de `01-architecture.md` § Capas.
- [ ] Crear esqueleto de carpetas `src/{app,components,features,lib,hooks,stores,providers,server,types,config,messages}` con `index.ts` vacíos.
- [ ] CI: lint + typecheck.

**DoD**: `pnpm dev` arranca, `pnpm lint` y `pnpm typecheck` verdes, página vacía en `/`.

---

### F1 · Tokens y design system (3-5 días)

Portar los tokens visuales y los primitivos. Sin lógica de dominio.

- [ ] Copiar `styles/tokens.css` → `src/app/globals.css` (importado).
- [ ] Crear `src/components/primitives/`: `Button`, `Input`, `Textarea`, `Select`, `Avatar`, `Chip`, `BrandTag`, `Divider`, `ProgressBar`, `SegmentedControl`, `Icon` (con los 47 SVG mapeados).
- [ ] Crear `src/components/patterns/`: `KpiCard`, `KvRow`, `StatStrip`, `ActionTile`, `AlertRow`, `EventRow`, `EmptyState`, `Stepper`, `SectionHeader`, `SyncBadge`, `StatusLight`.
- [ ] Crear `src/components/charts/`: `Sparkline`, `BarChart`, `SplitBar`, `LineChart`, `Donut`, `Funnel`, `ScatterPlot`, `Heatmap`, `CoverageGrid`.
- [ ] Crear `src/components/feedback/`: `Toast`, `Modal`, `ConfirmDialog`, `Drawer`.
- [ ] Configurar Storybook con una historia por componente (3 estados mínimo).
- [ ] Cada componente con TSDoc + test unitario (Vitest + Testing Library).

**DoD**: Storybook navega los 30+ componentes; los tests pasan; ningún componente importa de `features/`.

**Riesgo**: tentación de portar `LxStat` y `DKpi` por separado. **Decisión**: ambos colapsan en `KpiCard`. Documentado en `04-ui-components.md`.

---

### F2 · Auth, Shell y primer rol (1 semana)

Hacer login → home BA funcional con datos mock (los mismos arrays de hoy).

- [ ] Configurar `next-intl` con `es-MX` y `en-US` (ver `09-i18n.md`).
- [ ] Implementar `(auth)/login` y `(app)/layout.tsx` con `Shell` + `Rail` + `TopBar`.
- [ ] Server Action `signInAction` con PIN (6 dígitos), lockout y cookie firmada (ver `06-routing-and-rbac.md`).
- [ ] Middleware con redirect por rol.
- [ ] Repositorios en memoria que envuelven los arrays de `app/data.jsx` (importados desde `legacy/`).
- [ ] `src/app/(app)/ba/page.tsx` con `<GreetingHero>`, `<QuickActions>`, `<TodayAgenda>`, `<UpcomingEventsList>`, `<PendingTasks>`.

**DoD**: login + home BA visible con datos reales del mock. E2E Playwright que cubre `/login → /ba`.

**Riesgo**: hidratar `currentUser` desde cookie en RSC sin pasar por `window.CURRENT_BA`. Plan: `requireSession()` server-only inyectado vía `<SessionProvider>` para cliente.

---

### F3 · Migración por dominios (4-6 semanas)

Cada dominio se cierra de punta a punta antes de pasar al siguiente. Orden sugerido por riesgo creciente:

1. **`clients`** (perfil 360 + lista + alta) — es el dominio más grande, validar pronto el patrón.
2. **`appointments`** (calendario + new + detail modal).
3. **`catalog`** (read-only, fácil).
4. **`samples`** + **`purchases`** (incluye basket).
5. **`consultation`** (wizard 5 pasos).
6. **`communications`** + **`followup`**.
7. **`dashboards`** (los 4: BA, Manager, Supervisor, HQ).
8. **`devices`** + **`tickets`** + **`reports`**.
9. **`admin`** (último: depende de los demás para mostrar gobernanza).

Plantilla por dominio:

```text
1. Tipos en src/types/<aggregate>.ts.
2. Repositorio mock que lee del array actual.
3. Schemas zod en features/<dominio>/schemas/.
4. Server Actions en features/<dominio>/actions/.
5. Hooks (TanStack) en features/<dominio>/hooks/.
6. Componentes específicos en features/<dominio>/components/.
7. Pages en src/app/(app)/<role>/<dominio>/.
8. Tests: unit + integration + E2E.
9. Borrar el screens-*.jsx legacy correspondiente.
```

**Hitos**:
- Tras `clients` cerrado: revisión de patrón con el equipo, ajustar si hace falta.
- Tras `dashboards` cerrado: la app es funcionalmente equivalente al prototipo.

**DoD por dominio**: la página equivalente del prototipo se puede borrar sin pérdida de funcionalidad.

---

### F4 · Datos reales (cuando exista backend) (2-3 semanas)

Sustituir los repositorios mock por implementaciones contra la API real.

- [ ] Definir contratos OpenAPI / tRPC con el equipo backend.
- [ ] Implementar `db/` (Drizzle/Prisma) o cliente HTTP.
- [ ] Reemplazar repositorios uno a uno. **No** se tocan servicios ni features.
- [ ] Migrar lockout y sesión a tablas reales.
- [ ] Activar Service Worker + IndexedDB para offline (reemplaza `ScreenSync` placeholder).

**DoD**: el mock en memoria queda solo en tests; producción habla con la API real.

---

### F5 · Apagado del prototipo (1-2 días)

- [ ] Mover `legacy/` fuera del repo (rama `archive/prototype` o repo separado).
- [ ] Borrar `app.html`, `start.cmd`, `design-canvas.jsx`, `tweaks-panel.jsx`, `ios-frame.jsx`.
- [ ] Actualizar `README` raíz para apuntar a la nueva app.
- [ ] Publicar.

---

## Estrategia de paridad

Cada flujo del prototipo tiene un test E2E que se ejecuta en **ambos** (`legacy` y nuevo) hasta el final de F3. Cuando el nuevo lo pasa, el legacy se retira.

Lista de flujos críticos a cubrir antes de F5:

1. Login + lockout tras 3 PINs incorrectos.
2. Home BA: tarjeta de saludo + agenda hoy + pendientes + eventos próximos.
3. Lista de clientas con búsqueda + filtro de segmento.
4. Alta de clienta (wizard 3 pasos).
5. Perfil 360: tabs + panel lateral + acciones rápidas.
6. Registrar visita y registrar venta: actualización de stats + reflejo en timeline.
7. Calendario semana / día / mes; reagendar y cancelar cita.
8. Crear cita nueva con búsqueda de cliente + slots.
9. Consultation 5 pasos.
10. Catalog browse + product detail.
11. Followup composer + WhatsApp preview.
12. Basket: handoff y total con loyalty + IVA.
13. Samples: registrar + seguimiento + conversión.
14. Comm log con filtros.
15. Dashboards: KPIs por rol coinciden con el prototipo.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Divergencia visual entre legacy y nuevo | Tokens compartidos (mismo `tokens.css`). Storybook con snapshots visuales en F1. |
| Reescritura paralela demasiado larga | Cerrar dominios uno a uno con DoD claro. No empezar otro hasta merge a `main`. |
| Lock-in con TanStack / Zustand | Aislados detrás de hooks de cada feature. Cambiarlos sería un refactor local. |
| Backend real cambia el contrato | F3 termina con repos mock; F4 cambia solo la implementación. |
| `window.CURRENT_BA` referenciado desde muchos sitios | Buscar y reemplazar antes de F3; en su lugar `requireSession()` / `useSession()`. |
| Eventos `lx-state` referenciados desde muchos sitios | Sustituir por `invalidateQueries`; la fase F3 lo hace dominio a dominio. |
| Falta de cobertura de tipos en el código actual | Empezar F3 declarando los tipos exactos del agregado antes de portar nada. |

## Checklist visual de progreso

```text
[ ] F0 · Bootstrap
[ ] F1 · Tokens y design system
[ ] F2 · Auth, Shell, home BA
[ ] F3.1 · clients
[ ] F3.2 · appointments
[ ] F3.3 · catalog
[ ] F3.4 · samples + purchases
[ ] F3.5 · consultation
[ ] F3.6 · communications + followup
[ ] F3.7 · dashboards
[ ] F3.8 · devices + tickets + reports
[ ] F3.9 · admin
[ ] F4 · datos reales + offline
[ ] F5 · apagado prototipo
```

## Métricas para saber que vamos bien

- Cobertura tipada: 100 % del nuevo código en `strict: true` sin `any`.
- Tests: unit + integration ≥ 80 % statements en `features/<dominio>/services/`.
- E2E: 15 flujos críticos verdes en CI antes de F5.
- Lint: 0 violaciones de `eslint-plugin-boundaries`.
- Bundle: página `/ba` < 200 KB JS inicial (sin chunks lazy).
- Time to interactive en iPad 1194×834: < 1.5 s tras login.

## Una nota sobre velocidad

El prototipo Babel-standalone arranca rápidísimo porque no hay build. La app Next.js compensará con:
- RSC: el HTML llega ya hidratado con datos.
- Streaming de respuestas grandes.
- Code-splitting por route group.

Pero **medirlo** desde F2, no asumirlo.
