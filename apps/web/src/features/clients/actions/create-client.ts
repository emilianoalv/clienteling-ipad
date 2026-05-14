"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
import { consentRepository } from "@/server/repositories/consent.repository";
import { newClientSchema, type NewClientInput } from "../schemas/new-client.schema";

const PRIVACY_NOTICE_VERSION = "v2026.05";

export interface ActionError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function createClient(raw: NewClientInput): Promise<ActionError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:write")) return { ok: false, message: "Sin permiso para crear clientas" };

  const parsed = newClientSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const input = parsed.data;
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;
  const now = new Date();

  const created = await clientRepository.create({
    name: fullName,
    phone: `${input.dialCode} ${input.phone.trim()}`,
    email: input.email,
    birthday: input.birthday,
    city: input.city,
    age: ageFromBirthday(input.birthday, now),
    preferredLang: input.preferredLang,
    since: now.toISOString().slice(0, 10),
    tier: "Atelier",
    brands: input.brands,
    skin: { type: input.skin.type, concerns: input.skin.concerns, tone: input.skin.tone },
    allergies: input.allergies,
    loyalty: { name: "Luxe Circle", tier: "Atelier", points: 0, toNext: 10_000 },
    stats: { ltv: 0, visits: 0, avgTicket: 0, lastPurchase: null },
    affinities: [],
    interests: input.interests,
    routine: input.routine,
    routineTiming: input.routineTiming,
    gender: input.gender,
    ageRange: input.ageRange,
  });

  for (const c of input.consents) {
    await consentRepository.upsert({
      clientId: created.id,
      channel: c.channel,
      status: c.status,
      source: "in-store",
      version: PRIVACY_NOTICE_VERSION,
    });
  }

  revalidatePath("/ba/clients");
  redirect(`/ba/clients/${created.id}`);
}

function ageFromBirthday(iso: string, now: Date): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
