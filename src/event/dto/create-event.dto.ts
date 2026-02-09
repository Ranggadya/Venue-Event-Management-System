/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
  IsUUID,
  IsEnum, // ✅ Import IsEnum
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EventStatus } from '@prisma/client'; // ✅ Import Enum

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

  // ✅ UPDATED: Gunakan IsEnum dengan Prisma Enum
  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status must be one of: UPCOMING, ONGOING, COMPLETED, CANCELLED',
  })
  status?: EventStatus; // ✅ Type dari Prisma
}
