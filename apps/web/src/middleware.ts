import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "@/config/i18n";
import { routes, homeFor } from "@/config/routes";
import { canAccessRolePrefix } from "@/config/rbac";
import type { Role } from "@/types/staff";

// localePrefix: "never" porque la app no tiene rutas localizadas por
// path (todas las páginas viven en `/` plano y next-intl traduce
// in-place vía getTranslations). Antes era "as-needed" pero causaba
// que navegadores con Accept-Language: en-US fueran redirigidos a
// `/en-US/...`, que no existen como rutas → 404 + redirect loop.
const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "never",
});

const PUBLIC_PATHS = ["/login", "/api/auth"];

/**
 * Quita el prefijo de locale (ej. `/en-US/login` → `/login`) antes de
 * comparar contra PUBLIC_PATHS. Sin esto, navegadores con
 * `Accept-Language: en-US` golpean `/en-US/login`, que no matchea
 * `/login` y entran en redirect loop con next-intl.
 */
function stripLocalePrefix(pathname: string): string {
  for (const loc of locales) {
    if (pathname === `/${loc}`) return "/";
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. i18n routing (cookie + Accept-Language). Never interferes with /api.
  if (!pathname.startsWith("/api")) {
    const intlResponse = intlMiddleware(req);
    if (intlResponse.status >= 300 && intlResponse.status < 400) return intlResponse;
  }

  // 2. Public paths bypass auth — locale-aware match (/login y /en-US/login).
  const strippedPath = stripLocalePrefix(pathname);
  if (PUBLIC_PATHS.some((p) => strippedPath.startsWith(p))) return NextResponse.next();

  // 3. Auth cookie check (lightweight; full validation in server components).
  const sessionRaw = req.cookies.get("session")?.value;
  const session = parseSession(sessionRaw);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = routes.login;
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // 4. Role gate by URL prefix (/ba, /gerente, /supervisor, /admin).
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && ["ba", "gerente", "supervisor", "admin"].includes(segment)) {
    if (!canAccessRolePrefix(session.role, segment)) {
      return NextResponse.redirect(new URL(homeFor(session.role), req.url));
    }
  } else if (pathname === "/") {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }

  return NextResponse.next();
}

function parseSession(raw: string | undefined): { role: Role } | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { role?: Role; expiresAt?: string };
    if (!data.role || !data.expiresAt) return null;
    if (new Date(data.expiresAt) < new Date()) return null;
    return { role: data.role };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
