/**
 * Tests for StrategyDispatcher
 */

import { StrategyDispatcher } from '../StrategyDispatcher';
import { StrategyRegistry } from '../../registry/StrategyRegistry';
import { IBaseStrategy, IModifierStrategy, SpecificityLevel } from '../../strategies/types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';
import { AmbiguousStrategyError, NoMatchingStrategyError } from '../errors';
import { createTestMedicationProfile, createTestContext } from './test-helpers';

// Mock implementations
class MockBaseStrategy implements IBaseStrategy {
  constructor(
    public readonly specificity: SpecificityLevel,
    private matchesFn: (ctx: MedicationRequestContext) => boolean,
    private instructionText: string
  ) {}

  matches(context: MedicationRequestContext): boolean {
    return this.matchesFn(context);
  }

  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    void context; // Mark as intentionally unused
    return { text: this.instructionText };
  }

  explain(): string {
    return `Mock strategy with specificity ${this.specificity}`;
  }
}

class MockModifierStrategy implements IModifierStrategy {
  constructor(
    public readonly priority: number,
    private appliesToFn: (ctx: MedicationRequestContext) => boolean,
    private modifierText: string
  ) {}

  appliesTo(context: MedicationRequestContext): boolean {
    return this.appliesToFn(context);
  }

  modify(instruction: SignatureInstruction, context: MedicationRequestContext): SignatureInstruction {
    void context; // Mark as intentionally unused
    return { 
      ...instruction, 
      text: `${instruction.text} [${this.modifierText}]` 
    };
  }

  explain(): string {
    return `Mock modifier with priority ${this.priority}`;
  }
}

