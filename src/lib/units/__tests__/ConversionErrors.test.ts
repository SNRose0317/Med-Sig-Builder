/**
 * Tests for Conversion Error Classes
 */
import {
  ConversionError,
  ImpossibleConversionError,
  MissingContextError,
  InvalidUnitError,
  PrecisionError,
  ConversionErrors,
  success,
  error,
  isError,
  isSuccess,
  ConversionResult
} from '../ConversionErrors';

describe('ConversionErrors', () => {
  describe('ImpossibleConversionError', () => {
    it('should create error with correct message and details', () => {
      const err = new ImpossibleConversionError('mg', 'mL', 'incompatible dimensions');
      
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ConversionError);
      expect(err).toBeInstanceOf(ImpossibleConversionError);
      expect(err.message).toBe('Cannot convert from mg to mL: incompatible dimensions');
      expect(err.from).toBe('mg');
      expect(err.to).toBe('mL');
      expect(err.reason).toBe('incompatible dimensions');
      expect(err.errorType).toBe('IMPOSSIBLE_CONVERSION');
    });

    it('should serialize to JSON correctly', () => {
      const err = new ImpossibleConversionError('kg', 'L', 'mass cannot convert to volume');
      const json = err.toJSON();
      
      expect(json.errorType).toBe('IMPOSSIBLE_CONVERSION');
      expect(json.message).toBe('Cannot convert from kg to L: mass cannot convert to volume');
      expect(json.details).toEqual({
        from: 'kg',
        to: 'L',
        reason: 'mass cannot convert to volume'
      });
      expect(json.stack).toBeDefined();
    });
  });

  describe('MissingContextError', () => {
    it('should create error for missing concentration', () => {
      const err = new MissingContextError(
        ['concentration', 'strengthRatio'],
        'mg to mL conversion',
        { dose: 100 }
      );
      
      expect(err.message).toBe(
        'Missing required context for mg to mL conversion: concentration, strengthRatio'
      );
      expect(err.requiredContext).toEqual(['concentration', 'strengthRatio']);
      expect(err.availableContext).toEqual({ dose: 100 });
    });

    it('should handle missing available context', () => {
      const err = new MissingContextError(
        ['tabletStrength'],
        'tablet to mg conversion'
      );
      
      expect(err.availableContext).toBeUndefined();
    });
  });

  describe('InvalidUnitError', () => {
    it('should create error for malformed unit', () => {
      const err = new InvalidUnitError('mgg', 'unrecognized unit');
      
      expect(err.message).toBe('Invalid unit: mgg - unrecognized unit');
      expect(err.unit).toBe('mgg');
      expect(err.validationError).toBe('unrecognized unit');
    });

    it('should include suggestions when available', () => {
      const err = new InvalidUnitError(
        'milligram',
        'not a valid UCUM unit',
        ['mg', 'milligrams']
      );
      
      expect(err.suggestions).toEqual(['mg', 'milligrams']);
    });

    it('should handle no validation error message', () => {
      const err = new InvalidUnitError('{invalid}');
      
      expect(err.message).toBe('Invalid unit: {invalid}');
      expect(err.validationError).toBeUndefined();
    });
  });

  describe('PrecisionError', () => {
    it('should create error for precision loss', () => {
      const err = new PrecisionError(0.0001, 'mg', 'g', 1e-6, 1e-3);
      
      expect(err.message).toBe(
        'Conversion of 0.0001 mg to g would lose precision: expected 0.000001, got 0.001'
      );
      expect(err.value).toBe(0.0001);
      expect(err.expectedPrecision).toBe(1e-6);
      expect(err.actualPrecision).toBe(1e-3);
    });
  });

  describe('ConversionResult helpers', () => {
    describe('success', () => {
      it('should create success result', () => {
        const result = success(42);
        
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });
    });

    describe('error', () => {
      it('should create error result', () => {
        const err = new InvalidUnitError('bad-unit');
        const result = error(err);
        
        expect(result.ok).toBe(false);
        expect(result.error).toBe(err);
      });
    });

    describe('type guards', () => {
      it('should correctly identify success results', () => {
        const result: ConversionResult<number> = success(100);
        
        expect(isSuccess(result)).toBe(true);
        expect(isError(result)).toBe(false);
        
        if (isSuccess(result)) {
          // TypeScript should narrow type here
          expect(result.value).toBe(100);
        }
      });

      it('should correctly identify error results', () => {
        const err = new ImpossibleConversionError('mg', 'L', 'incompatible');
        const result: ConversionResult<number> = error(err);
        
        expect(isError(result)).toBe(true);
        expect(isSuccess(result)).toBe(false);
        
        if (isError(result)) {
          // TypeScript should narrow type here
          expect(result.error).toBe(err);
        }
      });
    });
  });

  describe('ConversionErrors factory', () => {
    it('should create ImpossibleConversionError', () => {
      const err = ConversionErrors.impossibleConversion('C', 'meters', 'temperature to length');
      
      expect(err).toBeInstanceOf(ImpossibleConversionError);
      expect(err.reason).toBe('temperature to length');
    });

    it('should create MissingContextError', () => {
      const err = ConversionErrors.missingContext(
        ['density'],
        'volume to mass',
        { volume: 100 }
      );
      
      expect(err).toBeInstanceOf(MissingContextError);
      expect(err.requiredContext).toEqual(['density']);
    });

    it('should create InvalidUnitError', () => {
      const err = ConversionErrors.invalidUnit(
        '{click',
        'missing closing brace',
        ['{click}']
      );
      
      expect(err).toBeInstanceOf(InvalidUnitError);
      expect(err.suggestions).toEqual(['{click}']);
    });

    it('should create PrecisionError', () => {
      const err = ConversionErrors.precisionLoss(
        0.001,
        'mg',
        'kg',
        1e-9,
        1e-6
      );
      
      expect(err).toBeInstanceOf(PrecisionError);
      expect(err.expectedPrecision).toBe(1e-9);
    });
  });

  describe('Error inheritance', () => {
    it('all errors should extend ConversionError', () => {
      const errors = [
        new ImpossibleConversionError('a', 'b', 'test'),
        new MissingContextError(['test'], 'conversion'),
        new InvalidUnitError('unit'),
        new PrecisionError(1, 'a', 'b', 0.1, 0.2)
      ];

      errors.forEach(err => {
        expect(err).toBeInstanceOf(ConversionError);
        expect(err).toBeInstanceOf(Error);
        expect(err.errorType).toBeDefined();
        expect(err.toJSON).toBeDefined();
      });
    });
  });
});