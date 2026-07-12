import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterPublicUserDto } from './dto/register-public-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('google')
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(googleLoginDto.credential);
  }

  @Post('public/register')
  registerPublicUser(@Body() dto: RegisterPublicUserDto) {
    return this.authService.registerPublicUser(dto);
  }

  @Post('public/login')
  loginPublicUser(@Body() dto: LoginDto) {
    return this.authService.loginPublicUser(dto.email, dto.password);
  }
}
