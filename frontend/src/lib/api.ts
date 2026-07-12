import {
  AdminQueueResponse,
  AuthSession,
  MusicQueue,
  OwnerBusinessResponse,
  PlaybackState,
  PublicBusinessResponse,
  PublicQueueResponse,
  SongRequestHistoryItem,
} from "./types";

function getApiUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl && configuredUrl !== "auto") {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `Error ${response.status}`;
    let message = fallback;

    try {
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message)
        ? body.message.join(", ")
        : (body.message ?? fallback);
    } catch {
      message = fallback;
    }

    if (response.status === 401 && options.token) {
      message = "Tu sesion vencio. Inicia sesion nuevamente.";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("qfit:session-expired"));
      }
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  loginWithGoogle(credential: string) {
    return request<AuthSession>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },
  registerPublicUser(input: {
    name: string;
    email: string;
    password: string;
  }) {
    return request<AuthSession>("/auth/public/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  registerBusiness(input: {
    name: string;
    slug?: string;
    userEmail: string;
    userPassword: string;
    defaultQueueName?: string;
  }) {
    return request<OwnerBusinessResponse>("/public/businesses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  loginPublicUser(email: string, password: string) {
    return request<AuthSession>("/auth/public/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  getPublicBusiness(slug: string) {
    return request<PublicBusinessResponse>(`/public/businesses/${slug}`);
  },
  getPublicQueue(queueIdOrSlug: string) {
    return request<PublicQueueResponse>(`/playlists/${queueIdOrSlug}`);
  },
  addSong(queueIdOrSlug: string, youtubeUrl: string, token: string) {
    return request<{ queue: PublicQueueResponse["queue"] }>(
      `/playlists/${queueIdOrSlug}/canciones`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ youtubeUrl }),
      },
    );
  },
  getMySongRequests(queueIdOrSlug: string, token: string) {
    return request<SongRequestHistoryItem[]>(
      `/playlists/${queueIdOrSlug}/mis-solicitudes`,
      { token },
    );
  },
  voteToSkip(queueIdOrSlug: string, token: string) {
    return request<{
      skipped: boolean;
      skipVote: PublicQueueResponse["skipVote"];
    }>(`/playlists/${queueIdOrSlug}/skip-votes`, {
      method: "POST",
      token,
    });
  },
  removeOwnSong(queueIdOrSlug: string, songId: string, token: string) {
    return request<{ removed: boolean }>(
      `/playlists/${queueIdOrSlug}/canciones/${songId}`,
      {
        method: "DELETE",
        token,
      },
    );
  },
  listOwnerBusinesses(token: string) {
    return request<OwnerBusinessResponse[]>("/owner/businesses", { token });
  },
  createBusiness(
    token: string,
    input: {
      name: string;
      slug?: string;
      userEmail: string;
      userPassword: string;
      defaultQueueName?: string;
    },
  ) {
    return request<OwnerBusinessResponse>("/owner/businesses", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
  createOwnerQueue(
    token: string,
    businessId: string,
    input: { name: string; slug?: string },
  ) {
    return request<MusicQueue>(`/owner/businesses/${businessId}/playlists`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
  listClientQueues(token: string) {
    return request<MusicQueue[]>("/client/playlists", { token });
  },
  createClientQueue(token: string, input: { name: string; slug?: string }) {
    return request<MusicQueue>("/client/playlists", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
  getAdminQueue(token: string, queueId: string) {
    return request<AdminQueueResponse>(`/admin/playlists/${queueId}`, { token });
  },
  nextSong(token: string, queueId: string) {
    return request<AdminQueueResponse>(`/admin/playlists/${queueId}/siguiente`, {
      method: "POST",
      token,
    });
  },
  updatePlayback(
    token: string,
    queueId: string,
    status: "playing" | "paused" | "stopped",
  ) {
    return request<PlaybackState>(`/admin/playlists/${queueId}/reproduccion`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });
  },
  updatePriority(
    token: string,
    queueId: string,
    songId: string,
    manualPriority: number,
  ) {
    return request(`/admin/playlists/${queueId}/canciones/${songId}/prioridad`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ manualPriority }),
    });
  },
  removeSong(token: string, queueId: string, songId: string) {
    return request(`/admin/playlists/${queueId}/canciones/${songId}`, {
      method: "DELETE",
      token,
    });
  },
  resetQueue(token: string, queueId: string) {
    return request<AdminQueueResponse>(`/admin/playlists/${queueId}/reiniciar`, {
      method: "POST",
      token,
    });
  },
};
