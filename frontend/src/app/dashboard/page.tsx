"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  MonitorPlay,
  Plus,
  QrCode as QrCodeIcon,
  RadioTower,
  RefreshCw,
} from "lucide-react";
import { QrCode } from "@/components/QrCode";
import { api } from "@/lib/api";
import { getStaffSession } from "@/lib/session";
import { queuePublicUrl } from "@/lib/tenant";
import { MusicQueue } from "@/lib/types";

export default function DashboardPage() {
  const [queues, setQueues] = useState<MusicQueue[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [copiedQueueId, setCopiedQueueId] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);

  const activeQueues = useMemo(
    () => queues.filter((queue) => queue.isActive).length,
    [queues],
  );

  const loadQueues = useCallback(
    async (nextToken = token) => {
      if (!nextToken) return;
      setQueues(await api.listClientQueues(nextToken));
    },
    [token],
  );

  async function createQueue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");

    try {
      await api.createClientQueue(token, {
        name: String(form.get("name")),
        slug: String(form.get("slug") || ""),
      });
      formElement.reset();
      await loadQueues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    }
  }

  async function copyPublicUrl(queue: MusicQueue) {
    const url = queuePublicUrl(queue.slug);
    await navigator.clipboard.writeText(url);
    setCopiedQueueId(queue.id);
    window.setTimeout(() => setCopiedQueueId(null), 1800);
  }

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    if (session.user.role !== "client") {
      window.location.href = session.user.role === "owner" ? "/owner" : "/";
      return;
    }
    setIsAllowed(true);
    setToken(session.accessToken);
    void loadQueues(session.accessToken);
  }, [loadQueues]);

  if (!isAllowed) {
    return null;
  }

  return (
    <main className="workspace dashboard-workspace">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Panel del negocio</p>
          <h1>Mis playlists</h1>
          <p className="muted">
            Administra los QR, abre el player de la PC principal y crea playlists para
            distintas salas o actividades.
          </p>
        </div>
        <button className="icon-button" onClick={() => void loadQueues()}>
          <RefreshCw size={18} />
          <span className="sr-only">Actualizar</span>
        </button>
      </header>

      <section className="dashboard-stats" aria-label="Resumen de playlists">
        <article>
          <RadioTower size={18} />
          <span>
            <strong>{queues.length}</strong>
            playlists creadas
          </span>
        </article>
        <article>
          <MonitorPlay size={18} />
          <span>
            <strong>{activeQueues}</strong>
            activas
          </span>
        </article>
        <article>
          <QrCodeIcon size={18} />
          <span>
            <strong>{queues.length}</strong>
            QR listos
          </span>
        </article>
      </section>

      <section className="panel dashboard-create-panel">
        <div>
          <p className="eyebrow">Nueva playlist</p>
          <h2>Crear punto de musica</h2>
        </div>
        <form className="form-grid slim" onSubmit={createQueue}>
          <input name="name" placeholder="Nombre, ej Spinning" required />
          <input name="slug" placeholder="slug opcional" />
          <button className="button primary" type="submit">
            <Plus size={18} />
            Crear playlist
          </button>
        </form>
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="business-grid dashboard-queue-grid">
        {queues.map((queue) => {
          const url = queuePublicUrl(queue.slug);
          return (
            <article className="business-card dashboard-queue-card" key={queue.id}>
              <div className="dashboard-qr-frame">
                <QrCode value={url} />
              </div>
              <div className="dashboard-queue-main">
                <div>
                  <p className="eyebrow">QR publico</p>
                  <h2>{queue.name}</h2>
                  <p className="muted public-url">{url}</p>
                </div>
                <div className="inline-actions">
                  <button className="button" onClick={() => void copyPublicUrl(queue)}>
                    <Copy size={17} />
                    {copiedQueueId === queue.id ? "Copiado" : "Copiar link"}
                  </button>
                  <Link className="button" href={`/q/${queue.slug}`}>
                    <ExternalLink size={17} />
                    Vista publica
                  </Link>
                  <Link className="button primary" href={`/player/${queue.id}`}>
                    <MonitorPlay size={17} />
                    Abrir player
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
