import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YoutubeSearchResponse } from './youtube.types';

const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedSearch {
  expiresAt: number;
  response: YoutubeSearchResponse;
}

interface YoutubeSearchApiResponse {
  nextPageToken?: string;
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
}

@Injectable()
export class YoutubeService {
  private readonly cache = new Map<string, CachedSearch>();

  constructor(private readonly configService: ConfigService) {}

  async search(query: string, pageToken?: string): Promise<YoutubeSearchResponse> {
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');

    if (normalizedQuery.length < 3) {
      throw new BadRequestException('Escribi al menos 3 caracteres');
    }

    const cacheKey = `${normalizedQuery.toLowerCase()}::${pageToken ?? ''}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.response;
    }

    const apiKey = this.configService.get<string>('youtube.apiKey');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'La busqueda de YouTube no esta configurada',
      );
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: normalizedQuery,
      type: 'video',
      maxResults: '5',
      videoEmbeddable: 'true',
      safeSearch: 'moderate',
      key: apiKey,
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'YouTube no respondio la busqueda. Proba pegando el link.',
      );
    }

    const data = (await response.json()) as YoutubeSearchApiResponse;
    const searchResponse: YoutubeSearchResponse = {
      nextPageToken: data.nextPageToken ?? null,
      results: (data.items ?? [])
        .map((item) => {
          const videoId = item.id?.videoId;
          const snippet = item.snippet;

          if (!videoId || !snippet?.title) {
            return null;
          }

          return {
            videoId,
            title: this.decodeHtml(snippet.title),
            channelTitle: this.decodeHtml(snippet.channelTitle ?? 'YouTube'),
            thumbnailUrl:
              snippet.thumbnails?.medium?.url ??
              snippet.thumbnails?.default?.url ??
              `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          };
        })
        .filter((item): item is YoutubeSearchResponse['results'][number] =>
          Boolean(item),
        ),
    };

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      response: searchResponse,
    });

    return searchResponse;
  }

  private decodeHtml(value: string) {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }
}
