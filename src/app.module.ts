import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VenueModule } from './venue/venue.module';
import { EventModule } from './event/event.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Rate Limiting Configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // Max 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // Max 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // Max 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    VenueModule,
    EventModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
