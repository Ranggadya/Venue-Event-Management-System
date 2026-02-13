import { Module } from '@nestjs/common';
import { VenueService } from './venue.service';
import { VenueController } from './venue.controller';
import { VenueApiController } from './venue-api.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [VenueService],
  controllers: [VenueController, VenueApiController],
  exports: [VenueService],
})
export class VenueModule {}
