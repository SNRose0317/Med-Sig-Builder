/**
 * Real-World Prescription Scenarios
 * 
 * Comprehensive test cases representing actual prescription scenarios that
 * healthcare providers encounter daily. These examples validate the corrected
 * FHIR packaging model against real-world clinical workflows.
 * 
 * Each scenario includes:
 * - Clinical context and rationale
 * - FHIR-compliant medication data
 * - Expected prescription output
 * - Days supply validation
 * - Pharmacy dispensing considerations
 * 
 * @since 2025-07-17 - FHIR packaging model correction
 */

import type { Medication } from '../../types';
import type { GoldenTestCase } from '../utils/golden-master-runner';

/**
 * Endocrinology & Hormone Replacement Scenarios
 */
export const ENDOCRINOLOGY_SCENARIOS: Record<string, Medication & { scenarios: Partial<GoldenTestCase>[] }> = {
  testosteroneCypionateMultiVial: {
    id: 'endo-testosterone-cyp-multivial',
    name: 'Testosterone Cypionate 200mg/mL Multi-Vial',
    type: 'medication',
    isActive: true,
    doseForm: 'Injection',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '1647574',
        display: 'Testosterone Cypionate 200 MG/ML Injectable Solution'
      }]
    },
    ingredient: [{
      name: 'Testosterone Cypionate',
      strengthRatio: {
        numerator: { value: 200, unit: 'mg' },
        denominator: { value: 1, unit: 'mL' }
      }
    }],
    concentrationRatio: {
      numerator: { value: 200, unit: 'mg' },
      denominator: { value: 1, unit: 'mL' }
    },
    // REAL-WORLD PACKAGING: Common testosterone cypionate vial configuration
    totalVolume: {
      value: 10,        // 10mL per individual vial
      unit: 'mL'
    },
    packageInfo: {
      quantity: 10,     // 10mL per vial (unit dose)
      unit: 'mL',
      packSize: 2       // 2 vials per dispensed package = 20mL total
    },
    allowedRoutes: ['intramuscular', 'subcutaneous'],
    defaultRoute: 'intramuscular',
    quantityConstraints: {
      minQty: 1,        // Minimum 1 package (2 vials)
      defaultQty: 1,    // Standard 1 package (2 vials)
      maxQty: 3         // Maximum 3 packages (6 vials) per prescription
    },
    scenarios: [
      {
        id: 'endo-tc-001',
        name: 'Standard TRT - 200mg weekly',
        description: 'Typical testosterone replacement therapy dosing',
        category: 'injection',
        input: {
          dose: { value: 200, unit: 'mg' },
          route: 'intramuscular',
          frequency: 'weekly',
          specialInstructions: 'Rotate injection sites'
        },
        expected: {
          humanReadable: 'Inject 200 mg, as 1 mL intramuscularly weekly. Rotate injection sites.',
          daysSupply: 140,  // 20mL ÷ 1mL per week = 20 weeks = 140 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Standard testosterone replacement therapy for hypogonadism',
          pharmacyNotes: 'Dispense 2 x 10mL vials (20mL total). Refrigerate until dispensed.',
          insuranceCoverage: 'Typically covered with prior authorization',
          prescribingNotes: 'Monitor testosterone levels at 6-8 weeks'
        }
      },
      {
        id: 'endo-tc-002',
        name: 'Low-dose TRT - 100mg weekly',
        description: 'Conservative starting dose for testosterone therapy',
        category: 'injection',
        input: {
          dose: { value: 100, unit: 'mg' },
          route: 'intramuscular',
          frequency: 'weekly'
        },
        expected: {
          humanReadable: 'Inject 100 mg, as 0.5 mL intramuscularly weekly.',
          daysSupply: 280,  // 20mL ÷ 0.5mL per week = 40 weeks = 280 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Conservative starting dose with room for titration',
          pharmacyNotes: 'Dispense 2 x 10mL vials. Extended supply due to low dose.',
          prescribingNotes: 'Start conservatively, may increase to 150-200mg based on levels'
        }
      },
      {
        id: 'endo-tc-003',
        name: 'Split dosing - 100mg twice weekly',
        description: 'More stable testosterone levels with split dosing',
        category: 'injection',
        input: {
          dose: { value: 100, unit: 'mg' },
          route: 'subcutaneous',
          frequency: 'twice weekly',
          specialInstructions: 'Monday and Thursday'
        },
        expected: {
          humanReadable: 'Inject 100 mg, as 0.5 mL subcutaneously twice weekly Monday and Thursday.',
          daysSupply: 140,  // 20mL ÷ 1mL per week (0.5mL × 2) = 20 weeks = 140 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Split dosing for more stable testosterone levels, reduces aromatization',
          pharmacyNotes: 'Patient will use smaller gauge needles for subcutaneous injection',
          prescribingNotes: 'Educate on subcutaneous injection technique'
        }
      }
    ]
  }
};

