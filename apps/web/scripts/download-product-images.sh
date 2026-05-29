#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# download-product-images.sh
#
# Descarga imágenes de producto desde lookfantastic.com (CDN static.thcdn.com)
# para los 27 SKUs del seed. Guarda en apps/web/public/products/{sku}.jpg
#
# Cómo funciona:
#   1. Para cada SKU, hace curl a la página de producto canónica
#   2. Extrae la primera imagen del CDN static.thcdn.com
#   3. Descarga a public/products/{sku}.jpg
#
# Logs:
#   - Éxitos a stdout
#   - Fallos en /tmp/product-images-failed.log con URL del producto para
#     descarga manual de respaldo
#
# Cómo correr (desde la raíz del repo, Git Bash o WSL):
#   bash apps/web/scripts/download-product-images.sh
#
# Si algún producto falla, abre la URL en el browser, click derecho sobre la
# imagen del producto → "Guardar imagen como" → nombre {sku-lower}.jpg en
# apps/web/public/products/
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${SCRIPT_DIR}/../public/products"
LOG_FAIL="/tmp/product-images-failed.log"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

mkdir -p "$DEST"
: > "$LOG_FAIL"

# Tabla: sku|product_page_url
# Las 27 URLs son canónicas de lookfantastic.com, curadas vía WebSearch para
# matchear (o aproximar lo más posible) el SKU del seed. Para Or Rouge YSL
# que no está en Lookfantastic, se usa Brown Thomas como fuente alternativa.
PRODUCTS=(
  # ─── Lancôme — skincare (5) ─────────────────────────────────────────────────
  "LC-GEN-50|https://www.lookfantastic.com/p/lancome-advanced-genifique-youth-activating-serum-various-sizes/12218773/"
  "LC-REN-50|https://www.lookfantastic.com/p/lancome-renergie-h.c.f-triple-serum-50ml/13451157/"
  "LC-ABS-50|https://www.lookfantastic.com/p/lancome-absolue-soft-cream-refill-60ml/16857837/"
  "LC-AEC-20|https://www.lookfantastic.com/p/lancome-absolue-the-eye-cream-20ml/15452162/"
  "LC-HZN-50|https://www.lookfantastic.com/p/lancome-hydra-zen-gel-cream-50ml/15420712/"
  # ─── Lancôme — makeup (4) ───────────────────────────────────────────────────
  "LC-TID-30|https://www.lookfantastic.com/p/lancome-teint-idole-ultra-wear-foundation-30ml-various-shades/14303958/"
  "LC-TCG-30|https://www.lookfantastic.com/p/lancome-teint-idole-ultra-wear-care-and-glow-30ml-various-colours/13874571/"
  "LC-TIC-13|https://www.lookfantastic.com/p/lancome-teint-idole-ultra-wear-all-over-concealer-13ml-various-shades/13028627/"
  "LC-LAR-34|https://www.lookfantastic.com/p/lancome-l-absolu-rouge-cream-lipstick-35ml-various-shades/13451099/"
  # ─── Lancôme — fragancias (5) ───────────────────────────────────────────────
  "LC-IDP-50|https://www.lookfantastic.com/p/lancome-idole-eau-de-parfum-50ml/12218754/"
  "LC-LVE-100|https://www.lookfantastic.com/p/lancome-la-vie-est-belle-eau-de-parfum-100ml/11185339/"
  "LC-LIA-100|https://www.lookfantastic.com/lancome-la-vie-est-belle-iris-absolu-eau-de-parfum-100ml/14205248.html"
  "LC-TRE-100|https://www.lookfantastic.com/p/lancome-tresor-eau-de-parfum-50ml/11077804/"
  "LC-MIR-100|https://www.lookfantastic.com/p/lancome-miracle-eau-de-parfum-50ml/10560379/"
  # ─── YSL — fragancias (4) ───────────────────────────────────────────────────
  "YS-LIB-90|https://www.lookfantastic.com/p/yves-saint-laurent-libre-eau-de-parfum-90ml/12218722/"
  "YS-BO-50|https://www.lookfantastic.com/p/yves-saint-laurent-black-opium-eau-de-parfum-50ml/11791423/"
  "YS-Y-60|https://www.lookfantastic.com/p/yves-saint-laurent-y-eau-de-parfum-60ml/11866960/"
  "YS-MYS-60|https://www.lookfantastic.com/p/yves-saint-laurent-myslf-eau-de-parfum-60ml/14850419/"
  # ─── YSL — labios (3) ──────────────────────────────────────────────────────
  "YS-RPC-01|https://www.lookfantastic.com/p/yves-saint-laurent-rouge-pur-couture-the-bold-lipstick-3g-various-shades/14218300/"
  "YS-TC-01|https://www.lookfantastic.com/yves-saint-laurent-tatouage-couture-velvet-cream-6ml-various-shades/12435264.html"
  "YS-LS-01|https://www.lookfantastic.com/p/yves-saint-laurent-rouge-volupte-candy-lip-gloss-3.2ml-various-shades/13836818/"
  # ─── YSL — rostro (4) ──────────────────────────────────────────────────────
  "YS-AHF-25|https://www.lookfantastic.com/p/yves-saint-laurent-all-hours-luminous-matte-foundation-with-spf-39-25ml-various-shades/13836827/"
  "YS-NPR-30|https://www.lookfantastic.com/p/yves-saint-laurent-nu-bare-look-tint-30ml-various-shades/13625665/"
  "YS-TCL-02|https://www.lookfantastic.com/p/yves-saint-laurent-touche-eclat-highlighter-pen-2.5ml-various-shades/11794632/"
  "YS-LC-01|https://www.lookfantastic.com/p/yves-saint-laurent-lash-clash-extreme-volume-mascara-9ml/13451486/"
  # ─── YSL — skincare (1) ────────────────────────────────────────────────────
  # Or Rouge no está en Lookfantastic ni en CDNs accesibles vía curl. Se
  # resuelve después del loop copiando ys-pse-15.jpg como placeholder
  # (otro skincare premium YSL en frasco similar).
  "YS-PSE-15|https://www.lookfantastic.com/p/yves-saint-laurent-pure-shots-serum-y-shape-various-types/12504765/"
)

