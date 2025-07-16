/**
 * ComplexPRNBuilder Tests
 * 
 * Comprehensive test suite for complex PRN (as needed) medications with
 * dose ranges, frequency ranges, and maximum daily dose constraints.
 */

import { ComplexPRNBuilder } from '../ComplexPRNBuilder';
import { 
  DoseRangeInput,
  FrequencyRangeInput,
  MaxDailyDoseConstraint,
  isValidDoseRangeInput,
  isValidFrequencyRangeInput
} from '../IComplexRegimenBuilder';
import { MedicationProfile } from '../../../types/MedicationProfile';

// Test medication for PRN scenarios
const testPRNMedication: MedicationProfile = {
  id: 'test-prn-med',
  name: 'Ibuprofen 200mg',
  type: 'medication',
  isActive: true,
  doseForm: 'Tablet',
  code: {
    coding: [{
      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
      code: '5640',
      display: 'Ibuprofen 200 MG Oral Tablet'
    }]
  },
  ingredient: [{
    name: 'Ibuprofen',
    strengthRatio: {
      numerator: { value: 200, unit: 'mg' },
      denominator: { value: 1, unit: 'tablet' }
    }
  }],
  dosageConstraints: {
    minDose: { value: 200, unit: 'mg' },
    maxDose: { value: 800, unit: 'mg' },
    step: 200
  },
  packageInfo: {
    quantity: 100,
    unit: 'tablet'
  }
};

// Controlled substance for additional testing
const controlledPRNMedication: MedicationProfile = {
  ...testPRNMedication,
  id: 'test-controlled-prn',
  name: 'Oxycodone 5mg',
  ingredient: [{
    name: 'Oxycodone',
    strengthRatio: {
      numerator: { value: 5, unit: 'mg' },
      denominator: { value: 1, unit: 'tablet' }
    }
  }],
  isControlled: true
};

