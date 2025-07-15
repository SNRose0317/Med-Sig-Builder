/**
 * Common types for UCUM library evaluation
 */

export interface ConversionResult {
  success: boolean;
  value?: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  suggestions?: string[];
}

export interface UnitConverter {
  name: string;
  convert(value: number, from: string, to: string): ConversionResult;
  validate(unit: string): ValidationResult;
  getCommensurableUnits?(unit: string): string[];
}

export interface TestCase {
  name: string;
  value: number;
  from: string;
  to: string;
  expected: number;
  tolerance?: number;
}

export interface BenchmarkResult {
  libraryName: string;
  testCase: string;
  success: boolean;
  executionTime: number;
  memoryUsed?: number;
  error?: string;
}

export interface LibraryEvaluation {
  name: string;
  bundleSize: {
    raw: number;
    dependencies: number;
    total: number;
  };
  performance: {
    avgConversionTime: number;
    coldStartTime: number;
    memoryBaseline: number;
    memoryPeak: number;
  };
  accuracy: {
    passedTests: number;
    failedTests: number;
    roundTripError: number;
    failedTestNames: string[];
  };
  features: {
    ucumCompliant: boolean;
    customUnits: boolean;
    unitValidation: boolean;
    suggestions: boolean;
    commensurableUnits: boolean;
    errorMessages: 'excellent' | 'good' | 'poor';
  };
  developerExperience: {
    typeSupport: 'native' | 'definitions' | 'none';
    documentation: 'comprehensive' | 'adequate' | 'lacking';
    apiDesign: 'excellent' | 'good' | 'poor';
    setupComplexity: 'simple' | 'moderate' | 'complex';
  };
}