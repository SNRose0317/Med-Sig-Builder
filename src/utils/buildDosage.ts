import { Medication } from '../types';
import doseForms from '../tables/doseForms';
import routes from '../tables/routes';
import frequencies from '../tables/frequencyTable';
import { getVerb } from '../tables/verbs';

export interface DoseInput {
  value: number;
  unit: string;
}

export interface DualDosage {
  weightBased: {
    value: number;
    unit: string;
  };
  volumeBased: {
    value: number;
    unit: string;
  };
}

/**
 * Calculates both weight-based and volume-based dosages for medications with strength ratios
 */
export function calculateDualDosage(medication: Medication, userDosage: DoseInput): DualDosage | null {
  // Check if medication has the necessary data for conversion
  if (!medication.ingredient?.[0]?.strengthRatio) {
    return null;
  }

  const strengthRatio = medication.ingredient[0].strengthRatio;
  const strengthValue = strengthRatio.numerator.value / strengthRatio.denominator.value;
  
  const numeratorUnit = strengthRatio.numerator.unit;
  const denominatorUnit = strengthRatio.denominator.unit;
  
  let primaryDose, secondaryDose;
  
  // For Vials and Solutions, handle mg/mL conversion
  if (medication.doseForm === 'Vial' || medication.doseForm === 'Solution') {
    // Case 1: User entered weight-based dose (mg)
    if (userDosage.unit === numeratorUnit) {
      primaryDose = userDosage.value;
      secondaryDose = Number((userDosage.value / strengthValue).toFixed(2));
    } 
    // Case 2: User entered volume-based dose (mL)
    else if (userDosage.unit === denominatorUnit) {
      secondaryDose = userDosage.value;
      primaryDose = Number((userDosage.value * strengthValue).toFixed(0));
    }
    // Case 3: User entered another unit (not applicable for Vial/Solution)
    else {
      return null;
    }
    
    return {
      weightBased: { value: primaryDose, unit: numeratorUnit },
      volumeBased: { value: secondaryDose, unit: denominatorUnit }
    };
  } 
  // For tablets, capsules, nasal sprays, etc.
  else {
    // Case 1: User entered dose in the form unit (tablets, spray, application, etc.)
    if (userDosage.unit === denominatorUnit || 
        (userDosage.unit === 'tablet' && denominatorUnit === 'tablet') ||
        (userDosage.unit === 'capsule' && denominatorUnit === 'capsule') ||
        (userDosage.unit === 'spray' && denominatorUnit === 'spray') ||
        (userDosage.unit === 'application' && denominatorUnit === 'application')) {
      primaryDose = userDosage.value;
      secondaryDose = Number((userDosage.value * strengthValue).toFixed(2));
    }
    // Case 2: User entered dose in the strength unit (mg, mcg, %, etc.)
    else if (userDosage.unit === numeratorUnit) {
      secondaryDose = userDosage.value;
      primaryDose = Number((userDosage.value / strengthValue).toFixed(0));
      
      // Make sure we don't go below 1 for items that can't be fractional
      if (['tablet', 'capsule', 'spray', 'application', 'patch'].includes(denominatorUnit) && primaryDose < 1) {
        primaryDose = 1;
      }
    }
    // Case 3: User entered another unit
    else {
      return null;
    }
    
    return {
      weightBased: { value: secondaryDose, unit: numeratorUnit },
      volumeBased: { value: primaryDose, unit: denominatorUnit }
    };
  }
}

/**
 * Creates FHIR representation of the dosage instruction
 */
