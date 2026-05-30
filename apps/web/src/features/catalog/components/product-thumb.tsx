import type { BrandId } from "@/types/brand";

const BRAND_BG: Partial<Record<BrandId, string>> = {
  Lancôme: "bg-gradient-to-br from-bone to-lancome-rose text-lancome-ink",
  YSL: "bg-gradient-to-br from-ysl-ink to-ink text-ysl-gold",
};

/**
 * Thumbnail visual del producto. Si `image` se pasa, renderiza la foto
 * real del producto (servida desde `/public/products`). Si no, hace
 * fallback al gradient de marca con la inicial — placeholder usado para
 * SKUs sin imagen cargada y como fallback global.
 */
export function ProductThumb({
  brand,
  initial,
  height,
  image,
  alt,
}: {
  brand: BrandId;
  initial: string;
  height: number;
  image?: string;
  alt?: string;
}) {
  if (image) {
    return (
      // `object-contain` en lugar de `cover` para mostrar el frasco
      // completo — los recortes "cortaban" la tapa o la base de los
      // productos altos (perfumes 100ml). El fondo bone funciona como
      // padding visual neutral cuando la proporción del producto no
      // coincide con el cuadrado del thumb.
      <div
        className="overflow-hidden rounded-md bg-bone flex items-center justify-center"
        style={{ height }}
      >
        <img
          src={image}
          alt={alt ?? `${brand}`}
          loading="lazy"
          className="w-full h-full object-contain object-center p-2"
        />
      </div>
    );
  }

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
