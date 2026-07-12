import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@Injectable()
export class PublicUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.type !== 'public') {
      throw new ForbiddenException('Debes iniciar sesion con Google');
    }

    return true;
  }
}
