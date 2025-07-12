import {
  SpecificityLevel,
  IBaseStrategy,
  IModifierStrategy,
  StrategyComposition,
  isValidStrategyComposition,
  compareSpecificity,
  sortModifiersByPriority
} from '../types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';

// Mock implementations for testing
class MockBaseStrategy implements IBaseStrategy {
  constructor(
    public specificity: SpecificityLevel,
    private matchPredicate: (context: MedicationRequestContext) => boolean
  ) {}

  matches(context: MedicationRequestContext): boolean {
    return this.matchPredicate(context);
  }

  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    return {
      text: `Base instruction for ${context.medication.name}`,
      doseAndRate: [{
        doseQuantity: {
          value: context.dose.value,
          unit: context.dose.unit
        }
      }]
    };
  }

  explain(): string {
    return `Base strategy with specificity ${this.specificity}`;
  }
}

class MockModifierStrategy implements IModifierStrategy {
  constructor(
    public priority: number,
    private applyPredicate: (context: MedicationRequestContext) => boolean,
    private modificationText: string
  ) {}

  appliesTo(context: MedicationRequestContext): boolean {
    return this.applyPredicate(context);
  }

  modify(instruction: SignatureInstruction, context: MedicationRequestContext): SignatureInstruction {
    return {
      ...instruction,
      text: `${instruction.text} ${this.modificationText}`
    };
  }

  explain(): string {
    return `Modifier with priority ${this.priority}: ${this.modificationText}`;
  }
}

