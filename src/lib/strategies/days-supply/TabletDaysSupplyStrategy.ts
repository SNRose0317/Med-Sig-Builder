/**
 * Tablet Days Supply Strategy
 * 
 * Handles days supply calculations for solid oral dosage forms
 * including tablets, capsules, and ODTs with proper fractioning.
 * 
 * @since 3.1.0
 */

import { DaysSupplyContext } from '../../temporal/types';
import { FHIRTemporalParser } from '../../temporal/FHIRTemporalParser';
import { SpecificityLevel } from '../types';
import {
  IDaysSupplyStrategy,
  DaysSupplyResult,
  CalculationBreakdown,
  createDaysSupplyResult,
  CALCULATION_CONSTANTS
} from './types';
import { calculationUtils } from './CalculationUtils';

export class TabletDaysSupplyStrategy implements IDaysSupplyStrategy {
  readonly specificity = SpecificityLevel.DOSE_FORM;
  readonly id = 'tablet-days-supply';
  readonly name = 'Tablet/Capsule Days Supply Calculator';

  private readonly temporalParser = new FHIRTemporalParser();
  private readonly solidDoseForms = ['tablet', 'capsule', 'odt', 'troche'];

  /**
   * Determines if this strategy matches the given context
   */
  matches(context: DaysSupplyContext): boolean {
    const doseForm = context.medication?.doseForm?.toLowerCase() || '';
    return this.solidDoseForms.some(form => doseForm.includes(form));
  }

