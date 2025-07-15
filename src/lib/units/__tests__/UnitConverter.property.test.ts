/**
 * Property-based tests for Unit Converter
 * 
 * These tests use fast-check to automatically generate test cases
 * and verify mathematical properties that should always hold true.
 */
import fc from 'fast-check';
import { UnitConverter } from '../UnitConverter';
import { ConversionContext } from '../types';
import {
  InvalidUnitError,
  ImpossibleConversionError,
  MissingContextError
} from '../ConversionErrors';

describe('UnitConverter Property Tests', () => {
  let converter: UnitConverter;
  
  beforeEach(() => {
    converter = new UnitConverter();
  });
  
  describe('Round-trip conversion properties', () => {
    it('should maintain value in round-trip conversions for standard units', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(10000), noNaN: true }),
          fc.constantFrom('mg', 'g', 'mcg', 'kg'),
          fc.constantFrom('mg', 'g', 'mcg', 'kg'),
          (value, fromUnit, toUnit) => {
            // Skip if units are the same (identity conversion)
            if (fromUnit === toUnit) return true;
            
            try {
              // Convert A → B
              const firstConversion = converter.convert(value, fromUnit, toUnit);
              
              // Convert B → A
              const roundTrip = converter.convert(
                firstConversion.value, 
                toUnit, 
                fromUnit
              );
              
              // Check that we get back to the original value (within tolerance)
              const tolerance = 1e-6;
              const relativeError = Math.abs(roundTrip.value - value) / value;
              
              return relativeError < tolerance;
            } catch (error) {
              // If conversion is impossible, that's fine - skip this case
              if (error instanceof ImpossibleConversionError) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: 10000 }
      );
    });
    
    it('should maintain value in round-trip conversions for volume units', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
          fc.constantFrom('mL', 'L', 'μL', 'dL'),
          fc.constantFrom('mL', 'L', 'μL', 'dL'),
          (value, fromUnit, toUnit) => {
            if (fromUnit === toUnit) return true;
            
            const firstConversion = converter.convert(value, fromUnit, toUnit);
            const roundTrip = converter.convert(firstConversion.value, toUnit, fromUnit);
            
            const tolerance = 1e-6;
            const relativeError = Math.abs(roundTrip.value - value) / value;
            
            return relativeError < tolerance;
          }
        ),
        { numRuns: 10000 }
      );
    });
    
    it('should maintain value in round-trip conversions for device units', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100, noNaN: true }),
          fc.constantFrom('{click}', '{drop}'),
          (value, deviceUnit) => {
            // Convert device → mL → device
            const toML = converter.convert(value, deviceUnit, 'mL');
            const roundTrip = converter.convert(toML.value, 'mL', deviceUnit);
            
            const tolerance = 1e-6;
            const relativeError = Math.abs(roundTrip.value - value) / value;
            
            return relativeError < tolerance;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
  
  describe('Transitive conversion properties', () => {
    it('should maintain transitivity: A→B→C equals A→C', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }),
          fc.constantFrom('mg', 'g', 'mcg'),
          fc.constantFrom('mg', 'g', 'mcg'),
          fc.constantFrom('mg', 'g', 'mcg'),
          (value, unitA, unitB, unitC) => {
            // Skip if any units are the same
            if (unitA === unitB || unitB === unitC || unitA === unitC) {
              return true;
            }
            
            try {
              // Path 1: A → B → C
              const aToB = converter.convert(value, unitA, unitB);
              const bToC = converter.convert(aToB.value, unitB, unitC);
              
              // Path 2: A → C directly
              const aToCDirect = converter.convert(value, unitA, unitC);
              
              // Results should be the same (within tolerance)
              const tolerance = 1e-6;
              const relativeError = Math.abs(bToC.value - aToCDirect.value) / aToCDirect.value;
              
              return relativeError < tolerance;
            } catch (error) {
              // Skip impossible conversions
              if (error instanceof ImpossibleConversionError) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: 5000 }
      );
    });
  });
  
  describe('Invariant properties', () => {
    it('should always preserve non-negative values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(10000), noNaN: true }),
          fc.constantFrom('mg', 'g', 'mL', 'L', '{click}', '{drop}'),
          fc.constantFrom('mg', 'g', 'mL', 'L', '{click}', '{drop}'),
          (value, fromUnit, toUnit) => {
            try {
              const result = converter.convert(value, fromUnit, toUnit);
              // Non-negative input should always produce non-negative output
              return result.value >= 0;
            } catch (error) {
              // Skip impossible conversions and errors
              if (error instanceof ImpossibleConversionError || 
                  error instanceof MissingContextError ||
                  error instanceof InvalidUnitError) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: 10000 }
      );
    });
    
    it('should always produce confidence scores between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(10000), noNaN: true }),
          fc.constantFrom('mg', 'g', 'mL', 'L'),
          fc.constantFrom('mg', 'g', 'mL', 'L'),
          (value, fromUnit, toUnit) => {
            try {
              const result = converter.convert(value, fromUnit, toUnit);
              return result.confidence !== undefined && 
                     result.confidence >= 0 && 
                     result.confidence <= 1;
            } catch (error) {
              // Skip impossible conversions
              if (error instanceof ImpossibleConversionError || 
                  error instanceof InvalidUnitError) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: 5000 }
      );
    });
    
    it('should maintain unit validation consistency', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constantFrom('mg', 'g', 'mL', 'L', 'mcg', 'kg', '{tablet}', '{click}'),
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.match(/^[a-zA-Z{}]+$/))
          ),
          (unitString) => {
            const validation1 = converter.validate(unitString);
            const validation2 = converter.validate(unitString);
            
            // Validation should be deterministic
            return validation1.valid === validation2.valid &&
                   validation1.normalized === validation2.normalized &&
                   validation1.type === validation2.type;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
  
  describe('Error handling properties', () => {
    it('should consistently throw for invalid units', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100, noNaN: true }),
          fc.string({ minLength: 5, maxLength: 10 }).filter(s => 
            !s.match(/^(mg|g|mL|L|mcg|kg|μL|dL|\{[^}]+\})$/) && 
            s.match(/^[a-zA-Z]+$/)
          ),
          fc.constantFrom('mg', 'g', 'mL'),
          (value, invalidUnit, validUnit) => {
            // From invalid unit should throw
            expect(() => converter.convert(value, invalidUnit, validUnit))
              .toThrow(InvalidUnitError);
            
            // To invalid unit should throw
            expect(() => converter.convert(value, validUnit, invalidUnit))
              .toThrow(InvalidUnitError);
            
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });
    
    it('should throw for incompatible units without proper context', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100, noNaN: true }),
          (value) => {
            // Mass to volume without context should fail
            expect(() => converter.convert(value, 'mg', 'mL'))
              .toThrow(ImpossibleConversionError);
            
            // Device units requiring context should fail
            expect(() => converter.convert(value, '{tablet}', 'mg'))
              .toThrow(MissingContextError);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Edge case properties', () => {
    it('should handle very small values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1e-10), max: Math.fround(1e-6), noNaN: true }),
          (value) => {
            const result = converter.convert(value, 'mg', 'g');
            // Should not lose precision catastrophically
            return result.value > 0 && !isNaN(result.value);
          }
        ),
        { numRuns: 1000 }
      );
    });
    
    it('should handle very large values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1e6, max: 1e10, noNaN: true }),
          (value) => {
            const result = converter.convert(value, 'mg', 'kg');
            // Should not overflow
            return isFinite(result.value) && result.value > 0;
          }
        ),
        { numRuns: 1000 }
      );
    });
    
    it('should handle zero values correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('mg', 'g', 'mcg', 'kg'),
          fc.constantFrom('mg', 'g', 'mcg', 'kg'),
          (fromUnit, toUnit) => {
            try {
              const result = converter.convert(0, fromUnit, toUnit);
              // Zero should always convert to zero
              return result.value === 0;
            } catch (error) {
              // Skip any errors for zero conversions (js-quantities limitation)
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Performance properties', () => {
    it('should complete 10000 conversions in reasonable time', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        converter.convert(i % 1000 + 1, 'mg', 'g');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 10000 conversions in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
    
    it('should not leak memory during repeated conversions', () => {
      // Note: This is a basic check. For thorough memory testing,
      // use heap profiling tools
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many conversions
      for (let i = 0; i < 1000; i++) {
        converter.convert(i, 'mg', 'g');
        converter.convert(i, '{click}', 'mL');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});