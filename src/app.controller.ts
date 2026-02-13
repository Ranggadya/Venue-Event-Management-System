/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Render,
  UseGuards,
  Session,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from './auth/guards/auth.guard';
import { VenueService } from './venue/venue.service';
import { EventService } from './event/event.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly venueService: VenueService,
    private readonly eventService: EventService,
  ) { }

  @Get()
  async root(@Session() session: Record<string, any>, @Res() res: Response) {
    // If logged in, redirect to dashboard
    if (session?.adminId) {
      this.logger.log(`Redirecting authenticated user to dashboard`);
      return res.redirect('/dashboard');
    }

    // Otherwise, redirect to login
    this.logger.log(`Redirecting unauthenticated user to login`);
    return res.redirect('/auth/login');
  }

  // GET /dashboard
  @Get('dashboard')
  @UseGuards(AuthGuard)
  @Render('dashboard')
  async getDashboard(@Session() session: Record<string, any>) {
    this.logger.log(`Rendering dashboard for admin: ${session.adminId}`);

    try {
      const [venueStats, eventStats, recentEvents, recentVenues] =
        await Promise.all([
          this.venueService.getVenueStatistics(),
          this.eventService.getEventStatistics(),
          this.eventService.getAllEvents({
            limit: 5,
            page: 1,
            sortBy: 'startDatetime',
            sortOrder: 'asc',
            status: 'UPCOMING' as any,
          }),
          this.venueService.getAllVenues({
            limit: 5,
            page: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }),
        ]);

      return {
        title: 'Dashboard',
        adminId: session.adminId,
        venueStats,
        eventStats,
        upcomingEvents: recentEvents.data || [],
        recentVenues: recentVenues.data || [],
        error: null,
        success: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load dashboard statistics: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Dashboard',
        adminId: session.adminId,
        venueStats: null,
        eventStats: null,
        upcomingEvents: [],
        recentVenues: [],
        error: 'Failed to load statistics. Please refresh the page.',
        success: null,
      };
    }
  }
}
