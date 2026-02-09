/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
   * @param id - The ID to validate
   * @returns True if valid UUID format, false otherwise
   */
  private isValidUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Create new venue
   * @param createVenueDto - Venue creation data
   * @returns Created venue
   * @throws BadRequestException if data is invalid
   */

  async createVenue(createVenueDto: CreateVenueDto): Promise<Venue> {
    this.logger.log(`Creating new Venue : ${createVenueDto.name}`);

    try {
      const venue = await this.prisma.venue.create({
        data: {
          name: createVenueDto.name,
          description: createVenueDto.description || null,
          address: createVenueDto.address,
          city: createVenueDto.city,
          capacity: createVenueDto.capacity,
          pricePerHour: createVenueDto.pricePerHour
            ? new Prisma.Decimal(createVenueDto.pricePerHour)
            : null,
          pricePerDay: createVenueDto.pricePerDay
            ? new Prisma.Decimal(createVenueDto.pricePerDay)
            : null,
          currency: createVenueDto.currency || 'IDR',
          status: createVenueDto.status || VenueStatus.AVAILABLE, // ✅ Gunakan Enum
        },
      });

      this.logger.log(`Venue created Successfully: ${venue.id}`);
      return venue;
    } catch (error) {
      this.logger.error(`Failed to create : ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create venue');
    }
  }

  async getAllVenues(queryDto: QueryVenueDto) {
    const {
      search,
      city,
      status,
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
    } = queryDto;

    this.logger.log(
      `Fetching venues - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`,
    );

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

    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy: Prisma.VenueOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder ?? 'desc' }
      : { createdAt: 'desc' };

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
        `Found ${total} venues, returning ${venues.length} items`,
      );

      return {
        data: venues,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch venues: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch venues');
    }
  }

  async getVenueById(id: string): Promise<Venue & { events: any[] }> {
    this.logger.log(`Fetching venue: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid venue ID format');
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
        `Venue found: ${venue.name} with ${venue.events.length} events`,
      );
      return venue;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch venue: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch venue');
    }
  }

  async updateVenue(
    id: string,
    updateVenueDto: UpdateVenueDto,
  ): Promise<Venue> {
    this.logger.log(`Updating venue: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid venue ID format');
    }

    // Check if venue exists
    await this.getVenueById(id);

    try {
      const updateData: Prisma.VenueUpdateInput = {};

      if (updateVenueDto.name !== undefined) {
        updateData.name = updateVenueDto.name;
      }

      if (updateVenueDto.description !== undefined) {
        updateData.description = updateVenueDto.description || null;
      }

      if (updateVenueDto.address !== undefined) {
        updateData.address = updateVenueDto.address;
      }

      if (updateVenueDto.city !== undefined) {
        updateData.city = updateVenueDto.city;
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

      const venue = await this.prisma.venue.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Venue updated successfully: ${venue.id}`);
      return venue;
    } catch (error) {
      this.logger.error(
        `Failed to update venue: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update venue');
    }
  }

  /**
   * Delete venue by ID
   * Business Rule (SRS-009): Venue cannot be deleted if it has related events
   */
  async deleteVenue(id: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete venue: ${id}`);

    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid venue ID format');
    }

    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    if (!venue) {
      this.logger.warn(`Venue not found for deletion: ${id}`);
      throw new NotFoundException(`Venue with ID "${id}" not found`);
    }

    // ✅ BUSINESS RULE (SRS-009)
    if (venue._count.events > 0) {
      this.logger.warn(
        `Cannot delete venue "${venue.name}" - has ${venue._count.events} events`,
      );
      throw new ConflictException(
        `Cannot delete venue "${venue.name}" because it has ${venue._count.events} event(s) associated with it. Please delete all events first before deleting the venue.`,
      );
    }

    try {
      await this.prisma.venue.delete({
        where: { id },
      });

      this.logger.log(`Venue deleted successfully: ${venue.name}`);

      return {
        message: `Venue "${venue.name}" has been successfully deleted`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete venue: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to delete venue');
    }
  }

  /**
   * Get venue statistics
   */
  async getVenueStatistics() {
    this.logger.log('Fetching venue statistics');

    try {
      const [total, byStatus, byCity] = await Promise.all([
        this.prisma.venue.count(),
        this.prisma.venue.groupBy({
          by: ['status'],
          _count: true,
          orderBy: {
            _count: {
              status: 'desc',
            },
          },
        }),

        this.prisma.venue.groupBy({
          by: ['city'],
          _count: true,
          orderBy: {
            _count: {
              city: 'desc',
            },
          },
          take: 5,
        }),
      ]);
      const statistics = {
        total,
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        topCities: byCity.map((item) => ({
          city: item.city,
          count: item._count,
        })),
      };

      this.logger.log(`Statistics fetched: ${total} total venues`);
      return statistics;
    } catch (error) {
      this.logger.error(
        `Failed to fetch statistics: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch statistics');
    }
  }
}
