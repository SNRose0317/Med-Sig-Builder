/**
 * Liquid Days Supply Strategy
 * 
 * Handles days supply calculations for liquid medications including
 * oral solutions, injectable vials, and topical liquids with
 * proper unit conversions and concentration handling.
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

export class LiquidDaysSupplyStrategy implements IDaysSupplyStrategy {
  readonly specificity = SpecificityLevel.DOSE_FORM;
  readonly id = 'liquid-days-supply';
  readonly name = 'Liquid Medication Days Supply Calculator';

  private readonly temporalParser = new FHIRTemporalParser();
  private readonly liquidDoseForms = ['solution', 'vial', 'suspension', 'syrup', 'elixir'];

  /**
   * Determines if this strategy matches the given context
   */
  matches(context: DaysSupplyContext): boolean {
    const doseForm = context.medication?.doseForm?.toLowerCase() || '';
    return this.liquidDoseForms.some(form => doseForm.includes(form));
  }

  /**
   * Calculates days supply for liquid medications
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
        // PRN medication
        return createDaysSupplyResult(
          0,
          'PRN/As-needed liquid medication',
          this.createBreakdown(context, 0, 0, []),
          CALCULATION_CONSTANTS.LOW_CONFIDENCE,
          ['Cannot calculate days supply for PRN medications']
        );
      }

      // Handle liquid-specific calculations
      const result = this.performLiquidCalculation(context, dosesPerDay);

      // Check performance
      const executionTime = Date.now() - startTime;
      if (executionTime > CALCULATION_CONSTANTS.MAX_CALCULATION_TIME_MS) {
        result.warnings.push(`Calculation took ${executionTime}ms (exceeds ${CALCULATION_CONSTANTS.MAX_CALCULATION_TIME_MS}ms target)`);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return createDaysSupplyResult(
        0,
        'Liquid calculation failed',
        this.createBreakdown(context, 0, 0, []),
        CALCULATION_CONSTANTS.LOW_CONFIDENCE,
        [`Error: ${errorMessage}`]
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
    
    return context.timing;
  }

  /**
   * Calculate doses per day from timing
   */
  private calculateDosesPerDay(timing: any): number {
    if (!timing || !timing.repeat) {
      return 0;
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
   * Perform liquid-specific calculation
   */
  private performLiquidCalculation(
    context: DaysSupplyContext,
    dosesPerDay: number
  ): DaysSupplyResult {
    
    const conversions: CalculationBreakdown['conversions'] = [];
    const warnings: string[] = [];
    let confidence = CALCULATION_CONSTANTS.HIGH_CONFIDENCE;

    // Handle concentration conversions
    const concentrationResult = this.handleConcentrationConversion(context);
    let effectiveDoseVolume = context.doseAmount;
    let effectiveDoseUnit = context.doseUnit;

    if (concentrationResult.conversionApplied) {
      effectiveDoseVolume = concentrationResult.volumeAmount;
      effectiveDoseUnit = concentrationResult.volumeUnit;
      conversions.push({
        from: `${context.doseAmount} ${context.doseUnit}`,
        to: `${effectiveDoseVolume} ${effectiveDoseUnit}`,
        factor: concentrationResult.conversionFactor,
        reason: 'Concentration conversion using medication strength'
      });
    }

    // Handle volume unit standardization
    const volumeStandardization = this.standardizeVolumeUnits(
      effectiveDoseVolume,
      effectiveDoseUnit,
      context.packageUnit
    );

    if (volumeStandardization.conversionApplied) {
      effectiveDoseVolume = volumeStandardization.standardizedAmount;
      effectiveDoseUnit = volumeStandardization.standardizedUnit;
      conversions.push({
        from: `${context.doseAmount} ${context.doseUnit}`,
        to: `${effectiveDoseVolume} ${effectiveDoseUnit}`,
        factor: volumeStandardization.conversionFactor,
        reason: 'Volume unit standardization'
      });
    }

    // Validate dose precision for liquids
    const precisionValidation = this.validateLiquidPrecision(effectiveDoseVolume, context);
    if (precisionValidation.warnings.length > 0) {
      warnings.push(...precisionValidation.warnings);
      confidence = Math.min(confidence, precisionValidation.confidence);
    }

    // Calculate consumption per day
    const consumptionPerDay = effectiveDoseVolume * dosesPerDay;

    // Calculate days supply
    const daysSupply = Math.floor(context.packageQuantity / consumptionPerDay);

    const breakdown = this.createBreakdown(
      context,
      dosesPerDay,
      consumptionPerDay,
      conversions
    );

    return createDaysSupplyResult(
      daysSupply,
      'Liquid medication calculation with concentration handling',
      breakdown,
      confidence,
      warnings
    );
  }

  /**
   * Handle concentration-based conversions (weight to volume)
   */
  private handleConcentrationConversion(context: DaysSupplyContext): {
    conversionApplied: boolean;
    volumeAmount: number;
    volumeUnit: string;
    conversionFactor: number;
  } {
    
    // Check if dose is in weight units but package is in volume
    const isWeightDose = ['mg', 'mcg', 'g', 'kg', 'unit', 'units'].includes(
      context.doseUnit.toLowerCase()
    );
    const isVolumePackage = ['ml', 'l', 'fl oz', 'oz'].includes(
      context.packageUnit.toLowerCase()
    );

    if (!isWeightDose || !isVolumePackage) {
      return {
        conversionApplied: false,
        volumeAmount: context.doseAmount,
        volumeUnit: context.doseUnit,
        conversionFactor: 1
      };
    }

    // Get medication concentration
    const ingredient = context.medication?.ingredient?.[0];
    if (!ingredient?.strengthRatio) {
      return {
        conversionApplied: false,
        volumeAmount: context.doseAmount,
        volumeUnit: context.doseUnit,
        conversionFactor: 1
      };
    }

    const strengthRatio = ingredient.strengthRatio;
    const concentration = strengthRatio.numerator.value / strengthRatio.denominator.value;
    
    // Convert weight dose to volume
    const volumeAmount = context.doseAmount / concentration;
    const volumeUnit = strengthRatio.denominator.unit;
    
    return {
      conversionApplied: true,
      volumeAmount,
      volumeUnit,
      conversionFactor: 1 / concentration
    };
  }

  /**
   * Standardize volume units for calculation
   */
  private standardizeVolumeUnits(
    amount: number,
    fromUnit: string,
    toUnit: string
  ): {
    conversionApplied: boolean;
    standardizedAmount: number;
    standardizedUnit: string;
    conversionFactor: number;
  } {
    
    const normalizedFrom = fromUnit.toLowerCase();
    const normalizedTo = toUnit.toLowerCase();

    // Volume conversion factors to mL
    const volumeConversions: Record<string, number> = {
      'ml': 1,
      'milliliter': 1,
      'milliliters': 1,
      'l': 1000,
      'liter': 1000,
      'liters': 1000,
      'fl oz': 29.5735,
      'fluid ounce': 29.5735,
      'fluid ounces': 29.5735,
      'oz': 29.5735,
      'ounce': 29.5735,
      'ounces': 29.5735
    };

    const fromFactor = volumeConversions[normalizedFrom];
    const toFactor = volumeConversions[normalizedTo];

    if (!fromFactor || !toFactor) {
      return {
        conversionApplied: false,
        standardizedAmount: amount,
        standardizedUnit: fromUnit,
        conversionFactor: 1
      };
    }

    const conversionFactor = fromFactor / toFactor;
    const standardizedAmount = amount * conversionFactor;

    return {
      conversionApplied: conversionFactor !== 1,
      standardizedAmount,
      standardizedUnit: toUnit,
      conversionFactor
    };
  }

  /**
   * Validate liquid dosing precision
   */
  private validateLiquidPrecision(
    volumeAmount: number,
    context: DaysSupplyContext
  ): { warnings: string[]; confidence: number } {
    
    const warnings: string[] = [];
    let confidence = CALCULATION_CONSTANTS.HIGH_CONFIDENCE;

    // Check for very small volumes
    if (volumeAmount < 0.1) {
      warnings.push(`Very small volume dose (${volumeAmount} mL) - may be difficult to measure accurately`);
      confidence = Math.min(confidence, CALCULATION_CONSTANTS.MEDIUM_CONFIDENCE);
    }

    // Check for unusual precision
    const decimalPlaces = this.getDecimalPlaces(volumeAmount);
    if (decimalPlaces > 2) {
      warnings.push(`High precision dose (${volumeAmount} mL) - verify measurement device capability`);
      confidence = Math.min(confidence, CALCULATION_CONSTANTS.MEDIUM_CONFIDENCE);
    }

    // Check for common measurement increments
    if (!this.isCommonLiquidMeasurement(volumeAmount)) {
      warnings.push(`Unusual volume measurement (${volumeAmount} mL) - verify dosing accuracy`);
      confidence = Math.min(confidence, CALCULATION_CONSTANTS.MEDIUM_CONFIDENCE);
    }

    return { warnings, confidence };
  }

  /**
   * Get number of decimal places
   */
  private getDecimalPlaces(num: number): number {
    const str = num.toString();
    if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
      return str.split('.')[1].length;
    } else if (str.indexOf('e-') !== -1) {
      const parts = str.split('e-');
      return parseInt(parts[1], 10);
    }
    return 0;
  }

  /**
   * Check if volume is a common measurement
   */
  private isCommonLiquidMeasurement(volume: number): boolean {
    // Common liquid measurements in mL
    const commonMeasurements = [
      0.1, 0.2, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15, 20, 25, 30
    ];
    
    const tolerance = CALCULATION_CONSTANTS.PRECISION_TOLERANCE;
    return commonMeasurements.some(measurement => 
      Math.abs(volume - measurement) < tolerance
    );
  }

  /**
   * Create calculation breakdown
   */
  private createBreakdown(
    context: DaysSupplyContext,
    dosesPerDay: number,
    consumptionPerDay: number,
    conversions: CalculationBreakdown['conversions']
  ): CalculationBreakdown {
    
    return {
      packageQuantity: context.packageQuantity,
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
    return `Calculates days supply for liquid medications including oral solutions, ` +
           `injectable vials, and topical liquids. Handles concentration-based conversions ` +
           `from weight doses (mg) to volume doses (mL), standardizes volume units, and ` +
           `validates dosing precision for accurate measurement. Supports dual dosing ` +
           `display for injectable medications.`;
  }
}

/**
 * Liquid calculation examples
 */
export const LIQUID_CALCULATION_EXAMPLES = {
  ORAL_SOLUTION: {
    description: 'Oral liquid with concentration conversion',
    input: {
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
        }]
      }
    },
    expected: {
      daysSupply: 8, // 120 mL / (5 mL × 3 doses per day)
      dosesPerDay: 3,
      consumptionPerDay: 15 // 5 mL per dose × 3 doses
    }
  },

  INJECTABLE_VIAL: {
    description: 'Injectable medication with dual dosing',
    input: {
      packageQuantity: 10,
      packageUnit: 'mL',
      doseAmount: 1,
      doseUnit: 'mL',
      timing: 'once weekly'
    },
    expected: {
      daysSupply: 70, // 10 mL / (1 mL per week) = 10 weeks
      dosesPerDay: 1/7,
      consumptionPerDay: 1/7
    }
  },

  PEDIATRIC_SUSPENSION: {
    description: 'Pediatric liquid with small volume',
    input: {
      packageQuantity: 60,
      packageUnit: 'mL',
      doseAmount: 2.5,
      doseUnit: 'mL',
      timing: 'twice daily'
    },
    expected: {
      daysSupply: 12, // 60 mL / (2.5 mL × 2 doses per day)
      dosesPerDay: 2,
      consumptionPerDay: 5
    }
  }
} as const;