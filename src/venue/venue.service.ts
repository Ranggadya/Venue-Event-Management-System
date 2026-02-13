import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { Prisma, Venue, VenueStatus } from '@prisma/client';

@Injectable()
export class VenueService {
  private readonly logger = new Logger(VenueService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate UUID format
   */
  private isValidUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Check if venue name already exists in the same city
   */
  private async checkDuplicateVenue(
    name: string,
    city: string,
    excludeId?: string,
  ): Promise<void> {
    const existingVenue = await this.prisma.venue.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
        city: {
          equals: city.trim(),
        },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existingVenue) {
      throw new ConflictException(
        `A venue named "${name}" already exists in ${city}`,
      );
    }
  }

  /**
   * Create new venue
   */
  async createVenue(createVenueDto: CreateVenueDto): Promise<Venue> {
    this.logger.log(`Creating new venue: ${createVenueDto.name}`);

    // Check for duplicate venue
    await this.checkDuplicateVenue(createVenueDto.name, createVenueDto.city);

    try {
      const venue = await this.prisma.venue.create({
        data: {
          name: createVenueDto.name.trim(),
          description: createVenueDto.description?.trim() || null,
          address: createVenueDto.address.trim(),
          city: createVenueDto.city.trim(),
          capacity: createVenueDto.capacity,
          pricePerHour: createVenueDto.pricePerHour
            ? new Prisma.Decimal(createVenueDto.pricePerHour)
            : null,
          pricePerDay: createVenueDto.pricePerDay
            ? new Prisma.Decimal(createVenueDto.pricePerDay)
            : null,
          currency: createVenueDto.currency || 'IDR',
          status: createVenueDto.status || VenueStatus.ACTIVE,
        },
      });

      this.logger.log(
        `Venue created successfully: ${venue.name} (ID: ${venue.id})`,
      );
      return venue;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(
        `Failed to create venue: ${error.message}`,
        error.stack,
      );

      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A venue with this information already exists',
        );
      }

