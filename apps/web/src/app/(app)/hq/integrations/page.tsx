import { IntegrationsScreen, listIntegrations } from "@/features/admin";
import { requireSession } from "@/server/auth/session";

export default async function HqIntegrationsPage() {
  await requireSession();
  const integrations = await listIntegrations();
  return <IntegrationsScreen integrations={integrations} />;
}
