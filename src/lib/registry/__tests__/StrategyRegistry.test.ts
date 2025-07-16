/**
 * Tests for StrategyRegistry
 */

import { StrategyRegistry } from '../StrategyRegistry';
import { IBaseStrategy, IModifierStrategy, SpecificityLevel } from '../../strategies/types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';
import { DuplicateStrategyError, PriorityConflictError } from '../../dispatcher/errors';
import { createTestMedicationProfile, createTestContext } from '../../dispatcher/__tests__/test-helpers';

// Mock strategies for testing
class MockBaseStrategy implements IBaseStrategy {
  constructor(
    public specificity: SpecificityLevel,
    private matchCondition: (ctx: MedicationRequestContext) => boolean = () => true
  ) {}

  matches(context: MedicationRequestContext): boolean {
    return this.matchCondition(context);
  }

  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    void context; // Mark as intentionally unused
    return { text: 'Mock instruction' };
  }

  explain(): string {
    return 'Mock base strategy';
  }
}

class MockModifierStrategy implements IModifierStrategy {
  constructor(
    public priority: number,
    private applyCondition: (ctx: MedicationRequestContext) => boolean = () => true
  ) {}

  appliesTo(context: MedicationRequestContext): boolean {
    return this.applyCondition(context);
  }

  modify(instruction: SignatureInstruction, context: MedicationRequestContext): SignatureInstruction {
    void context; // Mark as intentionally unused
    return {
      ...instruction,
      text: (instruction.text || '') + ' [modified]'
    };
  }

  explain(): string {
    return 'Mock modifier strategy';
  }
}

