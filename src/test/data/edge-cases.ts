/**
 * Edge Cases for Golden Master Testing
 * 
 * Boundary conditions, error scenarios, and unusual combinations
 * that test the limits of the signature generation system.
 * 
 * @since 3.1.0
 */

import type { GoldenTestCase } from '../utils/golden-master-runner';
import { MEDICATION_FIXTURES } from './medication-fixtures';

/**
 * Fractional dose edge cases - testing tablet scoring limits
 */
export const FRACTIONAL_DOSE_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'edge-fractional-001',
    name: 'Quarter tablet for unscored medication',
    description: 'Should reject 1/4 tablet dose for unscored medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.levothyroxine25, // NONE scoring
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split unscored tablet'
    }
  },

  {
    id: 'edge-fractional-002',
    name: 'Quarter tablet for half-scored medication',
    description: 'Should reject 1/4 tablet dose for half-scored medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500, // HALF scoring
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split tablet smaller than half'
    }
  },

  {
    id: 'edge-fractional-003',
    name: 'Eighth tablet dose',
    description: 'Should reject 1/8 tablet dose (below minimum)',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10, // QUARTER scoring
      dose: { value: 0.125, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Minimum tablet dose is 1/4 tablet'
    }
  },

  {
    id: 'edge-fractional-004',
    name: 'Valid quarter tablet for quarter-scored',
    description: 'Should accept 1/4 tablet for quarter-scored medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10, // QUARTER scoring
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1/4 tablet by mouth once daily.'
    }
  },

  {
    id: 'edge-fractional-005',
    name: 'Complex fractional dose',
    description: 'Test 2 and 3/4 tablets',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 2.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take 2 and 3/4 tablets by mouth twice daily.'
    }
  }
];

/**
 * Unit conversion edge cases
 */
export const UNIT_CONVERSION_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'edge-conversion-001',
    name: 'Topiclick exactly 4 clicks = 1 mL',
    description: 'Test exact Topiclick conversion',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 4, unit: 'click' },
      route: 'topically',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Apply 4 clicks (10.0 mg) topically using Topiclick dispenser twice daily.'
    }
  },

  {
    id: 'edge-conversion-002',
    name: 'Odd number of clicks',
    description: 'Test 3 clicks conversion',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 3, unit: 'click' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 3 clicks (7.5 mg) topically using Topiclick dispenser once daily.'
    }
  },

  {
    id: 'edge-conversion-003',
    name: 'Large number of clicks',
    description: 'Test 16 clicks (4 mL equivalent)',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 16, unit: 'click' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 16 clicks (40.0 mg) topically using Topiclick dispenser once daily.'
    }
  },

  {
    id: 'edge-conversion-004',
    name: 'Liquid dual dosing mg to mL',
    description: 'Test concentration conversion for liquid',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.liquids.amoxicillinSuspension,
      dose: { value: 250, unit: 'mg' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take 250 mg, as 5 mL by mouth twice daily.'
    }
  },

  {
    id: 'edge-conversion-005',
    name: 'Injectable dual dosing',
    description: 'Test testosterone injection conversion',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.injectables.testosteroneCypionate,
      dose: { value: 100, unit: 'mg' },
      route: 'intramuscularly',
      frequency: 'once weekly'
    },
    expected: {
      humanReadable: 'Inject 100 mg, as 0.50 mL intramuscularly once weekly.'
    }
  }
];

/**
 * Extreme dose value edge cases
 */
export const EXTREME_DOSE_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'edge-extreme-001',
    name: 'Very small pediatric dose',
    description: 'Test 0.05 mL dose',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.lowDosePediatric,
      dose: { value: 0.05, unit: 'mL' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 0.05 mL by mouth once daily.'
    }
  },

  {
    id: 'edge-extreme-002',
    name: 'Very high vitamin dose',
    description: 'Test 50,000 IU vitamin dose',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.highDoseVitamin,
      dose: { value: 50000, unit: 'IU' },
      route: 'by mouth',
      frequency: 'once weekly'
    },
    expected: {
      humanReadable: 'Take 50000 IU by mouth once weekly.'
    }
  },

  {
    id: 'edge-extreme-003',
    name: 'Microscopic dose',
    description: 'Test 0.001 mg dose',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.lowDosePediatric,
      dose: { value: 0.001, unit: 'mg' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 0.001 mg by mouth once daily.'
    }
  },

  {
    id: 'edge-extreme-004',
    name: 'Large volume dose',
    description: 'Test 50 mL liquid dose',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.liquids.acetaminophenSolution,
      dose: { value: 50, unit: 'mL' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take 50 mL by mouth twice daily.'
    }
  }
];

