import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const createTypeOrmOptions = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.getOrThrow<string>('database.host'),
  port: configService.getOrThrow<number>('database.port'),
  username: configService.getOrThrow<string>('database.username'),
  password: configService.getOrThrow<string>('database.password'),
  database: configService.getOrThrow<string>('database.database'),
  autoLoadEntities: true,
  synchronize: configService.getOrThrow<boolean>('database.synchronize'),
  dropSchema: configService.get<boolean>('database.dropSchema') ?? false,
  ssl: configService.get<boolean>('database.ssl')
    ? { rejectUnauthorized: false }
    : false,
});
