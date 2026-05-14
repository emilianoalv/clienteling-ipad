# 04 · Design system (componentes reutilizables)

> **Alcance:** catálogo de componentes en `src/components/`, agnósticos de dominio.
> Para componentes específicos de un feature, ver `05-feature-modules.md`. Para tokens visuales, ver `08-styling-and-tokens.md`.

## Filosofía

Atomic Design adaptado a 4 niveles. Cada componente:

1. Vive en `src/components/<nivel>/<kebab>.tsx`.
2. Es 100 % presentacional (no llama hooks de dominio, no toca `window.*`).
3. Acepta sólo datos planos vía props (serializables).
4. Soporta el sistema de tokens CSS (`var(--ink)`, `var(--paper)`, etc.).
5. Está documentado por archivo `.stories.tsx` (Storybook).

## Mapa de migración (Lx* → estándar)

| Nombre actual | Nombre objetivo | Carpeta |
|---|---|---|
| `LxAvatar` | `Avatar` | `primitives/` |
| `LxBrandTag` | `BrandTag` | `primitives/` |
| `LxDivider` | `Divider` | `primitives/` |
| `LxStat` | `StatCard` (rename para no confundir con `Stat` HTML) | `patterns/` |
| `LxSpark` | `Sparkline` | `charts/` |
| `LxProgress` | `ProgressBar` | `primitives/` |
| `LxSeg` | `SegmentedControl` | `primitives/` |
| `LxKV` | `KvRow` | `patterns/` |
| `LxRailItem` | `Rail.Item` (sub-componente) | `layout/` |
| `I.<name>` (47 svgs) | `<Icon name="..."/>` | `primitives/` |
| `IpadFrame` | `IpadFrame` | `layout/` |
| `SyncBadge` | `SyncBadge` | `patterns/` |
| `ProfileMenu` | `UserMenu` | `patterns/` |
| `TopBar` | `Shell.TopBar` | `layout/` |
| `Rail` | `Shell.Rail` | `layout/` |
| `Shell` | `Shell` | `layout/` |
| `QuickAction` | `ActionTile` (generalizado) | `patterns/` |
| `PendingRow` | `AlertRow` (generalizado) | `patterns/` |
| `AgendaRow` | (sigue específico) | `features/appointments/` |
| `UpcomingEventRow` | `EventRow` (generalizado) | `patterns/` |
| `DKpi` | `KpiCard` (unificado con `LxStat`) | `patterns/` |
| `DBars` | `BarChart` | `charts/` |
| `DSplit` | `SplitBar` | `charts/` |
| `DLine` | `LineChart` | `charts/` |
| `DScatter` | `ScatterPlot` | `charts/` |
| `DHeatmap` | `Heatmap` | `charts/` |
| `DLight` | `StatusLight` | `patterns/` |
| `DHeader` | `DashboardHeader` | `patterns/` |

## Catálogo: Primitives (atoms)

Estos no contienen lógica. Solo render + variantes via prop.

### `Button`

