/**
 * Medication Signature Builders
 * 
 * This module provides builder pattern implementations for constructing
 * FHIR-compliant medication instructions using a fluent API.
 * 
 * @since 3.0.0
 */

// Core interface and types
export type {
  ISignatureBuilder,
  DoseInput,
  TimingInput,
  RouteInput,
  DoseConstraints,
  AsNeededInput,
  BuilderState
} from './ISignatureBuilder';

export {
  isValidDoseInput,
  isValidTimingInput
} from './ISignatureBuilder';

// Complex regimen interface and types
export type {
  IComplexRegimenBuilder,
  DoseRangeInput,
  FrequencyRangeInput,
  TaperingPhase,
  ConditionalInstruction,
  MaxDailyDoseConstraint,
  MultiIngredientDoseInput,
  ComplexRegimenBuilderState
} from './IComplexRegimenBuilder';

// Re-export from SignatureInstruction
export type { InstructionRelationship } from '../../types/SignatureInstruction';

export {
  isValidDoseRangeInput,
  isValidFrequencyRangeInput,
  isValidTaperingPhase
} from './IComplexRegimenBuilder';

// Concrete builder implementations
export { SimpleTabletBuilder } from './SimpleTabletBuilder';
export { SimpleLiquidBuilder } from './SimpleLiquidBuilder';
export { FractionalTabletBuilder } from './FractionalTabletBuilder';
export { TopiclickBuilder } from './TopiclickBuilder';
export { NasalSprayBuilder } from './NasalSprayBuilder';

// Complex regimen builders (Epic 5)
export { MultiIngredientBuilder } from './MultiIngredientBuilder';
export { ComplexPRNBuilder } from './ComplexPRNBuilder';
export { TaperingDoseBuilder } from './TaperingDoseBuilder';

/**
 * Factory function to create appropriate builder based on medication
 */
import { MedicationProfile } from '../../types/MedicationProfile';
import { ISignatureBuilder } from './ISignatureBuilder';
import { isMultiIngredient } from '../signature';
import { SimpleTabletBuilder } from './SimpleTabletBuilder';
import { SimpleLiquidBuilder } from './SimpleLiquidBuilder';
import { FractionalTabletBuilder } from './FractionalTabletBuilder';
import { TopiclickBuilder } from './TopiclickBuilder';
import { NasalSprayBuilder } from './NasalSprayBuilder';
import { MultiIngredientBuilder } from './MultiIngredientBuilder';
import { ComplexPRNBuilder } from './ComplexPRNBuilder';
import { TaperingDoseBuilder } from './TaperingDoseBuilder';

export function createBuilder(medication: MedicationProfile): ISignatureBuilder {
  const doseForm = medication.doseForm?.toLowerCase() || '';
  
  // Check for multi-ingredient medications first
  const hasMultipleIngredients = isMultiIngredient(medication);
  if (hasMultipleIngredients) {
    return new MultiIngredientBuilder(medication);
  }
  
  // Check for tapering medications
  if (medication.isTaper) {
    return new TaperingDoseBuilder(medication);
  }
  
  // Special dispensers - check dispenser info first
  if (medication.dispenserInfo?.type === 'Topiclick' || 
      medication.dispenserMetadata?.type === 'Topiclick' ||
      medication.name?.toLowerCase().includes('topiclick')) {
    return new TopiclickBuilder(medication);
  }
  
  if (medication.dispenserInfo?.type === 'NasalSpray' || 
      medication.dispenserMetadata?.type === 'NasalSpray' ||
      doseForm.includes('nasal') || 
      doseForm === 'spray') {
    return new NasalSprayBuilder(medication);
  }
  
  // Tablet/capsule forms
  const solidForms = ['tablet', 'capsule', 'troche', 'odt'];
  if (solidForms.includes(doseForm)) {
    // Check if fractional dosing is indicated
    if (medication.isFractional || medication.isScored) {
      return new FractionalTabletBuilder(medication);
    }
    return new SimpleTabletBuilder(medication);
  }
  
  // Liquid forms
  const liquidForms = ['solution', 'suspension', 'syrup', 'elixir', 'tincture', 'injection', 'vial', 'nasal spray'];
  if (liquidForms.includes(doseForm)) {
    return new SimpleLiquidBuilder(medication);
  }
  
  // Topical forms that might use special dispensers
  const topicalForms = ['cream', 'gel', 'ointment'];
  if (topicalForms.includes(doseForm)) {
    return new SimpleLiquidBuilder(medication);
  }
  
  // Default to tablet builder for unknown forms with warning
  console.warn(`Unknown dose form: ${medication.doseForm}. Defaulting to TabletBuilder.`);
  
  // Temporarily modify the dose form to be tablet-compatible for unknown forms
  const modifiedMedication = { ...medication, doseForm: 'tablet' };
  return new SimpleTabletBuilder(modifiedMedication);
}