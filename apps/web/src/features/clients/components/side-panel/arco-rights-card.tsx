import { getTranslations } from "next-intl/server";
import { Card } from "@/components/patterns";
import { Button, Icon } from "@/components/primitives";

export async function ArcoRightsCard() {
  const t = await getTranslations();

  return (
    <Card className="border-err/25">
      <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-err">
        {t("profile.arco.eyebrow")}
      </span>
      <h3 className="m-0 mt-1 font-display text-lg leading-tight">{t("profile.arco.title")}</h3>
      <p className="m-0 mt-1 text-xs font-medium leading-snug text-ink/60">
        {t("profile.arco.description")}
      </p>
      <Button
        variant="ghost"
        leading={<Icon name="trash" />}
        className="mt-3 text-err border-err/30"
      >
        {t("profile.arco.cta")}
      </Button>
    </Card>
  );
}