      throw new BadRequestException(
        'Failed to create venue. Please check your input.',
      );
    }
  }

  /**
   * Get all venues with filtering, pagination, and sorting
   * @param queryDto - Query parameters
   * @returns Paginated venue list with metadata
   */
  async getAllVenues(queryDto: QueryVenueDto) {
    const {
      search,
      city,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    this.logger.log(
      `Fetching venues - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`,
    );

    // Build WHERE clause
    const where: Prisma.VenueWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { address: { contains: search } },
      ];
    }

    if (city) {
      where.city = { contains: city };
    }

    if (status) {
      where.status = status;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy: Prisma.VenueOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    try {
      const [venues, total] = await Promise.all([
        this.prisma.venue.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            _count: {
              select: { events: true },
            },
          },
        }),
        this.prisma.venue.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Found ${total} venues, returning ${venues.length} items (Page ${page}/${totalPages})`,
      );

      return {
        data: venues,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch venues: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to fetch venues. Please try again.',
      );
    }
  }

  /**
   * Get venue by ID with related events
   */
  async getVenueById(id: string): Promise<Venue & { events: any[] }> {
    this.logger.log(`Fetching venue: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException(
        'Invalid venue ID format. Must be a valid UUID.',
      );
    }

    try {
      const venue = await this.prisma.venue.findUnique({
        where: { id },
        include: {
          events: {
            orderBy: { startDatetime: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              startDatetime: true,
              endDatetime: true,
              status: true,
              rentalType: true,
              basePrice: true,
              finalPrice: true,
              isPaid: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!venue) {
        this.logger.warn(`Venue not found: ${id}`);
        throw new NotFoundException(`Venue with ID "${id}" not found`);
      }

      this.logger.log(
        `Venue found: ${venue.name} with ${venue.events.length} event(s)`,
      );
      return venue;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Failed to fetch venue: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch venue details.');
    }
  }

  /**
   * Update venue
   */
  async updateVenue(
    id: string,
    updateVenueDto: UpdateVenueDto,
  ): Promise<Venue> {
    this.logger.log(`Updating venue: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException(
        'Invalid venue ID format. Must be a valid UUID.',
      );
    }

    // Check if venue exists
    const existingVenue = await this.getVenueById(id);

    if (updateVenueDto.name || updateVenueDto.city) {
      const newName = updateVenueDto.name || existingVenue.name;
      const newCity = updateVenueDto.city || existingVenue.city;

      await this.checkDuplicateVenue(newName, newCity, id);
    }

    try {
      const updateData: Prisma.VenueUpdateInput = {};

      if (updateVenueDto.name !== undefined) {
        updateData.name = updateVenueDto.name.trim();
      }

      if (updateVenueDto.description !== undefined) {
        updateData.description = updateVenueDto.description?.trim() || null;
      }

      if (updateVenueDto.address !== undefined) {
        updateData.address = updateVenueDto.address.trim();
      }

      if (updateVenueDto.city !== undefined) {
        updateData.city = updateVenueDto.city.trim();
      }

      if (updateVenueDto.capacity !== undefined) {
        updateData.capacity = updateVenueDto.capacity;
      }

      if (updateVenueDto.pricePerHour !== undefined) {
        updateData.pricePerHour = updateVenueDto.pricePerHour
          ? new Prisma.Decimal(updateVenueDto.pricePerHour)
          : null;
      }

      if (updateVenueDto.pricePerDay !== undefined) {
        updateData.pricePerDay = updateVenueDto.pricePerDay
          ? new Prisma.Decimal(updateVenueDto.pricePerDay)
          : null;
      }

      if (updateVenueDto.currency !== undefined) {
        updateData.currency = updateVenueDto.currency;
      }

      if (updateVenueDto.status !== undefined) {
        updateData.status = updateVenueDto.status;
      }

      // Execute update
      const venue = await this.prisma.venue.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Venue updated successfully: ${venue.name} (ID: ${id})`);
      return venue;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(
        `Failed to update venue: ${error.message}`,
        error.stack,
      );

      if (error.code === 'P2002') {
        throw new ConflictException(
          'A venue with this information already exists',
        );
      }

      throw new BadRequestException(
        'Failed to update venue. Please check your input.',
      );
    }
  }
  async deleteVenue(id: string) {
    this.logger.log(`Deleting venue: ${id}`);

    const venue = await this.prisma.venue.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            events: {
              where: {
                status: {
                  in: ['UPCOMING', 'ONGOING'],
                },
              },
            },
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // 🆕 VALIDASI: Tidak bisa delete venue jika masih ada event aktif
    if (venue._count.events > 0) {
      throw new ConflictException(
        `Cannot delete venue "${venue.name}" because it has ${venue._count.events} active or upcoming event(s). Please complete or cancel all events first.`,
      );
    }

    await this.prisma.venue.delete({
      where: { id },
    });

    this.logger.log(`Venue deleted successfully: ${id}`);
    return { message: 'Venue deleted successfully', venueId: id };
  }

  /**
   * Get venue statistics
   */
  async getVenueStatistics() {
    this.logger.log('Fetching venue statistics');

    try {
      const [total, byStatus, byCity, avgCapacity] = await Promise.all([
        // Total venues
        this.prisma.venue.count(),

        // Count by status
        this.prisma.venue.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
          orderBy: {
            _count: {
              status: 'desc',
            },
          },
        }),

        // Top 5 cities by venue count
        this.prisma.venue.groupBy({
          by: ['city'],
          _count: {
            city: true,
          },
          orderBy: {
            _count: {
              city: 'desc',
            },
          },
          take: 5,
        }),

        // Average capacity
        this.prisma.venue.aggregate({
          _avg: {
            capacity: true,
          },
          _max: {
            capacity: true,
          },
          _min: {
            capacity: true,
          },
        }),
      ]);

      const statistics = {
        total,
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        topCities: byCity.map((item) => ({
          city: item.city,
          count: item._count.city,
        })),
        capacity: {
          average: Math.round(avgCapacity._avg.capacity || 0),
          maximum: avgCapacity._max.capacity || 0,
          minimum: avgCapacity._min.capacity || 0,
        },
      };

      this.logger.log(`Statistics fetched: ${total} total venues`);
      return statistics;
    } catch (error) {
      this.logger.error(
        `Failed to fetch statistics: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to fetch venue statistics. Please try again.',
      );
    }
  }

  /**
   * Get venues by city
   */
  async getVenuesByCity(city: string): Promise<Venue[]> {
    this.logger.log(`Fetching venues in city: ${city}`);

    try {
      const venues = await this.prisma.venue.findMany({
        where: {
          city: {
            equals: city.trim(),
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      this.logger.log(`Found ${venues.length} venues in ${city}`);
      return venues;
    } catch (error) {
      this.logger.error(
        `Failed to fetch venues by city: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch venues by city.');
    }
  }

  async getAvailableVenuesOnDate(startDate: Date, endDate: Date) {
    this.logger.log(
      `Checking venue availability from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const venues = await this.prisma.venue.findMany({
      where: {
        status: VenueStatus.ACTIVE,
      },
      include: {
        events: {
          where: {
            status: {
              in: ['UPCOMING', 'ONGOING'],
            },
            OR: [
              {
                AND: [
                  { startDatetime: { lte: startDate } },
                  { endDatetime: { gt: startDate } },
                ],
              },
              {
                AND: [
                  { startDatetime: { lt: endDate } },
                  { endDatetime: { gte: endDate } },
                ],
              },
              {
                AND: [
                  { startDatetime: { gte: startDate } },
                  { endDatetime: { lte: endDate } },
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
        },
      },
    });

    // Map venues with availability info
    return venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      address: venue.address,
      capacity: venue.capacity,
      pricePerDay: venue.pricePerDay,
      pricePerHour: venue.pricePerHour,
      currency: venue.currency,
      status: venue.status,
      isAvailable: venue.events.length === 0, // DYNAMIC availability
      conflictingEvents: venue.events, // Show which events are blocking
    }));
  }

  async checkVenueAvailabilityOnDate(
    venueId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { status: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // If venue is not ACTIVE, it's not available
    if (venue.status !== VenueStatus.ACTIVE) {
      return false;
    }

    // Check if there are any events on this date
    const overlappingEvents = await this.prisma.event.count({
      where: {
        venueId,
        status: {
          in: ['UPCOMING', 'ONGOING'],
        },
        OR: [
          {
            AND: [
              { startDatetime: { lte: startDate } },
              { endDatetime: { gt: startDate } },
            ],
          },
          {
            AND: [
              { startDatetime: { lt: endDate } },
              { endDatetime: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDatetime: { gte: startDate } },
              { endDatetime: { lte: endDate } },
            ],
          },
        ],
      },
    });

    return overlappingEvents === 0;
  }
}
