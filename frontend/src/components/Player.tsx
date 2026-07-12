"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Headphones,
  ListMusic,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
} from "lucide-react";
import { api } from "@/lib/api";
import { getStaffSession } from "@/lib/session";
import { AdminQueueResponse, AdminQueueSong } from "@/lib/types";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string;
          playerVars?: {
            autoplay?: number;
          };
          events?: {
            onReady?: (event: {
              target: { playVideo: () => void };
            }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => {
        loadVideoById: (videoId: string) => void;
        playVideo: () => void;
        pauseVideo: () => void;
      };
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function scoreSpanishVoice(voice: SpeechSynthesisVoice) {
  const descriptor = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;

  if (voice.lang.toLowerCase() === "es-ar") score += 60;
  if (voice.lang.toLowerCase().startsWith("es-")) score += 35;
  if (descriptor.includes("natural")) score += 45;
  if (descriptor.includes("online")) score += 35;
  if (descriptor.includes("google")) score += 28;
  if (descriptor.includes("microsoft")) score += 28;
  if (
    ["sabina", "helena", "paulina", "monica", "elvira", "alvaro"].some((name) =>
      descriptor.includes(name),
    )
  ) {
    score += 14;
  }

  return score;
}

async function getSpeechVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) return voices;

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const timeout = window.setTimeout(
      () => resolve(window.speechSynthesis.getVoices()),
      700,
    );

    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeout);
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

