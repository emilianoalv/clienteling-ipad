"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
import type { Client, ClientId } from "@/types/client";

export interface ClientLite {
  id: ClientId;
  name: string;
  phone: string;
  email: string;
  brands: readonly string[];
  storeId: string;
  /** true si el BA actual ya está en assignedBaIds del cliente. */
  alreadyMine: boolean;
}

/**
 * Búsqueda global por email o teléfono — sin scope. La usa el "buscar
 * o crear" del flujo de alta para evitar duplicados. Si encuentra a la
 * clienta de otra BA o marca, la devuelve para que la BA actual la
 * vincule en vez de duplicar el registro.
 *
 * El query mínimo son 3 caracteres (evitar matches espurios al teclear).
 */
export async function findClientByContact(query: string): Promise<ClientLite | null> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:read")) return null;

  const trimmed = query.trim();
  if (trimmed.length < 3) return null;

  const client = await clientRepository.findByContact(trimmed);
  if (!client) return null;

  return toLite(client, staff.id as string);
}

/**
 * Vincula al BA actual con el cliente: agrega su id a `assignedBaIds`
 * (idempotente) y, si el BA es de una marca que el cliente no tenía
 * todavía, también la agrega a `brands` (auto-vinculación multi-brand).
 *
 * Solo aplica a BA — otros roles no necesitan vincular porque ven todo
 * en su scope. Si el caller es otro rol, devuelve error.
 */
export async function linkClientToBa(
  clientId: ClientId,
): Promise<{ ok: true; clientId: ClientId } | { ok: false; message: string }> {
  const { staff } = await requireSession();
  if (staff.role !== "BA") {
    return { ok: false, message: "Solo BAs pueden vincular clientes." };
  }
  if (!can(staff.role, "clients:write")) {
    return { ok: false, message: "Sin permiso." };
  }
  const linked = await clientRepository.linkBa(clientId, staff.id, staff.brand);
  if (!linked) return { ok: false, message: "Cliente no encontrado." };
  revalidatePath("/ba/clients");
  return { ok: true, clientId };
}

function toLite(client: Client, baId: string): ClientLite {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    brands: client.brands,
    storeId: client.storeId as unknown as string,
    alreadyMine: (client.assignedBaIds ?? []).includes(baId as never),
  };
}
