import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ColaRepository } from './repositories/cola.repository';
import {
  PlaybackStatus,
  PublicQueueSong,
  QueueSong,
  QueueState,
  SkipVoteSummary,
} from './types/cola.types';

@Injectable()
export class ColaService {
  constructor(private readonly colaRepository: ColaRepository) {}

  async addSong(
    queueId: string,
    youtubeUrl: string,
    requestedByUserId: string,
  ) {
    const videoId = this.extractYoutubeVideoId(youtubeUrl);
    const state = await this.colaRepository.getState(queueId);
    const now = new Date().toISOString();
    const existingSong = state.songs.find(
      (song) => song.youtubeVideoId === videoId && song.status !== 'played',
    );

    if (existingSong) {
      const alreadyRequested = await this.colaRepository.hasActiveRequest(
        existingSong.id,
        requestedByUserId,
      );

      if (alreadyRequested) {
        throw new BadRequestException('Esta cancion ya esta en tu playlist');
      }

      existingSong.votes += 1;
      existingSong.updatedAt = now;
      await this.colaRepository.saveState(queueId, state);
      await this.colaRepository.recordRequest({
        queueId,
        userId: requestedByUserId,
        queueSongId: existingSong.id,
        youtubeUrl,
        youtubeVideoId: videoId,
      });

      return {
        song: existingSong,
        duplicated: true,
        queue: this.toPublicQueue(state),
      };
    }

    const song: QueueSong = {
      id: randomUUID(),
      queueId,
      requestedByUserId,
      youtubeUrl,
      youtubeVideoId: videoId,
      votes: 1,
      manualPriority: 0,
      status: 'queued',
      requestedAt: now,
      updatedAt: now,
    };

    state.songs.push(song);
    await this.colaRepository.saveState(queueId, state);
    await this.colaRepository.recordRequest({
      queueId,
      userId: requestedByUserId,
      queueSongId: song.id,
      youtubeUrl,
      youtubeVideoId: videoId,
    });

    return {
      song,
      duplicated: false,
      queue: this.toPublicQueue(state),
    };
  }

  async getPublicQueue(queueId: string) {
    const state = await this.colaRepository.getState(queueId);

    return {
      playback: state.playback,
      queue: this.toPublicQueue(state),
      skipVote: await this.getSkipVoteSummary(state),
    };
  }

  async getUserRequestHistory(queueId: string, publicUserId: string) {
    const [state, requests] = await Promise.all([
      this.colaRepository.getState(queueId),
      this.colaRepository.getUserRequestHistory(queueId, publicUserId),
    ]);
    const activeVideoIds = new Set(
      state.songs
        .filter((song) => song.status !== 'played')
        .map((song) => song.youtubeVideoId),
    );

    return requests.map((request) => ({
      id: request.id,
      youtubeUrl: request.youtubeUrl,
      youtubeVideoId: request.youtubeVideoId,
      requestedAt: request.requestedAt.toISOString(),
      isActive: activeVideoIds.has(request.youtubeVideoId),
    }));
  }

  async getAdminQueue(queueId: string) {
    const state = await this.colaRepository.getState(queueId);

    return {
      playback: state.playback,
      songs: this.sortSongs(state.songs),
    };
  }

  async playNext(queueId: string) {
    const state = await this.colaRepository.getState(queueId);
    const now = new Date().toISOString();

    if (state.playback.currentSongId) {
      const currentSong = state.songs.find(
        (song) => song.id === state.playback.currentSongId,
      );

      if (currentSong) {
        await this.colaRepository.deleteSkipVotes(currentSong.id);
        currentSong.status = 'played';
        currentSong.lastPlayedAt = now;
        currentSong.updatedAt = now;
      }
    }

    const nextSong = this.sortSongs(state.songs).find(
      (song) => song.status === 'queued',
    );

    state.playback.currentSongId = nextSong?.id ?? null;
    state.playback.status = nextSong ? 'playing' : 'stopped';
    state.playback.updatedAt = now;

    if (nextSong) {
      nextSong.status = 'playing';
      nextSong.updatedAt = now;
    }

    await this.colaRepository.saveState(queueId, state);

    return {
      playback: state.playback,
      currentSong: nextSong ?? null,
      queue: this.toPublicQueue(state),
    };
  }

  async voteToSkip(queueId: string, publicUserId: string) {
    const state = await this.colaRepository.getState(queueId);
    const currentSong = state.songs.find(
      (song) => song.id === state.playback.currentSongId,
    );

    if (!currentSong || currentSong.status !== 'playing') {
      throw new BadRequestException('No hay una cancion sonando para saltear');
    }

    await this.colaRepository.addSkipVote(currentSong.id, publicUserId);

    const summary = await this.getSkipVoteSummary(state);
    const skipped = summary.votes >= summary.requiredVotes;

    if (skipped) {
      await this.playNext(queueId);
    }

    return {
      skipped,
      skipVote: summary,
    };
  }

