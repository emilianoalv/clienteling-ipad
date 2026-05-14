import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "L'Oréal Luxe · Sign in" };

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="grid grid-cols-2 w-screen h-screen">
      <aside className="bg-ink text-paper px-10 py-[72px] flex flex-col justify-between">
        <div className="text-xs font-semibold leading-none tracking-[0.18em] uppercase">
          L&apos;Oréal Luxe
        </div>
        <h1 className="m-0 font-display text-[56px] leading-tight tracking-[-0.02em]">
          {t("welcome")}
        </h1>
        <p className="text-sm text-paper/70 max-w-[36ch]">
          Atención personalizada, sin tickets. Clienteling para la red Luxe en México.
        </p>
      </aside>
      <main className="flex items-center justify-center p-10 bg-paper">
        <LoginForm />
      </main>
    </div>
  );
}
