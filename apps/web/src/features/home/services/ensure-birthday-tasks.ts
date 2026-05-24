import "server-only";
import type { Client } from "@/types/client";
import type { Staff } from "@/types/staff";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";

/**
 * Ventana de anticipación: una tarea de cumpleaños se materializa cuando
 * faltan ≤30 días para la fecha. La BA quiere preparar el detalle, no
 * estresarla con 11 meses de anticipación.
 */
const BIRTHDAY_WINDOW_DAYS = 30;

/**
 * Para cada cliente del scope del BA, asegura que exista una FollowupTask
 * de categoría "birthday" para el cumpleaños del año actual. Idempotente:
 * no duplica si ya hay una task (pending o done) cuya dueAt cae dentro de
 * ±30 días del cumpleaños esperado.
 *
 * Se ejecuta cada vez que la BA abre `/ba/home`. No es un cron formal —
 * la app de demo no tiene infra de jobs — pero el patrón "lazy ensure"
 * cubre el caso real: la BA entra a su pantalla principal todos los días.
 *
 * Devuelve cuántas tasks se crearon (útil para logging o para mostrar un
 * notice "creamos N recordatorios de cumpleaños"). Cero por default.
 */
export async function ensureBirthdayTasks(
  staff: Staff,
  clients: readonly Client[],
  now = new Date(),
): Promise<number> {
  let created = 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (const client of clients) {
    if (!client.birthday) continue;
    const nextBirthday = nextOccurrence(client.birthday, today);
    if (nextBirthday == null) continue;

    const daysUntil = Math.round((nextBirthday.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil < 0 || daysUntil > BIRTHDAY_WINDOW_DAYS) continue;

    // Idempotencia: si ya hay una task de birthday para este cliente
    // cuya dueAt cae cerca del cumple esperado (±30d), no creamos otra.
    const existing = await followupTaskRepository.listByClient(client.id);
    const alreadyHandled = existing.some((t) => {
      if (t.category !== "birthday") return false;
      const dueMs = new Date(t.dueAt).getTime();
      const targetMs = nextBirthday.getTime();
      const diff = Math.abs(dueMs - targetMs);
      return diff < 31 * 86_400_000;
    });
    if (alreadyHandled) continue;

    const firstName = client.name.split(/\s+/)[0] ?? client.name;
    await followupTaskRepository.create({
      clientId: client.id,
      baId: staff.id,
      type: "whatsapp",
      category: "birthday",
      description: `Cumpleaños de ${firstName}: saludo + invitación a la tienda`,
      dueAt: nextBirthday.toISOString(),
    });
    created++;
  }

  return created;
}

/**
 * Dado un birthday en formato "YYYY-MM-DD", devuelve la próxima fecha
 * (este año si aún no pasó, el año que viene si ya pasó). Devuelve null
 * si la fecha es inválida.
 */
function nextOccurrence(birthdayIso: string, today: Date): Date | null {
  const match = birthdayIso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const thisYear = new Date(today.getFullYear(), month - 1, day, 12, 0, 0, 0);
  if (thisYear.getTime() >= today.getTime()) return thisYear;
  return new Date(today.getFullYear() + 1, month - 1, day, 12, 0, 0, 0);
}
