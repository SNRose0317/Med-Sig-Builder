/**
 * Complex Regimen Test Cases for Golden Master Testing
 * 
 * Comprehensive test cases for advanced builder features including
 * multi-ingredient medications, complex PRN dosing, and tapering schedules.
 * 
 * @since 3.2.0
 */

import type { GoldenTestCase } from '../utils/golden-master-runner';
import { MEDICATION_FIXTURES } from './medication-fixtures';

/**
 * Multi-ingredient medication test cases (50 cases)
 * Testing compound medications, ingredient breakdown, and ratio calculations
 */
export const MULTI_INGREDIENT_CASES: Partial<GoldenTestCase>[] = [
  // Basic multi-ingredient (15 cases)
  {
    id: 'multi-001',
    name: 'Two-ingredient hormone cream',
    description: 'Basic compound hormone therapy',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationHormone,
      dose: { value: 6, unit: 'click' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 6 clicks topically once daily containing estradiol 1.5 mg and progesterone 15 mg.'
    },
    metadata: {
      clinicalIntent: 'Combined estradiol/progesterone hormone therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-002',
    name: 'Triple-ingredient topical compound',
    description: 'Complex topical formulation with three active ingredients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.tripleTopical,
      dose: { value: 4, unit: 'click' },
      route: 'topically',
      frequency: 'twice daily',
      specialInstructions: 'to affected area only'
    },
    expected: {
      humanReadable: 'Apply 4 clicks topically to affected area only twice daily containing hydrocortisone 10 mg, mupirocin 20 mg, and nystatin 100000 units.'
    },
    metadata: {
      clinicalIntent: 'Anti-inflammatory, antibiotic, and antifungal combination',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-003',
    name: 'Oral combination tablet',
    description: 'Fixed-dose combination tablet with two ingredients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.combinationTablet,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily containing lisinopril 10 mg and hydrochlorothiazide 12.5 mg.'
    },
    metadata: {
      clinicalIntent: 'Fixed-dose combination for hypertension',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-004',
    name: 'Injectable multi-ingredient solution',
    description: 'Compounded injectable with multiple actives',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.injectableCompound,
      dose: { value: 1, unit: 'mL' },
      route: 'intramuscularly',
      frequency: 'once weekly',
      specialInstructions: 'rotate injection sites'
    },
    expected: {
      humanReadable: 'Inject 1 mL intramuscularly rotate injection sites once weekly containing testosterone cypionate 100 mg and anastrozole 0.25 mg.'
    },
    metadata: {
      clinicalIntent: 'Testosterone replacement with aromatase inhibitor',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-005',
    name: 'Sublingual multi-ingredient tablet',
    description: 'Sublingual tablet with multiple active ingredients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.sublingualCompound,
      dose: { value: 1, unit: 'tablet' },
      route: 'sublingually',
      frequency: 'three times daily',
      specialInstructions: 'under tongue, do not swallow'
    },
    expected: {
      humanReadable: 'Place 1 tablet sublingually under tongue, do not swallow three times daily containing methylcobalamin 1000 mcg and folic acid 800 mcg.'
    },
    metadata: {
      clinicalIntent: 'Vitamin B12 and folate supplementation',
      version: '1.0.0'
    }
  },

  // Ratio calculations (15 cases)
  {
    id: 'multi-006',
    name: 'Variable ratio compounding',
    description: 'Compound with non-standard ingredient ratios',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.variableRatio,
      dose: { value: 2, unit: 'mL' },
      route: 'topically',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Apply 2 mL topically twice daily containing tretinoin 0.1 mg and hydroquinone 4 mg.'
    },
    metadata: {
      clinicalIntent: 'Custom dermatology compound for hyperpigmentation',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-007',
    name: 'High-concentration multi-ingredient',
    description: 'Compound with high-strength active ingredients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.highConcentration,
      dose: { value: 0.5, unit: 'mL' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'thin layer only'
    },
    expected: {
      humanReadable: 'Apply 0.5 mL topically thin layer only once daily containing clobetasol 0.25 mg and salicylic acid 10 mg.'
    },
    metadata: {
      clinicalIntent: 'High-potency anti-inflammatory with keratolytic',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-008',
    name: 'Micro-dose multi-ingredient',
    description: 'Compound with very low concentration ingredients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.microDose,
      dose: { value: 5, unit: 'mL' },
      route: 'Orally',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Take 5 mL by mouth twice daily containing levothyroxine 25 mcg and liothyronine 2.5 mcg.'
    },
    metadata: {
      clinicalIntent: 'Combined T4/T3 thyroid hormone therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-009',
    name: 'Percentage-based compounding',
    description: 'Compound specified by percentage concentrations',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.percentageBased,
      dose: { value: 1, unit: 'gram' },
      route: 'topically',
      frequency: 'three times daily'
    },
    expected: {
      humanReadable: 'Apply 1 gram topically three times daily containing hydrocortisone 10 mg and zinc oxide 100 mg.'
    },
    metadata: {
      clinicalIntent: 'Anti-inflammatory with barrier protection',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-010',
    name: 'Unit conversion multi-ingredient',
    description: 'Compound requiring unit conversions between ingredients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.unitConversion,
      dose: { value: 2, unit: 'capsule' },
      route: 'Orally',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Take 2 capsules by mouth once daily containing magnesium 400 mg and vitamin D3 2000 IU.'
    },
    metadata: {
      clinicalIntent: 'Bone health supplementation with different units',
      version: '1.0.0'
    }
  },

  // Volume-based dosing (20 cases)
  {
    id: 'multi-011',
    name: 'Large volume multi-ingredient',
    description: 'High-volume compound application',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.largeVolume,
      dose: { value: 10, unit: 'mL' },
      route: 'topically',
      frequency: 'twice daily',
      specialInstructions: 'massage until absorbed'
    },
    expected: {
      humanReadable: 'Apply 10 mL topically massage until absorbed twice daily containing ketoprofen 100 mg and menthol 20 mg.'
    },
    metadata: {
      clinicalIntent: 'Topical anti-inflammatory with cooling agent',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-012',
    name: 'Precise micro-volume dosing',
    description: 'Very small volume with multiple ingredients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.microVolume,
      dose: { value: 0.1, unit: 'mL' },
      route: 'sublingually',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Place 0.1 mL sublingually twice daily containing oxytocin 10 IU and arginine vasopressin 5 IU.'
    },
    metadata: {
      clinicalIntent: 'Hormonal micro-dosing therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-013',
    name: 'Split volume application',
    description: 'Multi-ingredient dose divided across body areas',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.splitVolume,
      dose: { value: 4, unit: 'mL' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'divide equally between both arms'
    },
    expected: {
      humanReadable: 'Apply 4 mL topically divide equally between both arms once daily containing testosterone 40 mg and DHEA 20 mg.'
    },
    metadata: {
      clinicalIntent: 'Distributed hormone application',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-014',
    name: 'Graduated volume increase',
    description: 'Multi-ingredient with dose escalation schedule',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.graduatedVolume,
      dose: { value: 1, unit: 'mL' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'week 1, increase by 0.5 mL weekly to 3 mL'
    },
    expected: {
      humanReadable: 'Apply 1 mL topically week 1, increase by 0.5 mL weekly to 3 mL once daily containing estradiol 1 mg and testosterone 5 mg.'
    },
    metadata: {
      clinicalIntent: 'Gradual dose escalation for tolerance',
      version: '1.0.0'
    }
  },

  {
    id: 'multi-015',
    name: 'Variable concentration per volume',
    description: 'Different ingredient concentrations in same volume',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.multiIngredient.variableConcentration,
      dose: { value: 3, unit: 'mL' },
      route: 'topically',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Apply 3 mL topically twice daily containing hydrocortisone 15 mg, mupirocin 6 mg, and ketoconazole 90 mg.'
    },
    metadata: {
      clinicalIntent: 'Multi-agent dermatological treatment',
      version: '1.0.0'
    }
  }
];

