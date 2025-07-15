/**
 * Golden Master Tests
 * 
 * These tests compare the new UnitConverter implementation against
 * expected behaviors and edge cases from the existing calculations.
 */
import { UnitConverter } from '../UnitConverter';
import { ConversionContext } from '../types';
import fc from 'fast-check';

describe('Golden Master Tests', () => {
  let converter: UnitConverter;
  
  beforeEach(() => {
    converter = new UnitConverter();
  });
  
  describe('Medication-specific conversions', () => {
    it('should match Topiclick conversion: 4 clicks = 1 mL', () => {
      // Based on existing logic in calculations.ts
      const testCases = [
        { clicks: 4, expectedML: 1 },
        { clicks: 8, expectedML: 2 },
        { clicks: 12, expectedML: 3 },
        { clicks: 20, expectedML: 5 },
        { clicks: 100, expectedML: 25 }
      ];
      
      testCases.forEach(({ clicks, expectedML }) => {
        const result = converter.convert(clicks, '{click}', 'mL');
        expect(result.value).toBe(expectedML);
      });
    });
    
    it('should handle tablet to mg conversions with context', () => {
      const context: ConversionContext = {
        customConversions: [
          { from: '{tablet}', to: 'mg', factor: 100 }
        ]
      };
      
      const testCases = [
        { tablets: 1, expectedMg: 100 },
        { tablets: 0.5, expectedMg: 50 },
        { tablets: 1.5, expectedMg: 150 },
        { tablets: 2, expectedMg: 200 }
      ];
      
      testCases.forEach(({ tablets, expectedMg }) => {
        const result = converter.convert(tablets, '{tablet}', 'mg', context);
        expect(result.value).toBe(expectedMg);
      });
    });
    
    it('should handle concentration conversions matching calculations.ts pattern', () => {
      // Based on strength-based dosing in calculations.ts
      const context: ConversionContext = {
        strengthRatio: {
          numerator: { value: 100, unit: 'mg' },
          denominator: { value: 2, unit: 'mL' }
        }
      };
      
      // 100mg dose with 100mg/2mL concentration
      const result = converter.convert(100, 'mg', 'mL', context);
      expect(result.value).toBe(2); // Should need 2 mL to get 100 mg
    });
  });
  
  describe('Real-world medication scenarios', () => {
    it('should handle insulin conversions', () => {
      // Insulin is typically 100 units/mL
      // We'll register units as a device unit with this ratio
      
      // Common insulin doses
      const testCases = [
        { units: 10, expectedML: 0.1 },
        { units: 30, expectedML: 0.3 },
        { units: 50, expectedML: 0.5 }
      ];
      
      testCases.forEach(({ units, expectedML }) => {
        // Register 'units' as a custom device unit
        const unitConverter = new UnitConverter();
        unitConverter.registerDeviceUnit({
          id: '{unit}',
          display: 'unit',
          pluralDisplay: 'units',
          ratioTo: 'mL',
          factor: 0.01 // 100 units/mL
        });
        
        const result = unitConverter.convert(units, '{unit}', 'mL');
        expect(result.value).toBeCloseTo(expectedML, 6);
      });
    });
    
    it('should handle testosterone cypionate conversions', () => {
      const context: ConversionContext = {
        strengthRatio: {
          numerator: { value: 200, unit: 'mg' },
          denominator: { value: 1, unit: 'mL' }
        }
      };
      
      // Convert 100mg dose to mL
      const result = converter.convert(100, 'mg', 'mL', context);
      expect(result.value).toBe(0.5); // 100mg ÷ 200mg/mL = 0.5mL
    });
    
    it('should handle liquid medications with drops', () => {
      // Standard: 20 drops = 1 mL
      const testCases = [
        { drops: 20, expectedML: 1 },
        { drops: 10, expectedML: 0.5 },
        { drops: 5, expectedML: 0.25 },
        { drops: 40, expectedML: 2 }
      ];
      
      testCases.forEach(({ drops, expectedML }) => {
        const result = converter.convert(drops, '{drop}', 'mL');
        expect(result.value).toBeCloseTo(expectedML, 6);
      });
    });
  });
  
  describe('Differential testing with property-based generation', () => {
    it('should handle fractional tablet doses correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 8 }), // quarters, halves, etc.
          fc.integer({ min: 25, max: 1000 }), // mg per tablet
          (fractionDenominator, mgPerTablet) => {
            const tablets = 1 / fractionDenominator;
            const context: ConversionContext = {
              customConversions: [
                { from: '{tablet}', to: 'mg', factor: mgPerTablet }
              ]
            };
            
            const result = converter.convert(tablets, '{tablet}', 'mg', context);
            const expectedMg = tablets * mgPerTablet;
            
            // Check calculation matches expected
            expect(result.value).toBeCloseTo(expectedMg, 6);
            
            // Always return true - we're just testing calculation accuracy
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });
    
    it('should maintain precision for concentration calculations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (mgNumerator, mgDose, mlDenominator) => {
            const context: ConversionContext = {
              strengthRatio: {
                numerator: { value: mgNumerator, unit: 'mg' },
                denominator: { value: mlDenominator, unit: 'mL' }
              }
            };
            
            // Convert mg dose to mL
            const result = converter.convert(mgDose, 'mg', 'mL', context);
            
            // Verify calculation: dose ÷ (strength/volume) = volume needed
            const expectedML = mgDose / (mgNumerator / mlDenominator);
            
            expect(result.value).toBeCloseTo(expectedML, 6);
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
  
  describe('Edge cases from real-world usage', () => {
    it('should handle very small pediatric doses', () => {
      const context: ConversionContext = {
        strengthRatio: {
          numerator: { value: 2.5, unit: 'mg' },
          denominator: { value: 1, unit: 'mL' }
        }
      };
      
      // Pediatric dose: 0.1 mg
      const result = converter.convert(0.1, 'mg', 'mL', context);
      expect(result.value).toBeCloseTo(0.04, 6); // 0.1 ÷ 2.5 = 0.04 mL
    });
    
    it('should handle high-dose vitamin D conversions', () => {
      // Register IU as a custom device unit
      const unitConverter = new UnitConverter();
      unitConverter.registerDeviceUnit({
        id: '{IU}',
        display: 'IU',
        pluralDisplay: 'IU',
        ratioTo: 'mcg',
        factor: 0.025 // 1 mcg = 40 IU for vitamin D3
      });
      
      // 50,000 IU weekly dose
      const result = unitConverter.convert(50000, '{IU}', 'mcg');
      expect(result.value).toBe(1250); // 50,000 × 0.025 = 1,250 mcg
    });
    
    it('should handle topical cream applications', () => {
      // Register FTU as a custom device unit
      const unitConverter = new UnitConverter();
      unitConverter.registerDeviceUnit({
        id: '{FTU}',
        display: 'FTU',
        pluralDisplay: 'FTUs',
        ratioTo: 'g',
        factor: 0.5 // 1 FTU ≈ 0.5 g
      });
      
      // 2 FTUs for face application
      const result = unitConverter.convert(2, '{FTU}', 'g');
      expect(result.value).toBe(1); // 2 × 0.5 = 1 g
    });
  });
  
  describe('Validation against known conversions', () => {
    const knownConversions = [
      // Mass conversions
      { value: 1000, from: 'mg', to: 'g', expected: 1 },
      { value: 1, from: 'g', to: 'mg', expected: 1000 },
      { value: 1000, from: 'mcg', to: 'mg', expected: 1 },
      { value: 1000, from: 'g', to: 'kg', expected: 1 },
      
      // Volume conversions
      { value: 1000, from: 'mL', to: 'L', expected: 1 },
      { value: 1, from: 'L', to: 'mL', expected: 1000 },
      { value: 1000, from: 'μL', to: 'mL', expected: 1 },
      
      // Device conversions
      { value: 4, from: '{click}', to: 'mL', expected: 1 },
      { value: 20, from: '{drop}', to: 'mL', expected: 1 }
    ];
    
    it.each(knownConversions)(
      'should convert $value $from to $expected $to',
      ({ value, from, to, expected }) => {
        const result = converter.convert(value, from, to);
        expect(result.value).toBeCloseTo(expected, 6);
      }
    );
  });
  
  describe('Error case validation', () => {
    it('should handle error cases consistently with existing patterns', () => {
      // Based on areUnitsCompatible logic in calculations.ts
      const incompatiblePairs = [
        ['mg', 'tablet'],  // Without context
        ['mL', 'capsule'], // Without context
        ['g', 'click'],    // Without intermediate conversion
      ];
      
      incompatiblePairs.forEach(([unit1, unit2]) => {
        // Should throw without proper context
        expect(() => converter.convert(1, unit1, unit2)).toThrow();
      });
    });
  });
});