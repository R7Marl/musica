"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  ChevronRight,
  ListMusic,
  LogOut,
  Menu,
  Music,
  Plus,
  RefreshCw,
  ThumbsUp,
  Trash2,
  UserRound,
  Vote,
} from "lucide-react";
import { api } from "@/lib/api";
import { clearPublicSession, getPublicSession } from "@/lib/session";
import {
  AuthSession,
  PublicQueueResponse,
  QueueSong,
  SongRequestHistoryItem,
} from "@/lib/types";
import { GoogleSignIn } from "./GoogleSignIn";
import { PublicAccountAccess } from "./PublicAccountAccess";

interface PublicQueueProps {
  queueSlug: string;
  queueName?: string;
}

export function PublicQueue({ queueSlug, queueName }: PublicQueueProps) {
  const [queueState, setQueueState] = useState<PublicQueueResponse | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<SongRequestHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [readdingId, setReaddingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentSong = useMemo(
    () => queueState?.queue.find((song) => song.isPlaying) ?? null,
    [queueState],
  );
  const waitingSongs = useMemo(
    () => queueState?.queue.filter((song) => !song.isPlaying) ?? [],
    [queueState],
  );

  const getSongTitle = useCallback(
    (song: Pick<QueueSong, "youtubeVideoId">) =>
      videoTitles[song.youtubeVideoId] ?? "Cargando titulo...",
    [videoTitles],
  );

  const loadQueue = useCallback(async () => {
    try {
      const data = await api.getPublicQueue(queueSlug);
      setQueueState(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la playlist");
    }
  }, [queueSlug]);

  const loadHistory = useCallback(async () => {
    if (!session) {
      return;
    }

    setHistoryLoading(true);
    try {
      setHistory(await api.getMySongRequests(queueSlug, session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar tu historial");
    } finally {
      setHistoryLoading(false);
    }
  }, [queueSlug, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!session) {
      setError("Inicia sesion para agregar canciones.");
      return;
    }

    try {
      setSubmitting(true);
      await api.addSong(queueSlug, youtubeUrl, session.accessToken);
      setYoutubeUrl("");
      setMessage("Cancion agregada a la playlist");
      await loadQueue();
      if (historyOpen) {
        await loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReaddSong(item: SongRequestHistoryItem) {
    if (!session || item.isActive || readdingId) {
      return;
    }

    setMessage("");
    setError("");
    setReaddingId(item.id);
    try {
      await api.addSong(queueSlug, item.youtubeUrl, session.accessToken);
      setMessage("Cancion agregada nuevamente a la playlist.");
      await Promise.all([loadQueue(), loadHistory()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo volver a agregar");
    } finally {
      setReaddingId(null);
    }
  }

  function handleLogout() {
    clearPublicSession();
    setSession(null);
    setHistory([]);
    setAccountMenuOpen(false);
    setHistoryOpen(false);
  }

  function openHistory() {
    setAccountMenuOpen(false);
    setHistoryOpen(true);
    void loadHistory();
  }

  async function handleSkipVote() {
    setMessage("");
    setError("");

    if (!session) {
      setError("Inicia sesion con Google para votar.");
      return;
    }

    try {
      const response = await api.voteToSkip(queueSlug, session.accessToken);
      setMessage(
        response.skipped
          ? "La comunidad salteo la cancion."
          : "Voto registrado para saltear.",
      );
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo votar");
    }
  }

  async function handleRemoveOwnSong(songId: string) {
    setMessage("");
    setError("");

    if (!session) {
      setError("Inicia sesion con Google para borrar tus canciones.");
      return;
    }

    try {
      await api.removeOwnSong(queueSlug, songId, session.accessToken);
      setMessage("Cancion eliminada de la playlist.");
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  useEffect(() => {
    const savedSession = getPublicSession();
    setSession(savedSession?.user.type === "public" ? savedSession : null);

    function handleExpiredSession() {
      clearPublicSession();
      setSession(null);
      setHistory([]);
      setAccountMenuOpen(false);
      setHistoryOpen(false);
      setMessage("");
      setError("Tu sesion vencio. Inicia sesion nuevamente.");
    }

    window.addEventListener("qfit:session-expired", handleExpiredSession);
    void loadQueue();
    const interval = window.setInterval(() => void loadQueue(), 5000);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("qfit:session-expired", handleExpiredSession);
    };
  }, [loadQueue]);

  useEffect(() => {
    const songs = [
      ...(queueState?.queue ?? []),
      ...history,
    ];
    const missingSongs = songs.filter((song) => !videoTitles[song.youtubeVideoId]);

    if (!missingSongs.length) {
      return;
    }

    let isMounted = true;

    async function loadTitles() {
      const entries = await Promise.all(
        missingSongs.map(async (song) => {
          try {
            const response = await fetch(
              `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
                song.youtubeUrl,
              )}`,
            );

            if (!response.ok) {
              throw new Error("No title");
            }

            const data = (await response.json()) as { title?: string };
            return [song.youtubeVideoId, data.title ?? "Video de YouTube"] as const;
          } catch {
            return [song.youtubeVideoId, "Video de YouTube"] as const;
          }
        }),
      );

      if (!isMounted) {
        return;
      }

      setVideoTitles((currentTitles) => ({
        ...currentTitles,
        ...Object.fromEntries(entries),
      }));
    }

    void loadTitles();

    return () => {
      isMounted = false;
    };
  }, [queueState, history, videoTitles]);

  return (
    <section className="queue-surface public-queue">
      <div className="surface-header public-queue-header">
        <div>
          <p className="eyebrow">Playlist publica</p>
          <h1>{queueName ?? "Musica del negocio"}</h1>
          <p className="muted">
            Suma un tema y la comunidad decide que suena primero.
          </p>
        </div>
        <div className="public-header-actions">
          <button className="icon-button" onClick={() => void loadQueue()}>
            <RefreshCw size={18} />
            <span className="sr-only">Actualizar</span>
          </button>
          {session ? (
            <div className="account-menu-wrap">
              <button
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="account-menu-trigger"
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                {session.user.avatarUrl ? (
                  <img alt="" src={session.user.avatarUrl} />
                ) : (
                  <UserRound size={18} />
                )}
                <span>{session.user.name ?? "Mi cuenta"}</span>
                <Menu size={17} />
              </button>
              {accountMenuOpen ? (
                <div className="account-menu" role="menu">
                  <button onClick={openHistory} role="menuitem">
                    <ListMusic size={17} />
                    Mis canciones
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={handleLogout} role="menuitem">
                    <LogOut size={17} />
                    Cerrar sesion
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="now-playing public-now-playing">
        <div className="now-playing-art">
          {currentSong ? (
            <img
              alt=""
              src={`https://img.youtube.com/vi/${currentSong.youtubeVideoId}/mqdefault.jpg`}
            />
          ) : (
            <Music size={28} />
          )}
        </div>
        <div>
          <p className="muted">Sonando ahora</p>
          <strong>
            {currentSong ? getSongTitle(currentSong) : "Esperando la proxima cancion"}
          </strong>
          {currentSong?.requestedBy ? (
            <span className="requested-by">
              <UserRound size={14} />
              {currentSong.requestedBy.name}
            </span>
          ) : null}
          {currentSong ? (
            <div className="skip-vote-box">
              <span>
                {queueState?.skipVote.votes ?? 0}/
                {queueState?.skipVote.requiredVotes ?? 1} votos para saltear
              </span>
              <button className="button ghost-light" onClick={handleSkipVote}>
                <Vote size={16} />
                Votar skip
              </button>
              {session?.user.id === currentSong.requestedBy?.id ? (
                <button
                  className="button ghost-light"
                  onClick={() => void handleRemoveOwnSong(currentSong.id)}
                >
                  <Trash2 size={16} />
                  Borrar mi tema
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="add-song-card">
        <div>
          <h2>Agregar cancion</h2>
          <p className="muted">
            Pega un link de YouTube. Tu pedido queda asociado a tu cuenta.
          </p>
        </div>
        <form className="add-song-form" onSubmit={handleSubmit}>
          <input
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
            value={youtubeUrl}
            required
          />
          <button className="button primary" disabled={submitting} type="submit">
            <Plus size={18} />
            {submitting ? "Revisando..." : "Agregar"}
          </button>
        </form>
      </div>

      {!session ? (
        <div className="google-box">
          <p className="muted">
            Para pedir canciones necesitamos saber quien las agrega.
          </p>
          <GoogleSignIn onLogin={setSession} />
          <div className="auth-divider"><span>o</span></div>
          <PublicAccountAccess onLogin={setSession} />
        </div>
      ) : (
        <p className="muted">Pedido como {session.user.name ?? session.user.email}</p>
      )}

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="queue-section-title">
        <div>
          <p className="eyebrow">Lista de espera</p>
          <h2>Proximas canciones</h2>
        </div>
        <span className="queue-count">
          <ListMusic size={16} />
          {waitingSongs.length}
        </span>
      </div>

      <div className="song-list public-song-list">
        {waitingSongs.length ? (
          waitingSongs.map((song) => (
            <article className="song-row public-song-row" key={song.id}>
              <span className="song-position">{song.position}</span>
              <img
                alt=""
                className="song-thumb"
                src={`https://img.youtube.com/vi/${song.youtubeVideoId}/mqdefault.jpg`}
              />
              <div className="song-main">
                <strong>{getSongTitle(song)}</strong>
                <div className="song-meta">
                  <span>
                    <ThumbsUp size={14} />
                    {song.votes} votos
                  </span>
                  {song.requestedBy ? (
                    <span>
                      <UserRound size={14} />
                      {song.requestedBy.name}
                    </span>
                  ) : null}
                  <span>
                    <Clock3 size={14} />
                    En espera
                  </span>
                </div>
              </div>
              {session?.user.id === song.requestedBy?.id ? (
                <button
                  className="icon-button danger-icon"
                  onClick={() => void handleRemoveOwnSong(song.id)}
                  title="Eliminar mi cancion"
                >
                  <Trash2 size={17} />
                  <span className="sr-only">Eliminar mi cancion</span>
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <p className="empty-state">
            Todavia no hay canciones en espera. Se la primera persona en pedir una.
          </p>
        )}
      </div>

      {historyOpen ? (
        <div className="history-backdrop" onClick={() => setHistoryOpen(false)}>
          <aside
            aria-label="Mis canciones solicitadas"
            className="history-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-header">
              <div>
                <p className="eyebrow">Tu historial</p>
                <h2>Mis canciones</h2>
              </div>
              <button className="icon-button" onClick={() => setHistoryOpen(false)}>
                <span aria-hidden="true">×</span>
                <span className="sr-only">Cerrar</span>
              </button>
            </div>
            <p className="muted">
              Volve a pedir un tema cuando ya no este en la playlist.
            </p>
            <div className="history-list">
              {historyLoading ? (
                <p className="empty-state">Cargando tus canciones...</p>
              ) : history.length ? (
                history.map((item) => (
                  <article className="history-song" key={item.id}>
                    <img
                      alt=""
                      src={`https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`}
                    />
                    <div>
                      <strong>{getSongTitle(item)}</strong>
                      <span>
                        {new Intl.DateTimeFormat("es-AR", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(item.requestedAt))}
                      </span>
                    </div>
                    <button
                      className="button history-add-button"
                      disabled={item.isActive || readdingId === item.id}
                      onClick={() => void handleReaddSong(item)}
                    >
                      <Plus size={16} />
                      {item.isActive ? "Ya esta" : "Pedir"}
                    </button>
                  </article>
                ))
              ) : (
                <p className="empty-state">Todavia no solicitaste canciones.</p>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
