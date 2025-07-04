import type { Medication } from '../types/index';
import { doseForms, routes, frequencies, getFrequency, getVerb } from '../constants/medication-data';

export interface DoseInput {
  value: number;
  unit: string;
}

export interface SignatureResult {
  humanReadable: string;
  fhirRepresentation: any;
}

/**
 * Determines if a medication has multiple active ingredients
 * Multi-ingredient medications are dosed by volume (mL) instead of strength (mg)
 */
export function isMultiIngredient(medication: Medication): boolean {
  if (!medication.ingredient || medication.ingredient.length <= 1) {
    return false;
  }
  
  // Count ingredients with valid strength data
  const activeIngredients = medication.ingredient.filter(ing => {
    // Has strength ratio (for liquids/creams)
    if (ing.strengthRatio?.numerator?.value && ing.strengthRatio?.numerator?.unit) {
      return true;
    }
    // Could also check for strengthQuantity for solid forms if needed
    return false;
  });
  
  return activeIngredients.length > 1;
}

/**
 * Determines the strength mode based on dose form
 * Ratio mode: Liquids/Creams (mg/mL, mg/g)
 * Quantity mode: Solids (mg per tablet)
 */
export function getStrengthMode(doseForm: string): 'ratio' | 'quantity' {
  const solidForms = ['Capsule', 'Tablet', 'Troche', 'ODT'];
  return solidForms.includes(doseForm) ? 'quantity' : 'ratio';
}

/**
 * Gets the appropriate denominator unit based on dose form
 * Liquids: mL
 * Creams: g
 * Solids: dose form name (tablet, capsule, etc.)
 */
export function getDenominatorUnit(doseForm: string): string {
  if (doseForm === 'Cream' || doseForm === 'Gel' || doseForm === 'Ointment') {
    return 'g';
  } else if (['Capsule', 'Tablet', 'Troche', 'ODT'].includes(doseForm)) {
    return doseForm.toLowerCase();
  } else {
    return 'mL';
  }
}

/**
 * Gets the appropriate dispensing unit based on medication type and multi-ingredient status
 * Multi-ingredient: Always use volume/weight (mL, g) for liquids/creams
 * Single-ingredient + Ratio mode: Can use either active ingredient or volume
 * Single-ingredient + Quantity mode: Use active ingredient unit
 */
export function getDispensingUnit(medication: Medication): string {
  const multiIngredient = isMultiIngredient(medication);
  const doseForm = medication.doseForm;
  const strengthMode = getStrengthMode(doseForm);
  
  // Multi-ingredient liquids/creams always use volume/weight dosing
  if (multiIngredient && strengthMode === 'ratio') {
    return getDenominatorUnit(doseForm);
  }
  
  // For single-ingredient ratio mode (liquids/creams), prefer active ingredient unit
  // but allow volume dosing as well
  if (!multiIngredient && strengthMode === 'ratio' && medication.ingredient?.[0]?.strengthRatio?.numerator?.unit) {
    return medication.ingredient[0].strengthRatio.numerator.unit;
  }
  
  // For quantity mode (solids), use the active ingredient unit
  if (strengthMode === 'quantity' && medication.ingredient?.[0]?.strengthRatio?.numerator?.unit) {
    return medication.ingredient[0].strengthRatio.numerator.unit;
  }
  
  // Fallback based on dose form
  const formData = doseForms[doseForm];
  return formData?.defaultUnit || 'unit';
}

/**
 * Formats tablet doses with proper fractions
 * CRITICAL: Never go below 1/4 tablet
 */
function formatTabletDose(value: number): string {
  if (value < 0.25) return '1/4 tablet';
  if (value === 0.25) return '1/4 tablet';
  if (value === 0.5) return '1/2 tablet';
  if (value === 0.75) return '3/4 tablet';
  if (value === 1) return '1 tablet';
  if (value === 1.5) return '1 and 1/2 tablets';
  if (value === 2) return '2 tablets';
  if (value === 2.5) return '2 and 1/2 tablets';
  
  // For other values, format as decimal
  const whole = Math.floor(value);
  const fraction = value - whole;
  
  if (fraction === 0) {
    return `${whole} tablets`;
  } else if (fraction === 0.25) {
    return `${whole} and 1/4 tablets`;
  } else if (fraction === 0.5) {
    return `${whole} and 1/2 tablets`;
  } else if (fraction === 0.75) {
    return `${whole} and 3/4 tablets`;
  }
  
  return `${value} tablets`;
}

/**
 * Formats dose with appropriate unit and conversion
 * Handles special cases like Topiclick, tablets, and dual dosing
 */
