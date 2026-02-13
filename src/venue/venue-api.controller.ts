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

@Controller('api/venues')
@UseGuards(AuthGuard)
export class VenueApiController {
  private readonly logger = new Logger(VenueApiController.name);

  constructor(private readonly venueService: VenueService) {}

  /**
   * POST /api/venues
   * Create new venue (JSON API)
   * @returns JSON response with created venue data
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createVenue(@Body() createVenueDto: CreateVenueDto) {
    this.logger.log(
      `[POST /api/venues] API: Creating venue: ${createVenueDto.name}`,
    );

    const venue = await this.venueService.createVenue(createVenueDto);

    return {
      success: true,
      message: 'Venue created successfully',
      data: venue,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/venues
   * Get all venues with filters and pagination (JSON API)
   * @returns JSON response with paginated venue list
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllVenues(@Query() queryDto: QueryVenueDto) {
    this.logger.log(
      `[GET /api/venues] API: Query params: ${JSON.stringify({
        page: queryDto.page,
        limit: queryDto.limit,
        search: queryDto.search,
        city: queryDto.city,
        status: queryDto.status,
      })}`,
    );

    const result = await this.venueService.getAllVenues(queryDto);

    return {
      success: true,
      message: 'Venues retrieved successfully',
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/venues/statistics
   * Get venue statistics (JSON API)
   * @returns JSON response with statistics data
   * Note: MUST be before /:id route
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getVenueStatistics() {
    this.logger.log('[GET /api/venues/statistics] API: Fetching statistics');

    const statistics = await this.venueService.getVenueStatistics();

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/venues/:id
   * Get venue by ID with related events (JSON API)
   * @returns JSON response with venue details
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getVenueById(@Param('id') id: string) {
    this.logger.log(`[GET /api/venues/${id}] API: Fetching venue details`);

    const venue = await this.venueService.getVenueById(id);

    return {
      success: true,
      message: 'Venue retrieved successfully',
      data: venue,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /api/venues/:id
   * Update venue by ID (JSON API)
   * @returns JSON response with updated venue data
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateVenue(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    this.logger.log(
      `[PATCH /api/venues/${id}] API: Updating venue with data: ${JSON.stringify(updateVenueDto)}`,
    );

    const venue = await this.venueService.updateVenue(id, updateVenueDto);

    return {
      success: true,
      message: 'Venue updated successfully',
      data: venue,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/venues/:id
   * Delete venue by ID (JSON API)
   * @returns JSON response with success message
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteVenue(@Param('id') id: string) {
    this.logger.log(
      `[DELETE /api/venues/${id}] API: Attempting to delete venue`,
    );

    const result = await this.venueService.deleteVenue(id);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
