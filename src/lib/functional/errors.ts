/**
 * Error Types and Utilities
 * 
 * Provides structured error types for the medication signature builder
 * with consistent format for API responses and detailed error context.
 * 
 * @since 2.0.0
 */

import { DoseInput } from '../builders/ISignatureBuilder';
import { DoseConstraints } from '../builders/ISignatureBuilder';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  /** Input validation errors */
  VALIDATION = 'VALIDATION',
  /** Business rule violations */
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  /** Configuration or setup errors */
  CONFIGURATION = 'CONFIGURATION',
  /** External service failures */
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  /** Internal system errors */
  INTERNAL = 'INTERNAL'
}

/**
 * Structured error response for API consistency
 */
export interface ErrorResponse {
  /** Unique error code for client handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error context */
  details?: Record<string, unknown>;
  /** ISO timestamp of error occurrence */
  timestamp: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Suggested actions for recovery */
  suggestions?: string[];
}

/**
 * Creates a standard error response
 */
export function createError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  suggestions?: string[]
): ErrorResponse {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    ...(suggestions && { suggestions })
  };
}

/**
 * Dose validation error
 */
export interface DoseError {
  category: ErrorCategory.VALIDATION;
  field: 'dose';
  reason: 'negative_value' | 'exceeds_maximum' | 'invalid_unit' | 'zero_value';
  attempted: DoseInput;
  constraints?: DoseConstraints;
}

/**
 * Creates a dose error
 */
export function createDoseError(
  reason: DoseError['reason'],
  attempted: DoseInput,
  constraints?: DoseConstraints
): DoseError {
  return {
    category: ErrorCategory.VALIDATION,
    field: 'dose',
    reason,
    attempted,
    ...(constraints && { constraints })
  };
}

/**
 * Frequency validation error
 */
export interface FrequencyError {
  category: ErrorCategory.VALIDATION;
  field: 'frequency';
  reason: 'unrecognized_pattern' | 'ambiguous' | 'invalid_interval';
  input: string;
  suggestions?: string[];
}

/**
 * Creates a frequency error
 */
export function createFrequencyError(
  reason: FrequencyError['reason'],
  input: string,
  suggestions?: string[]
): FrequencyError {
  return {
    category: ErrorCategory.VALIDATION,
    field: 'frequency',
    reason,
    input,
    ...(suggestions && { suggestions })
  };
}

/**
 * Route validation error
 */
export interface RouteError {
  category: ErrorCategory.BUSINESS_LOGIC;
  field: 'route';
  reason: 'incompatible_dose_form' | 'not_allowed' | 'requires_device';
  route: string;
  doseForm: string;
  allowedRoutes?: string[];
}

/**
 * Creates a route error
 */
export function createRouteError(
  reason: RouteError['reason'],
  route: string,
  doseForm: string,
  allowedRoutes?: string[]
): RouteError {
  return {
    category: ErrorCategory.BUSINESS_LOGIC,
    field: 'route',
    reason,
    route,
    doseForm,
    ...(allowedRoutes && { allowedRoutes })
  };
}

/**
 * Type guard for ErrorResponse
 */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const obj = value as any;
  return (
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.timestamp === 'string'
  );
}

/**
 * Converts domain errors to ErrorResponse
 */
export function errorToResponse(error: DoseError | FrequencyError | RouteError): ErrorResponse {
  const baseCode = `${error.field.toUpperCase()}_${error.reason.toUpperCase()}`;
  
  switch (error.field) {
    case 'dose': {
      const doseError = error as DoseError;
      let message = '';
      
      switch (doseError.reason) {
        case 'negative_value':
          message = `Dose cannot be negative: ${doseError.attempted.value} ${doseError.attempted.unit}`;
          break;
        case 'zero_value':
          message = `Dose cannot be zero`;
          break;
        case 'exceeds_maximum':
          message = `Dose exceeds maximum allowed: ${doseError.attempted.value} ${doseError.attempted.unit}`;
          break;
        case 'invalid_unit':
          message = `Invalid dose unit: ${doseError.attempted.unit}`;
          break;
      }
      
      return createError(baseCode, message, {
        category: doseError.category,
        field: doseError.field,
        attempted: doseError.attempted,
        ...(doseError.constraints && { constraints: doseError.constraints })
      });
    }
    
    case 'frequency': {
      const freqError = error as FrequencyError;
      let message = '';
      
      switch (freqError.reason) {
        case 'unrecognized_pattern':
          message = `Unrecognized frequency pattern: ${freqError.input}`;
          break;
        case 'ambiguous':
          message = `Ambiguous frequency: ${freqError.input}`;
          break;
        case 'invalid_interval':
          message = `Invalid frequency interval: ${freqError.input}`;
          break;
      }
      
      return createError(
        baseCode, 
        message, 
        {
          category: freqError.category,
          field: freqError.field,
          input: freqError.input
        },
        freqError.suggestions
      );
    }
    
    case 'route': {
      const routeError = error as RouteError;
      let message = '';
      
      switch (routeError.reason) {
        case 'incompatible_dose_form':
          message = `Route "${routeError.route}" is incompatible with dose form "${routeError.doseForm}"`;
          break;
        case 'not_allowed':
          message = `Route "${routeError.route}" is not allowed for this medication`;
          break;
        case 'requires_device':
          message = `Route "${routeError.route}" requires a specific device`;
          break;
      }
      
      return createError(baseCode, message, {
        category: routeError.category,
        field: routeError.field,
        route: routeError.route,
        doseForm: routeError.doseForm,
        ...(routeError.allowedRoutes && { allowedRoutes: routeError.allowedRoutes })
      });
    }
    
    default:
      // Type safety: this should never happen
      const _exhaustive: never = error;
      throw new Error(`Unhandled error type: ${JSON.stringify(_exhaustive)}`);
  }
}