"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, BrandTag, Button, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { NewClientWizard } from "./new-client-wizard";
import {
  findClientByContact,
  linkClientToBa,
  type ClientLite,
} from "../actions/find-or-link-client";

export interface ClientSearchOrCreateProps {
  storeName: string;
  baName: string;
  baBrand: string;
  defaultBrands: readonly string[];
}

type Phase = "search" | "wizard";

/**
 * Pantalla previa al wizard de alta. Evita duplicados: la BA primero
 * busca por email/teléfono. Si la clienta ya existe (otra BA u otra
 * marca), se vincula con un click — no se duplica el registro.
 *
 * Solo si NO existe, lleva al wizard tradicional para captura completa.
 */
export function ClientSearchOrCreate({
  storeName,
  baName,
  baBrand,
  defaultBrands,
}: ClientSearchOrCreateProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("search");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState<string | null>(null);
  const [match, setMatch] = useState<ClientLite | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isLinking, startLink] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setError("Escribe al menos 3 caracteres (email o teléfono).");
      return;
    }
    setError(null);
    startSearch(async () => {
      const result = await findClientByContact(trimmed);
      setSearched(trimmed);
      setMatch(result);
    });
  }

  function onLink(clientId: ClientLite["id"]) {
    startLink(async () => {
      const result = await linkClientToBa(clientId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/ba/clients/${result.clientId}`);
    });
  }

  if (phase === "wizard") {
    return (
      <NewClientWizard
        storeName={storeName}
        baName={baName}
        defaultBrands={defaultBrands}
      />
    );
  }

  return (
    <div className="max-w-[720px] mx-auto flex flex-col gap-5 py-4">
      <header>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Nuevo cliente
        </div>
        <h2 className="m-0 mt-1 font-display text-[28px] leading-tight tracking-[-0.01em]">
          ¿La conoces ya?
        </h2>
        <p className="m-0 mt-1.5 text-[15.5px] text-ink/65 leading-snug">
          Antes de registrar, busca por correo o celular. Si ya existe en la app
          (atendida por ti u otra BA), te ahorras capturar todo de nuevo y la
          vinculas a tu lista con un click.
        </p>
      </header>

      <Card variant="luxe" className="flex flex-col gap-4">
        <form onSubmit={runSearch} className="flex gap-2.5 items-end">
          <div className="relative flex-1">
            <Input
              label="Correo o teléfono del cliente"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searched) {
                  setSearched(null);
                  setMatch(null);
                }
              }}
              placeholder="ana@correo.com o 5512345678"
              autoFocus
              className="pl-9"
            />
            <span className="absolute left-3 top-[34px] text-ink/40 pointer-events-none">
              <Icon name="search" size={16} />
            </span>
          </div>
          <Button type="submit" variant="primary" loading={isSearching} className="h-10 mb-px">
            Buscar
          </Button>
        </form>
        {error ? (
          <p className="m-0 text-[14px] text-err font-medium">{error}</p>
        ) : null}

        {searched && !isSearching ? (
          match ? (
            <MatchCard
              client={match}
              baBrand={baBrand}
              onLink={onLink}
              isLinking={isLinking}
            />
          ) : (
            <NoMatchPanel query={searched} onContinue={() => setPhase("wizard")} />
          )
        ) : null}
      </Card>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setPhase("wizard")}
          className="bg-transparent border-0 text-[14.5px] text-ink/60 underline underline-offset-4 cursor-pointer hover:text-ink"
        >
          Saltarme la búsqueda y registrar nuevo cliente
        </button>
      </div>
    </div>
  );
}

function MatchCard({
  client,
  baBrand,
  onLink,
  isLinking,
}: {
  client: ClientLite;
  baBrand: string;
  onLink: (id: ClientLite["id"]) => void;
  isLinking: boolean;
}) {
  return (
    <div className="rounded-md border border-ok/30 bg-ok/[0.05] p-4 flex flex-col gap-3">
      <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-ok">
        Ya existe en la app
      </div>
      <div className="flex items-center gap-3.5">
        <Avatar initials={initials(client.name)} size={48} />
        <div className="flex-1 min-w-0">
          <div className="text-[16.5px] font-semibold leading-tight">{client.name}</div>
          <div className="text-[14px] text-ink/65 leading-snug mt-0.5">
            {client.phone} · {client.email}
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {client.brands.map((b) => (
              <BrandTag key={b} brand={b as never} alwaysShow />
            ))}
          </div>
        </div>
      </div>
      {client.alreadyMine ? (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => onLink(client.id)}
            loading={isLinking}
          >
            Abrir perfil
          </Button>
        </div>
      ) : (
        <>
          <p className="m-0 text-[14.5px] text-ink/70 leading-snug">
            {client.brands.includes(baBrand as never)
              ? "Atendida por otra BA. Al confirmar quedará también en tu lista."
              : `Atendida sólo en otra marca. Al confirmar se agrega ${baBrand} y queda visible para ti.`}
          </p>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => onLink(client.id)}
              loading={isLinking}
              leading={<Icon name="check" />}
            >
              Es esta cliente — atender
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function NoMatchPanel({ query, onContinue }: { query: string; onContinue: () => void }) {
  return (
    <div className="rounded-md border border-warn/30 bg-warn/[0.06] p-4 flex flex-col gap-2.5">
      <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-warn">
        Sin coincidencias
      </div>
      <p className="m-0 text-[14.5px] text-ink/75 leading-snug">
        No encontramos a nadie con &ldquo;{query}&rdquo;. ¿Es una cliente nueva? Te
        llevamos al formulario completo de alta.
      </p>
      <div className="flex justify-end">
        <Button variant="primary" onClick={onContinue} trailing={<Icon name="arrow-right" />}>
          Registrar nueva cliente
        </Button>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}
