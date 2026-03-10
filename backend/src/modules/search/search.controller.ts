import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchQueryDto,
  SearchResultDto,
  AutocompleteResultDto,
} from './dto/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search for merchants and products' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: SearchResultDto,
  })
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto> {
    return this.searchService.search(query);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results' })
  @ApiResponse({
    status: 200,
    description: 'Autocomplete suggestions',
    type: [AutocompleteResultDto],
  })
  async autocomplete(
    @Query('q') q: string,
    @Query('limit') limit?: number,
  ): Promise<AutocompleteResultDto[]> {
    return this.searchService.autocomplete(q, limit ? Number(limit) : 8);
  }
}
