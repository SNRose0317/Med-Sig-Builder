import type { Medication } from '../types/index';
import { getFrequency, type Frequency } from '../constants/medication-data';
import { 
  calculateDaysSupply as calculateDaysSupplyStrategy,
  createDaysSupplyContext,
  isValidDaysSupplyContext
} from './strategies/days-supply/index';

export interface DoseInfo {
  value: number;
  unit: string;
  frequencyKey: string;
}

/**
 * Calculates days supply for a medication
 * Returns null if calculation not possible (e.g., PRN medications)
 * 
 * @deprecated Consider using the new strategy-based calculation system directly
 */
export function calculateDaysSupply(
  medication: Medication,
  dose: DoseInfo
): number | null {
  // Force fallback to legacy calculation for now
  return calculateDaysSupplyLegacy(medication, dose);
}

/**
 * Convert legacy medication/dose format to new strategy context
 */
function convertToStrategyContext(medication: Medication, dose: DoseInfo): import('./strategies/days-supply/index').DaysSupplyContext {
  if (!medication.packageInfo) {
    throw new Error('No package info available');
  }

  const frequency = getFrequency(dose.frequencyKey);
  if (!frequency) {
    throw new Error('Invalid frequency');
  }

  // Convert frequency to timing string
  const timing = convertFrequencyToTiming(frequency);
  
  // Use FHIR packaging model: quantity × packSize for total available medication
  const totalQuantity = medication.packageInfo.quantity * (medication.packageInfo.packSize || 1);
  
  return createDaysSupplyContext(
    totalQuantity,
    medication.packageInfo.unit,
    dose.value,
    dose.unit,
    timing,
    {
      doseForm: medication.doseForm || medication.type,
      ingredient: medication.ingredient,
      dispenserInfo: medication.dispenserInfo ? {
        conversionRatio: medication.dispenserInfo.conversionRatio,
        unit: medication.dispenserInfo.unit
      } : undefined
    }
  );
}

/**
 * Convert frequency object to timing string
 */
function convertFrequencyToTiming(frequency: Frequency): string {
  if (!frequency.count || !frequency.periodUnit) {
    return 'as needed';
  }

  const count = frequency.count;
  const period = frequency.period || 1;
  const periodUnit = frequency.periodUnit;

  // Handle common patterns
  if (periodUnit === 'd' && period === 1) {
    if (count === 1) return 'once daily';
    if (count === 2) return 'twice daily';
    if (count === 3) return 'three times daily';
    if (count === 4) return 'four times daily';
    return `${count} times daily`;
  }

  if (periodUnit === 'wk' && period === 1) {
    if (count === 1) return 'once weekly';
    return `${count} times weekly`;
  }

  if (periodUnit === 'mo' && period === 1) {
    if (count === 1) return 'once monthly';
    return `${count} times monthly`;
  }

  // Default fallback
  return `${count} times per ${period} ${periodUnit}`;
}

/**
 * Legacy calculation as fallback
 */
function calculateDaysSupplyLegacy(
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
  
  // Use FHIR packaging model: quantity × packSize for total available medication
  let totalAmount = medication.packageInfo.quantity * (medication.packageInfo.packSize || 1);
  

  // Handle special dispensers (e.g., Topiclick: 4 clicks = 1 mL)
  if (medication.dispenserInfo && dose.unit === medication.dispenserInfo.unit) {
    // Convert clicks to mL for calculation
    if (medication.dispenserInfo.type === 'Topiclick' || medication.dispenserInfo.type === 'topiclick') {
      amountPerDay = amountPerDay / medication.dispenserInfo.conversionRatio;
      
      // Use total volume if available for package calculation
      if (medication.totalVolume) {
        totalAmount = medication.totalVolume.value * (medication.packageInfo.packSize || 1);
      }
    }
  }
  // Handle strength-based dosing (e.g., 100mg dose when package is in tablets or units for insulin)
  else if ((isWeightUnit(dose.unit) || dose.unit === 'units') && medication.ingredient?.[0]?.strengthRatio) {
    const ratio = medication.ingredient[0].strengthRatio;
    const strengthPerUnit = ratio.numerator.value / ratio.denominator.value;
    
    // Convert dose to package units (e.g., convert mg to mL or units to mL)
    const unitsPerDose = dose.value / strengthPerUnit;
    amountPerDay = unitsPerDose * dosesPerDay;
    
    // Note: totalAmount is already in package units, no conversion needed
  }
  // Handle unit mismatches
  else if (!areUnitsCompatible(dose.unit, medication.packageInfo.unit)) {
    return null;
  }

  // Note: Package size is already accounted for in totalAmount calculation above

  // Calculate days supply, round to 1 decimal place
  const daysSupply = totalAmount / amountPerDay;
  return Math.round(daysSupply * 10) / 10;
}

/**
 * Calculates doses per day from frequency
 */
function calculateDosesPerDay(frequency: Frequency): number {
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

/**
 * New strategy-based days supply calculation exports
 * Use these for new implementations that support titration and advanced features
 */
export {
  calculateDaysSupply as calculateDaysSupplyStrategy,
  createDaysSupplyContext,
  quickDaysSupplyCalculation,
  isValidDaysSupplyContext,
  DaysSupplyStrategyDispatcher,
  getStrategyInfo
} from './strategies/days-supply/index';