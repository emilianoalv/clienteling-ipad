# iPad Responsive Audit — 2026-05-25

> **Owner**: Claude (Día 9)
> **Targets**: iPad portrait (768px = Tailwind `md`), iPad landscape (1024px = `lg`)
> **Source**: static read of the 4 dashboard components + drill-down modals.

## Tailwind v4 breakpoint reminder

| Breakpoint | Width | Device |
|---|---|---|
| (default) | <640px | phone |
| `sm:` | ≥640px | phone landscape |
| `md:` | ≥768px | **iPad portrait** |
| `lg:` | ≥1024px | **iPad landscape** / small desktop |
| `xl:` | ≥1280px | desktop |

The app is iPad-primary (RNF-08). Everything below assumes iPad portrait
as the **default** layout and `lg:` as the desktop upgrade.

## Findings by dashboard

### `/ba/performance`
- ✅ Hero: `<HeroBlock>` already uses `md:grid-cols-[3fr_2fr]` — stacks below 768.
- ⚠ Sec 1 counter table: hardcoded `grid-cols-[1.4fr_1fr_1fr_1fr]` without responsive prefix. At 768px the four columns are tight but legible (~190px each).
- ✅ Sec 2 conversion bars: each `<ConversionBar>` uses `grid-cols-[auto_1fr_auto]` — naturally responsive.
- ✅ Sec 3 donut + lista: `md:grid-cols-2` → stacks below 768.
- ✅ Sec 4 cartera: `md:grid-cols-2` → stacks below 768.
- ⚠ Sec 5 timeline + pending: list row uses `grid-cols-[24px_1fr_auto]` (3 cols) — fine.
- ⚠ Header actions: `<FilterBar>` + `<ExportButton>` share a flex row that doesn't wrap nicely on portrait.

### `/gerente`
- ✅ Hero block stacks via `<HeroBlock>`.
- ⚠ Sec 1 BA ranking table: `grid-cols-[1.4fr_0.6fr_1fr_0.7fr_0.9fr_0.9fr]` (6 cols) at base. Cramped on portrait — wrap or scroll needed.
- ✅ Sec 2 brand comparison: `md:grid-cols-[2fr_3fr]` stacks.
- ⚠ Sec 2 brand KPI columns: inner `grid-cols-2` (LCM + YSL) — fits but margin is tight.
- ⚠ Sec 4 mix products: `md:grid-cols-2` OK. Inner two lists use `grid grid-cols-1 gap-4` — OK.
- ⚠ Sec 5 cartera stats: `grid-cols-3` — three stats inline, OK at 768 but tight.
- ✅ Sec 5 cartera right pane: top clientes uses `grid-cols-[1fr_auto]` — naturally responsive.
- ⚠ Sec 6 operación: `md:grid-cols-2` OK. Inner `OperationStats` `grid-cols-2` — OK.
- ⚠ Header: FilterBar with multiple selects (period, brand, baId) is the worst offender for portrait wrapping.

### `/supervisor`
- ✅ Hero stacks via `<HeroBlock>`.
- ✅ Sec 1 store health: `md:grid-cols-2` → stacks. Each `<StoreHealthCard>` self-contained.
- ⚠ Sec 2 BA ranking cross-store: 7-col grid `grid-cols-[1.2fr_1fr_0.6fr_1fr_0.7fr_0.8fr_0.9fr]` (BA + Tienda + Marca + Ventas + % obj + Conv + Estado). At 768px this is too cramped — needs scroll wrapper.
- ✅ Sec 3 best practices: card list, naturally responsive.
- ✅ Sec 4 multi-line trend: `<LineChart>` uses viewBox SVG — scales.
- ✅ Sec 5 funnel: stacks naturally.
- ✅ Sec 6 brand comparison: outer block OK, inner per-store table is 3-col `grid-cols-[1.4fr_1fr_1fr]` — fits.
- ⚠ Sec 7 side-by-side: 4-col grid `grid-cols-[1.4fr_1fr_1fr_0.7fr]` — tight but readable.
- ⚠ Sec 8 operación: `md:grid-cols-2`. Inner `grid-cols-2` for OperationStats — OK.
- ⚠ FilterBar at supervisor has 4 controls (period + store + brand + BA) — most overflow-prone of all dashboards.

