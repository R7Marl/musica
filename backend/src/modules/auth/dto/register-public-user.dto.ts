import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterPublicUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
