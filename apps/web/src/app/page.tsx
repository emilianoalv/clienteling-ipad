import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { homeFor, routes } from "@/config/routes";

/**
 * Root entry. The middleware also handles this redirect, but a server-side
 * fallback keeps `/` deterministic if matchers ever change.
 */
export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect(routes.login);
  redirect(homeFor(session.role));
}
