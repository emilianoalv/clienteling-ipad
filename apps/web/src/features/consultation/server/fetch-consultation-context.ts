import "server-only";
import { notFound } from "next/navigation";
import type { Client, ClientId } from "@/types/client";
import type { Product } from "@/types/product";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { isStoreInScope } from "@/server/auth/scope";

export async function fetchConsultationContext(
  clientId: string,
  staff: Staff,
): Promise<{ client: Client; products: Product[] }> {
  const [client, products] = await Promise.all([
    clientRepository.findById(clientId as ClientId),
    productRepository.list({ brands: staff.brands }),
  ]);
  if (!client) notFound();
  if (!isStoreInScope(staff, client.storeId)) notFound();
  return { client, products };
}
