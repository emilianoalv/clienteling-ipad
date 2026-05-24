import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Client } from "@/types/client";
import type { Interaction } from "@/types/interaction";
import type { Purchase } from "@/types/purchase";
import type { Sample } from "@/types/sample";
import type { Recommendation } from "@/types/recommendation";
import type { Consent } from "@/types/consent";
import type { Appointment } from "@/types/appointment";
import type { Communication } from "@/types/communication";
import type { FollowupTask } from "@/types/followup-task";
import type { Product } from "@/types/product";
import type { Template } from "@/types/template";
import { Avatar, type AvatarTone, BrandTag, Button, Chip, Icon } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { ClientProfileTabs } from "./client-profile-tabs";
import { LuxeCircleCard } from "./side-panel/luxe-circle-card";
import { SkinProfileCard } from "./side-panel/skin-profile-card";
import { InterestsCard } from "./side-panel/interests-card";
import { UpcomingEventsCard } from "./side-panel/upcoming-events-card";
import { AffinitiesCard } from "./side-panel/affinities-card";
import { AppointmentsCard } from "./side-panel/appointments-card";
import { ConsentSummaryCard } from "./side-panel/consent-summary-card";
import { ArcoRightsCard } from "./side-panel/arco-rights-card";
import { UpcomingFollowupsCard } from "./side-panel/upcoming-followups-card";
import { segmentClient } from "../services/segment-client";
import { formatCurrency } from "@/lib/format/format-currency";

export interface ClientProfileProps {
  client: Client;
  interactions: readonly Interaction[];
  purchases: readonly Purchase[];
  samples: readonly Sample[];
  recommendations: readonly Recommendation[];
  consents: readonly Consent[];
  appointments: readonly Appointment[];
  communications: readonly Communication[];
  followupTasks: readonly FollowupTask[];
  /** StaffId → display name. Used by the Citas tab to render the BA per appointment. */
  baLookup: Record<string, string>;
  /** SKU → Product. Used by recs/samples previews to render real names. */
  productBySku: Record<string, Product>;
  /** Templates del scope del BA — usadas en tab Mensajes. */
  templates: readonly Template[];
  /** Tienda del BA — usada para render de plantillas. */
  storeName: string;
  /** Nombre del BA — usado para signature de mensajes. */
  staffName: string;
  /**
   * Task pre-cargada — cuando viene, el perfil se renderea con la tab
   * Mensajes activa y el modal del composer abierto pre-cargado con la
   * task. Se usa para el deep-link "Responder" desde el inbox.
   */
  initialTask?: FollowupTask | null;
}

