/**
 * IComplexRegimenBuilder Interface
 * 
 * Extended interface for complex medication regimens including multi-ingredient,
 * PRN with ranges, and tapering schedules. Provides specialized methods for
 * sequential instructions, conditional logic, and complex relationships.
 * 
 * @since 3.2.0
 */

import { ISignatureBuilder, DoseInput, TimingInput } from './ISignatureBuilder';
import { SignatureInstruction } from '../../types/SignatureInstruction';
import type { InstructionRelationship } from '../../types/SignatureInstruction';

// Re-export types needed by other modules
export type { InstructionRelationship };

/**
 * Input structure for dose ranges (e.g., 1-2 tablets)
 */
export interface DoseRangeInput {
  /** Minimum dose value */
  minValue: number;
  /** Maximum dose value */
  maxValue: number;
  /** Unit of measurement */
  unit: string;
}

/**
 * Input structure for frequency ranges (e.g., every 4-6 hours)
 */
export interface FrequencyRangeInput {
  /** Minimum frequency per period */
  minFrequency: number;
  /** Maximum frequency per period */
  maxFrequency: number;
  /** Period value */
  period: number;
  /** Period unit */
  periodUnit: string;
  /** Minimum interval between doses (in hours) */
  minInterval?: number;
}

/**
 * Phase configuration for tapering schedules
 */
export interface TaperingPhase {
  /** Phase identifier (e.g., "Week 1-4", "Phase 1") */
  name: string;
  /** Dose for this phase */
  dose: DoseInput;
  /** Timing for this phase */
  timing: TimingInput;
  /** Duration of this phase */
  duration: {
    value: number;
    unit: string;
  };
  /** Special instructions for this phase */
  specialInstructions?: string[];
  /** Transition notes to next phase */
  transitionNote?: string;
}

/**
 * Conditional instruction configuration
 */
export interface ConditionalInstruction {
  /** Condition that must be met */
  condition: string;
  /** Instructions to execute if condition is true */
  ifTrue: SignatureInstruction[];
  /** Instructions to execute if condition is false */
  ifFalse?: SignatureInstruction[];
  /** Timeout for condition evaluation */
  evaluationTimeout?: {
    value: number;
    unit: string;
  };
}

/**
 * Maximum daily dose constraint for PRN medications
 */
export interface MaxDailyDoseConstraint {
  /** Maximum dose per day */
  maxDosePerDay: {
    value: number;
    unit: string;
  };
  /** Maximum number of administrations per day */
  maxAdministrationsPerDay?: number;
  /** Warning message for approaching limit */
  warningMessage?: string;
  /** Error message for exceeding limit */
  errorMessage?: string;
}

/**
 * Multi-ingredient dosing configuration
 */
export interface MultiIngredientDoseInput {
  /** Total dose (e.g., 5 mL) */
  totalDose: DoseInput;
  /** Individual ingredient breakdowns */
  ingredientBreakdown?: Array<{
    ingredientName: string;
    amount: number;
    unit: string;
    percentage?: number;
  }>;
  /** Display preference for ingredient information */
  displayBreakdown: boolean;
}

/**
 * Complex regimen builder interface extending base signature builder
 */
export interface IComplexRegimenBuilder extends ISignatureBuilder {
  /**
   * Build sequential instructions for tapering schedules
   * 
   * @param phases - Array of tapering phases
   * @returns Builder instance for chaining
   */
  buildSequentialInstructions(phases: TaperingPhase[]): IComplexRegimenBuilder;

  /**
   * Build conditional logic for complex scenarios
   * 
   * @param conditional - Conditional instruction configuration
   * @returns Builder instance for chaining
   */
  buildConditionalLogic(conditional: ConditionalInstruction): IComplexRegimenBuilder;

  /**
   * Build relationships between instructions
   * 
   * @param relationships - Array of instruction relationships
   * @returns Builder instance for chaining
   */
  buildRelationships(relationships: InstructionRelationship[]): IComplexRegimenBuilder;

  /**
   * Build dose ranges for PRN medications (e.g., 1-2 tablets)
   * 
   * @param doseRange - Dose range configuration
   * @returns Builder instance for chaining
   */
  buildDoseRange(doseRange: DoseRangeInput): IComplexRegimenBuilder;

  /**
   * Build frequency ranges for PRN medications (e.g., every 4-6 hours)
   * 
   * @param frequencyRange - Frequency range configuration
   * @returns Builder instance for chaining
   */
  buildFrequencyRange(frequencyRange: FrequencyRangeInput): IComplexRegimenBuilder;

