/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { Prisma, Event } from '@prisma/client';
import { EventStatus } from '@prisma/client';
import { PricingHelper } from './pricing.helper';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private validateNotPastDate(datetime: Date): void {
    const now = new Date();
    if (datetime < now) {
      throw new BadRequestException(
        'Cannot create or update event with past date. Please select a future date.',
      );
    }
  }

  /**
   * 🆕 VALIDASI: Cek kapasitas venue vs jumlah peserta
   */
  private async validateVenueCapacity(
    venueId: string,
    attendeeCount: number,
  ): Promise<void> {
    if (!attendeeCount || attendeeCount <= 0) {
      return; // Skip validation if no attendee count provided
    }

    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { capacity: true, name: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (Number(attendeeCount) <= venue.capacity) {
      throw new BadRequestException(
        `Attendee count (${attendeeCount}) must be greater than venue capacity (${venue.capacity}).`,
      );
    }
  }

  private async validateVenueActive(venueId: string): Promise<void> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { status: true, name: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (venue.status === 'INACTIVE') {
      throw new BadRequestException(
        `Cannot book venue "${venue.name}" because it is currently inactive. Please choose another venue or contact administrator.`,
      );
    }
  }

  private validateDateTimeRange(startDatetime: Date, endDatetime: Date): void {
    if (startDatetime >= endDatetime) {
      throw new BadRequestException(
        'End datetime must be after start datetime',
      );
    }

    const durationHours =
      (endDatetime.getTime() - startDatetime.getTime()) / (1000 * 60 * 60);

    if (durationHours < 1) {
      throw new BadRequestException('Event duration must be at least 1 hour');
    }

    if (durationHours > 720) {
      // 30 days
      throw new BadRequestException(
        'Event duration cannot exceed 30 days. Please split into multiple events.',
      );
    }
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    // Prisma Decimal has toNumber() method
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
      return value.toNumber();
    }

    // Fallback: try to convert to number
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  constructor(private readonly prisma: PrismaService) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    this.logger.log(`Creating new event: ${createEventDto.name}`);

    // Validate datetime range
    const startDatetime = new Date(createEventDto.startDatetime!);
    const endDatetime = new Date(createEventDto.endDatetime!);

    // 🆕 VALIDASI 1: Tanggal tidak boleh masa lalu
    this.validateNotPastDate(startDatetime);

    // VALIDASI 2: Range datetime valid
    this.validateDateTimeRange(startDatetime, endDatetime);

    // 🆕 VALIDASI 3: Venue harus aktif
    await this.validateVenueActive(createEventDto.venueId);

    // VALIDASI 4: Venue available (no double booking)
    await this.checkVenueAvailability(
      createEventDto.venueId,
      startDatetime,
      endDatetime,
    );

    // 🆕 VALIDASI 5: Capacity check
    if (createEventDto.attendeeCount) {
      await this.validateVenueCapacity(
        createEventDto.venueId,
        createEventDto.attendeeCount,
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

    const durationHours = PricingHelper.calculateDuration(
      startDatetime,
      endDatetime,
    );

    let rentalType = createEventDto.rentalType;
    if (!rentalType) {
      rentalType = PricingHelper.getOptimalRentalType(
        venueExists.pricePerHour,
        venueExists.pricePerDay,
        durationHours,
      );
    }

    const basePrice = PricingHelper.calculateBasePrice(
      rentalType,
      venueExists.pricePerHour,
      venueExists.pricePerDay,
      durationHours,
    );

    const finalPrice = PricingHelper.calculateFinalPrice(
      basePrice,
      createEventDto.discount || 0,
      createEventDto.additionalFees || 0,
    );

    try {
      const event = await this.prisma.event.create({
        data: {
          name: createEventDto.name,
          description: createEventDto.description || null,
          startDatetime: startDatetime,
          endDatetime: endDatetime,
          status: createEventDto.status || EventStatus.UPCOMING,
          venueId: createEventDto.venueId,
          attendeeCount: createEventDto.attendeeCount,
          rentalType,
          basePrice: new Prisma.Decimal(basePrice),
          finalPrice: new Prisma.Decimal(finalPrice),
          discount: new Prisma.Decimal(createEventDto.discount || 0),
          additionalFees: new Prisma.Decimal(
            createEventDto.additionalFees || 0,
          ),
          isPaid: createEventDto.isPaid || false,
        },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              pricePerHour: true,
              pricePerDay: true,
              currency: true,
            },
          },
        },
      });

      this.logger.log(`Event created successfully: ${event.id}`);
      this.logger.log(
        `Event created: ${event.name} | Duration: ${durationHours}h | Price: ${PricingHelper.formatCurrency(finalPrice)}`,
      );
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

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    this.logger.log(`Updating event: ${id}`);

    // Validate UUID format
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid event ID format');
    }

    // Get existing event with venue info
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            capacity: true,
            status: true,
            pricePerHour: true,
            pricePerDay: true,
          },
        },
      },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    // Determine final values (use updated or existing)
    const startDatetime = updateEventDto.startDatetime
      ? new Date(updateEventDto.startDatetime)
      : existingEvent.startDatetime;
    const endDatetime = updateEventDto.endDatetime
      ? new Date(updateEventDto.endDatetime)
      : existingEvent.endDatetime;
    const venueId = updateEventDto.venueId || existingEvent.venueId;
    const attendeeCount =
      updateEventDto.attendeeCount !== undefined
        ? updateEventDto.attendeeCount
        : existingEvent.attendeeCount;

    // VALIDASI 1: Tanggal tidak boleh masa lalu (jika diubah)
    if (updateEventDto.startDatetime) {
      this.validateNotPastDate(startDatetime);
    }

    // VALIDASI 2: Range datetime valid
    this.validateDateTimeRange(startDatetime, endDatetime);

    // VALIDASI 3: Venue harus ACTIVE (jika venue diubah)
    if (
      updateEventDto.venueId &&
      updateEventDto.venueId !== existingEvent.venueId
    ) {
      await this.validateVenueActive(venueId);
    }

    // VALIDASI 4: Venue available (jika datetime atau venue diubah)
    if (
      updateEventDto.startDatetime ||
      updateEventDto.endDatetime ||
      updateEventDto.venueId
    ) {
      await this.checkVenueAvailability(
        venueId,
        startDatetime,
        endDatetime,
        id,
      );
    }

    // VALIDASI 5: Capacity check (jika attendee atau venue diubah)
    if (
      attendeeCount &&
      (updateEventDto.attendeeCount !== undefined || updateEventDto.venueId)
    ) {
      await this.validateVenueCapacity(venueId, attendeeCount);
    }

    // Prepare update data
    const updateData: Prisma.EventUpdateInput = {};

    // Basic fields
    if (updateEventDto.name !== undefined) {
      updateData.name = updateEventDto.name;
    }

    if (updateEventDto.description !== undefined) {
      updateData.description = updateEventDto.description;
    }

    if (updateEventDto.startDatetime !== undefined) {
      updateData.startDatetime = startDatetime;
    }

    if (updateEventDto.endDatetime !== undefined) {
      updateData.endDatetime = endDatetime;
    }

    if (updateEventDto.status !== undefined) {
      updateData.status = updateEventDto.status;
    }

    if (updateEventDto.venueId !== undefined) {
      updateData.venue = {
        connect: { id: updateEventDto.venueId },
      };
    }

    if (updateEventDto.attendeeCount !== undefined) {
      updateData.attendeeCount = updateEventDto.attendeeCount;
    }

    // Payment handling
    if (updateEventDto.isPaid !== undefined) {
      updateData.isPaid = updateEventDto.isPaid;

      if (updateEventDto.isPaid === true && !existingEvent.isPaid) {
        updateData.paymentDate = new Date();
      } else if (updateEventDto.isPaid === false) {
        updateData.paymentDate = null;
      }
    }

    // RECALCULATE PRICING if needed
    const shouldRecalculatePrice =
      updateEventDto.startDatetime ||
      updateEventDto.endDatetime ||
      updateEventDto.venueId ||
      updateEventDto.discount !== undefined ||
      updateEventDto.additionalFees !== undefined;

    if (shouldRecalculatePrice) {
      const venue =
        updateEventDto.venueId &&
        updateEventDto.venueId !== existingEvent.venueId
          ? await this.prisma.venue.findUnique({
              where: { id: venueId },
              select: {
                pricePerHour: true,
                pricePerDay: true,
              },
            })
          : existingEvent.venue;

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      // Calculate duration
      const duration = PricingHelper.calculateDuration(
        startDatetime,
        endDatetime,
      );

      // Determine rental type
      // Determine rental type
      const rentalType = PricingHelper.getOptimalRentalType(
        venue.pricePerHour,
        venue.pricePerDay,
        duration,
      );

      // Calculate base price
      const basePrice = PricingHelper.calculateBasePrice(
        rentalType,
        venue.pricePerHour,
        venue.pricePerDay,
        duration,
      );

      // Calculate final price
      const finalPrice = PricingHelper.calculateFinalPrice(
        basePrice,
        updateEventDto.discount !== undefined
          ? this.toNumber(updateEventDto.discount)
          : this.toNumber(existingEvent.discount),
        updateEventDto.additionalFees !== undefined
          ? this.toNumber(updateEventDto.additionalFees)
          : this.toNumber(existingEvent.additionalFees),
      );

      updateData.rentalType = rentalType;
      updateData.basePrice = basePrice;
      updateData.finalPrice = finalPrice;
    }

    if (updateEventDto.discount !== undefined) {
      updateData.discount = updateEventDto.discount;
    }

    if (updateEventDto.additionalFees !== undefined) {
      updateData.additionalFees = updateEventDto.additionalFees;
    }

    // Execute update
    try {
      const updatedEvent = await this.prisma.event.update({
        where: { id },
        data: updateData,
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
      });

      this.logger.log(`Event updated successfully: ${id}`);
      return updatedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to update event: ${error.message}`,
        error.stack,
      );

      if (error.code === 'P2025') {
        throw new NotFoundException('Event not found');
      }

      if (error.code === 'P2002') {
        throw new ConflictException('Event with this data already exists');
      }

      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid venue reference');
      }

      throw new BadRequestException(`Failed to update event: ${error.message}`);
    }
  }

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

  // Get financial statistics
  async getFinancialStatistics() {
    this.logger.log('Fetching financial statistics');

    try {
      const [
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
        revenueByVenue,
        revenueByMonth,
        averagePrice,
      ] = await Promise.all([
        this.prisma.event.aggregate({
          _sum: { finalPrice: true },
        }),

        this.prisma.event.aggregate({
          where: { isPaid: true },
          _sum: { finalPrice: true },
        }),

        this.prisma.event.aggregate({
          where: { isPaid: false },
          _sum: { finalPrice: true },
        }),

        this.prisma.event.groupBy({
          by: ['venueId'],
          _sum: { finalPrice: true },
          _count: true,
        }),

        // Revenue by month (last 6 months)
        this.prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(start_datetime, '%Y-%m') as month,
          SUM(final_price) as revenue,
          COUNT(*) as event_count
        FROM events
        WHERE start_datetime >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(start_datetime, '%Y-%m')
        ORDER BY month DESC
      `,

        this.prisma.event.aggregate({
          _avg: { finalPrice: true },
        }),
      ]);

      const revenueByVenueEnriched = await Promise.all(
        revenueByVenue.map(async (item) => {
          const venue = await this.prisma.venue.findUnique({
            where: { id: item.venueId },
            select: { name: true, city: true },
          });

          return {
            venueId: item.venueId,
            venueName: venue?.name || 'Unknown',
            venueCity: venue?.city || 'Unknown',
            totalRevenue: Number(item._sum.finalPrice || 0),
            eventCount: item._count,
          };
        }),
      );

      revenueByVenueEnriched.sort((a, b) => b.totalRevenue - a.totalRevenue);

      const statistics = {
        totalRevenue: Number(totalRevenue._sum.finalPrice || 0),
        paidRevenue: Number(paidRevenue._sum.finalPrice || 0),
        unpaidRevenue: Number(unpaidRevenue._sum.finalPrice || 0),
        averagePrice: Number(averagePrice._avg.finalPrice || 0),
        revenueByVenue: revenueByVenueEnriched,
        revenueByMonth,
        formatted: {
          totalRevenue: PricingHelper.formatCurrency(
            Number(totalRevenue._sum.finalPrice || 0),
          ),
          paidRevenue: PricingHelper.formatCurrency(
            Number(paidRevenue._sum.finalPrice || 0),
          ),
          unpaidRevenue: PricingHelper.formatCurrency(
            Number(unpaidRevenue._sum.finalPrice || 0),
          ),
          averagePrice: PricingHelper.formatCurrency(
            Number(averagePrice._avg.finalPrice || 0),
          ),
        },
      };

      this.logger.log(
        `Financial stats: Total Revenue = ${statistics.formatted.totalRevenue}`,
      );
      return statistics;
    } catch (error) {
      this.logger.error(
        `Failed to fetch financial statistics: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch financial statistics');
    }
  }

  // Get revenue by date range

  async getRevenueByDateRange(startDate: Date, endDate: Date) {
    const events = await this.prisma.event.findMany({
      where: {
        startDatetime: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        name: true,
        startDatetime: true,
        finalPrice: true,
        isPaid: true,
        venue: {
          select: {
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        startDatetime: 'desc',
      },
    });

    const totalRevenue = events.reduce(
      (sum, event) => sum + Number(event.finalPrice || 0),
      0,
    );

    const paidRevenue = events
      .filter((e) => e.isPaid)
      .reduce((sum, event) => sum + Number(event.finalPrice || 0), 0);

    return {
      events,
      summary: {
        totalEvents: events.length,
        totalRevenue,
        paidRevenue,
        unpaidRevenue: totalRevenue - paidRevenue,
        formatted: {
          totalRevenue: PricingHelper.formatCurrency(totalRevenue),
          paidRevenue: PricingHelper.formatCurrency(paidRevenue),
          unpaidRevenue: PricingHelper.formatCurrency(
            totalRevenue - paidRevenue,
          ),
        },
      },
    };
  }

  async checkVenueAvailability(
    venueId: string,
    startDatetime: Date,
    endDatetime: Date,
    excludeEventId?: string,
  ): Promise<void> {
    const overlappingEvents = await this.prisma.event.findMany({
      where: {
        venueId,
        id: excludeEventId ? { not: excludeEventId } : undefined,
        status: {
          in: ['UPCOMING', 'ONGOING'],
        },
        OR: [
          {
            AND: [
              { startDatetime: { lte: startDatetime } },
              { endDatetime: { gt: startDatetime } },
            ],
          },
          {
            AND: [
              { startDatetime: { lt: endDatetime } },
              { endDatetime: { gte: endDatetime } },
            ],
          },
          {
            AND: [
              { startDatetime: { gte: startDatetime } },
              { endDatetime: { lte: endDatetime } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        startDatetime: true,
        endDatetime: true,
      },
    });

    if (overlappingEvents.length > 0) {
      const conflictingEvent = overlappingEvents[0];
      throw new ConflictException(
        `Venue is already booked for event "${conflictingEvent.name}" from ${conflictingEvent.startDatetime.toLocaleString()} to ${conflictingEvent.endDatetime.toLocaleString()}. Please choose different date or venue.`,
      );
    }
  }
}