```ts
type ButtonProps = {
  variant?: "primary" | "ghost" | "danger";
  size?:    "sm" | "md" | "lg";
  iconOnly?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

Reemplaza las clases sueltas `.lx-btn`, `.lx-btn--primary`, `.lx-btn--sm`, `.lx-btn--icon` esparcidas en `tokens.css`.

### `Icon`

```tsx
<Icon name="arrow-right" size={20} strokeWidth={1.5} />
```

Map interno desde la librería actual (`app/components.jsx:5-49`) hacia un objeto `Record<IconName, SVGComponent>`. Se carga estáticamente; tree-shakeable.

### `Avatar`

```ts
type AvatarProps = {
  initials: string;          // ej. "VR"
  size?: number;             // px, default 40
  tone?: "default" | "lancome" | "ysl";
  image?: string;            // opcional, fallback initials
};
```

Renombra `LxAvatar`. Mantiene los 3 tonos (`--bone`, `--lancome-rose-deep`, `--ysl-gold`).

### `Chip`

Unifica las variantes hoy esparcidas: `.lx-chip`, `.lx-chip--lancome`, `.lx-chip--ysl`, `.lx-chip--warn`.

```ts
type ChipProps = {
  variant?: "neutral" | "lancome" | "ysl" | "ok" | "warn" | "danger";
  size?:    "sm" | "md";
  leading?: IconName;
  children: React.ReactNode;
};
```

### `BrandTag`

Caso especial de `Chip` que consume `BrandLockContext` (ver `07-state-and-data.md`) y silencia el render si su brand coincide con el lock.

### `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`

Wrappers tipados sobre los nativos. Aceptan `error`, `hint`, `leadingIcon`. Compatibles con `react-hook-form` (`forwardRef`).

### `Divider`

```ts
type DividerProps = { dashed?: boolean; orientation?: "horizontal" | "vertical" };
```

### `ProgressBar`

```ts
type ProgressBarProps = {
  value: number;             // 0..1
  tone?: "neutral" | "ok" | "warn" | "danger";
  showLabel?: boolean;
};
```

### `SegmentedControl`

```ts
type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (v: T) => void;
};
```

## Catálogo: Patterns (molecules)

Pequeñas composiciones de primitivas con un propósito UX recurrente.

### `KpiCard`

Unifica `LxStat` (`app/components.jsx:79-90`) y `DKpi` (`app/screens-dashboards.jsx:8-39`).

```ts
type KpiCardProps = {
  label: string;
  value: string | number;
  delta?: { value: number; tone: "ok" | "warn" | "danger" };
  hint?: string;
  trend?: number[];             // datos de sparkline opcional
  tone?: "neutral" | "ok" | "warn" | "danger";
  size?: "sm" | "md" | "lg";
  onDrill?: () => void;
};
```

### `KvRow`

Pares clave-valor justificados. Renombra `LxKV`.

```tsx
<KvRow label="LTV"             value={formatCurrency(ltv)} />
<KvRow label="Ticket promedio" value={formatCurrency(avg)} mono />
```

### `StatStrip`

Tira horizontal de `KpiCard` (3-5) con divisores. Patrón usado en headers de historial, dashboards y home.

### `ActionTile`

Generalización de `QuickAction` (`app/screens-home.jsx:113-128`).

```ts
type ActionTileProps = {
  icon: IconName;
  label: string;
  description?: string;
  variant?: "default" | "primary";
  onClick?: () => void;
};
```

### `AlertRow`

Generalización de `PendingRow`.

```ts
type AlertRowProps = {
  tone: "neutral" | "ok" | "warn" | "danger";
  title: string;
  description?: string;
  meta?: string;
  action?: { label: string; onClick: () => void };
};
```

### `EventRow`

Generalización de `UpcomingEventRow`. Acepta cualquier evento que tenga `{ kind, label, date, daysUntil }`.

### `Stepper`

Indicador de pasos numerados (usado en consultation 5 pasos, new-client 3 pasos, new-appointment).

```ts
type StepperProps = {
  steps: ReadonlyArray<{ label: string }>;
  current: number;             // 0-based
};
```

### `UserMenu`

Refactor de `ProfileMenu` (`app/shell.jsx:67-238`). Composición:

```tsx
<UserMenu trigger={<Avatar initials={user.initials} />}>
  <UserMenu.Identity user={user} />
  <UserMenu.Item icon="settings"  label="Ajustes" onClick={...} />
  <UserMenu.Item icon="power"     label="Cerrar sesión" onClick={logout} destructive />
