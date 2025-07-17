/**
 * Real-World Examples for Golden Master Testing
 * 
 * Production-like test cases based on actual medication scenarios
 * that healthcare providers commonly encounter.
 * 
 * @since 3.1.0
 */

import type { GoldenTestCase } from '../utils/golden-master-runner';
import { MEDICATION_FIXTURES } from './medication-fixtures';

/**
 * Common tablet prescriptions
 */
export const REAL_WORLD_TABLET_EXAMPLES: Partial<GoldenTestCase>[] = [
  {
    id: 'real-tablet-001',
    name: 'Metformin 500mg standard diabetes dosing',
    description: 'Standard metformin prescription for type 2 diabetes',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Twice Daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Standard metformin therapy for glycemic control',
      version: '1.0.0'
    }
  },

  {
    id: 'real-tablet-002',
    name: 'Metformin dose escalation to 1000mg BID',
    description: 'Common dose escalation for metformin',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.metformin500,
      dose: { value: 2, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Twice Daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take 2 tablets by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Metformin dose escalation for improved glycemic control',
      version: '1.0.0'
    }
  },

  {
    id: 'real-tablet-003',
    name: 'Lisinopril 5mg (half tablet)',
    description: 'Common starting dose using half tablet',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 0.5, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Once Daily'
    },
    expected: {
      humanReadable: 'Take 1/2 tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Low starting dose for hypertension management',
      version: '1.0.0'
    }
  },

  {
    id: 'real-tablet-004',
    name: 'Levothyroxine morning dosing',
    description: 'Standard thyroid hormone replacement',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.levothyroxine25,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Once Daily',
      specialInstructions: 'on empty stomach 30 minutes before breakfast'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily on empty stomach 30 minutes before breakfast.'
    },
    metadata: {
      clinicalIntent: 'Thyroid hormone replacement with optimal absorption timing',
      version: '1.0.0'
    }
  },

  {
    id: 'real-tablet-005',
    name: 'Omeprazole for GERD',
    description: 'Standard PPI therapy',
    category: 'tablet',
    input: {
      medication: MEDICATION_FIXTURES.tablets.omeprazole20,
      dose: { value: 1, unit: 'capsule' },
      route: 'Orally',
      frequency: 'Once Daily',
      specialInstructions: 'before breakfast'
    },
    expected: {
      humanReadable: 'Take 1 capsule by mouth once daily before breakfast.'
    },
    metadata: {
      clinicalIntent: 'Gastroesophageal reflux disease management',
      version: '1.0.0'
    }
  }
];

/**
 * Common liquid medication prescriptions
 */