### `/admin`
- ✅ Hero stacks via `<HeroBlock>`.
- ⚠ Sec 1 ranking nacional: `md:grid-cols-2` for the two tables. Each table internal grid is 4-5 cols — tight at 768.
- ⚠ Sec 2 funnel + insights: `md:grid-cols-2` OK. Funnel uses its own layout.
- ⚠ Sec 3 brand comparison país: `md:grid-cols-[2fr_3fr]`. LineChart on the right has fixed viewBox so it scales.
- ✅ Sec 4 mix productos: `md:grid-cols-2` stacks.
- ✅ Sec 5 ComplianceScoreCard: self-contained card, fits anywhere.
- ✅ Sec 6 AdoptionTracker: uses `grid-cols-[7rem_1fr_auto_auto]` which is fine.
- ⚠ Sec 7 gobernanza: `md:grid-cols-3` — 3 admin cards inline. On portrait, 3 cards × ~256px = 768px exactly, fits but no margin.
- ✅ Sec 8 alertas + system health: `md:grid-cols-2` stacks.

### Drill-down modals
- `<BADrillDownModal>` size="lg" → `max-w-[720px]` — on a 768px viewport this leaves 24px on each side. Acceptable but tight; KPI tiles use `md:grid-cols-4` so 4 columns inside a 700px modal at 768px viewport works.
- `<StoreDrillDownModal>` same shape — KPI tiles use `grid-cols-3`, breakdown rows use `grid-cols-2`. Looking OK.
- `<PreviewDialog>` size="sm" → 420px max-w — fine on all viewports.

## Touch target audit

| Element | Current size | Action |
|---|---|---|
| `<Button size="sm">` | `h-8` = 32px | Below Apple HIG 44px. Mostly used on desktop CTAs; left as-is. |
| `<PeriodPicker>` trigger | `h-8` | Below 44px. The control is a rounded pill — bumping height affects multiple dashboards. **Fix**: bump to `h-10` (40px) — closer to HIG without breaking layout. |
| `<FilterBar>` select labels | `h-8` | Same as PeriodPicker. Bump to `h-10`. |
| `<ExportButton>` size="sm" | `h-8` | Header export uses default `sm`. **Fix**: bump default to `md` (h-10) for iPad. |
| `<Modal>` close button | `h-9 w-9` = 36px | Below 44px. **Fix**: bump to `h-10 w-10`. |
| Drill-down modal close (inside `<Modal>`) | inherited | Same fix as Modal. |
| Dropdown menu items in `<ExportButton>` | `py-2` ≈ 36px row | **Fix**: `py-2.5` (40px) plus existing padding. |

## Fix plan (this commit)

1. **FilterBar + ExportButton header layout**: wrap into a `flex-wrap` row, gap shrinks on portrait. ✅ priority — both visible at all viewports.
2. **6-7 column tables (Gerente Sec 1, Supervisor Sec 2)**: wrap in `<div className="overflow-x-auto">` so the table can scroll horizontally if cramped.
3. **Touch targets**: PeriodPicker + FilterBar select pills bumped to `h-10`. Modal close to `h-10 w-10`. ExportButton default size bumped to `md`.
4. **Gerente Sec 5 cartera-stats**: keep 3 cols but ensure mobile-down stack via `grid-cols-1 lg:grid-cols-3` — currently `grid-cols-3` collapses badly on <640.
5. **Admin Sec 7 gobernanza**: `md:grid-cols-3` → `lg:grid-cols-3` so cards stack at 768 (3 admin cards on portrait would each be ~256px — too narrow for "Permisos por rol" copy).
6. **Inline-row tables on Sec 1 / Sec 2 cross-store**: keep grid layouts but add `min-w-[640px]` so they trigger horizontal scroll inside the wrapper.

No changes to:
- HeroBlock (already responsive at md).
- DonutSegment / ConversionBar / Funnel / SplitBar (self-scaling SVG or layout-agnostic).
- AlertCard / AlertBanner / AlertBadge (auto-flow).
- StoreHealthCard / ComplianceScoreCard / AdoptionTracker (self-contained).

## Out of scope (future polish day)

- Print stylesheet for exported reports preview.
- True iPad gesture support (long-press, two-finger drag).
- Charts text scaling for very small screens (<375px) — not a supported breakpoint.
