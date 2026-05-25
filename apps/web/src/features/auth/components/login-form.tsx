"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/primitives";
import { signInAction } from "@/features/auth/actions/sign-in";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signInAction({ email, password });
    if (result.ok) {
      // Navegación client-side — evita el bug de Next 15 donde el
      // NEXT_REDIRECT del Server Action no se procesa para ciertas
      // rutas con muchas queries paralelas (supervisor/admin).
      router.push(result.redirectTo);
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
