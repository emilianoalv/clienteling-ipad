"use client";

import { useState, useTransition } from "react";
import type { User } from "@/types/user";
import type { Store } from "@/types/store";
import { BRAND_IDS, type BrandId } from "@/types/brand";
import { Button, Chip, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import { createUserAction } from "../actions/create-user";
import { updateUserAction } from "../actions/update-user";
import { deleteUserAction } from "../actions/delete-user";
import { resetPasswordAction } from "../actions/reset-password";
import { NEW_USER_ROLES } from "../schemas/new-user.schema";

export interface UsersScreenProps {
  users: readonly User[];
  storeLookup: Readonly<Record<string, string>>;
  stores: readonly Store[];
}

type Mode = "create" | "edit" | "delete" | "reset" | null;
type Role = (typeof NEW_USER_ROLES)[number];
type FieldErrors = Record<string, string[]>;

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  storeId: string;
  brand: BrandId | undefined;
  monthlyTarget: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "BA",
  storeId: "",
  brand: undefined,
  monthlyTarget: "",
};

function fromUser(u: User): FormState {
  return {
    name: u.name,
    email: u.email,
    password: "",
    role: u.role,
    storeId: u.storeId ?? "",
    brand: u.brand,
    monthlyTarget:
      u.monthlyTarget !== undefined ? String(u.monthlyTarget) : "",
  };
}

/**
 * CRUD completo de usuarios para el Admin Central (RF-55). Soporta
 * alta, edición (incluye cambio de rol con limpieza de campos de
 * scope incompatibles), eliminación con guardarail anti-suicidio y
 * reset de contraseña.
 *
 * Todo persiste en memoria del server con `persistent` — sobrevive
 * HMR pero no reinicios. El badge "modo demo" lo deja claro.
 */
