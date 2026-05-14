import "server-only";
import { notFound } from "next/navigation";
import type { Client, ClientId } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { Recommendation, RecommendationId } from "@/types/recommendation";
import { clientRepository } from "@/server/repositories/client.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";

export async function fetchBasketContext(
  clientId: string,
  recommendationId: string,
): Promise<{
  client: Client;
  recommendation: Recommendation;
  productLookup: Record<Sku, Product>;
}> {
  const recommendation = await recommendationRepository.findById(
    recommendationId as RecommendationId,
  );
  if (!recommendation || recommendation.clientId !== (clientId as ClientId)) notFound();

  const [client, products] = await Promise.all([
    clientRepository.findById(clientId as ClientId),
    productRepository.list({}),
  ]);
  if (!client) notFound();

  const productLookup = Object.fromEntries(products.map((p) => [p.sku, p])) as Record<Sku, Product>;
  return { client, recommendation, productLookup };
}