describe('ComplexPRNBuilder', () => {
  let builder: ComplexPRNBuilder;

  beforeEach(() => {
    builder = new ComplexPRNBuilder(testPRNMedication);
  });

  // =============================================================================
  // Basic Builder Interface Tests
  // =============================================================================

  describe('Basic Builder Interface', () => {
    it('should implement ISignatureBuilder interface', () => {
      expect(builder).toBeInstanceOf(ComplexPRNBuilder);
      expect(typeof builder.buildDose).toBe('function');
      expect(typeof builder.buildTiming).toBe('function');
      expect(typeof builder.buildRoute).toBe('function');
      expect(typeof builder.getResult).toBe('function');
      expect(typeof builder.explain).toBe('function');
    });

    it('should implement IComplexRegimenBuilder interface', () => {
      expect(typeof builder.buildDoseRange).toBe('function');
      expect(typeof builder.buildFrequencyRange).toBe('function');
      expect(typeof builder.buildMaxDailyDoseConstraint).toBe('function');
      expect(typeof builder.getComplexResult).toBe('function');
      expect(typeof builder.explainComplexRegimen).toBe('function');
    });

    it('should initialize with PRN medication', () => {
      const audit = builder.explain();
      expect(audit).toContain('ComplexPRNBuilder initialized');
      expect(audit).toContain('advanced PRN dosing');
    });
  });

  // =============================================================================
  // Dose Range Tests
  // =============================================================================

  describe('Dose Range Support', () => {
    it('should build basic dose range', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      expect(() => {
        builder.buildDoseRange(doseRange);
      }).not.toThrow();

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('Dose range: 1-2 tablet');
    });

    it('should validate dose range input', () => {
      const invalidDoseRange = {
        minValue: 2,
        maxValue: 1, // Invalid: max < min
        unit: 'tablet'
      };

      expect(() => {
        builder.buildDoseRange(invalidDoseRange as DoseRangeInput);
      }).toThrow('Invalid dose range input');
    });

    it('should format dose range display correctly', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      const result = builder
        .buildDoseRange(doseRange)
        .buildTiming({ frequency: 1, period: 6, periodUnit: 'h' })
        .buildRoute('by mouth')
        .getResult();

      expect(result[0].text).toContain('1-2 tablets');
    });

    it('should handle same min/max dose range', () => {
      const doseRange: DoseRangeInput = {
        minValue: 2,
        maxValue: 2,
        unit: 'tablet'
      };

      const result = builder
        .buildDoseRange(doseRange)
        .buildTiming({ frequency: 1, period: 8, periodUnit: 'h' })
        .buildRoute('by mouth')
        .getResult();

      expect(result[0].text).toContain('2 tablet');
      expect(result[0].text).not.toContain('2-2');
    });

    it('should validate dose against range', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      builder.buildDoseRange(doseRange);

      // Valid dose within range
      expect(() => {
        builder.buildDose({ value: 1, unit: 'tablet' });
      }).not.toThrow();

      expect(() => {
        builder.buildDose({ value: 2, unit: 'tablet' });
      }).not.toThrow();

      // Invalid dose outside range
      expect(() => {
        builder.buildDose({ value: 3, unit: 'tablet' });
      }).toThrow('outside configured range');
    });
  });

  // =============================================================================
  // Frequency Range Tests
  // =============================================================================

  describe('Frequency Range Support', () => {
    it('should build basic frequency range', () => {
      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 1,
        maxFrequency: 3,
        period: 1,
        periodUnit: 'd'
      };

      expect(() => {
        builder.buildFrequencyRange(frequencyRange);
      }).not.toThrow();

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('Frequency range: every 1-3 d');
    });

    it('should calculate PRN timing from frequency range', () => {
      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 2,
        maxFrequency: 4,
        period: 1,
        periodUnit: 'd'
      };

      builder.buildFrequencyRange(frequencyRange);

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('Interval range:');
      expect(audit).toContain('Max daily administrations:');
    });

    it('should handle hourly frequency ranges', () => {
      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 1,
        maxFrequency: 2,
        period: 6,
        periodUnit: 'h'
      };

      const result = builder
        .buildFrequencyRange(frequencyRange)
        .buildDose({ value: 1, unit: 'tablet' })
        .buildRoute('by mouth')
        .getResult();

      expect(result[0].text).toContain('every 1-2 h');
    });

    it('should validate timing against frequency range', () => {
      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 1,
        maxFrequency: 3,
        period: 1,
        periodUnit: 'd'
      };

      builder.buildFrequencyRange(frequencyRange);

      // Valid timing within range
      expect(() => {
        builder.buildTiming({ frequency: 2, period: 1, periodUnit: 'd' });
      }).not.toThrow();

      // Invalid timing outside range
      expect(() => {
        builder.buildTiming({ frequency: 5, period: 1, periodUnit: 'd' });
      }).toThrow('outside configured range');
    });

    it('should warn about frequent dosing intervals', () => {
      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 12, // Every 2 hours
        maxFrequency: 24, // Every hour - very frequent
        period: 1,
        periodUnit: 'd'
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      builder.buildFrequencyRange(frequencyRange);

      // Should have added safety warning about frequent dosing
      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('Safety warnings:');

      consoleWarnSpy.mockRestore();
    });
  });

  // =============================================================================
  // Maximum Daily Dose Constraints Tests
  // =============================================================================

  describe('Maximum Daily Dose Constraints', () => {
    it('should build maximum daily dose constraint', () => {
      const constraint: MaxDailyDoseConstraint = {
        maxDosePerDay: { value: 6, unit: 'tablet' },
        maxAdministrationsPerDay: 6,
        warningMessage: 'Approaching maximum daily dose'
      };

      expect(() => {
        builder.buildMaxDailyDoseConstraint(constraint);
      }).not.toThrow();

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('max daily dose constraint: 6 tablet');
    });

    it('should include max daily dose in instructions', () => {
      const constraint: MaxDailyDoseConstraint = {
        maxDosePerDay: { value: 8, unit: 'tablet' },
        maxAdministrationsPerDay: 4
      };

      const result = builder
        .buildMaxDailyDoseConstraint(constraint)
        .buildDose({ value: 2, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 6, periodUnit: 'h' })
        .buildRoute('by mouth')
        .getResult();

      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text) || [];
      
      expect(additionalTexts.some(text => text?.includes('Do not exceed 8 tablet in 24 hours'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('Maximum 4 doses per day'))).toBe(true);
    });

    it('should add max daily dose to FHIR structure', () => {
      const constraint: MaxDailyDoseConstraint = {
        maxDosePerDay: { value: 1200, unit: 'mg' }
      };

      const result = builder
        .buildMaxDailyDoseConstraint(constraint)
        .buildDose({ value: 200, unit: 'mg' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('by mouth')
        .getResult();

      expect(result[0].maxDosePerPeriod).toBeDefined();
      expect(result[0].maxDosePerPeriod?.numerator.value).toBe(1200);
      expect(result[0].maxDosePerPeriod?.numerator.unit).toBe('mg');
      expect(result[0].maxDosePerPeriod?.denominator.value).toBe(1);
      expect(result[0].maxDosePerPeriod?.denominator.unit).toBe('d');
    });
  });

  // =============================================================================
  // Combined Range Tests
  // =============================================================================

  describe('Combined Range Scenarios', () => {
    it('should handle dose and frequency ranges together', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 1,
        maxFrequency: 3,
        period: 1,
        periodUnit: 'd'
      };

      const constraint: MaxDailyDoseConstraint = {
        maxDosePerDay: { value: 6, unit: 'tablet' }
      };

      const result = builder
        .buildDoseRange(doseRange)
        .buildFrequencyRange(frequencyRange)
        .buildMaxDailyDoseConstraint(constraint)
        .buildRoute('by mouth')
        .getResult();

      expect(result[0].text).toContain('1-2 tablets');
      expect(result[0].text).toContain('every 1-3 d');
      
      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text) || [];
      expect(additionalTexts.some(text => text?.includes('Do not exceed 6 tablet in 24 hours'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('Take only when needed'))).toBe(true);
    });

    it('should build FHIR dose range structure', () => {
      const doseRange: DoseRangeInput = {
        minValue: 200,
        maxValue: 400,
        unit: 'mg'
      };

      const result = builder
        .buildDoseRange(doseRange)
        .buildTiming({ frequency: 1, period: 6, periodUnit: 'h' })
        .buildRoute('by mouth')
        .getResult();

      expect(result[0].doseAndRate).toBeDefined();
      expect(result[0].doseAndRate![0].doseRange).toBeDefined();
      expect(result[0].doseAndRate![0].doseRange!.low?.value).toBe(200);
      expect(result[0].doseAndRate![0].doseRange!.high?.value).toBe(400);
    });
  });

  // =============================================================================
  // PRN-Specific Instructions Tests
  // =============================================================================

  describe('PRN-Specific Instructions', () => {
    it('should include minimum interval instructions', () => {
      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 1,
        maxFrequency: 4,
        period: 1,
        periodUnit: 'd'
      };

      const result = builder
        .buildFrequencyRange(frequencyRange)
        .buildDose({ value: 1, unit: 'tablet' })
        .buildRoute('by mouth')
        .getResult();

      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text) || [];
      expect(additionalTexts.some(text => text?.includes('Wait at least') && text?.includes('hours between doses'))).toBe(true);
    });

    it('should include general PRN guidance', () => {
      const result = builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 6, periodUnit: 'h' })
        .buildRoute('by mouth')
        .getResult();

      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text) || [];
      expect(additionalTexts.some(text => text?.includes('Take only when needed for symptoms'))).toBe(true);
    });

    it('should include controlled substance warnings', () => {
      const controlledBuilder = new ComplexPRNBuilder(controlledPRNMedication);

      const result = controlledBuilder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('by mouth')
        .getResult();

      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text) || [];
      expect(additionalTexts.some(text => text?.includes('Controlled substance'))).toBe(true);
    });
  });

  // =============================================================================
  // Validation Tests
  // =============================================================================

  describe('Validation', () => {
    it('should validate against medication dose constraints', () => {
      const doseRange: DoseRangeInput = {
        minValue: 5, // Exceeds medication max dose (800mg = 4 tablets of 200mg)
        maxValue: 6,
        unit: 'tablet'
      };

      expect(() => {
        builder.buildDoseRange(doseRange);
      }).toThrow('exceeds medication maximum');
    });

    it('should warn about large dose ranges', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 15, // Very large range
        unit: 'tablet'
      };

      builder.buildDoseRange(doseRange);

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('Safety warnings:');
      expect(audit).toContain('Large dose range detected');
    });

    it('should validate complex regimen constraints', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      builder.buildDoseRange(doseRange);

      const errors = builder.validateComplexRegimen();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('no maximum daily dose constraint provided');
    });

    it('should pass validation with complete configuration', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      const constraint: MaxDailyDoseConstraint = {
        maxDosePerDay: { value: 6, unit: 'tablet' }
      };

      builder
        .buildDoseRange(doseRange)
        .buildMaxDailyDoseConstraint(constraint);

      const errors = builder.validateComplexRegimen();
      expect(errors).toHaveLength(0);
    });
  });

  // =============================================================================
  // Complex Regimen Builder Interface Tests
  // =============================================================================

  describe('Complex Regimen Builder Interface', () => {
    it('should support all IComplexRegimenBuilder methods', () => {
      expect(() => {
        builder.buildSequentialInstructions([]);
        builder.buildConditionalLogic({
          condition: 'if pain persists',
          ifTrue: []
        });
        builder.buildRelationships([]);
        builder.buildMultiIngredientDose({
          totalDose: { value: 1, unit: 'tablet' },
          displayBreakdown: false
        });
      }).not.toThrow();
    });

    it('should provide complex result', () => {
      builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 6, periodUnit: 'h' })
        .buildRoute('by mouth');
      
      const complexResult = (builder as ComplexPRNBuilder).getComplexResult();

      expect(complexResult).toHaveLength(1);
      expect(complexResult[0].text).toBeDefined();
    });
  });

  // =============================================================================
  // Serialization and Explanation Tests
  // =============================================================================

  describe('Serialization and Explanation', () => {
    it('should serialize with PRN features', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      builder.buildDoseRange(doseRange);

      const serialized = builder.toJSON() as Record<string, unknown>;
      
      expect(serialized.builderType).toBe('ComplexPRNBuilder');
      expect(serialized.prnFeatures).toBeDefined();
      expect((serialized.prnFeatures as any).hasDoseRange).toBe(true);
      expect(serialized.prnState).toBeDefined();
      expect(serialized.complexState).toBeDefined();
    });

    it('should provide detailed explanation', () => {
      const doseRange: DoseRangeInput = {
        minValue: 1,
        maxValue: 2,
        unit: 'tablet'
      };

      const frequencyRange: FrequencyRangeInput = {
        minFrequency: 1,
        maxFrequency: 4,
        period: 1,
        periodUnit: 'd'
      };

      builder
        .buildDoseRange(doseRange)
        .buildFrequencyRange(frequencyRange);

      const explanation = builder.explain();
      
      expect(explanation).toContain('Complex PRN Features');
      expect(explanation).toContain('Dose range: 1-2 tablet');
      expect(explanation).toContain('Frequency range: every 1-4 d');
    });

    it('should provide complex regimen explanation', () => {
      const complexExplanation = builder.explainComplexRegimen();
      
      expect(complexExplanation).toContain('Complex PRN Features');
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle invalid dose range inputs', () => {
      const invalidInputs = [
        { minValue: -1, maxValue: 2, unit: 'tablet' },
        { minValue: 2, maxValue: 1, unit: 'tablet' },
        { minValue: 1, maxValue: 2, unit: '' }
      ];

      invalidInputs.forEach(invalidInput => {
        expect(() => {
          builder.buildDoseRange(invalidInput as DoseRangeInput);
        }).toThrow();
      });
    });

    it('should handle invalid frequency range inputs', () => {
      const invalidInputs = [
        { minFrequency: -1, maxFrequency: 2, period: 1, periodUnit: 'd' },
        { minFrequency: 2, maxFrequency: 1, period: 1, periodUnit: 'd' },
        { minFrequency: 1, maxFrequency: 2, period: -1, periodUnit: 'd' }
      ];

      invalidInputs.forEach(invalidInput => {
        expect(() => {
          builder.buildFrequencyRange(invalidInput as FrequencyRangeInput);
        }).toThrow();
      });
    });
  });
});

