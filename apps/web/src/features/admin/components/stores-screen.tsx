"use client";

import { useState, useTransition } from "react";
import type { Store, StoreChain, StoreId } from "@/types/store";
import { Button, Chip, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import { createStoreAction } from "../actions/create-store";
import { updateStoreAction } from "../actions/update-store";
import { deleteStoreAction } from "../actions/delete-store";
import { STORE_CHAINS } from "../schemas/store.schema";

type FieldErrors = Record<string, string[]>;

interface FormState {
  name: string;
  chain: StoreChain;
  city: string;
  address: string;
  monthlyTarget: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  chain: "Liverpool",
  city: "",
  address: "",
  monthlyTarget: "",
};

export interface StoresScreenProps {
  stores: readonly Store[];
}

/**
 * Pantalla CRUD de tiendas (RF-55 + RNF-14/16). El Admin puede dar de
 * alta, editar y eliminar tiendas sin tocar el seed. Los cambios viven
 * en memoria del server con `persistent` — sobreviven HMR pero no
 * reinicios, igual que el resto del modelo demo.
 *
 * Eliminar está bloqueado si la tienda todavía tiene usuarios
 * asignados — el server action devuelve un error y la UI lo muestra.
 */
export function StoresScreen({ stores }: StoresScreenProps) {
  const [mode, setMode] = useState<"create" | "edit" | "delete" | null>(null);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setMode(null);
    setEditing(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setError(null);
  }

  function openCreate() {
    setForm(INITIAL_FORM);
    setErrors({});
    setError(null);
    setMode("create");
  }

  function openEdit(store: Store) {
    setEditing(store);
    setForm({
      name: store.name,
      chain: store.chain,
      city: store.city,
      address: store.address,
      monthlyTarget:
        store.monthlyTarget !== undefined ? String(store.monthlyTarget) : "",
    });
    setErrors({});
    setError(null);
    setMode("edit");
  }

  function openDelete(store: Store) {
    setEditing(store);
    setError(null);
    setMode("delete");
  }

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  }

  function buildInput() {
    const trimmed = form.monthlyTarget.trim();
    const target = trimmed === "" ? undefined : Number(trimmed);
    return {
      name: form.name,
      chain: form.chain,
      city: form.city,
      address: form.address,
      ...(target !== undefined && !Number.isNaN(target)
        ? { monthlyTarget: target }
        : {}),
    };
  }

  function onSubmitCreate() {
    setErrors({});
    setError(null);
    startTransition(async () => {
      const result = await createStoreAction(buildInput());
      if (result.ok) {
        flash(`Tienda ${form.name} creada.`);
        close();
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  function onSubmitEdit() {
    if (!editing) return;
    setErrors({});
    setError(null);
    startTransition(async () => {
      const result = await updateStoreAction(editing.id, buildInput());
      if (result.ok) {
        flash(`Tienda ${form.name} actualizada.`);
        close();
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  function onConfirmDelete() {
    if (!editing) return;
    setError(null);
    const target = editing;
    startTransition(async () => {
      const result = await deleteStoreAction(target.id);
      if (result.ok) {
        flash(`Tienda ${target.name} eliminada.`);
        close();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <Card variant="luxe" className="flex flex-col gap-4">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Tiendas
            </span>
            <h2 className="m-0 font-display text-[28px] leading-tight">
              {stores.length} tiendas activas
            </h2>
          </div>
          <Button
            variant="outline"
            leading={<Icon name="plus" size={12} />}
            onClick={openCreate}
          >
            Crear tienda
          </Button>
        </header>

        {notice ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[15px] font-semibold leading-snug border border-ok/25 self-start">
            <Icon name="check" /> {notice}
          </div>
        ) : null}

        <ul className="list-none m-0 p-0">
          {stores.map((s) => (
            <li
              key={s.id as unknown as string}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-3 border-b border-dashed border-line last:border-b-0"
            >
              <div className="min-w-0">
                <div className="text-[16px] font-semibold">{s.name}</div>
                <div className="text-[14.5px] font-medium text-ink/60 truncate">
                  {s.city} · {s.address}
                </div>
              </div>
              <Chip size="sm">{s.chain}</Chip>
              <div className="text-[14px] font-semibold tabular text-ink/70 min-w-[110px] text-right">
                {s.monthlyTarget !== undefined
                  ? new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                      maximumFractionDigits: 0,
                    }).format(s.monthlyTarget)
                  : "Sin objetivo"}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Editar ${s.name}`}
                  onClick={() => openEdit(s)}
                >
                  <Icon name="more" size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Eliminar ${s.name}`}
                  onClick={() => openDelete(s)}
                >
                  <Icon name="x" size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={mode === "create" || mode === "edit"}
        onClose={close}
        title={mode === "edit" ? "Editar tienda" : "Crear tienda"}
        description={
          mode === "edit"
            ? "Modifica los datos de la tienda. Los usuarios asignados conservan su vínculo."
            : "Da de alta una tienda nueva. Después podrás asignarle BAs y Gerentes desde el módulo de usuarios."
        }
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={mode === "edit" ? onSubmitEdit : onSubmitCreate}
              loading={isPending}
              disabled={!form.name || !form.city || !form.address}
            >
              {mode === "edit" ? "Guardar cambios" : "Crear tienda"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Liverpool Polanco"
            autoFocus
            {...(errors.name?.[0] ? { error: errors.name[0] } : {})}
          />

          <div>
            <div className="text-[14px] font-semibold mb-1.5">Cadena</div>
            <div className="flex gap-1.5">
              {STORE_CHAINS.map((c) => {
                const active = form.chain === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, chain: c }))}
                    className={`inline-flex items-center h-9 px-3.5 rounded-md border text-[13.5px] font-semibold cursor-pointer transition-colors ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "bg-white text-ink border-line hover:bg-bone"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {errors.chain?.[0] ? (
              <span className="block mt-1 text-[12.5px] text-err">{errors.chain[0]}</span>
            ) : null}
          </div>

          <Input
            label="Ciudad"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="CDMX"
            {...(errors.city?.[0] ? { error: errors.city[0] } : {})}
          />

          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Mariano Escobedo 425"
            {...(errors.address?.[0] ? { error: errors.address[0] } : {})}
          />

          <Input
            label="Objetivo mensual (MXN)"
            type="number"
            value={form.monthlyTarget}
            onChange={(e) =>
              setForm((f) => ({ ...f, monthlyTarget: e.target.value }))
            }
            placeholder="1500000"
            {...(errors.monthlyTarget?.[0]
              ? { error: errors.monthlyTarget[0] }
              : {})}
          />

          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={mode === "delete"}
        onClose={close}
        title="Eliminar tienda"
        description="Esta acción no se puede deshacer."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={onConfirmDelete}
              loading={isPending}
            >
              Eliminar tienda
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[15px] leading-snug">
            Vas a eliminar <strong>{editing?.name}</strong>. Si la tienda tiene
            BAs o Gerentes asignados, primero deberás reasignarlos en el
            módulo de Usuarios.
          </p>
          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

// Avoid unused-import false positive on StoreId — the page passes a
// typed list and this component does not need to re-cast.
export type { StoreId };
