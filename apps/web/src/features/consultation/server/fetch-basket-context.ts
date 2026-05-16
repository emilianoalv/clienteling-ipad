import "server-only";
import { notFound } from "next/navigation";
import type { Client, ClientId } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { Recommendation, RecommendationId } from "@/types/recommendation";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { isStoreInScope } from "@/server/auth/scope";

export async function fetchBasketContext(
  clientId: string,
  recommendationId: string,
  staff: Staff,
): Promise<{
  client: Client;
  recommendation: Recommendation;
  productLookup: Record<Sku, Product>;
}> {
  const recommendation = await recommendationRepository.findById(
    recommendationId as RecommendationId,
  );
  if (!recommendation || recommendation.clientId !== (clientId as ClientId)) notFound();
  if (!isStoreInScope(staff, recommendation.storeId)) notFound();

  const [client, products] = await Promise.all([
    clientRepository.findById(clientId as ClientId),
    productRepository.list({}),
  ]);
  if (!client) notFound();
  if (!isStoreInScope(staff, client.storeId)) notFound();

  const productLookup = Object.fromEntries(products.map((p) => [p.sku, p])) as Record<Sku, Product>;
  return { client, recommendation, productLookup };
}
