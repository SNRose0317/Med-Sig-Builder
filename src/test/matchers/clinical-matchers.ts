/**
 * Custom Jest Matchers for Clinical Comparison
 * 
 * Provides specialized matchers for comparing medication signatures and clinical outputs.
 * These matchers understand clinical equivalence rather than exact string matching.
 * 
 * @since 3.1.0
 */

import type { SignatureResult } from '../../types';

interface ClinicalComparisonResult {
  pass: boolean;
  message: () => string;
  actualReceived?: any;
  expectedReceived?: any;
}

interface DoseComparison {
  isEquivalent: boolean;
  actualDose: string;
  expectedDose: string;
  reason?: string;
}

interface SignatureComparison {
  isEquivalent: boolean;
  differences: string[];
  actualSignature: string;
  expectedSignature: string;
}

/**
 * Normalize dose text for clinical comparison
 */
function normalizeDoseText(doseText: string): string {
  return doseText
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '')
    .replace(/\./g, '')
    .trim();
}

/**
 * Extract dose amount and unit from signature text
 */
function extractDose(signatureText: string): { amount: number | null; unit: string | null } {
  // Match patterns like "1 tablet", "0.5 tablet", "5 mL", "250 mg"
  const doseMatch = signatureText.match(/(\d+(?:\.\d+)?(?:\/\d+)?)\s*(tablet|capsule|ml|milliliter|mg|mcg|g|click|application)/i);
  
  if (!doseMatch) {
    return { amount: null, unit: null };
  }

  let amount: number;
  const [, amountStr, unit] = doseMatch;
  
  // Handle fractions like "1/2", "1/4", "3/4"
  if (amountStr.includes('/')) {
    const [numerator, denominator] = amountStr.split('/').map(Number);
    amount = numerator / denominator;
  } else {
    amount = parseFloat(amountStr);
  }

  return { amount, unit: unit.toLowerCase() };
}

/**
 * Compare two doses for clinical equivalence
 */
function compareDoses(actual: string, expected: string): DoseComparison {
  const actualDose = extractDose(actual);
  const expectedDose = extractDose(expected);

  // If we can't extract doses, fall back to string comparison
  if (!actualDose.amount || !expectedDose.amount || !actualDose.unit || !expectedDose.unit) {
    const normalizedActual = normalizeDoseText(actual);
    const normalizedExpected = normalizeDoseText(expected);
    return {
      isEquivalent: normalizedActual === normalizedExpected,
      actualDose: actual,
      expectedDose: expected,
      reason: 'Could not parse dose amounts for numeric comparison'
    };
  }

  // Check if units are equivalent
  const unitEquivalents: Record<string, string[]> = {
    'tablet': ['tablet', 'tablets'],
    'capsule': ['capsule', 'capsules'], 
    'ml': ['ml', 'milliliter', 'milliliters'],
    'mg': ['mg', 'milligram', 'milligrams'],
    'mcg': ['mcg', 'microgram', 'micrograms'],
    'g': ['g', 'gram', 'grams'],
    'click': ['click', 'clicks'],
    'application': ['application', 'applications']
  };

  let unitsEquivalent = false;
  for (const [baseUnit, equivalents] of Object.entries(unitEquivalents)) {
    if (equivalents.includes(actualDose.unit) && equivalents.includes(expectedDose.unit)) {
      unitsEquivalent = true;
      break;
    }
  }

  if (!unitsEquivalent) {
    return {
      isEquivalent: false,
      actualDose: `${actualDose.amount} ${actualDose.unit}`,
      expectedDose: `${expectedDose.amount} ${expectedDose.unit}`,
      reason: 'Units are not equivalent'
    };
  }

  // Compare amounts with clinical tolerance (0.001 for precise measurements)
  const tolerance = 0.001;
  const amountsEqual = Math.abs(actualDose.amount - expectedDose.amount) <= tolerance;

  return {
    isEquivalent: amountsEqual,
    actualDose: `${actualDose.amount} ${actualDose.unit}`,
    expectedDose: `${expectedDose.amount} ${expectedDose.unit}`,
    reason: amountsEqual ? undefined : `Amounts differ by ${Math.abs(actualDose.amount - expectedDose.amount)}`
  };
}

/**
 * Compare medication signatures for clinical equivalence
 */
