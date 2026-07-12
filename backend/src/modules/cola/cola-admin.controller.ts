import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { BusinessService } from '../business/business.service';
import { ColaService } from './cola.service';
import { UpdatePlaybackDto } from './dto/update-playback.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller(['admin/playlists/:queueId', 'admin/colas/:queueId'])
export class ColaAdminController {
  constructor(
    private readonly colaService: ColaService,
    private readonly businessService: BusinessService,
  ) {}

  @Get()
  async getQueue(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
  ) {
    await this.businessService.ensureQueueAccess(request.user, queueId);
    return this.colaService.getAdminQueue(queueId);
  }

  @Post('siguiente')
  async playNext(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
  ) {
    await this.businessService.ensureQueueAccess(request.user, queueId);
    return this.colaService.playNext(queueId);
  }

  @Patch('reproduccion')
  async updatePlayback(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
    @Body() updatePlaybackDto: UpdatePlaybackDto,
  ) {
    await this.businessService.ensureQueueAccess(request.user, queueId);
    return this.colaService.updatePlayback(queueId, updatePlaybackDto.status);
  }

  @Patch('canciones/:id/prioridad')
  async updatePriority(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
    @Param('id') id: string,
    @Body() updatePriorityDto: UpdatePriorityDto,
  ) {
    await this.businessService.ensureQueueAccess(request.user, queueId);
    return this.colaService.updatePriority(
      queueId,
      id,
      Number(updatePriorityDto.manualPriority),
    );
  }

  @Delete('canciones/:id')
  async removeSong(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
    @Param('id') id: string,
  ) {
    await this.businessService.ensureQueueAccess(request.user, queueId);
    return this.colaService.removeSong(queueId, id);
  }

  @Post('reiniciar')
  async resetQueue(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
  ) {
    await this.businessService.ensureQueueAccess(request.user, queueId);
    return this.colaService.resetQueue(queueId);
  }
}
