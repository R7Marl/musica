export type PlaybackStatus = 'playing' | 'paused' | 'stopped';

export interface QueueSong {
  id: string;
  queueId: string;
  requestedByUserId: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  votes: number;
  manualPriority: number;
  status: 'queued' | 'playing' | 'played';
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
  status: PlaybackStatus;
  currentSongId: string | null;
  updatedAt: string;
}

export interface QueueState {
  songs: QueueSong[];
  playback: PlaybackState;
}

export interface PublicQueueSong {
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

export interface SkipVoteSummary {
  songId: string | null;
  votes: number;
  requiredVotes: number;
  eligibleVoters: number;
}
