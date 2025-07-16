/**
 * Days Supply Strategy Export Module
 * 
 * Centralized exports for the days supply calculation system
 * with titration support and FHIR compliance.
 * 
 * @since 3.1.0
 */

// Core types and interfaces
export type {
  DaysSupplyContext,
  TitrationPhase,
  FHIRTiming,
  Duration
} from '../../temporal/types';

export type {
  IDaysSupplyStrategy,
  IDaysSupplyStrategyDispatcher,
  DaysSupplyResult,
  CalculationBreakdown,
  TitrationBreakdown,
  DaysSupplyStrategyMetadata,
  MedicationConversionContext,
  ICalculationUtils,
  IUnitConverter
} from './types';

// Error types
export {
  DaysSupplyCalculationError,
  InvalidTitrationScheduleError,
  UnitConversionError
} from './types';

// Constants
export { CALCULATION_CONSTANTS } from './types';

// Helper functions
export { 
  createDaysSupplyResult,
  isDaysSupplyResult,
  isTitrationBreakdown
} from './types';

// Main dispatcher and calculation functions
export {
  DaysSupplyStrategyDispatcher,
  daysSupplyDispatcher,
  calculateDaysSupply,
  getStrategyInfo,
  STRATEGY_SELECTION_EXAMPLES
} from './DaysSupplyStrategyDispatcher';

// Individual strategies
export { TitrationDaysSupplyStrategy, TITRATION_EXAMPLES } from './TitrationDaysSupplyStrategy';
export { TabletDaysSupplyStrategy, TABLET_CALCULATION_EXAMPLES } from './TabletDaysSupplyStrategy';
export { LiquidDaysSupplyStrategy, LIQUID_CALCULATION_EXAMPLES } from './LiquidDaysSupplyStrategy';

// Utilities
export { 
  CalculationUtils,
  calculationUtils,
  validateDaysSupplyInputs,
  convertDurationToDays,
  calculateDosesPerDay
} from './CalculationUtils';

// Temporal parsing integration
export {
  FHIRTemporalParser,
  fhirTemporalParser,
  parseTiming,
  isTitrationSchedule,
  calculateDaysSupplyFromTiming
} from '../../temporal/FHIRTemporalParser';

export type {
  ITemporalParser,
  TemporalParseResult
} from '../../temporal/types';

export {
  createDuration,
  createFHIRTiming,
  isFHIRTiming,
  isTitrationPhase,
  isDuration,
  COMMON_TIMING_PATTERNS,
  TITRATION_PATTERNS
} from '../../temporal/types';

/**
 * Convenience function to create a complete days supply context
 */
export function createDaysSupplyContext(
  packageQuantity: number,
  packageUnit: string,
  doseAmount: number,
  doseUnit: string,
  timing: string | string[],
  medication?: {
    doseForm?: string;
    ingredient?: Array<{
      strengthRatio?: {
        numerator: { value: number; unit: string };
        denominator: { value: number; unit: string };
      };
    }>;
    dispenserInfo?: {
      conversionRatio: number;
      unit: string;
    };
  }
): DaysSupplyContext {
  return {
    packageQuantity,
    packageUnit,
    doseAmount,
    doseUnit,
    timing,
    medication
  };
}

/**
 * Quick calculation function for simple cases
 */
export function quickDaysSupplyCalculation(
  packageQuantity: number,
  packageUnit: string,
  doseAmount: number,
  doseUnit: string,
  timing: string
): number {
  const context = createDaysSupplyContext(
    packageQuantity,
    packageUnit,
    doseAmount,
    doseUnit,
    timing
  );

  try {
    const result = calculateDaysSupply(context);
    return result.daysSupply;
  } catch {
    return 0; // Return 0 if calculation fails
  }
}

/**
 * Validation function for days supply inputs
 */
export function isValidDaysSupplyContext(context: any): context is DaysSupplyContext {
  return context &&
         typeof context.packageQuantity === 'number' &&
         context.packageQuantity > 0 &&
         typeof context.packageUnit === 'string' &&
         context.packageUnit.trim() !== '' &&
         typeof context.doseAmount === 'number' &&
         context.doseAmount > 0 &&
         typeof context.doseUnit === 'string' &&
         context.doseUnit.trim() !== '' &&
         context.timing !== undefined &&
         context.timing !== null;
}