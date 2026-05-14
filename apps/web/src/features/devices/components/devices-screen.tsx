import type { Device, DeviceStatus } from "@/types/device";
import { Chip } from "@/components/primitives";
import { Card, KpiCard } from "@/components/patterns";
import { aggregateDeviceStats } from "../services/aggregate-device-stats";

const STATUS_VARIANT: Record<DeviceStatus, "ok" | "warn" | "danger"> = {
  active: "ok",
  maintenance: "warn",
  inactive: "danger",
};

const STATUS_LABEL: Record<DeviceStatus, string> = {
  active: "active",
  maintenance: "maintenance",
  inactive: "inactive",
};

export interface DevicesScreenProps {
  devices: readonly Device[];
  storeLookup: Readonly<Record<string, string>>;
  baLookup: Readonly<Record<string, string>>;
}

export function DevicesScreen({ devices, storeLookup, baLookup }: DevicesScreenProps) {
  const stats = aggregateDeviceStats(devices);

  return (
    <div className="flex flex-col gap-4">
      <Card variant="flat" className="grid grid-cols-4 gap-5">
        <KpiCard label="iPads totales" value={String(stats.total)} size="lg" />
        <KpiCard label="Activos" value={String(stats.active)} hint="última sync < 24 h" size="lg" />
        <KpiCard label="Mantenimiento" value={String(stats.maintenance)} size="lg" />
        <KpiCard label="Inactivos" value={String(stats.inactive)} size="lg" />
      </Card>

      <Card variant="flat" className="p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-3.5 px-5 py-3 bg-bone border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          <span>Serial</span>
          <span>Tienda</span>
          <span>BA asignada</span>
          <span>Estado</span>
          <span>Última sync</span>
          <span>iPadOS</span>
          <span>App</span>
        </div>
        <ul className="list-none m-0 p-0">
          {devices.map((d) => (
            <li
              key={d.id}
              className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-3.5 px-5 py-3.5 border-b border-line last:border-b-0 items-center"
            >
              <span className="font-mono text-[16px] font-semibold">{d.serial}</span>
              <span className="text-[16px]">{storeLookup[d.storeId] ?? d.storeId}</span>
              <span className="text-[16px]">
                {d.assignedBA ? (
                  (baLookup[d.assignedBA] ?? d.assignedBA)
                ) : (
                  <span className="text-ink/40">—</span>
                )}
              </span>
              <span>
                <Chip variant={STATUS_VARIANT[d.status]} size="sm">
                  {STATUS_LABEL[d.status]}
                </Chip>
              </span>
              <span className="text-[16px] tabular">{formatDateTime(d.lastSync)}</span>
              <span className="text-[16px] tabular">{d.os}</span>
              <span className="text-[16px] tabular">{d.app}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
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
