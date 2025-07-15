/**
 * React hook for interacting with the Conversions API
 */
import { useState, useCallback } from 'react';
import type {
  ConfidenceRequest,
  ConfidenceResponse,
  ErrorResponse,
  ValidateUnitsRequest,
  ValidateUnitsResponse,
  CompatibleUnitsRequest,
  CompatibleUnitsResponse
} from '../api/conversions';

/**
 * API base URL - in production this would point to your API server
 */
const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v2' // Production API URL
  : '/api/v2'; // Development uses Vite proxy

/**
 * Hook state interface
 */
interface UseConversionAPIState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook for using the Conversions API
 */
export function useConversionAPI() {
  const [state, setState] = useState<UseConversionAPIState>({
    loading: false,
    error: null
  });
  
  /**
   * Calculate conversion with confidence
   */
  const calculateConfidence = useCallback(async (
    request: ConfidenceRequest
  ): Promise<ConfidenceResponse | null> => {
    setState({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversions/confidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = data as ErrorResponse;
        throw new Error(error.message || 'Conversion failed');
      }
      
      setState({ loading: false, error: null });
      return data as ConfidenceResponse;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setState({ loading: false, error: message });
      return null;
    }
  }, []);
  
  /**
   * Validate units
   */
  const validateUnits = useCallback(async (
    units: string[]
  ): Promise<ValidateUnitsResponse | null> => {
    setState({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/units/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ units } as ValidateUnitsRequest)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Validation failed');
      }
      
      setState({ loading: false, error: null });
      return data as ValidateUnitsResponse;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setState({ loading: false, error: message });
      return null;
    }
  }, []);
  
  /**
   * Get compatible units
   */
  const getCompatibleUnits = useCallback(async (
    unit: string
  ): Promise<CompatibleUnitsResponse | null> => {
    setState({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/units/compatible`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ unit } as CompatibleUnitsRequest)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to get compatible units');
      }
      
      setState({ loading: false, error: null });
      return data as CompatibleUnitsResponse;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setState({ loading: false, error: message });
      return null;
    }
  }, []);
  
  /**
   * Convert with trace for debugging
   */
  const convertWithTrace = useCallback(async (
    value: number,
    fromUnit: string,
    toUnit: string,
    format: 'json' | 'dot' | 'text' = 'text'
  ): Promise<{ result: ConfidenceResponse; trace: string } | null> => {
    const response = await calculateConfidence({
      value,
      fromUnit,
      toUnit,
      options: {
        enableTrace: true,
        traceFormat: format
      }
    });
    
    if (!response || !response.trace) {
      return null;
    }
    
    return {
      result: response,
      trace: response.trace
    };
  }, [calculateConfidence]);
  
  return {
    ...state,
    calculateConfidence,
    validateUnits,
    getCompatibleUnits,
    convertWithTrace
  };
}

/**
 * Example usage in a component:
 * 
 * ```tsx
 * function ConversionComponent() {
 *   const { calculateConfidence, loading, error } = useConversionAPI();
 *   
 *   const handleConvert = async () => {
 *     const result = await calculateConfidence({
 *       value: 1000,
 *       fromUnit: 'mg',
 *       toUnit: 'g'
 *     });
 *     
 *     if (result) {
 *       console.log(`Result: ${result.conversion.to.value} ${result.conversion.to.unit}`);
 *       console.log(`Confidence: ${result.confidence.score} (${result.confidence.level})`);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleConvert} disabled={loading}>
 *         Convert
 *       </button>
 *       {error && <p>Error: {error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */