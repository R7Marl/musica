import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateQueueDto } from './dto/create-queue.dto';

@UseGuards(JwtAuthGuard, OwnerGuard)
@Controller('owner/businesses')
export class OwnerBusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  listBusinesses() {
    return this.businessService.listBusinesses();
  }

  @Post()
  createBusiness(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.createBusiness(createBusinessDto);
  }

  @Post([':businessId/playlists', ':businessId/queues'])
  createQueue(
    @Param('businessId') businessId: string,
    @Body() createQueueDto: CreateQueueDto,
  ) {
    return this.businessService.createQueueForBusiness(
      businessId,
      createQueueDto,
    );
  }
}