export function createFhirRepresentation(
  medication: Medication, 
  dosage: DoseInput,
  route: string,
  frequency: string,
  specialInstructions?: string
) {
  const hasStrengthRatio = 
    medication.ingredient && 
    medication.ingredient[0]?.strengthRatio;
    
  let doseQuantity = {
    value: dosage.value,
    unit: dosage.unit
  };
  
  // If medication has strength ratio, include both representations in FHIR format
  let additionalDosage: { value: number; unit: string } | undefined = undefined;
  if (hasStrengthRatio) {
    const dualDosage = calculateDualDosage(medication, dosage);
    
    if (dualDosage) {
      // Primary dosage is what user entered
      const strengthRatio = medication.ingredient[0].strengthRatio;
      const numeratorUnit = strengthRatio.numerator.unit;
      const denominatorUnit = strengthRatio.denominator.unit;
      
      // Determine which is the additional dosage based on what the user entered
      if (dosage.unit === numeratorUnit) {
        // User entered the weight/concentration unit (mg, mcg, %), so additional is form unit
        additionalDosage = dualDosage.volumeBased;
      } else if (dosage.unit === denominatorUnit || 
                dosage.unit === 'tablet' || 
                dosage.unit === 'capsule' || 
                dosage.unit === 'spray' || 
                dosage.unit === 'application') {
        // User entered the form unit, so additional is weight/concentration
        additionalDosage = dualDosage.weightBased;
      }
    }
  }
  
  // Build FHIR representation
  const fhirRepresentation: any = {
    dosageInstruction: {
      route: route,
      doseAndRate: {
        doseQuantity: doseQuantity
      },
      timing: {
        repeat: frequencies[frequency]?.fhirMapping || {}
      }
    }
  };
  
  // Add additional dosage if present
  if (additionalDosage && additionalDosage.value !== undefined) {
    fhirRepresentation.dosageInstruction.extension = [
      {
        url: "http://example.org/fhir/StructureDefinition/additional-dosage",
        valueDosage: {
          doseQuantity: {
            value: additionalDosage.value,
            unit: additionalDosage.unit
          }
        }
      }
    ];
  }
  
  // Add special instructions if provided
  if (specialInstructions) {
    fhirRepresentation.dosageInstruction.additionalInstructions = {
      text: specialInstructions
    };
  }
  
  return fhirRepresentation;
}

/**
 * Generates a complete medication signature based on the provided parameters
 */
