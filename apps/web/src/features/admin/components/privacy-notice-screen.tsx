"use client";

import { useState, useTransition } from "react";
import type { PrivacyNotice } from "@/types/privacy-notice";
import { Button, Chip, Icon, Input } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import { publishPrivacyNoticeAction } from "../actions/publish-privacy-notice";

export interface PrivacyNoticeScreenProps {
  notices: readonly PrivacyNotice[];
}

/**
 * Versioning del aviso de privacidad (LFPDPPP / RNF-07 / CA-02). El
 * Admin publica una nueva versión cuando cambia el texto legal o las
 * finalidades — los consents firmados quedan ligados a su versión
 * vigente para mantener el rastro auditable.
 */
export function PrivacyNoticeScreen({ notices }: PrivacyNoticeScreenProps) {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState("");
  const [summary, setSummary] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = notices[0] ?? null;
  const history = notices.slice(1);

  function close() {
    setOpen(false);
    setVersion("");
    setSummary("");
    setErrors({});
    setError(null);
  }

  function onSubmit() {
    setErrors({});
    setError(null);
    startTransition(async () => {
      const result = await publishPrivacyNoticeAction({
        version: version.trim(),
        ...(summary.trim() ? { changeSummary: summary.trim() } : {}),
      });
      if (result.ok) {
        setNotice(`Versión ${result.version} publicada.`);
        close();
        setTimeout(() => setNotice(null), 3500);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <Card variant="luxe" className="flex flex-col gap-4">
          <header className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Aviso de privacidad
              </span>
              <h2 className="m-0 font-display text-[28px] leading-tight">
                Versión vigente
              </h2>
            </div>
            <Button
              variant="outline"
              leading={<Icon name="plus" size={12} />}
              onClick={() => setOpen(true)}
            >
              Publicar nueva versión
            </Button>
          </header>

          {notice ? (
            <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[15px] font-semibold leading-snug border border-ok/25 self-start">
              <Icon name="check" /> {notice}
            </div>
          ) : null}

          {active ? (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2.5">
                <Chip variant="ok" size="md">
                  {active.version}
                </Chip>
                <span className="text-[14.5px] text-ink/60">
                  publicada {formatDate(active.publishedAt)} por{" "}
                  {active.publishedBy}
                </span>
              </div>
              {active.changeSummary ? (
                <p className="m-0 text-[15px] leading-snug text-ink/75">
                  {active.changeSummary}
                </p>
              ) : null}
              <KvRow
                label="Aplica a consents nuevos"
                value="Los clientes que firmen desde ahora aceptan esta versión."
                dashed={false}
              />
            </div>
          ) : (
            <p className="m-0 text-[15px] text-ink/60">
              No hay aviso de privacidad publicado.
            </p>
          )}
        </Card>

        {history.length > 0 ? (
          <Card className="flex flex-col gap-3">
            <header>
              <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Histórico
              </span>
              <h3 className="m-0 font-display text-[22px] leading-tight">
                Versiones previas
              </h3>
            </header>
            <ul className="list-none m-0 p-0">
              {history.map((n) => (
                <li
                  key={n.id as unknown as string}
                  className="grid grid-cols-[100px_1fr_auto] gap-3 py-3 border-b border-dashed border-line last:border-b-0 items-start"
                >
                  <Chip size="sm">{n.version}</Chip>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-[14.5px] text-ink/65 leading-snug">
                      {n.changeSummary ?? "Sin descripción de cambios."}
                    </span>
                    <span className="text-[13px] text-ink/50">
                      por {n.publishedBy}
                    </span>
                  </div>
                  <span className="text-[13.5px] tabular text-ink/55 whitespace-nowrap">
                    {formatDate(n.publishedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={close}
        title="Publicar aviso de privacidad"
        description="Una vez publicado, los consents nuevos quedan ligados a esta versión. Las versiones previas se conservan en el histórico para auditoría."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={onSubmit}
              loading={isPending}
              disabled={!version}
            >
              Publicar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Input
            label="Versión"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="v2026.04"
            autoFocus
            hint="Formato vYYYY.MM (o vYYYY.MM.N para parches del mismo mes)."
            {...(errors.version?.[0] ? { error: errors.version[0] } : {})}
          />
          <div>
            <div className="text-[14px] font-semibold mb-1.5">
              Resumen de cambios <span className="text-ink/50 font-normal">(opcional)</span>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ej. Añade WhatsApp como canal de marketing opt-in y aclara la transferencia a Meta."
              rows={4}
              className="w-full px-3 py-2.5 rounded-[10px] border border-line bg-white text-[15px] focus-visible:border-ink outline-none resize-y"
            />
            {errors.changeSummary?.[0] ? (
              <span className="block mt-1 text-[12.5px] text-err">
                {errors.changeSummary[0]}
              </span>
            ) : null}
          </div>
          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