describe('Strategy Pattern Types', () => {
  let mockContext: MedicationRequestContext;

  beforeEach(() => {
    mockContext = {
      id: 'ctx-123',
      timestamp: new Date().toISOString(),
      medication: {
        id: 'med-123',
        name: 'Test Medication',
        type: 'medication',
        isActive: true,
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Test Med' }] },
        ingredient: [{
          name: 'Test Ingredient',
          strengthRatio: {
            numerator: { value: 100, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        vendor: 'TestVendor',
        sku: 'SKU-123'
      },
      patient: {
        id: 'patient-123',
        age: 45
      },
      dose: { value: 100, unit: 'mg' },
      frequency: 'twice daily',
      route: 'by mouth'
    };
  });

  describe('SpecificityLevel', () => {
    it('should have correct ordering', () => {
      expect(SpecificityLevel.MEDICATION_SKU).toBeGreaterThan(SpecificityLevel.MEDICATION_ID);
      expect(SpecificityLevel.MEDICATION_ID).toBeGreaterThan(SpecificityLevel.DOSE_FORM_AND_INGREDIENT);
      expect(SpecificityLevel.DOSE_FORM_AND_INGREDIENT).toBeGreaterThan(SpecificityLevel.DOSE_FORM);
      expect(SpecificityLevel.DOSE_FORM).toBeGreaterThan(SpecificityLevel.DEFAULT);
    });

    it('should support comparison', () => {
      const strategies = [
        new MockBaseStrategy(SpecificityLevel.DEFAULT, () => true),
        new MockBaseStrategy(SpecificityLevel.MEDICATION_SKU, () => true),
        new MockBaseStrategy(SpecificityLevel.DOSE_FORM, () => true)
      ];

      const sorted = strategies.sort(compareSpecificity);
      expect(sorted[0].specificity).toBe(SpecificityLevel.MEDICATION_SKU);
      expect(sorted[1].specificity).toBe(SpecificityLevel.DOSE_FORM);
      expect(sorted[2].specificity).toBe(SpecificityLevel.DEFAULT);
    });
  });

  describe('IBaseStrategy', () => {
    it('should match based on medication SKU', () => {
      const skuStrategy = new MockBaseStrategy(
        SpecificityLevel.MEDICATION_SKU,
        (ctx) => ctx.medication.sku === 'SKU-123'
      );

      expect(skuStrategy.matches(mockContext)).toBe(true);
      
      mockContext.medication.sku = 'SKU-456';
      expect(skuStrategy.matches(mockContext)).toBe(false);
    });

    it('should match based on medication ID', () => {
      const idStrategy = new MockBaseStrategy(
        SpecificityLevel.MEDICATION_ID,
        (ctx) => ctx.medication.id === 'med-123'
      );

      expect(idStrategy.matches(mockContext)).toBe(true);
    });

    it('should match based on dose form and ingredient', () => {
      const formIngredientStrategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM_AND_INGREDIENT,
        (ctx) => ctx.medication.doseForm === 'Tablet' && 
                 ctx.medication.ingredient[0].name === 'Test Ingredient'
      );

      expect(formIngredientStrategy.matches(mockContext)).toBe(true);
    });

    it('should build instruction', () => {
      const strategy = new MockBaseStrategy(SpecificityLevel.DEFAULT, () => true);
      const instruction = strategy.buildInstruction(mockContext);

      expect(instruction.text).toContain('Test Medication');
      expect(instruction.doseAndRate?.[0].doseQuantity?.value).toBe(100);
    });
  });

  describe('IModifierStrategy', () => {
    it('should apply based on predicate', () => {
      const ageModifier = new MockModifierStrategy(
        10,
        (ctx) => ctx.patient.age! > 65,
        'for elderly patient'
      );

      expect(ageModifier.appliesTo(mockContext)).toBe(false);

      mockContext.patient.age = 70;
      expect(ageModifier.appliesTo(mockContext)).toBe(true);
    });

    it('should modify instruction', () => {
      const foodModifier = new MockModifierStrategy(
        5,
        (ctx) => ctx.specialInstructions?.includes('with food') || false,
        'with food'
      );

      const baseInstruction: SignatureInstruction = {
        text: 'Take 1 tablet by mouth'
      };

      mockContext.specialInstructions = 'with food';
      const modified = foodModifier.modify(baseInstruction, mockContext);

      expect(modified.text).toBe('Take 1 tablet by mouth with food');
    });

    it('should sort by priority', () => {
      const modifiers: IModifierStrategy[] = [
        new MockModifierStrategy(20, () => true, 'low priority'),
        new MockModifierStrategy(5, () => true, 'high priority'),
        new MockModifierStrategy(15, () => true, 'medium priority')
      ];

      const sorted = sortModifiersByPriority(modifiers);
      expect(sorted[0].priority).toBe(5);
      expect(sorted[1].priority).toBe(15);
      expect(sorted[2].priority).toBe(20);
    });
  });

  describe('StrategyComposition', () => {
    it('should compose base and modifiers', () => {
      const composition: StrategyComposition = {
        base: new MockBaseStrategy(SpecificityLevel.MEDICATION_ID, () => true),
        modifiers: [
          new MockModifierStrategy(5, () => true, 'with water'),
          new MockModifierStrategy(10, () => true, 'at bedtime')
        ]
      };

      expect(composition.base.specificity).toBe(SpecificityLevel.MEDICATION_ID);
      expect(composition.modifiers).toHaveLength(2);
    });

    it('should validate composition', () => {
      const validComposition: StrategyComposition = {
        base: new MockBaseStrategy(SpecificityLevel.DEFAULT, () => true),
        modifiers: []
      };

      expect(isValidStrategyComposition(validComposition)).toBe(true);

      const invalidComposition: any = {
        base: null,
        modifiers: []
      };

      expect(isValidStrategyComposition(invalidComposition)).toBe(false);
    });
  });

  describe('Strategy execution flow', () => {
    it('should apply modifiers in priority order', () => {
      const base = new MockBaseStrategy(SpecificityLevel.DEFAULT, () => true);
      const modifiers = [
        new MockModifierStrategy(20, () => true, '| Step 3'),
        new MockModifierStrategy(5, () => true, '| Step 1'),
        new MockModifierStrategy(10, () => true, '| Step 2')
      ];

      let instruction = base.buildInstruction(mockContext);
      const sortedModifiers = sortModifiersByPriority(modifiers);
      
      for (const modifier of sortedModifiers) {
        if (modifier.appliesTo(mockContext)) {
          instruction = modifier.modify(instruction, mockContext);
        }
      }

      expect(instruction.text).toBe('Base instruction for Test Medication | Step 1 | Step 2 | Step 3');
    });

    it('should skip non-applicable modifiers', () => {
      const base = new MockBaseStrategy(SpecificityLevel.DEFAULT, () => true);
      const modifiers = [
        new MockModifierStrategy(5, () => false, '| Should not apply'),
        new MockModifierStrategy(10, () => true, '| Should apply')
      ];

      let instruction = base.buildInstruction(mockContext);
      
      for (const modifier of modifiers) {
        if (modifier.appliesTo(mockContext)) {
          instruction = modifier.modify(instruction, mockContext);
        }
      }

      expect(instruction.text).toBe('Base instruction for Test Medication | Should apply');
      expect(instruction.text).not.toContain('Should not apply');
    });
  });

  describe('Explain functionality', () => {
    it('should provide explanations for strategies', () => {
      const base = new MockBaseStrategy(SpecificityLevel.MEDICATION_SKU, () => true);
      const modifier = new MockModifierStrategy(5, () => true, 'with special handling');

      expect(base.explain()).toContain('specificity 4');
      expect(modifier.explain()).toContain('priority 5');
      expect(modifier.explain()).toContain('with special handling');
    });
  });
});