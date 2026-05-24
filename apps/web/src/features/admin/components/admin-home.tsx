"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuditEvent } from "@/types/audit-event";
import type { Product } from "@/types/product";
import type { Template } from "@/types/template";
import type { User } from "@/types/user";
import { Button, Chip, Icon } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
import { PreviewDialog } from "@/components/feedback";
import { AuditLog } from "./audit-log";

const ROLE_SCOPES: ReadonlyArray<{ role: string; scopes: readonly string[] }> = [
  {
    role: "BA",
    scopes: ["Ver sus clientas", "Crear interacciones", "Recomendar", "Enviar seguimientos"],
  },
  { role: "Gerente", scopes: ["Ver su tienda", "Coaching", "Dispositivos", "Incidencias"] },
  { role: "Supervisor", scopes: ["Ver su zona", "Reportes de zona", "Revisar BAs"] },
  {
    role: "Admin",
    scopes: ["Acceso global", "Catálogo", "Plantillas", "Auditoría", "Integraciones"],
  },
];

type PreviewKey = "users" | "templates" | "catalog";

const PREVIEW_FEATURE: Record<PreviewKey, string> = {
  users: "usuarios",
  templates: "plantillas de seguimiento",
  catalog: "catálogo de productos",
};

export interface AdminHomeProps {
  users: readonly User[];
  products: readonly Product[];
  templates: readonly Template[];
  auditEvents: readonly AuditEvent[];
  privacyNoticeVersion: string;
  storeLookup: Readonly<Record<string, string>>;
}

export function AdminHome({
  users,
  products,
  templates,
  auditEvents,
  privacyNoticeVersion,
  storeLookup,
}: AdminHomeProps) {
  const [openPreview, setOpenPreview] = useState<PreviewKey | null>(null);

  const lancomeCount = products.filter((p) => p.brand === "Lancôme").length;
  const yslCount = products.filter((p) => p.brand === "YSL").length;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
      <Card variant="luxe" className="col-span-3">
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Admin Central · L&apos;Oréal Luxe México
        </span>
        <h1 className="m-0 font-display text-[30px] leading-tight">Gobernanza del sistema</h1>
        <p className="m-0 mt-1 text-[16px] max-w-[680px]">
          Acceso completo a usuarios, catálogo, privacidad, auditoría. Los equipos corporativos
          (Marketing, CRM, Retail, HQ) comparten este rol con scopes distintos.
        </p>
      </Card>

      <Card>
        <header className="flex items-baseline justify-between">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Usuarios & roles
            </span>
            <div className="font-display text-[22px] mt-0.5">{users.length} activos</div>
          </div>
          <Link href="/admin/users" className="text-[15px] font-semibold text-ink/60 hover:text-ink no-underline">
            Ver todos →
          </Link>
        </header>
        <ul className="list-none m-0 mt-3 p-0">
          {users.slice(0, 5).map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-[1fr_auto] gap-2 items-center py-2 border-b border-dashed border-line last:border-b-0"
            >
              <div>
                <div className="text-[16px] font-medium">{u.name}</div>
                <div className="text-[15px] text-ink/60">{describeScope(u, storeLookup)}</div>
              </div>
              <Chip size="sm">{u.role}</Chip>
            </li>
          ))}
        </ul>
        <Button
          variant="default"
          size="sm"
          className="mt-3"
          leading={<Icon name="plus" size={12} />}
          onClick={() => setOpenPreview("users")}
        >
          Crear usuario
        </Button>
      </Card>

      <Card>
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Permisos por rol
        </span>
        <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-2">
          {ROLE_SCOPES.map((r) => (
            <li key={r.role} className="p-2.5 bg-bone rounded-md">
              <div className="text-[16px] font-semibold">{r.role}</div>
              <div className="text-[15px] text-ink/60 mt-0.5">{r.scopes.join(" · ")}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Catálogo · gobernanza
        </span>
        <div className="mt-2">
          <KvRow label="SKUs Lancôme" value={String(lancomeCount)} mono />
          <KvRow label="SKUs YSL" value={String(yslCount)} mono />
          <KvRow label="Plantillas seguimiento" value={String(templates.length)} mono />
          <KvRow label="Aviso de privacidad" value={privacyNoticeVersion} dashed={false} />
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="default"
            size="sm"
            leading={<Icon name="plus" size={12} />}
            onClick={() => setOpenPreview("templates")}
          >
            Nueva plantilla
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setOpenPreview("catalog")}
          >
            Actualizar catálogo
          </Button>
        </div>
      </Card>

      <div className="col-span-3">
        <AuditLog events={auditEvents.slice(0, 4)} compact />
      </div>
      </div>

      <PreviewDialog
        open={openPreview !== null}
        onClose={() => setOpenPreview(null)}
        feature={openPreview ? PREVIEW_FEATURE[openPreview] : ""}
      />
    </>
  );
}

function describeScope(u: User, storeLookup: Readonly<Record<string, string>>): string {
  if (u.team) return u.team;
  if (u.zone) return u.zone;
  if (u.storeId) return storeLookup[u.storeId] ?? u.storeId;
  if (u.storeIds && u.storeIds.length) return `${u.storeIds.length} tiendas`;
  return "—";
}
