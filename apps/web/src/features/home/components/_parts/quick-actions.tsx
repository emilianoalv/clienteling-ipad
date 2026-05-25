import Link from "next/link";
import { Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";

interface QuickAction {
  icon: IconName;
  label: string;
  sub: string;
  href: string;
}

const ACTIONS: readonly QuickAction[] = [
  { icon: "plus", label: "Nuevo cliente", sub: "Registra un nuevo cliente", href: "/ba/clients/new" },
  { icon: "search", label: "Buscar cliente", sub: "Encuentra un cliente", href: "/ba/clients" },
  { icon: "bag", label: "Registrar venta", sub: "Captura una compra", href: "/ba/sale/new" },
  { icon: "calendar", label: "Agendar cita", sub: "Programa una visita", href: "/ba/appointments/new" },
];

/**
 * 4 thumb-sized quick-action tiles. Mirrors prototype `QuickAction` row
 * (screens-home.jsx:113-128 + 262-272).
 */
export function QuickActions() {
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
        Acciones rápidas
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex items-center gap-3 bg-white border border-line rounded-lg px-4 py-3 transition-[background-color,border-color] hover:bg-bone hover:border-ink/[0.12] text-inherit no-underline"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 bg-bone rounded-md text-ink shrink-0">
              <Icon name={a.icon} size={18} />
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[16px] font-semibold leading-tight">{a.label}</span>
              <span className="text-[15.5px] font-medium leading-tight text-ink/60">{a.sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
