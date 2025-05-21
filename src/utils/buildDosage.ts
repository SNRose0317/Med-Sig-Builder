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
      
      // Apply dosage constraints if defined
      if (medication.dosageConstraints?.minDose && 
          medication.dosageConstraints.minDose.unit === numeratorUnit &&
          primaryDose < medication.dosageConstraints.minDose.value) {
        
        // Adjust to minimum dose
        primaryDose = medication.dosageConstraints.minDose.value;
        secondaryDose = Number((primaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted dose to minimum: ${primaryDose} ${numeratorUnit}`);
      }
      
      if (medication.dosageConstraints?.maxDose && 
          medication.dosageConstraints.maxDose.unit === numeratorUnit &&
          primaryDose > medication.dosageConstraints.maxDose.value) {
        
        // Adjust to maximum dose
        primaryDose = medication.dosageConstraints.maxDose.value;
        secondaryDose = Number((primaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted dose to maximum: ${primaryDose} ${numeratorUnit}`);
      }
    } 
    // Case 2: User entered volume-based dose (mL)
    else if (userDosage.unit === denominatorUnit) {
      secondaryDose = userDosage.value;
      primaryDose = Number((userDosage.value * strengthValue).toFixed(0));
      
      // Apply dosage constraints if defined
      if (medication.dosageConstraints?.minDose && 
          medication.dosageConstraints.minDose.unit === numeratorUnit &&
          primaryDose < medication.dosageConstraints.minDose.value) {
        
        // Adjust to minimum dose
        primaryDose = medication.dosageConstraints.minDose.value;
        secondaryDose = Number((primaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted dose to minimum: ${primaryDose} ${numeratorUnit}`);
      }
      
      if (medication.dosageConstraints?.maxDose && 
          medication.dosageConstraints.maxDose.unit === numeratorUnit &&
          primaryDose > medication.dosageConstraints.maxDose.value) {
        
        // Adjust to maximum dose
        primaryDose = medication.dosageConstraints.maxDose.value;
        secondaryDose = Number((primaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted dose to maximum: ${primaryDose} ${numeratorUnit}`);
      }
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
      
      // Apply dosage constraints for strength-based constraints
      if (medication.dosageConstraints?.minDose && 
          medication.dosageConstraints.minDose.unit === numeratorUnit &&
          secondaryDose < medication.dosageConstraints.minDose.value) {
        
        // Adjust to minimum dose
        secondaryDose = medication.dosageConstraints.minDose.value;
        primaryDose = Number((secondaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted strength to minimum: ${secondaryDose} ${numeratorUnit}`);
      }
      
      if (medication.dosageConstraints?.maxDose && 
          medication.dosageConstraints.maxDose.unit === numeratorUnit &&
          secondaryDose > medication.dosageConstraints.maxDose.value) {
        
        // Adjust to maximum dose
        secondaryDose = medication.dosageConstraints.maxDose.value;
        primaryDose = Number((secondaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted strength to maximum: ${secondaryDose} ${numeratorUnit}`);
      }
    }
    // Case 2: User entered dose in the strength unit (mg, mcg, %, etc.)
    else if (userDosage.unit === numeratorUnit) {
      secondaryDose = userDosage.value;
      let calculatedDose = Number((userDosage.value / strengthValue).toFixed(2));
      
      // Apply dosage constraints directly if they're in strength units
      if (medication.dosageConstraints?.minDose && 
          medication.dosageConstraints.minDose.unit === numeratorUnit &&
          secondaryDose < medication.dosageConstraints.minDose.value) {
        
        // Adjust to minimum dose
        secondaryDose = medication.dosageConstraints.minDose.value;
        calculatedDose = Number((secondaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted dose to minimum: ${secondaryDose} ${numeratorUnit}`);
      }
      
      if (medication.dosageConstraints?.maxDose && 
          medication.dosageConstraints.maxDose.unit === numeratorUnit &&
          secondaryDose > medication.dosageConstraints.maxDose.value) {
        
        // Adjust to maximum dose
        secondaryDose = medication.dosageConstraints.maxDose.value;
        calculatedDose = Number((secondaryDose / strengthValue).toFixed(2));
        console.log(`Adjusted dose to maximum: ${secondaryDose} ${numeratorUnit}`);
      }
      
      // Special handling for tablets - only allow fractions down to 1/4
      if (denominatorUnit === 'tablet') {
        if (calculatedDose < 0.25) {
          // Don't go below 1/4 tablet
          primaryDose = 0.25;
        } else if (calculatedDose < 1) {
          // Round to nearest 1/4 tablet (0.25, 0.5, 0.75)
          primaryDose = Math.round(calculatedDose * 4) / 4;
        } else {
          // For whole tablets or more, round to nearest 1/4
          primaryDose = Math.round(calculatedDose * 4) / 4;
        }
      }
      // Make sure we don't go below 1 for items that can't be fractional
      else if (['capsule', 'spray', 'application', 'patch'].includes(denominatorUnit) && calculatedDose < 1) {
        primaryDose = 1;
      } else {
        primaryDose = calculatedDose;
      }
      
      // Apply step constraints if defined
      if (medication.dosageConstraints?.step && medication.dosageConstraints.step > 0) {
        primaryDose = Math.round(primaryDose / medication.dosageConstraints.step) * medication.dosageConstraints.step;
        secondaryDose = Number((primaryDose * strengthValue).toFixed(2));
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
  let additionalDosages: Array<{ value: number; unit: string }> = [];
  
  if (hasStrengthRatio) {
    const dualDosage = calculateDualDosage(medication, dosage);
    
    if (dualDosage) {
      // Primary dosage is what user entered
      const strengthRatio = medication.ingredient[0].strengthRatio;
      const numeratorUnit = strengthRatio.numerator.unit;
      const denominatorUnit = strengthRatio.denominator.unit;
      
      // Special handling for creams with Topiclick dispenser
      if (medication.doseForm === 'Cream') {
        const doseFormInfo = doseForms[medication.doseForm];
        const hasDispenser = doseFormInfo.hasSpecialDispenser && doseFormInfo.dispenserConversion;
        
        if (hasDispenser && doseFormInfo.dispenserConversion) {
          const dispenserUnit = doseFormInfo.dispenserConversion.dispenserUnit;
          const conversionRatio = doseFormInfo.dispenserConversion.conversionRatio;
          
          if (dosage.unit === dispenserUnit) {
            // User entered clicks, add both mL and mg
            additionalDosages.push(dualDosage.volumeBased); // mL
            additionalDosages.push(dualDosage.weightBased); // mg
          } 
          else if (dosage.unit === 'mL') {
            // User entered mL, add both clicks and mg
            const clickValue = Math.round(dosage.value * conversionRatio);
            additionalDosages.push({ value: clickValue, unit: dispenserUnit });
            additionalDosages.push(dualDosage.weightBased);
          }
          else if (dosage.unit === numeratorUnit) {
            // User entered mg, add both mL and clicks
            const mlValue = dualDosage.volumeBased.value;
            const clickValue = Math.round(mlValue * conversionRatio);
            additionalDosages.push(dualDosage.volumeBased);
            additionalDosages.push({ value: clickValue, unit: dispenserUnit });
          }
          else if (dosage.unit === 'application') {
            // User entered application, add strength unit
            additionalDosages.push(dualDosage.weightBased);
          }
        }
        else {
          // Regular cream without dispenser
          if (dosage.unit === numeratorUnit) {
            // User entered weight/concentration unit, add form unit
            additionalDosages.push(dualDosage.volumeBased);
          } else if (dosage.unit === 'application' || dosage.unit === denominatorUnit) {
            // User entered form unit, add weight/concentration
            additionalDosages.push(dualDosage.weightBased);
          }
        }
      }
      // Standard dual dosage for other medication forms
      else {
        if (dosage.unit === numeratorUnit) {
          // User entered the weight/concentration unit (mg, mcg, %), so additional is form unit
          additionalDosages.push(dualDosage.volumeBased);
        } else if (dosage.unit === denominatorUnit || 
                  dosage.unit === 'tablet' || 
                  dosage.unit === 'capsule' || 
                  dosage.unit === 'spray' || 
                  dosage.unit === 'application') {
          // User entered the form unit, so additional is weight/concentration
          additionalDosages.push(dualDosage.weightBased);
        }
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
  
  // Add additional dosages if present
  if (additionalDosages.length > 0) {
    fhirRepresentation.dosageInstruction.extension = additionalDosages.map(additionalDosage => ({
      url: "http://example.org/fhir/StructureDefinition/additional-dosage",
      valueDosage: {
        doseQuantity: {
          value: additionalDosage.value,
          unit: additionalDosage.unit
        }
      }
    }));
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
        const doseFormInfo = doseForms[medication.doseForm];
        const hasDispenser = doseFormInfo.hasSpecialDispenser && doseFormInfo.dispenserConversion;
        
        // Handle Topiclick or other special dispensers
        if (hasDispenser && doseFormInfo.dispenserConversion) {
          const dispenserUnit = doseFormInfo.dispenserConversion.dispenserUnit;
          const dispenserPluralUnit = doseFormInfo.dispenserConversion.dispenserPluralUnit;
          const conversionRatio = doseFormInfo.dispenserConversion.conversionRatio;
          
          if (dosage.unit === dispenserUnit) {
            // If user selected clicks, show "2 clicks (0.5 mL, 50 mg)"
            // For Topiclick: 1 click = 0.25mL (4 clicks per mL)
            // If cream strength is 100mg/mL, then 0.25mL = 25mg
            const mlValue = dosage.value / conversionRatio;
            const mgValue = mlValue * medication.ingredient[0].strengthRatio.numerator.value;
            
            // Use the appropriate singular or plural form based on the dose value
            const unitToUse = dosage.value === 1 ? dispenserUnit : dispenserPluralUnit;
            doseText = `${dosage.value} ${unitToUse} (${mlValue.toFixed(2)} mL, ${mgValue.toFixed(0)} ${dualDosage.weightBased.unit})`;
          } 
          else if (dosage.unit === 'mL') {
            // If user selected mL, show "0.5 mL (2 clicks, 50 mg)"
            const clickValue = Math.round(dosage.value * conversionRatio);
            const mgValue = dualDosage.weightBased.value;
            
            const clickUnitText = clickValue === 1 ? dispenserUnit : dispenserPluralUnit;
            doseText = `${dosage.value} mL (${clickValue} ${clickUnitText}, ${mgValue} ${dualDosage.weightBased.unit})`;
          }
          else if (dosage.unit === dualDosage.weightBased.unit) {
            // If user selected mg, show "50 mg (0.5 mL, 2 clicks)"
            const mlValue = dualDosage.volumeBased.value;
            const clickValue = Math.round(mlValue * conversionRatio);
            
            const clickUnitText = clickValue === 1 ? dispenserUnit : dispenserPluralUnit;
            doseText = `${dosage.value} ${dosage.unit} (${mlValue} mL, ${clickValue} ${clickUnitText})`;
          }
          else if (dosage.unit === 'application') {
            // If user selected application, show "1 application (0.05%)"
            doseText = `${dualDosage.volumeBased.value} ${dosage.unit}${dualDosage.volumeBased.value !== 1 ? 's' : ''} (${dualDosage.weightBased.value}${dualDosage.weightBased.unit})`;
          }
          else {
            // Default formatting
            doseText = `${dosage.value} ${dosage.unit}`;
          }
        }
        else {
          // Regular cream without special dispenser
          if (dosage.unit === 'application') {
            // If user selected application, show "1 application (0.05%)"
            doseText = `${dualDosage.volumeBased.value} ${dosage.unit}${dualDosage.volumeBased.value !== 1 ? 's' : ''} (${dualDosage.weightBased.value}${dualDosage.weightBased.unit})`;
          } else {
            // If user selected the strength unit, show "0.05% (1 application)"
            doseText = `${dualDosage.weightBased.value}${dualDosage.weightBased.unit} (${dualDosage.volumeBased.value} application${dualDosage.volumeBased.value !== 1 ? 's' : ''})`;
          }
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
  
      // Special handling for Topiclick/dispensers
  // Make sure we have the correct pluralization in the main signature text
  // And add mg equivalent for cream with Topiclick dispenser
  if (medication.doseForm === 'Cream') {
    const doseFormInfo = doseForms[medication.doseForm];
    const hasDispenser = doseFormInfo?.hasSpecialDispenser && doseFormInfo?.dispenserConversion;
    const hasStrengthRatio = medication.ingredient && medication.ingredient[0]?.strengthRatio;
    
    if (hasDispenser && doseFormInfo.dispenserConversion && hasStrengthRatio) {
      const dispenserUnit = doseFormInfo.dispenserConversion.dispenserUnit;
      const dispenserPluralUnit = doseFormInfo.dispenserConversion.dispenserPluralUnit;
      const conversionRatio = doseFormInfo.dispenserConversion.conversionRatio;
      const strengthRatio = medication.ingredient[0].strengthRatio;
      
      // If we're using clicks as the dose unit
      if (dosage.unit === dispenserUnit) {
        // Fix the dosage text to always use proper pluralization for dispenser units
        if (dosage.value !== 1 && doseText.includes(` ${dispenserUnit} (`)) {
          doseText = doseText.replace(` ${dispenserUnit} (`, ` ${dispenserPluralUnit} (`);
        }
        
        // Add the mg equivalent directly to the dosage text
        // This will make it appear in the main signature
        const mlValue = dosage.value / conversionRatio;
        const mgValue = mlValue * strengthRatio.numerator.value;
        
        // Extract the unit to use (singular or plural based on dose value)
        const unitText = dosage.value === 1 ? dispenserUnit : dispenserPluralUnit;
        
        // Create a new dose text that explicitly includes the mg equivalent
        doseText = `${dosage.value} ${unitText} (${mgValue.toFixed(0)} ${strengthRatio.numerator.unit})`;
      }
    }
  }
  
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
