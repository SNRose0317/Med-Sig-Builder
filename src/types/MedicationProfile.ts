/**
 * MedicationProfile Interface
 * 
 * Extended medication interface with advanced features for complex dosing scenarios.
 * Immutable input data structure that captures all medication information
 * needed for signature generation. This is the primary input to the 
 * refactored medication signature builder system.
 * 
 * @see {@link ./README.md} Complete schema documentation with FHIR packaging examples
 * @see {@link ./index.ts} Primary Medication interface for basic use cases
 * 
 * @since 2.0.0
 */

/**
 * Enum for tablet scoring capabilities
 */
export enum ScoringType {
  /** Tablet cannot be split */
  NONE = 'NONE',
  /** Tablet can be split in half */
  HALF = 'HALF',
  /** Tablet can be split into quarters */
  QUARTER = 'QUARTER'
}

/**
 * Represents a quantity with value and unit
 */
export interface Quantity {
  /** Numeric value */
  value: number;
  /** Unit of measure (e.g., 'mg', 'mL', 'tablet') */
  unit: string;
}

/**
 * Represents a ratio between two quantities
 */
export interface Ratio {
  /** Numerator quantity */
  numerator: Quantity;
  /** Denominator quantity */
  denominator: Quantity;
}

/**
 * FHIR-compatible coding element
 */
export interface Coding {
  /** Identity of the terminology system */
  system?: string;
  /** Symbol in syntax defined by the system */
  code?: string;
  /** Representation defined by the system */
  display: string;
}

/**
 * FHIR-compatible CodeableConcept
 */
export interface CodeableConcept {
  /** Code defined by a terminology system */
  coding: Coding[];
  /** Plain text representation */
  text?: string;
}

/**
 * Medication ingredient with strength information
 */
export interface Ingredient {
  /** Name of the active ingredient */
  name: string;
  /** Strength as a ratio (e.g., 200mg/1mL) */
  strengthRatio: Ratio;
  /** Alternative: strength as quantity for solid forms */
  strengthQuantity?: Quantity;
}

/**
 * Custom conversion rules for runtime/lot-specific overrides
 */
export interface CustomConversion {
  /** Source quantity */
  from: Quantity;
  /** Target quantity */
  to: Quantity;
  /** Conversion factor */
  factor: number;
  /** Whether this conversion is lot-specific */
  lotSpecific: boolean;
  /** Lot number if lot-specific */
  lotNumber?: string;
  /** Expiration date for this conversion rule */
  expiresAt?: string;
}

/**
 * Molar mass information for electrolyte conversions
 */
export interface MolarMass {
  /** Molar mass value */
  value: number;
  /** Unit (typically g/mol) */
  unit: string;
}

/**
 * Metadata for special dispensers (e.g., Topiclick)
 */
export interface DispenserMetadata {
  /** Type of dispenser */
  type: string;
  /** Volume lost during priming */
  primeVolume?: Quantity;
  /** Delivery precision (e.g., 0.25 for quarter doses) */
  deliveryPrecision?: number;
  /** Air gap volume for safety */
  airGapVolume?: Quantity;
  /** Dead volume that cannot be dispensed */
  deadVolume?: Quantity;
}

/**
 * Package information for days supply calculations
 */
export interface PackageInfo {
  /** Total quantity in package */
  quantity: number;
  /** Unit of the quantity */
  unit: string;
  /** Number of items per pack */
  packSize?: number;
}

/**
 * Dispenser information (existing field for compatibility)
 */
export interface DispenserInfo {
  /** Type of dispenser */
  type: string;
  /** Singular unit name */
  unit: string;
  /** Plural unit name */
  pluralUnit: string;
  /** Conversion ratio (e.g., 4 clicks = 1 mL) */
  conversionRatio: number;
  /** Maximum amount per dose */
  maxAmountPerDose?: number;
}

/**
 * Dosage constraints for validation
 */
export interface DosageConstraints {
  /** Minimum allowed dose */
  minDose?: Quantity;
  /** Maximum allowed dose */
  maxDose?: Quantity;
  /** Step increment for dosing */
  step?: number;
}

/**
 * Default signature settings
 */
export interface DefaultSignatureSettings {
  /** Default dosage */
  dosage: Quantity;
  /** Default frequency */
  frequency: string;
  /** Default special instructions */
  specialInstructions?: string;
}

