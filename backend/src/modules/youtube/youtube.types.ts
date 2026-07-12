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
