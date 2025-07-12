# Functional Architecture

## Overview

This document defines the functional programming patterns and data flow boundaries used in the medication signature builder refactoring. These patterns complement the object-oriented architecture to create a hybrid approach that maximizes code clarity, testability, and maintainability.

## Core Principles

1. **Immutability**: All data structures are immutable after creation
2. **Pure Functions**: Core logic implemented as side-effect-free functions
3. **Composition**: Complex behavior built from simple, composable functions
4. **Type Safety**: Comprehensive type definitions with compile-time guarantees
5. **Error as Data**: Errors represented as values, not exceptions

## Data Flow Architecture

```
┌─────────────────────────┐
│ MedicationRequestContext│ (Immutable Input)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Validation Layer      │ (Pure Functions)
│  - validateContext()    │
│  - validateDose()       │
│  - validateTiming()     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Transformation Layer   │ (Pure Functions)
│  - normalizeUnits()     │
│  - calculateDose()      │
│  - expandFrequency()    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Strategy Dispatcher   │ (Functional Composition)
│  - selectStrategy()     │
│  - composeModifiers()   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ SignatureInstruction[]  │ (Immutable Output)
└─────────────────────────┘
```

## Type Definitions

### Result Type for Error Handling

```typescript
/**
 * Represents either a successful value or an error
 * Enables error handling without exceptions
 */
export type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// Helper functions
export const ok = <T>(value: T): Result<T, never> => 
  ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => 
  ({ ok: false, error });

// Usage example
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero');
  }
  return ok(a / b);
}
```

### Predicate System

```typescript
/**
 * Type-safe predicate for filtering and matching
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Predicate combinators for composition
 */
export const and = <T>(...predicates: Predicate<T>[]): Predicate<T> =>
  (value: T) => predicates.every(p => p(value));

export const or = <T>(...predicates: Predicate<T>[]): Predicate<T> =>
  (value: T) => predicates.some(p => p(value));

export const not = <T>(predicate: Predicate<T>): Predicate<T> =>
  (value: T) => !predicate(value);

// Usage example
const isTablet: Predicate<MedicationProfile> = 
  (med) => med.doseForm === 'Tablet';

const isScored: Predicate<MedicationProfile> = 
  (med) => med.isScored !== undefined && med.isScored !== ScoringType.NONE;

const isScoredTablet = and(isTablet, isScored);
```

### Function Types

```typescript
/**
 * Core transformation functions
 */
export type DoseCalculator = (
  medication: MedicationProfile,
  requestedDose: DoseInput
) => Result<Dose, DoseError>;

export type FrequencyExpander = (
  frequency: string
) => Result<TimingInput, FrequencyError>;

export type RouteValidator = (
  route: string,
  medication: MedicationProfile
) => Result<string, RouteError>;

/**
 * Strategy selection predicate
 */
export type StrategyMatcher = (
  context: MedicationRequestContext
) => Predicate<IBaseStrategy>;

/**
 * Instruction transformer
 */
export type InstructionTransformer = (
  instruction: SignatureInstruction
) => SignatureInstruction;
```

## Error Handling

### Error Response DTO

```typescript
/**
 * Structured error response for API consistency
 */
export interface ErrorResponse {
  /** Unique error code for client handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error context */
  details?: Record<string, unknown>;
  /** ISO timestamp of error occurrence */
  timestamp: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Suggested actions for recovery */
  suggestions?: string[];
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  CONFIGURATION = 'CONFIGURATION',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  INTERNAL = 'INTERNAL'
}

/**
 * Domain-specific error types
 */
export interface DoseError {
  category: ErrorCategory.VALIDATION;
  field: 'dose';
  reason: 'negative_value' | 'exceeds_maximum' | 'invalid_unit';
  attempted: DoseInput;
  constraints?: DoseConstraints;
}

export interface FrequencyError {
  category: ErrorCategory.VALIDATION;
  field: 'frequency';
  reason: 'unrecognized_pattern' | 'ambiguous' | 'invalid_interval';
  input: string;
  suggestions?: string[];
}

export interface RouteError {
  category: ErrorCategory.BUSINESS_LOGIC;
  field: 'route';
  reason: 'incompatible_dose_form' | 'not_allowed' | 'requires_device';
  route: string;
  doseForm: string;
  allowedRoutes?: string[];
}
```