function formatDose(dose: DoseInput, medication: Medication): string {
  const doseForm = doseForms[medication.doseForm];
  
  // Handle Topiclick dispenser (4 clicks = 1 mL)
  if (medication.doseForm === 'Cream' && doseForm?.dispenserConversion) {
    const { dispenserUnit, dispenserPluralUnit, conversionRatio } = doseForm.dispenserConversion;
    
    if (dose.unit === dispenserUnit) {
      // User entered clicks
      const unitText = dose.value === 1 ? dispenserUnit : dispenserPluralUnit;
      
      // Calculate mg equivalent if we have strength ratio
      if (medication.ingredient?.[0]?.strengthRatio) {
        const mlValue = dose.value / conversionRatio;
        const strengthRatio = medication.ingredient[0].strengthRatio;
        const mgValue = mlValue * strengthRatio.numerator.value;
        return `${dose.value} ${unitText} (${mgValue.toFixed(0)} ${strengthRatio.numerator.unit})`;
      }
      
      return `${dose.value} ${unitText}`;
    }
  }
  
  // Handle tablets with special fractioning
  if (medication.doseForm === 'Tablet' && dose.unit === 'tablet') {
    return formatTabletDose(dose.value);
  }
  
  // Check if multi-ingredient medication and strength mode
  const multiIngredient = isMultiIngredient(medication);
  const strengthMode = getStrengthMode(medication.doseForm);
  const denominatorUnit = getDenominatorUnit(medication.doseForm);
  
  // For multi-ingredient medications in ratio mode, always use volume/weight dosing
  if (multiIngredient && strengthMode === 'ratio') {
    // Force volume/weight dosing for multi-ingredient formulations
    if (dose.unit === denominatorUnit) {
      return `${dose.value} ${denominatorUnit}`;
    }
    // If they entered active ingredient unit, convert to volume/weight using first ingredient's ratio
    if (medication.ingredient?.[0]?.strengthRatio && dose.unit === medication.ingredient[0].strengthRatio.numerator.unit) {
      const strengthRatio = medication.ingredient[0].strengthRatio;
      const strengthValue = strengthRatio.numerator.value / strengthRatio.denominator.value;
      const volumeValue = (dose.value / strengthValue).toFixed(2);
      return `${volumeValue} ${denominatorUnit}`;
    }
  }
  
  // Handle single-ingredient medications with dual dosing
  if (!multiIngredient && medication.ingredient?.[0]?.strengthRatio) {
    const strengthRatio = medication.ingredient[0].strengthRatio;
    const strengthValue = strengthRatio.numerator.value / strengthRatio.denominator.value;
    
    // For injectable solutions (show weight and volume)
    if ((medication.doseForm === 'Vial' || medication.doseForm === 'Solution') && 
        dose.unit === strengthRatio.numerator.unit) {
      const mlValue = (dose.value / strengthValue).toFixed(2);
      return `${dose.value} ${dose.unit}, as ${mlValue} mL`;
    }
    
    // For tablets/capsules with strength (show count and strength)
    if (['Tablet', 'Capsule', 'ODT'].includes(medication.doseForm)) {
      if (dose.unit === medication.doseForm.toLowerCase()) {
        const mgValue = dose.value * strengthValue;
        const unitText = dose.value === 1 ? doseForm.defaultUnit : doseForm.pluralUnit;
        return `${dose.value} ${unitText} (${mgValue} ${strengthRatio.numerator.unit})`;
      }
    }
  }
  
  // Default formatting
  if (doseForm?.isCountable) {
    const unitText = dose.value === 1 ? doseForm.defaultUnit : doseForm.pluralUnit;
    return `${dose.value} ${unitText}`;
  }
  
  return `${dose.value} ${dose.unit}`;
}

/**
 * Generates a medication signature
 * Core logic: verb + dose + route + frequency + instructions
 */
export function generateSignature(
  medication: Medication,
  dose: DoseInput,
  routeName: string,
  frequencyName: string,
  specialInstructions?: string
): SignatureResult {
  // Get reference data
  const routeInfo = routes[routeName];
  const frequencyInfo = getFrequency(frequencyName);
  
  if (!routeInfo || !frequencyInfo) {
    throw new Error('Invalid route or frequency');
  }
  
  // Get verb based on dose form and route
  const verb = getVerb(medication.doseForm, routeName);
  
  // Format the dose
  const doseText = formatDose(dose, medication);
  
  // Build the signature
  let parts = [
    verb,
    doseText,
    routeInfo.humanReadable,
    frequencyInfo.humanReadable
  ];
  
  // Add special instructions if provided
  if (specialInstructions) {
    parts.push(specialInstructions);
  }
  
  const humanReadable = parts.filter(Boolean).join(' ') + '.';
  
  // Create simplified FHIR representation
  const fhirRepresentation = {
    dosageInstruction: {
      route: routeName,
      doseAndRate: {
        doseQuantity: {
          value: dose.value,
          unit: dose.unit
        }
      },
      timing: {
        repeat: frequencyInfo.fhirMapping || {}
      },
      ...(specialInstructions && {
        additionalInstructions: {
          text: specialInstructions
        }
      })
    }
  };
  
  return {
    humanReadable,
    fhirRepresentation
  };
}

/**
 * Validates dose constraints
 */
export function validateDose(
  medication: Medication,
  dose: DoseInput
): { valid: boolean; message?: string } {
  const constraints = medication.dosageConstraints;
  
  if (!constraints) {
    return { valid: true };
  }
  
  // Check minimum dose
  if (constraints.minDose && dose.unit === constraints.minDose.unit) {
    if (dose.value < constraints.minDose.value) {
      return { 
        valid: false, 
        message: `Dose must be at least ${constraints.minDose.value} ${constraints.minDose.unit}` 
      };
    }
  }
  
  // Check maximum dose
  if (constraints.maxDose && dose.unit === constraints.maxDose.unit) {
    if (dose.value > constraints.maxDose.value) {
      return { 
        valid: false, 
        message: `Dose cannot exceed ${constraints.maxDose.value} ${constraints.maxDose.unit}` 
      };
    }
  }
  
  // Check step constraints
  if (constraints.step && constraints.step > 0) {
    const remainder = dose.value % constraints.step;
    if (remainder > 0.001) { // Allow for floating point imprecision
      return { 
        valid: false, 
        message: `Dose must be in increments of ${constraints.step} ${dose.unit}` 
      };
    }
  }
  
  return { valid: true };
}