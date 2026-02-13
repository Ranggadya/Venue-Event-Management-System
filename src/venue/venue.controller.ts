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
  Req,
  Session,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('venues')
@UseGuards(AuthGuard)
export class VenueController {
  private readonly logger = new Logger(VenueController.name);

  constructor(
    private readonly venueService: VenueService,
    private readonly authService: AuthService,
  ) {}

  // GET /venues
  @Get()
  @Render('venues/list')
  async listVenues(
    @Query() queryDto: QueryVenueDto,
    @Session() session: Record<string, any>,
    @Req() req: Request,
    @Query('success') successMessage?: string,
  ) {
    this.logger.log(
      `[GET /venues] Rendering venue list page with filters: ${JSON.stringify(queryDto)}`,
    );

    // Get current user
    const user = await this.authService.findAdminById(session.adminId);

    let success: string | null = null;
    if (successMessage === 'deleted') {
      success = 'Venue deleted successfully!';
    }

    try {
      const result = await this.venueService.getAllVenues(queryDto);

      const success = (req.session as any).flashSuccess;
      const error = (req.session as any).flashError;

      // Clear flash messages setelah diambil
      delete (req.session as any).flashSuccess;
      delete (req.session as any).flashError;

      return {
        title: 'Manage Venues',
        user,
        venues: result.data,
        meta: result.meta,
        query: queryDto,
        success,
        error,
      };
    } catch (error) {
      this.logger.error(`Failed to load venues: ${error.message}`, error.stack);

      return {
        title: 'Manage Venues',
        user,
        venues: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        query: queryDto,
        error: 'Failed to load venues. Please try again.',
        success: null,
      };
    }
  }

  // GET /venues/create
  @Get('create')
  @Render('venues/form')
  async createVenueForm(@Session() session: Record<string, any>) {
    this.logger.log('[GET /venues/create] Rendering create venue form');

    // Get current user
    const user = await this.authService.findAdminById(session.adminId);

    return {
      title: 'Create New Venue',
      user,
      venue: null,
      action: '/venues',
      method: 'POST',
      error: null,
      success: null,
    };
  }

  // POST /venues
  @Post()
  async createVenue(
    @Body() createVenueDto: CreateVenueDto,
    @Session() session: Record<string, any>,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    this.logger.log(`[POST /venues] Creating venue: ${createVenueDto.name}`);

    try {
      const venue = await this.venueService.createVenue(createVenueDto);

      this.logger.log(
        `Venue created successfully: ${venue.name} (ID: ${venue.id})`,
      );

      (req.session as any).flashSuccess =
        `Venues "${venue.name}" created successfully`;

      return res.redirect(`/venues/${venue.id}?success=created`);
    } catch (error) {
      this.logger.error(
        `Failed to create venue: ${error.message}`,
        error.stack,
      );

      // Get user for re-render
      const user = await this.authService.findAdminById(session.adminId);

      return res.status(HttpStatus.BAD_REQUEST).render('venues/form', {
        title: 'Create New Venue',
        user,
        venue: createVenueDto,
        action: '/venues',
        method: 'POST',
        error: error.message || 'Failed to create venue. Please try again.',
        success: null,
      });
    }
  }

  // GET /venues/:id
  @Get(':id')
  @Render('venues/details')
  async getVenueDetail(
    @Param('id') id: string,
    @Session() session: Record<string, any>,
    @Query('success') successMessage?: string,
    @Query('error') errorMessage?: string,
  ) {
    this.logger.log(`[GET /venues/${id}] Rendering venue detail page`);

    // Get current user
    const user = await this.authService.findAdminById(session.adminId);

    try {
      const venue = await this.venueService.getVenueById(id);

      // Map success message
      let success: string | null = null;
      if (successMessage === 'created') {
        success = 'Venue created successfully!';
      } else if (successMessage === 'updated') {
        success = 'Venue updated successfully!';
      }

      let error: string | null = null;
      if (errorMessage) {
        error = decodeURIComponent(errorMessage);
      }

      return {
        title: `Venue: ${venue.name}`,
        user,
        venue,
        error,
        success,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load venue ${id}: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Venue Not Found',
        user,
        venue: null,
        error: error.message || 'Venue not found.',
        success: null,
      };
    }
  }

  // GET /venues/:id/edit
  @Get(':id/edit')
  @Render('venues/form')
  async editVenueForm(
    @Param('id') id: string,
    @Session() session: Record<string, any>,
  ) {
    this.logger.log(`[GET /venues/${id}/edit] Rendering edit venue form`);

    // Get current user
    const user = await this.authService.findAdminById(session.adminId);

    try {
      const venue = await this.venueService.getVenueById(id);

      return {
        title: `Edit Venue: ${venue.name}`,
        user,
        venue,
        action: `/venues/${id}`,
        method: 'POST',
        error: null,
        success: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to load venue for editing: ${error.message}`,
        error.stack,
      );

      return {
        title: 'Venue Not Found',
        user,
        venue: null,
        action: '/venues',
        method: 'POST',
        error: error.message || 'Venue not found.',
        success: null,
      };
    }
  }

  // POST /venues/:id
  @Post(':id')
  async updateVenue(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
    @Res() res: Response,
    @Session() session: Record<string, any>,
  ) {
    this.logger.log(
      `[POST /venues/${id}] Updating venue with data: ${JSON.stringify(updateVenueDto)}`,
    );

    try {
      const venue = await this.venueService.updateVenue(id, updateVenueDto);

      this.logger.log(
        `Venue updated successfully: ${venue.name} (ID: ${venue.id})`,
      );

      return res.redirect(`/venues/${venue.id}?success=updated`);
    } catch (error) {
      this.logger.error(
        `Failed to update venue ${id}: ${error.message}`,
        error.stack,
      );

      const user = await this.authService.findAdminById(session.adminId);

      return res.status(HttpStatus.BAD_REQUEST).render('venues/form', {
        title: 'Edit Venue',
        user,
        venue: { id, ...updateVenueDto },
        action: `/venues/${id}`,
        method: 'POST',
        error: error.message || 'Failed to update venue. Please try again.',
        success: null,
      });
    }
  }

  // POST /venues/:id/delete
  @Post(':id/delete')
  async deleteVenue(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`[POST /venues/${id}/delete] Attempting to delete venue`);

    try {
      const result = await this.venueService.deleteVenue(id);

      this.logger.log(`Venue deleted successfully: ${result.message}`);

      return res.redirect('/venues?success=deleted');
    } catch (error) {
      this.logger.error(
        `Failed to delete venue ${id}: ${error.message}`,
        error.stack,
      );

      return res.redirect(
        `/venues/${id}?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  // GET /venues/statistics/overview
  @Get('statistics/overview')
  @Render('venues/statistics')
  async getStatistics(@Session() session: Record<string, any>) {
    this.logger.log(
      '[GET /venues/statistics/overview] Rendering statistics page',
    );

    // Get current user
    const user = await this.authService.findAdminById(session.adminId);

    try {
      const statistics = await this.venueService.getVenueStatistics();

      return {
        title: 'Venue Statistics',
        user,
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
        title: 'Venue Statistics',
        user,
        statistics: null,
        error: 'Failed to load statistics. Please try again.',
        success: null,
      };
    }
  }
}
