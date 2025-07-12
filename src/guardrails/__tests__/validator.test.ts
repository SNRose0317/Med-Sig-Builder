import { GuardrailsValidator, PatientContext } from '../validator';
import {
  GuardrailsSchema,
  MedicationConstraints,
  GuardrailValidationResult,
  ClinicalOverride
} from '../types';
import { DoseInput } from '../../lib/builders/ISignatureBuilder';

// Mock the file system to avoid reading actual YAML files
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => `
version: "1.0.0"
effective_date: "2024-01-01"
approved_by:
  - name: "Dr. Test"
    role: "Clinical Reviewer"
    date: "2024-01-01"

medications:
  metformin:
    brandNames: ["Glucophage"]
    maxDailyDose:
      value: 2000
      unit: mg
      populations:
        - condition: "age < 18"
          value: 1000
          unit: mg
          reason: "Pediatric limit"
        - condition: "egfr < 45 && egfr >= 30"
          value: 1000
          unit: mg
          reason: "Renal impairment"
    maxSingleDose:
      value: 1000
      unit: mg
    contraindications:
      - condition: "egfr < 30"
        severity: absolute
        message: "Contraindicated in severe renal impairment"
      - condition: "metabolic_acidosis"
        severity: absolute
        message: "Contraindicated in metabolic acidosis"
      - condition: "age >= 80"
        severity: relative
        message: "Use with caution in elderly patients"
  
  testosterone_cypionate:
    minSingleDose:
      value: 50
      unit: mg
    maxSingleDose:
      value: 200
      unit: mg
    doseStep:
      value: 50
      unit: mg

injection_constraints:
  subcutaneous:
    maxVolumePerSite:
      value: 1.0
      unit: mL
    notes: "Rotate injection sites"
  
  intramuscular:
    maxVolumePerSite:
      default:
        value: 5.0
        unit: mL
      sites:
        deltoid:
          value: 2.0
          unit: mL
        gluteal:
          value: 5.0
          unit: mL

reconstitution_rules:
  defaultBeyondUseDate: "1 hour at room temperature"

special_handling:
  hazardousDrugs: []
  lightSensitive: []

fractional_dosing:
  tabletSplitting:
    allowedFractions: [0.5, 0.25]
    notAllowed: ["extended_release"]

drug_interactions:
  - drugs: ["metformin", "contrast_media"]
    severity: major
    effect: "Risk of lactic acidosis"
    recommendation: "Hold metformin 48 hours before and after contrast"
  - drugs: ["ibuprofen", "warfarin"]
    severity: moderate
    effect: "Increased bleeding risk"
    recommendation: "Monitor INR closely"

override_template:
  requiredFields: ["reason", "prescriber", "date"]
  example: "Override example"
`)
}));

