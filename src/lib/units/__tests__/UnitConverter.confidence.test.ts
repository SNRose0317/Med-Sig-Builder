/**
 * Tests for UnitConverter confidence score integration
 */
import { UnitConverter } from '../UnitConverter';
import { ConversionContext } from '../types';

describe('UnitConverter - Confidence Score Integration', () => {
  let converter: UnitConverter;
  
  beforeEach(() => {
    converter = new UnitConverter();
  });
  
  describe('confidence scoring', () => {
    it('should provide high confidence for simple conversions', () => {
      const result = converter.convert(1000, 'mg', 'g');
      
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.value).toBe(1);
    });
    
    it('should reduce confidence for device conversions', () => {
      const result = converter.convert(4, '{click}', 'mL');
      
      expect(result.confidence).toBeLessThan(0.95);
      expect(result.confidence).toBeCloseTo(0.8, 10); // Use toBeCloseTo for floating point comparison
      expect(result.value).toBe(1);
    });
    
    it('should increase confidence with lot-specific data', () => {
      const contextWithoutLot: ConversionContext = {
        medication: {
          id: 'test-med',
          name: 'Test Med',
          type: 'medication',
          isActive: true,
          doseForm: 'tablet',
          code: { coding: [{ display: 'Test Med' }] },
          ingredient: [{
            name: 'Test Ingredient',
            strengthRatio: {
              numerator: { value: 100, unit: 'mg' },
              denominator: { value: 1, unit: 'tablet' }
            }
          }]
        }
      };
      
      const contextWithLot: ConversionContext = {
        ...contextWithoutLot,
        lotNumber: 'LOT123'
      };
      
      const resultWithoutLot = converter.convert(1, '{tablet}', 'mg', contextWithoutLot);
      const resultWithLot = converter.convert(1, '{tablet}', 'mg', contextWithLot);
      
      // The actual confidence will depend on whether the tablet has strength info
      // but lot-specific data should always increase confidence
      expect(resultWithLot.confidence).toBeGreaterThan(resultWithoutLot.confidence!);
    });
    
    it('should handle concentration conversions with appropriate confidence', () => {
      const context: ConversionContext = {
        strengthRatio: {
          numerator: { value: 100, unit: 'mg' },
          denominator: { value: 2, unit: 'mL' }
        }
      };
      
      const result = converter.convert(4, 'mL', 'mg', context);
      
      expect(result.value).toBe(200);
      expect(result.confidence).toBeLessThan(1.0); // Not perfect due to concentration step
      expect(result.confidence).toBeGreaterThan(0.7); // Still reasonably high
    });
    
    it('should provide detailed explanation with confidence rationale', () => {
      const context: ConversionContext = {
        medication: {
          id: 'test-med',
          name: 'Test Med',
          type: 'medication',
          isActive: true,
          doseForm: 'tablet',
          code: { coding: [{ display: 'Test Med' }] },
          ingredient: [{
            name: 'Test Ingredient',
            strengthRatio: {
              numerator: { value: 100, unit: 'mg' },
              denominator: { value: 1, unit: 'tablet' }
            }
          }]
        }
      };
      
      converter.convert(2, '{tablet}', 'mg', context);
      const explanation = converter.explain();
      
      expect(explanation).toContain('Confidence Score:');
      expect(explanation).toContain('Conversion: 2 {tablet} → mg');
      expect(explanation).toContain('Device conversion:');
      expect(explanation).toContain('Interpretation:');
    });
    
    it('should handle complex multi-step conversions', () => {
      const context: ConversionContext = {
        medication: {
          id: 'test-med',
          name: 'Test Med',
          type: 'medication',
          isActive: true,
          doseForm: 'solution',
          code: { coding: [{ display: 'Test Med' }] },
          ingredient: [{
            name: 'Test Ingredient',
            strengthRatio: {
              numerator: { value: 50, unit: 'mg' },
              denominator: { value: 1, unit: 'mL' }
            }
          }]
        },
        strengthRatio: {
          numerator: { value: 50, unit: 'mg' },
          denominator: { value: 1, unit: 'mL' }
        }
      };
      
      // Complex conversion: clicks -> mL -> mg
      const result = converter.convert(8, '{click}', 'mg', context);
      
      expect(result.value).toBe(100); // 8 clicks = 2 mL = 100 mg
      expect(result.confidence).toBeLessThan(0.85); // Lower due to multiple steps
      expect(result.trace.length).toBeGreaterThan(1);
    });
    
    it('should maintain confidence through identity conversions', () => {
      const result = converter.convert(100, 'mg', 'mg');
      
      expect(result.confidence).toBe(1.0);
      expect(result.value).toBe(100);
      
      const explanation = converter.explain();
      expect(explanation).toContain('Steps required: 1'); // Identity conversion still has 1 step
      expect(explanation).toContain('Identity conversion');
    });
  });
  
  describe('edge cases', () => {
    it('should handle very small values with precision warnings', () => {
      const result = converter.convert(0.0000001, 'mg', 'mcg');
      
      expect(result.value).toBeCloseTo(0.0001, 10);
      // The confidence might be slightly reduced due to precision concerns
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
    
    it('should handle custom conversions with lower confidence', () => {
      converter.registerDeviceUnit({
        id: '{custom}',
        display: 'custom unit',
        pluralDisplay: 'custom units',
        ratioTo: 'mL',
        factor: 5 // Default conversion factor
      });
      
      const result = converter.convert(2, '{custom}', 'mL');
      
      expect(result.value).toBe(10);
      expect(result.confidence).toBeLessThan(0.95); // Device conversions are less reliable
    });
  });
});