export function generateSignature(
  medication: Medication, 
  dosage: DoseInput, 
  routeName: string, 
  frequencyName: string, 
  specialInstructions?: string
): { 
  humanReadable: string; 
  fhirRepresentation: any 
} {
  // Get reference data
  const doseForm = doseForms[medication.doseForm];
  const routeInfo = routes[routeName];
  
  if (!doseForm || !routeInfo) {
    throw new Error('Invalid dose form or route specified');
  }
  
  // Get appropriate verb based on medication form and route
  const verb = getVerb(medication.doseForm, routeName);
  
  // Check if medication has strength ratio for dual representation
  const hasStrengthRatio = 
    medication.ingredient && 
    medication.ingredient[0]?.strengthRatio;
  
  let doseText;
  
  if (hasStrengthRatio) {
    // Calculate dual dosage
    const dualDosage = calculateDualDosage(medication, dosage);
    
    if (dualDosage) {
      // For vials and solutions, show "mg, as mL"
      if (medication.doseForm === 'Vial' || medication.doseForm === 'Solution') {
        doseText = `${dualDosage.weightBased.value} ${dualDosage.weightBased.unit}, as ${dualDosage.volumeBased.value} ${dualDosage.volumeBased.unit}`;
      } 
      // For tablets, capsules, and other countable items
      else if (['Tablet', 'Capsule', 'Patch', 'ODT'].includes(medication.doseForm)) {
        if (dosage.unit === medication.doseForm.toLowerCase()) {
          // If user selected the countable unit, show "2 tablets (20 mg)"
          const unitText = dualDosage.volumeBased.value === 1 ? doseForm.defaultUnit : doseForm.pluralUnit;
          doseText = `${dualDosage.volumeBased.value} ${unitText} (${dualDosage.weightBased.value} ${dualDosage.weightBased.unit})`;
        } else {
          // If user selected the strength unit, show "20 mg (2 tablets)"
          const unitText = dualDosage.volumeBased.value === 1 ? doseForm.defaultUnit : doseForm.pluralUnit;
          doseText = `${dualDosage.weightBased.value} ${dualDosage.weightBased.unit} (${dualDosage.volumeBased.value} ${unitText})`;
        }
      }
      // For nasal sprays and other forms with specialized units
      else if (medication.doseForm === 'Nasal Spray') {
        if (dosage.unit === 'spray') {
          // If user selected sprays, show "2 sprays (100 mcg)"
          doseText = `${dualDosage.volumeBased.value} ${dosage.unit}${dualDosage.volumeBased.value !== 1 ? 's' : ''} (${dualDosage.weightBased.value} ${dualDosage.weightBased.unit})`;
        } else {
          // If user selected mcg, show "100 mcg (2 sprays)"
          doseText = `${dualDosage.weightBased.value} ${dualDosage.weightBased.unit} (${dualDosage.volumeBased.value} spray${dualDosage.volumeBased.value !== 1 ? 's' : ''})`;
        }
      }
      // For creams and other applications
      else if (['Cream', 'Gel', 'Foam', 'Shampoo'].includes(medication.doseForm)) {
        if (dosage.unit === 'application') {
          // If user selected application, show "1 application (0.05%)"
          doseText = `${dualDosage.volumeBased.value} ${dosage.unit}${dualDosage.volumeBased.value !== 1 ? 's' : ''} (${dualDosage.weightBased.value}${dualDosage.weightBased.unit})`;
        } else {
          // If user selected the strength unit, show "0.05% (1 application)"
          doseText = `${dualDosage.weightBased.value}${dualDosage.weightBased.unit} (${dualDosage.volumeBased.value} application${dualDosage.volumeBased.value !== 1 ? 's' : ''})`;
        }
      }
      // Default for other types
      else {
        doseText = `${dosage.value} ${dosage.unit}`;
      }
    } else {
      // Fallback to standard formatting if dual dosage calculation fails
      doseText = `${dosage.value} ${dosage.unit}`;
    }
  } else {
    // Standard dosage formatting for medications without strength ratios
    if (doseForm.isCountable && dosage.value === 1) {
      doseText = `${dosage.value} ${doseForm.defaultUnit}`;
    } else if (doseForm.isCountable) {
      doseText = `${dosage.value} ${doseForm.pluralUnit}`;
    } else {
      doseText = `${dosage.value} ${dosage.unit}`;
    }
  }
  
  // Get human-readable frequency
  const frequencyInfo = frequencies[frequencyName];
  if (!frequencyInfo) {
    throw new Error('Invalid frequency specified');
  }
  
  const frequencyText = frequencyInfo.humanReadable;
  
  // Build the signature based on route type
  let sig;
  
  if (routeInfo.requiresSpecialInstructions && specialInstructions) {
    // Use template with special instructions
    sig = routeInfo.specialInstructionsTemplate || '';
    sig = sig.replace('{dose}', doseText)
             .replace('{unit}', '')
             .replace('{route}', routeInfo.humanReadable)
             .replace('{frequency}', frequencyText)
             .replace('{site}', specialInstructions);
  } else {
    // Standard format
    sig = `${verb} ${doseText} ${routeInfo.humanReadable} ${frequencyText}`;
    
    // Add any special instructions if provided
    if (specialInstructions) {
      sig += ` ${specialInstructions}`;
    }
  }
  
  // Return both the human-readable sig and the FHIR representation
  return {
    humanReadable: sig.trim() + ".",
    fhirRepresentation: createFhirRepresentation(
      medication, 
      dosage, 
      routeName, 
      frequencyName, 
      specialInstructions
    )
  };
}

export default {
  calculateDualDosage,
  createFhirRepresentation,
  generateSignature
};
