/**
 * Tests for Days Supply Strategy Dispatcher
 * 
 * Validates strategy selection, calculation accuracy, and
 * integration between different calculation strategies.
 */

import {
  DaysSupplyStrategyDispatcher,
  calculateDaysSupply,
  createDaysSupplyContext,
  quickDaysSupplyCalculation,
  STRATEGY_SELECTION_EXAMPLES
} from '../index';
import { SpecificityLevel } from '../../types';

describe('DaysSupplyStrategyDispatcher', () => {
  let dispatcher: DaysSupplyStrategyDispatcher;

  beforeEach(() => {
    dispatcher = new DaysSupplyStrategyDispatcher();
  });

  describe('Strategy Selection', () => {
    it('should select titration strategy for multi-phase dosing', () => {
      const context = createDaysSupplyContext(
        1000, 'units', 12.5, 'units',
        ['Week 1-4: once weekly', 'Week 5-8: once weekly', 'Week 9+: once weekly']
      );

      const strategy = dispatcher.getStrategy(context);
      
      expect(strategy.id).toBe('titration-days-supply');
      expect(strategy.specificity).toBe(SpecificityLevel.DOSE_FORM_AND_INGREDIENT);
    });

    it('should select tablet strategy for solid dosage forms', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 1, 'tablet', 'twice daily',
        { doseForm: 'Tablet' }
      );

      const strategy = dispatcher.getStrategy(context);
      
      expect(strategy.id).toBe('tablet-days-supply');
      expect(strategy.specificity).toBe(SpecificityLevel.DOSE_FORM);
    });

    it('should select liquid strategy for liquid dosage forms', () => {
      const context = createDaysSupplyContext(
        120, 'mL', 5, 'mL', 'three times daily',
        { doseForm: 'Solution' }
      );

      const strategy = dispatcher.getStrategy(context);
      
      expect(strategy.id).toBe('liquid-days-supply');
      expect(strategy.specificity).toBe(SpecificityLevel.DOSE_FORM);
    });

    it('should select default strategy when no specific match', () => {
      const context = createDaysSupplyContext(
        100, 'units', 1, 'unit', 'once daily'
        // No medication info
      );

      const strategy = dispatcher.getStrategy(context);
      
      expect(strategy.id).toBe('default-days-supply');
      expect(strategy.specificity).toBe(SpecificityLevel.DEFAULT);
    });
  });

  describe('Calculation Integration', () => {
    it('should calculate titration days supply correctly', () => {
      const context = createDaysSupplyContext(
        1000, 'units', 12.5, 'units',
        ['Week 1-4: once weekly', 'Week 5-8: once weekly', 'Week 9+: once weekly']
      );

      const result = calculateDaysSupply(context);
      
      expect(result.daysSupply).toBeGreaterThan(0);
      expect(result.breakdown.titrationBreakdown).toBeDefined();
      expect(result.breakdown.titrationBreakdown!.phases).toHaveLength(3);
      expect(result.calculationMethod).toContain('Multi-phase titration');
    });

    it('should calculate tablet days supply with weight conversion', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 1000, 'mg', 'twice daily',
        {
          doseForm: 'Tablet',
          ingredient: [{
            strengthRatio: {
              numerator: { value: 500, unit: 'mg' },
              denominator: { value: 1, unit: 'tablet' }
            }
          }]
        }
      );

      const result = calculateDaysSupply(context);
      
      expect(result.daysSupply).toBe(7); // 30 tablets / (2 tablets × 2 doses) = 7.5 days, rounded down
      expect(result.breakdown.conversions).toBeDefined();
      expect(result.breakdown.conversions!.length).toBeGreaterThan(0);
    });

    it('should calculate liquid days supply with concentration', () => {
      const context = createDaysSupplyContext(
        120, 'mL', 250, 'mg', 'three times daily',
        {
          doseForm: 'Solution',
          ingredient: [{
            strengthRatio: {
              numerator: { value: 50, unit: 'mg' },
              denominator: { value: 1, unit: 'mL' }
            }
          }]
        }
      );

      const result = calculateDaysSupply(context);
      
      expect(result.daysSupply).toBe(8); // 120 mL / (5 mL × 3 doses) = 8 days
      expect(result.breakdown.conversions).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid package quantity', () => {
      const context = createDaysSupplyContext(
        0, 'tablet', 1, 'tablet', 'once daily'
      );

      expect(() => calculateDaysSupply(context)).toThrow();
    });

    it('should handle invalid dose amount', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 0, 'tablet', 'once daily'
      );

      expect(() => calculateDaysSupply(context)).toThrow();
    });

    it('should handle empty timing', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 1, 'tablet', ''
      );

      expect(() => calculateDaysSupply(context)).toThrow();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete calculations within time limit', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 1, 'tablet', 'twice daily'
      );

      const startTime = Date.now();
      const result = calculateDaysSupply(context);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(100); // Should be much faster than 100ms
      expect(result.daysSupply).toBe(15);
    });

    it('should handle complex titration calculation efficiently', () => {
      const context = createDaysSupplyContext(
        1000, 'units', 12.5, 'units',
        ['Week 1-4: once weekly', 'Week 5-8: once weekly', 'Week 9+: once weekly']
      );

      const startTime = Date.now();
      const result = calculateDaysSupply(context);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(50); // Even complex calculations should be fast
      expect(result.daysSupply).toBeGreaterThan(0);
    });
  });

  describe('Strategy Information', () => {
    it('should provide strategy selection information', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 1, 'tablet', 'twice daily',
        { doseForm: 'Tablet' }
      );

      const info = dispatcher.getStrategyInfo(context);
      
      expect(info.selectedStrategy).toContain('Tablet');
      expect(info.allMatches).toContain('Tablet/Capsule Days Supply Calculator');
      expect(info.selectionReason).toContain('specificity');
    });

    it('should list all available strategies', () => {
      const strategies = dispatcher.getAvailableStrategies();
      
      expect(strategies.length).toBeGreaterThan(3);
      expect(strategies.some(s => s.id === 'titration-days-supply')).toBe(true);
      expect(strategies.some(s => s.id === 'tablet-days-supply')).toBe(true);
      expect(strategies.some(s => s.id === 'liquid-days-supply')).toBe(true);
      expect(strategies.some(s => s.id === 'default-days-supply')).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    it('should provide quick calculation for simple cases', () => {
      const daysSupply = quickDaysSupplyCalculation(
        30, 'tablet', 1, 'tablet', 'once daily'
      );
      
      expect(daysSupply).toBe(30);
    });

    it('should return 0 for failed quick calculations', () => {
      const daysSupply = quickDaysSupplyCalculation(
        0, 'tablet', 1, 'tablet', 'once daily'
      );
      
      expect(daysSupply).toBe(0);
    });
  });

  describe('PRN Medications', () => {
    it('should handle PRN medications appropriately', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 1, 'tablet', 'as needed'
      );

      const result = calculateDaysSupply(context);
      
      expect(result.daysSupply).toBe(0);
      expect(result.warnings).toContain('PRN/as-needed medications cannot have days supply calculated');
    });
  });

  describe('Example Validation', () => {
    it('should match expected strategy for titration example', () => {
      const example = STRATEGY_SELECTION_EXAMPLES.TITRATION_SCHEDULE;
      const strategy = dispatcher.getStrategy(example.context);
      
      expect(strategy.name).toContain('Titration');
      expect(strategy.specificity).toBe(example.expectedSpecificity);
    });

    it('should match expected strategy for tablet example', () => {
      const example = STRATEGY_SELECTION_EXAMPLES.TABLET_MEDICATION;
      const strategy = dispatcher.getStrategy(example.context);
      
      expect(strategy.name).toContain('Tablet');
      expect(strategy.specificity).toBe(example.expectedSpecificity);
    });

    it('should match expected strategy for liquid example', () => {
      const example = STRATEGY_SELECTION_EXAMPLES.LIQUID_MEDICATION;
      const strategy = dispatcher.getStrategy(example.context);
      
      expect(strategy.name).toContain('Liquid');
      expect(strategy.specificity).toBe(example.expectedSpecificity);
    });
  });

  describe('Strategy Testing', () => {
    it('should test all strategies against a context', () => {
      const context = createDaysSupplyContext(
        30, 'tablet', 1, 'tablet', 'twice daily',
        { doseForm: 'Tablet' }
      );

      const testResults = dispatcher.testAllStrategies(context);
      
      expect(testResults).toHaveLength(4); // All strategies
      expect(testResults.some(r => r.matches && r.strategy.includes('Tablet'))).toBe(true);
      expect(testResults.some(r => r.matches && r.strategy.includes('Default'))).toBe(true);
      expect(testResults.some(r => !r.matches && r.strategy.includes('Titration'))).toBe(true);
    });
  });
});