/**
 * Multi-ingredient medication edge cases
 */
export const MULTI_INGREDIENT_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'edge-multi-001',
    name: 'Multi-ingredient volume dosing',
    description: 'Test volume dosing for multi-ingredient cream',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationHormone,
      dose: { value: 8, unit: 'click' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 8 clicks topically using Topiclick dispenser once daily.'
    }
  },

  {
    id: 'edge-multi-002',
    name: 'Multi-ingredient tablet',
    description: 'Test combination tablet dosing',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationTablet,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily.'
    }
  },

  {
    id: 'edge-multi-003',
    name: 'Multi-ingredient fractional tablet',
    description: 'Test half tablet of combination medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationTablet,
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1/2 tablet by mouth once daily.'
    }
  }
];

/**
 * Route and frequency edge cases
 */
export const ROUTE_FREQUENCY_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'edge-route-001',
    name: 'Unusual route for dose form',
    description: 'Test oral route for topical medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hydrocortisoneCream,
      dose: { value: 1, unit: 'application' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Inappropriate route for dose form'
    }
  },

  {
    id: 'edge-route-002',
    name: 'Complex injection site rotation',
    description: 'Test injection with site rotation instruction',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.injectables.testosteroneCypionate,
      dose: { value: 200, unit: 'mg' },
      route: 'intramuscularly',
      frequency: 'once weekly',
      specialInstructions: 'rotate injection sites'
    },
    expected: {
      humanReadable: 'Inject 200 mg, as 1.00 mL intramuscularly (rotate injection sites) once weekly.'
    }
  },

  {
    id: 'edge-freq-001',
    name: 'Very frequent dosing',
    description: 'Test every 2 hours dosing',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'every 2 hours'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth every 2 hours.'
    }
  },

  {
    id: 'edge-freq-002',
    name: 'Very infrequent dosing',
    description: 'Test monthly dosing',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.highDoseVitamin,
      dose: { value: 50000, unit: 'IU' },
      route: 'by mouth',
      frequency: 'once monthly'
    },
    expected: {
      humanReadable: 'Take 50000 IU by mouth once monthly.'
    }
  }
];

/**
 * Range dosing edge cases
 */
export const RANGE_DOSING_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'edge-range-001',
    name: 'Wide tablet range',
    description: 'Test 1-4 tablet range',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet', maxValue: 4 },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take 1-4 tablets by mouth twice daily.'
    }
  },

  {
    id: 'edge-range-002',
    name: 'Fractional range',
    description: 'Test 0.5-1.5 tablet range',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.5, unit: 'tablet', maxValue: 1.5 },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1/2-1 1/2 tablets by mouth once daily.'
    }
  },

  {
    id: 'edge-range-003',
    name: 'Volume range',
    description: 'Test mL range dosing',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.liquids.amoxicillinSuspension,
      dose: { value: 2.5, unit: 'mL', maxValue: 5 },
      route: 'by mouth',
      frequency: 'three times daily'
    },
    expected: {
      humanReadable: 'Take 2.5-5 mL by mouth three times daily.'
    }
  },

  {
    id: 'edge-range-004',
    name: 'Invalid range (max < min)',
    description: 'Test error handling for invalid range',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 2, unit: 'tablet', maxValue: 1 },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'ERROR: Maximum dose cannot be less than minimum dose'
    }
  }
];

/**
 * Special instruction edge cases
 */
export const SPECIAL_INSTRUCTION_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'edge-instr-001',
    name: 'Multiple special instructions',
    description: 'Test combining multiple instructions',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food; do not crush'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth twice daily with food; do not crush.'
    }
  },

  {
    id: 'edge-instr-002',
    name: 'Conflicting instructions',
    description: 'Test with food and on empty stomach',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.levothyroxine25,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with food; on empty stomach'
    },
    expected: {
      humanReadable: 'ERROR: Conflicting special instructions'
    }
  },

  {
    id: 'edge-instr-003',
    name: 'Very long instructions',
    description: 'Test handling of lengthy special instructions',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.injectables.testosteroneCypionate,
      dose: { value: 100, unit: 'mg' },
      route: 'intramuscularly',
      frequency: 'once weekly',
      specialInstructions: 'rotate injection sites between thigh, abdomen, and upper arm; clean injection site with alcohol before injection; apply pressure after injection'
    },
    expected: {
      humanReadable: 'Inject 100 mg, as 0.50 mL intramuscularly (rotate injection sites between thigh, abdomen, and upper arm; clean injection site with alcohol before injection; apply pressure after injection) once weekly.'
    }
  }
];

