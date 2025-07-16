/**
 * Test helpers for creating valid test data
 */

import { MedicationProfile } from '../../../types/MedicationProfile';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';

/**
 * Creates a valid MedicationProfile for testing
 */
export function createTestMedicationProfile(overrides: Partial<MedicationProfile> = {}): MedicationProfile {
  return {
    id: 'test-med',
    name: 'Test Medication',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: { 
      coding: [{ 
        display: 'Test Medication' 
      }] 
    },
    ingredient: [{ 
      name: 'Test Ingredient',
      strengthRatio: { 
        numerator: { value: 100, unit: 'mg' }, 
        denominator: { value: 1, unit: 'tablet' } 
      } 
    }],
    ...overrides
  };
}

/**
 * Creates a valid MedicationRequestContext for testing
 */
export function createTestContext(overrides: Partial<MedicationRequestContext> = {}): MedicationRequestContext {
  return {
    id: 'test-request',
    timestamp: new Date().toISOString(),
    patient: { id: 'test-patient', age: 30 },
    medication: createTestMedicationProfile(overrides.medication || {}),
    dose: { value: 1, unit: 'tablet' },
    route: 'Orally',
    frequency: 'Twice Daily',
    ...overrides
  };
}

/**
 * Creates a test DispenserInfo for Topiclick
 */
export function createTestTopiclickDispenser() {
  return {
    type: 'Topiclick',
    unit: 'click',
    pluralUnit: 'clicks',
    conversionRatio: 4
  };
}