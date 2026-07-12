"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { AuthSession } from "@/lib/types";

interface LoginPanelProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  buttonLabel?: string;
  onLogin: (session: AuthSession) => void;
}

export function LoginPanel({
  title,
  subtitle,
  eyebrow = "Acceso privado",
  buttonLabel = "Entrar",
  onLogin,
}: LoginPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await api.login(email, password);
      saveSession(session);
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="panel auth-panel">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@negocio.com"
            type="email"
            value={email}
            required
          />
        </label>

        <label>
          Password
          <input
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            type="password"
            value={password}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button primary" disabled={isLoading} type="submit">
          <LogIn size={18} />
          {isLoading ? "Ingresando" : buttonLabel}
        </button>
      </form>
    </section>
  );
}