export function UsersScreen({ users, storeLookup, stores }: UsersScreenProps) {
  const [mode, setMode] = useState<Mode>(null);
  const [editing, setEditing] = useState<User | null>(null);
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

  function openEdit(u: User) {
    setEditing(u);
    setForm(fromUser(u));
    setErrors({});
    setError(null);
    setMode("edit");
  }

  function openDelete(u: User) {
    setEditing(u);
    setError(null);
    setMode("delete");
  }

  function openReset(u: User) {
    setEditing(u);
    setForm((f) => ({ ...INITIAL_FORM, ...f, password: "" }));
    setErrors({});
    setError(null);
    setMode("reset");
  }

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  }

  function onSubmitCreate() {
    setErrors({});
    setError(null);
    startTransition(async () => {
      const result = await createUserAction({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.storeId ? { storeId: form.storeId } : {}),
        ...(form.brand ? { brand: form.brand } : {}),
      });
      if (result.ok) {
        flash(`Usuario ${form.name} creado.`);
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
    const target = form.monthlyTarget.trim();
    startTransition(async () => {
      const result = await updateUserAction(editing.id, {
        name: form.name,
        email: form.email,
        role: form.role,
        ...(form.storeId ? { storeId: form.storeId } : {}),
        ...(form.brand ? { brand: form.brand } : {}),
        ...(target !== "" && !Number.isNaN(Number(target))
          ? { monthlyTarget: Number(target) }
          : {}),
      });
      if (result.ok) {
        flash(`Usuario ${form.name} actualizado.`);
        close();
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  function onSubmitDelete() {
    if (!editing) return;
    const target = editing;
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(target.id);
      if (result.ok) {
        flash(`Usuario ${target.name} eliminado.`);
        close();
      } else {
        setError(result.message);
      }
    });
  }

  function onSubmitReset() {
    if (!editing) return;
    setError(null);
    setErrors({});
    const target = editing;
    startTransition(async () => {
      const result = await resetPasswordAction(target.id, form.password);
      if (result.ok) {
        flash(`Contraseña de ${target.name} reseteada.`);
        close();
      } else {
        if (result.fieldError) {
          setErrors({ password: [result.fieldError] });
        }
        if (result.message) setError(result.message);
      }
    });
  }

  // BA → storeId + brand; Gerente → storeId solo; Supervisor/Admin → ninguno.
  const showStore = form.role === "BA" || form.role === "Gerente";
  const showBrand = form.role === "BA";
  const showTarget = mode === "edit" && form.role === "BA";

  return (
    <>
      <Card variant="luxe" className="flex flex-col gap-4">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Usuarios & roles
            </span>
            <h2 className="m-0 font-display text-[28px] leading-tight">
              {users.length} cuentas activas
            </h2>
          </div>
          <Button
            variant="outline"
            leading={<Icon name="plus" size={12} />}
            onClick={openCreate}
          >
            Crear usuario
          </Button>
        </header>

        {notice ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[15px] font-semibold leading-snug border border-ok/25 self-start">
            <Icon name="check" /> {notice}
          </div>
        ) : null}

        <ul className="list-none m-0 p-0">
          {users.map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-3 border-b border-dashed border-line last:border-b-0"
            >
              <div className="min-w-0">
                <div className="text-[16px] font-semibold">{u.name}</div>
                <div className="text-[14.5px] font-medium text-ink/60 truncate">
                  {describeScope(u, storeLookup)} · {u.email}
                </div>
              </div>
              <Chip size="sm">{u.role}</Chip>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Editar ${u.name}`}
                  onClick={() => openEdit(u)}
                >
                  <Icon name="more" size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Resetear contraseña de ${u.name}`}
                  onClick={() => openReset(u)}
                  title="Resetear contraseña"
                >
                  <Icon name="shield" size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Eliminar ${u.name}`}
                  onClick={() => openDelete(u)}
                >
                  <Icon name="x" size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Crear / editar — comparten layout, divergen en el campo password */}
      <Modal
        open={mode === "create" || mode === "edit"}
        onClose={close}
        title={mode === "edit" ? "Editar usuario" : "Crear usuario"}
        description={
          mode === "edit"
            ? "Modifica los datos del usuario. Para cambiar la contraseña usa el botón de reset."
            : "Da de alta una cuenta nueva. Podrá iniciar sesión con el correo y contraseña que definas."
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
              disabled={
                !form.name ||
                !form.email ||
                (mode === "create" && !form.password)
              }
            >
              {mode === "edit" ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          {mode === "create" ? (
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold px-3 py-1.5 rounded-md bg-warn/[0.12] text-warn border border-warn/25 self-start">
              <Icon name="warning" size={12} />
              Modo demo · los usuarios creados se pierden al reiniciar el server
            </div>
          ) : null}

          <Input
            label="Nombre completo"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nombre Apellido"
            autoFocus
            {...(errors.name?.[0] ? { error: errors.name[0] } : {})}
          />
          <Input
            label="Correo"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="nombre@lancome.com.mx"
            {...(errors.email?.[0] ? { error: errors.email[0] } : {})}
          />
          {mode === "create" ? (
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="Mínimo 8 caracteres"
              {...(errors.password?.[0] ? { error: errors.password[0] } : {})}
            />
          ) : null}

          <div>
            <div className="text-[14px] font-semibold mb-1.5">Rol</div>
            <div className="flex flex-wrap gap-1.5">
              {NEW_USER_ROLES.map((r) => {
                const active = form.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        role: r,
                        storeId: r === "BA" || r === "Gerente" ? f.storeId : "",
                        brand: r === "BA" ? f.brand : undefined,
                        monthlyTarget: r === "BA" ? f.monthlyTarget : "",
                      }))
                    }
                    className={`inline-flex items-center h-8 px-3 rounded-full border text-[13px] font-semibold cursor-pointer transition-colors ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "bg-white text-ink border-line hover:bg-bone"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {showStore ? (
            <div>
              <div className="text-[14px] font-semibold mb-1.5">Tienda</div>
              <select
                value={form.storeId}
                onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
                className="h-10 px-3 w-full rounded-[10px] border border-line bg-white text-[15px] focus-visible:border-ink outline-none"
              >
                <option value="">Selecciona una tienda…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.storeId?.[0] ? (
                <span className="block mt-1 text-[12.5px] text-err">{errors.storeId[0]}</span>
              ) : null}
            </div>
          ) : null}

          {showBrand ? (
            <div>
              <div className="text-[14px] font-semibold mb-1.5">Marca</div>
              <div className="flex gap-1.5">
                {BRAND_IDS.map((b) => {
                  const active = form.brand === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, brand: b }))}
                      className={`inline-flex items-center h-9 px-3.5 rounded-md border text-[13.5px] font-semibold cursor-pointer transition-colors ${
                        active
                          ? "bg-ink text-paper border-ink"
                          : "bg-white text-ink border-line hover:bg-bone"
                      }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
              {errors.brand?.[0] ? (
                <span className="block mt-1 text-[12.5px] text-err">{errors.brand[0]}</span>
              ) : null}
            </div>
          ) : null}

          {showTarget ? (
            <Input
              label="Objetivo mensual (MXN)"
              type="number"
              value={form.monthlyTarget}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthlyTarget: e.target.value }))
              }
              placeholder="450000"
              {...(errors.monthlyTarget?.[0]
                ? { error: errors.monthlyTarget[0] }
                : {})}
            />
          ) : null}

          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>

      {/* Reset de contraseña */}
      <Modal
        open={mode === "reset"}
        onClose={close}
        title="Resetear contraseña"
        description="El usuario podrá entrar con la nueva contraseña en su siguiente inicio de sesión."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={onSubmitReset}
              loading={isPending}
              disabled={!form.password}
            >
              Resetear
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[15px] leading-snug">
            Vas a resetear la contraseña de <strong>{editing?.name}</strong>.
          </p>
          <Input
            label="Nueva contraseña"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="Mínimo 8 caracteres"
            autoFocus
            {...(errors.password?.[0] ? { error: errors.password[0] } : {})}
          />
          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>

      {/* Eliminar */}
      <Modal
        open={mode === "delete"}
        onClose={close}
        title="Eliminar usuario"
        description="Esta acción no se puede deshacer."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={onSubmitDelete}
              loading={isPending}
            >
              Eliminar usuario
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[15px] leading-snug">
            Vas a eliminar a <strong>{editing?.name}</strong>. Sus sesiones
            activas seguirán válidas hasta que expire la cookie.
          </p>
          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

function describeScope(u: User, storeLookup: Readonly<Record<string, string>>): string {
  if (u.team) return `${u.role} · ${u.team}`;
  if (u.zone) return `${u.role} · ${u.zone}`;
  if (u.storeId) return `${u.role} · ${storeLookup[u.storeId] ?? u.storeId}`;
  if (u.storeIds && u.storeIds.length) return `${u.role} · ${u.storeIds.length} tiendas`;
  return u.role;
}