/**
 * Cardiology Scenarios
 */
export const CARDIOLOGY_SCENARIOS: Record<string, Medication & { scenarios: Partial<GoldenTestCase>[] }> = {
  warfarinVariableDosing: {
    id: 'cardio-warfarin-variable',
    name: 'Warfarin 5mg Variable Dosing',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '855332',
        display: 'Warfarin Sodium 5 MG Oral Tablet'
      }]
    },
    ingredient: [{
      name: 'Warfarin Sodium',
      strengthRatio: {
        numerator: { value: 5, unit: 'mg' },
        denominator: { value: 1, unit: 'tablet' }
      }
    }],
    isScored: 'QUARTER',  // Allows for precise dose adjustments
    // REAL-WORLD PACKAGING: Standard warfarin dispensing
    totalVolume: {
      value: 1,         // 1 tablet per unit
      unit: 'tablet'
    },
    packageInfo: {
      quantity: 1,      // 1 tablet per unit dose
      unit: 'tablet',
      packSize: 30      // 30 tablets per bottle (monthly supply)
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth',
    quantityConstraints: {
      minQty: 30,       // Minimum 30 tablets (1 month)
      defaultQty: 90,   // Standard 90 tablets (3 months)
      maxQty: 90        // Maximum 90 tablets per prescription
    },
    scenarios: [
      {
        id: 'cardio-warf-001',
        name: 'Warfarin initiation - 5mg daily',
        description: 'Starting dose for anticoagulation therapy',
        category: 'tablet',
        input: {
          dose: { value: 1, unit: 'tablet' },
          route: 'Orally',
          frequency: 'Once Daily',
          specialInstructions: 'Take at the same time each evening'
        },
        expected: {
          humanReadable: 'Take 1 tablet by mouth once daily. Take at the same time each evening.',
          daysSupply: 90,   // 90 tablets ÷ 1 tablet per day = 90 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Anticoagulation initiation for atrial fibrillation',
          pharmacyNotes: 'Dispense 90 tablets. Counsel on dietary vitamin K consistency.',
          prescribingNotes: 'Check INR in 3-5 days, adjust dose based on result'
        }
      },
      {
        id: 'cardio-warf-002',
        name: 'Warfarin dose reduction - 2.5mg daily',
        description: 'Dose adjustment based on INR results',
        category: 'tablet',
        input: {
          dose: { value: 0.5, unit: 'tablet' },
          route: 'Orally',
          frequency: 'Once Daily',
          specialInstructions: 'Take at the same time each evening'
        },
        expected: {
          humanReadable: 'Take 1/2 tablet by mouth once daily. Take at the same time each evening.',
          daysSupply: 180,  // 90 tablets ÷ 0.5 tablet per day = 180 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Dose reduction due to elevated INR',
          pharmacyNotes: 'Extended supply due to fractional dosing. Provide pill cutter if needed.',
          prescribingNotes: 'Recheck INR in 1 week after dose change'
        }
      },
      {
        id: 'cardio-warf-003',
        name: 'Warfarin fine-tuning - 3.75mg daily',
        description: 'Precise dose adjustment using quarter tablets',
        category: 'tablet',
        input: {
          dose: { value: 0.75, unit: 'tablet' },
          route: 'Orally',
          frequency: 'Once Daily',
          specialInstructions: 'Take at the same time each evening'
        },
        expected: {
          humanReadable: 'Take 3/4 tablet by mouth once daily. Take at the same time each evening.',
          daysSupply: 120,  // 90 tablets ÷ 0.75 tablet per day = 120 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Fine-tuning dose to achieve target INR 2.0-3.0',
          pharmacyNotes: 'Complex fractional dosing. Ensure patient understands splitting technique.',
          prescribingNotes: 'Patient requires precision pill cutter for quarter tablets'
        }
      }
    ]
  }
};

