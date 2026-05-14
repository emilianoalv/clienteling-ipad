import { SupervisorDashboard } from "@/features/dashboards";
import { requireSession } from "@/server/auth/session";

export default async function SupervisorHome() {
  const { staff } = await requireSession();
  return <SupervisorDashboard supervisorName={staff.name} />;
}
