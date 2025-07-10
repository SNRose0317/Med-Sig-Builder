/**
 * Strategy Pattern Type Definitions
 * 
 * Defines the contracts for the Specificity-Based Dispatcher system
 * that replaces cascading if/else logic with composable strategies.
 * This enables clean separation of concerns and eliminates complex
 * conditional chains in medication signature generation.
 * 
 * @since 2.0.0
 */

import { MedicationRequestContext } from '../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../types/SignatureInstruction';

/**
 * Specificity levels for strategy matching
 * 
 * Higher values indicate more specific matching criteria.
 * The dispatcher will select the highest specificity match.
 */
export enum SpecificityLevel {
  /** Matches specific SKU (most specific) */
  MEDICATION_SKU = 4,
  /** Matches specific medication ID */
  MEDICATION_ID = 3,
  /** Matches dose form + ingredient combination */
  DOSE_FORM_AND_INGREDIENT = 2,
  /** Matches dose form only */
  DOSE_FORM = 1,
  /** Default fallback (least specific) */
  DEFAULT = 0
}

/**
 * Base strategy interface for building signature instructions
 * 
 * Base strategies provide the core signature generation logic
 * for specific medication types or patterns. The dispatcher
 * selects a single base strategy based on specificity.
 */
export interface IBaseStrategy {
  /**
   * Specificity level of this strategy
   * Used by dispatcher to select most specific match
   */
  readonly specificity: SpecificityLevel;

  /**
   * Determines if this strategy matches the given context
   * 
   * @param context - Request context to evaluate
   * @returns True if this strategy should handle the request
   */
  matches(context: MedicationRequestContext): boolean;

  /**
   * Builds the core signature instruction
   * 
   * @param context - Request context with medication and dosing info
   * @returns FHIR-compliant signature instruction
   */
  buildInstruction(context: MedicationRequestContext): SignatureInstruction;

  /**
   * Explains the strategy's behavior and decisions
   * 
   * @returns Human-readable explanation
   */
  explain(): string;
}

/**
 * Modifier strategy interface for enhancing instructions
 * 
 * Modifiers adjust or enhance the base instruction based on
 * specific conditions. Multiple modifiers can be applied in
 * priority order to compose the final instruction.
 */
export interface IModifierStrategy {
  /**
   * Execution priority (lower number = higher priority)
   * Modifiers are applied in ascending priority order
   */
  readonly priority: number;

  /**
   * Determines if this modifier should be applied
   * 
   * @param context - Request context to evaluate
   * @returns True if modifier should be applied
   */
  appliesTo(context: MedicationRequestContext): boolean;

  /**
   * Modifies the instruction based on specific rules
   * 
   * @param instruction - Current instruction to modify
   * @param context - Request context for additional info
   * @returns Modified instruction
   */
  modify(
    instruction: SignatureInstruction, 
    context: MedicationRequestContext
  ): SignatureInstruction;

  /**
   * Explains the modifier's behavior and impact
   * 
   * @returns Human-readable explanation
   */
  explain(): string;
}

/**
 * Represents a complete strategy composition
 * 
 * The dispatcher builds this composition by selecting
 * a base strategy and collecting applicable modifiers.
 */
export interface StrategyComposition {
  /** Selected base strategy */
  base: IBaseStrategy;
  /** Applicable modifiers in priority order */
  modifiers: IModifierStrategy[];
}

/**
 * Comparator function for sorting strategies by specificity
 * 
 * @param a - First strategy
 * @param b - Second strategy
 * @returns Negative if a is more specific, positive if b is more specific
 */
export function compareSpecificity(a: IBaseStrategy, b: IBaseStrategy): number {
  return b.specificity - a.specificity;
}

/**
 * Sorts modifiers by priority (ascending)
 * 
 * @param modifiers - Array of modifiers to sort
 * @returns New array sorted by priority
 */
export function sortModifiersByPriority(modifiers: IModifierStrategy[]): IModifierStrategy[] {
  return [...modifiers].sort((a, b) => a.priority - b.priority);
}

/**
 * Type guard for StrategyComposition
 * 
 * @param obj - Object to validate
 * @returns True if valid composition
 */
export function isValidStrategyComposition(obj: any): obj is StrategyComposition {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  if (!obj.base || typeof obj.base.matches !== 'function' || 
      typeof obj.base.buildInstruction !== 'function') {
    return false;
  }

  if (!Array.isArray(obj.modifiers)) {
    return false;
  }

  return obj.modifiers.every((mod: any) => 
    mod && 
    typeof mod.appliesTo === 'function' && 
    typeof mod.modify === 'function' &&
    typeof mod.priority === 'number'
  );
}

/**
 * Strategy metadata for registration and introspection
 */
export interface StrategyMetadata {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this strategy handles */
  description: string;
  /** Examples of medications this handles */
  examples?: string[];
  /** Version for compatibility tracking */
  version: string;
}

/**
 * Extended base strategy with metadata
 */
export interface IBaseStrategyWithMetadata extends IBaseStrategy {
  readonly metadata: StrategyMetadata;
}

/**
 * Extended modifier strategy with metadata
 */
export interface IModifierStrategyWithMetadata extends IModifierStrategy {
  readonly metadata: StrategyMetadata;
}