/**
 * SignatureInstruction Interface
 * 
 * FHIR R4 compliant output structure for medication instructions.
 * This represents the standardized output of the medication signature
 * builder system that can be integrated with electronic health records.
 * 
 * Based on FHIR R4 Dosage datatype:
 * https://www.hl7.org/fhir/dosage.html
 * 
 * @since 2.0.0
 */

import { CodeableConcept, Quantity, Ratio } from './MedicationProfile';

/**
 * Timing repeat structure for FHIR timing
 */
export interface TimingRepeat {
  /** Number of times to repeat */
  count?: number;
  /** Maximum number of times to repeat */
  countMax?: number;
  /** How long when it happens */
  duration?: number;
  /** How long when it happens (Max) */
  durationMax?: number;
  /** Unit of time (UCUM) */
  durationUnit?: string;
  /** Event occurs frequency times per period */
  frequency?: number;
  /** Event occurs up to frequencyMax times per period */
  frequencyMax?: number;
  /** Event occurs frequency times per duration */
  period?: number;
  /** Upper limit of period */
  periodMax?: number;
  /** Unit of time (UCUM) */
  periodUnit?: string;
  /** Regular life events the event is tied to */
  when?: string[];
  /** Minutes from event (before or after) */
  offset?: number;
}

/**
 * Timing bounds using Period
 */
export interface Period {
  /** Starting time */
  start?: string;
  /** End time (inclusive) */
  end?: string;
}

/**
 * FHIR Timing structure
 */
export interface Timing {
  /** When the event occurs */
  event?: string[];
  /** When the event is to occur */
  repeat?: TimingRepeat;
  /** Length/Range of lengths, or (Start and/or end) limits */
  bounds?: Period;
  /** BID | TID | QID | AM | PM | QD | QOD | + */
  code?: CodeableConcept;
}

/**
 * Range structure for dose ranges
 */
export interface Range {
  /** Low limit */
  low?: Quantity;
  /** High limit */
  high?: Quantity;
}

/**
 * Dose and rate information
 */
export interface DoseAndRate {
  /** The kind of dose or rate specified */
  type?: CodeableConcept;
  /** Amount of medication per dose */
  doseQuantity?: Quantity;
  /** Amount of medication per dose range */
  doseRange?: Range;
  /** Amount of medication per unit of time */
  rateQuantity?: Quantity;
  /** Amount of medication per unit of time range */
  rateRange?: Range;
  /** Amount of medication per unit of time as ratio */
  rateRatio?: Ratio;
  /** When to administer */
  when?: string[];
}

/**
 * Relationship types for complex regimens
 */
export enum RelationshipType {
  /** Instructions should be followed in sequence */
  SEQUENTIAL = 'SEQUENTIAL',
  /** Instructions can be followed concurrently */
  CONCURRENT = 'CONCURRENT',
  /** Instruction is conditional on another */
  CONDITIONAL = 'CONDITIONAL'
}

/**
 * Relationship metadata for complex medication regimens
 */
export interface InstructionRelationship {
  /** Type of relationship */
  type: RelationshipType;
  /** ID of the related instruction */
  targetId?: string;
  /** Condition that must be met (for CONDITIONAL type) */
  condition?: string;
}

/**
 * Additional instruction as CodeableConcept
 */
export interface AdditionalInstruction {
  /** Coded instruction */
  coding?: Array<{
    system?: string;
    code?: string;
    display?: string;
  }>;
  /** Plain text instruction */
  text?: string;
}

/**
 * Main SignatureInstruction interface
 * 
 * Represents a complete medication instruction that is FHIR R4 compliant
 * and can be used in electronic health record systems.
 */
