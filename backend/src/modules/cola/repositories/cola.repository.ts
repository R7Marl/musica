import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaybackEntity } from '../entities/playback.entity';
import { QueueSkipVoteEntity } from '../entities/queue-skip-vote.entity';
import { QueueSongEntity } from '../entities/queue-song.entity';
import { SongRequestEntity } from '../entities/song-request.entity';
import { PlaybackState, QueueSong, QueueState } from '../types/cola.types';

@Injectable()
export class ColaRepository {
  constructor(
    @InjectRepository(QueueSongEntity)
    private readonly songsRepository: Repository<QueueSongEntity>,
    @InjectRepository(PlaybackEntity)
    private readonly playbackRepository: Repository<PlaybackEntity>,
    @InjectRepository(QueueSkipVoteEntity)
    private readonly skipVotesRepository: Repository<QueueSkipVoteEntity>,
    @InjectRepository(SongRequestEntity)
    private readonly requestsRepository: Repository<SongRequestEntity>,
  ) {}

  async getState(queueId: string): Promise<QueueState> {
    const [songs, playback] = await Promise.all([
      this.songsRepository.find({
        where: { queueId },
        relations: { requestedBy: true },
      }),
      this.getPlayback(queueId),
    ]);

    return {
      songs: songs.map((song) => this.toQueueSong(song)),
      playback: this.toPlaybackState(playback),
    };
  }

  async saveState(queueId: string, state: QueueState): Promise<QueueState> {
    await this.songsRepository.save(
      state.songs.map((song) => this.toQueueSongEntity(song)),
    );
    await this.playbackRepository.save(
      this.playbackRepository.create({
        id: queueId,
        status: state.playback.status,
        currentSongId: state.playback.currentSongId,
        updatedAt: new Date(state.playback.updatedAt),
      }),
    );

    return this.getState(queueId);
  }

  async deleteSong(songId: string): Promise<void> {
    await this.songsRepository.delete(songId);
  }

  async recordRequest(input: {
    queueId: string;
    userId: string;
    queueSongId: string;
    youtubeUrl: string;
    youtubeVideoId: string;
  }): Promise<void> {
    await this.requestsRepository.save(this.requestsRepository.create(input));
  }

  async hasActiveRequest(
    queueSongId: string,
    userId: string,
  ): Promise<boolean> {
    return this.requestsRepository.exists({
      where: { queueSongId, userId },
    });
  }

  async getUserRequestHistory(queueId: string, userId: string) {
    const requests = await this.requestsRepository.find({
      where: { queueId, userId },
      order: { requestedAt: 'DESC' },
      take: 100,
    });
    const uniqueRequests = requests.filter(
      (request, index, all) =>
        all.findIndex(
          (candidate) => candidate.youtubeVideoId === request.youtubeVideoId,
        ) === index,
    );

    return uniqueRequests.slice(0, 30);
  }

  async addSkipVote(songId: string, userId: string): Promise<void> {
    const existingVote = await this.skipVotesRepository.findOne({
      where: {
        songId,
        userId,
      },
    });

    if (existingVote) {
      return;
    }

    await this.skipVotesRepository.save(
      this.skipVotesRepository.create({
        songId,
        userId,
      }),
    );
  }

  async countSkipVotes(songId: string): Promise<number> {
    return this.skipVotesRepository.count({
      where: { songId },
    });
  }

  async deleteSkipVotes(songId: string): Promise<void> {
    await this.skipVotesRepository.delete({ songId });
  }

  async clearQueue(queueId: string): Promise<QueueState> {
    await this.playbackRepository.save(
      this.playbackRepository.create({
        id: queueId,
        status: 'stopped',
        currentSongId: null,
        updatedAt: new Date(),
      }),
    );
    await this.songsRepository.delete({ queueId });

    return this.getState(queueId);
  }

  private async getPlayback(queueId: string): Promise<PlaybackEntity> {
    const existingPlayback = await this.playbackRepository.findOne({
      where: { id: queueId },
    });

    if (existingPlayback) {
      return existingPlayback;
    }

    return this.playbackRepository.save(
      this.playbackRepository.create({
        id: queueId,
        status: 'stopped',
        currentSongId: null,
        updatedAt: new Date(),
      }),
    );
  }

  private toQueueSong(song: QueueSongEntity): QueueSong {
    return {
      id: song.id,
      queueId: song.queueId,
      requestedByUserId: song.requestedByUserId,
      youtubeUrl: song.youtubeUrl,
      youtubeVideoId: song.youtubeVideoId,
      votes: song.votes,
      manualPriority: song.manualPriority,
      status: song.status,
      requestedAt: song.requestedAt.toISOString(),
      updatedAt: song.updatedAt.toISOString(),
      lastPlayedAt: song.lastPlayedAt?.toISOString(),
      requestedBy: song.requestedBy
        ? {
            id: song.requestedBy.id,
            name: song.requestedBy.name,
            avatarUrl: song.requestedBy.avatarUrl,
          }
        : null,
    };
  }

  private toPlaybackState(playback: PlaybackEntity): PlaybackState {
    return {
      status: playback.status,
      queueId: playback.id,
      currentSongId: playback.currentSongId,
      updatedAt: playback.updatedAt.toISOString(),
    };
  }

  private toQueueSongEntity(song: QueueSong): QueueSongEntity {
    return this.songsRepository.create({
      id: song.id,
      queueId: song.queueId,
      requestedByUserId: song.requestedByUserId,
      youtubeUrl: song.youtubeUrl,
      youtubeVideoId: song.youtubeVideoId,
      votes: song.votes,
      manualPriority: song.manualPriority,
      status: song.status,
      requestedAt: new Date(song.requestedAt),
      updatedAt: new Date(song.updatedAt),
      lastPlayedAt: song.lastPlayedAt ? new Date(song.lastPlayedAt) : null,
    });
  }
}
