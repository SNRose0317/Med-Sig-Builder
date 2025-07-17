/**
 * Medication Fixtures for Golden Master Testing
 * 
 * Standardized medication profiles for consistent testing across
 * all golden master test scenarios.
 * 
 * @since 3.1.0
 */

import type { Medication } from '../../types';

/**
 * Standard tablet medications
 */
export const TABLET_MEDICATIONS = {
  metformin500: {
    id: 'med-metformin-500',
    name: 'Metformin 500mg',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '860975',
        display: 'Metformin 500 MG Oral Tablet'
      }]
    },
    ingredient: [{
      name: 'Metformin Hydrochloride',
      strengthRatio: {
        numerator: { value: 500, unit: 'mg' },
        denominator: { value: 1, unit: 'tablet' }
      }
    }],
    isScored: 'HALF' as const,
    totalVolume: {
      value: 1,         // 1 tablet per unit dose (FHIR totalVolume)
      unit: 'tablet'
    },
    packageInfo: {
      quantity: 1,      // 1 tablet per unit dose
      unit: 'tablet',
      packSize: 100     // 100 tablets per bottle
    }
  } as Medication,

  lisinopril10: {
    id: 'med-lisinopril-10',
    name: 'Lisinopril 10mg',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '104375',
        display: 'Lisinopril 10 MG Oral Tablet'
      }]
    },
    ingredient: [{
      name: 'Lisinopril',
      strengthRatio: {
        numerator: { value: 10, unit: 'mg' },
        denominator: { value: 1, unit: 'tablet' }
      }
    }],
    isScored: 'QUARTER' as const,
    totalVolume: {
      value: 1,         // 1 tablet per unit dose (FHIR totalVolume)
      unit: 'tablet'
    },
    packageInfo: {
      quantity: 1,      // 1 tablet per unit dose
      unit: 'tablet',
      packSize: 90      // 90 tablets per bottle
    }
  } as Medication,

  levothyroxine25: {
    id: 'med-levothyroxine-25',
    name: 'Levothyroxine 25mcg',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '966224',
        display: 'Levothyroxine Sodium 25 MCG Oral Tablet'
      }]
    },
    ingredient: [{
      name: 'Levothyroxine Sodium',
      strengthRatio: {
        numerator: { value: 25, unit: 'mcg' },
        denominator: { value: 1, unit: 'tablet' }
      }
    }],
    isScored: 'NONE' as const,
    totalVolume: {
      value: 1,         // 1 tablet per unit dose (FHIR totalVolume)
      unit: 'tablet'
    },
    packageInfo: {
      quantity: 1,      // 1 tablet per unit dose
      unit: 'tablet',
      packSize: 30      // 30 tablets per bottle
    }
  } as Medication,

  omeprazole20: {
    id: 'med-omeprazole-20',
    name: 'Omeprazole 20mg',
    type: 'medication',
    isActive: true,
    doseForm: 'Capsule',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '40790',
        display: 'Omeprazole 20 MG Delayed Release Oral Capsule'
      }]
    },
    ingredient: [{
      name: 'Omeprazole',
      strengthRatio: {
        numerator: { value: 20, unit: 'mg' },
        denominator: { value: 1, unit: 'capsule' }
      }
    }],
    isScored: 'NONE' as const,
    totalVolume: {
      value: 1,         // 1 capsule per unit dose (FHIR totalVolume)
      unit: 'capsule'
    },
    packageInfo: {
      quantity: 1,      // 1 capsule per unit dose
      unit: 'capsule',
      packSize: 30      // 30 capsules per bottle
    }
  } as Medication
};

/**
 * Liquid medications with various concentrations
 */
