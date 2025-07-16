/**
 * TaperingDoseBuilder Tests
 * 
 * Comprehensive test suite for tapering schedules and sequential dose management.
 */

import { TaperingDoseBuilder, TaperingTransitionType } from '../TaperingDoseBuilder';
import { 
  TaperingPhase,
  isValidTaperingPhase
} from '../IComplexRegimenBuilder';
import { MedicationProfile } from '../../../types/MedicationProfile';
import { RelationshipType } from '../../../types/SignatureInstruction';

// Test medication for tapering scenarios
const testTaperingMedication: MedicationProfile = {
  id: 'test-tapering-med',
  name: 'Prednisone 10mg',
  type: 'medication',
  isActive: true,
  doseForm: 'Tablet',
  code: {
    coding: [{
      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
      code: '8640',
      display: 'Prednisone 10 MG Oral Tablet'
    }]
  },
  ingredient: [{
    name: 'Prednisone',
    strengthRatio: {
      numerator: { value: 10, unit: 'mg' },
      denominator: { value: 1, unit: 'tablet' }
    }
  }],
  dosageConstraints: {
    minDose: { value: 5, unit: 'mg' },
    maxDose: { value: 80, unit: 'mg' },
    step: 5
  },
  packageInfo: {
    quantity: 100,
    unit: 'tablet'
  },
  isTaper: true
};

// Benzodiazepine for controlled substance testing
const benzodiazepineMedication: MedicationProfile = {
  ...testTaperingMedication,
  id: 'test-benzo-med',
  name: 'Lorazepam 1mg',
  ingredient: [{
    name: 'Lorazepam',
    strengthRatio: {
      numerator: { value: 1, unit: 'mg' },
      denominator: { value: 1, unit: 'tablet' }
    }
  }],
  isControlled: true
};

// Sample tapering phases
const standardTaperingPhases: TaperingPhase[] = [
  {
    name: 'Week 1-2',
    dose: { value: 40, unit: 'mg' },
    timing: { frequency: 1, period: 1, periodUnit: 'd' },
    duration: { value: 2, unit: 'weeks' },
    specialInstructions: ['Take with food'],
    transitionNote: 'Reduce dose if no side effects'
  },
  {
    name: 'Week 3-4',
    dose: { value: 20, unit: 'mg' },
    timing: { frequency: 1, period: 1, periodUnit: 'd' },
    duration: { value: 2, unit: 'weeks' },
    specialInstructions: ['Continue with food']
  },
  {
    name: 'Week 5-6',
    dose: { value: 10, unit: 'mg' },
    timing: { frequency: 1, period: 1, periodUnit: 'd' },
    duration: { value: 2, unit: 'weeks' },
    specialInstructions: ['Monitor for withdrawal symptoms']
  },
  {
    name: 'Week 7',
    dose: { value: 5, unit: 'mg' },
    timing: { frequency: 1, period: 1, periodUnit: 'd' },
    duration: { value: 1, unit: 'week' },
    transitionNote: 'Complete tapering schedule'
  }
];

