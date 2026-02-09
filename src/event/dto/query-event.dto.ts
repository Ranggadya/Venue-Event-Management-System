import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '@prisma/client'; // ✅ Import

export class QueryEventDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Venue ID must be a valid UUID' })
  venueId?: string;

  // ✅ UPDATED: Gunakan IsEnum
  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status must be one of: UPCOMING, ONGOING, COMPLETED, CANCELLED',
  })
  status?: EventStatus; // ✅ Type dari Prisma

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsEnum(['name', 'startDatetime', 'endDatetime', 'status', 'createdAt'], {
    message:
      'Sort field must be one of: name, startDatetime, endDatetime, status, createdAt',
  })
  sortBy?: string = 'startDatetime';

  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'], {
    message: 'Sort order must be either "asc" or "desc"',
  })
  sortOrder?: 'asc' | 'desc' = 'asc';
}