export interface SignatureInstruction {
  /** Unique identifier for this instruction */
  id?: string;
  /** Sequence number for ordering */
  sequence?: number;
  /** Free text dosage instructions */
  text: string;
  /** Supplemental instructions */
  additionalInstructions?: AdditionalInstruction[];
  /** Patient or consumer oriented instructions */
  patientInstructions?: string;
  /** When medication should be administered */
  timing?: Timing;
  /** Take "as needed" */
  asNeeded?: CodeableConcept;
  /** Body site to administer to */
  site?: CodeableConcept;
  /** How drug should enter body */
  route?: CodeableConcept;
  /** Technique for administering medication */
  method?: CodeableConcept;
  /** Amount of medication per dose */
  doseAndRate?: DoseAndRate[];
  /** Upper limit on medication per unit of time */
  maxDosePerPeriod?: Ratio;
  /** Upper limit on medication per administration */
  maxDosePerAdministration?: Quantity;
  /** Upper limit on medication per lifetime of patient */
  maxDosePerLifetime?: Quantity;
  /** Relationship to other instructions (for complex regimens) */
  relationship?: InstructionRelationship;
}

/**
 * Type guard to check if an object is a valid SignatureInstruction
 * 
 * @param obj - Object to check
 * @returns True if the object is a valid SignatureInstruction
 */
export function isSignatureInstruction(obj: any): obj is SignatureInstruction {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Text is required
  if (typeof obj.text !== 'string') {
    return false;
  }

  // doseAndRate is required and must be a non-empty array
  if (!Array.isArray(obj.doseAndRate) || obj.doseAndRate.length === 0) {
    return false;
  }

  // Validate each doseAndRate entry
  for (const dar of obj.doseAndRate) {
    // Check if at least one dose type is present
    const hasDose = dar.doseQuantity || dar.doseRange;
    
    if (!hasDose) {
      return false;
    }
    
    if (dar.doseQuantity && 
        (typeof dar.doseQuantity.value !== 'number' || 
         typeof dar.doseQuantity.unit !== 'string')) {
      return false;
    }

    if (dar.doseRange && 
        (!dar.doseRange.low && !dar.doseRange.high)) {
      return false;
    }
  }

  // If timing exists, validate basic structure
  if (obj.timing !== undefined && typeof obj.timing !== 'object') {
    return false;
  }

  // If sequence exists, must be number
  if (obj.sequence !== undefined && typeof obj.sequence !== 'number') {
    return false;
  }

  return true;
}

/**
 * Factory function to create a SignatureInstruction
 * 
 * @param params - Parameters for creating the instruction
 * @returns A new SignatureInstruction
 */
export function createSignatureInstruction(params: {
  text: string;
  doseValue?: number;
  doseUnit?: string;
  frequency?: number;
  period?: number;
  periodUnit?: string;
  route?: string;
  additionalInstructions?: string;
  site?: CodeableConcept;
  asNeeded?: boolean;
  maxDoseValue?: number;
  maxDoseUnit?: string;
  maxDosePeriod?: number;
  maxDosePeriodUnit?: string;
}): SignatureInstruction {
  const instruction: SignatureInstruction = {
    text: params.text
  };

  // Add dose information
  if (params.doseValue !== undefined && params.doseUnit) {
    instruction.doseAndRate = [{
      doseQuantity: {
        value: params.doseValue,
        unit: params.doseUnit
      }
    }];
  }

  // Add timing information
  if (params.frequency !== undefined && params.period !== undefined && params.periodUnit) {
    instruction.timing = {
      repeat: {
        frequency: params.frequency,
        period: params.period,
        periodUnit: params.periodUnit
      }
    };
  }

  // Add route
  if (params.route) {
    instruction.route = {
      coding: [{
        display: params.route
      }]
    };
  }

  // Add additional instructions
  if (params.additionalInstructions) {
    instruction.additionalInstructions = [{
      text: params.additionalInstructions
    }];
  }

  // Add site
  if (params.site) {
    instruction.site = params.site;
  }

  // Add as needed
  if (params.asNeeded) {
    instruction.asNeeded = {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-NullFlavor',
        code: 'NI',
        display: 'NoInformation'
      }]
    };
  }

  // Add max dose
  if (params.maxDoseValue && params.maxDoseUnit && params.maxDosePeriod && params.maxDosePeriodUnit) {
    instruction.maxDosePerPeriod = {
      numerator: {
        value: params.maxDoseValue,
        unit: params.maxDoseUnit
      },
      denominator: {
        value: params.maxDosePeriod,
        unit: params.maxDosePeriodUnit
      }
    };
  }

  return instruction;
}