import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import helmet from 'helmet';
import session from 'express-session';
import flash from 'express-flash';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('ejs');
  app.useStaticAssets(join(process.cwd(), 'public'));

  // ✅ Layout configuration
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ejsLayouts = require('express-ejs-layouts');
  app.use(ejsLayouts);
  app.set('layout', 'layout/main');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.jsdelivr.net',
            'https://fonts.googleapis.com',
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
            'https://verify-nest-restart.com', // Fingerprint for verification
          ],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net',
          ],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  // ========== CORS ========== ❌ HAPUS/COMMENT (tidak perlu untuk SSR)
  // app.enableCors({
  //   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  //   credentials: true,
  //   method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // });

  // ========== VALIDATION ==========
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // GLOBAL FILTERS
  app.useGlobalFilters(
    new PrismaExceptionFilter(), // Handle Prisma errors first
    new HttpExceptionFilter(), // Then HTTP errors
  );

  app.use(flash());

  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
  });

  // SESSION
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'my-secret-key-change-this',
      resave: true, // Required for rolling sessions
      saveUninitialized: false,
      rolling: true, // Reset session timeout on every request
      cookie: {
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
      name: 'sessionId',
    }),
  );

  await app.listen(process.env.PORT || 3001);
  console.log(`✅ Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
