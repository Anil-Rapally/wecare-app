import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const ResponseMessage = (message: string) =>
  SetMetadata('responseMessage', message);

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const message =
      Reflect.getMetadata('responseMessage', context.getHandler()) ??
      'Request completed successfully';

    return next.handle().pipe(
      map((data) => ({
        success: 1,
        message,
        data,
      })),
    );
  }
}