/**
 * FHIR R4 Compliance Test Suite
 * 
 * Validates that all medication examples follow the corrected FHIR packaging
 * model and produce accurate days supply calculations.
 * 
 * @since 2025-07-17 - FHIR packaging model correction
 */

import { 
  FHIR_MEDICATION_FIXTURES,
  FHIR_DAYS_SUPPLY_TEST_CASES,
  getAllFHIRMedications,
  validateFHIRPackaging
} from './data/fhir-compliant-examples';
import { calculateDaysSupply } from '../lib/calculations';
import { generateSignature } from '../lib/signature';

describe('FHIR R4 Packaging Model Compliance', () => {
  
  describe('Medication Data Validation', () => {
    
    it('should validate all FHIR injectable medications', () => {
      Object.values(FHIR_MEDICATION_FIXTURES.injectables).forEach(medication => {
        const validation = validateFHIRPackaging(medication);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    it('should validate all FHIR tablet medications', () => {
      Object.values(FHIR_MEDICATION_FIXTURES.tablets).forEach(medication => {
        const validation = validateFHIRPackaging(medication);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    it('should validate all FHIR topical medications', () => {
      Object.values(FHIR_MEDICATION_FIXTURES.topicals).forEach(medication => {
        const validation = validateFHIRPackaging(medication);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    it('should validate all FHIR liquid medications', () => {
      Object.values(FHIR_MEDICATION_FIXTURES.liquids).forEach(medication => {
        const validation = validateFHIRPackaging(medication);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    it('should validate all FHIR edge case medications', () => {
      Object.values(FHIR_MEDICATION_FIXTURES.edgeCases).forEach(medication => {
        const validation = validateFHIRPackaging(medication);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });
  });

  describe('FHIR Packaging Model Standards', () => {
    
    it('should ensure totalVolume matches packageInfo.quantity for all medications', () => {
      const allMedications = getAllFHIRMedications();
      
      allMedications.forEach(medication => {
        expect(medication.totalVolume).toBeDefined();
        expect(medication.packageInfo).toBeDefined();
        
        if (medication.totalVolume && medication.packageInfo) {
          expect(medication.packageInfo.quantity).toBe(medication.totalVolume.value);
          expect(medication.packageInfo.unit).toBe(medication.totalVolume.unit);
        }
      });
    });

    it('should have proper packSize for multi-unit medications', () => {
      const testosteroneCyp = FHIR_MEDICATION_FIXTURES.injectables.testosteroneCypionate;
      expect(testosteroneCyp.packageInfo?.packSize).toBe(2);
      
      const morphineAmp = FHIR_MEDICATION_FIXTURES.injectables.morphineAmpule;
      expect(morphineAmp.packageInfo?.packSize).toBe(10);
      
      const insulinPen = FHIR_MEDICATION_FIXTURES.injectables.insulinPen;
      expect(insulinPen.packageInfo?.packSize).toBe(5);
    });

    it('should have proper concentration ratios for liquid medications', () => {
      Object.values(FHIR_MEDICATION_FIXTURES.liquids).forEach(medication => {
        expect(medication.concentrationRatio).toBeDefined();
        expect(medication.ingredient[0].strengthRatio.numerator.value)
          .toBe(medication.concentrationRatio?.numerator.value);
        expect(medication.ingredient[0].strengthRatio.denominator.value)
          .toBe(medication.concentrationRatio?.denominator.value);
      });
    });

    it('should have proper dispenser info for topical medications with dispensers', () => {
      const testosteroneGel = FHIR_MEDICATION_FIXTURES.topicals.testosteroneGel;
      expect(testosteroneGel.dispenserInfo).toBeDefined();
      expect(testosteroneGel.dispenserInfo?.type).toBe('topiclick');
      expect(testosteroneGel.dispenserInfo?.conversionRatio).toBe(4); // 4 clicks = 1 mL
    });
  });

  describe('Days Supply Calculations', () => {
    
    FHIR_DAYS_SUPPLY_TEST_CASES.forEach(testCase => {
      it(`should calculate correct days supply for: ${testCase.name}`, () => {
        if (!testCase.input || !testCase.expected) {
          fail('Test case missing required input or expected data');
          return;
        }

        const daysSupply = calculateDaysSupply(
          testCase.input.medication,
          {
            value: testCase.input.dose.value,
            unit: testCase.input.dose.unit,
            frequencyKey: testCase.input.frequency
          }
        );

        expect(daysSupply).toBeCloseTo(testCase.expected.daysSupply, 1);
      });
    });

    it('should handle multi-vial packaging correctly', () => {
      const testosteroneCyp = FHIR_MEDICATION_FIXTURES.injectables.testosteroneCypionate;
      const daysSupply = calculateDaysSupply(
        testosteroneCyp,
        {
          value: 200,
          unit: 'mg',
          frequencyKey: 'Once Per Week'
        }
      );
      
      // 2 vials × 10mL = 20mL total ÷ 1mL per week = 20 weeks = 140 days
      expect(daysSupply).toBeCloseTo(140, 1);
    });

    it('should handle multi-pen packaging correctly', () => {
      const insulinPen = FHIR_MEDICATION_FIXTURES.injectables.insulinPen;
      const daysSupply = calculateDaysSupply(
        insulinPen,
        {
          value: 30,
          unit: 'units',
          frequencyKey: 'Once Daily'
        }
      );
      
      // 5 pens × 300 units per pen = 1500 units ÷ 30 units per day = 50 days
      expect(daysSupply).toBeCloseTo(50, 1);
    });

    it('should handle fractional tablet dosing correctly', () => {
      const warfarin = FHIR_MEDICATION_FIXTURES.tablets.warfarin;
      const daysSupply = calculateDaysSupply(
        warfarin,
        {
          value: 0.5,
          unit: 'tablet',
          frequencyKey: 'Once Daily'
        }
      );
      
      // 30 tablets ÷ 0.5 tablet per day = 60 days
      expect(daysSupply).toBeCloseTo(60, 1);
    });

    it('should handle Topiclick dispenser conversions correctly', () => {
      const testosteroneGel = FHIR_MEDICATION_FIXTURES.topicals.testosteroneGel;
      const daysSupply = calculateDaysSupply(
        testosteroneGel,
        {
          value: 2,
          unit: 'click',
          frequencyKey: 'Once Daily'
        }
      );
      
      // 60g ÷ 0.5g per day (2 clicks = 0.5mL = 0.5g) = 120 days
      expect(daysSupply).toBeCloseTo(120, 1);
    });
  });

  describe('Signature Generation with FHIR Data', () => {
    
    it('should generate dual dose display for injectable medications', () => {
      const testosteroneCyp = FHIR_MEDICATION_FIXTURES.injectables.testosteroneCypionate;
      const signature = generateSignature(
        testosteroneCyp,
        { value: 200, unit: 'mg' },
        'Intramuscularly',
        'Once Per Week'
      );
      
      expect(signature.humanReadable).toContain('200 mg');
      expect(signature.humanReadable).toContain('1 mL');
      expect(signature.humanReadable).toContain('intramuscularly');
      expect(signature.humanReadable).toContain('weekly');
    });

    it('should generate proper liquid dosing with shake instructions', () => {
      const amoxicillinSusp = FHIR_MEDICATION_FIXTURES.liquids.amoxicillinSuspension;
      const signature = generateSignature(
        amoxicillinSusp,
        { value: 500, unit: 'mg' },
        'Orally',
        'Twice Daily'
      );
      
      expect(signature.humanReadable).toContain('500 mg');
      expect(signature.humanReadable).toContain('10 mL');
      expect(signature.humanReadable).toContain('Shake well before use');
    });

    it('should generate Topiclick dispenser instructions', () => {
      const testosteroneGel = FHIR_MEDICATION_FIXTURES.topicals.testosteroneGel;
      const signature = generateSignature(
        testosteroneGel,
        { value: 2, unit: 'click' },
        'Topically',
        'Once Daily'
      );
      
      expect(signature.humanReadable).toContain('2 clicks');
      expect(signature.humanReadable).toContain('topically');
    });

    it('should generate fractional tablet instructions', () => {
      const warfarin = FHIR_MEDICATION_FIXTURES.tablets.warfarin;
      const signature = generateSignature(
        warfarin,
        { value: 0.5, unit: 'tablet' },
        'Orally',
        'Once Daily'
      );
      
      expect(signature.humanReadable).toContain('1/2 tablet');
      expect(signature.humanReadable).toContain('by mouth');
      expect(signature.humanReadable).toContain('once daily');
    });
  });

  describe('FHIR Standard Compliance', () => {
    
    it('should include proper FHIR CodeableConcept codes', () => {
      const allMedications = getAllFHIRMedications();
      
      allMedications.forEach(medication => {
        expect(medication.code).toBeDefined();
        expect(medication.code.coding).toBeDefined();
        expect(medication.code.coding).toHaveLength(1);
        expect(medication.code.coding[0].display).toBeDefined();
        expect(medication.code.coding[0].display.length).toBeGreaterThan(0);
      });
    });

    it('should have proper ingredient strength ratios', () => {
      const allMedications = getAllFHIRMedications();
      
      allMedications.forEach(medication => {
        expect(medication.ingredient).toBeDefined();
        expect(medication.ingredient.length).toBeGreaterThan(0);
        
        medication.ingredient.forEach(ingredient => {
          expect(ingredient.name).toBeDefined();
          expect(ingredient.strengthRatio).toBeDefined();
          expect(ingredient.strengthRatio.numerator.value).toBeGreaterThan(0);
          expect(ingredient.strengthRatio.denominator.value).toBeGreaterThan(0);
          expect(ingredient.strengthRatio.numerator.unit).toBeDefined();
          expect(ingredient.strengthRatio.denominator.unit).toBeDefined();
        });
      });
    });

    it('should have consistent route specifications', () => {
      const allMedications = getAllFHIRMedications();
      
      allMedications.forEach(medication => {
        if (medication.allowedRoutes) {
          expect(medication.allowedRoutes.length).toBeGreaterThan(0);
        }
        
        if (medication.defaultRoute) {
          expect(medication.defaultRoute.length).toBeGreaterThan(0);
          
          if (medication.allowedRoutes) {
            expect(medication.allowedRoutes).toContain(medication.defaultRoute);
          }
        }
      });
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    
    it('should handle high-dose vitamins correctly', () => {
      const vitaminD = FHIR_MEDICATION_FIXTURES.edgeCases.highDoseVitaminD;
      const validation = validateFHIRPackaging(vitaminD);
      
      expect(validation.isValid).toBe(true);
      expect(vitaminD.ingredient[0].strengthRatio.numerator.value).toBe(50000);
      expect(vitaminD.ingredient[0].strengthRatio.numerator.unit).toBe('IU');
    });

    it('should handle low-dose pediatric medications correctly', () => {
      const digoxin = FHIR_MEDICATION_FIXTURES.edgeCases.lowDosePediatric;
      const validation = validateFHIRPackaging(digoxin);
      
      expect(validation.isValid).toBe(true);
      expect(digoxin.ingredient[0].strengthRatio.numerator.value).toBe(0.05);
      expect(digoxin.concentrationRatio?.numerator.value).toBe(0.05);
    });

    it('should calculate days supply for weekly high-dose vitamins', () => {
      const vitaminD = FHIR_MEDICATION_FIXTURES.edgeCases.highDoseVitaminD;
      const daysSupply = calculateDaysSupply(
        vitaminD,
        {
          value: 1,
          unit: 'capsule',
          frequencyKey: 'Once Per Week'
        }
      );
      
      // 12 capsules ÷ (1 capsule ÷ 7 days) = 84 days
      expect(daysSupply).toBeCloseTo(84, 1);
    });
  });
});

describe('FHIR Package Model Regression Tests', () => {
  
  it('should prevent regression to incorrect packaging model', () => {
    // These assertions ensure we don't accidentally revert to the old incorrect model
    const testosteroneCyp = FHIR_MEDICATION_FIXTURES.injectables.testosteroneCypionate;
    
    // CORRECT FHIR MODEL (current implementation)
    expect(testosteroneCyp.totalVolume?.value).toBe(10);     // 10mL per vial
    expect(testosteroneCyp.packageInfo?.quantity).toBe(10);  // 10mL per vial
    expect(testosteroneCyp.packageInfo?.packSize).toBe(2);   // 2 vials per package
    
    // INCORRECT MODEL (what we fixed) - these should NEVER be true
    expect(testosteroneCyp.packageInfo?.quantity).not.toBe(20);  // NOT total package quantity
    expect(testosteroneCyp.totalVolume?.value).not.toBe(20);     // NOT total package volume
  });

  it('should maintain correct tablet packaging model', () => {
    const atorvastatin = FHIR_MEDICATION_FIXTURES.tablets.atorvastatin;
    
    // CORRECT FHIR MODEL
    expect(atorvastatin.totalVolume?.value).toBe(1);        // 1 tablet per unit
    expect(atorvastatin.packageInfo?.quantity).toBe(1);     // 1 tablet per unit
    expect(atorvastatin.packageInfo?.packSize).toBe(90);    // 90 tablets per bottle
    
    // INCORRECT MODEL - these should NEVER be true
    expect(atorvastatin.packageInfo?.quantity).not.toBe(90);  // NOT total package quantity
    expect(atorvastatin.totalVolume?.value).not.toBe(90);     // NOT total package count
  });
});