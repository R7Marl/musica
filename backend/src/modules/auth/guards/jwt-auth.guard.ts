import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.header('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token requerido');
    }

    const token = authorization.slice('Bearer '.length);

    try {
      (request as AuthenticatedRequest).user =
        await this.authService.verifyToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }
}
