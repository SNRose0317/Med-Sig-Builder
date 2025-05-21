/**
 * Extension to the database adapter for handling special cases
 * like flattened nested objects when converting between application and database formats
 */

/**
 * Converts nested structures into flattened fields and vice versa for medication objects
 * 
 * For example, dosageConstraints in the application:
 * { dosageConstraints: { minDose: { value: 50, unit: 'mg' }, maxDose: { value: 200, unit: 'mg' }, step: 50 } }
 * 
 * Gets converted to database format as:
 * { min_dose_value: 50, min_dose_unit: 'mg', max_dose_value: 200, max_dose_unit: 'mg', dose_step: 50 }
 */

import { Medication } from '../types';

/**
 * Flattens nested dosage constraints for database storage
 */
export function flattenDosageConstraints(medication: Record<string, any>): Record<string, any> {
  const result = { ...medication };
  
  // Remove the dosageConstraints object if it exists
  if (result.dosageConstraints) {
    const { dosageConstraints } = result;
    delete result.dosageConstraints;
    
    // Add flattened fields
    if (dosageConstraints.minDose) {
      result.min_dose_value = dosageConstraints.minDose.value;
      result.min_dose_unit = dosageConstraints.minDose.unit;
    }
    
    if (dosageConstraints.maxDose) {
      result.max_dose_value = dosageConstraints.maxDose.value;
      result.max_dose_unit = dosageConstraints.maxDose.unit;
    }
    
    if (dosageConstraints.step !== undefined) {
      result.dose_step = dosageConstraints.step;
    }
  }
  
  return result;
}

/**
 * Reconstructs nested dosage constraints from flattened database fields
 */
export function reconstructDosageConstraints(dbRow: Record<string, any>): Record<string, any> {
  const result = { ...dbRow };
  let hasConstraints = false;
  
  // Create constraints object if any fields exist
  const constraints: any = {};
  
  // Check for min dose
  if (result.min_dose_value !== undefined && result.min_dose_unit) {
    constraints.minDose = {
      value: result.min_dose_value,
      unit: result.min_dose_unit
    };
    delete result.min_dose_value;
    delete result.min_dose_unit;
    hasConstraints = true;
  }
  
  // Check for max dose
  if (result.max_dose_value !== undefined && result.max_dose_unit) {
    constraints.maxDose = {
      value: result.max_dose_value,
      unit: result.max_dose_unit
    };
    delete result.max_dose_value;
    delete result.max_dose_unit;
    hasConstraints = true;
  }
  
  // Check for step
  if (result.dose_step !== undefined) {
    constraints.step = result.dose_step;
    delete result.dose_step;
    hasConstraints = true;
  }
  
  // Only add constraints if they exist
  if (hasConstraints) {
    result.dosageConstraints = constraints;
  }
  
  return result;
}

/**
 * Wrapper for objectToDatabaseFormat that handles special cases
 */
export function extendedObjectToDatabaseFormat(obj: Record<string, any>): Record<string, any> {
  // Handle flattening of nested structures before generic conversion
  const flattenedObj = flattenDosageConstraints(obj);
  
  // Let the original adapter function handle the rest
  return flattenedObj;
}

/**
 * Wrapper for objectToApplicationFormat that handles special cases
 */
export function extendedObjectToApplicationFormat(dbObj: Record<string, any>): Record<string, any> {
  // Handle reconstruction of nested structures after generic conversion
  const reconstructedObj = reconstructDosageConstraints(dbObj);
  
  // Return the object with reconstructed structures
  return reconstructedObj;
}

/**
 * Process a medication from application to database format
 */
export function medicationToDbFormat(medication: Medication): Record<string, any> {
  return flattenDosageConstraints(medication as unknown as Record<string, any>);
}

/**
 * Process a database row to a medication object
 */
export function dbRowToMedication(row: Record<string, any>): Medication {
  return reconstructDosageConstraints(row) as unknown as Medication;
}