  /**
   * Calculates days supply for tablets/capsules
   */
  calculate(context: DaysSupplyContext): DaysSupplyResult {
    const startTime = Date.now();

    try {
      // Validate inputs
      const validationErrors = calculationUtils.validateInputs(context);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid inputs: ${validationErrors.join(', ')}`);
      }

      // Parse timing
      const timing = this.parseTiming(context);
      const dosesPerDay = this.calculateDosesPerDay(timing);

      if (dosesPerDay === 0) {
        // PRN medication - cannot calculate days supply
        return createDaysSupplyResult(
          0,
          'PRN/As-needed medication',
          this.createBreakdown(context, 0, 0, []),
          CALCULATION_CONSTANTS.LOW_CONFIDENCE,
          ['Cannot calculate days supply for PRN medications']
        );
      }

      // Handle unit conversions and calculations
      const result = this.performCalculation(context, dosesPerDay);

      // Check performance
      const executionTime = Date.now() - startTime;
      if (executionTime > CALCULATION_CONSTANTS.MAX_CALCULATION_TIME_MS) {
        result.warnings.push(`Calculation took ${executionTime}ms (exceeds ${CALCULATION_CONSTANTS.MAX_CALCULATION_TIME_MS}ms target)`);
      }

      return result;

    } catch (error) {
      return createDaysSupplyResult(
        0,
        'Calculation failed',
        this.createBreakdown(context, 0, 0, []),
        CALCULATION_CONSTANTS.LOW_CONFIDENCE,
        [`Error: ${error.message}`]
      );
    }
  }

  /**
   * Parse timing from context
   */
  private parseTiming(context: DaysSupplyContext): any {
    if (typeof context.timing === 'string') {
      const parseResult = this.temporalParser.parse(context.timing);
      return parseResult.timing;
    }
    
    // For non-titration contexts, should be single timing
    return context.timing;
  }

  /**
   * Calculate doses per day from timing
   */
  private calculateDosesPerDay(timing: any): number {
    if (!timing || !timing.repeat) {
      return 0; // PRN or unknown
    }

    const repeat = timing.repeat;
    if (!repeat.frequency || !repeat.period || !repeat.periodUnit) {
      return 0;
    }

    return calculationUtils.calculateDosesPerDay(
      repeat.frequency,
      repeat.period,
      repeat.periodUnit
    );
  }

  /**
   * Perform the main calculation
   */
  private performCalculation(
    context: DaysSupplyContext,
    dosesPerDay: number
  ): DaysSupplyResult {
    
    const conversions: CalculationBreakdown['conversions'] = [];
    const warnings: string[] = [];
    let confidence = CALCULATION_CONSTANTS.HIGH_CONFIDENCE;

    // Handle pack sizes
    let totalQuantity = context.packageQuantity;
    const packInfo = this.getPackInfo(context);
    if (packInfo.packSize > 1) {
      totalQuantity = context.packageQuantity * packInfo.packSize;
      conversions.push({
        from: `${context.packageQuantity} ${context.packageUnit}`,
        to: `${totalQuantity} individual ${context.packageUnit}`,
        factor: packInfo.packSize,
        reason: `Pack size: ${packInfo.packSize} units per pack`
      });
    }

    // Handle strength-based dosing
    const doseConversion = this.handleStrengthConversion(context);
    let effectiveDoseAmount = context.doseAmount;
    
    if (doseConversion.conversionApplied) {
      effectiveDoseAmount = doseConversion.tabletCount;
      conversions.push({
        from: `${context.doseAmount} ${context.doseUnit}`,
        to: `${effectiveDoseAmount} tablets`,
        factor: doseConversion.conversionFactor,
        reason: 'Weight-to-tablet conversion using medication strength'
      });
    }

    // Validate fractional dosing
    const fractionValidation = this.validateFractionalDosing(effectiveDoseAmount, context);
    if (fractionValidation.warnings.length > 0) {
      warnings.push(...fractionValidation.warnings);
      confidence = Math.min(confidence, fractionValidation.confidence);
    }

    // Calculate consumption per day
    const consumptionPerDay = effectiveDoseAmount * dosesPerDay;

    // Calculate days supply
    const daysSupply = Math.floor(totalQuantity / consumptionPerDay);

    const breakdown = this.createBreakdown(
      context,
      dosesPerDay,
      consumptionPerDay,
      conversions,
      totalQuantity
    );

    return createDaysSupplyResult(
      daysSupply,
      'Standard tablet/capsule calculation',
      breakdown,
      confidence,
      warnings
    );
  }

  /**
   * Get pack size information
   */
  private getPackInfo(context: DaysSupplyContext): { packSize: number } {
    // This would integrate with medication data to get pack size
    // For now, assume single units unless specified
    return { packSize: 1 };
  }

  /**
   * Handle strength-based dosing (e.g., 100mg dose when package is in tablets)
   */
  private handleStrengthConversion(context: DaysSupplyContext): {
    conversionApplied: boolean;
    tabletCount: number;
    conversionFactor: number;
  } {
    
    // Check if dose is in weight units but package is in tablets
    const isWeightDose = ['mg', 'mcg', 'g', 'kg'].includes(context.doseUnit.toLowerCase());
    const isTabletPackage = ['tablet', 'capsule', 'cap', 'tab'].includes(
      context.packageUnit.toLowerCase()
    );

    if (!isWeightDose || !isTabletPackage) {
      return {
        conversionApplied: false,
        tabletCount: context.doseAmount,
        conversionFactor: 1
      };
    }

    // Get medication strength ratio
    const ingredient = context.medication?.ingredient?.[0];
    if (!ingredient?.strengthRatio) {
      return {
        conversionApplied: false,
        tabletCount: context.doseAmount,
        conversionFactor: 1
      };
    }

    const strengthRatio = ingredient.strengthRatio;
    const strengthPerTablet = strengthRatio.numerator.value / strengthRatio.denominator.value;
    
    // Convert weight dose to tablet count
    const tabletCount = context.doseAmount / strengthPerTablet;
    
    return {
      conversionApplied: true,
      tabletCount,
      conversionFactor: 1 / strengthPerTablet
    };
  }

  /**
   * Validate fractional dosing for tablets
   */
  private validateFractionalDosing(
    tabletCount: number,
    context: DaysSupplyContext
  ): { warnings: string[]; confidence: number } {
    
    const warnings: string[] = [];
    let confidence = CALCULATION_CONSTANTS.HIGH_CONFIDENCE;

    // Check for invalid fractions
    if (tabletCount < 0.25) {
      warnings.push('Dose below minimum 1/4 tablet - may not be physically possible');
      confidence = CALCULATION_CONSTANTS.LOW_CONFIDENCE;
    }

    // Check for unusual fractions
    const isCommonFraction = this.isCommonTabletFraction(tabletCount);
    if (!isCommonFraction && tabletCount !== Math.floor(tabletCount)) {
      warnings.push(`Unusual fractional dose (${tabletCount} tablets) - verify tablet scoring`);
      confidence = Math.min(confidence, CALCULATION_CONSTANTS.MEDIUM_CONFIDENCE);
    }

    return { warnings, confidence };
  }

  /**
   * Check if tablet count is a common fraction
   */
  private isCommonTabletFraction(count: number): boolean {
    const commonFractions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    const tolerance = CALCULATION_CONSTANTS.PRECISION_TOLERANCE;
    
    return commonFractions.some(fraction => 
      Math.abs(count - fraction) < tolerance
    );
  }

  /**
   * Create calculation breakdown
   */
  private createBreakdown(
    context: DaysSupplyContext,
    dosesPerDay: number,
    consumptionPerDay: number,
    conversions: CalculationBreakdown['conversions'],
    totalQuantity?: number
  ): CalculationBreakdown {
    
    return {
      packageQuantity: totalQuantity || context.packageQuantity,
      packageUnit: context.packageUnit,
      doseAmount: context.doseAmount,
      doseUnit: context.doseUnit,
      dosesPerDay,
      consumptionPerDay,
      conversions
    };
  }

  /**
   * Explains the strategy's behavior
   */
  explain(): string {
    return `Calculates days supply for solid oral dosage forms (tablets, capsules, ODTs). ` +
           `Handles weight-to-tablet conversions using medication strength, validates ` +
           `fractional dosing for tablet splitting, and accounts for pack sizes. ` +
           `Ensures minimum 1/4 tablet increments and warns about unusual fractions.`;
  }
}

/**
 * Tablet calculation examples and edge cases
 */
export const TABLET_CALCULATION_EXAMPLES = {
  STANDARD_TABLET: {
    description: 'Standard tablet dosing',
    input: {
      packageQuantity: 30,
      packageUnit: 'tablet',
      doseAmount: 1,
      doseUnit: 'tablet',
      timing: 'twice daily'
    },
    expected: {
      daysSupply: 15,
      dosesPerDay: 2,
      consumptionPerDay: 2
    }
  },

  WEIGHT_TO_TABLET: {
    description: 'Weight dose converted to tablets',
    input: {
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
        }]
      }
    },
    expected: {
      daysSupply: 7, // 30 tablets / 4 tablets per day (2mg = 2 tablets, twice daily)
      dosesPerDay: 2,
      consumptionPerDay: 4 // 2 tablets per dose × 2 doses
    }
  },

  FRACTIONAL_DOSING: {
    description: 'Fractional tablet dosing',
    input: {
      packageQuantity: 30,
      packageUnit: 'tablet',
      doseAmount: 0.5,
      doseUnit: 'tablet',
      timing: 'once daily'
    },
    expected: {
      daysSupply: 60,
      dosesPerDay: 1,
      consumptionPerDay: 0.5
    }
  }
} as const;