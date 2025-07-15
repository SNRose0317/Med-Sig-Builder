/**
 * Tests for UCUM Wrapper
 */
import { UCUMWrapper } from '../UCUMWrapper';
import { 
  ImpossibleConversionError, 
  InvalidUnitError 
} from '../ConversionErrors';

describe('UCUMWrapper', () => {
  let wrapper: UCUMWrapper;
  
  beforeEach(() => {
    wrapper = new UCUMWrapper();
  });
  
  describe('convert', () => {
    describe('mass conversions', () => {
      it('should convert mg to g', () => {
        expect(wrapper.convert(1000, 'mg', 'g')).toBe(1);
      });
      
      it('should convert g to mg', () => {
        expect(wrapper.convert(1, 'g', 'mg')).toBe(1000);
      });
      
      it('should convert mcg to mg', () => {
        expect(wrapper.convert(1000, 'mcg', 'mg')).toBe(1);
      });
      
      it('should convert μg to mg (unicode)', () => {
        expect(wrapper.convert(1000, 'μg', 'mg')).toBe(1);
      });
      
      it('should convert kg to g', () => {
        expect(wrapper.convert(1, 'kg', 'g')).toBe(1000);
      });
      
      it('should handle very small values', () => {
        expect(wrapper.convert(1, 'pg', 'ng')).toBeCloseTo(0.001, 6);
      });
      
      it('should handle very large values', () => {
        expect(wrapper.convert(1000000, 'ng', 'g')).toBeCloseTo(0.001, 6);
      });
    });
    
    describe('volume conversions', () => {
      it('should convert mL to L', () => {
        expect(wrapper.convert(1000, 'mL', 'L')).toBe(1);
      });
      
      it('should convert L to mL', () => {
        expect(wrapper.convert(1, 'L', 'mL')).toBe(1000);
      });
      
      it('should convert μL to mL', () => {
        expect(wrapper.convert(1000, 'μL', 'mL')).toBe(1);
      });
      
      it('should convert uL to mL', () => {
        expect(wrapper.convert(1000, 'uL', 'mL')).toBe(1);
      });
      
      it('should convert dL to mL', () => {
        expect(wrapper.convert(1, 'dL', 'mL')).toBe(100);
      });
    });
    
    describe('concentration conversions', () => {
      it('should convert mg/mL to g/L', () => {
        expect(wrapper.convert(1, 'mg/mL', 'g/L')).toBe(1);
      });
      
      it('should convert g/L to mg/mL', () => {
        expect(wrapper.convert(1, 'g/L', 'mg/mL')).toBe(1);
      });
      
      it('should convert mcg/mL to mg/mL', () => {
        expect(wrapper.convert(1000, 'mcg/mL', 'mg/mL')).toBe(1);
      });
    });
    
    describe('error handling', () => {
      it('should throw ImpossibleConversionError for incompatible units', () => {
        expect(() => wrapper.convert(1, 'mg', 'mL'))
          .toThrow(ImpossibleConversionError);
      });
      
      it('should throw ImpossibleConversionError for mass to volume', () => {
        expect(() => wrapper.convert(1, 'kg', 'L'))
          .toThrow(ImpossibleConversionError);
      });
      
      it('should throw InvalidUnitError for invalid source unit', () => {
        expect(() => wrapper.convert(1, 'invalid', 'mg'))
          .toThrow(InvalidUnitError);
      });
      
      it('should throw InvalidUnitError for invalid target unit', () => {
        expect(() => wrapper.convert(1, 'mg', 'invalid'))
          .toThrow(InvalidUnitError);
      });
    });
  });
  
  describe('validate', () => {
    it('should validate standard mass units', () => {
      const units = ['pg', 'ng', 'mcg', 'μg', 'mg', 'g', 'kg'];
      units.forEach(unit => {
        const result = wrapper.validate(unit);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('standard');
      });
    });
    
    it('should validate standard volume units', () => {
      const units = ['μL', 'uL', 'mL', 'dL', 'L'];
      units.forEach(unit => {
        const result = wrapper.validate(unit);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('standard');
      });
    });
    
    it('should validate concentration units', () => {
      const units = ['mg/mL', 'g/L', 'mcg/mL', 'μg/mL'];
      units.forEach(unit => {
        const result = wrapper.validate(unit);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('standard');
      });
    });
    
    it('should identify unsupported medical units', () => {
      const units = ['IU', '{drop}', '{tablet}', '{capsule}', '{click}'];
      units.forEach(unit => {
        const result = wrapper.validate(unit);
        expect(result.valid).toBe(false);
        expect(result.type).toBe('device');
        expect(result.error).toContain('not supported by the underlying library');
      });
    });
    
    it('should reject invalid units', () => {
      const result = wrapper.validate('invalid-unit');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('should provide suggestions for common typos', () => {
      const testCases = [
        { input: 'mgg', expected: ['mg'] },
        { input: 'microgram', expected: ['mcg', 'μg'] },
        { input: 'milligram', expected: ['mg'] },
        { input: 'mgml', expected: ['mg/ml'] }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = wrapper.validate(input);
        expect(result.valid).toBe(false);
        expect(result.suggestions).toEqual(expect.arrayContaining(expected));
      });
    });
  });
  
  describe('getCompatibleUnits', () => {
    it('should return mass units for mass unit', () => {
      const compatible = wrapper.getCompatibleUnits('mg');
      expect(compatible).toContain('g');
      expect(compatible).toContain('kg');
      expect(compatible).toContain('mcg');
    });
    
    it('should return volume units for volume unit', () => {
      const compatible = wrapper.getCompatibleUnits('mL');
      expect(compatible).toContain('L');
      expect(compatible).toContain('μL');
      expect(compatible).toContain('dL');
    });
    
    it('should return empty array for invalid unit', () => {
      const compatible = wrapper.getCompatibleUnits('invalid');
      expect(compatible).toEqual([]);
    });
    
    it('should return empty array for unsupported medical unit', () => {
      const compatible = wrapper.getCompatibleUnits('{tablet}');
      expect(compatible).toEqual([]);
    });
  });
  
  describe('areUnitsCompatible', () => {
    it('should return true for compatible mass units', () => {
      expect(wrapper.areUnitsCompatible('mg', 'g')).toBe(true);
      expect(wrapper.areUnitsCompatible('mcg', 'kg')).toBe(true);
      expect(wrapper.areUnitsCompatible('pg', 'mg')).toBe(true);
    });
    
    it('should return true for compatible volume units', () => {
      expect(wrapper.areUnitsCompatible('mL', 'L')).toBe(true);
      expect(wrapper.areUnitsCompatible('μL', 'dL')).toBe(true);
    });
    
    it('should return true for compatible concentration units', () => {
      expect(wrapper.areUnitsCompatible('mg/mL', 'g/L')).toBe(true);
      expect(wrapper.areUnitsCompatible('mcg/mL', 'mg/mL')).toBe(true);
    });
    
    it('should return false for incompatible units', () => {
      expect(wrapper.areUnitsCompatible('mg', 'mL')).toBe(false);
      expect(wrapper.areUnitsCompatible('kg', 'L')).toBe(false);
      expect(wrapper.areUnitsCompatible('mg/mL', 'mg')).toBe(false);
    });
    
    it('should return false if either unit is invalid', () => {
      expect(wrapper.areUnitsCompatible('invalid', 'mg')).toBe(false);
      expect(wrapper.areUnitsCompatible('mg', 'invalid')).toBe(false);
      expect(wrapper.areUnitsCompatible('invalid1', 'invalid2')).toBe(false);
    });
    
    it('should return false for unsupported medical units', () => {
      expect(wrapper.areUnitsCompatible('{tablet}', 'mg')).toBe(false);
      expect(wrapper.areUnitsCompatible('mg', '{click}')).toBe(false);
    });
  });
  
  describe('edge cases', () => {
    it('should handle scientific notation', () => {
      expect(wrapper.convert(1e-6, 'g', 'mg')).toBeCloseTo(0.001, 9);
      expect(wrapper.convert(1e9, 'ng', 'g')).toBeCloseTo(1, 6);
    });
    
    it('should handle zero values', () => {
      expect(wrapper.convert(0, 'mg', 'g')).toBe(0);
      expect(wrapper.convert(0, 'mL', 'L')).toBe(0);
    });
    
    it('should handle negative values', () => {
      expect(wrapper.convert(-100, 'mg', 'g')).toBe(-0.1);
      expect(wrapper.convert(-1, 'L', 'mL')).toBe(-1000);
    });
    
    it('should maintain precision for small conversions', () => {
      const result = wrapper.convert(0.001, 'mg', 'mcg');
      expect(result).toBeCloseTo(1, 9);
    });
  });
});