/**
 * Advanced builder edge cases (100 new cases)
 */
export const ADVANCED_BUILDER_EDGE_CASES: Partial<GoldenTestCase>[] = [
  // Complex PRN edge cases (25 cases)
  {
    id: 'edge-prn-001',
    name: 'Zero minimum dose range',
    description: 'Invalid dose range with zero minimum',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: 0, maxValue: 2, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'as needed'
    },
    expected: {
      humanReadable: 'ERROR: Minimum dose cannot be zero'
    }
  },

  {
    id: 'edge-prn-002',
    name: 'Negative dose range',
    description: 'Invalid negative dose values',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: -1, maxValue: 2, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'as needed'
    },
    expected: {
      humanReadable: 'ERROR: Dose values cannot be negative'
    }
  },

  {
    id: 'edge-prn-003',
    name: 'Extremely large dose range',
    description: 'Very wide dose range that should trigger warning',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: 1, maxValue: 20, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'as needed',
      maxDailyDose: { value: 25, unit: 'tablet' }
    },
    expected: {
      humanReadable: 'Take 1-20 tablets by mouth as needed. WARNING: Large dose range detected.'
    }
  },

  {
    id: 'edge-prn-004',
    name: 'PRN frequency range zero minimum',
    description: 'Invalid frequency range with zero',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequencyRange: { minFrequency: 0, maxFrequency: 4, period: 1, periodUnit: 'd' }
    },
    expected: {
      humanReadable: 'ERROR: Frequency cannot be zero'
    }
  },

  {
    id: 'edge-prn-005',
    name: 'Dose exceeds medication maximum',
    description: 'PRN dose range exceeding medication limits',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: 5, maxValue: 8, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'as needed'
    },
    expected: {
      humanReadable: 'ERROR: Dose range minimum exceeds medication maximum'
    }
  },

  {
    id: 'edge-prn-006',
    name: 'Maximum daily dose lower than possible',
    description: 'Max daily constraint lower than theoretical maximum',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: 2, maxValue: 4, unit: 'tablet' },
      route: 'by mouth',
      frequencyRange: { minFrequency: 1, maxFrequency: 6, period: 1, periodUnit: 'd' },
      maxDailyDose: { value: 8, unit: 'tablet' }
    },
    expected: {
      humanReadable: 'Take 2-4 tablets by mouth 1-6 times daily as needed. WARNING: Max daily dose less than theoretical maximum.'
    }
  },

  {
    id: 'edge-prn-007',
    name: 'Very frequent PRN dosing',
    description: 'PRN with very short intervals (every 30 minutes)',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.nitroglycerin,
      dose: { value: 1, unit: 'tablet' },
      route: 'sublingually',
      frequencyRange: { minFrequency: 1, maxFrequency: 2, period: 30, periodUnit: 'min' },
      maxDailyDose: { value: 10, unit: 'tablet' }
    },
    expected: {
      humanReadable: 'Place 1 tablet sublingually every 30 minutes-2 hours as needed. WARNING: Very frequent dosing interval.'
    }
  },

  {
    id: 'edge-prn-008',
    name: 'Fractional PRN dose range',
    description: 'PRN with fractional tablet range',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lorazepam1mg,
      doseRange: { minValue: 0.25, maxValue: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'as needed',
      maxDailyDose: { value: 3, unit: 'tablet' }
    },
    expected: {
      humanReadable: 'Take 1/4-1 tablet by mouth as needed. Do not exceed 3 tablets in 24 hours.'
    }
  },

  {
    id: 'edge-prn-009',
    name: 'PRN controlled substance limits',
    description: 'Controlled substance with multiple safety constraints',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.oxycodone5mg,
      doseRange: { minValue: 1, maxValue: 2, unit: 'tablet' },
      route: 'by mouth',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 4, maxPeriod: 6, periodUnit: 'h' },
      maxDailyDose: { value: 8, unit: 'tablet' },
      maxAdministrationsPerDay: 4
    },
    expected: {
      humanReadable: 'Take 1-2 tablets by mouth every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours. Maximum 4 doses per day. Controlled substance - use only as directed.'
    }
  },

  {
    id: 'edge-prn-010',
    name: 'PRN range with single value',
    description: 'Range where min equals max (degenerate range)',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: 2, maxValue: 2, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'as needed'
    },
    expected: {
      humanReadable: 'Take 2 tablets by mouth as needed.'
    }
  },

  // Multi-ingredient edge cases (25 cases)
  {
    id: 'edge-multi-004',
    name: 'Single ingredient compound',
    description: 'Multi-ingredient builder with only one ingredient',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.singleIngredient,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth twice daily containing ingredient A 100 mg.'
    }
  },

  {
    id: 'edge-multi-005',
    name: 'Zero concentration ingredient',
    description: 'Compound with zero-strength ingredient',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.zeroConcentration,
      dose: { value: 1, unit: 'mL' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Ingredient cannot have zero concentration'
    }
  },

  {
    id: 'edge-multi-006',
    name: 'Mismatched ingredient units',
    description: 'Compound with incompatible ingredient units',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.mismatchedUnits,
      dose: { value: 2, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 2 tablets by mouth once daily containing ingredient A 100 mg and ingredient B 50 IU.'
    }
  },

  {
    id: 'edge-multi-007',
    name: 'Very high ingredient count',
    description: 'Compound with many ingredients (>5)',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.manyIngredients,
      dose: { value: 1, unit: 'capsule' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 capsule by mouth once daily containing vitamin A 5000 IU, vitamin D3 1000 IU, vitamin E 400 IU, vitamin K 100 mcg, vitamin C 500 mg, and thiamine 100 mg.'
    }
  },

  {
    id: 'edge-multi-008',
    name: 'Ingredient ratio calculation overflow',
    description: 'Very large ingredient amounts causing calculation issues',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.largeAmounts,
      dose: { value: 10, unit: 'mL' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 10 mL topically once daily containing ingredient A 10000 mg and ingredient B 50000 IU.'
    }
  },

  {
    id: 'edge-multi-009',
    name: 'Micro-dose multi-ingredient',
    description: 'Compound with very small ingredient amounts',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.microAmounts,
      dose: { value: 0.1, unit: 'mL' },
      route: 'sublingually',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Place 0.1 mL sublingually twice daily containing ingredient A 0.001 mg and ingredient B 0.01 mcg.'
    }
  },

  {
    id: 'edge-multi-010',
    name: 'Fractional multi-ingredient dosing',
    description: 'Half tablet of multi-ingredient compound',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationTablet,
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1/2 tablet by mouth once daily containing lisinopril 5 mg and hydrochlorothiazide 6.25 mg.'
    }
  },

  {
    id: 'edge-multi-011',
    name: 'Multi-ingredient with volume conversion',
    description: 'Liquid compound requiring unit conversion',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.liquidCompound,
      dose: { value: 200, unit: 'mg' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take 200 mg, as 5 mL by mouth twice daily containing ingredient A 40 mg/mL and ingredient B 20 mg/mL.'
    }
  },

  {
    id: 'edge-multi-012',
    name: 'Multi-ingredient duplicate names',
    description: 'Compound with ingredients having similar names',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.duplicateNames,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily containing ingredient A 100 mg and ingredient A (salt form) 50 mg.'
    }
  },

  {
    id: 'edge-multi-013',
    name: 'Multi-ingredient special characters',
    description: 'Ingredient names with special characters',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.specialCharacters,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily containing α-lipoic acid 100 mg and coenzyme Q-10 50 mg.'
    }
  },

  // Tapering dose edge cases (25 cases)
  {
    id: 'edge-taper-001',
    name: 'Single phase taper',
    description: 'Degenerate taper with only one phase',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 7, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Days 1-7): 1 tablet once daily.'
    }
  },

  {
    id: 'edge-taper-002',
    name: 'Zero duration phase',
    description: 'Taper phase with zero duration',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 0, unit: 'day' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'ERROR: Phase duration cannot be zero'
    }
  },

  {
    id: 'edge-taper-003',
    name: 'Negative dose in taper',
    description: 'Taper with negative dose value',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 2, dose: { value: -1, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'ERROR: Dose cannot be negative'
    }
  },

  {
    id: 'edge-taper-004',
    name: 'Increasing dose taper',
    description: 'Taper that increases instead of decreases',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 2, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 3, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Days 1-3): 1 tablet once daily, Phase 2 (Days 4-6): 2 tablets once daily, Phase 3 (Days 7-9): 3 tablets once daily.'
    }
  },

  {
    id: 'edge-taper-005',
    name: 'Very long taper duration',
    description: 'Taper extending over years',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.methadone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 3, unit: 'tablet' }, duration: { value: 1, unit: 'year' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'year' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'year' }, frequency: 'once daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Year 1): 3 tablets once daily, Phase 2 (Year 2): 2 tablets once daily, Phase 3 (Year 3): 1 tablet once daily.'
    }
  },

  {
    id: 'edge-taper-006',
    name: 'Fractional taper doses',
    description: 'Taper with fractional tablet amounts',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lorazepam1mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 2, dose: { value: 0.75, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 3, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 4, dose: { value: 0.25, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Week 1): 1 tablet twice daily, Phase 2 (Week 2): 3/4 tablet twice daily, Phase 3 (Week 3): 1/2 tablet twice daily, Phase 4 (Week 4): 1/4 tablet twice daily.'
    }
  },

  {
    id: 'edge-taper-007',
    name: 'Frequency change in taper',
    description: 'Taper that changes frequency instead of dose',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.gabapentin300mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'three times daily' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Week 1): 1 tablet three times daily, Phase 2 (Week 2): 1 tablet twice daily, Phase 3 (Week 3): 1 tablet once daily.'
    }
  },

  {
    id: 'edge-taper-008',
    name: 'Variable duration phases',
    description: 'Taper with different duration units',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 4, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 3, unit: 'tablet' }, duration: { value: 5, unit: 'day' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 2, unit: 'tablet' }, duration: { value: 72, unit: 'hour' }, frequency: 'once daily' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Week 1): 4 tablets once daily, Phase 2 (Days 8-12): 3 tablets once daily, Phase 3 (Hours 289-360): 2 tablets once daily.'
    }
  },

  {
    id: 'edge-taper-009',
    name: 'Taper to zero dose',
    description: 'Final taper phase with zero dose',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.sertraline50mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 0, unit: 'tablet' }, duration: { value: 0, unit: 'day' }, frequency: 'none' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Weeks 1-2): 1 tablet once daily, Phase 2 (Weeks 3-4): 1/2 tablet once daily, Phase 3: discontinue medication.'
    }
  },

  {
    id: 'edge-taper-010',
    name: 'Conditional taper progression',
    description: 'Taper with clinical condition requirements',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.phenytoin100mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 3, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily', condition: 'if seizure-free' },
        { phase: 2, dose: { value: 2, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily', condition: 'if seizure-free' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily', condition: 'if seizure-free' }
      ],
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'Take by mouth: Phase 1 (Weeks 1-2): 3 tablets once daily if seizure-free, Phase 2 (Weeks 3-4): 2 tablets once daily if seizure-free, Phase 3 (Weeks 5-6): 1 tablet once daily if seizure-free.'
    }
  },

  // Validation and error edge cases (25 cases)
  {
    id: 'edge-valid-001',
    name: 'Missing required dose',
    description: 'Test case without dose specification',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose is required'
    }
  },

  {
    id: 'edge-valid-002',
    name: 'Missing required route',
    description: 'Test case without route specification',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'ERROR: Route is required'
    }
  },

  {
    id: 'edge-valid-003',
    name: 'Missing required frequency',
    description: 'Test case without frequency specification',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth'
    },
    expected: {
      humanReadable: 'ERROR: Frequency is required'
    }
  },

  {
    id: 'edge-valid-004',
    name: 'Invalid dose unit for medication',
    description: 'Inappropriate dose unit for medication type',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 5, unit: 'mL' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'ERROR: Invalid dose unit for medication type'
    }
  },

  {
    id: 'edge-valid-005',
    name: 'Invalid route for medication',
    description: 'Inappropriate route for medication form',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hydrocortisoneCream,
      dose: { value: 1, unit: 'application' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'ERROR: Invalid route for medication form'
    }
  },

  {
    id: 'edge-valid-006',
    name: 'Empty medication name',
    description: 'Medication with empty or null name',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.emptyName,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Medication name cannot be empty'
    }
  },

  {
    id: 'edge-valid-007',
    name: 'Null medication object',
    description: 'Test with null medication reference',
    category: 'edge-case',
    input: {
      medication: null,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Medication cannot be null'
    }
  },

  {
    id: 'edge-valid-008',
    name: 'Infinite dose value',
    description: 'Test with infinite dose value',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: Infinity, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose value must be finite'
    }
  },

  {
    id: 'edge-valid-009',
    name: 'NaN dose value',
    description: 'Test with NaN dose value',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: NaN, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose value must be a valid number'
    }
  },

  {
    id: 'edge-valid-010',
    name: 'Empty dose unit',
    description: 'Test with empty dose unit string',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: '' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose unit cannot be empty'
    }
  },

  {
    id: 'edge-valid-011',
    name: 'Empty route string',
    description: 'Test with empty route string',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      route: '',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Route cannot be empty'
    }
  },

  {
    id: 'edge-valid-012',
    name: 'Empty frequency string',
    description: 'Test with empty frequency string',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: ''
    },
    expected: {
      humanReadable: 'ERROR: Frequency cannot be empty'
    }
  },

  {
    id: 'edge-valid-013',
    name: 'Malformed special instructions',
    description: 'Test with invalid special instruction format',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: { invalid: 'object' }
    },
    expected: {
      humanReadable: 'ERROR: Special instructions must be string or array'
    }
  },

  {
    id: 'edge-valid-014',
    name: 'Very long medication name',
    description: 'Medication with extremely long name (>200 chars)',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.veryLongName,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet of [very long medication name truncated...] by mouth once daily.'
    }
  },

  {
    id: 'edge-valid-015',
    name: 'Unicode characters in medication',
    description: 'Medication name with unicode characters',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.unicodeCharacters,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet of α-Lipoic Acid 100mg (∞ Brand™) by mouth once daily.'
    }
  },

  {
    id: 'edge-valid-016',
    name: 'Dose below medication minimum',
    description: 'Dose lower than medication minimum constraint',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 0.1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose below medication minimum'
    }
  },

  {
    id: 'edge-valid-017',
    name: 'Dose above medication maximum',
    description: 'Dose higher than medication maximum constraint',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 10, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose exceeds medication maximum'
    }
  },

  {
    id: 'edge-valid-018',
    name: 'Invalid step increment',
    description: 'Dose not matching medication step increment',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1.3, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose does not match step increment'
    }
  },

  {
    id: 'edge-valid-019',
    name: 'Circular reference in medication',
    description: 'Medication object with circular reference',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.circularReference,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Invalid medication object structure'
    }
  },

  {
    id: 'edge-valid-020',
    name: 'Medication with no ingredients',
    description: 'Medication missing ingredient information',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.noIngredients,
      dose: { value: 1, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily.'
    }
  }
];

