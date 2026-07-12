"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { QrCode } from "@/components/QrCode";
import { api } from "@/lib/api";
import { getStaffSession } from "@/lib/session";
import { queuePublicUrl } from "@/lib/tenant";
import { OwnerBusinessResponse } from "@/lib/types";

export default function OwnerPage() {
  const [businesses, setBusinesses] = useState<OwnerBusinessResponse[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);

  const loadBusinesses = useCallback(async (nextToken = token) => {
    if (!nextToken) return;
    setBusinesses(await api.listOwnerBusinesses(nextToken));
  }, [token]);

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");

    try {
      await api.createBusiness(token, {
        name: String(form.get("name")),
        slug: String(form.get("slug") || ""),
        userEmail: String(form.get("userEmail")),
        userPassword: String(form.get("userPassword")),
        defaultQueueName: String(form.get("defaultQueueName") || "Principal"),
      });
      formElement.reset();
      await loadBusinesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    }
  }

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    if (session.user.role !== "owner") {
      window.location.href = "/dashboard";
      return;
    }
    setIsAllowed(true);
    setToken(session.accessToken);
    void loadBusinesses(session.accessToken);
  }, [loadBusinesses]);

  if (!isAllowed) {
    return null;
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Owner</p>
          <h1>Negocios</h1>
        </div>
        <button className="icon-button" onClick={() => void loadBusinesses()}>
          <RefreshCw size={18} />
          <span className="sr-only">Actualizar</span>
        </button>
      </header>

      <section className="panel">
        <h2>Crear negocio</h2>
        <form className="form-grid" onSubmit={createBusiness}>
          <input name="name" placeholder="Nombre del negocio" required />
          <input name="slug" placeholder="subdominio, ej urbanfit" />
          <input name="userEmail" placeholder="Email del cliente" type="email" required />
          <input
            name="userPassword"
            placeholder="Password inicial"
            type="password"
            required
          />
          <input name="defaultQueueName" placeholder="Playlist inicial" />
          <button className="button primary" type="submit">
            <Plus size={18} />
            Crear
          </button>
        </form>
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="business-grid">
        {businesses.filter((item) => item.business).map((item) => (
          <article className="business-card" key={item.business.id}>
            <div>
              <p className="eyebrow">{item.business.slug}.marl.com</p>
              <h2>{item.business.name}</h2>
            </div>

            <div className="queue-links">
              {item.queues.map((queue) => {
                const url = queuePublicUrl(queue.slug, item.business.slug);
                return (
                  <div className="queue-card" key={queue.id}>
                    <QrCode value={url} />
                    <div>
                      <strong>{queue.name}</strong>
                      <p className="muted">{queue.slug}</p>
                      <Link href={`/player/${queue.id}`}>Abrir player</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
