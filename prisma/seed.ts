/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient, VenueStatus, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // ==========================================
  // 1. SEED ADMIN
  // ==========================================
  console.log('👤 Seeding Admin...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@eventmanager.com' },
    update: {},
    create: {
      email: 'admin@eventmanager.com',
      passwordHash: hashedPassword,
      name: 'Super Admin',
      isActive: true,
    },
  });

  console.log('✅ Admin created:', admin.email);

  // ==========================================
  // 2. SEED VENUES
  // ==========================================
  console.log('🏢 Seeding Venues...');

  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        name: 'Grand Ballroom Jakarta',
        description:
          'Luxurious ballroom with modern facilities and elegant interior design',
        address: 'Jl. Sudirman No. 123',
        city: 'Jakarta',
        capacity: 500,
        pricePerHour: 2000000,
        pricePerDay: 15000000,
        currency: 'IDR',
        status: VenueStatus.AVAILABLE,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Bandung Convention Center',
        description:
          'Large convention center perfect for conferences and exhibitions',
        address: 'Jl. Asia Afrika No. 45',
        city: 'Bandung',
        capacity: 800,
        pricePerHour: 2500000,
        pricePerDay: 20000000,
        currency: 'IDR',
        status: VenueStatus.AVAILABLE,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Surabaya Expo Hall',
        description:
          'Spacious expo hall with state-of-the-art audiovisual equipment',
        address: 'Jl. Pemuda No. 67',
        city: 'Surabaya',
        capacity: 1000,
        pricePerHour: 3000000,
        pricePerDay: 25000000,
        currency: 'IDR',
        status: VenueStatus.BOOKED,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Yogyakarta Royal Garden',
        description:
          'Beautiful garden venue with traditional Javanese architecture',
        address: 'Jl. Malioboro No. 89',
        city: 'Yogyakarta',
        capacity: 300,
        pricePerHour: 1500000,
        pricePerDay: 10000000,
        currency: 'IDR',
        status: VenueStatus.MAINTENANCE,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Semarang Meeting Room',
        description:
          'Cozy meeting room suitable for small gatherings and workshops',
        address: 'Jl. Pandanaran No. 56',
        city: 'Semarang',
        capacity: 150,
        pricePerHour: 800000,
        pricePerDay: 5000000,
        currency: 'IDR',
        status: VenueStatus.INACTIVE,
      },
    }),
  ]);

  console.log(`✅ ${venues.length} Venues created`);

  // ==========================================
  // 3. SEED EVENTS
  // ==========================================
  console.log('📅 Seeding Events...');

  const events = await Promise.all([
    // Events untuk Grand Ballroom Jakarta
    prisma.event.create({
      data: {
        name: 'Tech Conference 2025',
        description:
          'Annual technology conference featuring latest innovations in AI, Cloud, and Blockchain',
        startDatetime: new Date('2025-03-15T09:00:00'),
        endDatetime: new Date('2025-03-17T17:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[0].id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Wedding Expo Jakarta',
        description:
          'The biggest wedding exhibition in Jakarta showcasing latest trends',
        startDatetime: new Date('2025-04-20T10:00:00'),
        endDatetime: new Date('2025-04-21T18:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[0].id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Startup Summit',
        description: 'Connecting startups with investors and mentors',
        startDatetime: new Date('2025-05-10T08:00:00'),
        endDatetime: new Date('2025-05-12T20:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[0].id,
      },
    }),

    // Events untuk Bandung Convention Center
    prisma.event.create({
      data: {
        name: 'Bandung Creative Festival',
        description:
          'Celebrating creative industries in Bandung with workshops and exhibitions',
        startDatetime: new Date('2025-03-25T09:00:00'),
        endDatetime: new Date('2025-03-27T21:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[1].id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'International Food Festival',
        description:
          'Culinary experience from around the world with cooking demos',
        startDatetime: new Date('2025-06-05T11:00:00'),
        endDatetime: new Date('2025-06-07T22:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[1].id,
      },
    }),

    // Events untuk Surabaya Expo Hall
    prisma.event.create({
      data: {
        name: 'East Java Trade Expo',
        description:
          'Business networking and trade exhibition for East Java region',
        startDatetime: new Date('2025-04-01T08:00:00'),
        endDatetime: new Date('2025-04-05T18:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[2].id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Automotive Show 2025',
        description: 'Latest automotive innovations and new car releases',
        startDatetime: new Date('2025-07-15T10:00:00'),
        endDatetime: new Date('2025-07-18T19:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[2].id,
      },
    }),

    // Events untuk Yogyakarta Royal Garden
    prisma.event.create({
      data: {
        name: 'Cultural Heritage Festival',
        description:
          'Celebrating Javanese culture and traditions with performances',
        startDatetime: new Date('2025-02-10T14:00:00'),
        endDatetime: new Date('2025-02-12T20:00:00'),
        status: EventStatus.COMPLETED,
        venueId: venues[3].id,
      },
    }),

    // Event untuk Semarang Meeting Room
    prisma.event.create({
      data: {
        name: 'Business Seminar',
        description: 'Leadership and management seminar for executives',
        startDatetime: new Date('2025-01-15T09:00:00'),
        endDatetime: new Date('2025-01-15T17:00:00'),
        status: EventStatus.COMPLETED,
        venueId: venues[4].id,
      },
    }),

    // Event masa depan
    prisma.event.create({
      data: {
        name: 'Music Festival 2025',
        description:
          'Three days of amazing music performances from local and international artists',
        startDatetime: new Date('2025-08-20T15:00:00'),
        endDatetime: new Date('2025-08-22T23:00:00'),
        status: EventStatus.UPCOMING,
        venueId: venues[0].id,
      },
    }),
  ]);

  console.log(`✅ ${events.length} Events created`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
