// One-shot script — genera hashes bcrypt para el seed de usuarios.
// No vive en runtime de la app; se ejecuta manualmente cuando hay que
// rotar passwords del seed demo. Output va a stdout en formato listo
// para pegar en user.repository.ts.
//
// Uso: node apps/web/scripts/generate-password-hashes.mjs

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const USERS = [
  { id: "us-ba-pol-lcm-1", email: "valentina.rios@lancome.com.mx", password: "valentina-pol-2026" },
  { id: "us-ba-pol-lcm-2", email: "fernanda.oliveros@lancome.com.mx", password: "fernanda-pol-2026" },
  { id: "us-ba-pol-ysl-1", email: "daniela.castro@ysl.com.mx", password: "daniela-pol-ysl" },
  { id: "us-ba-pol-ysl-2", email: "sofia.marin@ysl.com.mx", password: "sofia-pol-ysl" },
  { id: "us-gte-pol", email: "camila.santos@loreal.com.mx", password: "camila-gerente-2026" },
  { id: "us-ba-per-lcm-1", email: "regina.mendoza@lancome.com.mx", password: "regina-per-2026" },
  { id: "us-ba-per-lcm-2", email: "andrea.lozano@lancome.com.mx", password: "andrea-per-2026" },
  { id: "us-ba-per-ysl-1", email: "lucia.cabrera@ysl.com.mx", password: "lucia-per-ysl" },
  { id: "us-ba-per-ysl-2", email: "mariana.esquivel@ysl.com.mx", password: "mariana-per-ysl" },
  { id: "us-gte-per", email: "patricia.herrera@loreal.com.mx", password: "patricia-gerente-2026" },
  { id: "us-ba-stf-lcm-1", email: "renata.salazar@lancome.com.mx", password: "renata-stf-2026" },
  { id: "us-ba-stf-lcm-2", email: "ximena.pereda@lancome.com.mx", password: "ximena-stf-2026" },
  { id: "us-ba-stf-ysl-1", email: "paulina.trevino@ysl.com.mx", password: "paulina-stf-ysl" },
  { id: "us-ba-stf-ysl-2", email: "carolina.andrade@ysl.com.mx", password: "carolina-stf-ysl" },
  { id: "us-gte-stf", email: "monica.solis@loreal.com.mx", password: "monica-gerente-2026" },
  { id: "us-sup-centro", email: "diego.salvatierra@loreal.com.mx", password: "diego-supervisor-2026" },
  { id: "us-admin", email: "ana.ferrer@loreal.com.mx", password: "ana-admin-2026" },
];

for (const u of USERS) {
  const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
  console.log(`${u.id} | ${u.email} | ${u.password} | ${hash}`);
}
