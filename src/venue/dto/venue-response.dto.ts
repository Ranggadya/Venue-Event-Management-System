import { Event } from '@prisma/client';

export class VenueResponseDto {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  capacity: number;
  pricePerHour: string | null;
  pricePerDay: string | null;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventsCount?: number;
  events?: Event[];
}

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
