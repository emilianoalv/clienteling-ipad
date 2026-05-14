import "server-only";
import { notFound } from "next/navigation";
import type { BrandId } from "@/types/brand";
import type { Client, ClientId } from "@/types/client";
import type { Product } from "@/types/product";
import { clientRepository } from "@/server/repositories/client.repository";
import { productRepository } from "@/server/repositories/product.repository";

export async function fetchConsultationContext(
  clientId: string,
  brands?: readonly BrandId[],
): Promise<{ client: Client; products: Product[] }> {
  const [client, products] = await Promise.all([
    clientRepository.findById(clientId as ClientId),
    productRepository.list({ brands }),
  ]);
  if (!client) notFound();
  return { client, products };
}
