import Link from "next/link";
import { Icon } from "@/components/primitives";
import { fetchClient, RegisterVisitForm } from "@/features/clients";
import { productRepository } from "@/server/repositories/product.repository";
import { requireSession } from "@/server/auth/session";

export default async function RegisterVisitPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const [client, products] = await Promise.all([
    fetchClient(clientId),
    productRepository.list({ brands: staff.brands }),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href={`/ba/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          <strong>{client.name}</strong>
        </Link>
        <span className="text-ink/40">/</span>
        <span className="text-ink/60">Registrar visita</span>
      </nav>

      <RegisterVisitForm client={client} products={products} baName={staff.name} />
    </section>
  );
}