async function speakSongIntro(requestedByName: string) {
  if (!("speechSynthesis" in window)) return;

  const voices = await getSpeechVoices();
  const preferredVoice =
    voices
      .filter((voice) => voice.lang.toLowerCase().startsWith("es"))
      .sort((a, b) => scoreSpanishVoice(b) - scoreSpanishVoice(a))[0] ?? null;

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(
      `Cancion sonando solicitada por: ${requestedByName}`,
    );

    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice?.lang ?? "es-AR";
    utterance.rate = 0.9;
    utterance.pitch = 1.03;
    utterance.volume = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export function Player({ queueId }: { queueId: string }) {
  const playerRef = useRef<InstanceType<
    NonNullable<typeof window.YT>["Player"]
  > | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const announcedVideoIdRef = useRef<string | null>(null);
  const advancingRef = useRef(false);
  const loadingRef = useRef(false);
  const [state, setState] = useState<AdminQueueResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const currentSong = useMemo(
    () => state?.songs?.find((song) => song.status === "playing") ?? null,
    [state],
  );
  const pendingSongs = useMemo(
    () => state?.songs?.filter((song) => song.status === "queued") ?? [],
    [state],
  );
  const playedSongs = useMemo(
    () => state?.songs?.filter((song) => song.status === "played") ?? [],
    [state],
  );
  const activeSongs = useMemo(
    () => state?.songs?.filter((song) => song.status !== "played") ?? [],
    [state],
  );

  const getSongTitle = useCallback(
    (song: Pick<AdminQueueSong, "youtubeVideoId">) =>
      videoTitles[song.youtubeVideoId] ?? "Cargando titulo...",
    [videoTitles],
  );

  const loadQueue = useCallback(async () => {
    if (loadingRef.current) return;

    const session = getStaffSession();
    if (!session) {
      setError("La sesion del negocio vencio. Volve al dashboard para ingresar.");
      return;
    }

    loadingRef.current = true;
    try {
      setToken(session.accessToken);
      setState(await api.getAdminQueue(session.accessToken, queueId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el player");
    } finally {
      loadingRef.current = false;
    }
  }, [queueId]);

  const playNext = useCallback(async () => {
    if (advancingRef.current) return;

    advancingRef.current = true;
    window.speechSynthesis?.cancel();
    playerRef.current?.pauseVideo();
    const session = getStaffSession();
    if (!session) {
      advancingRef.current = false;
      return;
    }

    try {
      await api.nextSong(session.accessToken, queueId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo avanzar");
    } finally {
      advancingRef.current = false;
    }
  }, [loadQueue, queueId]);

  useEffect(() => {
    void loadQueue();
    const interval = window.setInterval(() => void loadQueue(), 2000);
    return () => window.clearInterval(interval);
  }, [loadQueue]);

  useEffect(() => {
    if (!state || currentSong || pendingSongs.length === 0) return;
    void playNext();
  }, [currentSong, pendingSongs.length, playNext, state]);

  useEffect(() => {
    if (!currentSong) return;
    const songToPlay = currentSong;

    async function announceSong() {
      if (announcedVideoIdRef.current === songToPlay.youtubeVideoId) {
        return;
      }

      announcedVideoIdRef.current = songToPlay.youtubeVideoId;
      await speakSongIntro(songToPlay.requestedBy?.name ?? "un usuario");
    }

    async function loadCurrentVideo() {
      const isChangingVideo =
        currentVideoIdRef.current !== null &&
        currentVideoIdRef.current !== songToPlay.youtubeVideoId;

      if (isChangingVideo) {
        playerRef.current?.pauseVideo();
      }

      await announceSong();

      if (playerRef.current) {
        if (currentVideoIdRef.current !== songToPlay.youtubeVideoId) {
          currentVideoIdRef.current = songToPlay.youtubeVideoId;
          playerRef.current.loadVideoById(songToPlay.youtubeVideoId);
        }
        return;
      }

      window.onYouTubeIframeAPIReady = () => {
        currentVideoIdRef.current = songToPlay.youtubeVideoId;
        playerRef.current = new window.YT!.Player("youtube-player", {
          videoId: songToPlay.youtubeVideoId,
          playerVars: {
            autoplay: 1,
          },
          events: {
            onReady: (event) => event.target.playVideo(),
            onStateChange: (event) => {
              if (event.data === window.YT?.PlayerState.ENDED) {
                void playNext();
              }
            },
          },
        });
      };

      if (
        !document.querySelector("script[src='https://www.youtube.com/iframe_api']")
      ) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      } else if (window.YT) {
        window.onYouTubeIframeAPIReady();
      }
    }

    void loadCurrentVideo();
  }, [currentSong, playNext]);

  useEffect(() => {
    const songs = state?.songs ?? [];
    const missingSongs = songs.filter((song) => !videoTitles[song.youtubeVideoId]);

    if (!missingSongs.length) return;

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

            if (!response.ok) throw new Error("No title");

            const data = (await response.json()) as { title?: string };
            return [song.youtubeVideoId, data.title ?? "Video de YouTube"] as const;
          } catch {
            return [song.youtubeVideoId, "Video de YouTube"] as const;
          }
        }),
      );

      if (!isMounted) return;

      setVideoTitles((currentTitles) => ({
        ...currentTitles,
        ...Object.fromEntries(entries),
      }));
    }

    void loadTitles();

    return () => {
      isMounted = false;
    };
  }, [state, videoTitles]);

  async function updatePlayback(status: "playing" | "paused" | "stopped") {
    if (!token) return;
    await api.updatePlayback(token, queueId, status);
    if (status === "paused") playerRef.current?.pauseVideo();
    if (status === "playing") playerRef.current?.playVideo();
    await loadQueue();
  }

  async function resetQueue() {
    if (!token) return;
    await api.resetQueue(token, queueId);
    window.speechSynthesis?.cancel();
    currentVideoIdRef.current = null;
    announcedVideoIdRef.current = null;
    await loadQueue();
  }

  return (
    <main className="player-layout">
      <section className="player-stage">
        <div id="youtube-player" className="youtube-player" />
        {!currentSong ? (
          <div className="player-empty">
            <Headphones size={42} />
            <h1>Sin canciones en la playlist</h1>
            <p>Cuando alguien agregue un tema, va a aparecer aca.</p>
          </div>
        ) : null}
      </section>

      <aside className="player-sidebar">
        <div className="player-header">
          <div>
            <p className="eyebrow">PC principal</p>
            <h1>Player</h1>
          </div>
          <div className="player-header-actions">
            <Link className="button player-back-button" href="/dashboard">
              <ArrowLeft size={17} />
              Dashboard
            </Link>
            <span className="live-pill">
              <Volume2 size={15} />
              Voz activa
            </span>
          </div>
        </div>

        <section className="player-now-card">
          <p className="eyebrow">Sonando ahora</p>
          <h2>
            {currentSong ? getSongTitle(currentSong) : "Esperando la proxima cancion"}
          </h2>
          <p className="muted">
            {currentSong?.requestedBy
              ? `Solicitada por ${currentSong.requestedBy.name}`
              : "Esta pantalla queda abierta en la computadora conectada a los parlantes."}
          </p>
        </section>

        <div className="player-stats">
          <span>
            <strong>{pendingSongs.length}</strong>
            en espera
          </span>
          <span>
            <strong>{playedSongs.length}</strong>
            reproducidas
          </span>
        </div>

        <div className="control-grid">
          <button
            className="button primary"
            onClick={() => void updatePlayback("playing")}
          >
            <Play size={18} />
            Play
          </button>
          <button className="button" onClick={() => void updatePlayback("paused")}>
            <Pause size={18} />
            Pausa
          </button>
          <button className="button" onClick={() => void playNext()}>
            <SkipForward size={18} />
            Siguiente
          </button>
          <button className="button danger" onClick={() => void resetQueue()}>
            <RotateCcw size={18} />
            Reiniciar
          </button>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="player-queue-title">
          <div>
            <p className="eyebrow">Lista</p>
            <h2>Playlist en reproduccion</h2>
          </div>
          <ListMusic size={20} />
        </div>

        <div className="song-list compact">
          {activeSongs.map((song, index) => (
            <article className="song-row" key={song.id}>
              <span className="song-position">{index + 1}</span>
              <div>
                <strong>{getSongTitle(song)}</strong>
                <p className="muted">
                  {song.status === "playing" ? "Reproduciendo" : "En espera"} -{" "}
                  {song.votes} votos - prioridad {song.manualPriority}
                </p>
              </div>
            </article>
          ))}
          {!activeSongs.length ? (
            <p className="player-list-empty">No hay canciones pendientes.</p>
          ) : null}
        </div>
      </aside>
    </main>
  );
}
