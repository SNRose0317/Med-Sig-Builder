import type { Medication } from '../types/index';
import { getFrequency } from '../constants/medication-data';

export interface DoseInfo {
  value: number;
  unit: string;
  frequencyKey: string;
}

/**
 * Calculates days supply for a medication
 * Returns null if calculation not possible (e.g., PRN medications)
 */
export function calculateDaysSupply(
  medication: Medication,
  dose: DoseInfo
): number | null {
  // No package info = can't calculate
  if (!medication.packageInfo) {
    return null;
  }

  const frequency = getFrequency(dose.frequencyKey);
  if (!frequency) {
    return null;
  }

  // Calculate doses per day
  const dosesPerDay = calculateDosesPerDay(frequency);
  if (dosesPerDay === 0) {
    return null; // PRN or as-needed medications
  }

  // Calculate amount used per day
  let amountPerDay = dose.value * dosesPerDay;
  let totalAmount = medication.packageInfo.quantity;

  // Handle special dispensers (e.g., Topiclick: 4 clicks = 1 mL)
  if (medication.dispenserInfo && dose.unit === medication.dispenserInfo.unit) {
    // Convert clicks to mL for calculation
    if (medication.dispenserInfo.type === 'Topiclick') {
      amountPerDay = amountPerDay / medication.dispenserInfo.conversionRatio;
      
      // Use total volume if available
      if (medication.totalVolume?.unit === 'mL') {
        totalAmount = medication.totalVolume.value;
      }
    }
  }
  // Handle strength-based dosing (e.g., 100mg dose when package is in tablets)
  else if (isWeightUnit(dose.unit) && medication.ingredient?.[0]?.strengthRatio) {
    const ratio = medication.ingredient[0].strengthRatio;
    const strengthPerUnit = ratio.numerator.value / ratio.denominator.value;
    
    // Convert weight dose to unit count
    const unitsPerDose = dose.value / strengthPerUnit;
    amountPerDay = unitsPerDose * dosesPerDay;
  }
  // Handle unit mismatches
  else if (!areUnitsCompatible(dose.unit, medication.packageInfo.unit)) {
    return null;
  }

  // Account for pack sizes
  if (medication.packageInfo.packSize && medication.packageInfo.packSize > 1) {
    totalAmount = medication.packageInfo.quantity * medication.packageInfo.packSize;
  }

  // Calculate and round down to whole days
  return Math.floor(totalAmount / amountPerDay);
}

/**
 * Calculates doses per day from frequency
 */
function calculateDosesPerDay(frequency: any): number {
  if (!frequency.count || !frequency.periodUnit) {
    return 0;
  }

  const periodsPerDay: Record<string, number> = {
    'd': 1,                    // day
    'wk': 1/7,                 // week
    'mo': 1/30,                // month (approximate)
    'h': 24,                   // hour
  };

  const perDay = periodsPerDay[frequency.periodUnit] || 0;
  const period = frequency.period || 1;

  return (frequency.count / period) * perDay;
}

/**
 * Checks if unit is a weight measurement
 */
function isWeightUnit(unit: string): boolean {
  return ['mg', 'mcg', 'g', 'kg'].includes(unit.toLowerCase());
}

/**
 * Checks if dose unit is compatible with package unit
 */
function areUnitsCompatible(doseUnit: string, packageUnit: string): boolean {
  // Normalize plural forms
  const normalize = (unit: string) => {
    return unit.toLowerCase()
      .replace(/s$/, '')      // Remove trailing 's'
      .replace('tablet', 'tablet')
      .replace('capsule', 'capsule');
  };

  return normalize(doseUnit) === normalize(packageUnit);
}

/**
 * Validates that a dose is within medication constraints
 */
export function isDoseValid(
  medication: Medication,
  dose: { value: number; unit: string }
): boolean {
  const constraints = medication.dosageConstraints;
  if (!constraints) return true;

  // Check minimum
  if (constraints.minDose && 
      dose.unit === constraints.minDose.unit && 
      dose.value < constraints.minDose.value) {
    return false;
  }

  // Check maximum
  if (constraints.maxDose && 
      dose.unit === constraints.maxDose.unit && 
      dose.value > constraints.maxDose.value) {
    return false;
  }

  // Check step increments
  if (constraints.step && constraints.step > 0) {
    const remainder = dose.value % constraints.step;
    if (remainder > 0.001) { // Floating point tolerance
      return false;
    }
  }

  return true;
}

/**
 * Gets dose constraints message for invalid doses
 */
export function getDoseConstraintMessage(
  medication: Medication,
  dose: { value: number; unit: string }
): string | null {
  const constraints = medication.dosageConstraints;
  if (!constraints) return null;

  if (constraints.minDose && 
      dose.unit === constraints.minDose.unit && 
      dose.value < constraints.minDose.value) {
    return `Minimum dose is ${constraints.minDose.value} ${constraints.minDose.unit}`;
  }

  if (constraints.maxDose && 
      dose.unit === constraints.maxDose.unit && 
      dose.value > constraints.maxDose.value) {
    return `Maximum dose is ${constraints.maxDose.value} ${constraints.maxDose.unit}`;
  }

  if (constraints.step && constraints.step > 0) {
    const remainder = dose.value % constraints.step;
    if (remainder > 0.001) {
      return `Dose must be in increments of ${constraints.step} ${dose.unit}`;
    }
  }

  return null;
}