export const LIQUID_MEDICATIONS = {
  amoxicillinSuspension: {
    id: 'med-amoxicillin-susp',
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
    totalVolume: {
      value: 150,       // 150mL per bottle (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 150,    // 150mL per bottle (unit dose)
      unit: 'mL'
    }
  } as Medication,

  acetaminophenSolution: {
    id: 'med-acetaminophen-sol',
    name: 'Acetaminophen 160mg/5mL Solution',
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
    totalVolume: {
      value: 120,       // 120mL per bottle (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 120,    // 120mL per bottle (unit dose)
      unit: 'mL'
    }
  } as Medication,

  insulin: {
    id: 'med-insulin',
    name: 'Insulin Glargine 100 units/mL',
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
    totalVolume: {
      value: 10,        // 10mL per pen/vial (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 10,     // 10mL per pen/vial (unit dose)
      unit: 'mL'
    }
  } as Medication
};

/**
 * Injectable medications
 */
export const INJECTABLE_MEDICATIONS = {
  testosteroneCypionate: {
    id: 'med-testosterone-cyp',
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
    totalVolume: {
      value: 10,        // 10mL per individual vial (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 10,     // 10mL per individual vial (unit dose)
      unit: 'mL',
      packSize: 2       // 2 vials per package (total = 20mL)
    }
  } as Medication,

  morphineInjection: {
    id: 'med-morphine-inj',
    name: 'Morphine 10mg/mL Injection',
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
    totalVolume: {
      value: 1,         // 1mL per ampule/vial (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 1,      // 1mL per ampule/vial (unit dose)
      unit: 'mL',
      packSize: 10      // 10 ampules per package
    }
  } as Medication
};

/**
 * Topical medications with special dispensers
 */
export const TOPICAL_MEDICATIONS = {
  hormoneCreams: {
    id: 'med-hormone-cream',
    name: 'Hormone Cream 10mg/g',
    type: 'medication',
    isActive: true,
    doseForm: 'Cream',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: 'compound-001',
        display: 'Compounded Hormone Cream'
      }]
    },
    ingredient: [{
      name: 'Mixed Hormones',
      strengthRatio: {
        numerator: { value: 10, unit: 'mg' },
        denominator: { value: 1, unit: 'g' }
      }
    }],
    dispenserInfo: {
      type: 'topiclick',
      dispensingUnit: 'click',
      volumePerUnit: 0.25, // 4 clicks = 1 mL
      strengthPerUnit: 2.5 // mg per click
    },
    totalVolume: {
      value: 30,        // 30g per tube (FHIR totalVolume)
      unit: 'g'
    },
    packageInfo: {
      quantity: 30,     // 30g per tube (unit dose)
      unit: 'g'
    }
  } as Medication,

  hydrocortisoneCream: {
    id: 'med-hydrocortisone',
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
    totalVolume: {
      value: 30,        // 30g per tube (FHIR totalVolume)
      unit: 'g'
    },
    packageInfo: {
      quantity: 30,     // 30g per tube (unit dose)
      unit: 'g'
    }
  } as Medication
};

/**
 * Multi-ingredient medications for complex scenarios
 */