describe('StrategyRegistry', () => {
  let registry: StrategyRegistry;

  beforeEach(() => {
    registry = new StrategyRegistry();
  });

  describe('registerBase', () => {
    it('should register a base strategy successfully', () => {
      const strategy = new MockBaseStrategy(SpecificityLevel.DEFAULT);
      
      expect(() => registry.registerBase('test', strategy)).not.toThrow();
      
      const strategies = registry.getBaseStrategies();
      expect(strategies.size).toBe(1);
      expect(strategies.get('test')).toBe(strategy);
    });

    it('should throw DuplicateStrategyError when registering duplicate name', () => {
      const strategy1 = new MockBaseStrategy(SpecificityLevel.DEFAULT);
      const strategy2 = new MockBaseStrategy(SpecificityLevel.DOSE_FORM);
      
      registry.registerBase('test', strategy1);
      
      expect(() => registry.registerBase('test', strategy2))
        .toThrow(DuplicateStrategyError);
    });

    it('should track registration order', () => {
      registry.registerBase('first', new MockBaseStrategy(SpecificityLevel.DEFAULT));
      registry.registerBase('second', new MockBaseStrategy(SpecificityLevel.DOSE_FORM));
      
      const order = registry.getRegistrationOrder();
      expect(order).toEqual(['base:first', 'base:second']);
    });

    it('should validate specificity conflicts (warning only)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      registry.registerBase('strategy1', new MockBaseStrategy(SpecificityLevel.DOSE_FORM));
      registry.registerBase('strategy2', new MockBaseStrategy(SpecificityLevel.DOSE_FORM));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Multiple strategies at specificity')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('registerModifier', () => {
    it('should register a modifier successfully', () => {
      const modifier = new MockModifierStrategy(10);
      
      expect(() => registry.registerModifier('test', modifier)).not.toThrow();
      
      const modifiers = registry.getModifiers();
      expect(modifiers.size).toBe(1);
      expect(modifiers.get('test')).toBe(modifier);
    });

    it('should throw DuplicateStrategyError when registering duplicate name', () => {
      const modifier1 = new MockModifierStrategy(10);
      const modifier2 = new MockModifierStrategy(20);
      
      registry.registerModifier('test', modifier1);
      
      expect(() => registry.registerModifier('test', modifier2))
        .toThrow(DuplicateStrategyError);
    });

    it('should throw PriorityConflictError when priorities conflict', () => {
      const modifier1 = new MockModifierStrategy(10);
      const modifier2 = new MockModifierStrategy(10); // Same priority
      
      registry.registerModifier('mod1', modifier1);
      
      expect(() => registry.registerModifier('mod2', modifier2))
        .toThrow(PriorityConflictError);
    });

    it('should track registration order', () => {
      registry.registerModifier('first', new MockModifierStrategy(10));
      registry.registerModifier('second', new MockModifierStrategy(20));
      
      const order = registry.getRegistrationOrder();
      expect(order).toEqual(['modifier:first', 'modifier:second']);
    });
  });

  describe('unregister operations', () => {
    it('should unregister base strategy', () => {
      const strategy = new MockBaseStrategy(SpecificityLevel.DEFAULT);
      registry.registerBase('test', strategy);
      
      const result = registry.unregisterBase('test');
      expect(result).toBe(true);
      expect(registry.getBaseStrategies().size).toBe(0);
      expect(registry.getRegistrationOrder()).toEqual([]);
    });

    it('should return false when unregistering non-existent base', () => {
      const result = registry.unregisterBase('non-existent');
      expect(result).toBe(false);
    });

    it('should unregister modifier', () => {
      const modifier = new MockModifierStrategy(10);
      registry.registerModifier('test', modifier);
      
      const result = registry.unregisterModifier('test');
      expect(result).toBe(true);
      expect(registry.getModifiers().size).toBe(0);
      expect(registry.getRegistrationOrder()).toEqual([]);
    });
  });

  describe('getCompositionChain', () => {
    it('should return composition chain for matching context', () => {
      const baseStrategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        ctx => ctx.medication?.doseForm === 'Tablet'
      );
      const modifier1 = new MockModifierStrategy(
        10,
        ctx => ctx.medication?.doseForm === 'Tablet'
      );
      const modifier2 = new MockModifierStrategy(
        20,
        () => true
      );

      registry.registerBase('tablet', baseStrategy);
      registry.registerModifier('tablet-mod', modifier1);
      registry.registerModifier('universal', modifier2);

      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'test',
          name: 'Test',
          doseForm: 'Tablet'
        })
      });

      const chain = registry.getCompositionChain(context);
      expect(chain.base.name).toBe('tablet');
      expect(chain.base.specificity).toBe(SpecificityLevel.DOSE_FORM);
      expect(chain.modifiers).toHaveLength(2);
      expect(chain.modifiers[0].name).toBe('tablet-mod');
      expect(chain.modifiers[0].priority).toBe(10);
      expect(chain.modifiers[1].name).toBe('universal');
      expect(chain.modifiers[1].priority).toBe(20);
    });

    it('should return empty base when no strategy matches', () => {
      const baseStrategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        () => false // Never matches
      );
      registry.registerBase('never-match', baseStrategy);

      const context = createTestContext({
        medication: createTestMedicationProfile({ id: 'test', name: 'Test' })
      });

      const chain = registry.getCompositionChain(context);
      expect(chain.base.name).toBe('none');
      expect(chain.base.specificity).toBe(SpecificityLevel.DEFAULT);
      expect(chain.modifiers).toHaveLength(0);
    });
  });

  describe('visualizeRegistry', () => {
    it('should provide readable visualization', () => {
      registry.registerBase('default', new MockBaseStrategy(SpecificityLevel.DEFAULT));
      registry.registerBase('tablet', new MockBaseStrategy(SpecificityLevel.DOSE_FORM));
      registry.registerModifier('mod1', new MockModifierStrategy(10));
      registry.registerModifier('mod2', new MockModifierStrategy(20));

      const visualization = registry.visualizeRegistry();
      
      expect(visualization).toContain('=== Strategy Registry ===');
      expect(visualization).toContain('Base Strategies:');
      expect(visualization).toContain('default [Specificity: 0]');
      expect(visualization).toContain('tablet [Specificity: 1]');
      expect(visualization).toContain('Modifier Strategies:');
      expect(visualization).toContain('mod1 [Priority: 10]');
      expect(visualization).toContain('mod2 [Priority: 20]');
      expect(visualization).toContain('Registration Order:');
    });
  });

  describe('explainSelection', () => {
    it('should explain selection process', () => {
      const baseStrategy = new MockBaseStrategy(
        SpecificityLevel.DOSE_FORM,
        ctx => ctx.medication?.doseForm === 'Tablet'
      );
      const modifier = new MockModifierStrategy(
        10,
        ctx => ctx.medication?.doseForm === 'Tablet'
      );

      registry.registerBase('tablet', baseStrategy);
      registry.registerModifier('tablet-mod', modifier);

      const context = createTestContext({
        medication: createTestMedicationProfile({
          id: 'test',
          name: 'Test',
          doseForm: 'Tablet'
        })
      });

      const explanation = registry.explainSelection(context);
      
      expect(explanation.context).toBe(context);
      expect(explanation.evaluated).toHaveLength(2);
      expect(explanation.selected.base).toBe('tablet');
      expect(explanation.selected.modifiers).toEqual(['tablet-mod']);
      expect(explanation.executionOrder).toEqual(['tablet', 'tablet-mod']);
    });
  });

  describe('clear', () => {
    it('should clear all registrations', () => {
      registry.registerBase('base1', new MockBaseStrategy(SpecificityLevel.DEFAULT));
      registry.registerBase('base2', new MockBaseStrategy(SpecificityLevel.DOSE_FORM));
      registry.registerModifier('mod1', new MockModifierStrategy(10));
      registry.registerModifier('mod2', new MockModifierStrategy(20));

      registry.clear();

      expect(registry.getBaseStrategies().size).toBe(0);
      expect(registry.getModifiers().size).toBe(0);
      expect(registry.getRegistrationOrder()).toEqual([]);
    });
  });
});