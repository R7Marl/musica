import {
  ConflictException,
  Injectable,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PublicUserEntity } from './entities/public-user.entity';
import { UserEntity, UserRole } from './entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole | 'public';
  businessId: string | null;
  type: 'staff' | 'public';
  name?: string | null;
  avatarUrl?: string | null;
}

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PublicUserEntity)
    private readonly publicUsersRepository: Repository<PublicUserEntity>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureDefaultAdmin();
  }

  async login(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      type: 'staff',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: this.configService.getOrThrow<string>('jwt.expiresIn'),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        type: 'staff',
      },
    };
  }

  async loginWithGoogle(credential: string) {
    const clientId = this.configService.getOrThrow<string>('google.clientId');

    if (!clientId) {
      throw new UnauthorizedException('Google login no configurado');
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Credencial de Google invalida');
    }

    const normalizedEmail = payload.email.toLowerCase();
    const existingUser = await this.publicUsersRepository.findOne({
      where: [{ googleSubject: payload.sub }, { email: normalizedEmail }],
    });
    const user = await this.publicUsersRepository.save(
      this.publicUsersRepository.create({
        id: existingUser?.id,
        email: normalizedEmail,
        googleSubject: payload.sub,
        name: payload.name ?? existingUser?.name ?? payload.email,
        avatarUrl: payload.picture ?? existingUser?.avatarUrl ?? null,
      }),
    );

    return this.createPublicSession(user);
  }

  async registerPublicUser(input: {
    name: string;
    email: string;
    password: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.publicUsersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const user = await this.publicUsersRepository.save(
      this.publicUsersRepository.create({
        name: input.name.trim(),
        email,
        passwordHash: await bcrypt.hash(input.password, 12),
        googleSubject: null,
        avatarUrl: null,
      }),
    );

    return this.createPublicSession(user);
  }

  async loginPublicUser(email: string, password: string) {
    const user = await this.publicUsersRepository
      .createQueryBuilder('publicUser')
      .addSelect('publicUser.passwordHash')
      .where('LOWER(publicUser.email) = :email', {
        email: email.trim().toLowerCase(),
      })
      .getOne();

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    return this.createPublicSession(user);
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      businessId: payload.businessId,
      type: payload.type,
      name: payload.name,
      avatarUrl: payload.avatarUrl,
    };
  }

  private async createPublicSession(user: PublicUserEntity) {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: 'public',
      businessId: null,
      type: 'public',
      name: user.name,
      avatarUrl: user.avatarUrl,
    };

    return {
      accessToken: await this.jwtService.signAsync(jwtPayload),
      tokenType: 'Bearer',
      expiresIn: this.configService.getOrThrow<string>('jwt.expiresIn'),
      user: {
        id: user.id,
        email: user.email,
        role: 'public' as const,
        businessId: null,
        type: 'public' as const,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private async ensureDefaultAdmin() {
    const ownerCount = await this.usersRepository.count({
      where: { role: 'owner' },
    });

    if (ownerCount > 0) {
      return;
    }

    const email = this.configService
      .getOrThrow<string>('admin.email')
      .toLowerCase();
    const password = this.configService.getOrThrow<string>('admin.password');
    const passwordHash = await bcrypt.hash(password, 12);

    await this.usersRepository.save(
      this.usersRepository.create({
        email,
        passwordHash,
        role: 'owner',
        businessId: null,
      }),
    );
  }
}
