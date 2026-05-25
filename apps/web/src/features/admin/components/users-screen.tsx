"use client";

import { useState, useTransition } from "react";
import type { User } from "@/types/user";
import type { Store } from "@/types/store";
import { BRAND_IDS, type BrandId } from "@/types/brand";
import { Button, Chip, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import { createUserAction } from "../actions/create-user";
import { NEW_USER_ROLES } from "../schemas/new-user.schema";

export interface UsersScreenProps {
  users: readonly User[];
  storeLookup: Readonly<Record<string, string>>;
  stores: readonly Store[];
}

type Role = (typeof NEW_USER_ROLES)[number];
type FieldErrors = Record<string, string[]>;

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  role: "BA" as Role,
  storeId: "" as string,
  brand: undefined as BrandId | undefined,
};

/**
 * Pantalla de gestión de usuarios del Admin Central. El listado vive
 * server-side; la creación es client-side con un modal + server action.
 *
 * Los usuarios creados aquí persisten en memoria del server (sobreviven
 * HMR pero no reinicios). El badge "modo demo" en el modal lo aclara
 * antes de que la BA / profesor cree un usuario y lo pierda al deploy.
 */
export function UsersScreen({ users, storeLookup, stores }: UsersScreenProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setForm(INITIAL_FORM);
    setErrors({});
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function onSubmit() {
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
        setNotice(`Usuario ${form.name} creado.`);
        close();
        // El revalidatePath del action refrescará el listado en el
        // próximo render. setTimeout auto-oculta el notice.
        setTimeout(() => setNotice(null), 3500);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  // BA → storeId + brand; Gerente → storeId solo; Supervisor/Admin → ninguno.
  const showStore = form.role === "BA" || form.role === "Gerente";
  const showBrand = form.role === "BA";

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
            onClick={() => setOpen(true)}
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
              className="grid grid-cols-[1fr_auto] gap-3 items-center py-2.5 border-b border-dashed border-line last:border-b-0"
            >
              <div>
                <div className="text-[16px] font-semibold">{u.name}</div>
                <div className="text-[15px] font-medium text-ink/60">
                  {describeScope(u, storeLookup)} · {u.email}
                </div>
              </div>
              <Chip size="sm">{u.role}</Chip>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={open}
        onClose={close}
        title="Crear usuario"
        description="Da de alta una cuenta nueva. Podrá iniciar sesión con el correo y contraseña que definas."
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
              disabled={!form.name || !form.email || !form.password}
            >
              Crear usuario
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold px-3 py-1.5 rounded-md bg-warn/[0.12] text-warn border border-warn/25 self-start">
            <Icon name="warning" size={12} />
            Modo demo · los usuarios creados se pierden al reiniciar el server
          </div>

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
          <Input
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Mínimo 8 caracteres"
            {...(errors.password?.[0] ? { error: errors.password[0] } : {})}
          />

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
                        // Al cambiar rol, limpiamos campos que ya no aplican
                        // para que el Zod superRefine no rechace.
                        storeId: r === "BA" || r === "Gerente" ? f.storeId : "",
                        brand: r === "BA" ? f.brand : undefined,
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