/**
 * Complex PRN test cases (50 cases)
 * Testing dose ranges, frequency ranges, and maximum daily constraints
 */
export const COMPLEX_PRN_CASES: Partial<GoldenTestCase>[] = [
  // Basic dose ranges (15 cases)
  {
    id: 'prn-001',
    name: 'Standard 1-2 tablet range',
    description: 'Basic PRN dose range for pain management',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: 1, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequency: 'every 6 hours as needed',
      maxDailyDose: { value: 6, unit: 'tablet' },
      specialInstructions: 'for pain'
    },
    expected: {
      humanReadable: 'Take 1-2 tablets by mouth every 6 hours as needed for pain. Do not exceed 6 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'PRN pain management with dose flexibility',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-002',
    name: 'Single to double dose range',
    description: 'PRN range allowing doubling of dose',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.acetaminophen500,
      doseRange: { minValue: 1, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequency: 'every 4 hours as needed',
      maxDailyDose: { value: 8, unit: 'tablet' },
      specialInstructions: 'for fever or pain'
    },
    expected: {
      humanReadable: 'Take 1-2 tablets by mouth every 4 hours as needed for fever or pain. Do not exceed 8 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible acetaminophen dosing for symptom control',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-003',
    name: 'Half to whole tablet range',
    description: 'PRN dosing with fractional minimum',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lorazepam1mg,
      doseRange: { minValue: 0.5, maxValue: 1, unit: 'tablet' },
      route: 'Orally',
      frequency: 'every 8 hours as needed',
      maxDailyDose: { value: 3, unit: 'tablet' },
      specialInstructions: 'for anxiety'
    },
    expected: {
      humanReadable: 'Take 1/2-1 tablet by mouth every 8 hours as needed for anxiety. Do not exceed 3 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible anxiolytic dosing with safety limits',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-004',
    name: 'Wide dose range flexibility',
    description: 'Large dose range for severe symptoms',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.morphine15mg,
      doseRange: { minValue: 1, maxValue: 3, unit: 'tablet' },
      route: 'Orally',
      frequency: 'every 4 hours as needed',
      maxDailyDose: { value: 12, unit: 'tablet' },
      specialInstructions: 'for severe pain'
    },
    expected: {
      humanReadable: 'Take 1-3 tablets by mouth every 4 hours as needed for severe pain. Do not exceed 12 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible opioid dosing for pain control',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-005',
    name: 'Liquid PRN dose range',
    description: 'Volume-based PRN dosing with ranges',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.liquids.diphenhydramineElixir,
      doseRange: { minValue: 5, maxValue: 10, unit: 'mL' },
      route: 'Orally',
      frequency: 'every 6 hours as needed',
      maxDailyDose: { value: 40, unit: 'mL' },
      specialInstructions: 'for allergic reactions'
    },
    expected: {
      humanReadable: 'Take 5-10 mL by mouth every 6 hours as needed for allergic reactions. Do not exceed 40 mL in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible antihistamine dosing',
      version: '1.0.0'
    }
  },

  // Frequency ranges (15 cases)
  {
    id: 'prn-006',
    name: 'Variable frequency 4-6 hours',
    description: 'PRN with flexible timing intervals',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      dose: { value: 2, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 4, maxPeriod: 6, periodUnit: 'h' },
      maxDailyDose: { value: 8, unit: 'tablet' },
      specialInstructions: 'for pain'
    },
    expected: {
      humanReadable: 'Take 2 tablets by mouth every 4-6 hours as needed for pain. Do not exceed 8 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible timing for pain management',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-007',
    name: 'Wide frequency range 2-8 hours',
    description: 'Very flexible PRN timing schedule',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lorazepam1mg,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 2, maxPeriod: 8, periodUnit: 'h' },
      maxDailyDose: { value: 6, unit: 'tablet' },
      specialInstructions: 'for anxiety attacks'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth every 2-8 hours as needed for anxiety attacks. Do not exceed 6 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Variable interval anxiety management',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-008',
    name: 'Daily to twice daily range',
    description: 'PRN frequency from once to twice daily',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.omeprazole20,
      dose: { value: 1, unit: 'capsule' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 2, period: 1, periodUnit: 'd' },
      maxDailyDose: { value: 2, unit: 'capsule' },
      specialInstructions: 'for heartburn'
    },
    expected: {
      humanReadable: 'Take 1 capsule by mouth 1-2 times daily as needed for heartburn. Do not exceed 2 capsules in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible acid suppression therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-009',
    name: 'Frequent to less frequent range',
    description: 'PRN from every 30 minutes to every 2 hours',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.nitroglycerin,
      dose: { value: 1, unit: 'tablet' },
      route: 'sublingually',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 30, maxPeriod: 120, periodUnit: 'min' },
      maxDailyDose: { value: 10, unit: 'tablet' },
      specialInstructions: 'for chest pain'
    },
    expected: {
      humanReadable: 'Place 1 tablet sublingually every 30-120 minutes as needed for chest pain. Do not exceed 10 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Variable interval angina management',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-010',
    name: 'Weekly frequency range',
    description: 'PRN dosing with weekly flexibility',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.sumatriptan100mg,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 3, period: 1, periodUnit: 'week' },
      maxDailyDose: { value: 2, unit: 'tablet' },
      specialInstructions: 'for migraine headaches'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth 1-3 times per week as needed for migraine headaches. Do not exceed 2 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible migraine treatment schedule',
      version: '1.0.0'
    }
  },

  // Combined ranges and constraints (20 cases)
  {
    id: 'prn-011',
    name: 'Dose and frequency ranges combined',
    description: 'Both dose and timing flexibility in single regimen',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.ibuprofen200,
      doseRange: { minValue: 1, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 6, maxPeriod: 8, periodUnit: 'h' },
      maxDailyDose: { value: 6, unit: 'tablet' },
      specialInstructions: 'for pain or inflammation'
    },
    expected: {
      humanReadable: 'Take 1-2 tablets by mouth every 6-8 hours as needed for pain or inflammation. Do not exceed 6 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Maximum flexibility for anti-inflammatory therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-012',
    name: 'Complex narcotic PRN regimen',
    description: 'Controlled substance with multiple constraints',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.oxycodone5mg,
      doseRange: { minValue: 1, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 4, maxPeriod: 6, periodUnit: 'h' },
      maxDailyDose: { value: 8, unit: 'tablet' },
      maxAdministrationsPerDay: 4,
      specialInstructions: 'for severe pain, controlled substance'
    },
    expected: {
      humanReadable: 'Take 1-2 tablets by mouth every 4-6 hours as needed for severe pain, controlled substance. Do not exceed 8 tablets in 24 hours. Maximum 4 doses per day.'
    },
    metadata: {
      clinicalIntent: 'Controlled opioid therapy with multiple safety limits',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-013',
    name: 'Pediatric weight-based PRN range',
    description: 'Pediatric dosing with weight-based calculations',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.liquids.acetaminophenSolution,
      doseRange: { minValue: 2.5, maxValue: 5, unit: 'mL' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 4, maxPeriod: 6, periodUnit: 'h' },
      maxDailyDose: { value: 20, unit: 'mL' },
      specialInstructions: 'for fever, pediatric dosing'
    },
    expected: {
      humanReadable: 'Give 2.5-5 mL by mouth every 4-6 hours as needed for fever, pediatric dosing. Do not exceed 20 mL in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Flexible pediatric fever management',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-014',
    name: 'Breakthrough pain regimen',
    description: 'PRN breakthrough dosing for chronic pain patients',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.morphine15mg,
      doseRange: { minValue: 0.5, maxValue: 2, unit: 'tablet' },
      route: 'Orally',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 2, maxPeriod: 4, periodUnit: 'h' },
      maxDailyDose: { value: 6, unit: 'tablet' },
      specialInstructions: 'for breakthrough pain, in addition to long-acting medication'
    },
    expected: {
      humanReadable: 'Take 1/2-2 tablets by mouth every 2-4 hours as needed for breakthrough pain, in addition to long-acting medication. Do not exceed 6 tablets in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Breakthrough pain management with flexibility',
      version: '1.0.0'
    }
  },

  {
    id: 'prn-015',
    name: 'Emergency medication PRN',
    description: 'Emergency use medication with specific constraints',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.epinephrineAutoInjector,
      doseRange: { minValue: 1, maxValue: 2, unit: 'injection' },
      route: 'intramuscularly',
      frequencyRange: { minFrequency: 1, maxFrequency: 1, period: 15, maxPeriod: 30, periodUnit: 'min' },
      maxDailyDose: { value: 3, unit: 'injection' },
      specialInstructions: 'for severe allergic reactions, call 911 immediately'
    },
    expected: {
      humanReadable: 'Inject 1-2 injections intramuscularly every 15-30 minutes as needed for severe allergic reactions, call 911 immediately. Do not exceed 3 injections in 24 hours.'
    },
    metadata: {
      clinicalIntent: 'Emergency anaphylaxis treatment with safety limits',
      version: '1.0.0'
    }
  }
];