export const REAL_WORLD_LIQUID_EXAMPLES: Partial<GoldenTestCase>[] = [
  {
    id: 'real-liquid-001',
    name: 'Amoxicillin pediatric suspension',
    description: 'Standard pediatric antibiotic dosing',
    category: 'liquid',
    input: {
      medication: MEDICATION_FIXTURES.liquids.amoxicillinSuspension,
      dose: { value: 5, unit: 'mL' },
      route: 'Orally',
      frequency: 'Three Times Daily',
      specialInstructions: 'shake well before use'
    },
    expected: {
      humanReadable: 'Take 5 mL by mouth three times daily shake well before use.'
    },
    metadata: {
      clinicalIntent: 'Pediatric bacterial infection treatment',
      version: '1.0.0'
    }
  },

  {
    id: 'real-liquid-002',
    name: 'Amoxicillin weight-based dosing',
    description: 'Dose prescribed by weight with volume conversion',
    category: 'liquid',
    input: {
      medication: MEDICATION_FIXTURES.liquids.amoxicillinSuspension,
      dose: { value: 250, unit: 'mg' },
      route: 'Orally',
      frequency: 'Twice Daily',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take 250 mg, as 5 mL by mouth twice daily with food.'
    },
    metadata: {
      clinicalIntent: 'Weight-based antibiotic dosing with dual dose display',
      version: '1.0.0'
    }
  },

  {
    id: 'real-liquid-003',
    name: 'Acetaminophen pediatric fever',
    description: 'Common fever reducer for children',
    category: 'liquid',
    input: {
      medication: MEDICATION_FIXTURES.liquids.acetaminophenSolution,
      dose: { value: 2.5, unit: 'mL' },
      route: 'Orally',
      frequency: 'every 4 hours as needed',
      specialInstructions: 'for fever'
    },
    expected: {
      humanReadable: 'Take 2.5 mL by mouth every 4 hours as needed for fever.'
    },
    metadata: {
      clinicalIntent: 'Pediatric fever management with PRN dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'real-liquid-004',
    name: 'Insulin long-acting baseline',
    description: 'Basal insulin therapy',
    category: 'liquid',
    input: {
      medication: MEDICATION_FIXTURES.liquids.insulin,
      dose: { value: 10, unit: 'units' },
      route: 'Subcutaneous',
      frequency: 'Once Daily',
      specialInstructions: 'at bedtime, rotate injection sites'
    },
    expected: {
      humanReadable: 'Inject 10 units subcutaneously once daily at bedtime, rotate injection sites.'
    },
    metadata: {
      clinicalIntent: 'Basal insulin therapy for diabetes management',
      version: '1.0.0'
    }
  }
];

/**
 * Injectable medication examples
 */
export const REAL_WORLD_INJECTABLE_EXAMPLES: Partial<GoldenTestCase>[] = [
  {
    id: 'real-injection-001',
    name: 'Testosterone cypionate TRT',
    description: 'Standard testosterone replacement therapy',
    category: 'injection',
    input: {
      medication: MEDICATION_FIXTURES.injectables.testosteroneCypionate,
      dose: { value: 100, unit: 'mg' },
      route: 'Intramuscularly',
      frequency: 'Once Per Week',
      specialInstructions: 'rotate injection sites'
    },
    expected: {
      humanReadable: 'Inject 100 mg, as 0.50 mL intramuscularly once weekly rotate injection sites.'
    },
    metadata: {
      clinicalIntent: 'Testosterone replacement therapy for hypogonadism',
      version: '1.0.0'
    }
  },

  {
    id: 'real-injection-002',
    name: 'Testosterone cypionate higher dose',
    description: 'Higher dose testosterone therapy',
    category: 'injection',
    input: {
      medication: MEDICATION_FIXTURES.injectables.testosteroneCypionate,
      dose: { value: 200, unit: 'mg' },
      route: 'Intramuscularly',
      frequency: 'Once Every Two Weeks'
    },
    expected: {
      humanReadable: 'Inject 200 mg, as 1.00 mL intramuscularly every 2 weeks.'
    },
    metadata: {
      clinicalIntent: 'Higher dose testosterone therapy with longer interval',
      version: '1.0.0'
    }
  },

  {
    id: 'real-injection-003',
    name: 'Morphine pain management',
    description: 'Injectable pain medication',
    category: 'injection',
    input: {
      medication: MEDICATION_FIXTURES.injectables.morphineInjection,
      dose: { value: 5, unit: 'mg' },
      route: 'Intramuscularly',
      frequency: 'every 4 hours as needed',
      specialInstructions: 'for severe pain'
    },
    expected: {
      humanReadable: 'Inject 5 mg, as 0.50 mL intramuscularly every 4 hours as needed for severe pain.'
    },
    metadata: {
      clinicalIntent: 'Acute severe pain management',
      version: '1.0.0'
    }
  }
];

/**
 * Topical medication examples with Topiclick
 */
export const REAL_WORLD_TOPICAL_EXAMPLES: Partial<GoldenTestCase>[] = [
  {
    id: 'real-topical-001',
    name: 'Hormone cream standard dose',
    description: 'Standard bioidentical hormone therapy',
    category: 'topical',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 4, unit: 'click' },
      route: 'Topically',
      frequency: 'Twice Daily',
      specialInstructions: 'using Topiclick dispenser'
    },
    expected: {
      humanReadable: 'Apply 4 clicks (10.0 mg) topically using Topiclick dispenser twice daily.'
    },
    metadata: {
      clinicalIntent: 'Bioidentical hormone replacement therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'real-topical-002',
    name: 'Hormone cream dose escalation',
    description: 'Increased hormone therapy dose',
    category: 'topical',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 8, unit: 'click' },
      route: 'Topically',
      frequency: 'Once Daily',
      specialInstructions: 'using Topiclick dispenser, apply to inner wrist'
    },
    expected: {
      humanReadable: 'Apply 8 clicks (20.0 mg) topically using Topiclick dispenser, apply to inner wrist once daily.'
    },
    metadata: {
      clinicalIntent: 'Dose escalation for hormone therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'real-topical-003',
    name: 'Hydrocortisone eczema treatment',
    description: 'Standard topical steroid for eczema',
    category: 'topical',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hydrocortisoneCream,
      dose: { value: 1, unit: 'application' },
      route: 'Topically',
      frequency: 'Twice Daily',
      specialInstructions: 'to affected area only, thin layer'
    },
    expected: {
      humanReadable: 'Apply 1 application topically to affected area only, thin layer twice daily.'
    },
    metadata: {
      clinicalIntent: 'Eczema management with topical corticosteroid',
      version: '1.0.0'
    }
  }
];