  async updatePlayback(queueId: string, status: PlaybackStatus) {
    if (!['playing', 'paused', 'stopped'].includes(status)) {
      throw new BadRequestException('Estado de reproduccion invalido');
    }

    const state = await this.colaRepository.getState(queueId);
    state.playback.status = status;
    state.playback.updatedAt = new Date().toISOString();

    await this.colaRepository.saveState(queueId, state);
    return state.playback;
  }

  async updatePriority(
    queueId: string,
    songId: string,
    manualPriority: number,
  ) {
    if (!Number.isInteger(manualPriority)) {
      throw new BadRequestException('La prioridad debe ser un numero entero');
    }

    const state = await this.colaRepository.getState(queueId);
    const song = state.songs.find((item) => item.id === songId);

    if (!song) {
      throw new NotFoundException('Cancion no encontrada');
    }

    song.manualPriority = manualPriority;
    song.updatedAt = new Date().toISOString();

    await this.colaRepository.saveState(queueId, state);
    return song;
  }

  async removeSong(queueId: string, songId: string) {
    const state = await this.colaRepository.getState(queueId);
    const song = state.songs.find((item) => item.id === songId);

    if (!song) {
      throw new NotFoundException('Cancion no encontrada');
    }

    state.songs = state.songs.filter((item) => item.id !== songId);

    if (state.playback.currentSongId === songId) {
      state.playback.currentSongId = null;
      state.playback.status = 'stopped';
      state.playback.updatedAt = new Date().toISOString();
    }

    await this.colaRepository.deleteSong(songId);
    await this.colaRepository.saveState(queueId, state);
    return { removed: true };
  }

  async removeOwnSong(queueId: string, songId: string, publicUserId: string) {
    const state = await this.colaRepository.getState(queueId);
    const song = state.songs.find((item) => item.id === songId);

    if (!song) {
      throw new NotFoundException('Cancion no encontrada');
    }

    if (song.requestedByUserId !== publicUserId) {
      throw new ForbiddenException('Solo podes borrar canciones que agregaste');
    }

    if (song.status === 'played') {
      throw new BadRequestException('No se puede borrar una cancion ya pasada');
    }

    return this.removeSong(queueId, songId);
  }

  async resetQueue(queueId: string) {
    return this.colaRepository.clearQueue(queueId);
  }

  private toPublicQueue(state: QueueState): PublicQueueSong[] {
    return this.sortSongs(state.songs)
      .filter((song) => song.status !== 'played')
      .map((song, index) => ({
        id: song.id,
        youtubeUrl: song.youtubeUrl,
        youtubeVideoId: song.youtubeVideoId,
        votes: song.votes,
        position: index + 1,
        isPlaying: song.id === state.playback.currentSongId,
        requestedAt: song.requestedAt,
        requestedBy: song.requestedBy,
      }));
  }

  private sortSongs(songs: QueueSong[]): QueueSong[] {
    return [...songs].sort((left, right) => {
      if (left.status === 'playing') {
        return -1;
      }

      if (right.status === 'playing') {
        return 1;
      }

      const priorityDifference =
        right.votes + right.manualPriority - (left.votes + left.manualPriority);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (
        new Date(left.requestedAt).getTime() -
        new Date(right.requestedAt).getTime()
      );
    });
  }

  private async getSkipVoteSummary(
    state: QueueState,
  ): Promise<SkipVoteSummary> {
    const currentSong = state.songs.find(
      (song) => song.id === state.playback.currentSongId,
    );
    const eligibleVoters = new Set(
      state.songs
        .filter((song) => song.status !== 'played')
        .map((song) => song.requestedByUserId),
    ).size;
    const requiredVotes = Math.max(1, Math.ceil(eligibleVoters * 0.5));

    if (!currentSong) {
      return {
        songId: null,
        votes: 0,
        requiredVotes,
        eligibleVoters,
      };
    }

    return {
      songId: currentSong.id,
      votes: await this.colaRepository.countSkipVotes(currentSong.id),
      requiredVotes,
      eligibleVoters,
    };
  }

  private extractYoutubeVideoId(url: string): string {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException('El link de YouTube es requerido');
    }

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.replace(/^www\./, '');

      if (hostname === 'youtu.be') {
        const id = parsedUrl.pathname.split('/').filter(Boolean)[0];

        if (id) {
          return id;
        }
      }

      if (
        ['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(hostname)
      ) {
        const id = parsedUrl.searchParams.get('v');

        if (id) {
          return id;
        }

        const embedMatch = parsedUrl.pathname.match(
          /^\/(?:embed|shorts)\/([^/?]+)/,
        );

        if (embedMatch?.[1]) {
          return embedMatch[1];
        }
      }
    } catch {
      throw new BadRequestException('El link de YouTube no es valido');
    }

    throw new BadRequestException('Solo se aceptan links de YouTube');
  }
}
