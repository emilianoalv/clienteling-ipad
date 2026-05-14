import type { User } from "@/types/user";
import { Button, Chip, Icon } from "@/components/primitives";
import { Card } from "@/components/patterns";

export interface UsersScreenProps {
  users: readonly User[];
  storeLookup: Readonly<Record<string, string>>;
}

export function UsersScreen({ users, storeLookup }: UsersScreenProps) {
  return (
    <Card variant="luxe" className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Usuarios & roles
          </span>
          <h2 className="m-0 font-display text-[28px] leading-tight">
            {users.length} cuentas activas
          </h2>
        </div>
        <Button variant="primary" leading={<Icon name="plus" size={12} />}>
          Crear usuario
        </Button>
      </header>

      <ul className="list-none m-0 p-0">
        {users.map((u) => (
          <li
            key={u.id}
            className="grid grid-cols-[1fr_auto] gap-3 items-center py-2.5 border-b border-dashed border-line last:border-b-0"
          >
            <div>
              <div className="text-[16px] font-semibold">{u.name}</div>
              <div className="text-[15px] font-medium text-ink/60">{describeScope(u, storeLookup)}</div>
            </div>
            <Chip size="sm">{u.role}</Chip>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function describeScope(u: User, storeLookup: Readonly<Record<string, string>>): string {
  if (u.team) return `${u.role} · ${u.team}`;
  if (u.zone) return `${u.role} · ${u.zone}`;
  if (u.storeId) return `${u.role} · ${storeLookup[u.storeId] ?? u.storeId}`;
  if (u.storeIds && u.storeIds.length) return `${u.role} · ${u.storeIds.length} tiendas`;
  return u.role;
}
