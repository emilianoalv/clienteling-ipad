import type { Channel, Communication } from "@/types/communication";

export interface CommStats {
  sent: number;
  readRate: number;
  responded: number;
  optOuts: number;
  /** Share of total per channel (sums to ≤ 1). */
  channelMix: Record<Channel, number>;
}

const CHANNELS: readonly Channel[] = ["WhatsApp", "Email", "SMS"];

/**
 * Aggregates comm log into the right-rail KPIs and channel mix bars.
 *
 * Pure — does not touch the repository.
 */
export function aggregateCommStats(communications: readonly Communication[]): CommStats {
  const outbound = communications.filter((c) => c.direction === "outbound");
  const sent = outbound.length;
  const read = outbound.filter((c) => c.status === "read" || c.status === "responded").length;
  const responded = outbound.filter((c) => c.status === "responded").length;
  const optOuts = communications.filter((c) => c.status === "failed").length;

  const channelMix = Object.fromEntries(
    CHANNELS.map((ch) => [
      ch,
      sent > 0 ? outbound.filter((c) => c.channel === ch).length / sent : 0,
    ]),
  ) as Record<Channel, number>;

  return {
    sent,
    readRate: sent > 0 ? read / sent : 0,
    responded,
    optOuts,
    channelMix,
  };
}
