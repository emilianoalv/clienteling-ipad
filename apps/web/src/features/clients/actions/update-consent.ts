"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { consentRepository } from "@/server/repositories/consent.repository";
import type { ClientId } from "@/types/client";
import type { Channel } from "@/types/communication";
import type { ConsentStatus } from "@/types/consent";

const PRIVACY_NOTICE_VERSION = "v2026.05";

export async function updateConsent(input: {
  clientId: ClientId;
  channel: Channel;
  status: ConsentStatus;
}): Promise<{ ok: false; message: string } | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:write")) return { ok: false, message: "Sin permiso" };

  await consentRepository.upsert({
    clientId: input.clientId,
    channel: input.channel,
    status: input.status,
    source: "in-store",
    version: PRIVACY_NOTICE_VERSION,
  });

  revalidatePath(`/ba/clients/${input.clientId}`);
}