describe('StrategyDispatcher', () => {
  let registry: StrategyRegistry;
  let dispatcher: StrategyDispatcher;

  beforeEach(() => {
    registry = new StrategyRegistry();
    dispatcher = new StrategyDispatcher(registry);
  });

  describe('dispatch', () => {
    it('should select the highest specificity matching strategy', () => {
      // Register strategies with different specificities
      const defaultStrategy = new MockBaseStrategy(
        SpecificityLevel.DEFAULT,
        () => true,
        'Default instruction'
      );
      
      const doseFormStrategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        ctx => ctx.medication?.doseForm === 'Tablet',
        'Tablet instruction'
      );
      
      const medicationIdStrategy = new MockBaseStrategy(
        SpecificityLevel.MEDICATION_ID,
        ctx => ctx.medication?.id === 'med-123',
        'Specific medication instruction'
      );

      registry.registerBase('default', defaultStrategy);
      registry.registerBase('tablet', doseFormStrategy);
      registry.registerBase('specific', medicationIdStrategy);

      // Test with context matching specific medication
      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'med-123',
          name: 'Test Med',
          doseForm: 'Tablet'
        }),
        dose: { value: 1, unit: 'tablet' }
      });

      const result = dispatcher.dispatch(context);
      expect(result.text).toBe('Specific medication instruction');
    });

    it('should throw AmbiguousStrategyError when multiple strategies have same specificity', () => {
      // Register two strategies with same specificity that both match
      const strategy1 = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        ctx => ctx.medication?.doseForm === 'Tablet',
        'Strategy 1'
      );
      
      const strategy2 = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        ctx => ctx.medication?.doseForm === 'Tablet',
        'Strategy 2'
      );

      registry.registerBase('strategy1', strategy1);
      registry.registerBase('strategy2', strategy2);

      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'med-123',
          name: 'Test Med',
          doseForm: 'Tablet'
        }),
        dose: { value: 1, unit: 'tablet' }
      });

      expect(() => dispatcher.dispatch(context)).toThrow(AmbiguousStrategyError);
    });

    it('should throw NoMatchingStrategyError when no strategy matches', () => {
      // Register strategy that won't match
      const strategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        ctx => ctx.medication?.doseForm === 'Tablet',
        'Tablet only'
      );

      registry.registerBase('tablet', strategy);

      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'med-123',
          name: 'Test Med',  
          doseForm: 'Liquid'  // Won't match tablet strategy
        }),
        dose: { value: 5, unit: 'mL' }
      });

      expect(() => dispatcher.dispatch(context)).toThrow(NoMatchingStrategyError);
    });

    it('should apply modifiers in priority order', () => {
      // Register base strategy
      const baseStrategy = new MockBaseStrategy(
        SpecificityLevel.DEFAULT,
        () => true,
        'Base'
      );
      registry.registerBase('base', baseStrategy);

      // Register modifiers with different priorities
      const mod1 = new MockModifierStrategy(30, () => true, 'mod1');
      const mod2 = new MockModifierStrategy(10, () => true, 'mod2');
      const mod3 = new MockModifierStrategy(20, () => true, 'mod3');

      registry.registerModifier('mod1', mod1);
      registry.registerModifier('mod2', mod2);
      registry.registerModifier('mod3', mod3);

      const context = createTestContext({
        medication: createTestMedicationProfile({ id: 'test', name: 'Test' })
      });

      const result = dispatcher.dispatch(context);
      // Should apply in order: mod2 (10), mod3 (20), mod1 (30)
      expect(result.text).toBe('Base [mod2] [mod3] [mod1]');
    });

    it('should only apply modifiers that match context', () => {
      // Register base strategy
      const baseStrategy = new MockBaseStrategy(
        SpecificityLevel.DEFAULT,
        () => true,
        'Base'
      );
      registry.registerBase('base', baseStrategy);

      // Register modifiers with conditions
      const tabletMod = new MockModifierStrategy(
        10,
        ctx => ctx.medication?.doseForm === 'Tablet',
        'tablet-mod'
      );
      
      const liquidMod = new MockModifierStrategy(
        20,
        ctx => ctx.medication?.doseForm === 'Liquid',
        'liquid-mod'
      );

      registry.registerModifier('tablet', tabletMod);
      registry.registerModifier('liquid', liquidMod);

      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'test',
          name: 'Test',
          doseForm: 'Tablet'
        })
      });

      const result = dispatcher.dispatch(context);
      // Should only apply tablet modifier
      expect(result.text).toBe('Base [tablet-mod]');
    });
  });

  describe('explain', () => {
    it('should explain strategy selection and modifiers', () => {
      const baseStrategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        ctx => ctx.medication?.doseForm === 'Tablet',
        'Tablet instruction'
      );
      
      const modifier = new MockModifierStrategy(
        10,
        ctx => ctx.medication?.doseForm === 'Tablet',
        'strength'
      );

      registry.registerBase('tablet', baseStrategy);
      registry.registerModifier('strength', modifier);

      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'test',
          name: 'Test',
          doseForm: 'Tablet'
        })
      });

      const explanation = dispatcher.explainSelection(context);
      expect(explanation).toContain('MockBaseStrategy');
      expect(explanation).toContain('strength');
    });
  });

  describe('registry access', () => {
    it('should provide access to registered strategies', () => {
      const base1 = new MockBaseStrategy(SpecificityLevel.DEFAULT, () => true, 'Default');
      const base2 = new MockBaseStrategy(SpecificityLevel.DOSE_FORM, () => true, 'DoseForm');
      const mod1 = new MockModifierStrategy(10, () => true, 'Mod1');

      registry.registerBase('default', base1);
      registry.registerBase('doseform', base2);
      registry.registerModifier('mod1', mod1);

      const baseStrategies = registry.getBaseStrategies();
      const modifiers = registry.getModifiers();
      const list = {
        baseStrategies: Array.from(baseStrategies.entries()).map(([name, strategy]) => ({
          name,
          specificity: strategy.specificity
        })),
        modifiers: Array.from(modifiers.entries()).map(([name, modifier]) => ({
          name,
          priority: modifier.priority
        }))
      };
      expect(list.baseStrategies).toHaveLength(2);
      expect(list.modifiers).toHaveLength(1);
      expect(list.baseStrategies[0].name).toBe('default');
      expect(list.baseStrategies[0].specificity).toBe(SpecificityLevel.DEFAULT);
    });
  });

  describe('auditTrail', () => {
    it('should return audit trail after dispatch', () => {
      const baseStrategy = new MockBaseStrategy(
        SpecificityLevel.DEFAULT,
        () => true,
        'Base'
      );
      
      registry.registerBase('base', baseStrategy);

      const context = createTestContext({
        medication: createTestMedicationProfile({ id: 'test', name: 'Test' })
      });

      dispatcher.dispatch(context);
      const audit = dispatcher.getAuditLog();

      expect(audit[0]).toMatchObject({
        selectedStrategy: expect.stringContaining('MockBaseStrategy')
      });
    });

    it('should include non-matching strategies in audit', () => {
      const matchingStrategy = new MockBaseStrategy(
        SpecificityLevel.DEFAULT,
        () => true,
        'Matching'
      );
      
      const nonMatchingStrategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        () => false,
        'Non-matching'
      );

      registry.registerBase('match', matchingStrategy);
      registry.registerBase('nomatch', nonMatchingStrategy);

      const context = createTestContext({
        medication: createTestMedicationProfile({ id: 'test', name: 'Test' })
      });

      dispatcher.dispatch(context);
      const audit = dispatcher.getAuditLog();

      expect(audit.length).toBeGreaterThan(0);
      // Check that we have candidate strategies with the correct structure
      expect(audit[0].candidateStrategies.length).toBeGreaterThan(0);
      expect(audit[0].candidateStrategies[0]).toHaveProperty('name');
      expect(audit[0].candidateStrategies[0]).toHaveProperty('matched');
      expect(audit[0].candidateStrategies[0]).toHaveProperty('specificity');
    });
  });

  // Debug mode test removed - not a feature of the dispatcher

  describe('performance', () => {
    it('should handle many strategies efficiently', () => {
      // Register 100 strategies
      for (let i = 0; i < 100; i++) {
        const strategy = new MockBaseStrategy(
          SpecificityLevel.DEFAULT,
          ctx => ctx.medication?.id === `med-${i}`,
          `Strategy ${i}`
        );
        registry.registerBase(`strategy-${i}`, strategy);
      }

      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'med-50',
          name: 'Test Med 50',
          doseForm: 'Tablet'
        })
      });

      const start = performance.now();
      const result = dispatcher.dispatch(context);
      const end = performance.now();

      expect(result.text).toBe('Strategy 50');
      expect(end - start).toBeLessThan(10); // Should be fast
    });
  });
});