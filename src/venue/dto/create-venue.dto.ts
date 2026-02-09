/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  IsPositive,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VenueStatus } from '@prisma/client';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class CreateVenueDto {
  @IsString({ message: 'Venue name must be a string' })
  @IsNotEmpty({ message: 'Venue name is required' })
  @MaxLength(255, { message: 'Venue name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @Transform(({ value }) => value?.trim() || null)
  @Sanitize()
  description?: string;

  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  @Transform(({ value }) => value?.trim())
  address: string;

  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(255, { message: 'City name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  city: string;

  @Type(() => Number)
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Capacity must be at least 1 person' })
  capacity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Price per hour must be a valid number with max 2 decimal places',
    },
  )
  @IsPositive({ message: 'Price per hour must be a positive number' })
  @ValidateIf((o) => o.pricePerHour !== null && o.pricePerHour !== undefined)
  pricePerHour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Price per day must be a valid number with max 2 decimal places',
    },
  )
  @IsPositive({ message: 'Price per day must be a positive number' })
  @ValidateIf((o) => o.pricePerDay !== null && o.pricePerDay !== undefined)
  pricePerDay?: number;

  @IsString({ message: 'Currency must be a string' })
  @IsOptional()
  @MaxLength(3, {
    message: 'Currency code must be exactly 3 characters (ISO 4217)',
  })
  @Transform(({ value }) => value?.toUpperCase() || 'IDR')
  currency?: string;

  // ✅ UPDATED: Gunakan IsEnum dengan Prisma Enum
  @IsOptional()
  @IsEnum(VenueStatus, {
    message: 'Status must be one of: AVAILABLE, BOOKED, MAINTENANCE, INACTIVE',
  })
  status?: VenueStatus; // ✅ Type dari Prisma
}
