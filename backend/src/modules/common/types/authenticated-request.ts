import { Request } from 'express';
import { UserRole } from '../../auth/entities/user.entity';

export type AuthenticatedUserType = 'staff' | 'public';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole | 'public';
  businessId: string | null;
  type: AuthenticatedUserType;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
