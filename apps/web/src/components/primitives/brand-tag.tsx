"use client";

import { useBrandLock } from "@/stores/brand-lock.store";
import type { BrandId } from "@/types/brand";
import { Chip, type ChipSize, type ChipVariant } from "./chip";

export interface BrandTagProps {
  brand: BrandId;
  size?: ChipSize;
  /**
   * When true, the tag still renders even if it matches the active brand lock.
   * Default false: a tag for the locked brand is implicit and gets hidden.
   */
  alwaysShow?: boolean;
}

const VARIANT_BY_BRAND: Partial<Record<BrandId, ChipVariant>> = {
  Lancôme: "lancome",
  YSL: "ysl",
};

export function BrandTag({ brand, size = "sm", alwaysShow = false }: BrandTagProps) {
  const lock = useBrandLock((s) => s.lock);
  if (!alwaysShow && lock && lock === brand) return null;
  return (
    <Chip variant={VARIANT_BY_BRAND[brand] ?? "neutral"} size={size}>
      {brand}
    </Chip>
  );
}
