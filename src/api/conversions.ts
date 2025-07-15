/**
 * Conversions API
 * 
 * Provides REST endpoints for unit conversions with confidence scoring.
 * This module exports functions that can be used in a serverless environment
 * or integrated with a Node.js server.
 */
import { UnitConverter } from '../lib/units/UnitConverter';
import { ConversionContext } from '../lib/units/types';
import { ConversionTracer } from '../lib/tracing/ConversionTracer';

/**
 * API version for metadata
 */
const API_VERSION = '2.0.0';

/**
 * Request schema for confidence endpoint
 */
export interface ConfidenceRequest {
  value: number;
  fromUnit: string;
  toUnit: string;
  context?: {
    medicationId?: string;
    lotNumber?: string;
    strengthRatio?: {
      numerator: { value: number; unit: string };
      denominator: { value: number; unit: string };
    };
    customConversions?: Array<{
      deviceUnit: string;
      factor: number;
    }>;
  };
  options?: {
    enableTrace?: boolean;
    traceFormat?: 'json' | 'dot' | 'text';
  };
}

/**
 * Response schema for confidence endpoint
 */
export interface ConfidenceResponse {
  confidence: {
    score: number;
    level: 'high' | 'medium' | 'low' | 'very-low';
    rationale: string[];
    factors?: {
      complexity: number;
      dataCompleteness: number;
      precision: number;
    };
  };
  conversion: {
    from: { value: number; unit: string };
    to: { value: number; unit: string };
    steps: string[];
  };
  metadata: {
    calculatedAt: string;
    version: string;
    traceId: string;
  };
  trace?: string;
}

/**
 * Error response schema
 */
export interface ErrorResponse {
  error: string;
  message: string;
  traceId: string;
  details?: Record<string, unknown>;
}

/**
 * Generate a unique trace ID
 */
function generateTraceId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate conversion confidence
 * 
 * This is the main endpoint handler that can be used in various server environments.
 */
export async function calculateConfidence(
  request: ConfidenceRequest
): Promise<ConfidenceResponse | ErrorResponse> {
  const traceId = generateTraceId();
  
  try {
    // Validate request
    if (!request.value || typeof request.value !== 'number') {
      throw new Error('Invalid value: must be a number');
    }
    if (!request.fromUnit || typeof request.fromUnit !== 'string') {
      throw new Error('Invalid fromUnit: must be a string');
    }
    if (!request.toUnit || typeof request.toUnit !== 'string') {
      throw new Error('Invalid toUnit: must be a string');
    }
    
    // Create tracer if trace is requested
    const tracer = request.options?.enableTrace 
      ? new ConversionTracer({ enabled: true })
      : undefined;
    
    // Create converter with tracer
    const converter = new UnitConverter(
      undefined,
      undefined,
      undefined,
      tracer
    );
    
    // Build conversion context
    const context: ConversionContext = {};
    
    if (request.context?.strengthRatio) {
      context.strengthRatio = request.context.strengthRatio;
    }
    
    if (request.context?.customConversions) {
      // Convert API format to internal format
      context.customConversions = request.context.customConversions.map(cc => {
        // Determine the target unit based on the device unit type
        let toUnit = 'mg'; // Default for tablets/capsules
        
        // For liquid devices, convert to mL
        if (cc.deviceUnit === '{click}' || cc.deviceUnit === '{drop}' || 
            cc.deviceUnit === '{spray}' || cc.deviceUnit === '{puff}') {
          toUnit = 'mL';
        }
        
        return {
          from: cc.deviceUnit,
          to: toUnit,
          factor: cc.factor
        };
      });
    }
    
    if (request.context?.lotNumber) {
      context.lotNumber = request.context.lotNumber;
    }
    
    // Perform conversion
    const result = converter.convert(
      request.value,
      request.fromUnit,
      request.toUnit,
      context
    );
    
    // Get confidence details
    const lastConfidence = (converter as any).lastConfidenceScore;
    
    // Build response
    const response: ConfidenceResponse = {
      confidence: {
        score: result.confidence || 0,
        level: lastConfidence?.level || 'low',
        rationale: lastConfidence?.rationale || [],
        factors: lastConfidence?.factors
      },
      conversion: {
        from: { value: request.value, unit: request.fromUnit },
        to: { value: result.value, unit: result.toUnit || request.toUnit },
        steps: result.trace.map(step => step.description)
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: API_VERSION,
        traceId
      }
    };
    
    // Add trace if requested
    if (request.options?.enableTrace && tracer) {
      const format = request.options.traceFormat || 'json';
      response.trace = converter.exportTrace(format);
    }
    
    return response;
    
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.constructor.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      traceId
    };
    
    // Add error details if available
    if (error instanceof Error && 'code' in error) {
      errorResponse.details = { code: (error as any).code };
    }
    
    return errorResponse;
  }
}

/**
 * Validate units endpoint
 */
export interface ValidateUnitsRequest {
  units: string[];
}

export interface ValidateUnitsResponse {
  results: Array<{
    unit: string;
    valid: boolean;
    normalized?: string;
    type?: 'standard' | 'device' | 'compound';
    error?: string;
    suggestions?: string[];
  }>;
}

/**
 * Validate multiple units
 */
export async function validateUnits(
  request: ValidateUnitsRequest
): Promise<ValidateUnitsResponse> {
  const converter = new UnitConverter();
  
  const results = request.units.map(unit => {
    const validation = converter.validate(unit);
    
    return {
      unit,
      valid: validation.valid,
      normalized: validation.normalized,
      type: validation.type,
      error: validation.error,
      suggestions: validation.suggestions
    };
  });
  
  return { results };
}

/**
 * Get compatible units endpoint
 */
export interface CompatibleUnitsRequest {
  unit: string;
}

export interface CompatibleUnitsResponse {
  unit: string;
  compatibleUnits: Array<{
    code: string;
    display: string;
    isCustom: boolean;
    dimension?: string;
  }>;
}

/**
 * Get units compatible with a given unit
 */
export async function getCompatibleUnits(
  request: CompatibleUnitsRequest
): Promise<CompatibleUnitsResponse> {
  const converter = new UnitConverter();
  const compatibleUnits = converter.getCompatibleUnits(request.unit);
  
  return {
    unit: request.unit,
    compatibleUnits
  };
}

/**
 * Helper to check if a response is an error
 */
export function isErrorResponse(
  response: ConfidenceResponse | ErrorResponse
): response is ErrorResponse {
  return 'error' in response;
}