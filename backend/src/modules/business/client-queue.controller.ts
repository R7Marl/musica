import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientGuard } from '../auth/guards/client.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { BusinessService } from './business.service';
import { CreateQueueDto } from './dto/create-queue.dto';

@UseGuards(JwtAuthGuard, ClientGuard)
@Controller(['client/playlists', 'client/queues'])
export class ClientQueueController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  listQueues(@Req() request: AuthenticatedRequest) {
    return this.businessService.listQueuesForBusiness(
      request.user.businessId as string,
    );
  }

  @Post()
  createQueue(
    @Req() request: AuthenticatedRequest,
    @Body() createQueueDto: CreateQueueDto,
  ) {
    return this.businessService.createQueueForBusiness(
      request.user.businessId as string,
      createQueueDto,
    );
  }
}
