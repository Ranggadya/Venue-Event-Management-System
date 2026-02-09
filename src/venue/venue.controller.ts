import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('venues')
@UseGuards(AuthGuard)
export class VenueController {
  private readonly logger = new Logger(VenueController.name);

  constructor(private readonly venueService: VenueService) {}

  /**
   * POST /venues - Create new venue
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createVenue(@Body() createVenueDto: CreateVenueDto) {
    this.logger.log(`[POST /venues] Creating venue: ${createVenueDto.name}`);

    const venue = await this.venueService.createVenue(createVenueDto);

    return {
      message: 'Venue created successfully',
      data: venue,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /venues - Get all venues with filters
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllVenues(@Query() queryDto: QueryVenueDto) {
    this.logger.log(
      `[GET /venues] Query: ${JSON.stringify({
        page: queryDto.page,
        limit: queryDto.limit,
        search: queryDto.search,
      })}`,
    );

    const result = await this.venueService.getAllVenues(queryDto);

    return {
      message: 'Venues retrieved successfully',
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /venues/statistics - Get venue statistics
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getVenueStatistics() {
    this.logger.log('[GET /venues/statistics] Fetching statistics');

    const statistics = await this.venueService.getVenueStatistics();

    return {
      message: 'Statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /venues/:id - Get venue by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getVenueById(@Param('id') id: string) {
    this.logger.log(`[GET /venues/${id}] Fetching venue details`);

    const venue = await this.venueService.getVenueById(id);

    return {
      message: 'Venue retrieved successfully',
      data: venue,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /venues/:id - Update venue
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateVenue(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    this.logger.log(`[PATCH /venues/${id}] Updating venue`);

    const venue = await this.venueService.updateVenue(id, updateVenueDto);

    return {
      message: 'Venue updated successfully',
      data: venue,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /venues/:id - Delete venue
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteVenue(@Param('id') id: string) {
    this.logger.log(`[DELETE /venues/${id}] Attempting to delete venue`);

    const result = await this.venueService.deleteVenue(id);

    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
