export type BrandId = "Lancôme" | "YSL";

export const BRAND_IDS = ["Lancôme", "YSL"] as const;

export function isBrandId(value: string): value is BrandId {
  return (BRAND_IDS as readonly string[]).includes(value);
}
