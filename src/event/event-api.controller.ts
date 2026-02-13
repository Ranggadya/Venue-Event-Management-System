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
  BadRequestException,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('api/events')
@UseGuards(AuthGuard)
export class EventApiController {
  private readonly logger = new Logger(EventApiController.name);

  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Body() createEventDto: CreateEventDto) {
    this.logger.log(
      `[POST /api/events] API: Creating event: ${createEventDto.name}`,
    );

    const event = await this.eventService.createEvent(createEventDto);

    return {
      success: true,
      message: 'Event created successfully',
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  // GET /api/events
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllEvents(@Query() queryDto: QueryEventDto) {
    this.logger.log(
      `[GET /api/events] API: Query params: ${JSON.stringify({
        page: queryDto.page,
        limit: queryDto.limit,
        search: queryDto.search,
        venueId: queryDto.venueId,
        status: queryDto.status,
      })}`,
    );

    const result = await this.eventService.getAllEvents(queryDto);

    return {
      success: true,
      message: 'Events retrieved successfullt',
      ...result,
      timeStamp: new Date().toISOString(),
    };
  }

  // GET /api/events/statistics
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getEventStatistics() {
    this.logger.log('[GET /api/events/statistics] API: Fetching statistics');

    const statistics = await this.eventService.getEventStatistics();

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  // GET /api/events/financial/statistics
  @Get('financial/statistics')
  @HttpCode(HttpStatus.OK)
  async getFinancialStatistics() {
    this.logger.log(
      '[GET /api/events/financial/statistics] API: Fetching financial statistics',
    );

    const statistics = await this.eventService.getFinancialStatistics();

    return {
      success: true,
      message: 'Financial statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  // GET /api/events/financial/revenue

  @Get('financial/revenue')
  @HttpCode(HttpStatus.OK)
  async getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }

    this.logger.log(
      `[GET /api/events/financial/revenue] API: Date range: ${startDate} to ${endDate}`,
    );

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Use ISO 8601 format (e.g., 2025-01-01T00:00:00Z)',
      );
    }

    const revenue = await this.eventService.getRevenueByDateRange(start, end);

    return {
      success: true,
      message: 'Revenue data retrieved successfully',
      data: revenue,
      timestamp: new Date().toISOString(),
    };
  }
  // GET /api/events/venue/:venueId
  @Get('venue/:venueId')
  @HttpCode(HttpStatus.OK)
  async getEventsByVenueId(@Param('venueId') venueId: string) {
    this.logger.log(
      `[GET /api/events/venue/${venueId}] API: Fetching events for venue`,
    );

    const result = await this.eventService.getEventsByVenueId(venueId);

    return {
      success: true,
      message: 'Events retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // GET /api/events/:id
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getEventById(@Param('id') id: string) {
    this.logger.log(`[GET /api/events/${id}] API: Fetching event details`);

    const event = await this.eventService.getEventById(id);

    return {
      success: true,
      message: 'Event retrieved successfully',
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  // PATCH /api/events/:id
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    this.logger.log(
      `[PATCH /api/events/${id}] API: Updating event with data: ${JSON.stringify(updateEventDto)}`,
    );

    const event = await this.eventService.updateEvent(id, updateEventDto);

    return {
      success: true,
      message: 'Event updated successfully',
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  // DELETE /api/events/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteEvent(@Param('id') id: string) {
    this.logger.log(
      `[DELETE /api/events/${id}] API: Attempting to delete event`,
    );

    const result = await this.eventService.deleteEvent(id);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
