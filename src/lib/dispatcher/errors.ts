/**
 * Custom Error Classes for Strategy Dispatcher
 * 
 * Provides specific error types for different failure scenarios
 * in the strategy selection and composition process.
 * 
 * @since 3.0.0
 */

import { MedicationRequestContext } from '../../types/MedicationRequestContext';
import { SpecificityLevel } from '../strategies/types';

/**
 * Thrown when multiple strategies at the same specificity level
 * match the given context, making selection ambiguous.
 */
export class AmbiguousStrategyError extends Error {
  public readonly strategies: string[];
  public readonly specificity: SpecificityLevel;
  public readonly context: MedicationRequestContext;

  constructor(
    message: string,
    strategies: string[],
    specificity: SpecificityLevel,
    context: MedicationRequestContext
  ) {
    super(message);
    this.name = 'AmbiguousStrategyError';
    this.strategies = strategies;
    this.specificity = specificity;
    this.context = context;
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AmbiguousStrategyError);
    }
  }

  /**
   * Creates a detailed error message for ambiguous matches
   */
  static create(
    strategies: Array<{ name: string; specificity: SpecificityLevel }>,
    context: MedicationRequestContext
  ): AmbiguousStrategyError {
    const strategyNames = strategies.map(s => s.name);
    const specificity = strategies[0].specificity;
    
    const message = 
      `Multiple strategies at specificity level ${specificity} (${SpecificityLevel[specificity]}): ` +
      `[${strategyNames.join(', ')}]. ` +
      `Context: medication=${context.medication?.name || 'unknown'}, ` +
      `doseForm=${context.medication?.doseForm || 'unknown'}`;
    
    return new AmbiguousStrategyError(message, strategyNames, specificity, context);
  }
}

/**
 * Thrown when no strategy matches the given context.
 */
export class NoMatchingStrategyError extends Error {
  public readonly context: MedicationRequestContext;
  public readonly availableStrategies: string[];

  constructor(
    message: string,
    context: MedicationRequestContext,
    availableStrategies: string[] = []
  ) {
    super(message);
    this.name = 'NoMatchingStrategyError';
    this.context = context;
    this.availableStrategies = availableStrategies;
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoMatchingStrategyError);
    }
  }

  /**
   * Creates a detailed error message for no matching strategy
   */
  static create(
    context: MedicationRequestContext,
    availableStrategies: string[] = []
  ): NoMatchingStrategyError {
    const contextInfo = {
      medication: context.medication?.name || 'unknown',
      doseForm: context.medication?.doseForm || 'unknown',
      route: context.route || 'unknown',
      hasIngredients: !!context.medication?.ingredient?.length
    };
    
    const message = 
      `No strategy matches the given context. ` +
      `Context: ${JSON.stringify(contextInfo, null, 2)}. ` +
      `Available strategies: [${availableStrategies.join(', ')}]`;
    
    return new NoMatchingStrategyError(message, context, availableStrategies);
  }
}

/**
 * Thrown when attempting to register a strategy with a name that already exists.
 */
export class DuplicateStrategyError extends Error {
  public readonly strategyName: string;
  public readonly strategyType: 'base' | 'modifier';

  constructor(strategyName: string, strategyType: 'base' | 'modifier') {
    const message = `${strategyType} strategy '${strategyName}' is already registered`;
    super(message);
    this.name = 'DuplicateStrategyError';
    this.strategyName = strategyName;
    this.strategyType = strategyType;
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicateStrategyError);
    }
  }
}

/**
 * Thrown when modifier priorities conflict.
 */
export class PriorityConflictError extends Error {
  public readonly conflictingModifiers: Array<{ name: string; priority: number }>;

  constructor(conflictingModifiers: Array<{ name: string; priority: number }>) {
    const conflicts = conflictingModifiers
      .map(m => `${m.name} (priority: ${m.priority})`)
      .join(', ');
    
    const message = `Modifier priority conflict detected. ` +
      `Multiple modifiers share the same priority: [${conflicts}]`;
    
    super(message);
    this.name = 'PriorityConflictError';
    this.conflictingModifiers = conflictingModifiers;
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PriorityConflictError);
    }
  }
}

/**
 * Type guard for AmbiguousStrategyError
 */
export function isAmbiguousStrategyError(error: unknown): error is AmbiguousStrategyError {
  return error instanceof AmbiguousStrategyError;
}

/**
 * Type guard for NoMatchingStrategyError
 */
export function isNoMatchingStrategyError(error: unknown): error is NoMatchingStrategyError {
  return error instanceof NoMatchingStrategyError;
}

/**
 * Type guard for DuplicateStrategyError
 */
export function isDuplicateStrategyError(error: unknown): error is DuplicateStrategyError {
  return error instanceof DuplicateStrategyError;
}

/**
 * Type guard for PriorityConflictError
 */
export function isPriorityConflictError(error: unknown): error is PriorityConflictError {
  return error instanceof PriorityConflictError;
}