## Functional Patterns

### Validation Pipeline

```typescript
/**
 * Composable validation functions
 */
export type Validator<T> = (value: T) => Result<T, ErrorResponse>;

/**
 * Chains validators sequentially, short-circuiting on first error
 */
export const pipe = <T>(...validators: Validator<T>[]): Validator<T> =>
  (value: T) => {
    let result: Result<T, ErrorResponse> = ok(value);
    
    for (const validator of validators) {
      if (!result.ok) break;
      result = validator(result.value);
    }
    
    return result;
  };

// Usage
const validateRequest = pipe(
  validateContext,
  validateDose,
  validateTiming,
  validateRoute
);
```

### Transformation Composition

```typescript
/**
 * Composable transformation functions
 */
export type Transformer<A, B> = (value: A) => B;

/**
 * Composes transformers left-to-right
 */
export const compose = <A, B, C>(
  f: Transformer<A, B>,
  g: Transformer<B, C>
): Transformer<A, C> =>
  (value: A) => g(f(value));

// Usage
const processInstruction = compose(
  normalizeText,
  addDefaultTimings,
  applySpecialInstructions
);
```

### Memoization for Performance

```typescript
/**
 * Generic memoization wrapper for pure functions
 */
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  keyFn?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Usage
const calculateDoseMemoized = memoize(calculateDose);
```

## Integration with OOP Components

### Builder Integration

```typescript
// Functional validators used within builders
class TabletBuilder implements ISignatureBuilder {
  buildDose(dose: DoseInput): ISignatureBuilder {
    const validation = validateDose(dose, this.medication);
    
    if (!validation.ok) {
      throw new Error(validation.error.message);
    }
    
    this.dose = validation.value;
    return this;
  }
}
```

### Strategy Integration

```typescript
// Functional predicates for strategy matching
class TabletStrategy implements IBaseStrategy {
  matches(context: MedicationRequestContext): boolean {
    return and(
      isTablet,
      hasValidDose,
      hasOralRoute
    )(context.medication);
  }
}
```

## Performance Considerations

1. **Immutability Cost**: Use structural sharing libraries (e.g., Immer) for complex updates
2. **Function Creation**: Avoid creating functions in hot paths
3. **Memoization**: Apply to expensive pure functions with limited input space
4. **Lazy Evaluation**: Use generators for large data transformations

## Testing Patterns

### Property-Based Testing

```typescript
import * as fc from 'fast-check';

// Property: dose calculation is always positive
fc.assert(
  fc.property(
    fc.record({
      value: fc.float({ min: 0.1, max: 1000 }),
      unit: fc.constantFrom('mg', 'g', 'mcg')
    }),
    (dose) => {
      const result = calculateDose(mockMedication, dose);
      return result.ok && result.value.value > 0;
    }
  )
);
```

### Snapshot Testing for Transformations

```typescript
describe('instruction transformation', () => {
  it('should produce consistent output', () => {
    const input = createMockContext();
    const output = transformToInstruction(input);
    expect(output).toMatchSnapshot();
  });
});
```

## Migration Strategy

### Gradual Adoption

1. Start with leaf functions (validators, calculators)
2. Move to transformation functions
3. Finally, refactor core business logic
4. Keep OOP shells for framework integration

### Interoperability

```typescript
// Adapter for legacy code
export function adaptLegacyValidator(
  legacyFn: (value: any) => boolean | string
): Validator<any> {
  return (value) => {
    const result = legacyFn(value);
    
    if (result === true) {
      return ok(value);
    }
    
    return err({
      code: 'LEGACY_VALIDATION_ERROR',
      message: typeof result === 'string' ? result : 'Validation failed',
      timestamp: new Date().toISOString()
    });
  };
}
```

## Benefits

1. **Testability**: Pure functions are trivial to test
2. **Composability**: Build complex behavior from simple parts
3. **Type Safety**: Errors are part of the type system
4. **Performance**: Memoization and lazy evaluation opportunities
5. **Debugging**: Immutable data makes state tracking easier

## Next Steps

1. Implement core functional utilities in `src/lib/functional/`
2. Create comprehensive test suite for functional patterns
3. Refactor existing validators to use Result type
4. Build transformation pipeline for signature generation
5. Document best practices for team adoption