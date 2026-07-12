import { Controller, Get, Query } from '@nestjs/common';
import { SearchYoutubeDto } from './dto/search-youtube.dto';
import { YoutubeService } from './youtube.service';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('search')
  search(@Query() query: SearchYoutubeDto) {
    return this.youtubeService.search(query.q, query.pageToken);
  }
}
