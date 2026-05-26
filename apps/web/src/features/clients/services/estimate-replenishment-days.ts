import type { Product } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";

export interface EstimateReplenishmentInput {
  product: Product;
  /** Unidades compradas. Si el cliente compró 2 frascos, dura el doble. */
  qty?: number;
  /** Ficha técnica opcional — ajusta por frecuencia real declarada. */
  tech?: ProductTech | null;
}

/**
 * Estima en cuántos días el cliente va a necesitar reponer un producto.
 *
 * Heurística:
 *   1. Parte del `lifecycleDays` del producto, que asume uso diario típico
 *      para la categoría y tamaño. Valores calibrados en `product.repository`.
 *   2. Multiplica por `qty` — comprar 2 frascos = dura el doble. La BA suele
 *      ofrecer reposición uno por uno, no en batches.
 *   3. Si hay ficha técnica con frecuencia distinta a diario, escala:
 *      - "2 veces por semana" → ×2.5
 *      - "Según necesidad" / "ocasional" → ×4
 *      - Cualquier otra cosa → sin ajuste (asume diario)
 *
 * Pura — testable en isolación. La query
 * `get-estimated-replenishments` la usa para decidir cuándo aparece la
 * alerta de reposición en el panel.
 */
export function estimateReplenishmentDays(input: EstimateReplenishmentInput): number {
  const qty = Math.max(1, input.qty ?? 1);
  let base = input.product.lifecycleDays;

  if (input.tech) {
    const freq = input.tech.usage.frequency.toLowerCase();
    if (/2\s*veces|dos\s*veces|por\s*semana/.test(freq)) {
      base = base * 2.5;
    } else if (/necesidad|ocasional|evento/.test(freq)) {
      base = base * 4;
    }
    // "Diario" y similares — sin ajuste.
  }

  return Math.round(base * qty);
}
