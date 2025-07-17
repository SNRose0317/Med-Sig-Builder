/**
 * FHIR R4 Compliant Medication Test Examples
 * 
 * Comprehensive test cases that validate the corrected FHIR packaging model
 * and ensure accurate days supply calculations. These examples represent
 * real-world scenarios using proper FHIR R4 medication packaging standards.
 * 
 * Updated: 2025-07-17 - Corrected FHIR packaging model implementation
 * 
 * @see {@link ../../types/README.md} FHIR packaging documentation
 */

import type { Medication } from '../../types';
import type { GoldenTestCase } from '../utils/golden-master-runner';

/**
 * FHIR-Compliant Injectable Medications
 * 
 * Tests the corrected FHIR packaging model for injectables where:
 * - totalVolume: Individual vial/ampule volume
 * - packageInfo.quantity: Unit dose volume (matches totalVolume)
 * - packageInfo.packSize: Number of vials/ampules per package
 */
export const FHIR_INJECTABLE_MEDICATIONS: Record<string, Medication> = {
  testosteroneCypionate: {
    id: 'fhir-testosterone-cyp',
    name: 'Testosterone Cypionate 200mg/mL',
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
    // FHIR R4 Compliant Packaging Model
    totalVolume: {
      value: 10,        // 10mL per individual vial (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 10,     // 10mL per individual vial (unit dose)
      unit: 'mL',
      packSize: 2       // 2 vials per package (total dispensed = 20mL)
    },
    allowedRoutes: ['intramuscular'],
    defaultRoute: 'intramuscular'
  },

  morphineAmpule: {
    id: 'fhir-morphine-amp',
    name: 'Morphine 10mg/mL Ampule',
    type: 'medication',
    isActive: true,
    doseForm: 'Injection',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '1666777',
        display: 'Morphine Sulfate 10 MG/ML Injectable Solution'
      }]
    },
    ingredient: [{
      name: 'Morphine Sulfate',
      strengthRatio: {
        numerator: { value: 10, unit: 'mg' },
        denominator: { value: 1, unit: 'mL' }
      }
    }],
    concentrationRatio: {
      numerator: { value: 10, unit: 'mg' },
      denominator: { value: 1, unit: 'mL' }
    },
    // FHIR R4 Compliant: Single-dose ampules
    totalVolume: {
      value: 1,         // 1mL per ampule (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 1,      // 1mL per ampule (unit dose)
      unit: 'mL',
      packSize: 10      // 10 ampules per package (total = 10mL)
    },
    allowedRoutes: ['intravenous', 'intramuscular', 'subcutaneous'],
    defaultRoute: 'intravenous'
  },

  insulinPen: {
    id: 'fhir-insulin-pen',
    name: 'Insulin Glargine 100 units/mL Pen',
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
    // FHIR R4 Compliant: Pre-filled pen
    totalVolume: {
      value: 3,         // 3mL per pen (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 3,      // 3mL per pen (unit dose)
      unit: 'mL',
      packSize: 5       // 5 pens per package (total = 15mL)
    },
    allowedRoutes: ['subcutaneous'],
    defaultRoute: 'subcutaneous'
  }
};

/**
 * FHIR-Compliant Tablet Medications
 * 
 * Tests proper tablet packaging where quantity represents individual tablets
 * and packSize represents total tablets per bottle/package.
 */
export const FHIR_TABLET_MEDICATIONS: Record<string, Medication> = {
  atorvastatin: {
    id: 'fhir-atorvastatin',
    name: 'Atorvastatin 40mg',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '617310',
        display: 'Atorvastatin 40 MG Oral Tablet'
      }]
    },
    ingredient: [{
      name: 'Atorvastatin Calcium',
      strengthRatio: {
        numerator: { value: 40, unit: 'mg' },
        denominator: { value: 1, unit: 'tablet' }
      }
    }],
    isScored: 'HALF',
    // FHIR R4 Compliant: Standard tablet packaging
    totalVolume: {
      value: 1,         // 1 tablet per unit (FHIR totalVolume)
      unit: 'tablet'
    },
    packageInfo: {
      quantity: 1,      // 1 tablet per unit dose
      unit: 'tablet',
      packSize: 90      // 90 tablets per bottle
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth',
    quantityConstraints: {
      minQty: 30,
      defaultQty: 90,
      maxQty: 180
    }
  },

  warfarin: {
    id: 'fhir-warfarin',
    name: 'Warfarin 5mg',
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
    isScored: 'QUARTER',
    // FHIR R4 Compliant: Smaller quantity packaging for controlled medication
    totalVolume: {
      value: 1,         // 1 tablet per unit
      unit: 'tablet'
    },
    packageInfo: {
      quantity: 1,      // 1 tablet per unit dose
      unit: 'tablet',
      packSize: 30      // 30 tablets per bottle (typical for warfarin)
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth',
    quantityConstraints: {
      minQty: 30,
      defaultQty: 30,
      maxQty: 90
    }
  }
};

