/**
 * `catalog` feature — public API (F3.3).
 */
export { CatalogBrowser, type CatalogBrowserProps } from "./components/catalog-browser";
export { FichaTecnicaModal, type FichaTecnicaModalProps } from "./components/ficha-tecnica-modal";
export { ProductCard } from "./components/product-card";
export { ProductDetail } from "./components/product-detail";
export { ProductThumb } from "./components/product-thumb";

export { listProducts, type ListProductsArgs } from "./server/list-products";
export { listProductTechs } from "./server/list-product-techs";
export { listStores } from "./server/list-stores";
