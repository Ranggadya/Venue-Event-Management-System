import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { EventService } from './event/event.service';
import { VenueService } from './venue/venue.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: VenueService,
          useValue: {},
        },
        {
          provide: EventService,
          useValue: {},
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });
});
