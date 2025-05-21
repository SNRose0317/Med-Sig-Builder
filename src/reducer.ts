import { Medication } from './types';
import { DoseInput } from './utils/buildDosage';
import medications from './data/medications.json';

export interface AppState {
  // Selected medication and its details
  selectedMedication: Medication | null;
  
  // Dosage information
  dosage: DoseInput;
  
  // Route of administration
  selectedRoute: string;
  
  // Frequency selection
  selectedFrequency: string;
  
  // Special instructions
  specialInstructions: string;
  
  // Generated signature and FHIR output
  generatedSignature: {
    humanReadable: string;
    fhirRepresentation: any;
  } | null;
  
  // Validation errors
  errors: {
    dosage?: string;
    route?: string;
    frequency?: string;
    general?: string;
  };
}

export const initialState: AppState = {
  selectedMedication: null,
  dosage: { value: 0, unit: 'mg' },
  selectedRoute: '',
  selectedFrequency: '',
  specialInstructions: '',
  generatedSignature: null,
  errors: {}
};

export type Action =
  | { type: 'SELECT_MEDICATION'; medication: Medication }
  | { type: 'UPDATE_DOSAGE'; dosage: DoseInput }
  | { type: 'SELECT_ROUTE'; route: string }
  | { type: 'SELECT_FREQUENCY'; frequency: string }
  | { type: 'UPDATE_SPECIAL_INSTRUCTIONS'; instructions: string }
  | { type: 'GENERATE_SIGNATURE'; signature: { humanReadable: string; fhirRepresentation: any } }
  | { type: 'SET_ERROR'; field: string; message: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'RESET_FORM' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_MEDICATION':
      // When selecting a medication, update route and reset dosage with appropriate unit
      const medication = action.medication;
      const defaultRoute = medication.defaultRoute || '';
      
      // Set appropriate default unit based on dosage form
      let defaultUnit = 'mg';
      if (medication.doseForm === 'Vial' || medication.doseForm === 'Solution') {
        defaultUnit = 'mL';
      } else if (['Tablet', 'Capsule', 'Patch', 'ODT'].includes(medication.doseForm)) {
        defaultUnit = medication.doseForm.toLowerCase();
      }
      
      // Set default dosage
      let defaultDosage = { value: 0, unit: defaultUnit };
      if (medication.commonDosages && medication.commonDosages.length > 0) {
        defaultDosage = {
          value: medication.commonDosages[0].value,
          unit: medication.commonDosages[0].unit
        };
      }
      
      return {
        ...state,
        selectedMedication: medication,
        selectedRoute: defaultRoute,
        dosage: defaultDosage,
        // Reset other fields as needed
        generatedSignature: null,
        errors: {}
      };
      
    case 'UPDATE_DOSAGE':
      return {
        ...state,
        dosage: action.dosage,
        generatedSignature: null // Reset signature when dosage changes
      };
      
    case 'SELECT_ROUTE':
      return {
        ...state,
        selectedRoute: action.route,
        generatedSignature: null // Reset signature when route changes
      };
      
    case 'SELECT_FREQUENCY':
      return {
        ...state,
        selectedFrequency: action.frequency,
        generatedSignature: null // Reset signature when frequency changes
      };
      
    case 'UPDATE_SPECIAL_INSTRUCTIONS':
      return {
        ...state,
        specialInstructions: action.instructions
      };
      
    case 'GENERATE_SIGNATURE':
      return {
        ...state,
        generatedSignature: action.signature
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.message
        }
      };
      
    case 'CLEAR_ERROR':
      const updatedErrors = { ...state.errors };
      delete updatedErrors[action.field as keyof typeof updatedErrors];
      
      return {
        ...state,
        errors: updatedErrors
      };
      
    case 'RESET_FORM':
      return initialState;
      
    default:
      return state;
  }
}

// Helper functions
export function validateState(state: AppState): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!state.selectedMedication) {
    errors.general = 'Please select a medication';
    return { isValid: false, errors };
  }
  
  if (!state.selectedRoute) {
    errors.route = 'Please select a route of administration';
  }
  
  if (!state.selectedFrequency) {
    errors.frequency = 'Please select a frequency';
  }
  
  if (state.dosage.value <= 0) {
    errors.dosage = 'Please enter a valid dosage amount';
  }
  
  // Check dosage constraints if available
  if (state.selectedMedication.dosageConstraints) {
    const constraints = state.selectedMedication.dosageConstraints;
    
    if (constraints.minDose && constraints.minDose.unit === state.dosage.unit) {
      if (state.dosage.value < constraints.minDose.value) {
        errors.dosage = `Dosage cannot be less than ${constraints.minDose.value} ${constraints.minDose.unit}`;
      }
    }
    
    if (constraints.maxDose && constraints.maxDose.unit === state.dosage.unit) {
      if (state.dosage.value > constraints.maxDose.value) {
        errors.dosage = `Dosage cannot be more than ${constraints.maxDose.value} ${constraints.maxDose.unit}`;
      }
    }
  }
  
  return { 
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function getMedicationById(id: string): Medication | undefined {
  return (medications as Medication[]).find(med => med.id === id);
}

export default reducer;
