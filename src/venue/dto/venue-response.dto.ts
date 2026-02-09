import { Event } from '@prisma/client';

/**
 * Response DTO untuk single venue
 */
export class VenueResponseDto {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  capacity: number;
  pricePerHour: string | null; // Decimal as string untuk precision
  pricePerDay: string | null;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventsCount?: number;
  events?: Event[];
}

/**
 * Response DTO untuk list venues dengan pagination
 */
export class VenueListResponseDto {
  data: VenueResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * API Response wrapper
 */
export class ApiResponseDto<T> {
  message: string;
  data: T;
  timestamp?: Date;
}
