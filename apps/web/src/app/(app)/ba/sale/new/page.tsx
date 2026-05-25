import Link from "next/link";
import { Icon } from "@/components/primitives";
import { listClients } from "@/features/clients";
import { SaleClientPicker } from "@/features/clients/components/sale-client-picker";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";

/**
 * Punto de entrada para "Registrar venta" desde Hoy / acciones rápidas.
 * La BA elige al cliente primero y luego cae al RegisterSaleForm
 * canónico del perfil — evita duplicar el form en otra ruta.
 */
export default async function NewSalePage() {
  const { staff } = await requireSession();
  const clients = await listClients({
    brands: brandScopeFor(staff),
    storeIds: storeScopeFor(staff),
  });

  return (
    <section className="flex flex-col gap-4 max-w-[720px]">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href="/ba/home"
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Volver a Hoy
        </Link>
      </nav>

      <header>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Registrar venta
        </div>
        <h1 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
          ¿Para qué cliente?
        </h1>
        <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
          Busca al cliente — al elegirlo te llevamos al formulario de
          venta con su información cargada.
        </p>
      </header>

      <SaleClientPicker clients={clients} />
    </section>
  );
}
