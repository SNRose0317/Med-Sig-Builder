/**
 * Test cases for UCUM library evaluation
 */
import { TestCase } from './types';

export const basicConversionTests: TestCase[] = [
  // Mass conversions
  { name: 'mg to g', value: 1000, from: 'mg', to: 'g', expected: 1 },
  { name: 'g to mg', value: 1, from: 'g', to: 'mg', expected: 1000 },
  { name: 'kg to g', value: 1, from: 'kg', to: 'g', expected: 1000 },
  { name: 'mcg to mg', value: 1000, from: 'mcg', to: 'mg', expected: 1 },
  { name: 'ug to mg', value: 1000, from: 'ug', to: 'mg', expected: 1 },
  { name: 'ng to mcg', value: 1000, from: 'ng', to: 'mcg', expected: 1 },
  { name: 'pg to ng', value: 1000, from: 'pg', to: 'ng', expected: 1 },
  
  // Volume conversions
  { name: 'mL to L', value: 1000, from: 'mL', to: 'L', expected: 1 },
  { name: 'L to mL', value: 1, from: 'L', to: 'mL', expected: 1000 },
  { name: 'uL to mL', value: 1000, from: 'uL', to: 'mL', expected: 1 },
  { name: 'dL to mL', value: 1, from: 'dL', to: 'mL', expected: 100 },
  
  // Concentration conversions (complex)
  { name: 'mg/mL to g/L', value: 1, from: 'mg/mL', to: 'g/L', expected: 1 },
  { name: 'g/L to mg/mL', value: 1, from: 'g/L', to: 'mg/mL', expected: 1 },
];

export const edgeCaseTests: TestCase[] = [
  // Very large numbers
  { name: 'Large ng to g', value: 1e9, from: 'ng', to: 'g', expected: 1 },
  { name: 'Large pg to mg', value: 1e9, from: 'pg', to: 'mg', expected: 1 },
  
  // Very small numbers
  { name: 'Small g to ng', value: 0.000001, from: 'g', to: 'ng', expected: 1000 },
  { name: 'Small L to uL', value: 0.000001, from: 'L', to: 'uL', expected: 1 },
  
  // Scientific notation
  { name: 'Scientific g to mg', value: 1.5e-3, from: 'g', to: 'mg', expected: 1.5 },
  { name: 'Scientific mL to L', value: 2.5e3, from: 'mL', to: 'L', expected: 2.5 },
];

export const medicalSpecificTests: TestCase[] = [
  // International units (may not be supported by all libraries)
  { name: 'IU validation', value: 1000, from: '[iU]', to: '[iU]', expected: 1000 },
  
  // Drops (may not be supported by all libraries)
  { name: 'Drops validation', value: 20, from: '[drp]', to: '[drp]', expected: 20 },
  
  // Tablets/capsules (definitely not supported by most)
  { name: 'Tablet validation', value: 2, from: 'tablet', to: 'tablet', expected: 2 },
  { name: 'Capsule validation', value: 1, from: 'capsule', to: 'capsule', expected: 1 },
];

export const invalidConversionTests: TestCase[] = [
  // Incompatible units (should fail)
  { name: 'Mass to volume', value: 100, from: 'mg', to: 'mL', expected: -1 },
  { name: 'Volume to mass', value: 50, from: 'mL', to: 'g', expected: -1 },
];

export const allTestCases = [
  ...basicConversionTests,
  ...edgeCaseTests,
  ...medicalSpecificTests,
  ...invalidConversionTests
];