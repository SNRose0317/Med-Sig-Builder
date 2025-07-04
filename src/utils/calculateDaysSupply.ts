import { Medication } from '../types';
import { getFrequency } from '../tables/frequencyTable';

interface DoseInfo {
  value: number;
  unit: string;
  frequencyKey: string;
}

/**
 * Calculates the days supply for a medication based on package information and dosing
 * 
 * @param medication - The medication object
 * @param dose - The dose information (value, unit, and frequency key)
 * @returns The calculated days supply as a number (rounded down to nearest whole number)
 */
export function calculateDaysSupply(
  medication: Medication,
  dose: DoseInfo
): number | null {
  // Return null if no package info is available
  if (!medication.packageInfo) {
    console.error('Package info missing for medication:', medication.name);
    return null;
  }

  const { packageInfo } = medication;
  const { value: doseValue, unit: doseUnit, frequencyKey } = dose;
  
  // Log the received parameters to help debug
  console.log('calculateDaysSupply parameters:', {
    medicationName: medication.name,
    doseValue,
    doseUnit,
    frequencyKey,
    packageInfo
  });
  
  // Get frequency information - handle case sensitivity by using Object.keys
  const frequency = getFrequency(frequencyKey);
  
  if (!frequency) {
    console.error(`Frequency not found for key: "${frequencyKey}"`);
    return null;
  }

  // Calculate doses per day
  let dosesPerDay = 0;
  
  if (frequency.periodUnit === 'd') {
    // Daily frequency
    dosesPerDay = frequency.count / (frequency.period || 1);
  } else if (frequency.periodUnit === 'wk') {
    // Weekly frequency
    dosesPerDay = frequency.count / ((frequency.period || 1) * 7);
  } else if (frequency.periodUnit === 'mo') {
    // Monthly frequency (approximating month as 30 days)
    dosesPerDay = frequency.count / ((frequency.period || 1) * 30);
  }

  if (dosesPerDay === 0) {
    return null;
  }

  // Calculate the amount consumed per day based on dosing unit
  let amountPerDay = doseValue * dosesPerDay;
  let totalAmount = packageInfo.quantity;
  
  // Additional logging for debugging
  console.log('Initial calculation values:', {
    amountPerDay,
    totalAmount,
    doseUnit,
    packageUnit: packageInfo.unit
  });
  
  // Handle unit conversion if needed
  if (medication.dispenserInfo && doseUnit === medication.dispenserInfo.unit) {
    console.log('Found dispenser info:', medication.dispenserInfo);
    
    // If using dispenser units (e.g., clicks, pumps), convert to standard units (mL)
    const conversionRatio = medication.dispenserInfo.conversionRatio;
    
    // Check for Topiclick specifically which is 1 click = 0.25 mL (4 clicks per mL)
    if (medication.dispenserInfo.type === 'Topiclick') {
      // Clicks to mL: clicks / conversionRatio = mL
      const mlAmountPerDay = amountPerDay / conversionRatio;
      
      console.log('Topiclick conversion:', {
        clicks: amountPerDay,
        conversionRatio, 
        mlPerDay: mlAmountPerDay
      });
      
      amountPerDay = mlAmountPerDay;
      
      // Make sure we're using total volume in mL
      if (medication.totalVolume && medication.totalVolume.unit === 'mL') {
        totalAmount = medication.totalVolume.value;
        console.log(`Using totalVolume: ${totalAmount} mL instead of quantity`);
      }
    } else {
      // Generic conversion for other dispensers
      const mlAmountPerDay = amountPerDay / conversionRatio;
      amountPerDay = mlAmountPerDay;
    }
    
    // For creams with strength ratio, ensure we're calculating based on the correct volume
    if (medication.doseForm === 'Cream' && medication.ingredient?.[0]?.strengthRatio) {
      console.log('Processing cream with strength ratio');
    }
    
    // Make sure package quantity is in the same unit as amountPerDay
    if (packageInfo.unit !== 'mL') {
      console.log(`Package unit (${packageInfo.unit}) differs from calculated unit (mL)`);
    }
  } else if (doseUnit !== packageInfo.unit) {
    // For different units, we need special handling
    // For tablet/capsule medications
    if ((doseUnit === 'tablet' || doseUnit === 'capsule') && 
        (packageInfo.unit === 'tablets' || packageInfo.unit === 'capsules')) {
      // These are compatible units, no conversion needed
    } else if (doseUnit === 'mg' || doseUnit === 'mcg' || doseUnit === 'g') {
      // If dosing in weight units, we need to calculate based on strength ratio
      const ingredient = medication.ingredient[0];
      if (ingredient && ingredient.strengthRatio) {
        const { numerator, denominator } = ingredient.strengthRatio;
        
        // Convert the dose to the denominator unit
        // Example: Convert 100mg to tablets, where each tablet is 20mg
        // 100mg ÷ 20mg/tablet = 5 tablets
        const conversionFactor = numerator.value / denominator.value;
        const doseInBaseUnits = doseValue / conversionFactor;
        amountPerDay = doseInBaseUnits * dosesPerDay;
      } else {
        return null; // Cannot calculate if no strength ratio
      }
    } else {
      // Units are incompatible and can't be converted
      return null;
    }
  }

  // If there's a pack size, adjust total amount accordingly
  if (packageInfo.packSize && packageInfo.packSize > 1) {
    totalAmount = packageInfo.quantity * packageInfo.packSize;
  }

  // Calculate days supply
  const daysSupply = totalAmount / amountPerDay;
  
  // Return days supply rounded down to nearest whole number
  return Math.floor(daysSupply);
}

/**
 * Helper function to get standardized unit from potentially plural forms
 * @param unit The unit string to standardize
 * @returns Standardized unit string
 */
function standardizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'tablets': 'tablet',
    'capsules': 'capsule',
    'milliliters': 'mL',
    'grams': 'g',
    'milligrams': 'mg',
    'micrograms': 'mcg',
    'clicks': 'click',
    'pumps': 'pump',
    'sprays': 'spray',
    'applications': 'application'
  };

  return unitMap[unit.toLowerCase()] || unit;
}

export default calculateDaysSupply;
