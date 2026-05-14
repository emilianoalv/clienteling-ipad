"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/primitives";
import { signInAction } from "@/features/auth/actions/sign-in";
import { cn } from "@/lib/cn";
import type { Role } from "@/types/staff";

const ROLES: readonly Role[] = ["BA", "Manager", "Supervisor", "HQ", "Admin"];

export function LoginForm() {
  const t = useTranslations("auth");
  const [role, setRole] = useState<Role>("BA");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signInAction({ role, pin });
    setSubmitting(false);
    if (!result.ok) {
      if (result.reason === "locked") setError(t("locked", { minutes: result.minutesLeft }));
      else if (result.reason === "wrong_pin")
        setError(t("wrong_pin", { attempts: result.attemptsLeft }));
      else setError("Error desconocido.");
    }
  }

  return (
    <form className="flex flex-col gap-5 w-full max-w-[360px]" onSubmit={onSubmit}>
      <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
        <legend className="text-xs font-semibold leading-none tracking-[0.04em] text-ink/60 p-0">
          {t("pick_user")}
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {ROLES.map((r) => {
            const active = r === role;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "h-9 rounded-[10px] border text-[16px] font-semibold leading-none cursor-pointer transition-[background-color,color,border-color] duration-100 ease-luxe",
                  active
                    ? "bg-ink text-paper border-ink"
                    : "bg-white text-ink/60 border-line hover:text-ink",
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Input
        label={t("pin")}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        pattern="[0-9]{6}"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
        {...(error ? { error } : {})}
      />

      <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={pin.length < 6}>
        {t("sign_in")}
      </Button>
    </form>
  );
}
