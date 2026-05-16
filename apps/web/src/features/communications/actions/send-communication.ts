"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { homeStoreFor, isStoreInScope } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
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

  const storeId = homeStoreFor(staff);
  if (!storeId) return { ok: false, message: "Tu rol no tiene tienda asignada para enviar comunicaciones." };

  const parsed = sendCommunicationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  const client = await clientRepository.findById(input.clientId as ClientId);
  if (!client || !isStoreInScope(staff, client.storeId)) {
    return { ok: false, message: "Cliente no encontrado" };
  }

  const created = await communicationRepository.create({
    clientId: input.clientId as ClientId,
    baId: staff.id,
    brand: input.brand,
    storeId,
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
