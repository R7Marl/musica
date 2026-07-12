import { IsOptional, IsString } from 'class-validator';

export class CreateQueueDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
