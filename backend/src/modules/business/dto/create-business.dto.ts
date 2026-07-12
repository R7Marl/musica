import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsEmail()
  userEmail: string;

  @IsString()
  @MinLength(8)
  userPassword: string;

  @IsOptional()
  @IsString()
  defaultQueueName?: string;
}
