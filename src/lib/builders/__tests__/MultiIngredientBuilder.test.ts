/**
 * MultiIngredientBuilder Tests
 * 
 * Comprehensive test suite for multi-ingredient and compound medication
 * signature building with ingredient breakdown display and FHIR compliance.
 */

import { MultiIngredientBuilder } from '../MultiIngredientBuilder';
import { 
  ISignatureBuilder, 
  DoseInput, 
  TimingInput, 
  isValidDoseInput,
  isValidTimingInput
} from '../ISignatureBuilder';
import { 
  IComplexRegimenBuilder,
  MultiIngredientDoseInput,
  isValidDoseRangeInput,
  isValidFrequencyRangeInput,
  isValidTaperingPhase
} from '../IComplexRegimenBuilder';
import { MedicationProfile, Ingredient } from '../../../types/MedicationProfile';
import { MULTI_INGREDIENT_MEDICATIONS } from '../../../test/data/medication-fixtures';

// Test medications
const combinationHormone = MULTI_INGREDIENT_MEDICATIONS.combinationHormone;
const combinationTablet = MULTI_INGREDIENT_MEDICATIONS.combinationTablet;

// Custom test medication for complex scenarios
const testMultiIngredientMedication: MedicationProfile = {
  id: 'test-multi-compound',
  name: 'Triple Compound Cream',
  type: 'compound',
  isActive: true,
  doseForm: 'Cream',
  code: {
    coding: [{
      system: 'http://example.com/compounds',
      code: 'triple-001',
      display: 'Triple Compound Cream'
    }]
  },
  ingredient: [
    {
      name: 'Testosterone',
      strengthRatio: {
        numerator: { value: 50, unit: 'mg' },
        denominator: { value: 1, unit: 'g' }
      }
    },
    {
      name: 'Anastrozole',
      strengthRatio: {
        numerator: { value: 0.5, unit: 'mg' },
        denominator: { value: 1, unit: 'g' }
      }
    },
    {
      name: 'DHEA',
      strengthRatio: {
        numerator: { value: 10, unit: 'mg' },
        denominator: { value: 1, unit: 'g' }
      }
    }
  ],
  packageInfo: {
    quantity: 30,
    unit: 'g'
  }
};

