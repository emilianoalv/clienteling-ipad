# L'Oréal Luxe · Clienteling iPad — Onboarding

App de clienteling para iPad. Stack: Next.js 15 (App Router), React 19, TypeScript estricto, Tailwind v4, Vitest, Playwright, pnpm monorepo.

## Prerrequisitos

| Herramienta | Versión mínima | Cómo instalar |
|---|---|---|
| Node.js | 20.11.0 | https://nodejs.org/ (LTS) |
| pnpm | 9.12.0 | `npm install -g pnpm@9.12.0` |
| Git | cualquiera reciente | https://git-scm.com/ |
| Editor | VS Code recomendado | extensiones: ESLint, Prettier, Tailwind CSS IntelliSense |

Verifica tras instalar:

```powershell
node -v     # >= v20.11.0
pnpm -v     # 9.12.0
```

## Clonar e instalar

```powershell
git clone <URL-DEL-REPO-EN-GITHUB>
cd clienteling-ipad
pnpm install
```

`pnpm install` baja todas las dependencias del monorepo (≈ 1-3 min la primera vez).

## Levantar el dev server

```powershell
pnpm dev
```

Espera el mensaje `✓ Ready in Xs` y abre **http://localhost:3000** en el navegador.

> Si el puerto 3000 está ocupado, pasa otro: `pnpm --filter @clienteling/web dev -- --port 3001`.

## Login (modo demo)

La pantalla de login pide dos cosas:

1. **Rol** — chip selector entre `BA / Manager / Supervisor / HQ / Admin`
2. **PIN** — cualquier número de **6 dígitos** (ej. `123456`)

> El PIN real se valida hasta F4 (backend real). En esta fase cualquier secuencia de 6 dígitos funciona.

Cada rol cae en una landing distinta:

| Rol | Landing | Pestañas accesibles en sidebar |
|---|---|---|
| **BA** | `/ba` (Hoy) | Hoy · Clientas · Citas · Catálogo · Muestras · Seguim. · Mi KPI |
| **Manager** | `/manager` | Dashboard · Equipo · Segmentos · Dispositivos · Reportes |
| **Supervisor** | `/supervisor` | Dashboard · Zona · Tickets · Reportes |
| **HQ** | `/hq` | Dashboard · Integraciones · Dispositivos · Reportes |
| **Admin** | `/admin` | Governance hub · Usuarios · Segmentos · Integraciones · Audit · Reportes |

## Scripts disponibles

| Comando | Hace |
|---|---|
| `pnpm dev` | Dev server con Hot Reload |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build (tras `pnpm build`) |
| `pnpm lint` | ESLint en todo el monorepo |
| `pnpm typecheck` | TypeScript strict check |
| `pnpm test` | Vitest (58 unit tests al cierre de F3.11) |
| `pnpm format` | Prettier escribiendo cambios |
| `pnpm format:check` | Prettier modo verificación |

## Estado del proyecto (mayo 2026)

- **F1 / F2 / F3** completos — 14 dominios migrados del prototipo Babel original a Next.js 15
- **F3.10** — landing "Hoy" del BA
- **F3.11** — mini-sprint de QA: fix de persistencia HMR (repos in-memory ahora sobreviven hot reload), rediseño del wizard de nueva clienta, rediseño de la lista de clientas, escalado de UI a tamaño iPad
- **Pendiente** — F4 (backend real con DB), F5 (retirar prototipo legacy `app/`)

> Toda la persistencia es **in-memory**: las clientas, citas, etc. que crees se conservan mientras el dev server no se mate. Reiniciar `pnpm dev` resetea todo al seed. Esto es por diseño hasta F4.

## QA conjunto

Ver `QA_CHECKLIST.md` en este repo: matriz de pruebas por rol y por flujo. Bugs encontrados → abrir GitHub Issue con label `qa-<rol>` y referencia al checklist.

## Convenciones del proyecto

- **Branches**: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`. PR a `main`.
- **Commits**: imperativo, español o inglés (consistente dentro del PR).
- **Boundaries**: `types ← config ← lib ← components ← features ← app` (enforce por eslint-plugin-boundaries). No saltarse capas.
- **Tests**: cada servicio puro (`features/*/services/*`) lleva test al lado.
- **i18n**: nuevas keys en `apps/web/src/messages/{es-MX,en-US}.json`. Si la unión de keys peta typecheck, usa el shim `useT()` / `getT()` de `apps/web/src/lib/i18n/`.

## Estructura clave

```
clienteling-ipad/
├── apps/
│   └── web/                    # Next.js 15 app
│       ├── src/
│       │   ├── app/            # rutas (App Router)
│       │   ├── features/       # 15 dominios: clients, appointments, ...
│       │   ├── components/     # primitives + patterns reutilizables
│       │   ├── server/         # repositories (in-memory hasta F4)
│       │   ├── config/         # routes, rbac, nav, i18n
│       │   ├── lib/            # utilities
│       │   └── types/          # branded IDs + dominio
│       └── messages/{es-MX,en-US}.json
├── app/                        # Prototipo legacy (Babel JSX) — referencia
├── docs/                       # Spec del proyecto
└── package.json
```

## Si algo falla

1. **`pnpm install` falla** → confirma versión de Node (≥20.11) y pnpm (9.12). En Windows, `corepack enable` puede ayudar.
2. **Puerto en uso** → mata el proceso (`Get-NetTCPConnection -LocalPort 3000`) o usa otro puerto.
3. **HMR raro / "webpack module not found"** → mata el dev server, borra `.next/` (`rm -rf apps/web/.next`), `pnpm dev` de nuevo.
4. **Hydration warning con `heurio-app`** → es la extensión Heurio del navegador inyectando DOM, no es bug.
5. **Cambios en repos no persisten** → ya no debería pasar tras F3.11 (los repos usan `globalThis` cache). Si pasa, reinicia el server y reporta.

## Referencias

- Migration plan: `docs/10-migration-plan.md`
- Feature modules: `docs/05-feature-modules.md`
- Architecture rules: `docs/01-architecture.md`