/**
 * Main MedicationProfile interface
 * 
 * This interface extends the existing Medication interface with new fields
 * needed for the refactoring while maintaining backward compatibility.
 */
export interface MedicationProfile {
  // ===== Core fields (REQUIRED) =====
  /** Unique identifier */
  id: string;
  /** Medication name */
  name: string;
  /** Type of entry */
  type: 'medication' | 'supplement' | 'compound';
  /** Whether medication is active */
  isActive: boolean;
  /** Dose form (e.g., 'Tablet', 'Vial', 'Cream') */
  doseForm: string;
  
  // ===== FHIR fields (REQUIRED for compliance) =====
  /** FHIR CodeableConcept for medication codes */
  code: CodeableConcept;
  
  // ===== Dosing information (REQUIRED for calculations) =====
  /** Active ingredients with strength information */
  ingredient: Ingredient[];
  
  // ===== New fields for refactoring =====
  /** Whether fractional dosing is supported */
  isFractional?: boolean;
  /** Whether this is a tapering regimen */
  isTaper?: boolean;
  /** Whether this has multiple active ingredients (can be computed) */
  isMultiIngredient?: boolean;
  /** Tablet scoring capability */
  isScored?: ScoringType;
  /** Concentration ratio for liquid medications */
  concentrationRatio?: Ratio;
  /** Molar mass for electrolyte conversions */
  molarMass?: MolarMass;
  /** Custom conversion rules */
  customConversions?: CustomConversion[];
  /** Metadata for special dispensers */
  dispenserMetadata?: DispenserMetadata;
  
  // ===== Existing optional fields (for compatibility) =====
  /** Package information */
  packageInfo?: PackageInfo;
  /** Dispenser information (legacy) */
  dispenserInfo?: DispenserInfo;
  /** Dosage constraints */
  dosageConstraints?: DosageConstraints;
  /** Allowed routes of administration */
  allowedRoutes?: string[];
  /** Default route */
  defaultRoute?: string;
  /** Default signature settings */
  defaultSignatureSettings?: DefaultSignatureSettings;
  /** Total volume */
  totalVolume?: Quantity;
  /** FHIR extensions */
  extension?: Array<{ [key: string]: any }>;
  /** Common dosages */
  commonDosages?: Array<{
    value: number;
    unit: string;
    frequency?: string;
  }>;
  /** Eligible genders */
  eligibleGenders?: Array<'MALE' | 'FEMALE' | 'OTHER'>;
  /** Vendor name */
  vendor?: string;
  /** Stock keeping unit */
  sku?: string;
  /** Display position */
  position?: number;
  /** Whether this is a controlled substance */
  isControlled?: boolean;
}

/**
 * Type guard to check if an object is a valid MedicationProfile
 * 
 * @param obj - Object to check
 * @returns True if the object is a valid MedicationProfile
 */
export function isMedicationProfile(obj: any): obj is MedicationProfile {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof obj.id !== 'string' ||
      typeof obj.name !== 'string' ||
      !['medication', 'supplement', 'compound'].includes(obj.type) ||
      typeof obj.isActive !== 'boolean' ||
      typeof obj.doseForm !== 'string') {
    return false;
  }

  // Check code field
  if (!obj.code || 
      !Array.isArray(obj.code.coding) || 
      obj.code.coding.length === 0 ||
      !obj.code.coding.every((c: any) => c && typeof c.display === 'string')) {
    return false;
  }

  // Check ingredient field
  if (!Array.isArray(obj.ingredient) || 
      obj.ingredient.length === 0 ||
      !obj.ingredient.every((ing: any) => 
        ing &&
        typeof ing.name === 'string' &&
        ing.strengthRatio &&
        typeof ing.strengthRatio.numerator?.value === 'number' &&
        typeof ing.strengthRatio.numerator?.unit === 'string' &&
        typeof ing.strengthRatio.denominator?.value === 'number' &&
        typeof ing.strengthRatio.denominator?.unit === 'string'
      )) {
    return false;
  }

  // Optional field type checks
  if (obj.isScored !== undefined && 
      !Object.values(ScoringType).includes(obj.isScored)) {
    return false;
  }

  if (obj.eligibleGenders !== undefined &&
      (!Array.isArray(obj.eligibleGenders) ||
       !obj.eligibleGenders.every((g: any) => ['MALE', 'FEMALE', 'OTHER'].includes(g)))) {
    return false;
  }

  return true;
}