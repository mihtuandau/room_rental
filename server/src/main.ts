import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // Tokens, contact details, saved searches, and user-owned data must never
  // be stored by a browser or shared intermediary cache.
  const privatePrefixes = [
    '/auth',
    '/users',
    '/favorites',
    '/contact-logs',
    '/saved-searches',
    '/notifications',
    '/reports',
    '/rooms/mine',
  ];
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      (req.method !== 'GET' && req.method !== 'HEAD') ||
      privatePrefixes.some((prefix) => req.path.startsWith(prefix))
    ) {
      res.setHeader('Cache-Control', 'private, no-store');
    }
    next();
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // required because the refresh token lives in an httpOnly cookie
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  if (['development', 'test'].includes(process.env.NODE_ENV ?? '')) {
    const config = new DocumentBuilder()
      .setTitle('Trọ Ơi API')
      .setDescription('API for the room rental platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Nest's own "successfully started" line says nothing about where it is
  // listening, which reads like a hang. Print the URLs explicitly.
  Logger.log(`API sẵn sàng: http://localhost:${port}`, 'Bootstrap');
  if (['development', 'test'].includes(process.env.NODE_ENV ?? '')) {
    Logger.log(`Swagger: http://localhost:${port}/docs`, 'Bootstrap');
  }
}
void bootstrap();
