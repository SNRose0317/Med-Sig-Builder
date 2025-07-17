/**
 * Primary Medication Interface
 * 
 * Represents a medication with FHIR R4 compliant packaging model.
 * 
 * @see {@link ./README.md} Complete schema documentation with examples
 * @see {@link ./MedicationProfile.ts} Extended interface for advanced features
 * 
 * @example FHIR Packaging Model (Injectable)
 * ```typescript
 * {
 *   totalVolume: { value: 10, unit: "mL" },     // 10mL per vial
 *   packageInfo: {
 *     quantity: 10,                             // 10mL per vial (unit dose)
 *     unit: "mL",
 *     packSize: 2                               // 2 vials per package (total = 20mL)
 *   }
 * }
 * ```
 * 
 * @example FHIR Packaging Model (Tablet)
 * ```typescript
 * {
 *   totalVolume: { value: 1, unit: "tablet" },  // 1 tablet per unit
 *   packageInfo: {
 *     quantity: 1,                              // 1 tablet per unit
 *     unit: "tablet", 
 *     packSize: 100                             // 100 tablets per bottle
 *   }
 * }
 * ```
 */
export interface Medication {
  // Core fields (REQUIRED - DO NOT REMOVE)
  /** Unique medication identifier */
  id: string;
  /** Human-readable medication name */
  name: string;
  /** Medication type (usually "medication") */
  type: string;
  /** Whether medication is active for prescribing */
  isActive: boolean;
  /** Dose form (Tablet, Injection, Cream, etc.) */
  doseForm: string;
  
  // FHIR fields (REQUIRED for compliance)
  /** FHIR CodeableConcept for medication identification */
  code: {
    coding: Array<{
      /** Terminology system (e.g., RxNorm) */
      system?: string;
      /** Code within the system */
      code?: string;
      /** Human-readable display name */
      display: string;
    }>;
  };
  
  // Dosing information (REQUIRED for calculations)
  /** Active ingredients with strength ratios */
  ingredient: Array<{
    /** Ingredient name */
    name: string;
    /** Strength ratio (e.g., 200mg/1mL) */
    strengthRatio: {
      /** Numerator quantity (e.g., 200mg) */
      numerator: { value: number; unit: string; };
      /** Denominator quantity (e.g., 1mL) */
      denominator: { value: number; unit: string; };
    };
  }>;
  
  /**
   * FHIR R4 Package Information (REQUIRED for days supply calculations)
   * 
   * CRITICAL: Uses corrected FHIR packaging model (updated 2025-07-17)
   * - quantity: Unit dose (per vial, per tablet)
   * - packSize: Number of units per dispensed package
   * 
   * @example Testosterone 200mg/mL
   * ```typescript
   * packageInfo: {
   *   quantity: 10,     // 10mL per vial (unit dose)
   *   unit: "mL",
   *   packSize: 2       // 2 vials per package (total = 20mL)
   * }
   * ```
   */
  packageInfo?: {
    /** Unit dose quantity (matches totalVolume.value) */
    quantity: number;
    /** Unit of measurement */
    unit: string;
    /** Number of units per dispensed package (default: 1) */
    packSize?: number;
  };
  
  /**
   * Special Dispenser Information (REQUIRED for Topiclick and similar devices)
   * 
   * @example Topiclick Dispenser
   * ```typescript
   * dispenserInfo: {
   *   type: "topiclick",
   *   unit: "click",
   *   pluralUnit: "clicks", 
   *   conversionRatio: 4    // 4 clicks = 1 mL
   * }
   * ```
   */
  dispenserInfo?: {
    /** Dispenser type (e.g., "topiclick") */
    type: string;
    /** Singular unit name */
    unit: string;
    /** Plural unit name */
    pluralUnit: string;
    /** Conversion ratio to mL (CRITICAL: 4 clicks = 1 mL) */
    conversionRatio: number;
  };
  
  // Constraints (REQUIRED for validation)
  dosageConstraints?: {
    minDose?: { value: number; unit: string; };
    maxDose?: { value: number; unit: string; };
    step?: number;
  };
  
  // Prescription quantity constraints (for Min/Default/Max QTY)
  quantityConstraints?: {
    minQty?: number;
    defaultQty?: number;
    maxQty?: number;
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
  
  /**
   * FHIR R4 Total Volume (Individual unit volume)
   * 
   * Represents the volume/quantity of a single unit (vial, tablet, tube).
   * Should match packageInfo.quantity for FHIR compliance.
   * 
   * @example Injectable (10mL vial)
   * ```typescript
   * totalVolume: { value: 10, unit: "mL" }
   * ```
   * 
   * @example Tablet
   * ```typescript  
   * totalVolume: { value: 1, unit: "tablet" }
   * ```
   */
  totalVolume?: {
    /** Quantity value */
    value: number;
    /** Unit of measurement */
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

// Export SignatureResult type  
export type { SignatureResult } from '../lib/signature';