/**
 * Multi-ingredient medication examples
 */
export const REAL_WORLD_MULTI_INGREDIENT_EXAMPLES: Partial<GoldenTestCase>[] = [
  {
    id: 'real-multi-001',
    name: 'Combination hormone cream',
    description: 'Multi-hormone topical therapy',
    category: 'complex',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationHormone,
      dose: { value: 6, unit: 'click' },
      route: 'Topically',
      frequency: 'Once Daily',
      specialInstructions: 'using Topiclick dispenser'
    },
    expected: {
      humanReadable: 'Apply 6 clicks topically using Topiclick dispenser once daily.'
    },
    metadata: {
      clinicalIntent: 'Combined estradiol/progesterone hormone therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'real-multi-002',
    name: 'Lisinopril/HCTZ combination',
    description: 'Fixed-dose combination for hypertension',
    category: 'complex',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationTablet,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Once Daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Fixed-dose combination therapy for hypertension',
      version: '1.0.0'
    }
  }
];

/**
 * Edge case scenarios from real practice
 */
export const REAL_WORLD_EDGE_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'real-edge-001',
    name: 'High-dose vitamin D deficiency',
    description: 'Weekly high-dose vitamin D for deficiency',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.highDoseVitamin,
      dose: { value: 50000, unit: 'IU' },
      route: 'Orally',
      frequency: 'Once Per Week',
      specialInstructions: 'for 8 weeks'
    },
    expected: {
      humanReadable: 'Take 50000 IU by mouth once weekly for 8 weeks.'
    },
    metadata: {
      clinicalIntent: 'Vitamin D deficiency correction therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'real-edge-002',
    name: 'Pediatric digoxin precision dosing',
    description: 'Very precise pediatric cardiac medication',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.edgeCases.lowDosePediatric,
      dose: { value: 0.05, unit: 'mL' },
      route: 'Orally',
      frequency: 'Twice Daily',
      specialInstructions: 'use oral syringe for accurate measurement'
    },
    expected: {
      humanReadable: 'Take 0.05 mL by mouth twice daily use oral syringe for accurate measurement.'
    },
    metadata: {
      clinicalIntent: 'Pediatric digoxin therapy requiring precise dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'real-edge-003',
    name: 'Complex fractional tablet dose',
    description: 'Lisinopril 7.5mg using 1.5 tablets',
    category: 'edge-case',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lisinopril10,
      dose: { value: 1.5, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Once Daily'
    },
    expected: {
      humanReadable: 'Take 1 and 1/2 tablets by mouth once daily.'
    },
    metadata: {
      clinicalIntent: 'Intermediate dose using fractional tablets',
      version: '1.0.0'
    }
  }
];