/**
 * Dermatology & Topical Scenarios
 */
export const DERMATOLOGY_SCENARIOS: Record<string, Medication & { scenarios: Partial<GoldenTestCase>[] }> = {
  testosteroneGelTopiclick: {
    id: 'derm-testosterone-gel-topiclick',
    name: 'Testosterone 1% Gel with Topiclick Dispenser',
    type: 'medication',
    isActive: true,
    doseForm: 'Gel',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: 'compound-tgel-001',
        display: 'Testosterone 1% Topical Gel with Measured Dispenser'
      }]
    },
    ingredient: [{
      name: 'Testosterone',
      strengthRatio: {
        numerator: { value: 10, unit: 'mg' },
        denominator: { value: 1, unit: 'g' }
      }
    }],
    // REAL-WORLD PACKAGING: Pump bottle with measured dispenser
    totalVolume: {
      value: 60,        // 60g per pump bottle
      unit: 'g'
    },
    packageInfo: {
      quantity: 60,     // 60g per pump bottle (unit dose)
      unit: 'g'
      // packSize: 1 (implied - single pump per package)
    },
    dispenserInfo: {
      type: 'topiclick',
      unit: 'click',
      pluralUnit: 'clicks',
      conversionRatio: 4    // 4 clicks = 1 mL = 1g
    },
    allowedRoutes: ['topical'],
    defaultRoute: 'topical',
    quantityConstraints: {
      minQty: 1,        // Minimum 1 pump (60g)
      defaultQty: 2,    // Standard 2 pumps (120g) for 3-4 month supply
      maxQty: 3         // Maximum 3 pumps (180g) per prescription
    },
    scenarios: [
      {
        id: 'derm-tgel-001',
        name: 'Standard testosterone gel - 2 clicks daily',
        description: 'Typical testosterone gel replacement therapy',
        category: 'topical',
        input: {
          dose: { value: 2, unit: 'click' },
          route: 'topical',
          frequency: 'Once Daily',
          specialInstructions: 'Apply to clean, dry skin on shoulders or upper arms'
        },
        expected: {
          humanReadable: 'Apply 2 clicks topically once daily. Apply to clean, dry skin on shoulders or upper arms.',
          daysSupply: 60,   // 60g ÷ 1g per day (2 clicks = 0.5mL = 0.5g) = 120 days per pump, 2 pumps = 240g, 240g ÷ 1g = 240 days for 2 pumps
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Testosterone replacement therapy with transdermal delivery',
          pharmacyNotes: 'Dispense 2 x 60g pumps. Educate on proper application technique.',
          prescribingNotes: 'Allow 6 hours before swimming/bathing. Avoid contact with women/children.'
        }
      },
      {
        id: 'derm-tgel-002',
        name: 'High-dose testosterone gel - 4 clicks daily',
        description: 'Higher dose for insufficient response to standard therapy',
        category: 'topical',
        input: {
          dose: { value: 4, unit: 'click' },
          route: 'topical',
          frequency: 'Once Daily',
          specialInstructions: 'Apply to clean, dry skin on shoulders and upper arms'
        },
        expected: {
          humanReadable: 'Apply 4 clicks topically once daily. Apply to clean, dry skin on shoulders and upper arms.',
          daysSupply: 120,  // 120g ÷ 1g per day (4 clicks = 1mL = 1g) = 120 days for 2 pumps
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Dose escalation for inadequate testosterone levels',
          pharmacyNotes: 'Higher dose reduces days supply. Monitor for skin irritation.',
          prescribingNotes: 'Check testosterone levels after 6-8 weeks of therapy'
        }
      },
      {
        id: 'derm-tgel-003',
        name: 'Split dosing - 2 clicks twice daily',
        description: 'Divided dosing for better absorption/tolerance',
        category: 'topical',
        input: {
          dose: { value: 2, unit: 'click' },
          route: 'topical',
          frequency: 'Twice Daily',
          specialInstructions: 'Apply morning and evening to different skin areas'
        },
        expected: {
          humanReadable: 'Apply 2 clicks topically twice daily. Apply morning and evening to different skin areas.',
          daysSupply: 60,   // 120g ÷ 2g per day (2 clicks × 2 = 1g × 2 = 2g) = 60 days for 2 pumps
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Split dosing for improved skin tolerance and steady absorption',
          pharmacyNotes: 'Educate on rotating application sites to prevent skin irritation.',
          prescribingNotes: 'May improve skin tolerance compared to single daily application'
        }
      }
    ]
  }
};

