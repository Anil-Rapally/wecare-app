import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

 app.useGlobalPipes(
  new I18nValidationPipe({
    transform: true,
    stopAtFirstError: false,
  }),
);

app.useGlobalFilters(
  new I18nValidationExceptionFilter({
    errorFormatter: (errors) => {
      return errors.flatMap((error) => {
        const constraints = error.constraints ?? {};

        if (
          (error.value === undefined ||
            error.value === null ||
            error.value === '') &&
          constraints.isNotEmpty
        ) {
          return [constraints.isNotEmpty];
        }

         if (constraints.isInt) {
      return [constraints.isInt];
    }

        return Object.values(constraints).slice(0, 1);
      });
    },
  }),
);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();