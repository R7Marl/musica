import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';

@Controller('public/businesses')
export class PublicBusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  createBusiness(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.createBusiness(createBusinessDto);
  }

  @Get(':slug')
  getBusiness(@Param('slug') slug: string) {
    return this.businessService.getPublicBusinessBySlug(slug);
  }
}