/**
 * FHIR-Compliant Topical Medications
 * 
 * Tests proper topical packaging for tubes, dispensers, and applicators.
 */
export const FHIR_TOPICAL_MEDICATIONS: Record<string, Medication> = {
  hydrocortisone: {
    id: 'fhir-hydrocortisone',
    name: 'Hydrocortisone 1% Cream',
    type: 'medication',
    isActive: true,
    doseForm: 'Cream',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '197582',
        display: 'Hydrocortisone 10 MG/ML Topical Cream'
      }]
    },
    ingredient: [{
      name: 'Hydrocortisone',
      strengthRatio: {
        numerator: { value: 10, unit: 'mg' },
        denominator: { value: 1, unit: 'g' }
      }
    }],
    // FHIR R4 Compliant: Standard tube packaging
    totalVolume: {
      value: 30,        // 30g per tube (FHIR totalVolume)
      unit: 'g'
    },
    packageInfo: {
      quantity: 30,     // 30g per tube (unit dose)
      unit: 'g'
      // packSize: 1 (implied - single tube per package)
    },
    allowedRoutes: ['topical'],
    defaultRoute: 'topical'
  },

  testosteroneGel: {
    id: 'fhir-testosterone-gel',
    name: 'Testosterone 1% Gel with Topiclick',
    type: 'medication',
    isActive: true,
    doseForm: 'Gel',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: 'compound-003',
        display: 'Compounded Testosterone 1% Topical Gel'
      }]
    },
    ingredient: [{
      name: 'Testosterone',
      strengthRatio: {
        numerator: { value: 10, unit: 'mg' },
        denominator: { value: 1, unit: 'g' }
      }
    }],
    // FHIR R4 Compliant: Pump dispenser
    totalVolume: {
      value: 60,        // 60g per pump bottle (FHIR totalVolume)
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
      conversionRatio: 4    // 4 clicks = 1 mL (corrected ratio)
    },
    allowedRoutes: ['topical'],
    defaultRoute: 'topical'
  }
};

/**
 * FHIR-Compliant Liquid Medications
 * 
 * Tests liquid medications with proper concentration and packaging models.
 */
export const FHIR_LIQUID_MEDICATIONS: Record<string, Medication> = {
  amoxicillinSuspension: {
    id: 'fhir-amoxicillin-susp',
    name: 'Amoxicillin 250mg/5mL Suspension',
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
    // FHIR R4 Compliant: Standard suspension bottle
    totalVolume: {
      value: 150,       // 150mL per bottle (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 150,    // 150mL per bottle (unit dose)
      unit: 'mL'
      // packSize: 1 (implied - single bottle per package)
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth'
  },

  acetaminophenSolution: {
    id: 'fhir-acetaminophen-sol',
    name: 'Acetaminophen 160mg/5mL Pediatric Solution',
    type: 'medication',
    isActive: true,
    doseForm: 'Solution',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '307676',
        display: 'Acetaminophen 160 MG per 5 ML Oral Solution'
      }]
    },
    ingredient: [{
      name: 'Acetaminophen',
      strengthRatio: {
        numerator: { value: 160, unit: 'mg' },
        denominator: { value: 5, unit: 'mL' }
      }
    }],
    concentrationRatio: {
      numerator: { value: 160, unit: 'mg' },
      denominator: { value: 5, unit: 'mL' }
    },
    // FHIR R4 Compliant: Pediatric packaging
    totalVolume: {
      value: 120,       // 120mL per bottle (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 120,    // 120mL per bottle (unit dose)
      unit: 'mL'
      // packSize: 1 (implied - single bottle per package)
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth'
  }
};

/**
 * Days Supply Calculation Test Cases
 * 
 * These test cases validate that the corrected FHIR packaging model
 * produces accurate days supply calculations for various scenarios.
 */
