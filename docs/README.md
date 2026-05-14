# Clienteling iPad · Documentación de re-arquitectura

Migración propuesta del prototipo React + Babel-standalone actual hacia **Next.js 15 (App Router) + TypeScript**, aplicando SOLID, DRY y KISS, con un sistema de componentes reutilizables y nomenclatura estándar de la industria.

> Esta carpeta describe **el estado objetivo**. Para el detalle paso-a-paso de cómo llegar desde el código actual (`app/*.jsx`) ver `10-migration-plan.md`.

## Cómo leer estos documentos

Cada archivo cubre un tema único y no se duplica con los demás. El orden numerado es el de lectura recomendada para alguien nuevo en el proyecto, pero todos son independientes.

| # | Archivo | Qué responde |
|---|---|---|
| 00 | [README.md](README.md) | Índice y mapa de los documentos |
| 01 | [01-architecture.md](01-architecture.md) | Estructura de carpetas, capas (presentación / dominio / datos / infraestructura) y reglas de dependencia |
| 02 | [02-naming-conventions.md](02-naming-conventions.md) | Cómo se nombran archivos, componentes, hooks, tipos, constantes, eventos y rutas |
| 03 | [03-design-principles.md](03-design-principles.md) | SOLID / DRY / KISS con ejemplos extraídos del código actual y su contra-ejemplo refactorizado |
| 04 | [04-ui-components.md](04-ui-components.md) | Catálogo del design system: átomos, moléculas y organismos reutilizables |
| 05 | [05-feature-modules.md](05-feature-modules.md) | Módulos de dominio (clients, appointments, catalog, etc.) y sus responsabilidades |
| 06 | [06-routing-and-rbac.md](06-routing-and-rbac.md) | App Router, route groups por rol, middleware de autorización |
| 07 | [07-state-and-data.md](07-state-and-data.md) | Capa de datos (server actions / fetchers), cache, mutaciones y estado de cliente |
| 08 | [08-styling-and-tokens.md](08-styling-and-tokens.md) | Design tokens, theming por marca, sistema de espaciado y tipografía |
| 09 | [09-i18n.md](09-i18n.md) | Internacionalización (`es-MX` / `en-US`) con `next-intl` y reglas de claves |
| 10 | [10-migration-plan.md](10-migration-plan.md) | Plan incremental de migración por fases, riesgos y checklist |

## Glosario rápido

- **BA** — Beauty Advisor, vendedor/a de piso.
- **Luxe Circle** — Programa de fidelidad: tiers Signature, Icon, Atelier.
- **Brand lock** — Restricción de UI a una marca específica del catálogo (Lancôme, YSL, etc.).
- **Clienteling** — Atención personalizada de alto contacto al cliente VIP.
- **Tier** — Nivel del cliente dentro del programa de lealtad.
- **Segmento** — Clasificación operativa derivada (VIP, Recurrent, New, AtRisk).

## Convenciones de los documentos

- Bloques ```ts``` para tipos y firmas de funciones.
- Bloques ```text``` para árboles de carpetas.
- Las rutas que apuntan al código **actual** usan el path `app/archivo.jsx`. Las rutas del **diseño objetivo** usan el prefijo `src/`.
- Las referencias cruzadas entre documentos usan enlaces relativos: `[ver 04-ui-components.md](04-ui-components.md)`.