/**
 * Pediatric Scenarios
 */
export const PEDIATRIC_SCENARIOS: Record<string, Medication & { scenarios: Partial<GoldenTestCase>[] }> = {
  amoxicillinSuspension: {
    id: 'peds-amoxicillin-suspension',
    name: 'Amoxicillin 250mg/5mL Pediatric Suspension',
    type: 'medication',
    isActive: true,
    doseForm: 'Suspension',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '308182',
        display: 'Amoxicillin 250 MG per 5 ML Oral Suspension'
      }]
    },
    ingredient: [{
      name: 'Amoxicillin',
      strengthRatio: {
        numerator: { value: 250, unit: 'mg' },
        denominator: { value: 5, unit: 'mL' }
      }
    }],
    concentrationRatio: {
      numerator: { value: 250, unit: 'mg' },
      denominator: { value: 5, unit: 'mL' }
    },
    // REAL-WORLD PACKAGING: Standard pediatric suspension
    totalVolume: {
      value: 150,       // 150mL per bottle
      unit: 'mL'
    },
    packageInfo: {
      quantity: 150,    // 150mL per bottle (unit dose)
      unit: 'mL'
      // packSize: 1 (implied - single bottle per package)
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth',
    quantityConstraints: {
      minQty: 1,        // Minimum 1 bottle (150mL)
      defaultQty: 1,    // Standard 1 bottle (150mL)
      maxQty: 2         // Maximum 2 bottles (300mL) for longer treatments
    },
    scenarios: [
      {
        id: 'peds-amox-001',
        name: 'Pediatric otitis media - 500mg twice daily',
        description: 'Standard pediatric dosing for ear infection',
        category: 'liquid',
        input: {
          dose: { value: 500, unit: 'mg' },
          route: 'Orally',
          frequency: 'Twice Daily',
          specialInstructions: 'Give with food to reduce stomach upset'
        },
        expected: {
          humanReadable: 'Give 500 mg, as 10 mL by mouth twice daily. Give with food to reduce stomach upset. Shake well before use.',
          daysSupply: 7.5,  // 150mL ÷ 20mL per day (10mL × 2) = 7.5 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Treatment of acute otitis media in pediatric patient',
          pharmacyNotes: 'Provide oral syringe for accurate dosing. Refrigerate after reconstitution.',
          prescribingNotes: 'Complete full course even if symptoms improve'
        }
      },
      {
        id: 'peds-amox-002',
        name: 'Lower dose pediatric - 250mg three times daily',
        description: 'Lower dose for younger child or milder infection',
        category: 'liquid',
        input: {
          dose: { value: 250, unit: 'mg' },
          route: 'Orally',
          frequency: 'Three Times Daily',
          specialInstructions: 'Give every 8 hours'
        },
        expected: {
          humanReadable: 'Give 250 mg, as 5 mL by mouth three times daily every 8 hours. Shake well before use.',
          daysSupply: 10,   // 150mL ÷ 15mL per day (5mL × 3) = 10 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Treatment of bacterial infection with lower dose for younger child',
          pharmacyNotes: 'Longer duration due to lower dose. Provide dosing schedule.',
          prescribingNotes: 'Schedule: 6am, 2pm, 10pm or similar 8-hour intervals'
        }
      }
    ]
  }
};

/**
 * Diabetes & Endocrinology Scenarios
 */
