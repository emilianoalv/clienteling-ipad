import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/patterns";
import { SamplesScreen, listSamples, listSampleInventory } from "@/features/samples";
import { listPurchases } from "@/features/purchases";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { storeScopeFor } from "@/server/auth/scope";

export default async function SamplesPage() {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const scope = storeScopeFor(staff);

  const [samples, purchases, inventory, clients] = await Promise.all([
    listSamples({ brands: staff.brands }),
    listPurchases({ brands: staff.brands, storeIds: scope }),
    listSampleInventory({ brands: staff.brands }),
    listClients({ brands: staff.brands, storeIds: scope }),
  ]);

  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("samples.title")} eyebrow={t("rail.samples")} />
      <SamplesScreen
        samples={samples}
        purchases={purchases}
        inventory={inventory}
        clientLookup={clientLookup}
      />
    </section>
  );
}
