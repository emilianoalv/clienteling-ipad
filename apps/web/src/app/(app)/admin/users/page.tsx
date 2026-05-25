import { SectionHeader } from "@/components/patterns";
import { UsersScreen, listUsers } from "@/features/admin";
import { storeRepository } from "@/server/repositories/store.repository";
import { requireSession } from "@/server/auth/session";
import { getT } from "@/lib/i18n/get-t";

export default async function AdminUsersPage() {
  await requireSession();
  const t = await getT();
  const [users, stores] = await Promise.all([listUsers(), storeRepository.list()]);
  const storeLookup = Object.fromEntries(stores.map((s) => [s.id, s.name]));
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("admin.users.title")} eyebrow={t("rail.users")} />
      <UsersScreen users={users} storeLookup={storeLookup} stores={stores} />
    </section>
  );
}
