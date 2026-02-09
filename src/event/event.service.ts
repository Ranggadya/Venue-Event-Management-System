/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { Prisma, Event } from '@prisma/client';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  constructor(private readonly prisma: PrismaService) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    this.logger.log(`Creating new event: ${createEventDto.name}`);

    // Validate datetime range
    const startDate = new Date(createEventDto.startDatetime);
    const endDate = new Date(createEventDto.endDatetime);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'End datetime must be after start datetime',
      );
    }

    // Validate venue exists
    const venueExists = await this.prisma.venue.findUnique({
      where: { id: createEventDto.venueId },
    });

    if (!venueExists) {
      throw new BadRequestException(
        `Venue with ID "${createEventDto.venueId}" not found`,
      );
    }

    try {
      const event = await this.prisma.event.create({
        data: {
          name: createEventDto.name,
          description: createEventDto.description || null,
          startDatetime: startDate,
          endDatetime: endDate,
          status: createEventDto.status || EventStatus.UPCOMING, // ✅ Gunakan Enum
          venueId: createEventDto.venueId,
        },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
            },
          },
        },
      });

      this.logger.log(`Event created successfully: ${event.id}`);
      return event;
    } catch (error) {
      this.logger.error(
        `Failed to create event: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to create event. Please check your input.',
      );
    }
  }

  /**
   * Get all events with filtering, searching, sorting, and pagination
   * @param queryDto - Query parameters for filtering and pagination
   * @returns Paginated list of events
   */

  async getAllEvents(queryDto: QueryEventDto) {
    const {
      search,
      venueId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'startDatetime',
      sortOrder = 'asc',
    } = queryDto;

    this.logger.log(
      `Fetching events - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`,
    );

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.name = { contains: search };
    }

    if (venueId) {
      where.venueId = venueId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.AND = [];

      if (startDate) {
        where.AND.push({
          startDatetime: {
            gte: new Date(startDate),
          },
        });
      }

      if (endDate) {
        where.AND.push({
          endDatetime: {
            gte: new Date(endDate),
          },
        });
      }
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy: Prisma.EventOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      const [events, total] = await Promise.all([
        this.prisma.event.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                capacity: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.event.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Found ${total} events, returning ${events.length} items`,
      );

      return {
        data: events,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch events: ${error.message}`,
        error.message,
      );
      throw new BadRequestException(`Failed fetch data event`);
    }
  }

  /**
   * Get single event by ID with venue details
   * @param id - Event UUID
   * @returns Event with complete venue information
   * @throws NotFoundException if event not found
   * @throws BadRequestException if ID format is invalid
   */

  async getEventById(id: string): Promise<Event & { venue: any }> {
    this.logger.log(`Fetching event: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid event ID format');
    }

    try {
      const event = await this.prisma.event.findUnique({
        where: { id },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              city: true,
              capacity: true,
              pricePerHour: true,
              pricePerDay: true,
              currency: true,
              status: true,
            },
          },
        },
      });

      if (!event) {
        this.logger.warn(`Event not found: ${id}`);
        throw new NotFoundException(`Event with ID "${id}" not found`);
      }

      this.logger.log(`Event found: ${event.name} at ${event.venue.name}`);
      return event;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch event: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch event');
    }
  }
  /**
   * Update event by ID
   * @param id - Event UUID
   * @param updateEventDto - Update data
   * @returns Updated event with venue details
   * @throws NotFoundException if event not found
   * @throws BadRequestException if validation fails
   */
  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    this.logger.log(`Updating event: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid event ID format');
    }

    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new BadRequestException(`Event with ID "${id}" not found`);
    }

    // Validate datetime if both provided
    if (updateEventDto.startDatetime && updateEventDto.endDatetime) {
      const startDate = new Date(updateEventDto.startDatetime);
      const endDate = new Date(updateEventDto.endDatetime);

      if (endDate <= startDate) {
        throw new BadRequestException(
          'End datetime must be after start datetime',
        );
      }
    }

    // Validate datetime if only one is updated
    if (updateEventDto.startDatetime && !updateEventDto.endDatetime) {
      const startDate = new Date(updateEventDto.startDatetime);
      if (existingEvent.endDatetime <= startDate) {
        throw new BadRequestException(
          'New start datetime must be before existing end datetime',
        );
      }
    }

    if (updateEventDto.endDatetime && !updateEventDto.startDatetime) {
      const endDate = new Date(updateEventDto.endDatetime);
      if (endDate <= existingEvent.startDatetime) {
        throw new BadRequestException(
          'New end datetime must be after existing start datetime',
        );
      }
    }

    // Validate venue if changed
    if (
      updateEventDto.venueId &&
      updateEventDto.venueId !== existingEvent.venueId
    ) {
      const venueExists = await this.prisma.event.findUnique({
        where: { id: updateEventDto.venueId },
      });

      if (!venueExists) {
        throw new BadRequestException(
          `Venue with Id "${updateEventDto.venueId}" not Found`,
        );
      }
    }

    try {
      const updateData: Prisma.EventUpdateInput = {};

      if (updateEventDto.name !== undefined) {
        updateData.name = updateEventDto.name;
      }

      if (updateEventDto.description !== undefined) {
        updateData.description = updateEventDto.description;
      }

      if (updateEventDto.startDatetime !== undefined) {
        updateData.startDatetime = updateEventDto.startDatetime;
      }

      if (updateEventDto.endDatetime !== undefined) {
        updateData.endDatetime = updateEventDto.endDatetime;
      }

      if (updateEventDto.status !== undefined) {
        updateData.status = updateEventDto.status;
      }

      if (updateEventDto.venueId !== undefined) {
        updateData.venue = {
          connect: { id: updateEventDto.venueId },
        };
      }

      const event = await this.prisma.event.update({
        where: { id },
        data: updateData,
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
            },
          },
        },
      });
      this.logger.log(`Event updated successfully: ${event.id}`);
      return event;
    } catch (error) {
      this.logger.error(
        `Failed to update event: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update event');
    }
  }

  /**
   * Delete event by ID
   * @param id - Event UUID
   * @returns Success message
   * @throws NotFoundException if event not found
   * @throws BadRequestException if ID format is invalid
   */
  async deleteEvent(id: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete event: ${id}`);

    // Validate UUID format
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid event ID format');
    }

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!event) {
      this.logger.warn(`Event not found for deletion: ${id}`);
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    try {
      await this.prisma.event.delete({
        where: { id },
      });

      this.logger.log(`Event deleted successfully: ${event.name}`);

      return {
        message: `Event "${event.name}" at ${event.venue.name} has been successfully deleted`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete event: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to delete event');
    }
  }

  /**
   * Get event statistics
   * @returns Total events and breakdown by status
   */
  async getEventStatistics() {
    this.logger.log('Fetching event statistics');

    try {
      const now = new Date();

      const [total, byStatus, upcomingCount, ongoingCount, completedCount] =
        await Promise.all([
          this.prisma.event.count(),
          this.prisma.event.groupBy({
            by: ['status'],
            _count: true,
            orderBy: {
              _count: {
                status: 'desc',
              },
            },
          }),
          // Upcoming: future events
          this.prisma.event.count({
            where: {
              status: EventStatus.UPCOMING,
              startDatetime: {
                gte: now,
              },
            },
          }),
          // Ongoing: events happening now
          this.prisma.event.count({
            where: {
              status: EventStatus.ONGOING,
              startDatetime: {
                lte: now,
              },
              endDatetime: {
                gte: now,
              },
            },
          }),
          // Completed: past events
          this.prisma.event.count({
            where: {
              OR: [
                { status: EventStatus.COMPLETED },
                {
                  endDatetime: {
                    lt: now,
                  },
                },
              ],
            },
          }),
        ]);

      const statistics = {
        total,
        upcoming: upcomingCount,
        ongoing: ongoingCount,
        completed: completedCount,
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
      };

      this.logger.log(`Statistics fetched: ${total} total events`);
      return statistics;
    } catch (error) {
      this.logger.error(
        `Failed to fetch statistics: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch statistics');
    }
  }

  /**
   * Get events by venue ID
   * @param venueId - Venue UUID
   * @returns List of events for the specified venue
   * @throws NotFoundException if venue not found
   * @throws BadRequestException if ID format is invalid
   */
  async getEventsByVenueId(venueId: string) {
    this.logger.log(`Fetching events for venue: ${venueId}`);

    // Validate UUID format
    if (!this.isValidUUID(venueId)) {
      throw new BadRequestException('Invalid venue ID format');
    }

    // Validate venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        city: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID "${venueId}" not found`);
    }

    try {
      const events = await this.prisma.event.findMany({
        where: { venueId },
        orderBy: { startDatetime: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          startDatetime: true,
          endDatetime: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Found ${events.length} events for venue: ${venue.name}`);

      return {
        venue,
        events,
        total: events.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch events for venue: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch events for venue');
    }
  }
}
