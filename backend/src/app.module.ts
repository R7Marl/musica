import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import { createTypeOrmOptions } from './config/typeorm.config';
import { BusinessModule } from './modules/business/business.module';
import { AuthModule } from './modules/auth/auth.module';
import { ColaModule } from './modules/cola/cola.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),
    AuthModule,
    BusinessModule,
    ColaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
