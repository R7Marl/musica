"use client";

import { FormEvent, useState } from "react";
import { LogIn, UserPlus, X } from "lucide-react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { AuthSession } from "@/lib/types";

interface PublicAccountAccessProps {
  onLogin: (session: AuthSession) => void;
}

type Mode = "closed" | "register" | "login";

export function PublicAccountAccess({ onLogin }: PublicAccountAccessProps) {
  const [mode, setMode] = useState<Mode>("closed");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setIsLoading(true);

    try {
      const email = String(form.get("email"));
      const password = String(form.get("password"));
      const session =
        mode === "register"
          ? await api.registerPublicUser({
              name: String(form.get("name")),
              email,
              password,
            })
          : await api.loginPublicUser(email, password);

      saveSession(session);
      onLogin(session);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo completar el acceso.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (mode === "closed") {
    return (
      <button
        className="button public-account-trigger"
        onClick={() => setMode("register")}
        type="button"
      >
        <UserPlus size={17} />
        ¿No tienes cuenta de Google?
      </button>
    );
  }

  return (
    <section className="public-account-panel">
      <div className="public-account-header">
        <div>
          <p className="eyebrow">
            {mode === "register" ? "Crear cuenta" : "Ingresar"}
          </p>
          <h3>
            {mode === "register" ? "Registrate en QFit" : "Volver a QFit"}
          </h3>
        </div>
        <button
          className="icon-button"
          onClick={() => setMode("closed")}
          title="Cerrar"
          type="button"
        >
          <X size={17} />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <label>
            Nombre
            <input
              autoComplete="name"
              name="name"
              placeholder="Tu nombre"
              required
            />
          </label>
        ) : null}

        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            placeholder="nombre@email.com"
            type="email"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={8}
            name="password"
            placeholder="Minimo 8 caracteres"
            type="password"
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button primary" disabled={isLoading} type="submit">
          {mode === "register" ? <UserPlus size={17} /> : <LogIn size={17} />}
          {isLoading
            ? "Procesando"
            : mode === "register"
              ? "Crear cuenta"
              : "Ingresar"}
        </button>
      </form>

      <button
        className="text-button"
        onClick={() => {
          setError("");
          setMode(mode === "register" ? "login" : "register");
        }}
        type="button"
      >
        {mode === "register"
          ? "Ya tengo una cuenta con email"
          : "Quiero crear una cuenta"}
      </button>
    </section>
  );
}