export const FHIR_DAYS_SUPPLY_TEST_CASES: Partial<GoldenTestCase>[] = [
  {
    id: 'fhir-days-001',
    name: 'Testosterone Cypionate 200mg weekly injection',
    description: 'Multi-vial package with weekly dosing - tests FHIR packaging model',
    category: 'injection',
    input: {
      medication: FHIR_INJECTABLE_MEDICATIONS.testosteroneCypionate,
      dose: { value: 200, unit: 'mg' },
      route: 'Intramuscularly',
      frequency: 'Once Per Week'
    },
    expected: {
      humanReadable: 'Inject 200 mg, as 1 mL intramuscularly weekly.',
      daysSupply: 140,  // 2 vials × 10mL = 20mL total ÷ 1mL per week = 20 weeks = 140 days
      fhirCompliant: true
    },
    metadata: {
      clinicalIntent: 'Standard testosterone replacement therapy',
      fhirValidation: {
        totalVolumeCorrect: true,
        packageCalculationAccurate: true,
        daysSupplyFormula: '(packageInfo.quantity × packageInfo.packSize) ÷ dosePerAdministration ÷ administrationsPerDay'
      }
    }
  },

  {
    id: 'fhir-days-002',
    name: 'Atorvastatin 40mg daily - standard bottle',
    description: 'Standard tablet packaging with daily dosing',
    category: 'tablet',
    input: {
      medication: FHIR_TABLET_MEDICATIONS.atorvastatin,
      dose: { value: 1, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Once Daily'
    },
    expected: {
      humanReadable: 'Take 1 tablet by mouth once daily.',
      daysSupply: 90,   // 90 tablets ÷ 1 tablet per day = 90 days
      fhirCompliant: true
    },
    metadata: {
      clinicalIntent: 'Standard statin therapy for hyperlipidemia',
      fhirValidation: {
        totalVolumeCorrect: true,
        packageCalculationAccurate: true
      }
    }
  },

  {
    id: 'fhir-days-003',
    name: 'Warfarin 2.5mg daily (half tablet)',
    description: 'Fractional tablet dosing with FHIR packaging',
    category: 'tablet',
    input: {
      medication: FHIR_TABLET_MEDICATIONS.warfarin,
      dose: { value: 0.5, unit: 'tablet' },
      route: 'Orally',
      frequency: 'Once Daily'
    },
    expected: {
      humanReadable: 'Take 1/2 tablet by mouth once daily.',
      daysSupply: 60,   // 30 tablets ÷ 0.5 tablet per day = 60 days
      fhirCompliant: true
    },
    metadata: {
      clinicalIntent: 'Anticoagulation with dose adjustment',
      fhirValidation: {
        fractionalDosingSupported: true,
        packageCalculationAccurate: true
      }
    }
  },

  {
    id: 'fhir-days-004',
    name: 'Testosterone gel 2 clicks daily',
    description: 'Topiclick dispenser with FHIR packaging and conversion',
    category: 'topical',
    input: {
      medication: FHIR_TOPICAL_MEDICATIONS.testosteroneGel,
      dose: { value: 2, unit: 'click' },
      route: 'Topically',
      frequency: 'Once Daily'
    },
    expected: {
      humanReadable: 'Apply 2 clicks topically once daily.',
      daysSupply: 120,  // 60g ÷ 0.5g per day (2 clicks = 0.5mL = 0.5g) = 120 days
      fhirCompliant: true
    },
    metadata: {
      clinicalIntent: 'Testosterone replacement via transdermal absorption',
      fhirValidation: {
        dispenserConversionCorrect: true,
        packageCalculationAccurate: true,
        conversionFormula: '4 clicks = 1 mL = 1g'
      }
    }
  },

  {
    id: 'fhir-days-005',
    name: 'Amoxicillin 500mg twice daily',
    description: 'Liquid medication with dual dose calculation (mg and mL)',
    category: 'liquid',
    input: {
      medication: FHIR_LIQUID_MEDICATIONS.amoxicillinSuspension,
      dose: { value: 500, unit: 'mg' },
      route: 'Orally',
      frequency: 'Twice Daily'
    },
    expected: {
      humanReadable: 'Take 500 mg, as 10 mL by mouth twice daily. Shake well before use.',
      daysSupply: 7.5,  // 150mL ÷ 20mL per day (10mL × 2) = 7.5 days
      fhirCompliant: true
    },
    metadata: {
      clinicalIntent: 'Antibiotic therapy with liquid formulation',
      fhirValidation: {
        dualDoseDisplayCorrect: true,
        concentrationCalculationAccurate: true,
        packageCalculationAccurate: true
      }
    }
  },

  {
    id: 'fhir-days-006',
    name: 'Insulin glargine 30 units daily',
    description: 'Multi-pen package with unit-based dosing',
    category: 'injection',
    input: {
      medication: FHIR_INJECTABLE_MEDICATIONS.insulinPen,
      dose: { value: 30, unit: 'units' },
      route: 'Subcutaneous',
      frequency: 'Once Daily'
    },
    expected: {
      humanReadable: 'Inject 30 units, as 0.3 mL subcutaneously once daily.',
      daysSupply: 50,   // 5 pens × 300 units per pen = 1500 units ÷ 30 units per day = 50 days
      fhirCompliant: true
    },
    metadata: {
      clinicalIntent: 'Basal insulin for diabetes management',
      fhirValidation: {
        unitBasedCalculationCorrect: true,
        multiPenPackageCorrect: true,
        packageCalculationAccurate: true
      }
    }
  }
];

/**
 * FHIR Edge Cases and Boundary Testing
 * 
 * Complex scenarios that test the limits of the FHIR packaging model.
 */
export const FHIR_EDGE_CASE_MEDICATIONS: Record<string, Medication> = {
  highDoseVitaminD: {
    id: 'fhir-vitamin-d-50k',
    name: 'Vitamin D3 50,000 IU Weekly',
    type: 'medication',
    isActive: true,
    doseForm: 'Capsule',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '316672',
        display: 'Cholecalciferol 50000 UNT Oral Capsule'
      }]
    },
    ingredient: [{
      name: 'Cholecalciferol',
      strengthRatio: {
        numerator: { value: 50000, unit: 'IU' },
        denominator: { value: 1, unit: 'capsule' }
      }
    }],
    isScored: 'NONE',
    // FHIR R4 Compliant: Small quantity high-dose packaging
    totalVolume: {
      value: 1,         // 1 capsule per unit
      unit: 'capsule'
    },
    packageInfo: {
      quantity: 1,      // 1 capsule per unit dose
      unit: 'capsule',
      packSize: 12      // 12 capsules per bottle (3-month supply)
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth',
    quantityConstraints: {
      minQty: 12,
      defaultQty: 12,
      maxQty: 24
    }
  },

  lowDosePediatric: {
    id: 'fhir-digoxin-pediatric',
    name: 'Digoxin 0.05mg/mL Pediatric Elixir',
    type: 'medication',
    isActive: true,
    doseForm: 'Elixir',
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '197604',
        display: 'Digoxin 0.05 MG/ML Oral Solution'
      }]
    },
    ingredient: [{
      name: 'Digoxin',
      strengthRatio: {
        numerator: { value: 0.05, unit: 'mg' },
        denominator: { value: 1, unit: 'mL' }
      }
    }],
    concentrationRatio: {
      numerator: { value: 0.05, unit: 'mg' },
      denominator: { value: 1, unit: 'mL' }
    },
    // FHIR R4 Compliant: Pediatric liquid packaging
    totalVolume: {
      value: 60,        // 60mL per bottle
      unit: 'mL'
    },
    packageInfo: {
      quantity: 60,     // 60mL per bottle (unit dose)
      unit: 'mL'
      // packSize: 1 (implied - single bottle per package)
    },
    allowedRoutes: ['by mouth'],
    defaultRoute: 'by mouth'
  }
};

