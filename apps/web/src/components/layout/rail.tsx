"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/primitives";
import type { NavItem } from "@/config/nav";
import { cn } from "@/lib/cn";

export interface RailProps {
  items: readonly NavItem[];
  className?: string;
}

export function Rail({ items, className }: RailProps) {
  const pathname = usePathname();
  const t = useTranslations();

  // Longest-prefix match: among items whose href matches the current path,
  // pick the one with the longest href. Prevents the root rail item (e.g.
  // "/ba") from staying highlighted while the user is on "/ba/clients".
  const activeId = pickActive(items, pathname);

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "h-full bg-white border-r border-line flex flex-col items-center py-4 gap-4",
        className,
      )}
    >
      <Link
        href="/"
        aria-label="L'Oréal Luxe"
        className="inline-flex w-12 h-12 items-center justify-center rounded-md bg-ink text-paper font-display font-semibold text-xl leading-none"
      >
        L
      </Link>

      <ul className="list-none m-0 p-0 w-full flex flex-col items-center gap-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex flex-col items-center justify-center gap-1.5 w-[92px] h-[76px] rounded-md transition-[background-color,color] duration-100 ease-luxe no-underline",
                  active
                    ? "bg-ink text-paper"
                    : "text-ink/60 hover:text-ink hover:bg-ink/[0.04]",
                )}
              >
                <Icon name={item.icon} size={26} />
                <span className="text-[13px] font-semibold tracking-[0.04em]">
                  {t(item.labelKey as Parameters<typeof t>[0])}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Returns the id of the nav item whose href is the longest prefix of `pathname`.
 * Falls back to null when nothing matches.
 */
function pickActive(items: readonly NavItem[], pathname: string): string | null {
  let bestId: string | null = null;
  let bestLen = -1;
  for (const item of items) {
    const matches = pathname === item.href || pathname.startsWith(item.href + "/");
    if (matches && item.href.length > bestLen) {
      bestId = item.id;
      bestLen = item.href.length;
    }
  }
  return bestId;
}