</UserMenu>
```

El "2-step confirm" pasa a ser un `ConfirmDialog` reutilizable.

### `SyncBadge`, `BadgeDot`, `StatusLight`

Indicadores ligeros. `StatusLight` reemplaza `DLight` con map `'green' | 'amber' | 'red'`.

### `DashboardHeader`

Sustituye `DHeader`. Acepta título, scopes (chips clickeables) y acciones.

### `EmptyState`

```ts
type EmptyStateProps = { icon?: IconName; title: string; description?: string; action?: ReactNode };
```

### `Toast`, `Modal`, `ConfirmDialog`, `Drawer`, `Sheet`

Carpeta `feedback/`. Toast se vuelve global vía un store Zustand (`stores/toast.store.ts`); el resto es composición directa.

## Catálogo: Layout (organisms)

### `Shell` (compuesto)

```tsx
<Shell>
  <Shell.Rail items={navItems} active={current} onNavigate={navigate} />
  <Shell.TopBar title={...} subtitle={...} right={<SyncBadge online />} />
  <Shell.Content>{children}</Shell.Content>
</Shell>
```

- `Shell.Rail` es el sidebar 88 px. Items vienen del config RBAC (ver `06-routing-and-rbac.md`).
- `Shell.TopBar` es el header 72 px. Reemplaza `app/shell.jsx:240-277`.
- `Shell.Content` es el área scrollable.

### `IpadFrame`

Solo se conserva como **utilidad de demo** (Storybook, design canvas). En producción la app es full-bleed.

## Catálogo: Charts

Una sola librería de **gráficos a medida con SVG inline** (como hoy), no se introduce `recharts`/`chart.js` salvo necesidad clara — los dashboards son densos pero pequeños.

| Componente | Reemplaza | Propósito |
|---|---|---|
| `Sparkline` | `LxSpark` | Mini línea inline (7-12 puntos) |
| `BarChart` | `DBars` | Columnas verticales con `highlightIndex` |
| `SplitBar` | `DSplit` | 2 segmentos horizontales con leyenda |
| `LineChart` | `DLine` | 1-2 series con gridlines y leyenda |
| `Donut` | inline donut de DashSupervisor | Mix de 2 valores |
| `Funnel` | inline funnel de `ScreenBAPerf` | 5 stages descendentes |
| `ScatterPlot` | `DScatter` | Adopción vs ventas, 4 cuadrantes |
| `Heatmap` | `DHeatmap` | Grid intensidad (regional) |
| `CoverageGrid` | inline grid en `ScreenManager` | Cobertura por hora × BA |

API uniforme:

```ts
type ChartProps<T> = {
  data: T;
  width?: number;
  height?: number;
  ariaLabel: string;             // requerido para a11y
};
```

## Reglas de aceptación para añadir un componente

Antes de meter algo a `components/`, debe cumplir:

1. ☐ Se usa o se usará en al menos **2 features** distintas.
2. ☐ No referencia ningún tipo de dominio (`Client`, `Appointment`, etc.).
3. ☐ Tiene archivo `.stories.tsx` con al menos 3 estados.
4. ☐ Tiene test unitario para variantes y a11y básico.
5. ☐ Documenta sus props con TSDoc.

Si falla cualquiera, vive en `features/<dominio>/components/` hasta que escale.

## Anti-patrones específicos del proyecto

- **No** usar `style={{}}` para colores, tipografía, radios o sombras. Esos están en `@theme` → utilidades Tailwind (`bg-ink`, `text-ink/60`, `rounded-lg`, `shadow-lift`). `style` queda solo para valores dinámicos calculados (ej. `style={{ width: size }}` en `Avatar`).
- **No** hardcodear colores hex en componentes. Si un color nuevo es necesario, se agrega como `--color-*` al `@theme` en `globals.css` y se usa la utilidad generada.
- **No** crear archivos `.module.css`. Toda la presentación va en `className`. Variantes complejas viven en un `Record<Variant, string>` arriba del archivo.
- **No** crear componentes que **ignoren** el `className` recibido. Todos lo aceptan y lo combinan con los defaults vía `cn(BASE, className)`.
- **No** colocar lógica i18n en primitivas. Los strings llegan como prop.
