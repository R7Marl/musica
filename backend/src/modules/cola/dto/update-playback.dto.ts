import { IsIn } from 'class-validator';
import type { PlaybackStatus } from '../types/cola.types';

export class UpdatePlaybackDto {
  @IsIn(['playing', 'paused', 'stopped'])
  status: PlaybackStatus;
}
