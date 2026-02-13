/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Render,
  Res,
  Logger,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { VenueService } from '../venue/venue.service';

@Controller('events')
@UseGuards(AuthGuard)
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(
    private readonly eventService: EventService,
    private readonly venueService: VenueService,
  ) {}

  /**
   * GET /events
   * Display list of all events with search and filters
   * Renders: views/events/list.ejs
   */
  @Get()
  @Render('events/list')
  async listEvents(@Query() queryDto: QueryEventDto) {
    this.logger.log(
      `[GET /events] Rendering event list page with filters: ${JSON.stringify(queryDto)}`,
    );

    try {
      const result = await this.eventService.getAllEvents(queryDto);

      return {
        title: 'Manage Events',
        events: result.data,
        meta: result.meta,
        query: queryDto,
        error: null,
        success: null,
      };
    } catch (error) {
      this.logger.error(`Failed to load events: ${error.message}`, error.stack);

      return {
        title: 'Manage Events',
        events: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        query: queryDto,
        error: 'Failed to load events. Please try again.',
        success: null,
      };
    }
  }

  /**
   * GET /events/create
   * Display create event form with venue dropdown
   * Renders: views/events/form.ejs
   */
  @Get('create')
  @Render('events/form')
  async createEventForm(@Query('venueId') venueId?: string) {
    this.logger.log(
      `[GET /events/create] Rendering create event form${venueId ? ` for venue: ${venueId}` : ''}`,
    );

    try {
      // Get all available venues for dropdown
      const venuesResult = await this.venueService.getAllVenues({
        page: 1,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      return {
        title: 'Create New Event',
        event: null, // null indicates create mode
        venues: venuesResult.data,
        selectedVenueId: venueId || null, // Pre-select venue if provided
        action: '/events',
        method: 'POST',
        error: null,
        success: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load venues for form: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Create New Event',
        event: null,
        venues: [],
        selectedVenueId: venueId || null,
        action: '/events',
        method: 'POST',
        error: 'Failed to load venues. Please try again.',
        success: null,
      };
    }
  }

  @Get('create')
  @Render('events/form')
  async getCreateEventForm(@Query('venueId') selectedVenueId?: string) {
    this.logger.log('[GET /events/create] Rendering create event form');

    try {
      // Get all ACTIVE venues (will check availability dynamically on form)
      const venues = await this.venueService.getAllVenues({
        page: 1,
        limit: 1000,
        status: 'ACTIVE',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      return {
        title: 'Create New Event',
        breadcrumb: [
          { name: 'Events', url: '/events' },
          { name: 'Create', url: '/events/create' },
        ],
        event: null,
        action: '/events',
        venues: venues.data,
        selectedVenueId: selectedVenueId || null,
        error: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load create form: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Create New Event',
        event: null,
        action: '/events',
        venues: [],
        selectedVenueId: null,
        error: 'Failed to load form. Please try again.',
      };
    }
  }

  /**
   * 🆕 GET /events/check-availability
   * API endpoint to check venue availability on specific date (AJAX)
   */
  @Get('check-availability')
  async checkVenueAvailability(
    @Query('venueId', ParseUUIDPipe) venueId: string,
    @Query('startDatetime') startDatetime: string,
    @Query('endDatetime') endDatetime: string,
    @Query('excludeEventId') excludeEventId?: string,
  ) {
    this.logger.log(
      `Checking availability for venue ${venueId} from ${startDatetime} to ${endDatetime}`,
    );

    try {
      const start = new Date(startDatetime);
      const end = new Date(endDatetime);

      await this.eventService.checkVenueAvailability(
        venueId,
        start,
        end,
        excludeEventId,
      );

      return {
        available: true,
        message: 'Venue is available on selected date',
      };
    } catch (error) {
      return {
        available: false,
        message: error.message,
      };
    }
  }
  // POST /events
  @Post()
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Res() res: Response,
  ) {
    this.logger.log(`[POST /events] Creating event: ${createEventDto.name}`);

    // Map split date/time fields to ISO strings
    if (createEventDto.startDate && createEventDto.startTime) {
      createEventDto.startDatetime = `${createEventDto.startDate}T${createEventDto.startTime}:00`;
    }
    if (createEventDto.endDate && createEventDto.endTime) {
      createEventDto.endDatetime = `${createEventDto.endDate}T${createEventDto.endTime}:00`;
    }

    try {
      const event = await this.eventService.createEvent(createEventDto);

      this.logger.log(
        `Event created successfully: ${event.name} (ID: ${event.id})`,
      );

      return res.redirect(`/events/${event.id}?success=created`);
    } catch (error) {
      this.logger.error(
        `Failed to create event: ${error.message}`,
        error.stack,
      );

      try {
        const venuesResult = await this.venueService.getAllVenues({
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        return res.status(HttpStatus.BAD_REQUEST).render('events/form', {
          title: 'Create New Event',
          event: createEventDto, // Preserve user input including split fields
          venues: venuesResult.data,
          selectedVenueId: createEventDto.venueId,
          action: '/events',
          method: 'POST',
          error: error.message || 'Failed to create event. Please try again.',
          success: null,
        });
      } catch (venueError) {
        return res.status(HttpStatus.BAD_REQUEST).render('events/form', {
          title: 'Create New Event',
          event: createEventDto,
          venues: [],
          selectedVenueId: createEventDto.venueId,
          action: '/events',
          method: 'POST',
          error: error.message || 'Failed to create event. Please try again.',
          success: null,
        });
      }
    }
  }

  /**
   * GET /events/statistics/overview
   * Display event statistics page
   * Renders: views/events/statistics.ejs
   * Note: Route MUST be before /:id to avoid conflict
   */
  @Get('statistics/overview')
  @Render('events/statistics')
  async getStatistics() {
    this.logger.log(
      '[GET /events/statistics/overview] Rendering statistics page',
    );

    try {
      const statistics = await this.eventService.getEventStatistics();

      return {
        title: 'Event Statistics',
        statistics,
        error: null,
        success: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load statistics: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Event Statistics',
        statistics: null,
        error: 'Failed to load statistics. Please try again.',
        success: null,
      };
    }
  }

  /**
   * GET /events/financial/overview
   * Display financial statistics page
   * Renders: views/events/financial.ejs
   * Note: Route MUST be before /:id to avoid conflict
   */
  @Get('financial/overview')
  @Render('events/financial')
  async getFinancialStatistics() {
    this.logger.log(
      '[GET /events/financial/overview] Rendering financial statistics page',
    );

    try {
      const statistics = await this.eventService.getFinancialStatistics();

      return {
        title: 'Financial Statistics',
        statistics,
        error: null,
        success: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load financial statistics: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Financial Statistics',
        statistics: null,
        error: 'Failed to load financial statistics. Please try again.',
        success: null,
      };
    }
  }

  /**
   * GET /events/:id
   * Display event details with venue information
   * Renders: views/events/detail.ejs
   */
  @Get(':id')
  @Render('events/details')
  async getEventDetail(
    @Param('id') id: string,
    @Query('success') successMessage?: string,
    @Query('error') errorMessage?: string,
  ) {
    this.logger.log(`[GET /events/${id}] Rendering event detail page`);

    try {
      const event = await this.eventService.getEventById(id);

      // Map success query param to user-friendly message
      let success: string | null = null;
      if (successMessage === 'created') {
        success = 'Event created successfully!';
      } else if (successMessage === 'updated') {
        success = 'Event updated successfully!';
      }

      // Decode error message if present
      const error = errorMessage ? decodeURIComponent(errorMessage) : null;

      return {
        title: `Event: ${event.name}`,
        event,
        error,
        success,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load event ${id}: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Event Not Found',
        event: null,
        error: error.message || 'Event not found.',
        success: null,
      };
    }
  }

  /**
   * GET /events/:id/edit
   * Display edit event form with venue dropdown
   * Renders: views/events/form.ejs
   */
  @Get(':id/edit')
  @Render('events/form')
  async editEventForm(@Param('id') id: string) {
    this.logger.log(`[GET /events/${id}/edit] Rendering edit event form`);

    try {
      // Load event and venues in parallel
      const [event, venuesResult] = await Promise.all([
        this.eventService.getEventById(id),
        this.venueService.getAllVenues({
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      ]);

      // Pre-calculate date and time strings for the form
      const eventData = {
        ...event,
        startDate: event.startDatetime
          ? new Date(event.startDatetime).toISOString().split('T')[0]
          : '',
        startTime: event.startDatetime
          ? new Date(event.startDatetime).toTimeString().substring(0, 5)
          : '',
        endDate: event.endDatetime
          ? new Date(event.endDatetime).toISOString().split('T')[0]
          : '',
        endTime: event.endDatetime
          ? new Date(event.endDatetime).toTimeString().substring(0, 5)
          : '',
      };

      return {
        title: `Edit Event: ${event.name}`,
        event: eventData,
        venues: venuesResult.data,
        selectedVenueId: event.venueId,
        action: `/events/${id}`,
        method: 'POST',
        error: null,
        success: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load event for editing: ${error.message}`,
        error.stack,
      );

      // If event not found, try to at least load venues
      try {
        const venuesResult = await this.venueService.getAllVenues({
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        return {
          title: 'Event Not Found',
          event: null,
          venues: venuesResult.data,
          selectedVenueId: null,
          action: '/events',
          method: 'POST',
          error: error.message || 'Event not found.',
          success: null,
        };
      } catch (venueError) {
        return {
          title: 'Event Not Found',
          event: null,
          venues: [],
          selectedVenueId: null,
          action: '/events',
          method: 'POST',
          error: error.message || 'Event not found.',
          success: null,
        };
      }
    }
  }

  /**
   * POST /events/:id
   * Handle update event form submission
   * Redirects to: /events/:id (detail) or re-renders form with errors
   */
  @Post(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[POST /events/${id}] Updating event with data: ${JSON.stringify(updateEventDto)}`,
    );

    try {
      const event = await this.eventService.updateEvent(id, updateEventDto);

      this.logger.log(
        `Event updated successfully: ${event.name} (ID: ${event.id})`,
      );

      // Redirect to detail page with success message
      return res.redirect(`/events/${event.id}?success=updated`);
    } catch (error) {
      this.logger.error(
        `Failed to update event ${id}: ${error.message}`,
        error.stack,
      );

      // Load venues again for re-rendering form
      try {
        const venuesResult = await this.venueService.getAllVenues({
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        // Re-render form with error message and preserve input data
        return res.status(HttpStatus.BAD_REQUEST).render('events/form', {
          title: 'Edit Event',
          event: { id, ...updateEventDto }, // Preserve user input with ID
          venues: venuesResult.data,
          selectedVenueId: updateEventDto.venueId,
          action: `/events/${id}`,
          method: 'POST',
          error: error.message || 'Failed to update event. Please try again.',
        });
      } catch (venueError) {
        return res.status(HttpStatus.BAD_REQUEST).render('events/form', {
          title: 'Edit Event',
          event: { id, ...updateEventDto },
          venues: [],
          selectedVenueId: updateEventDto.venueId,
          action: `/events/${id}`,
          method: 'POST',
          error: error.message || 'Failed to update event. Please try again.',
        });
      }
    }
  }
  /**
   * POST /events/:id/delete
   * Handle delete event request
   * Redirects to: /events (list) with success/error message
   */
  @Post(':id/delete')
  async deleteEvent(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`[POST /events/${id}/delete] Attempting to delete event`);

    try {
      const result = await this.eventService.deleteEvent(id);

      this.logger.log(`Event deleted successfully: ${result.message}`);

      // Redirect to list with success message
      return res.redirect('/events?success=deleted');
    } catch (error) {
      this.logger.error(
        `Failed to delete event ${id}: ${error.message}`,
        error.stack,
      );

      // Redirect back to detail page with error message
      return res.redirect(
        `/events/${id}?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  /**
   * POST /events/:id/toggle-payment
   * Toggle payment status (mark as paid/unpaid)
   * Redirects to: /events/:id (detail)
   */
  @Post(':id/toggle-payment')
  async togglePaymentStatus(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(
      `[POST /events/${id}/toggle-payment] Toggling payment status`,
    );

    try {
      // Get current event
      const event = await this.eventService.getEventById(id);

      // Toggle payment status
      await this.eventService.updateEvent(id, {
        isPaid: !event.isPaid,
      });

      this.logger.log(
        `Payment status toggled: ${event.name} (isPaid: ${!event.isPaid})`,
      );

      // Redirect back to detail page
      return res.redirect(
        `/events/${id}?success=${event.isPaid ? 'unpaid' : 'paid'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to toggle payment status: ${error.message}`,
        error.stack,
      );

      return res.redirect(
        `/events/${id}?error=${encodeURIComponent(error.message)}`,
      );
    }
  }
}
