"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { PeriodPicker, type PeriodOption } from "./period-picker";

export interface FilterBarRoleConfig {
  period: boolean;
  store: boolean;
  brand: boolean;
  baId: boolean;
}

export interface FilterBarScopeOptions {
  stores?: ReadonlyArray<{ id: StoreId; label: string }>;
  bas?: ReadonlyArray<{ id: StaffId; label: string }>;
}

export interface FilterBarProps {
  roleConfig: FilterBarRoleConfig;
  scopeOptions?: FilterBarScopeOptions;
  className?: string;
}

const BRAND_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "Todas las marcas" },
  { value: "Lancôme", label: "Lancôme" },
  { value: "YSL", label: "YSL" },
];

/**
 * Role-aware filter bar driving the URL searchParams. Re-renders the parent
 * Server Component on every change via `router.push`. See
 * `docs/dashboards-design-spec.md` §2.1 for the per-role enablement matrix.
 */
export function FilterBar({ roleConfig, scopeOptions, className }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const period = (searchParams.get("period") as PeriodOption | null) ?? "mtd";

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap justify-end",
        className,
      )}
      role="group"
      aria-label="Filtros del dashboard"
    >
      {roleConfig.period ? (
        <PeriodPicker
          value={period}
          onChange={(v) => updateFilter("period", v === "mtd" ? "" : v)}
        />
      ) : null}

      {roleConfig.store ? (
        <Select
          ariaLabel="Tienda"
          icon="home"
          label="Tienda"
          value={searchParams.get("storeId") ?? ""}
          options={[
            { value: "", label: "Todas las tiendas" },
            ...(scopeOptions?.stores ?? []).map((s) => ({
              value: s.id as unknown as string,
              label: s.label,
            })),
          ]}
          onChange={(v) => updateFilter("storeId", v)}
        />
      ) : null}

      {roleConfig.brand ? (
        <Select
          ariaLabel="Marca"
          icon="sparkle"
          label="Marca"
          value={searchParams.get("brand") ?? ""}
          options={BRAND_OPTIONS}
          onChange={(v) => updateFilter("brand", v)}
        />
      ) : null}

      {roleConfig.baId ? (
        <Select
          ariaLabel="BA"
          icon="user"
          label="BA"
          value={searchParams.get("baId") ?? ""}
          options={[
            { value: "", label: "Todos los BA" },
            ...(scopeOptions?.bas ?? []).map((b) => ({
              value: b.id as unknown as string,
              label: b.label,
            })),
          ]}
          onChange={(v) => updateFilter("baId", v)}
        />
      ) : null}
    </div>
  );
}

interface SelectProps {
  ariaLabel: string;
  icon: "home" | "sparkle" | "user";
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

function Select({ ariaLabel, icon, label, value, options, onChange }: SelectProps) {
  return (
    <label className="relative inline-flex items-center gap-1.5 h-8 px-3 rounded-pill border border-line bg-white text-[16px] cursor-pointer hover:bg-bone">
      <Icon name={icon} size={12} />
      <span className="text-ink/60">{label}</span>
      <span className="sr-only">{ariaLabel}</span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent border-0 outline-none font-semibold pr-4 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={12} className="pointer-events-none -ml-3" />
    </label>
  );
}
