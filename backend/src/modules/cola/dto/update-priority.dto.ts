import { IsInt } from 'class-validator';

export class UpdatePriorityDto {
  @IsInt()
  manualPriority: number;
}
