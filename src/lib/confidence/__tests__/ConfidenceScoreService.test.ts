/**
 * Tests for ConfidenceScoreService
 */
import { ConfidenceScoreService } from '../ConfidenceScoreService';
import { ConversionTrace, ConfidenceLevel } from '../types';
import { ConversionStep } from '../../units/types';

describe('ConfidenceScoreService', () => {
  let service: ConfidenceScoreService;
  
  beforeEach(() => {
    service = new ConfidenceScoreService();
  });
  
  describe('calculate', () => {
    it('should return perfect score for identity conversion', () => {
      const trace: ConversionTrace = {
        steps: [],
        request: { value: 100, fromUnit: 'mg', toUnit: 'mg' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      
      expect(result.score).toBe(1.0);
      expect(result.level).toBe('high');
      expect(result.rationale).toContain('No conversion needed - units are identical');
    });
    
    it('should give high confidence for direct UCUM conversion', () => {
      const trace: ConversionTrace = {
        steps: [{
          description: 'Convert mg to g',
          fromValue: 1000,
          fromUnit: 'mg',
          toValue: 1,
          toUnit: 'g',
          factor: 0.001,
          type: 'standard'
        }],
        request: { value: 1000, fromUnit: 'mg', toUnit: 'g' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      
      expect(result.score).toBeGreaterThanOrEqual(0.9);
      expect(result.level).toBe('high');
      expect(result.rationale).toContain('Direct conversion between units');
    });
    
    it('should reduce confidence for device conversions', () => {
      const trace: ConversionTrace = {
        steps: [{
          description: 'Convert clicks to mL using 4:1 ratio',
          fromValue: 4,
          fromUnit: '{click}',
          toValue: 1,
          toUnit: 'mL',
          factor: 0.25,
          type: 'device'
        }],
        request: { value: 4, fromUnit: '{click}', toUnit: 'mL' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      
      expect(result.score).toBeLessThan(0.95);
      expect(result.adjustments).toContainEqual(
        expect.objectContaining({
          reason: expect.stringContaining('Device conversion'),
          category: 'reliability'
        })
      );
    });
    
    it('should boost confidence for lot-specific data', () => {
      const baseTrace: ConversionTrace = {
        steps: [{
          description: 'Convert tablet to mg',
          fromValue: 1,
          fromUnit: '{tablet}',
          toValue: 100,
          toUnit: 'mg',
          factor: 100,
          type: 'device'
        }],
        request: { value: 1, fromUnit: '{tablet}', toUnit: 'mg' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const lotSpecificTrace = { ...baseTrace, hasLotSpecificData: true };
      
      const baseResult = service.calculate(baseTrace);
      const lotResult = service.calculate(lotSpecificTrace);
      
      expect(lotResult.score).toBeGreaterThan(baseResult.score);
      expect(lotResult.adjustments).toContainEqual(
        expect.objectContaining({
          reason: 'Lot-specific conversion data available',
          value: 0.10
        })
      );
    });
    
    it('should penalize missing context', () => {
      const trace: ConversionTrace = {
        steps: [{
          description: 'Convert using default ratio',
          fromValue: 1,
          fromUnit: '{tablet}',
          toValue: 100,
          toUnit: 'mg',
          type: 'device'
        }],
        request: { value: 1, fromUnit: '{tablet}', toUnit: 'mg' },
        usedDefaults: true,
        hasLotSpecificData: false,
        missingRequiredContext: true,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      
      expect(result.score).toBeLessThan(0.7);
      expect(result.level).toBe('low' as ConfidenceLevel);
      expect(result.adjustments).toContainEqual(
        expect.objectContaining({
          reason: 'Missing required context data',
          value: -0.20
        })
      );
    });
    
    it('should handle complex multi-step conversions', () => {
      const trace: ConversionTrace = {
        steps: [
          {
            description: 'Convert tablet to mg',
            fromValue: 2,
            fromUnit: '{tablet}',
            toValue: 200,
            toUnit: 'mg',
            type: 'device'
          },
          {
            description: 'Convert mg to g',
            fromValue: 200,
            fromUnit: 'mg',
            toValue: 0.2,
            toUnit: 'g',
            type: 'standard'
          },
          {
            description: 'Apply concentration',
            fromValue: 0.2,
            fromUnit: 'g',
            toValue: 2,
            toUnit: 'mL',
            type: 'concentration'
          }
        ],
        request: { value: 2, fromUnit: '{tablet}', toUnit: 'mL' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      
      expect(result.score).toBeLessThan(0.8);
      // With 3 steps including device and concentration conversions, score will be lower
      expect(result.level).toBe('low' as ConfidenceLevel);
      expect(result.rationale).toContain('Multi-step conversion requiring 3 steps');
    });
    
    it('should detect precision concerns for very small values', () => {
      const trace: ConversionTrace = {
        steps: [{
          description: 'Convert ng to pg',
          fromValue: 0.0000001,  // Even smaller value to trigger precision concern
          fromUnit: 'ng',
          toValue: 0.0001,
          toUnit: 'pg',
          type: 'standard'
        }],
        request: { value: 0.0000001, fromUnit: 'ng', toUnit: 'pg' },  // Updated to match
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      
      expect(result.adjustments).toContainEqual(
        expect.objectContaining({
          reason: 'Floating-point precision loss possible',
          category: 'precision'
        })
      );
    });
    
    it('should penalize approximations', () => {
      const trace: ConversionTrace = {
        steps: [{
          description: 'Approximate conversion',
          fromValue: 1,
          fromUnit: 'tsp',
          toValue: 5,
          toUnit: 'mL',
          type: 'custom'
        }],
        request: { value: 1, fromUnit: 'tsp', toUnit: 'mL' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: true,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      
      expect(result.adjustments).toContainEqual(
        expect.objectContaining({
          reason: 'Approximations required',
          value: -0.15
        })
      );
    });
    
    it('should boost confidence for rational arithmetic', () => {
      const trace: ConversionTrace = {
        steps: [{
          description: 'Exact fraction conversion',
          fromValue: 1.5,
          fromUnit: '{tablet}',
          toValue: 150,
          toUnit: 'mg',
          type: 'device'
        }],
        request: { value: 1.5, fromUnit: '{tablet}', toUnit: 'mg' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: true
      };
      
      const result = service.calculate(trace);
      
      expect(result.adjustments).toContainEqual(
        expect.objectContaining({
          reason: 'Using rational number arithmetic',
          value: 0.05
        })
      );
    });
  });
  
  describe('explain', () => {
    it('should generate comprehensive explanation', () => {
      const trace: ConversionTrace = {
        steps: [
          {
            description: 'Convert tablet to mg',
            fromValue: 1,
            fromUnit: '{tablet}',
            toValue: 100,
            toUnit: 'mg',
            factor: 100,
            type: 'device'
          },
          {
            description: 'Convert mg to mL using concentration',
            fromValue: 100,
            fromUnit: 'mg',
            toValue: 2,
            toUnit: 'mL',
            factor: 0.02,
            type: 'concentration'
          }
        ],
        request: { value: 1, fromUnit: '{tablet}', toUnit: 'mL' },
        usedDefaults: true,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      const explanation = result.explain();
      
      expect(explanation).toContain('Confidence Score:');
      expect(explanation).toContain('Conversion: 1 {tablet} → mL');
      expect(explanation).toContain('Steps required: 2');
      expect(explanation).toContain('Conversion path:');
      expect(explanation).toContain('Convert tablet to mg');
      expect(explanation).toContain('Convert mg to mL using concentration');
      expect(explanation).toContain('Base score:');
      expect(explanation).toContain('Adjustments:');
      expect(explanation).toContain('Using default conversion factors');
      expect(explanation).toContain('Final score:');
      expect(explanation).toContain('Interpretation:');
    });
  });
  
  describe('confidence levels', () => {
    it('should map high scores to high confidence', () => {
      // Identity conversion should have very high score
      const trace: ConversionTrace = {
        steps: [{
          description: 'Identity conversion',
          fromValue: 1,
          fromUnit: 'mg',
          toValue: 1,
          toUnit: 'mg',
          type: 'standard'
        }],
        request: { value: 1, fromUnit: 'mg', toUnit: 'mg' },
        usedDefaults: false,
        hasLotSpecificData: false,
        missingRequiredContext: false,
        hasApproximations: false,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      expect(result.score).toBeGreaterThanOrEqual(0.9);
      expect(result.level).toBe('high');
    });
    
    it('should map lower scores appropriately', () => {
      // Complex conversion with many steps
      const trace: ConversionTrace = {
        steps: [
          { description: 'Step 1', fromValue: 1, fromUnit: 'a', toValue: 2, toUnit: 'b', type: 'custom' },
          { description: 'Step 2', fromValue: 2, fromUnit: 'b', toValue: 3, toUnit: 'c', type: 'custom' },
          { description: 'Step 3', fromValue: 3, fromUnit: 'c', toValue: 4, toUnit: 'd', type: 'custom' },
          { description: 'Step 4', fromValue: 4, fromUnit: 'd', toValue: 5, toUnit: 'e', type: 'custom' }
        ],
        request: { value: 1, fromUnit: 'a', toUnit: 'e' },
        usedDefaults: true,
        hasLotSpecificData: false,
        missingRequiredContext: true,
        hasApproximations: true,
        usedRationalArithmetic: false
      };
      
      const result = service.calculate(trace);
      expect(result.score).toBeLessThan(0.9);
      expect(['medium', 'low', 'very-low']).toContain(result.level);
    });
  });
  
  describe('createTraceFromSteps', () => {
    it('should create trace from conversion steps', () => {
      const steps: ConversionStep[] = [
        {
          description: 'Test step',
          fromValue: 1,
          fromUnit: 'mg',
          toValue: 1000,
          toUnit: 'mcg',
          type: 'standard'
        }
      ];
      
      const trace = service.createTraceFromSteps(
        steps,
        { value: 1, fromUnit: 'mg', toUnit: 'mcg' },
        { usedDefaults: true, hasLotSpecificData: false }
      );
      
      expect(trace.steps).toEqual(steps);
      expect(trace.request).toEqual({ value: 1, fromUnit: 'mg', toUnit: 'mcg' });
      expect(trace.usedDefaults).toBe(true);
      expect(trace.hasLotSpecificData).toBe(false);
      expect(trace.missingRequiredContext).toBe(false);
    });
  });
});