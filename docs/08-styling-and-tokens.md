# 08 · Estilos y design tokens

> **Alcance:** sistema visual (paleta, tipografía, espaciado, sombras), theming por marca y cómo se aplican los estilos.
> Para los componentes que consumen estos tokens, ver `04-ui-components.md`.

## Filosofía

**Tailwind CSS v4 estándar.** Toda la app de Next.js (`apps/web/`) usa Tailwind v4 con configuración CSS-first (sin `tailwind.config.ts`). Los tokens viven directamente en `apps/web/src/app/globals.css` dentro de un bloque `@theme {}` con valores crudos — no hay bridge a archivos externos, no hay CSS Modules.

> El archivo `styles/tokens.css` en la raíz del repo se conserva **solo para el prototipo legacy** (`app/*.jsx`, `app.html`). La app Next.js no lo importa.

## Setup

| Pieza | Archivo | Qué hace |
|---|---|---|
| Engine | `apps/web/postcss.config.mjs` | Carga `@tailwindcss/postcss` |
| Theme + base | `apps/web/src/app/globals.css` | `@import "tailwindcss"` + bloque `@theme {}` con tokens |
| Class joiner | `apps/web/src/lib/cn.ts` | `clsx` + `tailwind-merge` para resolver conflictos |
| Tipos React | `apps/web/tsconfig.json` | Imports estándar `react`/`next` |

## Pirámide de tokens

```text
@theme {}                  →   utilidades Tailwind          →   clases en JSX
  --color-ink: #0E0E0F     →   bg-ink, text-ink, text-ink/60   →   className="bg-ink text-paper"
  --font-display: …        →   font-display                    →   className="font-display"
  --radius-lg: 16px        →   rounded-lg                      →   className="rounded-lg"
  --shadow-lift: …         →   shadow-lift                     →   className="shadow-lift"
```

1. **Valores crudos** en `@theme` (hex / px / strings). Cambia un color aquí y se propaga.
2. **Utilidades** generadas automáticamente por Tailwind a partir del prefijo (`--color-*` → `bg-*` / `text-*` / `border-*`).
3. **Composición** vía `className` en los componentes. Sin CSS files por componente.

## Paleta (en `@theme`)

```css
@theme {
  /* Neutral */
  --color-ink:        #0e0e0f;   /* utilidades: bg-ink, text-ink, border-ink, text-ink/60... */
  --color-paper:      #fafaf7;
  --color-bone:       #f2eee8;
  --color-bone-2:     #ebe6dc;
  --color-line:       #e3ded4;
  --color-mist:       #8b8680;

  /* Semánticos */
  --color-ok:         #1f7a5a;
  --color-warn:       #b5861f;
  --color-err:        #a23a2e;

  /* Marca (contenido, nunca chrome) */
  --color-lancome-ink:        #1c0e10;
  --color-lancome-rose:       #e8c4c0;
  --color-lancome-rose-deep:  #b85f63;
  --color-ysl-ink:            #000000;
  --color-ysl-gold:           #c9a961;
  --color-ysl-cream:          #f4ecd8;
}
```

**Opacidad** se aplica con el modificador estándar de Tailwind: `bg-ink/60`, `text-ink/40`, `bg-ok/[0.08]`, `border-warn/20`. Tailwind genera `color-mix()` en compile-time — no hace falta declarar variantes `--ink-60`, `--ink-08`, etc.

## Tipografía

```css
@theme {
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-sans:    "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:    "JetBrains Mono", "SF Mono", ui-monospace, monospace;
}
```

Utilidades resultantes: `font-display`, `font-sans`, `font-mono`. Las fuentes vienen vía `<link>` en `app/layout.tsx` (Google Fonts).

Escala (vía utilidades nativas de Tailwind):

| Token actual | Tailwind v4 |
|---|---|
| Display 1 (56 px) | `font-display text-[56px] leading-tight tracking-[-0.02em]` |
| Display 2 (40 px) | `font-display text-[40px] leading-tight tracking-[-0.015em]` |
| Display 3 (28 px) | `font-display text-[28px] leading-tight tracking-[-0.01em]` |
| H1 (22 px) | `text-[22px] font-semibold leading-tight tracking-[-0.01em]` |
| H2 (18 px) | `text-lg font-semibold leading-tight` |
| Body (14 px) | `text-sm` |
| Small (12 px) | `text-xs font-medium text-ink/60` |
| Micro / eyebrow | `text-[10.5px] font-semibold tracking-[0.12em] uppercase text-ink/60` |

