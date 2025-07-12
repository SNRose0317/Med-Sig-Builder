import {
  ErrorResponse,
  ErrorCategory,
  createError,
  DoseError,
  FrequencyError,
  RouteError,
  createDoseError,
  createFrequencyError,
  createRouteError,
  isErrorResponse,
  errorToResponse
} from '../errors';

describe('Error Types', () => {
  describe('createError', () => {
    it('should create basic error response', () => {
      const error = createError('TEST001', 'Test error message');
      
      expect(error.code).toBe('TEST001');
      expect(error.message).toBe('Test error message');
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should include optional details', () => {
      const error = createError('TEST002', 'Test error', {
        field: 'dose',
        value: -5,
        reason: 'negative'
      });
      
      expect(error.details).toEqual({
        field: 'dose',
        value: -5,
        reason: 'negative'
      });
    });

    it('should include suggestions', () => {
      const error = createError(
        'TEST003', 
        'Unrecognized frequency',
        { input: 'two times daily' },
        ['twice daily', '2 times daily', 'BID']
      );
      
      expect(error.suggestions).toEqual(['twice daily', '2 times daily', 'BID']);
    });
  });

  describe('Domain-specific errors', () => {
    describe('createDoseError', () => {
      it('should create negative value error', () => {
        const error = createDoseError('negative_value', { value: -10, unit: 'mg' });
        
        expect(error.category).toBe(ErrorCategory.VALIDATION);
        expect(error.field).toBe('dose');
        expect(error.reason).toBe('negative_value');
        expect(error.attempted).toEqual({ value: -10, unit: 'mg' });
      });

      it('should include constraints for exceeds_maximum', () => {
        const error = createDoseError(
          'exceeds_maximum',
          { value: 500, unit: 'mg' },
          { maxDosePerAdministration: { value: 200, unit: 'mg' } }
        );
        
        expect(error.constraints).toBeDefined();
        expect(error.constraints?.maxDosePerAdministration).toEqual({ value: 200, unit: 'mg' });
      });
    });

    describe('createFrequencyError', () => {
      it('should create unrecognized pattern error', () => {
        const error = createFrequencyError(
          'unrecognized_pattern',
          'every other day',
          ['every 2 days', 'QOD', 'alternate days']
        );
        
        expect(error.category).toBe(ErrorCategory.VALIDATION);
        expect(error.field).toBe('frequency');
        expect(error.input).toBe('every other day');
        expect(error.suggestions).toHaveLength(3);
      });

      it('should handle ambiguous frequency', () => {
        const error = createFrequencyError('ambiguous', 'daily');
        
        expect(error.reason).toBe('ambiguous');
        expect(error.suggestions).toBeUndefined();
      });
    });

    describe('createRouteError', () => {
      it('should create incompatible dose form error', () => {
        const error = createRouteError(
          'incompatible_dose_form',
          'intravenous',
          'Tablet',
          ['by mouth', 'sublingual']
        );
        
        expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
        expect(error.reason).toBe('incompatible_dose_form');
        expect(error.route).toBe('intravenous');
        expect(error.doseForm).toBe('Tablet');
        expect(error.allowedRoutes).toEqual(['by mouth', 'sublingual']);
      });

      it('should handle requires_device error', () => {
        const error = createRouteError('requires_device', 'inhaled', 'Solution');
        
        expect(error.reason).toBe('requires_device');
        expect(error.allowedRoutes).toBeUndefined();
      });
    });
  });

  describe('Type guards', () => {
    it('should identify valid error responses', () => {
      const validError = createError('TEST', 'Error message');
      const invalidError = { message: 'Not a proper error' };
      
      expect(isErrorResponse(validError)).toBe(true);
      expect(isErrorResponse(invalidError)).toBe(false);
      expect(isErrorResponse(null)).toBe(false);
      expect(isErrorResponse(undefined)).toBe(false);
    });
  });

  describe('errorToResponse', () => {
    it('should convert DoseError to ErrorResponse', () => {
      const doseError = createDoseError('negative_value', { value: -5, unit: 'mg' });
      const response = errorToResponse(doseError);
      
      expect(response.code).toBe('DOSE_NEGATIVE_VALUE');
      expect(response.message).toBe('Dose cannot be negative: -5 mg');
      expect(response.details).toEqual({
        category: ErrorCategory.VALIDATION,
        field: 'dose',
        attempted: { value: -5, unit: 'mg' }
      });
    });

    it('should convert FrequencyError to ErrorResponse', () => {
      const freqError = createFrequencyError(
        'unrecognized_pattern',
        'weird frequency',
        ['daily', 'twice daily']
      );
      const response = errorToResponse(freqError);
      
      expect(response.code).toBe('FREQUENCY_UNRECOGNIZED_PATTERN');
      expect(response.message).toBe('Unrecognized frequency pattern: weird frequency');
      expect(response.suggestions).toEqual(['daily', 'twice daily']);
    });

    it('should convert RouteError to ErrorResponse', () => {
      const routeError = createRouteError(
        'incompatible_dose_form',
        'intramuscular',
        'Tablet',
        ['by mouth']
      );
      const response = errorToResponse(routeError);
      
      expect(response.code).toBe('ROUTE_INCOMPATIBLE_DOSE_FORM');
      expect(response.message).toBe('Route "intramuscular" is incompatible with dose form "Tablet"');
      expect(response.details?.allowedRoutes).toEqual(['by mouth']);
    });
  });

  describe('Error composition', () => {
    it('should support nested error details', () => {
      const error = createError('COMPLEX_ERROR', 'Multiple validation failures', {
        failures: [
          createDoseError('negative_value', { value: -1, unit: 'mg' }),
          createFrequencyError('ambiguous', 'qd')
        ]
      });
      
      expect(error.details?.failures).toHaveLength(2);
      expect((error.details?.failures as any[])[0].reason).toBe('negative_value');
      expect((error.details?.failures as any[])[1].reason).toBe('ambiguous');
    });
  });
});