  /**
   * Build maximum daily dose constraints
   * 
   * @param constraint - Maximum daily dose constraint
   * @returns Builder instance for chaining
   */
  buildMaxDailyDoseConstraint(constraint: MaxDailyDoseConstraint): IComplexRegimenBuilder;

  /**
   * Build multi-ingredient dosing with breakdown display
   * 
   * @param multiIngredientDose - Multi-ingredient dose configuration
   * @returns Builder instance for chaining
   */
  buildMultiIngredientDose(multiIngredientDose: MultiIngredientDoseInput): IComplexRegimenBuilder;

  /**
   * Generate complex regimen results with relationships
   * 
   * @returns Array of related SignatureInstructions with sequence and relationships
   */
  getComplexResult(): SignatureInstruction[];

  /**
   * Validate complex regimen constraints
   * 
   * @returns Array of validation errors, empty if valid
   */
  validateComplexRegimen(): string[];

  /**
   * Get detailed explanation of complex regimen logic
   * 
   * @returns Detailed audit trail including relationships and conditional logic
   */
  explainComplexRegimen(): string;
}

/**
 * Builder state extension for complex regimens
 */
export interface ComplexRegimenBuilderState {
  /** Sequential instruction phases */
  phases: TaperingPhase[];
  /** Conditional instructions */
  conditionals: ConditionalInstruction[];
  /** Instruction relationships */
  relationships: InstructionRelationship[];
  /** Dose ranges for PRN */
  doseRanges: DoseRangeInput[];
  /** Frequency ranges for PRN */
  frequencyRanges: FrequencyRangeInput[];
  /** Maximum daily dose constraints */
  maxDailyConstraints: MaxDailyDoseConstraint[];
  /** Multi-ingredient dose configurations */
  multiIngredientDoses: MultiIngredientDoseInput[];
  /** Complex regimen audit trail */
  complexAuditTrail: string[];
}

/**
 * Validation functions for complex regimen inputs
 */

/**
 * Validates dose range input
 * 
 * @param doseRange - Dose range to validate
 * @returns True if valid, false otherwise
 */
export function isValidDoseRangeInput(doseRange: unknown): doseRange is DoseRangeInput {
  if (!doseRange || typeof doseRange !== 'object') {
    return false;
  }

  const obj = doseRange as Record<string, unknown>;

  if (typeof obj.minValue !== 'number' || obj.minValue <= 0) {
    return false;
  }

  if (typeof obj.maxValue !== 'number' || obj.maxValue < obj.minValue) {
    return false;
  }

  if (typeof obj.unit !== 'string' || obj.unit.length === 0) {
    return false;
  }

  return true;
}

/**
 * Validates frequency range input
 * 
 * @param frequencyRange - Frequency range to validate
 * @returns True if valid, false otherwise
 */
export function isValidFrequencyRangeInput(frequencyRange: unknown): frequencyRange is FrequencyRangeInput {
  if (!frequencyRange || typeof frequencyRange !== 'object') {
    return false;
  }

  const obj = frequencyRange as Record<string, unknown>;

  if (typeof obj.minFrequency !== 'number' || obj.minFrequency <= 0) {
    return false;
  }

  if (typeof obj.maxFrequency !== 'number' || obj.maxFrequency < obj.minFrequency) {
    return false;
  }

  if (typeof obj.period !== 'number' || obj.period <= 0) {
    return false;
  }

  if (typeof obj.periodUnit !== 'string' || obj.periodUnit.length === 0) {
    return false;
  }

  if (obj.minInterval !== undefined && 
      (typeof obj.minInterval !== 'number' || obj.minInterval <= 0)) {
    return false;
  }

  return true;
}

/**
 * Validates tapering phase input
 * 
 * @param phase - Tapering phase to validate
 * @returns True if valid, false otherwise
 */
export function isValidTaperingPhase(phase: unknown): phase is TaperingPhase {
  if (!phase || typeof phase !== 'object') {
    return false;
  }

  const obj = phase as Record<string, unknown>;

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    return false;
  }

  if (!obj.dose || typeof obj.dose !== 'object') {
    return false;
  }

  if (!obj.timing || typeof obj.timing !== 'object') {
    return false;
  }

  if (!obj.duration || typeof obj.duration !== 'object') {
    return false;
  }

  const duration = obj.duration as Record<string, unknown>;
  if (typeof duration.value !== 'number' || 
      duration.value <= 0 ||
      typeof duration.unit !== 'string' || 
      duration.unit.length === 0) {
    return false;
  }

  if (obj.specialInstructions !== undefined && 
      (!Array.isArray(obj.specialInstructions) || 
       !obj.specialInstructions.every((inst: unknown) => typeof inst === 'string'))) {
    return false;
  }

  return true;
}