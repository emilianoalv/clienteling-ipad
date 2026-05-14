"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Chip, Icon, Input } from "@/components/primitives";
import { KvRow } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import type { Appointment } from "@/types/appointment";
import { rescheduleAppointment } from "../actions/reschedule-appointment";
import { cancelAppointment } from "../actions/cancel-appointment";
import { transitionAppointment } from "../actions/update-appointment-status";
import { formatDate, formatTime } from "@/lib/format/format-date";

type Mode = "view" | "reschedule" | "cancel";

const STATUS_TONE = {
  scheduled: "warn",
  confirmed: "ok",
  completed: "neutral",
  rescheduled: "warn",
  cancelled: "danger",
  "no-show": "danger",
} as const;

const ACTIONS_ROW = "flex justify-end gap-2 flex-wrap mt-5";

export interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  clientName: string;
  onClose: () => void;
}

export function AppointmentDetailModal({
  appointment,
  clientName,
  onClose,
}: AppointmentDetailModalProps) {
  const t = useTranslations();
  const [mode, setMode] = useState<Mode>("view");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMode("view");
    setNotice(null);
  }, [appointment?.id]);

  if (!appointment) return null;

  const open = Boolean(appointment);
  const isFinal = appointment.status === "completed" || appointment.status === "cancelled";

  function withSuccess(message: string, run: () => Promise<unknown>) {
    startTransition(async () => {
      await run();
      setNotice(message);
      setTimeout(() => {
        onClose();
        setNotice(null);
      }, 1200);
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={clientName}
      description={t(`appointment.kind.${appointment.kind}`)}
      size="md"
    >
      {notice ? (
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.08] text-ok rounded-md text-[16px] font-semibold leading-none">
          <Icon name="check" /> {notice}
        </div>
      ) : mode === "view" ? (
        <ViewMode appointment={appointment} isFinal={isFinal} />
      ) : mode === "reschedule" ? (
        <RescheduleMode
          appointment={appointment}
          isPending={isPending}
          onCancel={() => setMode("view")}
          onSubmit={(date, time) =>
            withSuccess(t("appointment.rescheduled"), () =>
              rescheduleAppointment({ appointmentId: appointment.id, date, time }),
            )
          }
        />
      ) : (
        <CancelMode
          isPending={isPending}
          onBack={() => setMode("view")}
          onSubmit={(reason) =>
            withSuccess(t("appointment.cancelled"), () =>
              cancelAppointment({ appointmentId: appointment.id, ...(reason ? { reason } : {}) }),
            )
          }
        />
      )}

      {!notice && mode === "view" && !isFinal && (
        <div className={ACTIONS_ROW}>
          {appointment.status !== "confirmed" && (
            <Button
              variant="ghost"
              leading={<Icon name="check" />}
              loading={isPending}
              onClick={() =>
                withSuccess(t("appointment.saved"), () =>
                  transitionAppointment(appointment.id, "confirm"),
                )
              }
            >
              {t("appointment.actions.confirm")}
            </Button>
          )}
          <Button
            variant="ghost"
            leading={<Icon name="check" />}
            loading={isPending}
            onClick={() =>
              withSuccess(t("appointment.completed"), () =>
                transitionAppointment(appointment.id, "complete"),
              )
            }
          >
            {t("appointment.actions.complete")}
          </Button>
          <Button
            variant="ghost"
            leading={<Icon name="calendar" />}
            onClick={() => setMode("reschedule")}
          >
            {t("appointment.actions.reschedule")}
          </Button>
          <Button variant="danger" leading={<Icon name="x" />} onClick={() => setMode("cancel")}>
            {t("appointment.actions.cancel")}
          </Button>
        </div>
      )}
    </Modal>
  );
}

function ViewMode({ appointment, isFinal }: { appointment: Appointment; isFinal: boolean }) {
  const t = useTranslations();
  return (
    <div>
      <Chip variant={STATUS_TONE[appointment.status]} size="sm">
        {t(`appointment.status.${appointment.status}`)}
      </Chip>
      <div className="mt-3">
        <KvRow label={t("appointment.field.date")} value={formatDate(appointment.at)} />
        <KvRow label={t("appointment.field.time")} value={formatTime(appointment.at)} />
        <KvRow label={t("appointment.field.duration")} value={`${appointment.durationMin} min`} mono />
        <KvRow label={t("appointment.field.brand")} value={appointment.brand} dashed={false} />
      </div>
      {appointment.notes ? (
        <p className="mt-3 text-[16px] font-medium leading-normal text-ink/60">
          {appointment.notes}
        </p>
      ) : null}
      {isFinal && appointment.cancelReason ? (
        <p className="mt-3 text-[16px] font-medium leading-normal text-err">
          {appointment.cancelReason}
        </p>
      ) : null}
    </div>
  );
}

function RescheduleMode({
  appointment,
  isPending,
  onCancel,
  onSubmit,
}: {
  appointment: Appointment;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (date: string, time: string) => void;
}) {
  const t = useTranslations();
  const at = new Date(appointment.at);
  const [date, setDate] = useState<string>(at.toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(
    `${at.getHours().toString().padStart(2, "0")}:${at.getMinutes().toString().padStart(2, "0")}`,
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("appointment.field.date")}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          label={t("appointment.field.time")}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <div className={ACTIONS_ROW}>
        <Button variant="ghost" onClick={onCancel}>
          {t("app.back")}
        </Button>
        <Button variant="primary" onClick={() => onSubmit(date, time)} loading={isPending}>
          {t("appointment.confirm_reschedule")}
        </Button>
      </div>
    </div>
  );
}

function CancelMode({
  isPending,
  onBack,
  onSubmit,
}: {
  isPending: boolean;
  onBack: () => void;
  onSubmit: (reason: string) => void;
}) {
  const t = useTranslations();
  const [reason, setReason] = useState("");
  return (
    <div>
      <Input
        label={t("appointment.field.reason")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className={ACTIONS_ROW}>
        <Button variant="ghost" onClick={onBack}>
          {t("app.back")}
        </Button>
        <Button variant="danger" onClick={() => onSubmit(reason)} loading={isPending}>
          {t("appointment.confirm_cancel")}
        </Button>
      </div>
    </div>
  );
}
