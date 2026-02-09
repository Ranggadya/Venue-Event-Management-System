import { Event, Venue } from '@prisma/client';

/**
 * Response DTO untuk single event
 */
export class EventResponseDto {
  id: string;
  name: string;
  description: string | null;
  startDatetime: Date;
  endDatetime: Date;
  status: string;
  venueId: string;
  createdAt: Date;
  updatedAt: Date;
  venue?: Partial<Venue>;
}

/**
 * Response DTO untuk list events dengan pagination
 */
export class EventListResponseDto {
  data: EventResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
