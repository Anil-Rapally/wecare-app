import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet());
  app.enableCors({ origin: config.getOrThrow<string>('CORS_ORIGIN') });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();
  
  const swaggerConfig = new DocumentBuilder()
  .setTitle('WeCare API')
  .setDescription('Authentication, user profile, and profile photo APIs')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'access-token',
  )
  .build();

const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

SwaggerModule.setup('docs', app, swaggerDocument);
  await app.listen(Number(config.getOrThrow<string>('PORT')));
}

bootstrap().catch(() => {
  // Nest reports initialization failures. Do not dump potentially sensitive state.
  process.exitCode = 1;

});