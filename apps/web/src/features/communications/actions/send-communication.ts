"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { communicationRepository } from "@/server/repositories/communication.repository";
import {
  sendCommunicationSchema,
  type SendCommunicationInput,
} from "../schemas/send-communication.schema";
import type { ClientId } from "@/types/client";

export interface SendCommunicationResult {
  ok: boolean;
  fieldErrors?: Record<string, string[]>;
  message?: string;
  communicationId?: string;
}

export async function sendCommunication(
  raw: SendCommunicationInput,
): Promise<SendCommunicationResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "communications:write"))
    return { ok: false, message: "Sin permiso" };

  const parsed = sendCommunicationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  const created = await communicationRepository.create({
    clientId: input.clientId as ClientId,
    baId: staff.id,
    brand: input.brand,
    channel: input.channel,
    direction: "outbound",
    at: new Date().toISOString(),
    body: input.body,
    status: "sent",
    ...(input.templateId ? { templateId: input.templateId } : {}),
  });

  revalidatePath("/ba/followup");
  revalidatePath(`/ba/clients/${input.clientId}`);
  return { ok: true, communicationId: created.id };
}
