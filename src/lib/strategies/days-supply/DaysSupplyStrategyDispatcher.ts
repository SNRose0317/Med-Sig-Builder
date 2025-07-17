/**
 * Days Supply Strategy Dispatcher
 * 
 * Central dispatcher that selects and executes the most appropriate
 * days supply calculation strategy based on medication context.
 * Supports titration schedules and various medication types.
 * 
 * @since 3.1.0
 */

import { DaysSupplyContext } from '../../temporal/types';
import { SpecificityLevel } from '../types';
import {
  IDaysSupplyStrategy,
  IDaysSupplyStrategyDispatcher,
  DaysSupplyResult,
  createDaysSupplyResult,
  CALCULATION_CONSTANTS,
  DaysSupplyCalculationError
} from './types';
import { calculationUtils } from './CalculationUtils';
import { TabletDaysSupplyStrategy } from './TabletDaysSupplyStrategy';
import { LiquidDaysSupplyStrategy } from './LiquidDaysSupplyStrategy';
import { TitrationDaysSupplyStrategy } from './TitrationDaysSupplyStrategy';

/**
 * Default strategy for cases where no specific strategy matches
 */
class DefaultDaysSupplyStrategy implements IDaysSupplyStrategy {
  readonly specificity = SpecificityLevel.DEFAULT;
  readonly id = 'default-days-supply';
  readonly name = 'Default Days Supply Calculator';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  matches(_: DaysSupplyContext): boolean {
    return true; // Always matches as fallback
  }

  calculate(context: DaysSupplyContext): DaysSupplyResult {
    // Basic calculation without specialized logic
    const warnings: string[] = [];

    // Simple frequency parsing
    let dosesPerDay = 1; // Default assumption
    if (typeof context.timing === 'string') {
      dosesPerDay = this.estimateDosesPerDay(context.timing);
    }

    if (dosesPerDay === 0) {
      return createDaysSupplyResult(
        0,
        'PRN medication - days supply cannot be calculated',
        {
          packageQuantity: context.packageQuantity,
          packageUnit: context.packageUnit,
          doseAmount: context.doseAmount,
          doseUnit: context.doseUnit,
          dosesPerDay: 0,
          consumptionPerDay: 0
        },
        CALCULATION_CONSTANTS.LOW_CONFIDENCE,
        ['PRN/as-needed medications cannot have days supply calculated']
      );
    }

    // Basic unit compatibility check
    if (!calculationUtils.areUnitsCompatible(context.doseUnit, context.packageUnit)) {
      warnings.push('Dose and package units may not be compatible - calculation may be inaccurate');
    }

    const consumptionPerDay = context.doseAmount * dosesPerDay;
    const daysSupply = Math.floor(context.packageQuantity / consumptionPerDay);

    return createDaysSupplyResult(
      daysSupply,
      'Basic calculation without specialized strategy',
      {
        packageQuantity: context.packageQuantity,
        packageUnit: context.packageUnit,
        doseAmount: context.doseAmount,
        doseUnit: context.doseUnit,
        dosesPerDay,
        consumptionPerDay
      },
      CALCULATION_CONSTANTS.MEDIUM_CONFIDENCE,
      warnings
    );
  }

  private estimateDosesPerDay(timing: string): number {
    const normalized = timing.toLowerCase();
    
    if (normalized.includes('once daily') || normalized.includes('daily')) return 1;
    if (normalized.includes('twice daily') || normalized.includes('bid')) return 2;
    if (normalized.includes('three times daily') || normalized.includes('tid')) return 3;
    if (normalized.includes('four times daily') || normalized.includes('qid')) return 4;
    if (normalized.includes('once weekly') || normalized.includes('weekly')) return 1/7;
    if (normalized.includes('prn') || normalized.includes('as needed')) return 0;
    
    return 1; // Default
  }

  explain(): string {
    return 'Default fallback calculator used when no specialized strategy matches. ' +
           'Provides basic days supply calculation with limited unit conversion support.';
  }
}

/**
 * Main strategy dispatcher implementation
 */
export class DaysSupplyStrategyDispatcher implements IDaysSupplyStrategyDispatcher {
  private readonly strategies: IDaysSupplyStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize all available strategies
   */
  private initializeStrategies(): void {
    // Order matters - more specific strategies first
    this.strategies.push(
      new TitrationDaysSupplyStrategy(),
      new TabletDaysSupplyStrategy(),
      new LiquidDaysSupplyStrategy(),
      new DefaultDaysSupplyStrategy() // Always last as fallback
    );
  }

  /**
   * Selects and executes the most appropriate strategy
   */
  calculateDaysSupply(context: DaysSupplyContext): DaysSupplyResult {
    const startTime = Date.now();

    try {
      // Validate input context
      const validationErrors = calculationUtils.validateInputs(context);
      if (validationErrors.length > 0) {
        throw new DaysSupplyCalculationError(
          `Invalid input context: ${validationErrors.join(', ')}`,
          context
        );
      }

      // Select appropriate strategy
      const strategy = this.getStrategy(context);
      
      // Execute calculation
      const result = strategy.calculate(context);

      // Add dispatcher metadata
      const executionTime = Date.now() - startTime;
      const warnings = result.warnings || [];
      
      if (executionTime > CALCULATION_CONSTANTS.MAX_CALCULATION_TIME_MS) {
        warnings.push(`Total calculation time: ${executionTime}ms`);
      }

      return {
        ...result,
        calculationMethod: `${result.calculationMethod} (via ${strategy.name})`,
        warnings
      };

    } catch (error) {
      if (error instanceof DaysSupplyCalculationError) {
        throw error;
      }

      throw new DaysSupplyCalculationError(
        `Dispatcher error: ${error instanceof Error ? error.message : String(error)}`,
        context,
        'DaysSupplyStrategyDispatcher'
      );
    }
  }