export const MULTI_INGREDIENT_MEDICATIONS = {
  combinationHormone: {
    id: 'med-combo-hormone',
    name: 'Estradiol/Progesterone Cream',
    type: 'medication',
    isActive: true,
    doseForm: 'Cream',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: 'compound-002',
        display: 'Compounded Estradiol/Progesterone Cream'
      }]
    },
    ingredient: [
      {
        name: 'Estradiol',
        strengthRatio: {
          numerator: { value: 1, unit: 'mg' },
          denominator: { value: 1, unit: 'g' }
        }
      },
      {
        name: 'Progesterone',
        strengthRatio: {
          numerator: { value: 100, unit: 'mg' },
          denominator: { value: 1, unit: 'g' }
        }
      }
    ],
    dispenserInfo: {
      type: 'topiclick',
      dispensingUnit: 'click',
      volumePerUnit: 0.25,
      strengthPerUnit: null // Multi-ingredient, use volume dosing
    },
    totalVolume: {
      value: 50,        // 50g per tube (FHIR totalVolume)
      unit: 'g'
    },
    packageInfo: {
      quantity: 50,     // 50g per tube (unit dose)
      unit: 'g'
    }
  } as Medication,

  combinationTablet: {
    id: 'med-combo-tablet',
    name: 'Lisinopril/HCTZ 10/12.5mg',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '214352',
        display: 'Lisinopril 10 MG / Hydrochlorothiazide 12.5 MG Oral Tablet'
      }]
    },
    ingredient: [
      {
        name: 'Lisinopril',
        strengthRatio: {
          numerator: { value: 10, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' }
        }
      },
      {
        name: 'Hydrochlorothiazide',
        strengthRatio: {
          numerator: { value: 12.5, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' }
        }
      }
    ],
    isScored: 'HALF' as const,
    totalVolume: {
      value: 1,         // 1 tablet per unit dose (FHIR totalVolume)
      unit: 'tablet'
    },
    packageInfo: {
      quantity: 1,      // 1 tablet per unit dose
      unit: 'tablet',
      packSize: 90      // 90 tablets per bottle
    }
  } as Medication
};

/**
 * Edge case medications for boundary testing
 */
export const EDGE_CASE_MEDICATIONS = {
  highDoseVitamin: {
    id: 'med-vitamin-d',
    name: 'Vitamin D3 50,000 IU',
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
    isScored: 'NONE' as const,
    totalVolume: {
      value: 1,         // 1 capsule per unit dose (FHIR totalVolume)
      unit: 'capsule'
    },
    packageInfo: {
      quantity: 1,      // 1 capsule per unit dose
      unit: 'capsule',
      packSize: 12      // 12 capsules per bottle
    }
  } as Medication,

  lowDosePediatric: {
    id: 'med-digoxin-pediatric',
    name: 'Digoxin 0.1mg/mL Pediatric',
    type: 'medication',
    isActive: true,
    doseForm: 'Solution',
    code: {
      coding: [{ 
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '197604',
        display: 'Digoxin 0.1 MG/ML Oral Solution'
      }]
    },
    ingredient: [{
      name: 'Digoxin',
      strengthRatio: {
        numerator: { value: 0.1, unit: 'mg' },
        denominator: { value: 1, unit: 'mL' }
      }
    }],
    concentrationRatio: {
      numerator: { value: 0.1, unit: 'mg' },
      denominator: { value: 1, unit: 'mL' }
    },
    totalVolume: {
      value: 60,        // 60mL per bottle (FHIR totalVolume)
      unit: 'mL'
    },
    packageInfo: {
      quantity: 60,     // 60mL per bottle (unit dose)
      unit: 'mL'
    }
  } as Medication
};

/**
 * All medication fixtures organized by category
 */
export const MEDICATION_FIXTURES = {
  tablets: TABLET_MEDICATIONS,
  liquids: LIQUID_MEDICATIONS,
  injectables: INJECTABLE_MEDICATIONS,
  topicals: TOPICAL_MEDICATIONS,
  multiIngredient: MULTI_INGREDIENT_MEDICATIONS,
  edgeCases: EDGE_CASE_MEDICATIONS
};

/**
 * Get all medications as a flat array
 */
export function getAllMedications(): Medication[] {
  const allMeds: Medication[] = [];
  
  for (const category of Object.values(MEDICATION_FIXTURES)) {
    allMeds.push(...Object.values(category));
  }
  
  return allMeds;
}

/**
 * Get medications by dose form
 */
export function getMedicationsByDoseForm(doseForm: string): Medication[] {
  return getAllMedications().filter(med => 
    med.doseForm?.toLowerCase() === doseForm.toLowerCase()
  );
}

/**
 * Get medication by ID
 */
export function getMedicationById(id: string): Medication | undefined {
  return getAllMedications().find(med => med.id === id);
}