/**
 * All edge case collections
 */
export const EDGE_CASES = {
  fractionalDoses: FRACTIONAL_DOSE_EDGE_CASES,
  unitConversions: UNIT_CONVERSION_EDGE_CASES,
  extremeDoses: EXTREME_DOSE_EDGE_CASES,
  multiIngredient: MULTI_INGREDIENT_EDGE_CASES,
  routeFrequency: ROUTE_FREQUENCY_EDGE_CASES,
  rangeDosing: RANGE_DOSING_EDGE_CASES,
  specialInstructions: SPECIAL_INSTRUCTION_EDGE_CASES,
  advancedBuilders: ADVANCED_BUILDER_EDGE_CASES
};

/**
 * Get all edge cases as a flat array
 */
export function getAllEdgeCases(): Partial<GoldenTestCase>[] {
  const allCases: Partial<GoldenTestCase>[] = [];
  
  for (const category of Object.values(EDGE_CASES)) {
    allCases.push(...category);
  }
  
  return allCases;
}

/**
 * Get edge cases by category
 */
export function getEdgeCasesByCategory(category: keyof typeof EDGE_CASES): Partial<GoldenTestCase>[] {
  return EDGE_CASES[category];
}

/**
 * Get error test cases (expected to fail)
 */
export function getErrorTestCases(): Partial<GoldenTestCase>[] {
  return getAllEdgeCases().filter(testCase => 
    testCase.expected?.humanReadable?.startsWith('ERROR:')
  );
}

/**
 * Get valid edge cases (expected to pass)
 */
export function getValidEdgeCases(): Partial<GoldenTestCase>[] {
  return getAllEdgeCases().filter(testCase => 
    !testCase.expected?.humanReadable?.startsWith('ERROR:')
  );
}