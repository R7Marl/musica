import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserEntity } from '../auth/entities/user.entity';
import { ClientGuard } from '../auth/guards/client.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { BusinessService } from './business.service';
import { ClientQueueController } from './client-queue.controller';
import { BusinessEntity } from './entities/business.entity';
import { MusicQueueEntity } from './entities/music-queue.entity';
import { OwnerBusinessController } from './owner-business.controller';
import { PublicBusinessController } from './public-business.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([BusinessEntity, MusicQueueEntity, UserEntity]),
  ],
  controllers: [
    OwnerBusinessController,
    ClientQueueController,
    PublicBusinessController,
  ],
  providers: [BusinessService, OwnerGuard, ClientGuard],
  exports: [BusinessService],
})
export class BusinessModule {}
