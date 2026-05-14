import { SectionHeader } from "@/components/patterns";
import { DevicesScreen, listDevices } from "@/features/devices";
import { buildBaLookup } from "@/features/devices/server/build-ba-lookup";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import { getT } from "@/lib/i18n/get-t";

export default async function HqDevicesPage() {
  await requireSession();
  const t = await getT();
  const [devices, stores] = await Promise.all([listDevices(), storeRepository.list()]);
  const storeLookup = Object.fromEntries(stores.map((s) => [s.id, s.name]));
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("devices.title")} eyebrow={t("rail.devices")} />
      <DevicesScreen devices={devices} storeLookup={storeLookup} baLookup={buildBaLookup()} />
    </section>
  );
}
