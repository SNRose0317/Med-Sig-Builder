/**
 * Fractional Dosing Test Cases for Golden Master Testing
 * 
 * Comprehensive test cases for FractionalTabletBuilder covering all scoring types,
 * fractional dose scenarios, and validation edge cases.
 * 
 * Total: 75 test cases
 * - Quarter tablets (1/4): 20 cases
 * - Half tablets (1/2): 20 cases
 * - Three-quarter tablets (3/4): 15 cases
 * - Mixed whole/fractional: 10 cases
 * - Unscored validation: 10 cases
 * 
 * @since 3.2.0
 */

import type { GoldenTestCase } from '../utils/golden-master-runner';
import { MEDICATION_FIXTURES } from './medication-fixtures';

/**
 * Quarter tablet test cases (1/4 tablet doses)
 * Requires QUARTER scoring type
 */
export const QUARTER_TABLET_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'fractional-quarter-001',
    name: 'Lisinopril 2.5mg (1/4 of 10mg tablet)',
    description: 'Standard quarter tablet dose for quarter-scored medication',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Low starting dose for hypertension in elderly patients',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-002',
    name: 'Atenolol 12.5mg quarter tablet',
    description: 'Quarter tablet with cardiac indication',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Atenolol 50mg',
        ingredient: [{
          name: 'Atenolol',
          strengthRatio: {
            numerator: { value: 50, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }]
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth twice daily.'
    },
    metadata: {
      clinicalIntent: 'Beta-blocker initiation with quarter-dose titration',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-003',
    name: 'Quarter tablet with food instruction',
    description: 'Quarter dose with timing instruction',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with breakfast'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily with breakfast.'
    },
    metadata: {
      clinicalIntent: 'Timed dosing for optimal blood pressure control',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-004',
    name: 'Digoxin 0.0625mg quarter tablet',
    description: 'Precise quarter dosing for cardiac glycoside',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Digoxin 0.25mg',
        ingredient: [{
          name: 'Digoxin',
          strengthRatio: {
            numerator: { value: 0.25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        dosageConstraints: {
          minDose: { value: 0.0625, unit: 'mg' },
          maxDose: { value: 0.25, unit: 'mg' },
          step: 0.0625
        }
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Precise cardiac glycoside dosing for heart failure',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-005',
    name: 'Warfarin 1.25mg quarter tablet',
    description: 'Anticoagulant quarter dose titration',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Warfarin 5mg',
        ingredient: [{
          name: 'Warfarin',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        isControlled: false,
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily at bedtime.'
    },
    metadata: {
      clinicalIntent: 'Anticoagulation with precise quarter-dose adjustment',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-006',
    name: 'Prednisone 1.25mg quarter tablet taper',
    description: 'Steroid taper using quarter tablets',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Prednisone 5mg',
        ingredient: [{
          name: 'Prednisone',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily with food.'
    },
    metadata: {
      clinicalIntent: 'Steroid taper to minimize withdrawal symptoms',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-007',
    name: 'Quarter tablet splitting instruction',
    description: 'Test splitting guidance for quarter tablets',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth twice daily.'
    },
    metadata: {
      clinicalIntent: 'Quarter dose with splitting instructions verification',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-008',
    name: 'Pediatric quarter dose',
    description: 'Pediatric medication quarter tablet',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Propranolol 40mg',
        ingredient: [{
          name: 'Propranolol',
          strengthRatio: {
            numerator: { value: 40, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'three times daily',
      specialInstructions: 'with meals'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth three times daily with meals.'
    },
    metadata: {
      clinicalIntent: 'Pediatric beta-blocker dosing for anxiety',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-009',
    name: 'Quarter tablet morning dose',
    description: 'Quarter tablet with specific timing',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'in the morning'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily in the morning.'
    },
    metadata: {
      clinicalIntent: 'Morning dosing for optimal circadian rhythm',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-010',
    name: 'Amlodipine 1.25mg quarter tablet',
    description: 'Calcium channel blocker quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Amlodipine 5mg',
        ingredient: [{
          name: 'Amlodipine',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Calcium channel blocker initiation at quarter dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-011',
    name: 'Metoprolol 6.25mg quarter tablet',
    description: 'Beta-blocker quarter dose for heart failure',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Metoprolol 25mg',
        ingredient: [{
          name: 'Metoprolol',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Heart failure beta-blocker initiation',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-012',
    name: 'Furosemide 2.5mg quarter tablet',
    description: 'Diuretic quarter dose for fluid management',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Furosemide 10mg',
        ingredient: [{
          name: 'Furosemide',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'in the morning'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily in the morning.'
    },
    metadata: {
      clinicalIntent: 'Gentle diuresis with quarter-dose loop diuretic',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-013',
    name: 'Carvedilol 0.78125mg quarter tablet',
    description: 'Very precise quarter dosing for heart failure',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Carvedilol 3.125mg',
        ingredient: [{
          name: 'Carvedilol',
          strengthRatio: {
            numerator: { value: 3.125, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Heart failure medication with very low starting dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-014',
    name: 'Spironolactone 6.25mg quarter tablet',
    description: 'Aldosterone antagonist quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Spironolactone 25mg',
        ingredient: [{
          name: 'Spironolactone',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with breakfast'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily with breakfast.'
    },
    metadata: {
      clinicalIntent: 'Potassium-sparing diuretic at quarter dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-015',
    name: 'Losartan 6.25mg quarter tablet',
    description: 'ARB quarter dose for hypertension',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Losartan 25mg',
        ingredient: [{
          name: 'Losartan',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Angiotensin receptor blocker initiation',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-016',
    name: 'Bisoprolol 0.625mg quarter tablet',
    description: 'Selective beta-blocker quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Bisoprolol 2.5mg',
        ingredient: [{
          name: 'Bisoprolol',
          strengthRatio: {
            numerator: { value: 2.5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'in the morning'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily in the morning.'
    },
    metadata: {
      clinicalIntent: 'Selective beta-blocker for heart failure',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-017',
    name: 'Ramipril 0.625mg quarter tablet',
    description: 'ACE inhibitor quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Ramipril 2.5mg',
        ingredient: [{
          name: 'Ramipril',
          strengthRatio: {
            numerator: { value: 2.5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth twice daily.'
    },
    metadata: {
      clinicalIntent: 'ACE inhibitor initiation with quarter dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-018',
    name: 'Hydralazine 2.5mg quarter tablet',
    description: 'Vasodilator quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Hydralazine 10mg',
        ingredient: [{
          name: 'Hydralazine',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'three times daily',
      specialInstructions: 'with meals'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth three times daily with meals.'
    },
    metadata: {
      clinicalIntent: 'Direct vasodilator for hypertension in pregnancy',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-019',
    name: 'Candesartan 1mg quarter tablet',
    description: 'ARB quarter tablet for heart failure',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Candesartan 4mg',
        ingredient: [{
          name: 'Candesartan',
          strengthRatio: {
            numerator: { value: 4, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Heart failure ARB with quarter-dose initiation',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-quarter-020',
    name: 'Valsartan 10mg quarter tablet',
    description: 'ARB quarter dose with precise splitting',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Valsartan 40mg',
        ingredient: [{
          name: 'Valsartan',
          strengthRatio: {
            numerator: { value: 40, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with or without food'
    },
    expected: {
      humanReadable: 'Take ¼ tablet by mouth twice daily with or without food.'
    },
    metadata: {
      clinicalIntent: 'ARB quarter dose for hypertension with flexible timing',
      version: '1.0.0'
    }
  }
];

/**
 * Half tablet test cases (1/2 tablet doses)
 * Requires HALF or QUARTER scoring type
 */
export const HALF_TABLET_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'fractional-half-001',
    name: 'Lisinopril 5mg (1/2 of 10mg tablet)',
    description: 'Standard half tablet dose for half-scored medication',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Half dose ACE inhibitor for initial hypertension therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-002',
    name: 'Metformin 250mg half tablet',
    description: 'Diabetes medication half dose',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with meals'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth twice daily with meals.'
    },
    metadata: {
      clinicalIntent: 'Diabetes medication initiation with half dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-003',
    name: 'Sertraline 25mg half tablet',
    description: 'Antidepressant half dose initiation',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Sertraline 50mg',
        ingredient: [{
          name: 'Sertraline',
          strengthRatio: {
            numerator: { value: 50, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with breakfast'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily with breakfast.'
    },
    metadata: {
      clinicalIntent: 'Antidepressant initiation to minimize side effects',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-004',
    name: 'Atorvastatin 10mg half tablet',
    description: 'Statin half dose for cholesterol',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Atorvastatin 20mg',
        ingredient: [{
          name: 'Atorvastatin',
          strengthRatio: {
            numerator: { value: 20, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily at bedtime.'
    },
    metadata: {
      clinicalIntent: 'Statin therapy initiation with half dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-005',
    name: 'Donepezil 2.5mg half tablet',
    description: 'Alzheimer medication half dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Donepezil 5mg',
        ingredient: [{
          name: 'Donepezil',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily at bedtime.'
    },
    metadata: {
      clinicalIntent: 'Alzheimer medication initiation with half dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-006',
    name: 'Trazodone 25mg half tablet for sleep',
    description: 'Sleep aid half dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Trazodone 50mg',
        ingredient: [{
          name: 'Trazodone',
          strengthRatio: {
            numerator: { value: 50, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime for sleep'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily at bedtime for sleep.'
    },
    metadata: {
      clinicalIntent: 'Low-dose sleep aid without hangover effect',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-007',
    name: 'Quetiapine 12.5mg half tablet',
    description: 'Antipsychotic half dose for sleep',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Quetiapine 25mg',
        ingredient: [{
          name: 'Quetiapine',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily at bedtime.'
    },
    metadata: {
      clinicalIntent: 'Low-dose antipsychotic for sleep and anxiety',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-008',
    name: 'Citalopram 10mg half tablet',
    description: 'SSRI half dose for depression',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Citalopram 20mg',
        ingredient: [{
          name: 'Citalopram',
          strengthRatio: {
            numerator: { value: 20, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'in the morning'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily in the morning.'
    },
    metadata: {
      clinicalIntent: 'Antidepressant initiation in elderly patients',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-009',
    name: 'Rosuvastatin 2.5mg half tablet',
    description: 'High-potency statin half dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Rosuvastatin 5mg',
        ingredient: [{
          name: 'Rosuvastatin',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with dinner'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily with dinner.'
    },
    metadata: {
      clinicalIntent: 'High-potency statin initiation with half dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-010',
    name: 'Amitriptyline 5mg half tablet',
    description: 'Tricyclic antidepressant half dose for neuropathy',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Amitriptyline 10mg',
        ingredient: [{
          name: 'Amitriptyline',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily at bedtime.'
    },
    metadata: {
      clinicalIntent: 'Low-dose tricyclic for neuropathic pain',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-011',
    name: 'Gabapentin 150mg half tablet',
    description: 'Anticonvulsant half dose for neuropathy',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Gabapentin 300mg',
        ingredient: [{
          name: 'Gabapentin',
          strengthRatio: {
            numerator: { value: 300, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'three times daily',
      specialInstructions: 'with meals'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth three times daily with meals.'
    },
    metadata: {
      clinicalIntent: 'Neuropathic pain management with gradual titration',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-012',
    name: 'Mirtazapine 7.5mg half tablet',
    description: 'Antidepressant half dose for sleep and appetite',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Mirtazapine 15mg',
        ingredient: [{
          name: 'Mirtazapine',
          strengthRatio: {
            numerator: { value: 15, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily at bedtime.'
    },
    metadata: {
      clinicalIntent: 'Antidepressant with sedating and appetite effects',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-013',
    name: 'Escitalopram 5mg half tablet',
    description: 'SSRI half dose for anxiety',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Escitalopram 10mg',
        ingredient: [{
          name: 'Escitalopram',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'in the morning with breakfast'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily in the morning with breakfast.'
    },
    metadata: {
      clinicalIntent: 'Anxiety management with half-dose SSRI',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-014',
    name: 'Duloxetine 15mg half tablet',
    description: 'SNRI half dose for depression and pain',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Duloxetine 30mg',
        ingredient: [{
          name: 'Duloxetine',
          strengthRatio: {
            numerator: { value: 30, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily with food.'
    },
    metadata: {
      clinicalIntent: 'Dual-action antidepressant for depression with pain',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-015',
    name: 'Bupropion 75mg half tablet',
    description: 'Atypical antidepressant half dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Bupropion 150mg',
        ingredient: [{
          name: 'Bupropion',
          strengthRatio: {
            numerator: { value: 150, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth twice daily.'
    },
    metadata: {
      clinicalIntent: 'Atypical antidepressant for depression and smoking cessation',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-016',
    name: 'Venlafaxine 18.75mg half tablet',
    description: 'SNRI half dose for depression',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Venlafaxine 37.5mg',
        ingredient: [{
          name: 'Venlafaxine',
          strengthRatio: {
            numerator: { value: 37.5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'SNRI initiation with half dose to minimize side effects',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-017',
    name: 'Olanzapine 1.25mg half tablet',
    description: 'Antipsychotic half dose for bipolar',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Olanzapine 2.5mg',
        ingredient: [{
          name: 'Olanzapine',
          strengthRatio: {
            numerator: { value: 2.5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at bedtime'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily at bedtime.'
    },
    metadata: {
      clinicalIntent: 'Low-dose antipsychotic for mood stabilization',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-018',
    name: 'Aripiprazole 1mg half tablet',
    description: 'Atypical antipsychotic half dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Aripiprazole 2mg',
        ingredient: [{
          name: 'Aripiprazole',
          strengthRatio: {
            numerator: { value: 2, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with breakfast'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth once daily with breakfast.'
    },
    metadata: {
      clinicalIntent: 'Antipsychotic adjunct therapy at minimal effective dose',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-019',
    name: 'Risperidone 0.25mg half tablet',
    description: 'Antipsychotic half dose for elderly',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Risperidone 0.5mg',
        ingredient: [{
          name: 'Risperidone',
          strengthRatio: {
            numerator: { value: 0.5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with meals'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth twice daily with meals.'
    },
    metadata: {
      clinicalIntent: 'Geriatric antipsychotic dosing for behavioral symptoms',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-half-020',
    name: 'Lamotrigine 12.5mg half tablet',
    description: 'Mood stabilizer half dose titration',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Lamotrigine 25mg',
        ingredient: [{
          name: 'Lamotrigine',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'HALF'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take ½ tablet by mouth twice daily.'
    },
    metadata: {
      clinicalIntent: 'Mood stabilizer initiation with careful titration',
      version: '1.0.0'
    }
  }
];

/**
 * Three-quarter tablet test cases (3/4 tablet doses)
 * Requires QUARTER scoring type
 */
export const THREE_QUARTER_TABLET_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'fractional-three-quarter-001',
    name: 'Lisinopril 7.5mg (3/4 of 10mg tablet)',
    description: 'Three-quarter tablet dose for quarter-scored medication',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Intermediate ACE inhibitor dose for hypertension',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-002',
    name: 'Metoprolol 18.75mg three-quarter tablet',
    description: 'Beta-blocker three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Metoprolol 25mg',
        ingredient: [{
          name: 'Metoprolol',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Beta-blocker dose optimization for heart failure',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-003',
    name: 'Carvedilol 2.34mg three-quarter tablet',
    description: 'Precise three-quarter dosing for heart failure',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Carvedilol 3.125mg',
        ingredient: [{
          name: 'Carvedilol',
          strengthRatio: {
            numerator: { value: 3.125, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Heart failure medication with precise titration',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-004',
    name: 'Spironolactone 18.75mg three-quarter tablet',
    description: 'Aldosterone antagonist three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Spironolactone 25mg',
        ingredient: [{
          name: 'Spironolactone',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with breakfast'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily with breakfast.'
    },
    metadata: {
      clinicalIntent: 'Potassium-sparing diuretic dose optimization',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-005',
    name: 'Warfarin 3.75mg three-quarter tablet',
    description: 'Anticoagulant three-quarter dose for INR management',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Warfarin 5mg',
        ingredient: [{
          name: 'Warfarin',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at the same time each evening'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily at the same time each evening.'
    },
    metadata: {
      clinicalIntent: 'Anticoagulation with precise INR target management',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-006',
    name: 'Digoxin 0.1875mg three-quarter tablet',
    description: 'Cardiac glycoside three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Digoxin 0.25mg',
        ingredient: [{
          name: 'Digoxin',
          strengthRatio: {
            numerator: { value: 0.25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at the same time each day'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily at the same time each day.'
    },
    metadata: {
      clinicalIntent: 'Cardiac glycoside for heart failure with rhythm control',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-007',
    name: 'Prednisone 3.75mg three-quarter tablet taper',
    description: 'Steroid taper with three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Prednisone 5mg',
        ingredient: [{
          name: 'Prednisone',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with food in the morning'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily with food in the morning.'
    },
    metadata: {
      clinicalIntent: 'Steroid taper to prevent adrenal insufficiency',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-008',
    name: 'Furosemide 7.5mg three-quarter tablet',
    description: 'Loop diuretic three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Furosemide 10mg',
        ingredient: [{
          name: 'Furosemide',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'in the morning and early afternoon'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth twice daily in the morning and early afternoon.'
    },
    metadata: {
      clinicalIntent: 'Diuretic dose optimization for fluid management',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-009',
    name: 'Losartan 18.75mg three-quarter tablet',
    description: 'ARB three-quarter dose for hypertension',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Losartan 25mg',
        ingredient: [{
          name: 'Losartan',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'ARB dose titration for optimal blood pressure control',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-010',
    name: 'Bisoprolol 1.875mg three-quarter tablet',
    description: 'Selective beta-blocker three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Bisoprolol 2.5mg',
        ingredient: [{
          name: 'Bisoprolol',
          strengthRatio: {
            numerator: { value: 2.5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'in the morning'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily in the morning.'
    },
    metadata: {
      clinicalIntent: 'Heart failure beta-blocker with dose optimization',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-011',
    name: 'Ramipril 1.875mg three-quarter tablet',
    description: 'ACE inhibitor three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Ramipril 2.5mg',
        ingredient: [{
          name: 'Ramipril',
          strengthRatio: {
            numerator: { value: 2.5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'ACE inhibitor dose titration for cardiovascular protection',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-012',
    name: 'Candesartan 3mg three-quarter tablet',
    description: 'ARB three-quarter dose for heart failure',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Candesartan 4mg',
        ingredient: [{
          name: 'Candesartan',
          strengthRatio: {
            numerator: { value: 4, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Heart failure ARB with precise dose titration',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-013',
    name: 'Hydralazine 7.5mg three-quarter tablet',
    description: 'Vasodilator three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Hydralazine 10mg',
        ingredient: [{
          name: 'Hydralazine',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'three times daily',
      specialInstructions: 'with meals'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth three times daily with meals.'
    },
    metadata: {
      clinicalIntent: 'Direct vasodilator for hypertension management',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-014',
    name: 'Valsartan 30mg three-quarter tablet',
    description: 'ARB three-quarter dose with flexible timing',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Valsartan 40mg',
        ingredient: [{
          name: 'Valsartan',
          strengthRatio: {
            numerator: { value: 40, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with or without food'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily with or without food.'
    },
    metadata: {
      clinicalIntent: 'ARB with flexible dosing for patient convenience',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-three-quarter-015',
    name: 'Amlodipine 3.75mg three-quarter tablet',
    description: 'Calcium channel blocker three-quarter dose',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Amlodipine 5mg',
        ingredient: [{
          name: 'Amlodipine',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 0.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take ¾ tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Calcium channel blocker dose optimization for hypertension',
      version: '1.0.0'
    }
  }
];

/**
 * Mixed whole and fractional tablet test cases
 * Complex combinations like 1.25, 1.5, 1.75, 2.25, etc.
 */
export const MIXED_WHOLE_FRACTIONAL_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'fractional-mixed-001',
    name: 'Lisinopril 15mg (1.5 tablets)',
    description: 'One and half tablets for intermediate dosing',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 1.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1½ tablets by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Intermediate ACE inhibitor dose between standard strengths',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-002',
    name: 'Metformin 750mg (1.5 tablets)',
    description: 'One and half tablets for diabetes management',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with meals'
    },
    expected: {
      humanReadable: 'Take 1½ tablets by mouth twice daily with meals.'
    },
    metadata: {
      clinicalIntent: 'Diabetes medication dose escalation to intermediate level',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-003',
    name: 'Warfarin 6.25mg (1.25 tablets)',
    description: 'One and quarter tablets for anticoagulation',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Warfarin 5mg',
        ingredient: [{
          name: 'Warfarin',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 1.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at the same time each evening'
    },
    expected: {
      humanReadable: 'Take 1¼ tablets by mouth once daily at the same time each evening.'
    },
    metadata: {
      clinicalIntent: 'Anticoagulation with precise dose adjustment for INR control',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-004',
    name: 'Metoprolol 43.75mg (1.75 tablets)',
    description: 'One and three-quarter tablets for heart failure',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Metoprolol 25mg',
        ingredient: [{
          name: 'Metoprolol',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 1.75, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take 1¾ tablets by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Beta-blocker dose titration for optimal heart failure management',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-005',
    name: 'Prednisone 6.25mg (1.25 tablets)',
    description: 'One and quarter tablets for steroid taper',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Prednisone 5mg',
        ingredient: [{
          name: 'Prednisone',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 1.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with food in the morning'
    },
    expected: {
      humanReadable: 'Take 1¼ tablets by mouth once daily with food in the morning.'
    },
    metadata: {
      clinicalIntent: 'Steroid taper with precise dose reduction',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-006',
    name: 'Furosemide 22.5mg (2.25 tablets)',
    description: 'Two and quarter tablets for advanced heart failure',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Furosemide 10mg',
        ingredient: [{
          name: 'Furosemide',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 2.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'in the morning and early afternoon'
    },
    expected: {
      humanReadable: 'Take 2¼ tablets by mouth twice daily in the morning and early afternoon.'
    },
    metadata: {
      clinicalIntent: 'Loop diuretic dose escalation for advanced heart failure',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-007',
    name: 'Spironolactone 31.25mg (1.25 tablets)',
    description: 'One and quarter tablets for aldosterone antagonism',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Spironolactone 25mg',
        ingredient: [{
          name: 'Spironolactone',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 1.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'with breakfast'
    },
    expected: {
      humanReadable: 'Take 1¼ tablets by mouth once daily with breakfast.'
    },
    metadata: {
      clinicalIntent: 'Potassium-sparing diuretic with intermediate dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-008',
    name: 'Carvedilol 4.6875mg (1.5 tablets)',
    description: 'One and half tablets for heart failure titration',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Carvedilol 3.125mg',
        ingredient: [{
          name: 'Carvedilol',
          strengthRatio: {
            numerator: { value: 3.125, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 1.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'twice daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take 1½ tablets by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Heart failure medication with intermediate dose titration',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-009',
    name: 'Digoxin 0.375mg (1.5 tablets)',
    description: 'One and half tablets for cardiac rhythm control',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Digoxin 0.25mg',
        ingredient: [{
          name: 'Digoxin',
          strengthRatio: {
            numerator: { value: 0.25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 1.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily',
      specialInstructions: 'at the same time each day'
    },
    expected: {
      humanReadable: 'Take 1½ tablets by mouth once daily at the same time each day.'
    },
    metadata: {
      clinicalIntent: 'Cardiac glycoside with intermediate dose for heart failure',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-mixed-010',
    name: 'Losartan 31.25mg (1.25 tablets)',
    description: 'One and quarter tablets for hypertension',
    category: 'tablet',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Losartan 25mg',
        ingredient: [{
          name: 'Losartan',
          strengthRatio: {
            numerator: { value: 25, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        scoringType: 'QUARTER'
      },
      dose: { value: 1.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1¼ tablets by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'ARB with intermediate dose for blood pressure optimization',
      version: '1.0.0'
    }
  }
];

/**
 * Unscored tablet validation test cases (error scenarios)
 * Tests for inappropriate splitting of unscored medications
 */
export const UNSCORED_VALIDATION_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'fractional-error-001',
    name: 'Quarter tablet of unscored medication',
    description: 'Should reject 1/4 tablet dose for unscored medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.levothyroxine25, // NONE scoring
      dose: { value: 0.25, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split unscored tablet into quarters'
    },
    metadata: {
      clinicalIntent: 'Validation error for inappropriate tablet splitting',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-002',
    name: 'Half tablet of unscored medication',
    description: 'Should reject 1/2 tablet dose for unscored medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.levothyroxine25, // NONE scoring
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split unscored tablet'
    },
    metadata: {
      clinicalIntent: 'Validation error for inappropriate tablet splitting',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-003',
    name: 'Quarter tablet of half-scored medication',
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
    },
    metadata: {
      clinicalIntent: 'Validation error for excessive tablet splitting',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-004',
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
      humanReadable: 'ERROR: Minimum fractional dose is 1/4 tablet'
    },
    metadata: {
      clinicalIntent: 'Validation error for dose below minimum splitting threshold',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-005',
    name: 'Irregular fraction dose',
    description: 'Should reject non-standard fractions like 1/3 tablet',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.333, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Only standard fractions (1/4, 1/2, 3/4) are allowed'
    },
    metadata: {
      clinicalIntent: 'Validation error for non-standard fractional doses',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-006',
    name: 'Enteric-coated tablet splitting',
    description: 'Should reject splitting of enteric-coated formulations',
    category: 'edge-case',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.omeprazole20,
        doseForm: 'Enteric-coated tablet',
        scoringType: 'NONE'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split enteric-coated tablets'
    },
    metadata: {
      clinicalIntent: 'Safety error prevention for enteric-coated formulations',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-007',
    name: 'Extended-release tablet splitting',
    description: 'Should reject splitting of extended-release formulations',
    category: 'edge-case',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.metformin500,
        name: 'Metformin XR 500mg',
        doseForm: 'Extended-release tablet',
        scoringType: 'NONE'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split extended-release tablets'
    },
    metadata: {
      clinicalIntent: 'Safety error prevention for modified-release formulations',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-008',
    name: 'Capsule splitting attempt',
    description: 'Should reject fractional doses for capsule formulations',
    category: 'edge-case',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.omeprazole20,
        doseForm: 'Capsule'
      },
      dose: { value: 0.5, unit: 'capsule' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split capsules'
    },
    metadata: {
      clinicalIntent: 'Safety error prevention for capsule formulations',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-009',
    name: 'Sublingual tablet splitting',
    description: 'Should reject splitting of sublingual formulations',
    category: 'edge-case',
    input: {
      medication: {
        ...MEDICATION_FIXTURES.tablets.lisinopril10,
        name: 'Nitroglycerin 0.4mg SL',
        doseForm: 'Sublingual tablet',
        scoringType: 'NONE'
      },
      dose: { value: 0.5, unit: 'tablet' },
      route: 'sublingually',
      frequency: 'as needed'
    },
    expected: {
      humanReadable: 'ERROR: Cannot split sublingual tablets'
    },
    metadata: {
      clinicalIntent: 'Safety error prevention for sublingual formulations',
      version: '1.0.0'
    }
  },

  {
    id: 'fractional-error-010',
    name: 'Very small fractional dose',
    description: 'Should reject doses smaller than 1/8 tablet',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.05, unit: 'tablet' },
      route: 'by mouth',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'ERROR: Dose too small for practical tablet splitting'
    },
    metadata: {
      clinicalIntent: 'Validation error for impractically small doses',
      version: '1.0.0'
    }
  }
];

/**
 * All fractional dosing test cases organized by subcategory
 */
export const FRACTIONAL_DOSING_CASES = {
  quarters: QUARTER_TABLET_CASES,
  halves: HALF_TABLET_CASES,
  threeQuarters: THREE_QUARTER_TABLET_CASES,
  mixed: MIXED_WHOLE_FRACTIONAL_CASES,
  validation: UNSCORED_VALIDATION_CASES
};

/**
 * Get all fractional dosing test cases as a flat array
 */
export function getAllFractionalDosingCases(): Partial<GoldenTestCase>[] {
  const allCases: Partial<GoldenTestCase>[] = [];
  
  for (const category of Object.values(FRACTIONAL_DOSING_CASES)) {
    allCases.push(...category);
  }
  
  return allCases;
}

/**
 * Get fractional dosing cases by subcategory
 */
export function getFractionalDosingCasesByCategory(category: keyof typeof FRACTIONAL_DOSING_CASES): Partial<GoldenTestCase>[] {
  return FRACTIONAL_DOSING_CASES[category];
}

/**
 * Get error test cases (expected to fail validation)
 */
export function getFractionalDosingErrorCases(): Partial<GoldenTestCase>[] {
  return UNSCORED_VALIDATION_CASES;
}

/**
 * Get valid fractional dosing cases (expected to pass)
 */
export function getValidFractionalDosingCases(): Partial<GoldenTestCase>[] {
  return getAllFractionalDosingCases().filter(testCase => 
    !testCase.expected?.humanReadable?.startsWith('ERROR:')
  );
}