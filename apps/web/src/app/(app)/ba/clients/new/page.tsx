import { NewClientWizard } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import type { StoreId } from "@/types/store";
import type { BrandId } from "@/types/brand";

export default async function NewClientPage() {
  const { staff } = await requireSession();
  const storeId = "storeId" in staff ? (staff.storeId as StoreId) : null;
  const store = storeId ? await storeRepository.findById(storeId) : null;

  // Marca por default = la del BA logueado. Si es Gerente/Supervisor/Admin
  // con scope multi-brand, usamos la primera de su lista. Antes esto estaba
  // hardcoded a Lancôme en el wizard, por eso las BAs YSL no veían sus
  // clientes recién creados (quedaban como Lancôme y se filtraban fuera).
  const defaultBrands: readonly BrandId[] =
    staff.role === "BA"
      ? [staff.brand]
      : staff.brands && staff.brands.length > 0
        ? [staff.brands[0]!]
        : ["Lancôme"];

  return (
    <NewClientWizard
      storeName={store?.name ?? "—"}
      baName={staff.name}
      defaultBrands={defaultBrands}
    />
  );
}
