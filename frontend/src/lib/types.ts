export type UserRole = "owner" | "client" | "public";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  businessId: string | null;
  type: "staff" | "public";
  name?: string | null;
  avatarUrl?: string | null;
}

export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: AuthUser;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface MusicQueue {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface QueueSong {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  votes: number;
  position: number;
  isPlaying: boolean;
  requestedAt: string;
  requestedBy?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

export interface SongRequestHistoryItem {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  requestedAt: string;
  isActive: boolean;
}

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  youtubeUrl: string;
}

export interface YoutubeSearchResponse {
  results: YoutubeSearchResult[];
  nextPageToken: string | null;
}

export interface AdminQueueSong {
  id: string;
  queueId: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  votes: number;
  manualPriority: number;
  status: "queued" | "playing" | "played";
  requestedAt: string;
  updatedAt: string;
  lastPlayedAt?: string;
  requestedBy?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

export interface PlaybackState {
  queueId: string;
  status: "playing" | "paused" | "stopped";
  currentSongId: string | null;
  updatedAt: string;
}

export interface PublicQueueResponse {
  playback: PlaybackState;
  queue: QueueSong[];
  skipVote: {
    songId: string | null;
    votes: number;
    requiredVotes: number;
    eligibleVoters: number;
  };
}

export interface AdminQueueResponse {
  playback: PlaybackState;
  songs: AdminQueueSong[];
}

export interface PublicBusinessResponse {
  business: Business;
  queues: MusicQueue[];
}

export interface OwnerBusinessResponse extends PublicBusinessResponse {
  user?: AuthUser;
  defaultQueue?: MusicQueue;
}
