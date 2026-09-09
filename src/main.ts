import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
    new ValidationPipe({
    transform: true,

    exceptionFactory: (errors) => {
      const messages = errors.flatMap((error) => {
        const value = error.value;

        if (value === undefined || value === null || value === '') {
          return `${error.property} should not be empty`;
        }

        return Object.values(error.constraints ?? {});
      });

      return new BadRequestException(messages);
    },
  }),
);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
