import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PublicUserGuard } from '../auth/guards/public-user.guard';
import { BusinessService } from '../business/business.service';
import { AddSongDto } from './dto/add-song.dto';
import { ColaService } from './cola.service';

@Controller(['playlists', 'colas'])
export class ColaController {
  constructor(
    private readonly colaService: ColaService,
    private readonly businessService: BusinessService,
  ) {}

  @Get(':queueIdOrSlug')
  async getQueue(@Param('queueIdOrSlug') queueIdOrSlug: string) {
    const queue = await this.businessService.findPublicQueue(queueIdOrSlug);

    return this.colaService.getPublicQueue(queue.id);
  }

  @UseGuards(JwtAuthGuard, PublicUserGuard)
  @Get(':queueIdOrSlug/mis-solicitudes')
  async getMyRequests(
    @Param('queueIdOrSlug') queueIdOrSlug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const queue = await this.businessService.findPublicQueue(queueIdOrSlug);

    return this.colaService.getUserRequestHistory(queue.id, request.user.id);
  }

  @UseGuards(JwtAuthGuard, PublicUserGuard)
  @Post(':queueIdOrSlug/canciones')
  async addSong(
    @Param('queueIdOrSlug') queueIdOrSlug: string,
    @Body() addSongDto: AddSongDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const queue = await this.businessService.findPublicQueue(queueIdOrSlug);

    return this.colaService.addSong(
      queue.id,
      addSongDto.youtubeUrl,
      request.user.id,
    );
  }

  @UseGuards(JwtAuthGuard, PublicUserGuard)
  @Post(':queueIdOrSlug/skip-votes')
  async voteToSkip(
    @Param('queueIdOrSlug') queueIdOrSlug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const queue = await this.businessService.findPublicQueue(queueIdOrSlug);

    return this.colaService.voteToSkip(queue.id, request.user.id);
  }

  @UseGuards(JwtAuthGuard, PublicUserGuard)
  @Delete(':queueIdOrSlug/canciones/:songId')
  async removeOwnSong(
    @Param('queueIdOrSlug') queueIdOrSlug: string,
    @Param('songId') songId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const queue = await this.businessService.findPublicQueue(queueIdOrSlug);

    return this.colaService.removeOwnSong(queue.id, songId, request.user.id);
  }
}
