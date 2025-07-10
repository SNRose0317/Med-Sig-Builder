import {
  Result,
  ok,
  err,
  isOk,
  isErr,
  map,
  flatMap,
  mapErr,
  Predicate,
  and,
  or,
  not,
  pipe,
  compose,
  memoize
} from '../core';

describe('Result Type', () => {
  describe('constructors', () => {
    it('should create success results', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      expect((result as any).value).toBe(42);
    });

    it('should create error results', () => {
      const result = err('Something went wrong');
      expect(result.ok).toBe(false);
      expect((result as any).error).toBe('Something went wrong');
    });
  });

  describe('type guards', () => {
    it('should identify success results', () => {
      const result = ok('success');
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('should identify error results', () => {
      const result = err('error');
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('map', () => {
    it('should transform success values', () => {
      const result = ok(5);
      const mapped = map(result, (x) => x * 2);
      
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should pass through errors', () => {
      const result = err<number, string>('error');
      const mapped = map(result, (x: number) => x * 2);
      
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe('error');
      }
    });
  });

  describe('flatMap', () => {
    it('should chain successful operations', () => {
      const divide = (a: number, b: number): Result<number, string> =>
        b === 0 ? err('Division by zero') : ok(a / b);

      const result = flatMap(ok(10), (x) => divide(x, 2));
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(5);
      }
    });

    it('should short-circuit on error', () => {
      const divide = (a: number, b: number): Result<number, string> =>
        b === 0 ? err('Division by zero') : ok(a / b);

      const result = flatMap(ok(10), (x) => divide(x, 0));
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('Division by zero');
      }
    });
  });

  describe('mapErr', () => {
    it('should transform error values', () => {
      const result = err('simple error');
      const mapped = mapErr(result, (e) => ({ code: 'ERR001', message: e }));
      
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toEqual({ code: 'ERR001', message: 'simple error' });
      }
    });

    it('should pass through success values', () => {
      const result = ok(42);
      const mapped = mapErr(result, (e) => ({ code: 'ERR001', message: e }));
      
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });
  });
});

describe('Predicate Combinators', () => {
  const isEven: Predicate<number> = (n) => n % 2 === 0;
  const isPositive: Predicate<number> = (n) => n > 0;
  const isLarge: Predicate<number> = (n) => n > 100;

  describe('and', () => {
    it('should require all predicates to be true', () => {
      const isEvenAndPositive = and(isEven, isPositive);
      
      expect(isEvenAndPositive(4)).toBe(true);
      expect(isEvenAndPositive(-4)).toBe(false);
      expect(isEvenAndPositive(3)).toBe(false);
    });

    it('should handle multiple predicates', () => {
      const isEvenPositiveLarge = and(isEven, isPositive, isLarge);
      
      expect(isEvenPositiveLarge(200)).toBe(true);
      expect(isEvenPositiveLarge(50)).toBe(false);
    });

    it('should handle empty predicates', () => {
      const alwaysTrue = and<number>();
      expect(alwaysTrue(42)).toBe(true);
    });
  });

  describe('or', () => {
    it('should require at least one predicate to be true', () => {
      const isEvenOrLarge = or(isEven, isLarge);
      
      expect(isEvenOrLarge(4)).toBe(true);
      expect(isEvenOrLarge(101)).toBe(true);
      expect(isEvenOrLarge(3)).toBe(false);
    });

    it('should handle empty predicates', () => {
      const alwaysFalse = or<number>();
      expect(alwaysFalse(42)).toBe(false);
    });
  });

  describe('not', () => {
    it('should negate predicate', () => {
      const isOdd = not(isEven);
      
      expect(isOdd(3)).toBe(true);
      expect(isOdd(4)).toBe(false);
    });

    it('should handle double negation', () => {
      const isEvenAgain = not(not(isEven));
      
      expect(isEvenAgain(4)).toBe(true);
      expect(isEvenAgain(3)).toBe(false);
    });
  });
});

describe('Function Composition', () => {
  describe('pipe', () => {
    it('should chain validators left to right', () => {
      const validatePositive = (n: number): Result<number, string> =>
        n > 0 ? ok(n) : err('Must be positive');
      
      const validateEven = (n: number): Result<number, string> =>
        n % 2 === 0 ? ok(n) : err('Must be even');
      
      const validateLarge = (n: number): Result<number, string> =>
        n > 100 ? ok(n) : err('Must be greater than 100');

      const validator = pipe(validatePositive, validateEven, validateLarge);

      expect(isOk(validator(200))).toBe(true);
      expect(isErr(validator(-1))).toBe(true);
      expect(isErr(validator(3))).toBe(true);
      expect(isErr(validator(50))).toBe(true);
    });

    it('should short-circuit on first error', () => {
      let secondCalled = false;
      
      const failFirst = (_: number): Result<number, string> => err('First failed');
      const checkSecond = (n: number): Result<number, string> => {
        secondCalled = true;
        return ok(n);
      };

      const validator = pipe(failFirst, checkSecond);
      const result = validator(42);

      expect(isErr(result)).toBe(true);
      expect(secondCalled).toBe(false);
    });
  });

  describe('compose', () => {
    it('should compose functions left to right', () => {
      const double = (x: number) => x * 2;
      const addOne = (x: number) => x + 1;
      const square = (x: number) => x * x;

      const transform = compose(compose(double, addOne), square);
      
      // (5 * 2 + 1)² = 11² = 121
      expect(transform(5)).toBe(121);
    });

    it('should preserve types', () => {
      const toString = (n: number): string => n.toString();
      const getLength = (s: string): number => s.length;
      
      const countDigits = compose(toString, getLength);
      
      expect(countDigits(12345)).toBe(5);
      expect(countDigits(42)).toBe(2);
    });
  });
});

describe('Memoization', () => {
  it('should cache function results', () => {
    let callCount = 0;
    const expensive = (n: number) => {
      callCount++;
      return n * n;
    };

    const memoized = memoize(expensive);

    expect(memoized(5)).toBe(25);
    expect(memoized(5)).toBe(25);
    expect(memoized(5)).toBe(25);
    expect(callCount).toBe(1);

    expect(memoized(6)).toBe(36);
    expect(callCount).toBe(2);
  });

  it('should use custom key function', () => {
    let callCount = 0;
    const add = (a: number, b: number) => {
      callCount++;
      return a + b;
    };

    // Only cache based on first argument
    const memoized = memoize(add, (a, _) => a.toString());

    expect(memoized(5, 3)).toBe(8);
    expect(memoized(5, 4)).toBe(8); // Returns cached result!
    expect(callCount).toBe(1);
  });

  it('should handle complex arguments', () => {
    interface Point { x: number; y: number; }
    let callCount = 0;
    
    const distance = (p1: Point, p2: Point) => {
      callCount++;
      return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    };

    const memoized = memoize(distance);

    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };

    expect(memoized(p1, p2)).toBe(5);
    expect(memoized(p1, p2)).toBe(5);
    expect(callCount).toBe(1);
  });
});