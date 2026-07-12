import { IsString, IsUrl } from 'class-validator';

export class AddSongDto {
  @IsString()
  @IsUrl({ require_protocol: true })
  youtubeUrl: string;
}
