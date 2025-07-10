/**
 * MedicationRequestContext DTO
 * 
 * Stable Data Transfer Object that represents the complete context
 * for a medication request. This serves as the input contract for
 * the medication signature builder API and decouples external systems
 * from internal representations.
 * 
 * @since 2.0.0
 */

import { MedicationProfile, Quantity, isMedicationProfile } from './MedicationProfile';

/**
 * Patient demographic and clinical context
 */
export interface PatientContext {
  /** Patient identifier */
  id: string;
  /** Age in years */
  age: number;
  /** Body weight */
  weight?: Quantity;
  /** Height */
  height?: Quantity;
  /** Gender */
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  /** Renal function parameters */
  renalFunction?: {
    /** Estimated glomerular filtration rate */
    egfr: number;
    /** Unit (typically mL/min/1.73m2) */
    unit: string;
    /** Creatinine clearance if available */
    creatinineClearance?: number;
  };
  /** Hepatic function parameters */
  hepaticFunction?: {
    /** AST level */
    ast?: number;
    /** ALT level */
    alt?: number;
    /** Unit for liver enzymes */
    unit: string;
    /** Child-Pugh score if applicable */
    childPughScore?: 'A' | 'B' | 'C';
  };
  /** Known allergies */
  allergies?: string[];
  /** Active medical conditions */
  conditions?: string[];
  /** Current medications (for interaction checking) */
  concurrentMedications?: string[];
}

/**
 * Prescriber information
 */
export interface PrescriberContext {
  /** Prescriber identifier */
  id: string;
  /** Full name */
  name: string;
  /** National Provider Identifier */
  npi?: string;
  /** DEA number (for controlled substances) */
  dea?: string;
  /** State license number */
  stateLicense?: string;
  /** Specialty */
  specialty?: string;
}

/**
 * Formulary and insurance context
 */
export interface FormularyContext {
  /** Formulary identifier */
  id: string;
  /** Formulary name */
  name: string;
  /** Preferred alternatives if medication not covered */
  preferredAlternatives?: string[];
  /** Coverage restrictions */
  restrictions?: string[];
  /** Copay tier (1-5, typically) */
  copayTier?: number;
  /** Prior authorization required */
  priorAuthRequired?: boolean;
}

/**
 * Clinical context for the prescription
 */
export interface ClinicalContext {
  /** Indication for use */
  indication: string;
  /** ICD-10 diagnosis codes */
  icd10Codes?: string[];
  /** Clinical notes */
  notes?: string;
  /** Treatment goals */
  goals?: string[];
  /** Monitoring parameters */
  monitoring?: string[];
}

/**
 * Main MedicationRequestContext DTO
 * 
 * This is the stable input contract for the medication signature
 * builder system. External systems should construct this DTO
 * to request medication signatures.
 */
export interface MedicationRequestContext {
  /** Unique request identifier */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Medication profile */
  medication: MedicationProfile;
  /** Patient context */
  patient: PatientContext;
  /** Requested dose */
  dose: Quantity;
  /** Frequency (e.g., 'twice daily', 'every 8 hours') */
  frequency: string;
  /** Route of administration */
  route: string;
  /** Duration of therapy */
  duration?: Quantity;
  /** Quantity to dispense */
  quantity?: Quantity;
  /** Number of refills */
  refills?: number;
  /** Special instructions */
  specialInstructions?: string;
  /** Prescriber information */
  prescriber?: PrescriberContext;
  /** Formulary context */
  formulary?: FormularyContext;
  /** Clinical context */
  clinicalContext?: ClinicalContext;
  /** PRN (as needed) indication */
  asNeeded?: string;
  /** Maximum dose per period */
  maxDosePerPeriod?: {
    dose: Quantity;
    period: Quantity;
  };
  /** Tapering instructions */
  taperingInstructions?: Array<{
    startDate: string;
    endDate: string;
    dose: Quantity;
    frequency: string;
  }>;
}

/**
 * Type guard to check if an object is a valid MedicationRequestContext
 * 
 * @param obj - Object to check
 * @returns True if the object is a valid MedicationRequestContext
 */
export function isMedicationRequestContext(obj: any): obj is MedicationRequestContext {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof obj.id !== 'string' ||
      typeof obj.timestamp !== 'string' ||
      typeof obj.frequency !== 'string' ||
      typeof obj.route !== 'string') {
    return false;
  }

  // Validate medication
  if (!isMedicationProfile(obj.medication)) {
    return false;
  }

  // Validate patient
  if (!obj.patient || 
      typeof obj.patient.id !== 'string' ||
      typeof obj.patient.age !== 'number') {
    return false;
  }

  // Validate dose
  if (!obj.dose ||
      typeof obj.dose.value !== 'number' ||
      typeof obj.dose.unit !== 'string') {
    return false;
  }

  // Validate optional patient fields if present
  if (obj.patient.gender !== undefined &&
      !['MALE', 'FEMALE', 'OTHER'].includes(obj.patient.gender)) {
    return false;
  }

  // Validate optional fields if present
  if (obj.refills !== undefined && typeof obj.refills !== 'number') {
    return false;
  }

  return true;
}

/**
 * Factory function to create a MedicationRequestContext
 * 
 * @param params - Parameters for creating the context
 * @returns A new MedicationRequestContext with generated ID and timestamp
 */
export function createMedicationRequestContext(params: {
  medication: MedicationProfile;
  patient: PatientContext;
  doseValue: number;
  doseUnit: string;
  frequency: string;
  route: string;
  duration?: Quantity;
  quantity?: Quantity;
  refills?: number;
  specialInstructions?: string;
  prescriber?: PrescriberContext;
  formulary?: FormularyContext;
  clinicalContext?: ClinicalContext;
  asNeeded?: string;
}): MedicationRequestContext {
  // Generate UUID-like ID (simplified for this example)
  const id = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    timestamp: new Date().toISOString(),
    medication: params.medication,
    patient: params.patient,
    dose: {
      value: params.doseValue,
      unit: params.doseUnit
    },
    frequency: params.frequency,
    route: params.route,
    ...(params.duration && { duration: params.duration }),
    ...(params.quantity && { quantity: params.quantity }),
    ...(params.refills !== undefined && { refills: params.refills }),
    ...(params.specialInstructions && { specialInstructions: params.specialInstructions }),
    ...(params.prescriber && { prescriber: params.prescriber }),
    ...(params.formulary && { formulary: params.formulary }),
    ...(params.clinicalContext && { clinicalContext: params.clinicalContext }),
    ...(params.asNeeded && { asNeeded: params.asNeeded })
  };
}