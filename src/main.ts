import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';

import { ResponseInterceptor } from './interceptors/response.interceptor';

import { ResponseExceptionFilter } from './exceptions/response.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseInterceptor());

 app.useGlobalPipes(
  new I18nValidationPipe({
    transform: true,
    stopAtFirstError: false,
  }),
);

app.useGlobalFilters(
  new ResponseExceptionFilter(),

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

    responseBodyFormatter: (_host, _exception, error) => {
      return {
        success: 0,
        message: Array.isArray(error) ? error.join(', ') : error,
        data: {},
      };
    },
  }),
);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();