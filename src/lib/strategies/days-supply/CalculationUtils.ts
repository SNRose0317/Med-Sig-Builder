/**
 * Days Supply Calculation Utilities
 * 
 * Common utilities for days supply calculations including
 * unit conversions, duration handling, and validation.
 * 
 * @since 3.1.0
 */

import { DaysSupplyContext } from '../../temporal/types';
import {
  ICalculationUtils,
  MedicationConversionContext,
  CALCULATION_CONSTANTS,
  UnitConversionError
} from './types';

export class CalculationUtils implements ICalculationUtils {
  
  /**
   * Convert duration to days
   */
  convertDurationToDays(value: number, unit: string): number {
    const conversions: Record<string, number> = {
      'd': 1,
      'day': 1,
      'days': 1,
      'wk': CALCULATION_CONSTANTS.DAYS_PER_WEEK,
      'week': CALCULATION_CONSTANTS.DAYS_PER_WEEK,
      'weeks': CALCULATION_CONSTANTS.DAYS_PER_WEEK,
      'mo': 30, // Use precise month calculation when date range is available
      'month': 30,
      'months': 30,
      'h': 1 / CALCULATION_CONSTANTS.HOURS_PER_DAY,
      'hour': 1 / CALCULATION_CONSTANTS.HOURS_PER_DAY,
      'hours': 1 / CALCULATION_CONSTANTS.HOURS_PER_DAY
    };

    const factor = conversions[unit.toLowerCase()];
    if (factor === undefined) {
      throw new Error(`Unsupported duration unit: ${unit}`);
    }

    return value * factor;
  }

  /**
   * Calculate total doses for a time period
   */
  calculateTotalDoses(dosesPerPeriod: number, periodDays: number): number {
    if (dosesPerPeriod <= 0 || periodDays <= 0) {
      return 0;
    }
    return dosesPerPeriod * periodDays;
  }

  /**
   * Validate calculation inputs
   */
  validateInputs(context: DaysSupplyContext): string[] {
    const errors: string[] = [];

    // Package validation
    if (!context.packageQuantity || context.packageQuantity <= 0) {
      errors.push('Package quantity must be positive');
    }

    if (!context.packageUnit || context.packageUnit.trim() === '') {
      errors.push('Package unit is required');
    }

    // Dose validation
    if (!context.doseAmount || context.doseAmount <= 0) {
      errors.push('Dose amount must be positive');
    }

    if (!context.doseUnit || context.doseUnit.trim() === '') {
      errors.push('Dose unit is required');
    }

    // Timing validation
    if (!context.timing) {
      errors.push('Timing information is required');
    }

    return errors;
  }

  /**
   * Apply dispenser conversions (e.g., Topiclick)
   */
  applyDispenserConversion(
    quantity: number,
    unit: string,
    medication: MedicationConversionContext
  ): { quantity: number; unit: string; conversionApplied: boolean } {
    
    // Handle Topiclick dispenser
    if (medication.dispenserInfo?.unit === 'click' && unit === 'click') {
      const mlQuantity = quantity / CALCULATION_CONSTANTS.TOPICLICK_CLICKS_PER_ML;
      return {
        quantity: mlQuantity,
        unit: 'mL',
        conversionApplied: true
      };
    }

    // Handle other dispensers if needed
    if (medication.dispenserInfo?.conversionRatio && unit === medication.dispenserInfo.unit) {
      const convertedQuantity = quantity / medication.dispenserInfo.conversionRatio;
      return {
        quantity: convertedQuantity,
        unit: 'mL', // Assume mL for liquid dispensers
        conversionApplied: true
      };
    }

    return {
      quantity,
      unit,
      conversionApplied: false
    };
  }

  /**
   * Convert between medication units using strength ratios
   */
  convertMedicationUnits(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    medication: MedicationConversionContext
  ): { quantity: number; conversionApplied: boolean; factor: number } {
    
    // Same unit - no conversion needed
    if (fromUnit.toLowerCase() === toUnit.toLowerCase()) {
      return { quantity, conversionApplied: false, factor: 1 };
    }

    // Check if we have strength ratio information
    const ingredient = medication.ingredient?.[0];
    if (!ingredient?.strengthRatio) {
      return { quantity, conversionApplied: false, factor: 1 };
    }

    const strengthRatio = ingredient.strengthRatio;
    const strengthValue = strengthRatio.numerator.value / strengthRatio.denominator.value;

    // Convert from weight to volume/count
    if (fromUnit === strengthRatio.numerator.unit && toUnit === strengthRatio.denominator.unit) {
      const convertedQuantity = quantity / strengthValue;
      return { 
        quantity: convertedQuantity, 
        conversionApplied: true, 
        factor: 1 / strengthValue 
      };
    }

    // Convert from volume/count to weight
    if (fromUnit === strengthRatio.denominator.unit && toUnit === strengthRatio.numerator.unit) {
      const convertedQuantity = quantity * strengthValue;
      return { 
        quantity: convertedQuantity, 
        conversionApplied: true, 
        factor: strengthValue 
      };
    }

    return { quantity, conversionApplied: false, factor: 1 };
  }

