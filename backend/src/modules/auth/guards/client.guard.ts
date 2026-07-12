import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@Injectable()
export class ClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.role !== 'client' || !request.user.businessId) {
      throw new ForbiddenException(
        'Solo un cliente puede realizar esta accion',
      );
    }

    return true;
  }
}
