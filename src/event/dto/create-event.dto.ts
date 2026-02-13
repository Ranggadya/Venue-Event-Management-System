/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EventStatus, RentalType } from '@prisma/client';

export class CreateEventDto {
  // ========================================
  // BASIC INFORMATION
  // ========================================

  @IsString({ message: 'Event name must be a string' })
  @IsNotEmpty({ message: 'Event name is required' })
  @MaxLength(255, { message: 'Event name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @Transform(({ value }) => value?.trim() || null)
  description?: string;

  @IsUUID('4', { message: 'Venue ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Venue ID is required' })
  venueId: string;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Attendee count must be at least 1' })
  @Type(() => Number)
  attendeeCount?: number;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Start datetime must be a valid ISO 8601 date string' },
  )
  @Transform(({ value }) => value || undefined)
  startDatetime?: string;

  @IsOptional() // ✅ Made optional (will be built from split fields)
  @IsDateString(
    {},
    { message: 'End datetime must be a valid ISO 8601 date string' },
  )
  @Transform(({ value }) => value || undefined)
  endDatetime?: string;

  // ========================================
  // DATE & TIME (Split Fields from HTML Form)
  // ========================================

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  startDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  endDate?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  endTime?: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status must be one of: UPCOMING, ONGOING, COMPLETED, CANCELLED',
  })
  status?: EventStatus;

  @IsOptional()
  @IsEnum(RentalType, {
    message: 'Rental type must be one of: HOURLY, DAILY',
  })
  rentalType?: RentalType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount cannot be negative' })
  @Max(100, { message: 'Discount cannot exceed 100%' })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  })
  discount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Additional fees must be a number' })
  @Min(0, { message: 'Additional fees cannot be negative' })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  })
  additionalFees?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1')
      return true;
    if (value === 'false' || value === false || value === 0 || value === '0')
      return false;
    return false;
  })
  @IsBoolean({ message: 'Payment status must be true or false' })
  isPaid?: boolean;
}
