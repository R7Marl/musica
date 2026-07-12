import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PublicUserEntity } from '../auth/entities/public-user.entity';
import { PublicUserGuard } from '../auth/guards/public-user.guard';
import { BusinessModule } from '../business/business.module';
import { ColaAdminController } from './cola-admin.controller';
import { ColaController } from './cola.controller';
import { PlaybackEntity } from './entities/playback.entity';
import { QueueSkipVoteEntity } from './entities/queue-skip-vote.entity';
import { QueueSongEntity } from './entities/queue-song.entity';
import { SongRequestEntity } from './entities/song-request.entity';
import { ColaRepository } from './repositories/cola.repository';
import { ColaService } from './cola.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlaybackEntity,
      QueueSongEntity,
      QueueSkipVoteEntity,
      SongRequestEntity,
      PublicUserEntity,
    ]),
    AuthModule,
    BusinessModule,
  ],
  controllers: [ColaController, ColaAdminController],
  providers: [ColaService, ColaRepository, PublicUserGuard],
})
export class ColaModule {}
