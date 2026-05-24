import { ClientProfile, fetchClientWithHistory } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import type { FollowupTaskId } from "@/types/followup-task";

export default async function ClientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ taskId?: string; tab?: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const sp = await searchParams;
  const [data, task] = await Promise.all([
    fetchClientWithHistory(clientId, staff),
    sp.taskId
      ? followupTaskRepository.findById(sp.taskId as FollowupTaskId)
      : Promise.resolve(null),
  ]);
  // Guard: solo pasamos la task si pertenece a este cliente y al BA actual.
  const initialTask =
    task && task.clientId === clientId && task.baId === staff.id ? task : null;
  return <ClientProfile {...data} initialTask={initialTask} />;
}