  /**
   * Normalize tablet units for comparison
   */
  normalizeTabletUnits(unit: string): string {
    const normalized = unit.toLowerCase().trim();
    
    // Handle plural forms
    const singularMap: Record<string, string> = {
      'tablets': 'tablet',
      'capsules': 'capsule',
      'caps': 'capsule',
      'tabs': 'tablet'
    };

    return singularMap[normalized] || normalized;
  }

  /**
   * Check if two units are compatible for direct comparison
   */
  areUnitsCompatible(unit1: string, unit2: string): boolean {
    const normalized1 = this.normalizeTabletUnits(unit1);
    const normalized2 = this.normalizeTabletUnits(unit2);
    
    return normalized1 === normalized2;
  }

  /**
   * Calculate doses per day from FHIR timing
   */
  calculateDosesPerDay(frequency: number, period: number, periodUnit: string): number {
    const periodInDays = this.convertDurationToDays(period, periodUnit);
    return frequency / periodInDays;
  }

  /**
   * Round to specified decimal places
   */
  roundToDecimalPlaces(value: number, places: number): number {
    const factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
  }

  /**
   * Check if value is effectively zero (within tolerance)
   */
  isEffectivelyZero(value: number): boolean {
    return Math.abs(value) < CALCULATION_CONSTANTS.PRECISION_TOLERANCE;
  }

  /**
   * Validate that a value is positive and finite
   */
  isValidPositiveNumber(value: number): boolean {
    return typeof value === 'number' && 
           isFinite(value) && 
           value > 0;
  }

  /**
   * Create conversion record for breakdown
   */
  createConversionRecord(
    from: string,
    to: string,
    factor: number,
    reason: string
  ): { from: string; to: string; factor: number; reason: string } {
    return { from, to, factor, reason };
  }

  /**
   * Calculate consumption per day with unit handling
   */
  calculateConsumptionPerDay(
    doseAmount: number,
    doseUnit: string,
    packageUnit: string,
    dosesPerDay: number,
    medication: MedicationConversionContext
  ): { consumptionPerDay: number; conversions: Array<{ from: string; to: string; factor: number; reason: string }> } {
    
    const conversions: Array<{ from: string; to: string; factor: number; reason: string }> = [];
    let effectiveDoseAmount = doseAmount;

    // Apply dispenser conversion first
    if (medication.dispenserInfo && doseUnit === medication.dispenserInfo.unit) {
      const dispenserResult = this.applyDispenserConversion(doseAmount, doseUnit, medication);
      if (dispenserResult.conversionApplied) {
        effectiveDoseAmount = dispenserResult.quantity;
        conversions.push(this.createConversionRecord(
          `${doseAmount} ${doseUnit}`,
          `${effectiveDoseAmount} ${dispenserResult.unit}`,
          effectiveDoseAmount / doseAmount,
          'Dispenser conversion (e.g., Topiclick clicks to mL)'
        ));
        doseUnit = dispenserResult.unit;
      }
    }

    // Apply medication strength conversion if needed
    if (!this.areUnitsCompatible(doseUnit, packageUnit)) {
      const strengthResult = this.convertMedicationUnits(
        effectiveDoseAmount,
        doseUnit,
        packageUnit,
        medication
      );
      
      if (strengthResult.conversionApplied) {
        effectiveDoseAmount = strengthResult.quantity;
        conversions.push(this.createConversionRecord(
          `${doseAmount} ${doseUnit}`,
          `${effectiveDoseAmount} ${packageUnit}`,
          strengthResult.factor,
          'Strength ratio conversion'
        ));
      }
    }

    const consumptionPerDay = effectiveDoseAmount * dosesPerDay;

    return { consumptionPerDay, conversions };
  }

  /**
   * Format number for display (removes trailing zeros)
   */
  formatNumber(value: number, maxDecimals: number = 2): string {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    
    const rounded = this.roundToDecimalPlaces(value, maxDecimals);
    return rounded.toString();
  }

  /**
   * Calculate percentage difference between two values
   */
  calculatePercentageDifference(value1: number, value2: number): number {
    if (value1 === 0 && value2 === 0) return 0;
    if (value1 === 0) return 100;
    
    return Math.abs(value1 - value2) / value1 * 100;
  }
}

/**
 * Create singleton instance
 */
export const calculationUtils = new CalculationUtils();

/**
 * Convenience functions
 */
export function validateDaysSupplyInputs(context: DaysSupplyContext): string[] {
  return calculationUtils.validateInputs(context);
}

export function convertDurationToDays(value: number, unit: string): number {
  return calculationUtils.convertDurationToDays(value, unit);
}

export function calculateDosesPerDay(frequency: number, period: number, periodUnit: string): number {
  return calculationUtils.calculateDosesPerDay(frequency, period, periodUnit);
}