function compareSignatures(actual: string, expected: string): SignatureComparison {
  const differences: string[] = [];
  
  // Normalize both signatures
  const normalizedActual = normalizeDoseText(actual);
  const normalizedExpected = normalizeDoseText(expected);

  // If exactly equal after normalization, they're equivalent
  if (normalizedActual === normalizedExpected) {
    return {
      isEquivalent: true,
      differences: [],
      actualSignature: actual,
      expectedSignature: expected
    };
  }

  // Check dose equivalence
  const doseComparison = compareDoses(actual, expected);
  if (!doseComparison.isEquivalent) {
    differences.push(`Dose difference: ${doseComparison.actualDose} vs ${doseComparison.expectedDose}${doseComparison.reason ? ` (${doseComparison.reason})` : ''}`);
  }

  // Check frequency equivalence
  const frequencyPatterns = {
    'once daily': ['once daily', 'daily', 'once a day', 'qd'],
    'twice daily': ['twice daily', 'bid', 'twice a day', 'two times daily'],
    'three times daily': ['three times daily', 'tid', 'thrice daily'],
    'four times daily': ['four times daily', 'qid'],
    'once weekly': ['once weekly', 'weekly', 'once a week'],
    'twice weekly': ['twice weekly', 'twice a week']
  };

  let frequencyMatch = false;
  for (const [canonical, patterns] of Object.entries(frequencyPatterns)) {
    const actualHasPattern = patterns.some(pattern => normalizedActual.includes(pattern));
    const expectedHasPattern = patterns.some(pattern => normalizedExpected.includes(pattern));
    
    if (actualHasPattern && expectedHasPattern) {
      frequencyMatch = true;
      break;
    }
  }

  if (!frequencyMatch) {
    // Extract frequency from both signatures
    const freqRegex = /(once|twice|thrice|three times|four times|two times)\s*(daily|weekly|a day|a week|per day|per week)/i;
    const actualFreq = actual.match(freqRegex)?.[0] || 'unknown frequency';
    const expectedFreq = expected.match(freqRegex)?.[0] || 'unknown frequency';
    
    if (actualFreq !== expectedFreq) {
      differences.push(`Frequency difference: "${actualFreq}" vs "${expectedFreq}"`);
    }
  }

  // Check route equivalence
  const routePatterns = {
    'oral': ['by mouth', 'orally', 'oral', 'po'],
    'topical': ['topically', 'to affected area', 'to skin'],
    'intramuscular': ['intramuscularly', 'im', 'into muscle'],
    'subcutaneous': ['subcutaneously', 'subq', 'sc', 'under skin']
  };

  let routeMatch = false;
  for (const [canonical, patterns] of Object.entries(routePatterns)) {
    const actualHasPattern = patterns.some(pattern => normalizedActual.includes(pattern));
    const expectedHasPattern = patterns.some(pattern => normalizedExpected.includes(pattern));
    
    if (actualHasPattern && expectedHasPattern) {
      routeMatch = true;
      break;
    }
  }

  if (!routeMatch) {
    differences.push('Route of administration differs');
  }

  return {
    isEquivalent: differences.length === 0,
    differences,
    actualSignature: actual,
    expectedSignature: expected
  };
}

/**
 * Matcher: toClinicallyEqual
 * Compares two medication signatures for clinical equivalence
 */
function toClinicallyEqual(this: jest.MatcherContext, received: any, expected: any): ClinicalComparisonResult {
  const receivedText = typeof received === 'string' ? received : received?.humanReadable || String(received);
  const expectedText = typeof expected === 'string' ? expected : expected?.humanReadable || String(expected);

  const comparison = compareSignatures(receivedText, expectedText);

  if (comparison.isEquivalent) {
    return {
      pass: true,
      message: () => `Expected signatures to be clinically different, but they are equivalent:\n  Received: "${receivedText}"\n  Expected: "${expectedText}"`
    };
  } else {
    return {
      pass: false,
      message: () => `Expected signatures to be clinically equivalent, but found differences:\n  Received: "${receivedText}"\n  Expected: "${expectedText}"\n  Differences:\n${comparison.differences.map(d => `    - ${d}`).join('\n')}`
    };
  }
}

/**
 * Matcher: toHaveValidDoseFormat
 * Validates that a signature has properly formatted dose
 */