// =============================================================================
// Validation Function Tests
// =============================================================================

describe('Complex PRN Validation Functions', () => {
  describe('isValidDoseRangeInput', () => {
    it('should validate correct dose range inputs', () => {
      const validInputs = [
        { minValue: 1, maxValue: 2, unit: 'tablet' },
        { minValue: 0.5, maxValue: 1, unit: 'tablet' },
        { minValue: 200, maxValue: 400, unit: 'mg' }
      ];

      validInputs.forEach(input => {
        expect(isValidDoseRangeInput(input)).toBe(true);
      });
    });

    it('should reject invalid dose range inputs', () => {
      const invalidInputs = [
        null,
        undefined,
        { minValue: 2, maxValue: 1, unit: 'tablet' }, // max < min
        { minValue: -1, maxValue: 2, unit: 'tablet' }, // negative min
        { minValue: 1, maxValue: 2, unit: '' }, // empty unit
        { minValue: 1, maxValue: 2 } // missing unit
      ];

      invalidInputs.forEach(input => {
        expect(isValidDoseRangeInput(input)).toBe(false);
      });
    });
  });

  describe('isValidFrequencyRangeInput', () => {
    it('should validate correct frequency range inputs', () => {
      const validInputs = [
        { minFrequency: 1, maxFrequency: 3, period: 1, periodUnit: 'd' },
        { minFrequency: 2, maxFrequency: 4, period: 6, periodUnit: 'h' },
        { minFrequency: 1, maxFrequency: 1, period: 8, periodUnit: 'h', minInterval: 8 }
      ];

      validInputs.forEach(input => {
        expect(isValidFrequencyRangeInput(input)).toBe(true);
      });
    });

    it('should reject invalid frequency range inputs', () => {
      const invalidInputs = [
        null,
        undefined,
        { minFrequency: 2, maxFrequency: 1, period: 1, periodUnit: 'd' }, // max < min
        { minFrequency: -1, maxFrequency: 2, period: 1, periodUnit: 'd' }, // negative min
        { minFrequency: 1, maxFrequency: 2, period: -1, periodUnit: 'd' }, // negative period
        { minFrequency: 1, maxFrequency: 2, period: 1, periodUnit: '' }, // empty unit
        { minFrequency: 1, maxFrequency: 2, period: 1, periodUnit: 'd', minInterval: -1 } // negative interval
      ];

      invalidInputs.forEach(input => {
        expect(isValidFrequencyRangeInput(input)).toBe(false);
      });
    });
  });
});