describe('GuardrailsValidator', () => {
  let validator: GuardrailsValidator;

  beforeEach(() => {
    validator = new GuardrailsValidator();
  });

  describe('loadSchema', () => {
    it('should load and parse YAML schema', () => {
      const schema = validator.loadSchema();
      expect(schema).toBeDefined();
      expect(schema.version).toBe('1.0.0');
      expect(schema.medications).toHaveProperty('metformin');
    });

    it('should validate schema structure', () => {
      const schema = validator.loadSchema();
      expect(schema.approved_by).toHaveLength(1);
      expect(schema.approved_by[0].name).toBe('Dr. Test');
    });
  });

  describe('validateDose', () => {
    describe('daily dose validation', () => {
      it('should pass valid daily dose', () => {
        const dose: DoseInput = { value: 1500, unit: 'mg' };
        const result = validator.validateDose('metformin', dose, true);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('should fail excessive daily dose', () => {
        const dose: DoseInput = { value: 2500, unit: 'mg' };
        const result = validator.validateDose('metformin', dose, true);
        
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].type).toBe('dose_limit');
        expect(result.errors![0].message).toContain('exceeds maximum 2000 mg');
      });

      it('should apply pediatric dose limit', () => {
        const dose: DoseInput = { value: 1500, unit: 'mg' };
        const context: PatientContext = { age: 15 };
        const result = validator.validateDose('metformin', dose, true, context);
        
        expect(result.valid).toBe(false);
        expect(result.errors![0].message).toContain('exceeds maximum 1000 mg');
      });

      it('should apply renal impairment limit', () => {
        const dose: DoseInput = { value: 1500, unit: 'mg' };
        const context: PatientContext = { egfr: 40 };
        const result = validator.validateDose('metformin', dose, true, context);
        
        expect(result.valid).toBe(false);
        expect(result.errors![0].message).toContain('exceeds maximum 1000 mg');
      });
    });

    describe('single dose validation', () => {
      it('should pass valid single dose', () => {
        const dose: DoseInput = { value: 500, unit: 'mg' };
        const result = validator.validateDose('metformin', dose, false);
        
        expect(result.valid).toBe(true);
      });

      it('should fail excessive single dose', () => {
        const dose: DoseInput = { value: 1500, unit: 'mg' };
        const result = validator.validateDose('metformin', dose, false);
        
        expect(result.valid).toBe(false);
        expect(result.errors![0].message).toContain('exceeds maximum 1000 mg');
      });
    });

    describe('dose constraints', () => {
      it('should warn about subtherapeutic dose', () => {
        const dose: DoseInput = { value: 25, unit: 'mg' };
        const result = validator.validateDose('testosterone_cypionate', dose, false);
        
        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(2); // subtherapeutic + not a step
        expect(result.warnings![0].type).toBe('subtherapeutic_dose');
      });

      it('should warn about non-standard dose increment', () => {
        const dose: DoseInput = { value: 75, unit: 'mg' };
        const result = validator.validateDose('testosterone_cypionate', dose, false);
        
        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings![0].type).toBe('dose_step');
        expect(result.warnings![0].message).toContain('not a multiple of standard increment 50');
      });
    });

    describe('clinical overrides', () => {
      it('should convert errors to warnings with override', () => {
        const dose: DoseInput = { value: 3000, unit: 'mg' };
        const override: ClinicalOverride = {
          reason: 'Severe hyperglycemia, failed standard dosing',
          prescriber: 'Dr. Smith',
          date: '2024-01-15',
          constraintOverridden: 'max_daily_dose'
        };
        
        const result = validator.validateDose('metformin', dose, true, undefined, override);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.some(w => w.type === 'clinical_override')).toBe(true);
      });
    });

    describe('unknown medications', () => {
      it('should warn for unknown medication', () => {
        const dose: DoseInput = { value: 100, unit: 'mg' };
        const result = validator.validateDose('unknown_drug', dose, false);
        
        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings![0].type).toBe('unknown_medication');
      });
    });

    describe('brand name resolution', () => {
      it('should resolve brand names to generic', () => {
        const dose: DoseInput = { value: 2500, unit: 'mg' };
        const result = validator.validateDose('Glucophage', dose, true);
        
        expect(result.valid).toBe(false);
        expect(result.errors![0].message).toContain('exceeds maximum 2000 mg');
      });
    });
  });

  describe('validateContraindications', () => {
    it('should detect absolute contraindication', () => {
      const context: PatientContext = { egfr: 25 };
      const result = validator.validateContraindications('metformin', context);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].type).toBe('contraindication');
      expect(result.errors![0].severity).toBe('error');
      expect(result.errors![0].message).toContain('severe renal impairment');
    });

    it('should detect relative contraindication as warning', () => {
      const context: PatientContext = { age: 82 };
      const result = validator.validateContraindications('metformin', context);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0].type).toBe('relative_contraindication');
    });

    it('should detect condition-based contraindication', () => {
      const context: PatientContext = { conditions: ['metabolic_acidosis'] };
      const result = validator.validateContraindications('metformin', context);
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].message).toContain('metabolic acidosis');
    });

    it('should pass when no contraindications apply', () => {
      const context: PatientContext = { age: 45, egfr: 90 };
      const result = validator.validateContraindications('metformin', context);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('validateInjectionVolume', () => {
    it('should pass valid subcutaneous volume', () => {
      const result = validator.validateInjectionVolume(
        'subcutaneous',
        { value: 0.5, unit: 'mL' }
      );
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1); // Should include the rotation note
      expect(result.warnings![0].message).toContain('Rotate injection sites');
    });

    it('should fail excessive subcutaneous volume', () => {
      const result = validator.validateInjectionVolume(
        'subcutaneous',
        { value: 1.5, unit: 'mL' }
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].type).toBe('route_constraint');
      expect(result.errors![0].message).toContain('exceeds maximum 1 mL');
    });

    it('should use site-specific limits for intramuscular', () => {
      const result = validator.validateInjectionVolume(
        'intramuscular',
        { value: 3.0, unit: 'mL' },
        'deltoid'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].message).toContain('exceeds maximum 2 mL');
      expect(result.errors![0].message).toContain('deltoid');
    });

    it('should pass valid gluteal injection', () => {
      const result = validator.validateInjectionVolume(
        'intramuscular',
        { value: 4.0, unit: 'mL' },
        'gluteal'
      );
      
      expect(result.valid).toBe(true);
    });

    it('should use default limit when site not specified', () => {
      const result = validator.validateInjectionVolume(
        'intramuscular',
        { value: 6.0, unit: 'mL' }
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].message).toContain('exceeds maximum 5 mL');
    });
  });

  describe('validateDrugInteractions', () => {
    it('should detect major drug interaction', () => {
      const medications = ['metformin', 'iodinated contrast media'];
      const result = validator.validateDrugInteractions(medications);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].type).toBe('interaction');
      expect(result.errors![0].message).toContain('lactic acidosis');
    });

    it('should detect moderate interaction as warning', () => {
      const medications = ['ibuprofen', 'warfarin'];
      const result = validator.validateDrugInteractions(medications);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0].type).toBe('drug_interaction');
      expect(result.warnings![0].recommendation).toContain('Monitor INR');
    });

    it('should handle case-insensitive matching', () => {
      const medications = ['METFORMIN', 'Contrast Media'];
      const result = validator.validateDrugInteractions(medications);
      
      expect(result.valid).toBe(false);
    });

    it('should pass when no interactions exist', () => {
      const medications = ['metformin', 'lisinopril'];
      const result = validator.validateDrugInteractions(medications);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });

    it('should require at least 2 drugs from interaction list', () => {
      const medications = ['metformin'];
      const result = validator.validateDrugInteractions(medications);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate age conditions correctly', () => {
      const testCases = [
        { condition: 'age < 18', context: { age: 15 }, expected: true },
        { condition: 'age < 18', context: { age: 20 }, expected: false },
        { condition: 'age >= 65', context: { age: 70 }, expected: true },
        { condition: 'age >= 65', context: { age: 60 }, expected: false },
      ];

      testCases.forEach(({ condition, context, expected }) => {
        // Use private method testing through dose validation
        const dose: DoseInput = { value: 1500, unit: 'mg' };
        const result = validator.validateDose('metformin', dose, true, context);
        
        if (context.age < 18 && expected) {
          expect(result.valid).toBe(false); // Should apply pediatric limit
        }
      });
    });

    it('should evaluate eGFR range conditions', () => {
      const dose: DoseInput = { value: 1500, unit: 'mg' };
      
      // Test within range
      const result1 = validator.validateDose('metformin', dose, true, { egfr: 35 });
      expect(result1.valid).toBe(false); // Should apply renal limit
      
      // Test outside range
      const result2 = validator.validateDose('metformin', dose, true, { egfr: 50 });
      expect(result2.valid).toBe(true); // Should not apply renal limit
    });
  });
});