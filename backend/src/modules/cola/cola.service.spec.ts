import { BadRequestException } from '@nestjs/common';
import { ColaService } from './cola.service';
import { ColaRepository } from './repositories/cola.repository';
import { QueueState } from './types/cola.types';

describe('ColaService', () => {
  const queueId = 'queue-a';
  let state: QueueState;
  let service: ColaService;
  let repository: Pick<
    ColaRepository,
    'getState' | 'saveState' | 'hasActiveRequest' | 'recordRequest'
  >;

  beforeEach(() => {
    state = {
      songs: [],
      playback: {
        queueId,
        status: 'stopped',
        currentSongId: null,
        updatedAt: new Date().toISOString(),
      },
    };

    repository = {
      getState: jest.fn(() => Promise.resolve(state)),
      saveState: jest.fn((_queueId: string, nextState: QueueState) => {
        state = nextState;
        return Promise.resolve(state);
      }),
      hasActiveRequest: jest.fn(() => Promise.resolve(false)),
      recordRequest: jest.fn(() => Promise.resolve()),
    };

    service = new ColaService(repository as ColaRepository);
  });

  it('adds YouTube songs and increases votes for repeated requests', async () => {
    const firstResult = await service.addSong(
      queueId,
      'https://www.youtube.com/watch?v=abc123DEF_4',
      'public-user-id',
    );
    const secondResult = await service.addSong(
      queueId,
      'https://youtu.be/abc123DEF_4',
      'another-public-user-id',
    );

    expect(firstResult.duplicated).toBe(false);
    expect(secondResult.duplicated).toBe(true);
    expect(secondResult.song.votes).toBe(2);
    expect(state.songs).toHaveLength(1);
  });

  it('does not count the same user twice for an active song', async () => {
    await service.addSong(
      queueId,
      'https://www.youtube.com/watch?v=abc123DEF_4',
      'public-user-id',
    );
    jest.mocked(repository.hasActiveRequest).mockResolvedValueOnce(true);

    await expect(
      service.addSong(queueId, 'https://youtu.be/abc123DEF_4', 'public-user-id'),
    ).rejects.toThrow('Esta cancion ya esta en tu playlist');
    expect(state.songs[0].votes).toBe(1);
  });

  it('orders the queue by votes plus manual priority', async () => {
    await service.addSong(
      queueId,
      'https://www.youtube.com/watch?v=low123DEF_4',
      'public-user-id',
    );
    const high = await service.addSong(
      queueId,
      'https://www.youtube.com/watch?v=high23DEF_4',
      'public-user-id',
    );

    await service.updatePriority(queueId, high.song.id, 5);

    const publicQueue = await service.getPublicQueue(queueId);

    expect(publicQueue.queue[0].youtubeVideoId).toBe('high23DEF_4');
  });

  it('rejects non YouTube URLs', async () => {
    await expect(
      service.addSong(queueId, 'https://example.com/song', 'public-user-id'),
    ).rejects.toThrow(BadRequestException);
  });

  it('stores only the playable YouTube video id from shared links', async () => {
    const result = await service.addSong(
      queueId,
      'https://youtu.be/abc123DEF_4?si=tracking',
      'public-user-id',
    );

    expect(result.song.youtubeVideoId).toBe('abc123DEF_4');
  });
});
