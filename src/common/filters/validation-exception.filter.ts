import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nValidationException } from 'nestjs-i18n';

@Catch(I18nValidationException)
export class ValidationExceptionFilter implements ExceptionFilter<I18nValidationException> {
  catch(exception: I18nValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus(); // 422 or 400

    // Extract only the first validation error message.
    // I18nValidationException.errors is an array of ValidationError objects.
    // Each ValidationError has a `constraints` object like { isNotEmpty: "Please enter your name" }.
    const errors = exception.errors ?? [];
    let firstMessage = 'Validation failed';

    for (const error of errors) {
      if (error.constraints) {
        // Object.values gives us all constraint messages for this field.
        // We take the very first one and stop.
        const messages = Object.values(error.constraints);
        if (messages.length > 0) {
          firstMessage = messages[0];
          break;
        }
      }
    }

    response.status(status).json({
      success: 5,
      message: firstMessage,
      data: null,
    });
  }
}
