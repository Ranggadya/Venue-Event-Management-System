import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { VenueStatus } from '@prisma/client';

export class QueryVenueDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(VenueStatus, {
    message: 'Status must be one of: AVAILABLE, BOOKED, MAINTENANCE, INACTIVE',
  })
  status?: VenueStatus;

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
  @IsEnum(['name', 'city', 'capacity', 'pricePerDay', 'createdAt', 'updatedAt'], {
    message:
      'Sort field must be one of: name, city, capacity, pricePerDay, createdAt, updatedAt',
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'], {
    message: 'Sort order must be either "asc" or "desc"',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