export const DIABETES_SCENARIOS: Record<string, Medication & { scenarios: Partial<GoldenTestCase>[] }> = {
  insulinGlarginePens: {
    id: 'diabetes-insulin-glargine-pens',
    name: 'Insulin Glargine 100 units/mL Prefilled Pens',
    type: 'medication',
    isActive: true,
    doseForm: 'Injection',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '274783',
        display: 'Insulin Glargine 100 UNT/ML Injectable Solution'
      }]
    },
    ingredient: [{
      name: 'Insulin Glargine',
      strengthRatio: {
        numerator: { value: 100, unit: 'units' },
        denominator: { value: 1, unit: 'mL' }
      }
    }],
    concentrationRatio: {
      numerator: { value: 100, unit: 'units' },
      denominator: { value: 1, unit: 'mL' }
    },
    // REAL-WORLD PACKAGING: Standard insulin pen packaging
    totalVolume: {
      value: 3,         // 3mL per pen (300 units)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 3,      // 3mL per pen (unit dose)
      unit: 'mL',
      packSize: 5       // 5 pens per package (1500 units total)
    },
    allowedRoutes: ['subcutaneous'],
    defaultRoute: 'subcutaneous',
    quantityConstraints: {
      minQty: 1,        // Minimum 1 package (5 pens)
      defaultQty: 2,    // Standard 2 packages (10 pens) for 3-month supply
      maxQty: 3         // Maximum 3 packages (15 pens) per prescription
    },
    scenarios: [
      {
        id: 'diabetes-insulin-001',
        name: 'Basal insulin initiation - 20 units bedtime',
        description: 'Starting dose of long-acting insulin',
        category: 'injection',
        input: {
          dose: { value: 20, unit: 'units' },
          route: 'subcutaneous',
          frequency: 'Once Daily',
          specialInstructions: 'Inject at bedtime, rotate injection sites'
        },
        expected: {
          humanReadable: 'Inject 20 units, as 0.2 mL subcutaneously once daily. Inject at bedtime, rotate injection sites.',
          daysSupply: 75,   // 1500 units ÷ 20 units per day = 75 days per package
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Basal insulin initiation for type 2 diabetes',
          pharmacyNotes: 'Dispense 5 pens (1500 units). Provide pen needles and alcohol swabs.',
          prescribingNotes: 'Titrate by 2-4 units every 3 days based on fasting glucose'
        }
      },
      {
        id: 'diabetes-insulin-002',
        name: 'Established therapy - 45 units bedtime',
        description: 'Titrated dose for established insulin therapy',
        category: 'injection',
        input: {
          dose: { value: 45, unit: 'units' },
          route: 'subcutaneous',
          frequency: 'Once Daily',
          specialInstructions: 'Inject at bedtime'
        },
        expected: {
          humanReadable: 'Inject 45 units, as 0.45 mL subcutaneously once daily. Inject at bedtime.',
          daysSupply: 100,  // 3000 units (2 packages) ÷ 45 units per day = 66.7 days per package, 2 packages = 133 days
          fhirCompliant: true
        },
        metadata: {
          clinicalIntent: 'Established basal insulin therapy with titrated dose',
          pharmacyNotes: 'Higher dose reduces pen duration. Ensure adequate supply.',
          prescribingNotes: 'Stable dose, monitor A1C every 3 months'
        }
      }
    ]
  }
};

/**
 * All Real-World Prescription Scenarios
 */
export const REAL_WORLD_PRESCRIPTION_SCENARIOS = {
  endocrinology: ENDOCRINOLOGY_SCENARIOS,
  cardiology: CARDIOLOGY_SCENARIOS,
  dermatology: DERMATOLOGY_SCENARIOS,
  pediatrics: PEDIATRIC_SCENARIOS,
  diabetes: DIABETES_SCENARIOS
};

/**
 * Get all real-world test cases as a flat array
 */
export function getAllRealWorldTestCases(): Partial<GoldenTestCase>[] {
  const allTestCases: Partial<GoldenTestCase>[] = [];
  
  for (const specialty of Object.values(REAL_WORLD_PRESCRIPTION_SCENARIOS)) {
    for (const medication of Object.values(specialty)) {
      if ('scenarios' in medication && medication.scenarios) {
        // Add medication reference to each scenario
        medication.scenarios.forEach(scenario => {
          if (scenario.input) {
            scenario.input.medication = medication;
          }
        });
        allTestCases.push(...medication.scenarios);
      }
    }
  }
  
  return allTestCases;
}

/**
 * Get all real-world medications as a flat array
 */
export function getAllRealWorldMedications(): Medication[] {
  const allMedications: Medication[] = [];
  
  for (const specialty of Object.values(REAL_WORLD_PRESCRIPTION_SCENARIOS)) {
    for (const medication of Object.values(specialty)) {
      // Remove scenarios property for medication array
      const { scenarios, ...medicationData } = medication;
      allMedications.push(medicationData);
    }
  }
  
  return allMedications;
}