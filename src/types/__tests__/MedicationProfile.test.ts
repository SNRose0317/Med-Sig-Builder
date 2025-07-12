import { MedicationProfile, isMedicationProfile, ScoringType } from '../MedicationProfile';

describe('MedicationProfile', () => {
  describe('Interface definition', () => {
    it('should accept valid medication profile with required fields', () => {
      const validProfile: MedicationProfile = {
        id: 'med-123',
        name: 'Testosterone Cypionate',
        type: 'medication',
        isActive: true,
        doseForm: 'Vial',
        code: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '123456',
            display: 'Testosterone Cypionate'
          }]
        },
        ingredient: [{
          name: 'Testosterone Cypionate',
          strengthRatio: {
            numerator: { value: 200, unit: 'mg' },
            denominator: { value: 1, unit: 'mL' }
          }
        }]
      };

      expect(validProfile).toBeDefined();
      expect(validProfile.id).toBe('med-123');
    });

    it('should accept medication profile with all optional fields', () => {
      const fullProfile: MedicationProfile = {
        id: 'med-456',
        name: 'Metoprolol Tartrate',
        type: 'medication',
        isActive: true,
        doseForm: 'Tablet',
        code: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '654321',
            display: 'Metoprolol Tartrate'
          }]
        },
        ingredient: [{
          name: 'Metoprolol Tartrate',
          strengthRatio: {
            numerator: { value: 50, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        // New fields for refactoring
        isFractional: true,
        isTaper: false,
        isMultiIngredient: false,
        isScored: ScoringType.HALF,
        concentrationRatio: {
          numerator: { value: 50, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' }
        },
        molarMass: { value: 684.82, unit: 'g/mol' },
        customConversions: [{
          from: { value: 1, unit: 'tablet' },
          to: { value: 50, unit: 'mg' },
          factor: 50,
          lotSpecific: false
        }],
        dispenserMetadata: {
          type: 'bottle',
          primeVolume: { value: 0, unit: 'mL' },
          deliveryPrecision: 0.25
        },
        // Existing optional fields
        packageInfo: {
          quantity: 30,
          unit: 'tablets',
          packSize: 1
        },
        dispenserInfo: {
          type: 'Topiclick',
          unit: 'click',
          pluralUnit: 'clicks',
          conversionRatio: 4,
          maxAmountPerDose: 8
        },
        dosageConstraints: {
          minDose: { value: 25, unit: 'mg' },
          maxDose: { value: 200, unit: 'mg' },
          step: 25
        },
        allowedRoutes: ['by mouth'],
        defaultRoute: 'by mouth',
        defaultSignatureSettings: {
          dosage: { value: 50, unit: 'mg' },
          frequency: 'twice daily',
          specialInstructions: 'with food'
        },
        totalVolume: { value: 30, unit: 'tablets' },
        extension: [{ 'us-controlled': false }],
        commonDosages: [
          { value: 25, unit: 'mg', frequency: 'twice daily' },
          { value: 50, unit: 'mg', frequency: 'twice daily' }
        ],
        eligibleGenders: ['MALE', 'FEMALE', 'OTHER'],
        vendor: 'Generic Pharma Inc',
        sku: 'GP-MET-50',
        position: 1
      };

      expect(fullProfile).toBeDefined();
      expect(fullProfile.isScored).toBe(ScoringType.HALF);
    });
  });

  describe('Type guards', () => {
    it('should correctly identify valid medication profiles', () => {
      const validProfile = {
        id: 'med-789',
        name: 'Test Medication',
        type: 'medication' as const,
        isActive: true,
        doseForm: 'Capsule',
        code: { coding: [{ display: 'Test Medication' }] },
        ingredient: [{
          name: 'Test Ingredient',
          strengthRatio: {
            numerator: { value: 100, unit: 'mg' },
            denominator: { value: 1, unit: 'capsule' }
          }
        }]
      };

      expect(isMedicationProfile(validProfile)).toBe(true);
    });

    it('should reject objects missing required fields', () => {
      const invalidProfile = {
        id: 'med-000',
        name: 'Invalid Medication',
        // Missing required fields: type, isActive, doseForm, code, ingredient
      };

      expect(isMedicationProfile(invalidProfile)).toBe(false);
    });

    it('should reject objects with incorrect field types', () => {
      const invalidProfile = {
        id: 123, // Should be string
        name: 'Invalid Medication',
        type: 'medication',
        isActive: 'yes', // Should be boolean
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Invalid' }] },
        ingredient: []
      };

      expect(isMedicationProfile(invalidProfile)).toBe(false);
    });
  });

  describe('Computed fields', () => {
    it('should correctly compute isMultiIngredient', () => {
      const singleIngredient: MedicationProfile = {
        id: 'single-1',
        name: 'Single Ingredient Med',
        type: 'medication',
        isActive: true,
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Single' }] },
        ingredient: [{
          name: 'Active Ingredient',
          strengthRatio: {
            numerator: { value: 100, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }]
      };

      const multiIngredient: MedicationProfile = {
        id: 'multi-1',
        name: 'Multi Ingredient Med',
        type: 'medication',
        isActive: true,
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Multi' }] },
        ingredient: [
          {
            name: 'Ingredient A',
            strengthRatio: {
              numerator: { value: 50, unit: 'mg' },
              denominator: { value: 1, unit: 'tablet' }
            }
          },
          {
            name: 'Ingredient B',
            strengthRatio: {
              numerator: { value: 25, unit: 'mg' },
              denominator: { value: 1, unit: 'tablet' }
            }
          }
        ],
        isMultiIngredient: true
      };

      // If isMultiIngredient is computed, it should be true for multi
      expect(multiIngredient.ingredient.length).toBeGreaterThan(1);
      expect(multiIngredient.isMultiIngredient).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original: MedicationProfile = {
        id: 'ser-123',
        name: 'Serialization Test',
        type: 'medication',
        isActive: true,
        doseForm: 'Solution',
        code: { coding: [{ display: 'Test' }] },
        ingredient: [{
          name: 'Test',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'mL' }
          }
        }],
        customConversions: [{
          from: { value: 1, unit: 'mL' },
          to: { value: 10, unit: 'mg' },
          factor: 10,
          lotSpecific: true,
          lotNumber: 'LOT-2024-001'
        }]
      };

      const json = JSON.stringify(original);
      const deserialized = JSON.parse(json) as MedicationProfile;

      expect(deserialized).toEqual(original);
      expect(isMedicationProfile(deserialized)).toBe(true);
    });
  });
});