## Espaciado

Se usa la escala default de Tailwind (base 4 px). Equivalencias con la antigua escala `--s-N`:

| Antiguo | Tailwind | px |
|---|---|---|
| `--s-1` | `p-1` / `gap-1` | 4 |
| `--s-2` | `p-2` | 8 |
| `--s-3` | `p-3` | 12 |
| `--s-4` | `p-4` | 16 |
| `--s-5` | `p-5` | 20 |
| `--s-6` | `p-6` | 24 |
| `--s-7` | `p-8` | 32 |
| `--s-8` | `p-10` | 40 |

Para valores arbitrarios usar la notación `[]`: `h-[72px]`, `min-w-[360px]`, `gap-[2px]`.

## Radii y sombras

```css
@theme {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;

  --shadow-lift:    0 1px 2px rgba(14,14,15,.04), 0 8px 24px -12px rgba(14,14,15,.08);
  --shadow-lift-lg: 0 2px 4px rgba(14,14,15,.04), 0 18px 48px -16px rgba(14,14,15,.12);
}
```

Utilidades: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill`, `shadow-lift`, `shadow-lift-lg`.

## Easing y motion

```css
@theme {
  --ease-luxe: cubic-bezier(0.2, 0.7, 0.3, 1);
}
```

Uso: `transition-[background-color] duration-150 ease-luxe`.

Animación específica (modal pop-in) declarada como `@utility animate-modal-pop` en `globals.css`.

## Theming por marca

Las marcas son **contenido**, no chrome. Se exponen como colores Tailwind para componentes que las representan (`BrandTag`, `Avatar tone="lancome"`, las píldoras del calendario):

```tsx
<div className="bg-lancome-rose text-lancome-ink">…</div>
<div className="bg-ysl-ink text-ysl-gold">…</div>
```

El Shell, Rail y TopBar **siempre** usan neutros (`bg-white`, `bg-paper`, `border-line`, `text-ink`). El `useBrandLock()` filtra datos, no cambia el tema visual.

## Reglas para escribir estilos

1. **Solo Tailwind en `className`**. Nada de `style={{ ... }}` ni CSS Modules.
2. Valores dinámicos calculados van con `style` (ej. `style={{ width: size }}` para Avatar de tamaño variable). Reservado para lo que Tailwind no puede generar (tamaños dependientes de props numéricas).
3. **Componentes aceptan `className`** y lo combinan con `cn(defaults, className)` para que el consumidor pueda extender/sobrescribir.
4. **No mezclar valores hex con utilidades.** Si necesitas un color que aún no existe como token, agrégalo a `@theme` antes de usarlo.
5. Variantes complejas se factorizan en un `Record<Variant, string>` al inicio del archivo (ver `Button`, `KpiCard`, `Chip`).

## Opciones rechazadas

- **CSS Modules**: añade un archivo por componente, dificulta refactor cross-componente, fuerza `data-attribute`-based theming.
- **styled-components / Emotion**: runtime CSS-in-JS, conflictos con RSC.
- **vanilla-extract**: añade build step adicional sin ventaja sobre Tailwind v4 que ya hace generación estática.

## Migración del prototipo

| Patrón del prototipo | Reemplazo en `apps/web/` |
|---|---|
| `var(--ink)` en `style={{}}` | `text-ink` / `bg-ink` |
| `var(--ink-60)` en `style={{}}` | `text-ink/60` |
| `.lx-card` global | `bg-white border border-line rounded-lg p-5 shadow-lift` |
| `.lx-chip` global | `<Chip variant="...">` (utilidades dentro) |
| `.lx-btn` global | `<Button variant="...">` (utilidades dentro) |
| `lx-eyebrow` global | `<SectionHeader>` con clases internas |
| `.lx-quick` global | `<ActionTile>` (TBD pattern) |
| `tokens.css` | `@theme {}` dentro de `globals.css` |
