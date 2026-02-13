import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventApiController } from './event-api.controller';
import { VenueModule } from 'src/venue/venue.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [VenueModule, PrismaModule],
  providers: [EventService],
  controllers: [EventController, EventApiController],
  exports: [EventService],
})
export class EventModule {}
