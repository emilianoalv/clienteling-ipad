# Credenciales demo — Login real simulado

> **Sprint 1.2** · 2026-05-25
> Estas credenciales viven en el **seed** del repo (`apps/web/src/server/repositories/user.repository.ts`). Sobreviven cualquier reinicio porque son código, no runtime. Sirven para demo, piloto interno y validación.
> **NO usar para producción**. Cuando Sprint 2 conecte Postgres + Auth.js, las passwords reales viven en DB con hash y ya no en este archivo.

## Cómo funciona el login

1. La BA / Gerente / Supervisor / Admin entra a `/auth/login`.
2. Ingresa su email + contraseña.
3. El server (`signInAction`) busca el usuario por email + compara la password contra el hash bcrypt almacenado.
4. Si coincide, se crea sesión httpOnly con `userId` + `role` y redirige al dashboard correspondiente.

Mensaje genérico ante error: **"Correo o contraseña incorrectos"** (no revela si el email existe).

## Tabla de credenciales (17 usuarios)

### Liverpool Polanco

| Nombre | Rol | Marca | Email | Contraseña |
|---|---|---|---|---|
| Valentina Ríos | BA | Lancôme | `valentina.rios@lancome.com.mx` | `valentina-pol-2026` |
| Fernanda Oliveros | BA | Lancôme | `fernanda.oliveros@lancome.com.mx` | `fernanda-pol-2026` |
| Daniela Castro | BA | YSL | `daniela.castro@ysl.com.mx` | `daniela-pol-ysl` |
| Sofía Marín | BA | YSL | `sofia.marin@ysl.com.mx` | `sofia-pol-ysl` |
| Camila Santos | Gerente | — (ambas) | `camila.santos@loreal.com.mx` | `camila-gerente-2026` |

### Liverpool Perisur

| Nombre | Rol | Marca | Email | Contraseña |
|---|---|---|---|---|
| Regina Mendoza | BA | Lancôme | `regina.mendoza@lancome.com.mx` | `regina-per-2026` |
| Andrea Lozano | BA | Lancôme | `andrea.lozano@lancome.com.mx` | `andrea-per-2026` |
| Lucía Cabrera | BA | YSL | `lucia.cabrera@ysl.com.mx` | `lucia-per-ysl` |
| Mariana Esquivel | BA | YSL | `mariana.esquivel@ysl.com.mx` | `mariana-per-ysl` |
| Patricia Herrera | Gerente | — (ambas) | `patricia.herrera@loreal.com.mx` | `patricia-gerente-2026` |

### Palacio Santa Fe

| Nombre | Rol | Marca | Email | Contraseña |
|---|---|---|---|---|
| Renata Salazar | BA | Lancôme | `renata.salazar@lancome.com.mx` | `renata-stf-2026` |
| Ximena Pereda | BA | Lancôme | `ximena.pereda@lancome.com.mx` | `ximena-stf-2026` |
| Paulina Treviño | BA | YSL | `paulina.trevino@ysl.com.mx` | `paulina-stf-ysl` |
| Carolina Andrade | BA | YSL | `carolina.andrade@ysl.com.mx` | `carolina-stf-ysl` |
| Mónica Solís | Gerente | — (ambas) | `monica.solis@loreal.com.mx` | `monica-gerente-2026` |

### Corporativo

| Nombre | Rol | Scope | Email | Contraseña |
|---|---|---|---|---|
| Diego Salvatierra | Supervisor | Zona Centro (Polanco + Santa Fe) | `diego.salvatierra@loreal.com.mx` | `diego-supervisor-2026` |
| Ana Lucía Ferrer | Admin | Nacional | `ana.ferrer@loreal.com.mx` | `ana-admin-2026` |

## Cómo agregar / modificar credenciales

Las passwords plain se hashean con bcrypt (10 rounds) **antes** de pegarse en el seed. Para agregar un usuario nuevo o rotar una password:

1. Edita `apps/web/scripts/generate-password-hashes.mjs` con el email y la nueva password en claro.
2. Corre `node apps/web/scripts/generate-password-hashes.mjs` desde la raíz del repo.
3. Copia el hash bcrypt del output (formato `$2b$10$...`).
4. Pega el hash en el campo `passwordHash` del usuario en `user.repository.ts`.
5. Actualiza esta tabla con la nueva credencial.
6. **No** commitees el script con passwords reales si las publicas a producción.

## Limitaciones conocidas

- **Sin "Olvidé mi contraseña"**: si alguien olvida la suya, hay que regenerar el hash y rebuildeear.
- **Sin MFA**: una sola capa de credencial.
- **Sin lockout aún**: el form acepta intentos ilimitados (estructura `SignInResult` ya tiene los reasons, pero no está cableado).
- **Credenciales en el repo**: cualquiera con acceso al código ve los hashes. Bcrypt 10 rounds es lento de romper pero no inviable con passwords débiles. Por eso *no* se usa en producción.

Para Sprint 2 / piloto real: Auth.js + Postgres + email magic links o passwords con reset funcional.
