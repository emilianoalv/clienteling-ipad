import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import type { Purchase } from "@/types/purchase";

export interface DeriveAffinitiesInput {
  client: Client;
  purchases: readonly Purchase[];
  /** SKU → Product, ya cargado en fetch-client. */
  productBySku: Readonly<Record<string, Product>>;
}

/**
 * Construye una lista de afinidades del cliente combinando:
 *   - tier (Atelier / Icon)
 *   - líneas más compradas (top 2)
 *   - categoría predominante en compras (Sérum, Crema, Fragancia, etc.)
 *   - concerns prioritarios del perfil (top 2)
 *   - subtone si lo declaró
 *   - ingredientes preferidos (top 2)
 *   - familias olfativas de fragancias compradas
 *   - afinidades guardadas en `client.affinities` (seed manual)
 *
 * Devuelve etiquetas en español, ordenadas por relevancia y deduplicadas.
 * Cap de 8 para que la card no se desborde. Pura — testeable en isolación.
 */
export function deriveAffinities(input: DeriveAffinitiesInput): string[] {
  const { client, purchases, productBySku } = input;
  const ordered: string[] = [];
  const seen = new Set<string>();

  function push(label: string) {
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(label);
  }

  // 1. Tier — primera línea, define el "trato".
  if (client.tier === "Icon") push("Cliente Icon · alta gama");
  else if (client.tier === "Atelier") push("Tier Atelier");

  // 2. Líneas más compradas. Contamos unidades (qty) en lugar de tickets
  //    para que "comprar 3 Génifique en una venta" pese igual que "3 ventas
  //    separadas".
  const lineCount = new Map<string, number>();
  const catCount = new Map<string, number>();
  const fragFamilies = new Set<string>();
  for (const p of purchases) {
    for (const item of p.items) {
      const product = productBySku[item.sku as unknown as string];
      if (!product) continue;
      lineCount.set(product.line, (lineCount.get(product.line) ?? 0) + item.qty);
      if (product.attrs.tipo) {
        catCount.set(product.attrs.tipo, (catCount.get(product.attrs.tipo) ?? 0) + item.qty);
      }
      if (product.attrs.tipo === "Fragancia" && product.attrs.familia) {
        const first = product.attrs.familia.split(/\s+/)[0];
        if (first) fragFamilies.add(first.toLowerCase());
      }
    }
  }
  const topLines = [...lineCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [line, count] of topLines) {
    push(count >= 2 ? `Fan de ${line}` : `Lleva ${line}`);
  }

  // 3. Categoría predominante (mínimo 2 unidades para evitar ruido).
  const topCat = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] >= 2) {
    push(`Prefiere ${topCat[0].toLowerCase()}`);
  }

  // 4. Concerns del perfil — top 2, ya están priorizados por la BA.
  for (const concern of client.skin.concerns.slice(0, 2)) {
    push(`Foco: ${concern.toLowerCase()}`);
  }

  // 5. Subtone (color cosmetics).
  if (client.skin.subtone) push(`Subtono ${client.skin.subtone}`);

  // 6. Ingredientes preferidos.
  for (const ing of (client.preferredIngredients ?? []).slice(0, 2)) {
    push(`Le gusta ${ing}`);
  }

  // 7. Familia olfativa derivada de fragancias compradas.
  for (const family of fragFamilies) {
    push(`Fragancia ${family}`);
  }

  // 8. Afinidades manuales del seed (último — no las pierde, pero no las
  //    duplica si ya emergieron del análisis automático).
  for (const a of client.affinities) push(a);

  return ordered.slice(0, 8);
}
