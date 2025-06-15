import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * DECISION: Create custom exception filter to match legacy error response format
 * Legacy API returns: { "message": "errorCode" } with status 400
 * NestJS default returns: { "statusCode": 400, "message": [...], "error": "Bad Request" }
 *
 * This filter transforms NestJS validation errors to match legacy format exactly
 * and respects the priority order of the legacy validation checks
 */
@Catch(BadRequestException)
export class LegacyValidationExceptionFilter implements ExceptionFilter {
  /**
   * Priority order of legacy error codes (based on if-else chain in legacy code)
   * Earlier items in the array have higher priority
   */
  private readonly errorPriority = [
    'missingMandatoryFields',
    'negativeRecurringPrice',
    'cashPriceBelow100',
    'billingPeriodsMoreThan12Months',
    'billingPeriodsLessThan6Months',
    'billingPeriodsMoreThan10Years',
    'billingPeriodsLessThan3Years',
    'invalidBillingPeriods',
  ];

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    /**
     * Handle the different types of exception responses
     * getResponse() can return string | object
     */
    if (typeof exceptionResponse === 'string') {
      // If it's a string, return it in legacy format
      return response.status(status).json({
        message: exceptionResponse,
      });
    }

    /**
     * Type guard to check if the response has a message property
     * and if it's an array (indicating validation errors)
     */
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const responseObj = exceptionResponse as { message: unknown };

      if (
        Array.isArray(responseObj.message) &&
        responseObj.message.length > 0
      ) {
        /**
         * DECISION: Return the highest priority error code found
         * This matches the legacy if-else chain behavior where the first
         * matching condition determines the error response
         */
        const legacyErrorCode = this.getHighestPriorityError(
          responseObj.message as string[],
        );

        /**
         * Return legacy format with just the error code
         * Status remains 400 as in legacy implementation
         */
        return response.status(status).json({
          message: legacyErrorCode,
        });
      }

      /**
       * If message exists but is not an array, return it as is
       */
      if (typeof responseObj.message === 'string') {
        return response.status(status).json({
          message: responseObj.message,
        });
      }
    }

    /**
     * Default fallback for unexpected formats
     */
    return response.status(status).json({
      message: 'Bad Request',
    });
  }

  /**
   * Finds the highest priority error from the validation messages
   * based on the legacy code's if-else chain order
   */
  private getHighestPriorityError(messages: string[]): string {
    // Check each error in priority order
    for (const errorCode of this.errorPriority) {
      if (messages.some((msg) => msg.includes(errorCode))) {
        return errorCode;
      }
    }

    // If no known error code found, return the first message
    // This shouldn't happen with our custom validators
    return messages[0];
  }
}