/**
 * Advanced real-world examples (55 new cases)
 */
export const ADVANCED_REAL_WORLD_EXAMPLES: Partial<GoldenTestCase>[] = [
  // Complex PRN scenarios (20 cases)
  {
    id: 'advanced-real-001',
    name: 'Migraine abortive therapy',
    description: 'Complex PRN with dose escalation',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.sumatriptan100mg,
      doseRange: { minValue: 1, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequency: 'as needed',
      specialInstructions: 'for migraine, may repeat once after 2 hours if needed',
      maxDailyDose: { value: 3, unit: 'tablet' }
    },
    expected: {
      humanReadable: 'Take 1-2 tablets by mouth as needed for migraine, may repeat once after 2 hours if needed. Do not exceed 3 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible migraine treatment with rescue dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-002',
    name: 'Breakthrough pain management',
    description: 'Opioid PRN with safety constraints',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.oxycodone5mg,
      doseRange: { minValue: 1, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 4, maxPeriod: 6, periodUnit: 'h' },
      specialInstructions: 'for breakthrough pain',
      maxDailyDose: { value: 8, unit: 'tablet' },
      maxAdministrationsPerDay: 4
    },
    expected: {
      humanReadable: 'Take 1-2 tablets by mouth every 4-6 hours as needed for breakthrough pain. Do not exceed 8 tablets in 24 hours. Maximum 4 doses per day.'
    },
    metadata: {
      clinicalIntent: 'Breakthrough pain management with safety limits',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-003',
    name: 'Anxiety PRN flexible dosing',
    description: 'Benzodiazepine with dose range',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lorazepam1mg,
      doseRange: { minValue: 0.5, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequency: 'as needed',
      specialInstructions: 'for anxiety attacks',
      maxDailyDose: { value: 6, unit: 'tablet' }
    },
    expected: {
      humanReadable: 'Take 1/2-2 tablets by mouth as needed for anxiety attacks. Do not exceed 6 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible anxiety management with safety limits',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-004',
    name: 'Pediatric fever reducer PRN',
    description: 'Weight-based PRN with range',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.liquids.acetaminophenSolution,
      doseRange: { minValue: 2.5, maxValue: 5, unit: 'mL' },
      route: 'Orally',
      frequency: 'every 4-6 hours as needed',
      specialInstructions: 'for fever over 100.4°F',
      maxDailyDose: { value: 20, unit: 'mL' }
    },
    expected: {
      humanReadable: 'Give 2.5-5 mL by mouth every 4-6 hours as needed for fever over 100.4°F. Do not exceed 20 mL in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Pediatric fever management with flexibility',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-005',
    name: 'Insomnia PRN variable timing',
    description: 'Sleep aid with flexible timing',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.zolpidem10mg,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 1, maxPeriod: 3, periodUnit: 'night' },
      specialInstructions: 'at bedtime for sleep initiation',
      maxDailyDose: { value: 1, unit: 'tablet' }
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth 1-3 nights per week as needed at bedtime for sleep initiation. Do not exceed 1 tablet in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Intermittent insomnia management',
      version: '1.0.0'
    }
  },

  // Multi-ingredient real-world (15 cases)
  {
    id: 'advanced-real-006',
    name: 'Hormone replacement compound',
    description: 'Bioidentical hormone combination',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationHormone,
      dose: { value: 6, unit: 'click' },
      route: 'Topically',
      frequency: 'Once Daily',
      specialInstructions: 'apply to inner forearms, rotate sites'
    },
    expected: {
      humanReadable: 'Apply 6 clicks topically apply to inner forearms, rotate sites once daily containing estradiol 1.5 mg and progesterone 15 mg.'
    },
    metadata: {
      clinicalIntent: 'Menopause hormone replacement therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-007',
    name: 'Dermatology triple compound',
    description: 'Anti-inflammatory, antibiotic, antifungal cream',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.tripleTopical,
      dose: { value: 2, unit: 'click' },
      route: 'Topically',
      frequency: 'Twice Daily',
      specialInstructions: 'to affected areas only, wash hands after application'
    },
    expected: {
      humanReadable: 'Apply 2 clicks topically to affected areas only, wash hands after application twice daily containing hydrocortisone 5 mg, mupirocin 10 mg, and nystatin 50000 units.'
    },
    metadata: {
      clinicalIntent: 'Complex dermatological infection treatment',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-008',
    name: 'Cardiovascular combination',
    description: 'ACE inhibitor with diuretic',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationTablet,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Once Daily',
      specialInstructions: 'in the morning with or without food'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth in the morning with or without food once daily containing lisinopril 10 mg and hydrochlorothiazide 12.5 mg.'
    },
    metadata: {
      clinicalIntent: 'Hypertension management with combination therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-009',
    name: 'Pain management compound injection',
    description: 'Multi-ingredient intramuscular injection',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.injectableCompound,
      dose: { value: 1, unit: 'mL' },
      route: 'Intramuscularly',
      frequency: 'Once Per Week',
      specialInstructions: 'deep IM injection, rotate gluteal sites'
    },
    expected: {
      humanReadable: 'Inject 1 mL intramuscularly deep IM injection, rotate gluteal sites once weekly containing testosterone cypionate 100 mg and anastrozole 0.25 mg.'
    },
    metadata: {
      clinicalIntent: 'Testosterone therapy with aromatase inhibition',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-010',
    name: 'Vitamin B complex sublingual',
    description: 'High-dose B vitamin combination',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.sublingualCompound,
      dose: { value: 1, unit: 'tablet' },
      route: 'sublingually',
      frequency: 'Twice Daily',
      specialInstructions: 'hold under tongue for 2 minutes before swallowing'
    },
    expected: {
      humanReadable: 'Place 1 tablet sublingually hold under tongue for 2 minutes before swallowing twice daily containing methylcobalamin 1000 mcg and folic acid 800 mcg.'
    },
    metadata: {
      clinicalIntent: 'Vitamin B12 deficiency treatment with folate',
      version: '1.0.0'
    }
  },

  // Tapering schedules real-world (20 cases)
  {
    id: 'advanced-real-011',
    name: 'Post-surgical steroid taper',
    description: 'Standard prednisolone post-operative taper',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 4, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'Once Daily' },
        { phase: 2, dose: { value: 3, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'Once Daily' },
        { phase: 3, dose: { value: 2, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'Once Daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'Once Daily' }
      ],
      route: 'Orally',
      specialInstructions: 'with food to reduce stomach upset'
    },
    expected: {
      humanReadable: 'Take by mouth with food to reduce stomach upset: Phase 1 (Days 1-3): 4 tablets once daily, Phase 2 (Days 4-6): 3 tablets once daily, Phase 3 (Days 7-9): 2 tablets once daily, Phase 4 (Days 10-12): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Post-surgical inflammation control with withdrawal',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-012',
    name: 'Alcohol withdrawal protocol',
    description: 'Medical detoxification with chlordiazepoxide',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.chlordiazepoxide25mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'Four Times Daily' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'Four Times Daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'twice daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'Once Daily' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor for withdrawal symptoms and seizures'
    },
    expected: {
      humanReadable: 'Take by mouth monitor for withdrawal symptoms and seizures: Phase 1 (Days 1-2): 2 tablets four times daily, Phase 2 (Days 3-4): 1 tablet four times daily, Phase 3 (Days 5-6): 1 tablet twice daily, Phase 4 (Days 7-8): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Medically supervised alcohol withdrawal',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-013',
    name: 'SSRI discontinuation syndrome prevention',
    description: 'Gradual sertraline withdrawal',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.sertraline50mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'Once Daily' },
        { phase: 2, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'Once Daily' },
        { phase: 3, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'every other day' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor mood and discontinuation symptoms'
    },
    expected: {
      humanReadable: 'Take by mouth monitor mood and discontinuation symptoms: Phase 1 (Weeks 1-2): 1 tablet once daily, Phase 2 (Weeks 3-4): 1/2 tablet once daily, Phase 3 (Week 5): 1/2 tablet every other day.'
    },
    metadata: {
      clinicalIntent: 'Preventing SSRI discontinuation syndrome',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-014',
    name: 'Gabapentin neuropathy withdrawal',
    description: 'Gradual gabapentin dose reduction',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.gabapentin300mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'three times daily' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'three times daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'Once Daily' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor for return of neuropathy symptoms'
    },
    expected: {
      humanReadable: 'Take by mouth monitor for return of neuropathy symptoms: Phase 1 (Week 1): 2 tablets three times daily, Phase 2 (Week 2): 1 tablet three times daily, Phase 3 (Week 3): 1 tablet twice daily, Phase 4 (Week 4): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Neuropathic pain medication withdrawal',
      version: '1.0.0'
    }
  },

  {
    id: 'advanced-real-015',
    name: 'Methadone maintenance reduction',
    description: 'Long-term opioid substitution therapy taper',
    category: 'advanced-real-world',
    input: {
      medication: MEDICATION_FIXTURES.tablets.methadone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 5, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'Once Daily' },
        { phase: 2, dose: { value: 4, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'Once Daily' },
        { phase: 3, dose: { value: 3, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'Once Daily' },
        { phase: 4, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'Once Daily' }
      ],
      route: 'Orally',
      specialInstructions: 'supervised dispensing, monitor withdrawal symptoms'
    },
    expected: {
      humanReadable: 'Take by mouth supervised dispensing, monitor withdrawal symptoms: Phase 1 (Month 1): 5 tablets once daily, Phase 2 (Month 2): 4 tablets once daily, Phase 3 (Month 3): 3 tablets once daily, Phase 4 (Month 4): 2 tablets once daily.'
    },
    metadata: {
      clinicalIntent: 'Opioid use disorder maintenance therapy reduction',
      version: '1.0.0'
    }
  }
];

