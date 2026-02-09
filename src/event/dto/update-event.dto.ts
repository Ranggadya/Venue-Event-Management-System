import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

/**
 * Update Event DTO
 * Extends CreateEventDto dengan semua field menjadi optional
 */
export class UpdateEventDto extends PartialType(CreateEventDto) {}
