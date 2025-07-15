/**
 * Conversion Error Classes for Unit Converter
 * 
 * This module defines explicit error types for unit conversion failures.
 * Following the principle of "fail fast and fail loud" - no silent failures.
 */

/**
 * Base error class for all conversion-related errors
 */
export abstract class ConversionError extends Error {
  abstract readonly errorType: string;
  
  constructor(
    message: string,
    public readonly details: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Serialize error for logging/debugging
   */
  toJSON(): Record<string, unknown> {
    return {
      errorType: this.errorType,
      message: this.message,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * Thrown when a conversion is mathematically or logically impossible
 * 
 * Examples:
 * - Converting mass to volume without density
 * - Converting temperature to length
 * - Converting incompatible unit dimensions
 */
export class ImpossibleConversionError extends ConversionError {
  readonly errorType = 'IMPOSSIBLE_CONVERSION';
  
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly reason: string
  ) {
    super(
      `Cannot convert from ${from} to ${to}: ${reason}`,
      { from, to, reason }
    );
  }
}

/**
 * Thrown when required context is missing for a conversion
 * 
 * Examples:
 * - mg → mL without concentration/strength ratio
 * - tablets → mg without tablet strength
 * - {click} → mg without device information
 */
export class MissingContextError extends ConversionError {
  readonly errorType = 'MISSING_CONTEXT';
  
  constructor(
    public readonly requiredContext: string[],
    public readonly conversion: string,
    public readonly availableContext?: Record<string, unknown>
  ) {
    super(
      `Missing required context for ${conversion}: ${requiredContext.join(', ')}`,
      { requiredContext, conversion, availableContext }
    );
  }
}

/**
 * Thrown when a unit string is malformed or unrecognized
 * 
 * Examples:
 * - "mgg" (typo)
 * - "{clicks" (missing closing brace)
 * - "mg/mL/L" (invalid structure)
 */
export class InvalidUnitError extends ConversionError {
  readonly errorType = 'INVALID_UNIT';
  
  constructor(
    public readonly unit: string,
    public readonly validationError?: string,
    public readonly suggestions?: string[]
  ) {
    super(
      `Invalid unit: ${unit}${validationError ? ` - ${validationError}` : ''}`,
      { unit, validationError, suggestions }
    );
  }
}

/**
 * Thrown when conversion would result in unacceptable precision loss
 * 
 * Examples:
 * - Converting very small doses where rounding would be significant
 * - Conversions that exceed the tolerance threshold
 */
export class PrecisionError extends ConversionError {
  readonly errorType = 'PRECISION_LOSS';
  
  constructor(
    public readonly value: number,
    public readonly from: string,
    public readonly to: string,
    public readonly expectedPrecision: number,
    public readonly actualPrecision: number
  ) {
    super(
      `Conversion of ${value} ${from} to ${to} would lose precision: ` +
      `expected ${expectedPrecision}, got ${actualPrecision}`,
      { value, from, to, expectedPrecision, actualPrecision }
    );
  }
}

/**
 * Error result type for functional error handling
 */
export interface ErrorResult<E extends ConversionError = ConversionError> {
  ok: false;
  error: E;
}

/**
 * Success result type for functional error handling
 */
export interface SuccessResult<T> {
  ok: true;
  value: T;
}

/**
 * Union type for conversion results
 */
export type ConversionResult<T, E extends ConversionError = ConversionError> = 
  | SuccessResult<T>
  | ErrorResult<E>;

/**
 * Type guard for error results
 */
export function isError<T, E extends ConversionError>(
  result: ConversionResult<T, E>
): result is ErrorResult<E> {
  return !result.ok;
}

/**
 * Type guard for success results
 */
export function isSuccess<T, E extends ConversionError>(
  result: ConversionResult<T, E>
): result is SuccessResult<T> {
  return result.ok;
}

/**
 * Helper to create success results
 */
export function success<T>(value: T): SuccessResult<T> {
  return { ok: true, value };
}

/**
 * Helper to create error results
 */
export function error<E extends ConversionError>(err: E): ErrorResult<E> {
  return { ok: false, error: err };
}

/**
 * Factory functions for creating specific errors with context
 */
export const ConversionErrors = {
  impossibleConversion(from: string, to: string, reason: string): ImpossibleConversionError {
    return new ImpossibleConversionError(from, to, reason);
  },

  missingContext(
    requiredContext: string[], 
    conversion: string,
    availableContext?: Record<string, unknown>
  ): MissingContextError {
    return new MissingContextError(requiredContext, conversion, availableContext);
  },

  invalidUnit(
    unit: string, 
    validationError?: string,
    suggestions?: string[]
  ): InvalidUnitError {
    return new InvalidUnitError(unit, validationError, suggestions);
  },

  precisionLoss(
    value: number,
    from: string,
    to: string,
    expectedPrecision: number,
    actualPrecision: number
  ): PrecisionError {
    return new PrecisionError(value, from, to, expectedPrecision, actualPrecision);
  }
} as const;