export async function ClientProfile({
  client,
  interactions,
  purchases,
  samples,
  recommendations,
  consents,
  appointments,
  communications,
  followupTasks,
  baLookup,
  productBySku,
  templates,
  storeName,
  staffName,
  initialTask,
}: ClientProfileProps) {
  const t = await getTranslations();
  const segment = segmentClient(client);
  const tone: AvatarTone = brandToTone(client.brands[0]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
      <main className="flex flex-col gap-4 min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="inline-flex items-center gap-1.5 text-xs font-medium leading-none text-ink/60"
        >
          <Link href="/ba/clients" className="hover:text-ink">
            {t("profile.breadcrumb")}
          </Link>
          <Icon name="chevron-right" size={14} />
          <span aria-current="page">{client.name}</span>
        </nav>

        {/* Hero card */}
        <Card variant="luxe" className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 bg-gradient-to-b from-white to-paper">
          <Avatar initials={initials(client.name)} size={92} tone={tone} />
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="inline-flex gap-1.5 flex-wrap">
              {client.brands.map((b) => (
                <BrandTag key={b} brand={b} alwaysShow />
              ))}
              <Chip size="sm">
                {t("profile.since")} {sinceYear(client.since)}
              </Chip>
              <Chip variant={SEGMENT_TONE[segment]} size="sm">
                {t(`clients.segment.${SEGMENT_KEY[segment]}`)}
              </Chip>
            </div>
            <h1 className="m-0 font-display text-[44px] leading-[1.02] tracking-[-0.015em]">
              {client.name}
            </h1>
            <p className="m-0 text-[16px] font-medium leading-snug text-ink/60">
              {client.age ? `${client.age} años · ` : ""}
              {client.city} · {client.phone} · {client.email}
            </p>
          </div>
        </Card>

        {/* Action strip — Recomendar lives ahora dentro del wizard de visita
            y la captura de perfil de belleza está en la tab dedicada. */}
        <div className="grid grid-cols-3 gap-2.5">
          <Link href={`/ba/clients/${client.id}/visit`}>
            <Button leading={<Icon name="calendar" />} className="h-14 w-full">
              {t("profile.actions.register_visit")}
            </Button>
          </Link>
          <Link href={`/ba/clients/${client.id}/sale`}>
            <Button leading={<Icon name="bag" />} className="h-14 w-full">
              {t("profile.actions.register_sale")}
            </Button>
          </Link>
          <Link href={`/ba/clients/${client.id}?tab=followup#profile-tabs`}>
            <Button leading={<Icon name="message" />} className="h-14 w-full">
              {t("profile.actions.follow_up")}
            </Button>
          </Link>
        </div>

        {/* KPI strip */}
        <Card className="grid grid-cols-2 gap-0">
          <KpiCell
            label={t("profile.kpi.avg_ticket")}
            value={formatCurrency(client.stats.avgTicket)}
          />
          <KpiCell
            label={t("profile.kpi.last_purchase")}
            value={formatRelative(client.stats.lastPurchase)}
            subtitle={`${client.stats.visits} ${client.stats.visits === 1 ? "visita" : "visitas"} · ${samples.filter((s) => s.converted).length}/${samples.length} ${t("profile.kpi.samples_converted")}`}
            divider
          />
        </Card>

        <ClientProfileTabs
          client={client}
          interactions={interactions}
          purchases={purchases}
          samples={samples}
          recommendations={recommendations}
          appointments={appointments}
          communications={communications}
          followupTasks={followupTasks}
          baLookup={baLookup}
          productBySku={productBySku}
          templates={templates}
          storeName={storeName}
          staffName={staffName}
          clientName={client.name}
          clientId={client.id}
          initialTask={initialTask ?? null}
        />
      </main>

      <aside className="flex flex-col gap-4">
        <LuxeCircleCard client={client} segment={segment} />
        <UpcomingFollowupsCard clientId={client.id} tasks={followupTasks} />
        <SkinProfileCard client={client} />
        <InterestsCard client={client} />
        <AppointmentsCard appointments={appointments} clientId={client.id} />
        <UpcomingEventsCard client={client} />
        <AffinitiesCard client={client} />
        <ConsentSummaryCard consents={consents} />
        <ArcoRightsCard />
      </aside>
    </div>
  );
}

function KpiCell({
  label,
  value,
  subtitle,
  divider,
}: {
  label: string;
  value: string;
  subtitle?: string;
  divider?: boolean;
}) {
  return (
    <div className={divider ? "pl-5 border-l border-line pr-5" : "pr-5"}>
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </span>
      <div className="mt-1 font-display text-[32px] leading-none tabular">{value}</div>
      {subtitle ? (
        <p className="m-0 mt-1.5 text-[15px] font-medium leading-snug text-ink/60">{subtitle}</p>
      ) : null}
    </div>
  );
}

const SEGMENT_TONE = {
  VIP: "accent",
  Recurrent: "ok",
  New: "neutral",
  AtRisk: "danger",
} as const;

const SEGMENT_KEY = {
  VIP: "vip",
  Recurrent: "recurrent",
  New: "new",
  AtRisk: "at_risk",
} as const;

function brandToTone(brand: string | undefined): AvatarTone {
  if (brand === "Lancôme") return "lancome";
  if (brand === "YSL") return "ysl";
  return "default";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function sinceYear(iso: string): string {
  if (!iso) return "—";
  const year = iso.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : iso;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.round(days / 7)} sem`;
  if (days < 365) return `hace ${Math.round(days / 30)} meses`;
  return `hace ${Math.round(days / 365)} años`;
}
