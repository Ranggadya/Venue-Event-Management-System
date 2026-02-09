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
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('event')
@UseGuards(AuthGuard)
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(private readonly eventService: EventService) {}

  /**
   * POST /events - Create new event
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Body() createEventDto: CreateEventDto) {
    this.logger.log(`[POST / events] Creating event: ${createEventDto.name}`);

    const event = await this.eventService.createEvent(createEventDto);

    return {
      message: 'Event created Successfully',
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /events - Get all events with filters
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllEvent(@Query() queryDto: QueryEventDto) {
    this.logger.log(
      `[GET /events] Query: ${JSON.stringify({
        page: queryDto.page,
        limit: queryDto.limit,
        search: queryDto.search,
        venueId: queryDto.venueId,
      })}`,
    );

    const result = await this.eventService.getAllEvents(queryDto);

    return {
      message: 'Events retrived successfully',
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /events/statistics - Get event statistics
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getEventStatistics() {
    this.logger.log('[GET /events/statistics] Fetching statistics');

    const statistics = await this.eventService.getEventStatistics();

    return {
      message: 'Statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /events/venue/:venueId - Get all events for a specific venue
   */
  @Get('venue/:venueId')
  @HttpCode(HttpStatus.OK)
  async getEventsByVenueId(@Param('venueId') venueId: string) {
    this.logger.log(`[GET /events/venue/${venueId}] Fetching events for venue`);

    const result = await this.eventService.getEventsByVenueId(venueId);

    return {
      message: 'Events retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /events/:id - Get event by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getEventById(@Param('id') id: string) {
    this.logger.log(`[GET /events/${id}] Fetching event details`);

    const event = await this.eventService.getEventById(id);

    return {
      message: 'Event retrieved successfully',
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /events/:id - Update event
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    this.logger.log(`[PATCH /events/${id}] Updating event`);

    const event = await this.eventService.updateEvent(id, updateEventDto);

    return {
      message: 'Event updated successfully',
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /events/:id - Delete event
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteEvent(@Param('id') id: string) {
    this.logger.log(`[DELETE /events/${id}] Attempting to delete event`);

    const result = await this.eventService.deleteEvent(id);

    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