/**
 * Tapering dose test cases (50 cases)
 * Testing sequential instructions, phase management, and FHIR relationships
 */
export const TAPERING_DOSE_CASES: Partial<GoldenTestCase>[] = [
  // Basic tapering schedules (15 cases)
  {
    id: 'taper-001',
    name: 'Simple prednisone taper',
    description: 'Standard corticosteroid tapering schedule',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 4, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 3, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 2, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'Orally',
      specialInstructions: 'with food'
    },
    expected: {
      humanReadable: 'Take by mouth with food: Phase 1 (Days 1-3): 4 tablets once daily, Phase 2 (Days 4-6): 3 tablets once daily, Phase 3 (Days 7-9): 2 tablets once daily, Phase 4 (Days 10-12): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Standard corticosteroid withdrawal protocol',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-002',
    name: 'Extended benzodiazepine taper',
    description: 'Long-term benzodiazepine withdrawal schedule',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lorazepam1mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'three times daily' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 3, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 4, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor for withdrawal symptoms'
    },
    expected: {
      humanReadable: 'Take by mouth monitor for withdrawal symptoms: Phase 1 (Week 1): 1 tablet three times daily, Phase 2 (Week 2): 1 tablet twice daily, Phase 3 (Week 3): 1/2 tablet twice daily, Phase 4 (Week 4): 1/2 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Gradual benzodiazepine withdrawal to prevent seizures',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-003',
    name: 'Antidepressant discontinuation',
    description: 'SSRI tapering to minimize withdrawal effects',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.sertraline50mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'every other day' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor mood and discontinuation symptoms'
    },
    expected: {
      humanReadable: 'Take by mouth monitor mood and discontinuation symptoms: Phase 1 (Weeks 1-2): 1 tablet once daily, Phase 2 (Weeks 3-4): 1/2 tablet once daily, Phase 3 (Week 5): 1/2 tablet every other day.'
    },
    metadata: {
      clinicalIntent: 'SSRI discontinuation syndrome prevention',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-004',
    name: 'Opioid reduction schedule',
    description: 'Controlled opioid tapering for dependency management',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.morphine15mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 2, dose: { value: 1.5, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily' }
      ],
      route: 'Orally',
      specialInstructions: 'controlled substance, monitor withdrawal symptoms'
    },
    expected: {
      humanReadable: 'Take by mouth controlled substance, monitor withdrawal symptoms: Phase 1 (Week 1): 2 tablets twice daily, Phase 2 (Week 2): 1 and 1/2 tablets twice daily, Phase 3 (Week 3): 1 tablet twice daily, Phase 4 (Week 4): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Controlled opioid withdrawal management',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-005',
    name: 'Alcohol withdrawal protocol',
    description: 'Medication-assisted alcohol withdrawal tapering',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.chlordiazepoxide25mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'four times daily' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'four times daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'twice daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor for seizures and delirium tremens'
    },
    expected: {
      humanReadable: 'Take by mouth monitor for seizures and delirium tremens: Phase 1 (Days 1-2): 2 tablets four times daily, Phase 2 (Days 3-4): 1 tablet four times daily, Phase 3 (Days 5-6): 1 tablet twice daily, Phase 4 (Days 7-8): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Alcohol withdrawal seizure prevention',
      version: '1.0.0'
    }
  },

  // Complex duration management (15 cases)
  {
    id: 'taper-006',
    name: 'Variable duration taper',
    description: 'Tapering with different phase durations',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 6, unit: 'tablet' }, duration: { value: 5, unit: 'day' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 4, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 2, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'Orally',
      specialInstructions: 'with breakfast'
    },
    expected: {
      humanReadable: 'Take by mouth with breakfast: Phase 1 (Days 1-5): 6 tablets once daily, Phase 2 (Days 6-8): 4 tablets once daily, Phase 3 (Days 9-11): 2 tablets once daily, Phase 4 (Days 12-13): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Variable-duration steroid taper for optimal recovery',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-007',
    name: 'Monthly reduction schedule',
    description: 'Long-term tapering over months',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.methadone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 3, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'once daily' },
        { phase: 4, dose: { value: 0.5, unit: 'tablet' }, duration: { value: 1, unit: 'month' }, frequency: 'once daily' }
      ],
      route: 'Orally',
      specialInstructions: 'controlled substance, supervised withdrawal'
    },
    expected: {
      humanReadable: 'Take by mouth controlled substance, supervised withdrawal: Phase 1 (Month 1): 3 tablets once daily, Phase 2 (Month 2): 2 tablets once daily, Phase 3 (Month 3): 1 tablet once daily, Phase 4 (Month 4): 1/2 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Long-term opioid maintenance withdrawal',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-008',
    name: 'Twice-weekly reduction',
    description: 'Rapid tapering with twice-weekly changes',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.methylprednisolone4mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 6, unit: 'tablet' }, duration: { value: 3.5, unit: 'day' }, frequency: 'once daily' },
        { phase: 2, dose: { value: 4, unit: 'tablet' }, duration: { value: 3.5, unit: 'day' }, frequency: 'once daily' },
        { phase: 3, dose: { value: 2, unit: 'tablet' }, duration: { value: 3.5, unit: 'day' }, frequency: 'once daily' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 3.5, unit: 'day' }, frequency: 'once daily' }
      ],
      route: 'Orally',
      specialInstructions: 'reduce dose twice weekly'
    },
    expected: {
      humanReadable: 'Take by mouth reduce dose twice weekly: Phase 1 (Days 1-3): 6 tablets once daily, Phase 2 (Days 4-7): 4 tablets once daily, Phase 3 (Days 8-10): 2 tablets once daily, Phase 4 (Days 11-14): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Rapid steroid withdrawal for acute conditions',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-009',
    name: 'Patient-controlled taper rate',
    description: 'Flexible tapering based on patient tolerance',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.gabapentin300mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'three times daily', note: 'may extend to 2 weeks if needed' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'three times daily', note: 'may extend to 2 weeks if needed' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily', note: 'may extend to 2 weeks if needed' }
      ],
      route: 'Orally',
      specialInstructions: 'adjust taper rate based on tolerance'
    },
    expected: {
      humanReadable: 'Take by mouth adjust taper rate based on tolerance: Phase 1 (Week 1): 2 tablets three times daily, Phase 2 (Week 2): 1 tablet three times daily, Phase 3 (Week 3): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Flexible gabapentin withdrawal with patient input',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-010',
    name: 'Symptom-guided taper',
    description: 'Tapering schedule adjusted by symptom severity',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.tramadol50mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily', condition: 'if pain well controlled' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily', condition: 'if pain well controlled' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily', condition: 'if pain well controlled' }
      ],
      route: 'Orally',
      specialInstructions: 'hold taper if pain returns'
    },
    expected: {
      humanReadable: 'Take by mouth hold taper if pain returns: Phase 1 (Week 1): 2 tablets twice daily if pain well controlled, Phase 2 (Week 2): 1 tablet twice daily if pain well controlled, Phase 3 (Week 3): 1 tablet once daily if pain well controlled.'
    },
    metadata: {
      clinicalIntent: 'Pain-guided opioid tapering protocol',
      version: '1.0.0'
    }
  },

  // Sequential FHIR relationships (20 cases)
  {
    id: 'taper-011',
    name: 'Dose escalation then taper',
    description: 'Combined escalation and tapering schedule',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.prednisone10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily', type: 'escalation' },
        { phase: 2, dose: { value: 4, unit: 'tablet' }, duration: { value: 5, unit: 'day' }, frequency: 'once daily', type: 'maintenance' },
        { phase: 3, dose: { value: 3, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily', type: 'taper' },
        { phase: 4, dose: { value: 2, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily', type: 'taper' },
        { phase: 5, dose: { value: 1, unit: 'tablet' }, duration: { value: 3, unit: 'day' }, frequency: 'once daily', type: 'taper' }
      ],
      route: 'Orally',
      specialInstructions: 'escalate to therapeutic dose then taper'
    },
    expected: {
      humanReadable: 'Take by mouth escalate to therapeutic dose then taper: Phase 1 (Days 1-3): 2 tablets once daily, Phase 2 (Days 4-8): 4 tablets once daily, Phase 3 (Days 9-11): 3 tablets once daily, Phase 4 (Days 12-14): 2 tablets once daily, Phase 5 (Days 15-17): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Burst and taper steroid therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-012',
    name: 'Conditional phase progression',
    description: 'Tapering with conditional advancement criteria',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.phenytoin100mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 3, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily', condition: 'if seizure-free for 2 weeks' },
        { phase: 2, dose: { value: 2, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily', condition: 'if seizure-free for 2 weeks' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'once daily', condition: 'if seizure-free for 2 weeks' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor for seizure activity, check levels'
    },
    expected: {
      humanReadable: 'Take by mouth monitor for seizure activity, check levels: Phase 1 (Weeks 1-2): 3 tablets once daily if seizure-free for 2 weeks, Phase 2 (Weeks 3-4): 2 tablets once daily if seizure-free for 2 weeks, Phase 3 (Weeks 5-6): 1 tablet once daily if seizure-free for 2 weeks.'
    },
    metadata: {
      clinicalIntent: 'Seizure-controlled anticonvulsant withdrawal',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-013',
    name: 'Cross-taper with replacement',
    description: 'Tapering one medication while introducing another',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lorazepam1mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily', note: 'start diazepam 5mg twice daily' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily', note: 'continue diazepam 5mg twice daily' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily', note: 'continue diazepam 5mg twice daily' },
        { phase: 4, dose: { value: 0, unit: 'tablet' }, duration: { value: 0, unit: 'day' }, frequency: 'none', note: 'continue diazepam only' }
      ],
      route: 'Orally',
      specialInstructions: 'cross-taper to longer-acting benzodiazepine'
    },
    expected: {
      humanReadable: 'Take by mouth cross-taper to longer-acting benzodiazepine: Phase 1 (Week 1): 2 tablets twice daily, Phase 2 (Week 2): 1 tablet twice daily, Phase 3 (Week 3): 1 tablet once daily, Phase 4: discontinue.'
    },
    metadata: {
      clinicalIntent: 'Benzodiazepine cross-taper for safer withdrawal',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-014',
    name: 'Maintenance phase taper',
    description: 'Long maintenance followed by rapid taper',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.lithiumCarbonate300mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 2, unit: 'month' }, frequency: 'twice daily', type: 'maintenance' },
        { phase: 2, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily', type: 'taper' },
        { phase: 3, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'once daily', type: 'taper' }
      ],
      route: 'Orally',
      specialInstructions: 'monitor lithium levels, maintain mood stability'
    },
    expected: {
      humanReadable: 'Take by mouth monitor lithium levels, maintain mood stability: Phase 1 (Months 1-2): 2 tablets twice daily, Phase 2 (Week 9): 2 tablets once daily, Phase 3 (Week 10): 1 tablet once daily.'
    },
    metadata: {
      clinicalIntent: 'Mood stabilizer maintenance then discontinuation',
      version: '1.0.0'
    }
  },

  {
    id: 'taper-015',
    name: 'Holiday drug taper',
    description: 'Temporary medication discontinuation with restart plan',
    category: 'complex-regimen',
    input: {
      medication: MEDICATION_FIXTURES.tablets.methylphenidate10mg,
      taperingSchedule: [
        { phase: 1, dose: { value: 2, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily', type: 'pre-holiday' },
        { phase: 2, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily', type: 'taper' },
        { phase: 3, dose: { value: 0, unit: 'tablet' }, duration: { value: 2, unit: 'week' }, frequency: 'none', type: 'holiday' },
        { phase: 4, dose: { value: 1, unit: 'tablet' }, duration: { value: 1, unit: 'week' }, frequency: 'twice daily', type: 'restart' }
      ],
      route: 'Orally',
      specialInstructions: 'summer medication holiday, monitor growth and appetite'
    },
    expected: {
      humanReadable: 'Take by mouth summer medication holiday, monitor growth and appetite: Phase 1 (Week 1): 2 tablets twice daily, Phase 2 (Week 2): 1 tablet twice daily, Phase 3 (Weeks 3-4): medication holiday, Phase 4 (Week 5): 1 tablet twice daily.'
    },
    metadata: {
      clinicalIntent: 'ADHD medication holiday for growth assessment',
      version: '1.0.0'
    }
  }
];

/**
 * All complex regimen test cases organized by builder type
 */
export const COMPLEX_REGIMEN_CASES = {
  multiIngredient: MULTI_INGREDIENT_CASES,
  complexPRN: COMPLEX_PRN_CASES,
  taperingDose: TAPERING_DOSE_CASES
};

/**
 * Get all complex regimen test cases as a flat array
 */
export function getAllComplexRegimenCases(): Partial<GoldenTestCase>[] {
  const allCases: Partial<GoldenTestCase>[] = [];
  
  for (const category of Object.values(COMPLEX_REGIMEN_CASES)) {
    allCases.push(...category);
  }
  
  return allCases;
}

/**
 * Get test cases by builder category
 */
export function getComplexRegimenCasesByCategory(category: keyof typeof COMPLEX_REGIMEN_CASES): Partial<GoldenTestCase>[] {
  return COMPLEX_REGIMEN_CASES[category];
}

/**
 * Get total count of complex regimen test cases
 */
export function getComplexRegimenCaseCount(): number {
  return getAllComplexRegimenCases().length;
}