function toHaveValidDoseFormat(this: jest.MatcherContext, received: any): ClinicalComparisonResult {
  const signatureText = typeof received === 'string' ? received : received?.humanReadable || String(received);
  
  // Check for valid dose patterns
  const validDosePatterns = [
    /\d+(?:\.\d+)?\s*(?:tablet|capsule|ml|mg|mcg|g|click|application)s?/i,
    /\d+\/\d+\s*(?:tablet|capsule)s?/i,  // Fractional doses like 1/2 tablet
    /\d+\s*and\s*\d+\/\d+\s*(?:tablet|capsule)s?/i  // Mixed numbers like 1 and 1/2 tablets
  ];

  const hasDose = validDosePatterns.some(pattern => pattern.test(signatureText));

  if (hasDose) {
    return {
      pass: true,
      message: () => `Expected signature to have invalid dose format, but it was valid: "${signatureText}"`
    };
  } else {
    return {
      pass: false,
      message: () => `Expected signature to have valid dose format, but none found: "${signatureText}"`
    };
  }
}

/**
 * Matcher: toMatchSignatureStructure
 * Validates FHIR-compliant signature structure
 */
function toMatchSignatureStructure(this: jest.MatcherContext, received: any): ClinicalComparisonResult {
  if (!received || typeof received !== 'object') {
    return {
      pass: false,
      message: () => `Expected signature to be an object, but received: ${typeof received}`
    };
  }

  const signature = received as SignatureResult;
  const errors: string[] = [];

  // Check required fields
  if (!signature.humanReadable || typeof signature.humanReadable !== 'string') {
    errors.push('Missing or invalid humanReadable field');
  }

  if (!signature.fhirRepresentation || typeof signature.fhirRepresentation !== 'object') {
    errors.push('Missing or invalid fhirRepresentation field');
  } else {
    // Check FHIR structure
    const fhir = signature.fhirRepresentation;
    
    if (!fhir.dosageInstruction || !Array.isArray(fhir.dosageInstruction)) {
      errors.push('FHIR representation missing dosageInstruction array');
    } else if (fhir.dosageInstruction.length === 0) {
      errors.push('FHIR dosageInstruction array is empty');
    } else {
      const instruction = fhir.dosageInstruction[0];
      
      if (!instruction.text) {
        errors.push('FHIR instruction missing text field');
      }
      
      if (!instruction.doseAndRate || !Array.isArray(instruction.doseAndRate)) {
        errors.push('FHIR instruction missing doseAndRate array');
      }
    }
  }

  if (errors.length === 0) {
    return {
      pass: true,
      message: () => `Expected signature to have invalid structure, but it was valid`
    };
  } else {
    return {
      pass: false,
      message: () => `Signature structure validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    };
  }
}

/**
 * Matcher: toBeWithinDoseTolerance
 * Compares numeric doses with clinical tolerance
 */
function toBeWithinDoseTolerance(this: jest.MatcherContext, received: number, expected: number, tolerance: number = 0.001): ClinicalComparisonResult {
  if (typeof received !== 'number' || typeof expected !== 'number') {
    return {
      pass: false,
      message: () => `Expected numbers for dose comparison, but received: ${typeof received} and ${typeof expected}`
    };
  }

  const difference = Math.abs(received - expected);
  const withinTolerance = difference <= tolerance;

  if (withinTolerance) {
    return {
      pass: true,
      message: () => `Expected doses to differ by more than ${tolerance}, but difference was ${difference}: ${received} vs ${expected}`
    };
  } else {
    return {
      pass: false,
      message: () => `Expected doses to be within tolerance of ${tolerance}, but difference was ${difference}: ${received} vs ${expected}`
    };
  }
}

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toClinicallyEqual(expected: any): R;
      toHaveValidDoseFormat(): R;
      toMatchSignatureStructure(): R;
      toBeWithinDoseTolerance(expected: number, tolerance?: number): R;
    }
  }
}

// Export matchers for Jest registration
export const clinicalMatchers = {
  toClinicallyEqual,
  toHaveValidDoseFormat,
  toMatchSignatureStructure,
  toBeWithinDoseTolerance
};

// Export utility functions for testing
export {
  compareDoses,
  compareSignatures,
  normalizeDoseText,
  extractDose
};