/**
 * Tests for Conversions API
 */
import {
  calculateConfidence,
  validateUnits,
  getCompatibleUnits,
  isErrorResponse,
  type ConfidenceRequest,
  type ConfidenceResponse,
  type ErrorResponse
} from '../conversions';

describe('Conversions API', () => {
  describe('calculateConfidence', () => {
    it('should calculate confidence for simple conversion', async () => {
      const request: ConfidenceRequest = {
        value: 1000,
        fromUnit: 'mg',
        toUnit: 'g'
      };
      
      const response = await calculateConfidence(request);
      
      expect(isErrorResponse(response)).toBe(false);
      
      const result = response as ConfidenceResponse;
      expect(result.conversion.to.value).toBe(1);
      expect(result.conversion.to.unit).toBe('g');
      expect(result.confidence.score).toBeGreaterThanOrEqual(0.9);
      expect(result.confidence.level).toBe('high');
      expect(result.metadata.version).toBe('2.0.0');
      expect(result.metadata.traceId).toMatch(/^conv-\d+-[a-z0-9]+$/);
    });
    
    it('should include trace when requested', async () => {
      const request: ConfidenceRequest = {
        value: 4,
        fromUnit: '{click}',
        toUnit: 'mL',
        options: {
          enableTrace: true,
          traceFormat: 'json'
        }
      };
      
      const response = await calculateConfidence(request);
      const result = response as ConfidenceResponse;
      
      expect(result.trace).toBeDefined();
      const trace = JSON.parse(result.trace!);
      expect(trace.traces).toBeInstanceOf(Array);
      expect(trace.summary).toBeDefined();
    });
    
    it('should handle concentration conversions', async () => {
      const request: ConfidenceRequest = {
        value: 2,
        fromUnit: 'mL',
        toUnit: 'mg',
        context: {
          strengthRatio: {
            numerator: { value: 100, unit: 'mg' },
            denominator: { value: 1, unit: 'mL' }
          }
        }
      };
      
      const response = await calculateConfidence(request);
      const result = response as ConfidenceResponse;
      
      expect(result.conversion.to.value).toBe(200);
      expect(result.confidence.factors).toBeDefined();
      expect(result.conversion.steps.length).toBeGreaterThan(0);
    });
    
    it('should handle custom conversions', async () => {
      const request: ConfidenceRequest = {
        value: 2,
        fromUnit: '{tablet}',
        toUnit: 'mg',
        context: {
          customConversions: [
            { deviceUnit: '{tablet}', factor: 50 }
          ]
        }
      };
      
      const response = await calculateConfidence(request);
      const result = response as ConfidenceResponse;
      
      expect(result.conversion.to.value).toBe(100);
      expect(result.confidence.score).toBeLessThan(1.0); // Custom conversions reduce confidence
    });
    
    it('should return error for invalid request', async () => {
      const request = {
        value: 'invalid' as unknown as number,
        fromUnit: 'mg',
        toUnit: 'g'
      };
      
      const response = await calculateConfidence(request);
      
      expect(isErrorResponse(response)).toBe(true);
      
      const error = response as ErrorResponse;
      expect(error.error).toBe('Error');
      expect(error.message).toContain('Invalid value');
      expect(error.traceId).toBeDefined();
    });
    
    it('should return error for invalid units', async () => {
      const request: ConfidenceRequest = {
        value: 100,
        fromUnit: 'invalid-unit',
        toUnit: 'mg'
      };
      
      const response = await calculateConfidence(request);
      
      expect(isErrorResponse(response)).toBe(true);
      
      const error = response as ErrorResponse;
      expect(error.message).toContain('Invalid unit');
    });
    
    it('should include lot number context', async () => {
      const request: ConfidenceRequest = {
        value: 1,
        fromUnit: '{tablet}',
        toUnit: 'mg',
        context: {
          lotNumber: 'LOT123',
          customConversions: [
            { deviceUnit: '{tablet}', factor: 100 }
          ]
        }
      };
      
      const response = await calculateConfidence(request);
      const result = response as ConfidenceResponse;
      
      // Lot-specific data should increase confidence
      expect(result.confidence.rationale).toContainEqual(
        expect.stringContaining('Lot-specific')
      );
    });
  });
  
  describe('validateUnits', () => {
    it('should validate multiple units', async () => {
      const response = await validateUnits({
        units: ['mg', 'invalid-unit', '{tablet}', 'mL']
      });
      
      expect(response.results).toHaveLength(4);
      
      const mgResult = response.results.find(r => r.unit === 'mg');
      expect(mgResult?.valid).toBe(true);
      expect(mgResult?.type).toBe('standard');
      
      const invalidResult = response.results.find(r => r.unit === 'invalid-unit');
      expect(invalidResult?.valid).toBe(false);
      expect(invalidResult?.error).toBeDefined();
      
      const tabletResult = response.results.find(r => r.unit === '{tablet}');
      expect(tabletResult?.valid).toBe(true);
      expect(tabletResult?.type).toBe('device');
    });
    
    it('should provide suggestions for invalid units', async () => {
      const response = await validateUnits({
        units: ['miligram']
      });
      
      const result = response.results[0];
      expect(result.valid).toBe(false);
      expect(result.suggestions).toContain('mg');
    });
  });
  
  describe('getCompatibleUnits', () => {
    it('should return compatible units for standard unit', async () => {
      const response = await getCompatibleUnits({
        unit: 'mg'
      });
      
      expect(response.unit).toBe('mg');
      expect(response.compatibleUnits.length).toBeGreaterThan(0);
      
      const gUnit = response.compatibleUnits.find(u => u.code === 'g');
      expect(gUnit).toBeDefined();
      expect(gUnit?.isCustom).toBe(false);
    });
    
    it('should return compatible units for device unit', async () => {
      const response = await getCompatibleUnits({
        unit: '{tablet}'
      });
      
      expect(response.compatibleUnits.length).toBeGreaterThan(0);
      
      // Should include the unit itself
      const tabletUnit = response.compatibleUnits.find(u => u.code === '{tablet}');
      expect(tabletUnit).toBeDefined();
      expect(tabletUnit?.isCustom).toBe(true);
      
      // Should include compatible standard units (mg)
      const mgUnit = response.compatibleUnits.find(u => u.code === 'mg');
      expect(mgUnit).toBeDefined();
    });
  });
  
  describe('trace formats', () => {
    const request: ConfidenceRequest = {
      value: 1000,
      fromUnit: 'mcg',
      toUnit: 'mg',
      options: { enableTrace: true }
    };
    
    it('should export trace as JSON', async () => {
      const response = await calculateConfidence({
        ...request,
        options: { ...request.options, traceFormat: 'json' }
      });
      
      const result = response as ConfidenceResponse;
      expect(result.trace).toBeDefined();
      
      const trace = JSON.parse(result.trace!);
      expect(trace.traces).toBeInstanceOf(Array);
    });
    
    it('should export trace as DOT', async () => {
      const response = await calculateConfidence({
        ...request,
        options: { ...request.options, traceFormat: 'dot' }
      });
      
      const result = response as ConfidenceResponse;
      expect(result.trace).toBeDefined();
      expect(result.trace).toContain('digraph ConversionTrace');
      expect(result.trace).toContain('->');
    });
    
    it('should export trace as text', async () => {
      const response = await calculateConfidence({
        ...request,
        options: { ...request.options, traceFormat: 'text' }
      });
      
      const result = response as ConfidenceResponse;
      expect(result.trace).toBeDefined();
      expect(result.trace).toContain('=== Conversion Trace ===');
      expect(result.trace).toContain('mcg to mg');
    });
  });
});