/**
 * All FHIR-compliant medication fixtures organized by category
 */
export const FHIR_MEDICATION_FIXTURES = {
  injectables: FHIR_INJECTABLE_MEDICATIONS,
  tablets: FHIR_TABLET_MEDICATIONS,
  topicals: FHIR_TOPICAL_MEDICATIONS,
  liquids: FHIR_LIQUID_MEDICATIONS,
  edgeCases: FHIR_EDGE_CASE_MEDICATIONS
};

/**
 * Complete test suite for FHIR compliance validation
 */
export const FHIR_COMPLIANCE_TEST_SUITE = {
  daysSupplyTests: FHIR_DAYS_SUPPLY_TEST_CASES,
  medications: FHIR_MEDICATION_FIXTURES
};

/**
 * Get all FHIR-compliant medications as a flat array
 */
export function getAllFHIRMedications(): Medication[] {
  const allMeds: Medication[] = [];
  
  for (const category of Object.values(FHIR_MEDICATION_FIXTURES)) {
    allMeds.push(...Object.values(category));
  }
  
  return allMeds;
}

/**
 * Validate FHIR packaging model compliance
 */
export function validateFHIRPackaging(medication: Medication): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required fields
  if (!medication.totalVolume) {
    errors.push('Missing totalVolume field');
  }
  
  if (!medication.packageInfo) {
    errors.push('Missing packageInfo field');
  } else {
    // Check FHIR compliance
    if (medication.totalVolume && medication.packageInfo.quantity !== medication.totalVolume.value) {
      errors.push(`packageInfo.quantity (${medication.packageInfo.quantity}) should match totalVolume.value (${medication.totalVolume.value})`);
    }
    
    if (medication.totalVolume && medication.packageInfo.unit !== medication.totalVolume.unit) {
      errors.push(`packageInfo.unit (${medication.packageInfo.unit}) should match totalVolume.unit (${medication.totalVolume.unit})`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}