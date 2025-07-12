/**
 * Core Functional Programming Utilities
 * 
 * Provides fundamental functional programming constructs including
 * Result types for error handling, predicate combinators, and
 * function composition utilities.
 * 
 * @since 2.0.0
 */

/**
 * Result type for representing success or failure
 * Enables error handling without exceptions
 */
export type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Creates a successful Result
 */
export const ok = <T>(value: T): Result<T, never> => 
  ({ ok: true, value });

/**
 * Creates an error Result
 */
export const err = <E>(error: E): Result<never, E> => 
  ({ ok: false, error });

/**
 * Type guard for successful Results
 */
export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } => 
  result.ok === true;

/**
 * Type guard for error Results
 */
export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } => 
  result.ok === false;

/**
 * Maps a function over a successful Result
 */
export const map = <T, U, E>(
  result: Result<T, E>, 
  fn: (value: T) => U
): Result<U, E> => {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
};

/**
 * Chains Result-returning functions
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
};

/**
 * Maps a function over an error Result
 */
export const mapErr = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
};

/**
 * Type-safe predicate function
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Combines predicates with AND logic
 */
export const and = <T>(...predicates: Predicate<T>[]): Predicate<T> =>
  (value: T) => predicates.every(p => p(value));

/**
 * Combines predicates with OR logic
 */
export const or = <T>(...predicates: Predicate<T>[]): Predicate<T> =>
  (value: T) => predicates.some(p => p(value));

/**
 * Negates a predicate
 */
export const not = <T>(predicate: Predicate<T>): Predicate<T> =>
  (value: T) => !predicate(value);

/**
 * Validator function type
 */
export type Validator<T, E = string> = (value: T) => Result<T, E>;

/**
 * Chains validators sequentially, short-circuiting on first error
 */
export const pipe = <T, E>(...validators: Validator<T, E>[]): Validator<T, E> =>
  (value: T) => {
    let result: Result<T, E> = ok(value);
    
    for (const validator of validators) {
      if (!result.ok) break;
      result = validator(result.value);
    }
    
    return result;
  };

/**
 * Generic transformer function
 */
export type Transformer<A, B> = (value: A) => B;

/**
 * Composes two functions left-to-right
 */
export const compose = <A, B, C>(
  f: Transformer<A, B>,
  g: Transformer<B, C>
): Transformer<A, C> =>
  (value: A) => g(f(value));

/**
 * Generic memoization wrapper for pure functions
 * 
 * @param fn - Function to memoize
 * @param keyFn - Optional custom key generator
 * @returns Memoized version of the function
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

/**
 * Safely extracts value from Result or throws
 * Use only at system boundaries
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isOk(result)) {
    return result.value;
  }
  throw new Error(`Unwrap called on error: ${JSON.stringify(result.error)}`);
};

/**
 * Provides default value for error Results
 */
export const withDefault = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
};

/**
 * Converts Result to nullable value
 */
export const toNullable = <T, E>(result: Result<T, E>): T | null => {
  if (isOk(result)) {
    return result.value;
  }
  return null;
};

/**
 * Creates Result from nullable value
 */
export const fromNullable = <T, E>(value: T | null | undefined, error: E): Result<T, E> => {
  if (value !== null && value !== undefined) {
    return ok(value);
  }
  return err(error);
};