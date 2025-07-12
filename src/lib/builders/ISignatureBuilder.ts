/**
 * ISignatureBuilder Interface
 * 
 * Core contract that all medication signature builders must implement.
 * Provides a fluent API for constructing FHIR-compliant medication
 * instructions with full validation and audit trail support.
 * 
 * @since 2.0.0
 */

import { SignatureInstruction } from '../../types/SignatureInstruction';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';
import { Quantity } from '../../types/MedicationProfile';

/**
 * Input structure for dose configuration
 */
export interface DoseInput {
  /** Numeric dose value */
  value: number;
  /** Unit of measurement (e.g., 'mg', 'mL', 'tablet') */
  unit: string;
  /** Optional: for ranges (e.g., 1-2 tablets) */
  maxValue?: number;
}

/**
 * Input structure for timing configuration
 */
export interface TimingInput {
  /** Number of times per period */
  frequency: number;
  /** Period duration */
  period: number;
  /** Unit of period (e.g., 'd' for day, 'h' for hour) */
  periodUnit: string;
  /** Optional: specific times of day */
  when?: string[];
  /** Optional: duration of therapy */
  duration?: {
    value: number;
    unit: string;
  };
}

/**
 * Route input (simple string for now, can be expanded)
 */
export type RouteInput = string;

/**
 * Dose constraints for safety limits
 */
export interface DoseConstraints {
  /** Maximum dose per time period */
  maxDosePerPeriod?: {
    dose: Quantity;
    period: Quantity;
  };
  /** Maximum dose per single administration */
  maxDosePerAdministration?: Quantity;
  /** Maximum lifetime dose */
  maxDosePerLifetime?: Quantity;
}

/**
 * As-needed (PRN) configuration
 */
export interface AsNeededInput {
  /** Whether medication is as-needed */
  asNeeded: boolean;
  /** Indication for use (e.g., 'for pain', 'for nausea') */
  indication?: string;
  /** Minimum interval between doses */
  minInterval?: {
    value: number;
    unit: string;
  };
}

/**
 * Internal state maintained by builders
 */
export interface BuilderState {
  /** Configured doses (supports multiple for tapering) */
  doses: DoseInput[];
  /** Timing configuration */
  timing: TimingInput | null;
  /** Route of administration */
  route: RouteInput | null;
  /** Dose constraints */
  constraints: DoseConstraints | null;
  /** PRN configuration */
  asNeeded: AsNeededInput | null;
  /** Additional instructions */
  specialInstructions: string[];
  /** Audit trail of builder operations */
  auditTrail: string[];
}

/**
 * Core interface for all signature builders
 * 
 * Implementations must:
 * 1. Support fluent API (return this)
 * 2. Validate inputs at each step
 * 3. Maintain audit trail
 * 4. Generate valid SignatureInstruction[]
 * 5. Support serialization for debugging
 */
export interface ISignatureBuilder {
  /**
   * Configure dose amount and unit
   * 
   * @param dose - Dose configuration
   * @returns Builder instance for chaining
   * @throws Error if dose is invalid
   */
  buildDose(dose: DoseInput): ISignatureBuilder;

  /**
   * Set frequency and timing patterns
   * 
   * @param timing - Timing configuration
   * @returns Builder instance for chaining
   * @throws Error if timing is invalid
   */
  buildTiming(timing: TimingInput): ISignatureBuilder;

  /**
   * Set administration route
   * 
   * @param route - Route of administration
   * @returns Builder instance for chaining
   * @throws Error if route is invalid
   */
  buildRoute(route: RouteInput): ISignatureBuilder;

  /**
   * Add max dose and duration limits
   * 
   * @param constraints - Dose constraints
   * @returns Builder instance for chaining
   */
  buildConstraints(constraints: DoseConstraints): ISignatureBuilder;

  /**
   * Configure PRN (as-needed) instructions
   * 
   * @param asNeeded - PRN configuration
   * @returns Builder instance for chaining
   */
  buildAsNeeded(asNeeded: AsNeededInput): ISignatureBuilder;

  /**
   * Add additional guidance
   * 
   * @param instructions - Array of special instructions
   * @returns Builder instance for chaining
   */
  buildSpecialInstructions(instructions: string[]): ISignatureBuilder;

  /**
   * Generate final SignatureInstruction array
   * 
   * @returns Array of FHIR-compliant instructions
   * @throws Error if builder state is incomplete
   */
  getResult(): SignatureInstruction[];

  /**
   * Return audit trail of decisions made
   * 
   * @returns Human-readable explanation of builder operations
   */
  explain(): string;

  /**
   * Serialize builder state for debugging
   * 
   * @returns JSON-serializable object representing current state
   */
  toJSON(): object;
}

/**
 * Validates dose input
 * 
 * @param dose - Dose to validate
 * @returns True if valid, false otherwise
 */
export function isValidDoseInput(dose: any): dose is DoseInput {
  if (!dose || typeof dose !== 'object') {
    return false;
  }

  if (typeof dose.value !== 'number' || dose.value <= 0) {
    return false;
  }

  if (typeof dose.unit !== 'string' || dose.unit.length === 0) {
    return false;
  }

  if (dose.maxValue !== undefined && 
      (typeof dose.maxValue !== 'number' || dose.maxValue < dose.value)) {
    return false;
  }

  return true;
}

/**
 * Validates timing input
 * 
 * @param timing - Timing to validate
 * @returns True if valid, false otherwise
 */
export function isValidTimingInput(timing: any): timing is TimingInput {
  if (!timing || typeof timing !== 'object') {
    return false;
  }

  if (typeof timing.frequency !== 'number' || timing.frequency <= 0) {
    return false;
  }

  if (typeof timing.period !== 'number' || timing.period <= 0) {
    return false;
  }

  if (typeof timing.periodUnit !== 'string' || timing.periodUnit.length === 0) {
    return false;
  }

  if (timing.when !== undefined && 
      (!Array.isArray(timing.when) || !timing.when.every((w: any) => typeof w === 'string'))) {
    return false;
  }

  if (timing.duration !== undefined) {
    if (typeof timing.duration.value !== 'number' || timing.duration.value <= 0 ||
        typeof timing.duration.unit !== 'string' || timing.duration.unit.length === 0) {
      return false;
    }
  }

  return true;
}