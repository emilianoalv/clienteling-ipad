export type BrandId = "Lancôme" | "YSL" | "Kiehl's" | "Armani" | "Prada" | "Valentino";

export const BRAND_IDS = ["Lancôme", "YSL", "Kiehl's", "Armani", "Prada", "Valentino"] as const;

export function isBrandId(value: string): value is BrandId {
  return (BRAND_IDS as readonly string[]).includes(value);
}