describe('TaperingDoseBuilder', () => {
  let builder: TaperingDoseBuilder;

  beforeEach(() => {
    builder = new TaperingDoseBuilder(testTaperingMedication);
  });

  // =============================================================================
  // Basic Builder Interface Tests
  // =============================================================================

  describe('Basic Builder Interface', () => {
    it('should implement ISignatureBuilder interface', () => {
      expect(builder).toBeInstanceOf(TaperingDoseBuilder);
      expect(typeof builder.buildDose).toBe('function');
      expect(typeof builder.buildTiming).toBe('function');
      expect(typeof builder.buildRoute).toBe('function');
      expect(typeof builder.getResult).toBe('function');
      expect(typeof builder.explain).toBe('function');
    });

    it('should implement IComplexRegimenBuilder interface', () => {
      expect(typeof builder.buildSequentialInstructions).toBe('function');
      expect(typeof builder.buildConditionalLogic).toBe('function');
      expect(typeof builder.buildRelationships).toBe('function');
      expect(typeof builder.getComplexResult).toBe('function');
      expect(typeof builder.explainComplexRegimen).toBe('function');
    });

    it('should initialize with tapering medication', () => {
      const audit = builder.explain();
      expect(audit).toContain('TaperingDoseBuilder initialized');
      expect(audit).toContain('sequential dosing');
    });
  });

  // =============================================================================
  // Sequential Instructions Tests
  // =============================================================================

  describe('Sequential Instructions', () => {
    it('should build sequential tapering phases', () => {
      expect(() => {
        builder.buildSequentialInstructions(standardTaperingPhases);
      }).not.toThrow();

      const explanation = builder.explainComplexRegimen();
      expect(explanation).toContain('Total phases: 4');
      expect(explanation).toContain('Direction: Descending');
    });

    it('should validate tapering phases', () => {
      const invalidPhases = [
        {
          name: '', // Invalid: empty name
          dose: { value: 40, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 2, unit: 'weeks' }
        } as TaperingPhase
      ];

      expect(() => {
        builder.buildSequentialInstructions(invalidPhases);
      }).toThrow('Invalid tapering phases provided');
    });

    it('should require at least one phase', () => {
      expect(() => {
        builder.buildSequentialInstructions([]);
      }).toThrow('At least one tapering phase is required');
    });

    it('should detect tapering direction correctly', () => {
      builder.buildSequentialInstructions(standardTaperingPhases);
      
      const explanation = builder.explainComplexRegimen();
      expect(explanation).toContain('Direction: Descending (tapering down)');
    });

    it('should detect ascending tapering', () => {
      const ascendingPhases: TaperingPhase[] = [
        {
          name: 'Week 1',
          dose: { value: 5, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        },
        {
          name: 'Week 2',
          dose: { value: 10, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        }
      ];

      builder.buildSequentialInstructions(ascendingPhases);
      
      const explanation = builder.explainComplexRegimen();
      expect(explanation).toContain('Direction: Ascending');
    });

    it('should calculate total duration correctly', () => {
      builder.buildSequentialInstructions(standardTaperingPhases);
      
      const explanation = builder.explainComplexRegimen();
      expect(explanation).toContain('Total duration: 7 weeks');
    });
  });

  // =============================================================================
  // Phase Management Tests
  // =============================================================================

  describe('Phase Management', () => {
    beforeEach(() => {
      builder.buildSequentialInstructions(standardTaperingPhases);
    });

    it('should set current phase', () => {
      expect(() => {
        builder.setCurrentPhase(1);
      }).not.toThrow();

      const explanation = builder.explain();
      expect(explanation).toContain('Current phase: 1');
    });

    it('should apply phase dose and timing when set', () => {
      builder.setCurrentPhase(2).buildRoute('by mouth');
      
      const result = builder.getResult();
      expect(result[0].text).toContain('20 mg'); // Week 3-4 dose
    });

    it('should throw error for invalid phase number', () => {
      expect(() => {
        builder.setCurrentPhase(10); // Non-existent phase
      }).toThrow('Phase 10 not found');
    });

    it('should provide current phase context', () => {
      builder.setCurrentPhase(2).buildRoute('by mouth');
      
      const result = builder.getResult();
      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text).filter(Boolean) || [];
      
      expect(additionalTexts.some(text => text?.includes('Current phase: Week 3-4 (2 of 4)'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('Next phase: Reduce to 10 mg'))).toBe(true);
    });

    it('should handle final phase correctly', () => {
      builder.setCurrentPhase(4).buildRoute('by mouth'); // Final phase
      
      const result = builder.getResult();
      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text).filter(Boolean) || [];
      
      expect(additionalTexts.some(text => text?.includes('Final phase - complete tapering schedule'))).toBe(true);
    });
  });

  // =============================================================================
  // Complex Result Generation Tests
  // =============================================================================

  describe('Complex Result Generation', () => {
    beforeEach(() => {
      builder.buildSequentialInstructions(standardTaperingPhases);
    });

    it('should generate instructions for all phases', () => {
      const complexResult = builder.getComplexResult();
      
      expect(complexResult).toHaveLength(4);
      expect(complexResult[0].text).toContain('Phase 1 (Week 1-2)');
      expect(complexResult[0].text).toContain('40 mg');
    });

    it('should include phase durations in timing', () => {
      const complexResult = builder.getComplexResult();
      
      expect(complexResult[0].timing?.bounds).toBeDefined();
      // bounds is a Period, so check for start/end
    });

    it('should create sequential relationships', () => {
      const complexResult = builder.getComplexResult();
      
      // Check that relationships were created
      const builder_: any = builder;
      const relationships = builder_.complexState.relationships;
      
      expect(relationships).toHaveLength(3); // 4 phases = 3 relationships
      expect(relationships[0].relationshipType).toBe(RelationshipType.SEQUENTIAL);
    });

    it('should include tapering schedule overview', () => {
      const complexResult = builder.getComplexResult();
      const additionalTexts = complexResult[0].additionalInstructions?.map(inst => inst.text).filter(Boolean) || [];
      
      expect(additionalTexts.some(text => text?.includes('Complete tapering schedule: 4 phases over 7 weeks'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('Do not stop abruptly'))).toBe(true);
    });

    it('should include special instructions for each phase', () => {
      const complexResult = builder.getComplexResult();
      
      // Check first phase has special instructions
      const phase1Instructions = complexResult[0].additionalInstructions?.map(inst => inst.text).filter(Boolean) || [];
      expect(phase1Instructions.some(text => text?.includes('Take with food'))).toBe(true);
      
      // Check transition notes
      expect(phase1Instructions.some(text => text?.includes('Next phase: Reduce dose if no side effects'))).toBe(true);
    });
  });

  // =============================================================================
  // Monitoring and Safety Tests
  // =============================================================================

  describe('Monitoring and Safety', () => {
    it('should add monitoring requirements', () => {
      builder.addMonitoringRequirement('Check blood pressure weekly');
      
      const explanation = builder.explainComplexRegimen();
      expect(explanation).toContain('Check blood pressure weekly');
    });

    it('should add discontinuation warnings', () => {
      builder.addDiscontinuationWarning('May cause rebound symptoms');
      
      const explanation = builder.explainComplexRegimen();
      expect(explanation).toContain('May cause rebound symptoms');
    });

    it('should include automatic warnings for controlled substances', () => {
      const benzoBuilder = new TaperingDoseBuilder(benzodiazepineMedication);
      
      const explanation = benzoBuilder.explainComplexRegimen();
      expect(explanation).toContain('Monitor for withdrawal symptoms');
      expect(explanation).toContain('Do not discontinue abruptly');
    });

    it('should warn about gradual reduction for tapering medications', () => {
      builder.buildSequentialInstructions(standardTaperingPhases);
      const complexResult = builder.getComplexResult();
      const additionalTexts = complexResult[0].additionalInstructions?.map(inst => inst.text).filter(Boolean) || [];
      
      expect(additionalTexts.some(text => text?.includes('gradual dose reduction'))).toBe(true);
    });
  });

  // =============================================================================
  // Validation Tests
  // =============================================================================

  describe('Validation', () => {
    it('should validate empty configuration', () => {
      const errors = builder.validateComplexRegimen();
      expect(errors).toContain('No tapering phases configured');
    });

    it('should validate dose progression', () => {
      const invalidPhases: TaperingPhase[] = [
        {
          name: 'Phase 1',
          dose: { value: 10, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        },
        {
          name: 'Phase 2',
          dose: { value: 40, unit: 'mg' }, // Inconsistent - should be decreasing
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        },
        {
          name: 'Phase 3',
          dose: { value: 5, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        }
      ];

      builder.buildSequentialInstructions(invalidPhases);
      const errors = builder.validateComplexRegimen();
      
      expect(errors.some(error => error.includes('Inconsistent dose progression'))).toBe(true);
    });

    it('should detect large dose jumps', () => {
      const jumpyPhases: TaperingPhase[] = [
        {
          name: 'Phase 1',
          dose: { value: 80, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        },
        {
          name: 'Phase 2',
          dose: { value: 10, unit: 'mg' }, // 87.5% decrease - very large
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        }
      ];

      builder.buildSequentialInstructions(jumpyPhases);
      const errors = builder.validateComplexRegimen();
      
      expect(errors.some(error => error.includes('Large dose change detected'))).toBe(true);
    });

    it('should validate against medication constraints', () => {
      const constraintViolatingPhases: TaperingPhase[] = [
        {
          name: 'Phase 1',
          dose: { value: 100, unit: 'mg' }, // Exceeds max dose of 80mg
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        }
      ];

      builder.buildSequentialInstructions(constraintViolatingPhases);
      const errors = builder.validateComplexRegimen();
      
      expect(errors.some(error => error.includes('above medication maximum'))).toBe(true);
    });

    it('should validate durations', () => {
      const validPhaseWithInvalidDuration: TaperingPhase = {
        name: 'Phase 1',
        dose: { value: 40, unit: 'mg' },
        timing: { frequency: 1, period: 1, periodUnit: 'd' },
        duration: { value: 0, unit: 'week' } // Invalid duration
      };

      // This should pass isValidTaperingPhase validation since all required fields are present
      // but fail in our business logic validation
      expect(isValidTaperingPhase(validPhaseWithInvalidDuration)).toBe(true);
      
      builder.buildSequentialInstructions([validPhaseWithInvalidDuration]);
      const errors = builder.validateComplexRegimen();
      
      expect(errors.some(error => error.includes('invalid duration'))).toBe(true);
    });

    it('should pass validation with proper configuration', () => {
      builder.buildSequentialInstructions(standardTaperingPhases);
      const errors = builder.validateComplexRegimen();
      
      // Should have no critical errors (may have warnings)
      const criticalErrors = errors.filter(error => 
        error.includes('invalid') || 
        error.includes('above') || 
        error.includes('below')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  // =============================================================================
  // Complex Regimen Builder Interface Tests
  // =============================================================================

  describe('Complex Regimen Builder Interface', () => {
    beforeEach(() => {
      builder.buildSequentialInstructions(standardTaperingPhases);
    });

    it('should support all IComplexRegimenBuilder methods', () => {
      expect(() => {
        builder.buildConditionalLogic({
          condition: 'if withdrawal symptoms occur',
          ifTrue: []
        });
        builder.buildRelationships([]);
        builder.buildDoseRange({
          minValue: 5,
          maxValue: 10,
          unit: 'mg'
        });
        builder.buildFrequencyRange({
          minFrequency: 1,
          maxFrequency: 2,
          period: 1,
          periodUnit: 'd'
        });
        builder.buildMaxDailyDoseConstraint({
          maxDosePerDay: { value: 80, unit: 'mg' }
        });
        builder.buildMultiIngredientDose({
          totalDose: { value: 40, unit: 'mg' },
          displayBreakdown: false
        });
      }).not.toThrow();
    });

    it('should provide complex result with current phase only when phase is set', () => {
      builder.setCurrentPhase(2).buildRoute('by mouth');
      const result = builder.getResult();
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain('20 mg'); // Week 3-4 dose
    });

    it('should provide all phases when no current phase is set', () => {
      const result = builder.getResult();
      
      expect(result).toHaveLength(4); // All phases
    });
  });

  // =============================================================================
  // Serialization and Explanation Tests
  // =============================================================================

  describe('Serialization and Explanation', () => {
    beforeEach(() => {
      builder.buildSequentialInstructions(standardTaperingPhases);
    });

    it('should serialize with tapering features', () => {
      const serialized = builder.toJSON() as Record<string, unknown>;
      
      expect(serialized.builderType).toBe('TaperingDoseBuilder');
      expect(serialized.taperingFeatures).toBeDefined();
      expect((serialized.taperingFeatures as any).phaseCount).toBe(4);
      expect((serialized.taperingFeatures as any).isDescending).toBe(true);
      expect(serialized.taperingState).toBeDefined();
      expect(serialized.complexState).toBeDefined();
    });

    it('should include current phase in serialization', () => {
      builder.setCurrentPhase(3);
      const serialized = builder.toJSON() as Record<string, unknown>;
      
      expect((serialized.taperingFeatures as any).currentPhase).toBe(3);
    });

    it('should provide detailed explanation', () => {
      const explanation = builder.explain();
      
      expect(explanation).toContain('Tapering Features');
      expect(explanation).toContain('Phase count: 4');
      expect(explanation).toContain('Direction: Descending');
      expect(explanation).toContain('Total duration: 7 weeks');
    });

    it('should provide complex regimen explanation', () => {
      const complexExplanation = builder.explainComplexRegimen();
      
      expect(complexExplanation).toContain('Tapering Schedule Analysis');
      expect(complexExplanation).toContain('Phase breakdown:');
      expect(complexExplanation).toContain('1. Week 1-2: 40 mg');
      expect(complexExplanation).toContain('Dose progression: 40mg → 20mg → 10mg → 5mg');
    });

    it('should include monitoring and warnings in explanation', () => {
      builder.addMonitoringRequirement('Monitor liver function');
      builder.addDiscontinuationWarning('Gradual reduction required');
      
      const explanation = builder.explainComplexRegimen();
      expect(explanation).toContain('Monitoring requirements:');
      expect(explanation).toContain('Monitor liver function');
      expect(explanation).toContain('Discontinuation warnings:');
      expect(explanation).toContain('Gradual reduction required');
    });
  });

  // =============================================================================
  // Edge Cases and Error Handling Tests
  // =============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle single phase tapering', () => {
      const singlePhase: TaperingPhase[] = [
        {
          name: 'Single Phase',
          dose: { value: 10, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 2, unit: 'weeks' }
        }
      ];

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      builder.buildSequentialInstructions(singlePhase);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('should have at least 2 phases')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle very short phase durations', () => {
      const shortPhases: TaperingPhase[] = [
        {
          name: 'Phase 1',
          dose: { value: 20, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'days' } // Very short
        },
        {
          name: 'Phase 2',
          dose: { value: 10, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 2, unit: 'days' } // Also short
        }
      ];

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      builder.buildSequentialInstructions(shortPhases);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('very short duration')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle inconsistent timing patterns', () => {
      const inconsistentPhases: TaperingPhase[] = [
        {
          name: 'Phase 1',
          dose: { value: 40, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        },
        {
          name: 'Phase 2',
          dose: { value: 20, unit: 'mg' },
          timing: { frequency: 2, period: 1, periodUnit: 'd' }, // Different frequency
          duration: { value: 1, unit: 'week' }
        }
      ];

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      builder.buildSequentialInstructions(inconsistentPhases);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('different timing pattern')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should throw error for missing complex configuration', () => {
      expect(() => {
        builder.getComplexResult();
      }).toThrow('No tapering phases configured');
    });

    it('should handle duration calculations with different units', () => {
      const mixedUnitPhases: TaperingPhase[] = [
        {
          name: 'Phase 1',
          dose: { value: 40, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 14, unit: 'days' }
        },
        {
          name: 'Phase 2',
          dose: { value: 20, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'month' }
        }
      ];

      builder.buildSequentialInstructions(mixedUnitPhases);
      const explanation = builder.explainComplexRegimen();
      
      // Should calculate total duration correctly
      expect(explanation).toContain('Total duration:');
    });
  });
});

// =============================================================================
// Validation Function Tests
// =============================================================================

describe('Tapering Validation Functions', () => {
  describe('isValidTaperingPhase', () => {
    it('should validate correct tapering phases', () => {
      const validPhases = [
        {
          name: 'Week 1',
          dose: { value: 40, unit: 'mg' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 1, unit: 'week' }
        },
        {
          name: 'Week 2',
          dose: { value: 20, unit: 'mg' },
          timing: { frequency: 2, period: 1, periodUnit: 'd' },
          duration: { value: 7, unit: 'days' },
          specialInstructions: ['Take with food'],
          transitionNote: 'Reduce if tolerated'
        }
      ];

      validPhases.forEach(phase => {
        expect(isValidTaperingPhase(phase)).toBe(true);
      });
    });

    it('should reject invalid tapering phases', () => {
      const invalidPhases = [
        null,
        undefined,
        { name: '', dose: { value: 40, unit: 'mg' }, timing: {}, duration: { value: 1, unit: 'week' } }, // Empty name
        { name: 'Week 1', dose: null, timing: {}, duration: { value: 1, unit: 'week' } }, // Invalid dose
        { name: 'Week 1', dose: { value: 40, unit: 'mg' }, timing: null, duration: { value: 1, unit: 'week' } }, // Invalid timing
        { name: 'Week 1', dose: { value: 40, unit: 'mg' }, timing: {}, duration: { value: 0, unit: 'week' } }, // Invalid duration
        { name: 'Week 1', dose: { value: 40, unit: 'mg' }, timing: {}, duration: { value: 1, unit: '' } }, // Empty duration unit
        { name: 'Week 1', dose: { value: 40, unit: 'mg' }, timing: {}, duration: { value: 1, unit: 'week' }, specialInstructions: 'not array' } // Invalid special instructions
      ];

      invalidPhases.forEach(phase => {
        expect(isValidTaperingPhase(phase)).toBe(false);
      });
    });
  });
});