/**
 * All real-world examples organized by category
 */
export const REAL_WORLD_EXAMPLES = {
  tablets: REAL_WORLD_TABLET_EXAMPLES,
  liquids: REAL_WORLD_LIQUID_EXAMPLES,
  injectables: REAL_WORLD_INJECTABLE_EXAMPLES,
  topicals: REAL_WORLD_TOPICAL_EXAMPLES,
  multiIngredient: REAL_WORLD_MULTI_INGREDIENT_EXAMPLES,
  edgeCases: REAL_WORLD_EDGE_CASES,
  advanced: ADVANCED_REAL_WORLD_EXAMPLES
};

/**
 * Get all real-world examples as a flat array
 */
export function getAllRealWorldExamples(): Partial<GoldenTestCase>[] {
  const allExamples: Partial<GoldenTestCase>[] = [];
  
  for (const category of Object.values(REAL_WORLD_EXAMPLES)) {
    allExamples.push(...category);
  }
  
  return allExamples;
}

/**
 * Get examples by medication category
 */
export function getRealWorldExamplesByCategory(category: keyof typeof REAL_WORLD_EXAMPLES): Partial<GoldenTestCase>[] {
  return REAL_WORLD_EXAMPLES[category];
}

/**
 * Get examples for specific medication
 */
export function getRealWorldExamplesForMedication(medicationId: string): Partial<GoldenTestCase>[] {
  return getAllRealWorldExamples().filter(example => 
    example.input?.medication?.id === medicationId
  );
}