import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * DECISION: Create a custom exception filter to transform NestJS's default
 * validation error response into the precise format used by the legacy API.
 * Legacy Format: { "message": "errorCode" }
 * NestJS Default: { "statusCode": 400, "message": [...], "error": "Bad Request" }
 * This filter also enforces the validation priority of the original implementation.
 */
@Catch(BadRequestException)
export class LegacyValidationExceptionFilter implements ExceptionFilter {
  /**
   * Defines the priority of error messages, mirroring the if-else-if statement
   * order in the legacy `POST /legacy/memberships` endpoint.
   */
  private readonly errorPriority = [
    'missingMandatoryFields',
    'negativeRecurringPrice',
    'cashPriceBelow100',
    'billingPeriodsMoreThan12Months',
    'billingPeriodsLessThan6Months', // Preserved for completeness, though unreachable due to a legacy bug.
    'billingPeriodsMoreThan10Years',
    'billingPeriodsLessThan3Years',
    'invalidBillingPeriods',
  ];

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return response.status(status).json({
        message: exceptionResponse,
      });
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse &&
      Array.isArray((exceptionResponse as { message: unknown }).message)
    ) {
      const messages = (exceptionResponse as { message: string[] }).message;

      /**
       * DECISION: Select the single highest-priority error from all validation failures.
       * This emulates the behavior of a legacy if-else chain, where execution stops
       * and returns at the first validation rule that fails.
       */
      const legacyErrorCode = this.getHighestPriorityError(messages);

      return response.status(status).json({
        message: legacyErrorCode,
      });
    }

    // Fallback for any other unexpected error format.
    return response.status(status).json({
      message: 'Bad Request',
    });
  }

  /**
   * Finds the highest priority error from the validation messages
   * based on the legacy code's if-else chain order.
   */
  private getHighestPriorityError(messages: string[]): string {
    for (const errorCode of this.errorPriority) {
      if (messages.some((msg) => msg.includes(errorCode))) {
        return errorCode;
      }
    }
    // This fallback should ideally not be reached if custom validators are correctly configured.
    return messages[0];
  }
}
