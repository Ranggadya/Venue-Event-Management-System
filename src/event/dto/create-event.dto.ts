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
  @IsString({ message: 'Event name must be a string' })
  @IsNotEmpty({ message: 'Event name is required' })
  @MaxLength(255, { message: 'Event name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @Transform(({ value }) => value?.trim() || null)
  description?: string;

  @IsDateString(
    {},
    { message: 'Start datetime must be a valid ISO 8601 date string' },
  )
  @IsNotEmpty({ message: 'Start datetime is required' })
  startDatetime: string;

  @IsDateString(
    {},
    { message: 'End datetime must be a valid ISO 8601 date string' },
  )
  @IsNotEmpty({ message: 'End datetime is required' })
  endDatetime: string;

  @IsUUID('4', { message: 'Venue ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Venue ID is required' })
  venueId: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status must be one of: UPCOMING, ONGOING, COMPLETED, CANCELLED',
  })
  status?: EventStatus;

  @IsOptional()
  @IsEnum(RentalType)
  rentalType?: RentalType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  additionalFees?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

}