ok_count=0
fail_count=0

fetch_one() {
  local sku="$1" product_url="$2"
  local dest_jpg product_html image_url

  dest_jpg="${DEST}/$(echo "$sku" | tr '[:upper:]' '[:lower:]').jpg"

  product_html=$(curl -sL -A "$UA" --max-time 25 "$product_url") || return 1
  if [[ -z "$product_html" ]]; then return 1; fi

  # Lookfantastic usa static.thcdn.com. Brown Thomas usa CDN propio. Probamos
  # ambos patrones; el primer match suele ser la imagen principal del producto.
  # Captura tanto el patrón viejo (productimg/{w}/{h}/...) como el nuevo
  # (productimg/original/...) y excluye query strings que se cuelan al
  # extraer con grep — sed corta en el primer & por si entró un parámetro.
  image_url=$(printf '%s' "$product_html" \
    | grep -oE 'https://static\.thcdn\.com/productimg/[^"'\'' ]+\.jpg' \
    | sed 's/[&?].*$//' \
    | head -n 1)

  if [[ -z "$image_url" ]]; then
    # Fallback Brown Thomas / otros: cualquier .jpg en CDN público
    image_url=$(printf '%s' "$product_html" \
      | grep -oE 'https://[a-zA-Z0-9.-]+\.(brownthomas|cloudinary|imgix|akamaized)\.[^"'\'']+\.(jpg|jpeg)' \
      | head -n 1)
  fi

  if [[ -z "$image_url" ]]; then return 1; fi

  curl -sL -A "$UA" --max-time 30 -o "$dest_jpg" "$image_url" || return 1

  if ! file "$dest_jpg" 2>/dev/null | grep -qE "JPEG|JPG"; then
    rm -f "$dest_jpg"
    return 1
  fi

  printf "  → %s (%s)\n" "$(basename "$dest_jpg")" "$(stat -c '%s' "$dest_jpg" 2>/dev/null || wc -c < "$dest_jpg") bytes"
  return 0
}

echo "Descargando 27 imágenes de producto a: $DEST"
echo ""

for entry in "${PRODUCTS[@]}"; do
  sku="${entry%%|*}"
  product_url="${entry#*|}"
  printf "[%s]\n" "$sku"

  if fetch_one "$sku" "$product_url"; then
    ok_count=$((ok_count + 1))
  else
    fail_count=$((fail_count + 1))
    printf "  ✗ FAIL — descarga manual:\n"
    printf "      Abre: %s\n" "$product_url"
    printf "      Click derecho sobre imagen del producto → Guardar como\n"
    printf "      Nombre: %s.jpg → en %s/\n" "$(echo "$sku" | tr '[:upper:]' '[:lower:]')" "$DEST"
    printf "%s | %s\n" "$sku" "$product_url" >> "$LOG_FAIL"
  fi
done

# ── Fallbacks ──────────────────────────────────────────────────────────────
# Para SKUs sin fuente accesible vía curl, copiamos la imagen de otro
# producto cercano de la misma marca + categoría. Honesto: el demo se ve
# completo y el reemplazo manual es trivial cuando la fuente reaparezca.

# YS-OR-100 (Or Rouge serum) → YS-PSE-15 (Pure Shots serum, mismo
# segmento skincare premium YSL).
if [[ -f "${DEST}/ys-pse-15.jpg" && ! -f "${DEST}/ys-or-100.jpg" ]]; then
  cp "${DEST}/ys-pse-15.jpg" "${DEST}/ys-or-100.jpg"
  echo ""
  echo "[YS-OR-100] (fallback) ← copia de ys-pse-15.jpg"
fi

# LC-MIR-100 (Miracle 100ml) → LC-TRE-100 (Trésor, otro EDP Lancôme
# clásico). Lookfantastic descontinuó las páginas de Miracle.
if [[ -f "${DEST}/lc-tre-100.jpg" && ! -f "${DEST}/lc-mir-100.jpg" ]]; then
  cp "${DEST}/lc-tre-100.jpg" "${DEST}/lc-mir-100.jpg"
  echo "[LC-MIR-100] (fallback) ← copia de lc-tre-100.jpg"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "Resumen: ${ok_count} OK · ${fail_count} fallaron"
if [[ "$fail_count" -gt 0 ]]; then
  echo "Log de fallos: $LOG_FAIL"
fi
echo "─────────────────────────────────────────────────────────────"
