export interface Medication {
  // Core fields (REQUIRED - DO NOT REMOVE)
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  doseForm: string;
  
  // FHIR fields (REQUIRED for compliance)
  code: {
    coding: Array<{
      system?: string;
      code?: string;
      display: string;
    }>;
  };
  
  // Dosing information (REQUIRED for calculations)
  ingredient: Array<{
    name: string;
    strengthRatio: {
      numerator: { value: number; unit: string; };
      denominator: { value: number; unit: string; };
    };
  }>;
  
  // Package info (REQUIRED for days supply)
  packageInfo?: {
    quantity: number;
    unit: string;
    packSize?: number;
  };
  
  // Dispenser info (REQUIRED for Topiclick)
  dispenserInfo?: {
    type: string;
    unit: string;
    pluralUnit: string;
    conversionRatio: number; // CRITICAL: 4 clicks = 1 mL
  };
  
  // Constraints (REQUIRED for validation)
  dosageConstraints?: {
    minDose?: { value: number; unit: string; };
    maxDose?: { value: number; unit: string; };
    step?: number;
  };
  
  // Routing (REQUIRED for signature)
  allowedRoutes?: string[];
  defaultRoute?: string;
  
  // Defaults (REQUIRED for saved settings)
  defaultSignatureSettings?: {
    dosage: { value: number; unit: string; };
    frequency: string;
    specialInstructions?: string;
  };
  
  // Additional fields that exist in the data
  totalVolume?: {
    value: number;
    unit: string;
  };
  extension?: Array<{
    [key: string]: any;
  }>;
  commonDosages?: Array<{
    value: number;
    unit: string;
    frequency?: string;
  }>;
  
  // Gender eligibility (REQUIRED for gender-specific medications)
  eligibleGenders?: Array<'MALE' | 'FEMALE' | 'OTHER'>;
  
  // Vendor information
  vendor?: string;
  sku?: string;
  position?: number;
}

// Simplified dose type
export interface Dose {
  value: number;
  unit: string;
}

// Signature builder state
export interface SignatureState {
  selectedMedication: Medication | null;
  dosage: Dose;
  route: string;
  frequency: string;
  specialInstructions: string;
  signature: {
    humanReadable: string;
    fhirRepresentation: any;
  } | null;
  errors: {
    dosage?: string;
    route?: string;
    frequency?: string;
    general?: string;
  };
}