  /**
   * Gets the strategy that would be used for given context
   */
  getStrategy(context: DaysSupplyContext): IDaysSupplyStrategy {
    // Find matching strategies
    const matchingStrategies = this.strategies.filter(strategy => 
      strategy.matches(context)
    );

    if (matchingStrategies.length === 0) {
      throw new Error('No matching strategy found (should never happen with default strategy)');
    }

    // Sort by specificity (higher specificity first)
    const sortedStrategies = matchingStrategies.sort((a, b) => 
      b.specificity - a.specificity
    );

    return sortedStrategies[0];
  }

  /**
   * Lists all available strategies
   */
  getAvailableStrategies(): IDaysSupplyStrategy[] {
    return [...this.strategies];
  }

  /**
   * Add a custom strategy
   */
  addStrategy(strategy: IDaysSupplyStrategy): void {
    // Insert in correct position based on specificity
    const insertIndex = this.strategies.findIndex(s => 
      s.specificity < strategy.specificity
    );
    
    if (insertIndex === -1) {
      // Add at end (but before default strategy)
      this.strategies.splice(-1, 0, strategy);
    } else {
      this.strategies.splice(insertIndex, 0, strategy);
    }
  }

  /**
   * Remove a strategy by ID
   */
  removeStrategy(strategyId: string): boolean {
    const index = this.strategies.findIndex(s => s.id === strategyId);
    if (index !== -1 && index !== this.strategies.length - 1) { // Can't remove default
      this.strategies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get strategy information for debugging
   */
  getStrategyInfo(context: DaysSupplyContext): {
    selectedStrategy: string;
    allMatches: string[];
    selectionReason: string;
  } {
    const matchingStrategies = this.strategies.filter(strategy => 
      strategy.matches(context)
    );
    
    const selected = this.getStrategy(context);
    
    return {
      selectedStrategy: selected.name,
      allMatches: matchingStrategies.map(s => s.name),
      selectionReason: `Highest specificity: ${selected.specificity} (${SpecificityLevel[selected.specificity]})`
    };
  }

  /**
   * Test all strategies against a context
   */
  testAllStrategies(context: DaysSupplyContext): Array<{
    strategy: string;
    matches: boolean;
    specificity: number;
    result?: DaysSupplyResult;
    error?: string;
  }> {
    return this.strategies.map(strategy => {
      const matches = strategy.matches(context);
      const result: {
        strategy: string;
        matches: boolean;
        specificity: number;
        result?: DaysSupplyResult;
        error?: string;
      } = {
        strategy: strategy.name,
        matches,
        specificity: strategy.specificity
      };

      if (matches) {
        try {
          result.result = strategy.calculate(context);
        } catch (error) {
          result.error = error instanceof Error ? error.message : String(error);
        }
      }

      return result;
    });
  }
}

/**
 * Create singleton instance
 */
export const daysSupplyDispatcher = new DaysSupplyStrategyDispatcher();

/**
 * Convenience function for calculating days supply
 */
export function calculateDaysSupply(context: DaysSupplyContext): DaysSupplyResult {
  return daysSupplyDispatcher.calculateDaysSupply(context);
}

/**
 * Convenience function for getting strategy information
 */
export function getStrategyInfo(context: DaysSupplyContext): string {
  const info = daysSupplyDispatcher.getStrategyInfo(context);
  return `Selected: ${info.selectedStrategy}. Reason: ${info.selectionReason}`;
}

/**
 * Strategy selection examples for different contexts
 */
export const STRATEGY_SELECTION_EXAMPLES = {
  TITRATION_SCHEDULE: {
    description: 'Multi-phase GLP-1 agonist titration',
    context: {
      packageQuantity: 1000,
      packageUnit: 'units',
      doseAmount: 12.5,
      doseUnit: 'units',
      timing: [
        'Week 1-4: once weekly',
        'Week 5-8: once weekly', 
        'Week 9+: once weekly'
      ] as string[]
    },
    expectedStrategy: 'TitrationDaysSupplyStrategy',
    expectedSpecificity: SpecificityLevel.DOSE_FORM_AND_INGREDIENT
  },

  TABLET_MEDICATION: {
    description: 'Standard tablet with weight-based dosing',
    context: {
      packageQuantity: 30,
      packageUnit: 'tablet',
      doseAmount: 1000,
      doseUnit: 'mg',
      timing: 'twice daily',
      medication: {
        doseForm: 'Tablet',
        ingredient: [{
          strengthRatio: {
            numerator: { value: 500, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }] as Array<{
          strengthRatio?: {
            numerator: { value: number; unit: string };
            denominator: { value: number; unit: string };
          };
        }>
      }
    },
    expectedStrategy: 'TabletDaysSupplyStrategy',
    expectedSpecificity: SpecificityLevel.DOSE_FORM
  },

  LIQUID_MEDICATION: {
    description: 'Oral liquid with concentration',
    context: {
      packageQuantity: 120,
      packageUnit: 'mL',
      doseAmount: 250,
      doseUnit: 'mg',
      timing: 'three times daily',
      medication: {
        doseForm: 'Solution',
        ingredient: [{
          strengthRatio: {
            numerator: { value: 50, unit: 'mg' },
            denominator: { value: 1, unit: 'mL' }
          }
        }] as Array<{
          strengthRatio?: {
            numerator: { value: number; unit: string };
            denominator: { value: number; unit: string };
          };
        }>
      }
    },
    expectedStrategy: 'LiquidDaysSupplyStrategy',
    expectedSpecificity: SpecificityLevel.DOSE_FORM
  }
} as const;

