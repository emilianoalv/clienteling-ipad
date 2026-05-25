"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/patterns";
import { Modal } from "@/components/feedback/modal";
import { Button, Icon, Input } from "@/components/primitives";
import { requestArcoDeletion } from "@/features/clients/actions/request-arco-deletion";
import type { ClientId } from "@/types/client";

export interface ArcoRightsCardProps {
  clientId: ClientId;
  clientName: string;
}

export function ArcoRightsCard({ clientId, clientName }: ArcoRightsCardProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (submitting) return;
    setOpen(false);
    setTyped("");
    setError(null);
  }

  async function onConfirm() {
    setError(null);
    if (typed.trim() !== clientName) {
      setError(t("profile.arco.modal.error_mismatch"));
      return;
    }
    setSubmitting(true);
    const result = await requestArcoDeletion({ clientId, confirmName: typed });
    if (result.ok) {
      window.location.href = result.redirectTo;
      return;
    }
    setSubmitting(false);
    setError(result.message);
  }

  const canConfirm = typed.trim() === clientName && !submitting;

  return (
    <>
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
          onClick={() => setOpen(true)}
        >
          {t("profile.arco.cta")}
        </Button>
      </Card>

      <Modal
        open={open}
        onClose={close}
        size="md"
        title={t("profile.arco.modal.title")}
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={submitting}>
              {t("profile.arco.modal.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              disabled={!canConfirm}
              loading={submitting}
              leading={<Icon name="trash" />}
              className="bg-err text-white border-err hover:bg-err/90"
            >
              {submitting
                ? t("profile.arco.modal.submitting")
                : t("profile.arco.modal.confirm")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-err/30 bg-err/[0.06] p-4 text-sm font-medium leading-snug text-ink/80">
            {t("profile.arco.modal.warning", { name: clientName })}
          </div>
          <Input
            label={t("profile.arco.modal.confirm_label", { name: clientName })}
            placeholder={t("profile.arco.modal.confirm_placeholder")}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            {...(error ? { error } : {})}
          />
        </div>
      </Modal>
    </>
  );
}
