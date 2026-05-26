import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/patterns";
import { SamplesScreen, listSamples, listSampleInventory } from "@/features/samples";
import { listPurchases } from "@/features/purchases";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { assignedBaScopeFor, brandScopeFor, storeScopeFor } from "@/server/auth/scope";

export default async function SamplesPage() {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);
  const baOwnerId = assignedBaScopeFor(staff);

  const [samples, purchases, inventory, clients] = await Promise.all([
    // Para BA: solo muestras que ella dio. Otros roles: todas en su scope.
    listSamples({ brands, ...(baOwnerId ? { baId: baOwnerId } : {}) }),
    listPurchases({ brands, storeIds }),
    listSampleInventory({ brands }),
    // El lookup de cliente NO filtra por assignedBaId aquí — porque queremos
    // ver el NOMBRE de cualquier cliente que aparezca en las muestras (sino
    // sale "Cliente desconocida"). Si el cliente vivía en otro BA pero le
    // di muestra a uno mío, su nombre tiene que aparecer.
    listClients({ brands, storeIds }),
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
