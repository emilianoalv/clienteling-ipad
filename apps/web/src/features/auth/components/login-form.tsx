"use client";

import { useState } from "react";
import { Button, Input } from "@/components/primitives";
import { signInAction } from "@/features/auth/actions/sign-in";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signInAction({ email, password });
      if (result.ok) {
        // window.location.href en vez de router.push: fuerza full page
        // reload, garantiza que la cookie de sesión recién creada se
        // envíe con la siguiente request. Evita un bug intermitente
        // de Next 15 donde router.push() de rutas pesadas (admin,
        // supervisor) no procesaba la cookie a tiempo y quedaba en
        // loop con el middleware.
        window.location.href = result.redirectTo;
        return;
      }
      setSubmitting(false);
      if (result.reason === "invalid_credentials") {
        setError("Correo o contraseña incorrectos.");
      } else if (result.reason === "invalid_input") {
        setError(result.message ?? "Datos inválidos.");
      } else {
        setError("Error desconocido. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setSubmitting(false);
      setError("Error inesperado. Recarga la página e inténtalo de nuevo.");
    }
  }

  return (
    <form className="flex flex-col gap-4 w-full max-w-[380px]" onSubmit={onSubmit}>
      <Input
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nombre@lancome.com.mx"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        {...(error ? { error } : {})}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={submitting}
        disabled={!email || !password}
      >
        Iniciar sesión
      </Button>
    </form>
  );
}
