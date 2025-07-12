import { 
  MedicationRequestContext,
  PatientContext,
  FormularyContext,
  PrescriberContext,
  isMedicationRequestContext,
  createMedicationRequestContext
} from '../MedicationRequestContext';
import { MedicationProfile, ScoringType } from '../MedicationProfile';

describe('MedicationRequestContext', () => {
  const mockMedication: MedicationProfile = {
    id: 'med-test-123',
    name: 'Test Medication',
    type: 'medication',
    isActive: true,
    doseForm: 'Tablet',
    code: { coding: [{ display: 'Test Medication' }] },
    ingredient: [{
      name: 'Test Ingredient',
      strengthRatio: {
        numerator: { value: 100, unit: 'mg' },
        denominator: { value: 1, unit: 'tablet' }
      }
    }]
  };

  const mockPatient: PatientContext = {
    id: 'patient-123',
    age: 45,
    weight: { value: 70, unit: 'kg' },
    gender: 'MALE',
    renalFunction: { egfr: 90, unit: 'mL/min/1.73m2' }
  };

  describe('Interface definition', () => {
    it('should accept valid medication request context', () => {
      const context: MedicationRequestContext = {
        id: 'req-123',
        timestamp: new Date().toISOString(),
        medication: mockMedication,
        patient: mockPatient,
        dose: { value: 100, unit: 'mg' },
        frequency: 'twice daily',
        route: 'by mouth',
        specialInstructions: 'with food'
      };

      expect(context).toBeDefined();
      expect(context.medication.id).toBe('med-test-123');
      expect(context.patient.age).toBe(45);
    });

    it('should support all optional fields', () => {
      const fullContext: MedicationRequestContext = {
        id: 'req-456',
        timestamp: new Date().toISOString(),
        medication: {
          ...mockMedication,
          isScored: ScoringType.HALF
        },
        patient: {
          ...mockPatient,
          hepaticFunction: { 
            ast: 25, 
            alt: 30, 
            unit: 'U/L',
            childPughScore: 'A'
          },
          allergies: ['penicillin', 'sulfa'],
          conditions: ['hypertension', 'diabetes'],
          concurrentMedications: ['metformin', 'lisinopril']
        },
        dose: { value: 50, unit: 'mg' },
        frequency: 'once daily',
        route: 'by mouth',
        duration: { value: 30, unit: 'days' },
        quantity: { value: 30, unit: 'tablets' },
        refills: 3,
        specialInstructions: 'take in the morning',
        prescriber: {
          id: 'prescriber-123',
          name: 'Dr. Jane Smith',
          npi: '1234567890',
          dea: 'BS1234567'
        },
        formulary: {
          id: 'formulary-123',
          name: 'Standard Formulary',
          preferredAlternatives: ['generic-alternative-1'],
          restrictions: ['prior-auth-required'],
          copayTier: 2
        },
        clinicalContext: {
          indication: 'hypertension',
          icd10Codes: ['I10'],
          notes: 'Patient stable on current dose'
        }
      };

      expect(fullContext.prescriber?.name).toBe('Dr. Jane Smith');
      expect(fullContext.formulary?.copayTier).toBe(2);
      expect(fullContext.patient.allergies).toContain('penicillin');
    });
  });

  describe('Type guards', () => {
    it('should correctly identify valid contexts', () => {
      const valid: MedicationRequestContext = {
        id: 'req-789',
        timestamp: new Date().toISOString(),
        medication: mockMedication,
        patient: mockPatient,
        dose: { value: 100, unit: 'mg' },
        frequency: 'twice daily',
        route: 'by mouth'
      };

      expect(isMedicationRequestContext(valid)).toBe(true);
    });

    it('should reject contexts missing required fields', () => {
      const invalid = {
        id: 'req-000',
        medication: mockMedication,
        // Missing patient, dose, frequency, route, timestamp
      };

      expect(isMedicationRequestContext(invalid)).toBe(false);
    });

    it('should reject contexts with invalid patient data', () => {
      const invalid = {
        id: 'req-bad',
        timestamp: new Date().toISOString(),
        medication: mockMedication,
        patient: {
          id: 'patient-bad',
          age: 'forty-five', // Should be number
          weight: { value: 70, unit: 'kg' }
        },
        dose: { value: 100, unit: 'mg' },
        frequency: 'twice daily',
        route: 'by mouth'
      };

      expect(isMedicationRequestContext(invalid)).toBe(false);
    });

    it('should reject contexts with invalid dose', () => {
      const invalid = {
        id: 'req-bad-dose',
        timestamp: new Date().toISOString(),
        medication: mockMedication,
        patient: mockPatient,
        dose: { value: 'one hundred', unit: 'mg' }, // value should be number
        frequency: 'twice daily',
        route: 'by mouth'
      };

      expect(isMedicationRequestContext(invalid)).toBe(false);
    });
  });

  describe('Factory function', () => {
    it('should create basic medication request context', () => {
      const context = createMedicationRequestContext({
        medication: mockMedication,
        patient: mockPatient,
        doseValue: 100,
        doseUnit: 'mg',
        frequency: 'twice daily',
        route: 'by mouth'
      });

      expect(context.id).toMatch(/^ctx-[0-9]+-[0-9a-z]+$/);
      expect(context.timestamp).toBeDefined();
      expect(context.dose.value).toBe(100);
    });

    it('should create context with optional fields', () => {
      const context = createMedicationRequestContext({
        medication: mockMedication,
        patient: mockPatient,
        doseValue: 50,
        doseUnit: 'mg',
        frequency: 'once daily',
        route: 'by mouth',
        duration: { value: 90, unit: 'days' },
        quantity: { value: 90, unit: 'tablets' },
        refills: 2,
        specialInstructions: 'take at bedtime',
        prescriber: {
          id: 'doc-1',
          name: 'Dr. John Doe',
          npi: '9876543210'
        }
      });

      expect(context.duration?.value).toBe(90);
      expect(context.refills).toBe(2);
      expect(context.prescriber?.name).toBe('Dr. John Doe');
    });
  });

  describe('Validation', () => {
    it('should handle elderly patient context', () => {
      const elderlyPatient: PatientContext = {
        id: 'elderly-1',
        age: 85,
        weight: { value: 60, unit: 'kg' },
        gender: 'FEMALE',
        renalFunction: { egfr: 45, unit: 'mL/min/1.73m2' }
      };

      const context = createMedicationRequestContext({
        medication: mockMedication,
        patient: elderlyPatient,
        doseValue: 50, // Reduced dose for elderly
        doseUnit: 'mg',
        frequency: 'once daily',
        route: 'by mouth'
      });

      expect(context.patient.age).toBeGreaterThan(65);
      expect(context.patient.renalFunction?.egfr).toBeLessThan(60);
    });

    it('should handle pediatric patient context', () => {
      const pediatricPatient: PatientContext = {
        id: 'peds-1',
        age: 8,
        weight: { value: 25, unit: 'kg' },
        height: { value: 130, unit: 'cm' },
        gender: 'MALE'
      };

      const context = createMedicationRequestContext({
        medication: mockMedication,
        patient: pediatricPatient,
        doseValue: 25, // Weight-based dosing
        doseUnit: 'mg',
        frequency: 'twice daily',
        route: 'by mouth'
      });

      expect(context.patient.age).toBeLessThan(18);
      expect(context.patient.weight?.value).toBe(25);
    });
  });

  describe('Clinical context', () => {
    it('should support clinical context with ICD-10 codes', () => {
      const context = createMedicationRequestContext({
        medication: mockMedication,
        patient: mockPatient,
        doseValue: 100,
        doseUnit: 'mg',
        frequency: 'twice daily',
        route: 'by mouth',
        clinicalContext: {
          indication: 'Type 2 Diabetes Mellitus',
          icd10Codes: ['E11.9', 'E11.65'],
          notes: 'A1C improved from 8.5 to 7.2'
        }
      });

      expect(context.clinicalContext?.indication).toBe('Type 2 Diabetes Mellitus');
      expect(context.clinicalContext?.icd10Codes).toHaveLength(2);
    });
  });
});