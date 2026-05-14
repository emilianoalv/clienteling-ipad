import type { ReactNode } from "react";
import { Shell, Rail, TopBar } from "@/components/layout";
import { Avatar, Button, Icon } from "@/components/primitives";
import { NAV_BY_ROLE } from "@/config/nav";
import { requireSession } from "@/server/auth/session";
import { signOutAction } from "@/features/auth";

const ROLE_SUBTITLE: Record<string, string> = {
  BA: "Beauty Advisor",
  Manager: "Store Manager",
  Supervisor: "Supervisor de zona",
  HQ: "L'Oréal Luxe México · HQ",
  Admin: "TI · Data & integraciones",
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { staff } = await requireSession();
  const navItems = NAV_BY_ROLE[staff.role];

  return (
    <Shell>
      <TopBar
        title={staff.name}
        subtitle={ROLE_SUBTITLE[staff.role]}
        right={
          <>
            <Button variant="ghost" iconOnly aria-label="Notificaciones">
              <Icon name="bell" />
            </Button>
            <form action={signOutAction}>
              <Button variant="ghost" iconOnly aria-label="Cerrar sesión" type="submit">
                <Icon name="power" />
              </Button>
            </form>
            <Avatar initials={staff.initials} tone={staff.role === "BA" ? "lancome" : "default"} />
          </>
        }
      />
      <Shell.Body>
        <Rail items={navItems} />
        <Shell.Content>{children}</Shell.Content>
      </Shell.Body>
    </Shell>
  );
}
