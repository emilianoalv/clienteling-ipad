import type { AuditEvent } from "@/types/audit-event";
import { Card } from "@/components/patterns";

export interface AuditLogProps {
  events: readonly AuditEvent[];
  /** Show as a compact list (inside admin home) vs full screen (audit page). */
  compact?: boolean;
}

export function AuditLog({ events, compact = false }: AuditLogProps) {
  return (
    <Card variant={compact ? "default" : "luxe"} className="flex flex-col gap-3">
      <header>
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Auditoría
        </span>
        <h2 className={`m-0 font-display leading-tight ${compact ? "text-[22px]" : "text-[28px]"}`}>
          Últimos eventos críticos
        </h2>
      </header>
      <ul className="list-none m-0 p-0">
        {events.map((e) => (
          <li
            key={e.id}
            className="grid grid-cols-[1.1fr_1fr_1.1fr_0.7fr] gap-3 py-2.5 border-b border-dashed border-line last:border-b-0 items-center"
          >
            <span className="text-[16px] font-medium">{e.title}</span>
            <span className="text-[16px] text-ink/60">{e.subject}</span>
            <span className="text-[16px] text-ink/60">{e.actor}</span>
            <span className="text-[15px] tabular text-ink/60">{formatDateTime(e.at)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
