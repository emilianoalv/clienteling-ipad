import type { Integration, IntegrationStatus } from "@/types/integration";
import { Button, Chip, Icon } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";

const STATUS_VARIANT: Record<IntegrationStatus, "ok" | "warn" | "neutral"> = {
  live: "ok",
  sandbox: "warn",
  stub: "neutral",
};

export interface IntegrationsScreenProps {
  integrations: readonly Integration[];
}

export function IntegrationsScreen({ integrations }: IntegrationsScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe">
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Integraciones
        </span>
        <h2 className="m-0 font-display text-[30px] leading-tight">Estructura de sistema</h2>
        <p className="m-0 mt-1 text-[16px] max-w-[620px]">
          Todas las integraciones están preparadas como stub o sandbox. HQ puede activar el modo live sin cambios de código en el cliente.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {integrations.map((i) => (
          <Card key={i.key}>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-bone">
                <Icon name="plug" size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-semibold leading-tight truncate">{i.label}</div>
                <div className="text-[15px] font-medium text-ink/60 truncate">{i.mode}</div>
              </div>
              <Chip variant={STATUS_VARIANT[i.status]} size="sm">
                {i.status}
              </Chip>
            </div>
            <hr className="my-3 border-0 border-t border-dashed border-line" />
            <KvRow label="Último evento" value={i.lastEvent} />
            <KvRow label="Documentación" value="Ready for handoff" dashed={false} />
            <div className="flex gap-2 mt-3">
              <Button variant="default" size="sm">
                Ver eventos
              </Button>
              <Button variant="default" size="sm">
                Configurar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
