import { SectionHeader } from "@/components/patterns";
import { DevicesScreen, listDevices } from "@/features/devices";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import { getT } from "@/lib/i18n/get-t";
import { buildBaLookup } from "@/features/devices/server/build-ba-lookup";

export default async function ManagerDevicesPage() {
  const { staff } = await requireSession();
  const t = await getT();
  // Scope: Gerente solo ve dispositivos de su tienda. Supervisor su zona.
  // Admin sin scope (nacional). Antes la query era sin filtros — Camila
  // Santos (Gerente Polanco) veía iPads de Palacio y Santa Fe.
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);
  const [devices, stores, baLookup] = await Promise.all([
    listDevices({ ...(storeIds ? { storeIds } : {}), ...(brands ? { brands } : {}) }),
    storeRepository.list(),
    buildBaLookup(),
  ]);
  const storeLookup = Object.fromEntries(stores.map((s) => [s.id, s.name]));
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("devices.title")} eyebrow={t("rail.devices")} />
      <DevicesScreen devices={devices} storeLookup={storeLookup} baLookup={baLookup} />
    </section>
  );
}
