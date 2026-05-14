import type { BrandId } from "@/types/brand";

const BRAND_BG: Partial<Record<BrandId, string>> = {
  Lancôme: "bg-gradient-to-br from-bone to-lancome-rose text-lancome-ink",
  YSL: "bg-gradient-to-br from-ysl-ink to-ink text-ysl-gold",
};

export function ProductThumb({
  brand,
  initial,
  height,
}: {
  brand: BrandId;
  initial: string;
  height: number;
}) {
  const cls = BRAND_BG[brand] ?? "bg-bone text-ink";
  return (
    <div
      className={`flex items-center justify-center rounded-md font-display tracking-[-0.02em] ${cls}`}
      style={{ height, fontSize: Math.round(height * 0.4) }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
