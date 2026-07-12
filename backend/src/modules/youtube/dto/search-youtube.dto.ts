import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchYoutubeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  q: string;

  @IsOptional()
  @IsString()
  pageToken?: string;
}
