"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Client } from "@/types/client";
import { Avatar, type AvatarTone, Input } from "@/components/primitives";

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function tone(brand: string | undefined): AvatarTone {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

export interface SaleClientPickerProps {
  clients: readonly Client[];
}

/**
 * Picker simple para arrancar el flow de registrar venta desde Hoy.
 * Al seleccionar un cliente navega al form que ya existe en el perfil
 * (`/ba/clients/[id]/sale`) — así no duplicamos el RegisterSaleForm y
 * la BA termina en el mismo lugar que si hubiera entrado por el perfil.
 */
export function SaleClientPicker({ clients }: SaleClientPickerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients.slice(0, 12);
    return clients
      .filter((c) =>
        `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(needle),
      )
      .slice(0, 12);
  }, [clients, query]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Busca al cliente por nombre, email o teléfono…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {matches.length === 0 ? (
        <p className="m-0 px-2 py-6 text-center text-[15px] text-ink/60">
          Sin resultados para &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => router.push(`/ba/clients/${c.id}/sale`)}
                className="grid grid-cols-[40px_1fr_auto] gap-3 items-center w-full p-3 bg-white border border-line rounded-lg cursor-pointer text-left text-ink hover:border-ink/30 hover:bg-bone/40 transition-colors"
              >
                <Avatar initials={initials(c.name)} size={36} tone={tone(c.brands[0])} />
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold leading-tight truncate">{c.name}</div>
                  <div className="text-[14px] text-ink/60 leading-snug truncate">
                    {c.phone} · {c.email}
                  </div>
                </div>
                <span className="text-[13.5px] font-semibold text-ink/55 uppercase tracking-[0.06em]">
                  {c.brands[0]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