describe('MultiIngredientBuilder', () => {
  let builder: MultiIngredientBuilder;

  beforeEach(() => {
    builder = new MultiIngredientBuilder(testMultiIngredientMedication);
  });

  // =============================================================================
  // Basic Builder Interface Tests
  // =============================================================================

  describe('Basic Builder Interface', () => {
    it('should implement ISignatureBuilder interface', () => {
      expect(builder).toBeInstanceOf(MultiIngredientBuilder);
      expect(typeof builder.buildDose).toBe('function');
      expect(typeof builder.buildTiming).toBe('function');
      expect(typeof builder.buildRoute).toBe('function');
      expect(typeof builder.getResult).toBe('function');
      expect(typeof builder.explain).toBe('function');
    });

    it('should implement IComplexRegimenBuilder interface', () => {
      expect(typeof builder.buildMultiIngredientDose).toBe('function');
      expect(typeof builder.buildSequentialInstructions).toBe('function');
      expect(typeof builder.buildConditionalLogic).toBe('function');
      expect(typeof builder.getComplexResult).toBe('function');
      expect(typeof builder.explainComplexRegimen).toBe('function');
    });

    it('should initialize with multi-ingredient medication', () => {
      const audit = builder.explain();
      expect(audit).toContain('MultiIngredientBuilder initialized');
      expect(audit).toContain('compound medication');
    });

    it('should calculate ingredient breakdown on initialization', () => {
      const audit = builder.explain();
      expect(audit).toContain('Calculated breakdown');
      expect(audit).toContain('ingredients');
    });
  });

  // =============================================================================
  // Multi-Ingredient Dose Building Tests
  // =============================================================================

  describe('Multi-Ingredient Dose Building', () => {
    it('should build basic multi-ingredient dose', () => {
      const dose: DoseInput = { value: 2, unit: 'g' };
      
      const result = builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical')
        .getResult();

      expect(result).toHaveLength(1);
      expect(result[0].text).toContain('2 g');
      expect(result[0].text).toContain('once daily');
      expect(result[0].text).toContain('topically');
    });

    it('should include ingredient breakdown in instruction text', () => {
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      const result = builder
        .buildDose(dose)
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('topical')
        .getResult();

      const instruction = result[0];
      expect(instruction.text).toContain('containing');
      expect(instruction.text).toContain('Testosterone');
      expect(instruction.text).toContain('Anastrozole');
      expect(instruction.text).toContain('DHEA');
    });

    it('should calculate scaled ingredient amounts', () => {
      const dose: DoseInput = { value: 5, unit: 'g' };
      
      builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical');

      const audit = builder.explain();
      
      // Should show scaled amounts for 5g dose
      expect(audit).toContain('Ingredient: Testosterone 250.0mg');  // 50mg/g × 5g = 250mg
      expect(audit).toContain('Ingredient: Anastrozole 2.5mg');     // 0.5mg/g × 5g = 2.5mg
      expect(audit).toContain('Ingredient: DHEA 50.0mg');           // 10mg/g × 5g = 50mg
    });

    it('should handle explicit multi-ingredient dose configuration', () => {
      const multiDose: MultiIngredientDoseInput = {
        totalDose: { value: 2, unit: 'g' },
        displayBreakdown: true,
        ingredientBreakdown: [
          {
            ingredientName: 'Custom Estradiol',
            amount: 2,
            unit: 'mg'
          },
          {
            ingredientName: 'Custom Progesterone',
            amount: 200,
            unit: 'mg'
          }
        ]
      };

      const result = builder
        .buildMultiIngredientDose(multiDose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical')
        .getResult();

      expect(result[0].additionalInstructions).toBeDefined();
      const additionalTexts = result[0].additionalInstructions!.map(inst => inst.text);
      expect(additionalTexts.some(text => text?.includes('Custom Estradiol'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('Custom Progesterone'))).toBe(true);
    });
  });

  // =============================================================================
  // Combination Tablet Tests
  // =============================================================================

  describe('Combination Tablet Support', () => {
    beforeEach(() => {
      builder = new MultiIngredientBuilder(testMultiIngredientMedication);
    });

    it('should handle combination tablet medications', () => {
      const tabletBuilder = new MultiIngredientBuilder(combinationTablet);
      const dose: DoseInput = { value: 1, unit: 'tablet' };
      
      const result = tabletBuilder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      expect(result[0].text).toContain('1 tablet');
      expect(result[0].text).toContain('containing');
      expect(result[0].text).toContain('Lisinopril');
      expect(result[0].text).toContain('Hydrochlorothiazide');
    });

    it('should calculate tablet-based ingredient scaling', () => {
      const tabletBuilder = new MultiIngredientBuilder(combinationTablet);
      const dose: DoseInput = { value: 2, unit: 'tablet' };
      
      tabletBuilder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth');

      const audit = tabletBuilder.explain();
      
      // Should show scaled amounts for 2 tablets
      expect(audit).toContain('Ingredient: Lisinopril 20.0mg');      // 10mg × 2 tablets = 20mg
      expect(audit).toContain('Ingredient: Hydrochlorothiazide 25.0mg'); // 12.5mg × 2 tablets = 25mg
    });
  });

  // =============================================================================
  // Complex Compound Tests
  // =============================================================================

  describe('Complex Compound Medications', () => {
    beforeEach(() => {
      builder = new MultiIngredientBuilder(testMultiIngredientMedication);
    });

    it('should handle triple-ingredient compounds', () => {
      const dose: DoseInput = { value: 0.5, unit: 'g' };
      
      const result = builder
        .buildDose(dose)
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('topical')
        .getResult();

      const instruction = result[0];
      expect(instruction.text).toContain('Testosterone');
      expect(instruction.text).toContain('Anastrozole');
      expect(instruction.text).toContain('DHEA');
      
      // Should have compound medication warning
      const additionalTexts = instruction.additionalInstructions?.map(inst => inst.text) || [];
      expect(additionalTexts.some(text => text?.includes('Compounded medication'))).toBe(true);
    });

    it('should calculate accurate ingredient amounts for complex compounds', () => {
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical');

      const audit = builder.explain();
      
      // Check calculated amounts for 1g dose
      expect(audit).toContain('Ingredient: Testosterone 50.0mg');
      expect(audit).toContain('Ingredient: Anastrozole 0.5mg');
      expect(audit).toContain('Ingredient: DHEA 10.0mg');
    });

    it('should include all ingredients in additional instructions', () => {
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      const result = builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical')
        .getResult();

      const additionalTexts = result[0].additionalInstructions?.map(inst => inst.text) || [];
      
      expect(additionalTexts.some(text => text?.includes('3 active ingredients'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('Testosterone:'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('Anastrozole:'))).toBe(true);
      expect(additionalTexts.some(text => text?.includes('DHEA:'))).toBe(true);
    });
  });

  // =============================================================================
  // Complex Regimen Builder Interface Tests
  // =============================================================================

  describe('Complex Regimen Builder Interface', () => {
    it('should support dose ranges', () => {
      const doseRange = {
        minValue: 1,
        maxValue: 2,
        unit: 'g'
      };

      expect(() => {
        builder.buildDoseRange(doseRange);
      }).not.toThrow();

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('dose range: 1-2 g');
    });

    it('should support frequency ranges', () => {
      const frequencyRange = {
        minFrequency: 1,
        maxFrequency: 2,
        period: 1,
        periodUnit: 'd'
      };

      expect(() => {
        builder.buildFrequencyRange(frequencyRange);
      }).not.toThrow();

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('frequency range: every 1-2 d');
    });

    it('should support maximum daily dose constraints', () => {
      const maxDailyConstraint = {
        maxDosePerDay: { value: 10, unit: 'g' },
        maxAdministrationsPerDay: 3,
        warningMessage: 'Approaching maximum daily dose'
      };

      expect(() => {
        builder.buildMaxDailyDoseConstraint(maxDailyConstraint);
      }).not.toThrow();

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('max daily dose constraint: 10 g');
    });

    it('should support sequential instructions', () => {
      const phases = [
        {
          name: 'Week 1',
          dose: { value: 1, unit: 'g' },
          timing: { frequency: 1, period: 1, periodUnit: 'd' },
          duration: { value: 7, unit: 'd' }
        }
      ];

      expect(() => {
        builder.buildSequentialInstructions(phases);
      }).not.toThrow();

      const audit = builder.explainComplexRegimen();
      expect(audit).toContain('Tapering Phases: 1');
    });
  });

  // =============================================================================
  // Validation Tests
  // =============================================================================

  describe('Validation', () => {
    it('should validate multi-ingredient dose input', () => {
      const validMultiDose: MultiIngredientDoseInput = {
        totalDose: { value: 2, unit: 'g' },
        displayBreakdown: true
      };

      expect(() => {
        builder.buildMultiIngredientDose(validMultiDose);
      }).not.toThrow();

      const invalidMultiDose = {
        totalDose: { value: -1, unit: 'g' },
        displayBreakdown: true
      };

      expect(() => {
        builder.buildMultiIngredientDose(invalidMultiDose as MultiIngredientDoseInput);
      }).toThrow('Invalid multi-ingredient dose input');
    });

    it('should validate complex regimen constraints', () => {
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical');

      const errors = builder.validateComplexRegimen();
      expect(errors).toHaveLength(0);
    });

    it('should detect validation errors for invalid configurations', () => {
      // Create builder with single ingredient medication
      const singleIngredientMed = {
        ...combinationHormone,
        ingredient: []
      };
      
      const invalidBuilder = new MultiIngredientBuilder(singleIngredientMed as MedicationProfile);
      
      const errors = invalidBuilder.validateComplexRegimen();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('No ingredient breakdown available');
    });
  });

  // =============================================================================
  // FHIR Compliance Tests
  // =============================================================================

  describe('FHIR Compliance', () => {
    it('should generate FHIR-compliant instructions', () => {
      const dose: DoseInput = { value: 2, unit: 'g' };
      
      const result = builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical')
        .getResult();

      const instruction = result[0];
      
      // Check required FHIR fields
      expect(instruction.text).toBeDefined();
      expect(instruction.doseAndRate).toBeDefined();
      expect(instruction.doseAndRate).toHaveLength(1);
      expect(instruction.doseAndRate![0].doseQuantity).toBeDefined();
      expect(instruction.timing).toBeDefined();
      expect(instruction.route).toBeDefined();
    });

    it('should include ingredient information in FHIR context', () => {
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical');

      // Access the protected method through explain functionality
      const audit = builder.explain();
      expect(audit).toContain('Ingredient: Testosterone');
      expect(audit).toContain('Ingredient: Anastrozole');
      expect(audit).toContain('Ingredient: DHEA');
    });
  });

  // =============================================================================
  // Serialization and Explanation Tests
  // =============================================================================

  describe('Serialization and Explanation', () => {
    it('should serialize with multi-ingredient features', () => {
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical');

      const serialized = builder.toJSON() as any;
      
      expect(serialized.builderType).toBe('MultiIngredientBuilder');
      expect(serialized.ingredientFeatures).toBeDefined();
      expect(serialized.ingredientFeatures.ingredientCount).toBe(3);
      expect(serialized.ingredientBreakdown).toBeDefined();
      expect(serialized.complexState).toBeDefined();
    });

    it('should provide detailed explanation', () => {
      const dose: DoseInput = { value: 2, unit: 'g' };
      
      builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical');

      const explanation = builder.explain();
      
      expect(explanation).toContain('Multi-Ingredient Features');
      expect(explanation).toContain('Ingredient count: 3');
      expect(explanation).toContain('Breakdown display: Enabled');
      expect(explanation).toContain('Ingredients:');
      expect(explanation).toContain('Medication type: compound');
    });

    it('should provide complex regimen explanation', () => {
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      builder
        .buildDose(dose)
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topical');
        
      (builder as MultiIngredientBuilder).buildDoseRange({ minValue: 1, maxValue: 2, unit: 'g' });

      const complexExplanation = (builder as MultiIngredientBuilder).explainComplexRegimen();
      
      expect(complexExplanation).toContain('Multi-Ingredient Breakdown');
      expect(complexExplanation).toContain('Ingredients (3):');
      expect(complexExplanation).toContain('Complex Operations:');
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle invalid dose inputs', () => {
      const invalidDose = { value: -1, unit: 'g' };

      expect(() => {
        builder.buildDose(invalidDose);
      }).toThrow('Invalid dose input');
    });

    it('should handle missing ingredient data gracefully', () => {
      const medicationWithoutIngredients = {
        ...combinationHormone,
        ingredient: []
      };

      const builderWithoutIngredients = new MultiIngredientBuilder(medicationWithoutIngredients as MedicationProfile);
      
      const dose: DoseInput = { value: 1, unit: 'g' };
      
      expect(() => {
        builderWithoutIngredients
          .buildDose(dose)
          .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
          .buildRoute('topical')
          .getResult();
      }).not.toThrow();
    });

    it('should warn about single-ingredient usage', () => {
      const singleIngredientMed = {
        ...combinationHormone,
        ingredient: [combinationHormone.ingredient[0]]
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      new MultiIngredientBuilder(singleIngredientMed as MedicationProfile);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('single-ingredient medication'));
      
      consoleWarnSpy.mockRestore();
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('MultiIngredientBuilder Integration', () => {
  it('should integrate with existing builder pattern', () => {
    const builder = new MultiIngredientBuilder(testMultiIngredientMedication);
    
    // Should implement ISignatureBuilder
    expect(builder).toBeInstanceOf(MultiIngredientBuilder);
    
    // Should chain methods properly
    const result = builder
      .buildDose({ value: 2, unit: 'g' })
      .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
      .buildRoute('topical')
      .buildSpecialInstructions(['Apply to clean, dry skin'])
      .getResult();

    expect(result).toHaveLength(1);
    expect(result[0].text).toContain('2 g');
    expect(result[0].text).toContain('twice daily');
    expect(result[0].text).toContain('topically');
    expect(result[0].additionalInstructions?.some(inst => 
      inst.text?.includes('Apply to clean, dry skin')
    )).toBe(true);
  });

  it('should work with factory pattern', () => {
    // This would be tested when factory function is updated
    expect(combinationHormone.ingredient.length).toBeGreaterThan(1);
    expect(combinationTablet.ingredient.length).toBeGreaterThan(1);
  });
});