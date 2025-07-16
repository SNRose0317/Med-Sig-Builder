import { SimpleLiquidBuilder } from '../SimpleLiquidBuilder';
import { MedicationProfile } from '../../../types/MedicationProfile';
import { DoseInput } from '../ISignatureBuilder';

// Type for builder JSON state for testing
interface BuilderJsonState extends Record<string, unknown> {
  builderType?: string;
  version?: string;
  timestamp?: unknown;
  state: {
    doses: Array<{ value: number; maxValue?: number; }>;
    timing?: unknown;
    route?: string;
  };
  medication: {
    name: string;
  };
}

describe('SimpleLiquidBuilder', () => {
  let mockLiquidMedication: MedicationProfile;
  let mockInjectionMedication: MedicationProfile;

  beforeEach(() => {
    mockLiquidMedication = {
      id: 'med-456',
      name: 'Amoxicillin Oral Suspension',
      type: 'medication',
      isActive: true,
      doseForm: 'Suspension',
      code: { 
        coding: [{ display: 'Amoxicillin 250mg/5mL' }] 
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
      }
    };

    mockInjectionMedication = {
      id: 'med-789',
      name: 'Morphine Injection',
      type: 'medication',
      isActive: true,
      doseForm: 'Injection',
      code: { 
        coding: [{ display: 'Morphine 10mg/mL' }] 
      },
      ingredient: [{
        name: 'Morphine Sulfate',
        strengthRatio: {
          numerator: { value: 10, unit: 'mg' },
          denominator: { value: 1, unit: 'mL' }
        }
      }]
    };
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with valid liquid medication', () => {
      const builder = new SimpleLiquidBuilder(mockLiquidMedication);
      
      expect(builder).toBeDefined();
      const json = builder.toJSON() as Record<string, unknown>;
      expect(json.builderType).toBe('SimpleLiquidBuilder');
      expect((json as BuilderJsonState).medication.name).toBe('Amoxicillin Oral Suspension');
    });

    it('should accept various liquid dose forms', () => {
      const validForms = ['solution', 'suspension', 'syrup', 'elixir', 'injection'];
      
      validForms.forEach(form => {
        const medication = { ...mockLiquidMedication, doseForm: form };
        expect(() => new SimpleLiquidBuilder(medication)).not.toThrow();
      });
    });
  });

  describe('Dose Validation', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should accept volume doses', () => {
      expect(() => {
        builder.buildDose({ value: 5, unit: 'mL' });
      }).not.toThrow();
      
      expect(() => {
        builder.buildDose({ value: 10, unit: 'milliliter' });
      }).not.toThrow();
    });

    it('should accept weight doses', () => {
      expect(() => {
        builder.buildDose({ value: 250, unit: 'mg' });
      }).not.toThrow();
      
      expect(() => {
        builder.buildDose({ value: 500, unit: 'mcg' });
      }).not.toThrow();
    });

    it('should reject non-positive doses', () => {
      expect(() => {
        builder.buildDose({ value: 0, unit: 'mL' });
      }).toThrow('Invalid dose input');
      
      expect(() => {
        builder.buildDose({ value: -5, unit: 'mg' });
      }).toThrow('Invalid dose input');
    });

    it('should warn about large volume doses', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      builder.buildDose({ value: 1500, unit: 'mL' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Large volume dose: 1500 mL. Please verify.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Concentration Handling', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should detect concentration data for weight doses', () => {
      builder.buildDose({ value: 250, unit: 'mg' });
      
      const audit = builder.explain();
      expect(audit).toContain('Weight dose detected with concentration available: 50 mg/mL');
    });

    it('should detect concentration data for volume doses', () => {
      builder.buildDose({ value: 5, unit: 'mL' });
      
      const audit = builder.explain();
      expect(audit).toContain('Volume dose detected with concentration available: 50 mg/mL');
    });
  });

  describe('Fluent API', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should support method chaining', () => {
      const result = builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food']);

      expect(result).toBe(builder);
    });

    it('should validate timing input', () => {
      expect(() => {
        builder.buildTiming({ frequency: 0, period: 1, periodUnit: 'd' });
      }).toThrow('Invalid timing input');
    });

    it('should validate route input', () => {
      expect(() => {
        builder.buildRoute('');
      }).toThrow('Invalid route input');
    });
  });

  describe('Route Validation', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should accept oral routes', () => {
      const oralRoutes = ['by mouth', 'orally', 'oral', 'PO'];
      
      oralRoutes.forEach(route => {
        expect(() => {
          builder.buildRoute(route);
        }).not.toThrow();
      });
    });

    it('should accept injection routes', () => {
      const injectionRoutes = ['intramuscularly', 'IM', 'intravenously', 'IV', 'subcutaneously', 'SC'];
      
      injectionRoutes.forEach(route => {
        expect(() => {
          builder.buildRoute(route);
        }).not.toThrow();
      });
    });

    it('should warn about unusual routes', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      builder.buildRoute('rectally');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unusual route for liquid: rectally. Expected oral, injection, or topical route.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Instruction Generation', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should generate complete instruction', () => {
      const instructions = builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      expect(instructions).toHaveLength(1);
      expect(instructions[0].text).toBeDefined();
      expect(instructions[0].doseAndRate).toHaveLength(1);
      expect(instructions[0].timing).toBeDefined();
      expect(instructions[0].route).toBeDefined();
    });

    it('should require complete builder state', () => {
      expect(() => {
        builder.getResult();
      }).toThrow('No doses configured');

      builder.buildDose({ value: 5, unit: 'mL' });
      expect(() => {
        builder.getResult();
      }).toThrow('No timing configured');

      builder.buildTiming({ frequency: 2, period: 1, periodUnit: 'd' });
      expect(() => {
        builder.getResult();
      }).toThrow('No route configured');
    });

    it('should include shake instruction for suspensions', () => {
      const instructions = builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      expect(instructions[0].additionalInstructions).toBeDefined();
      const shakeInstruction = instructions[0].additionalInstructions!
        .find(inst => inst.text?.includes('Shake well'));
      expect(shakeInstruction?.text).toBe('Shake well before use');
    });

    it('should include special instructions in output', () => {
      const instructions = builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food', 'refrigerate'])
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions!;
      const foodInstruction = additionalInstructions.find(inst => inst.text === 'with food');
      const refrigerateInstruction = additionalInstructions.find(inst => inst.text === 'refrigerate');
      
      expect(foodInstruction).toBeDefined();
      expect(refrigerateInstruction).toBeDefined();
    });

    it('should handle PRN instructions', () => {
      const instructions = builder
        .buildDose({ value: 2.5, unit: 'mL' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('by mouth')
        .buildAsNeeded({ asNeeded: true, indication: 'for pain' })
        .getResult();

      expect(instructions[0].additionalInstructions).toBeDefined();
      const prnInstruction = instructions[0].additionalInstructions!
        .find(inst => inst.text?.includes('as needed'));
      expect(prnInstruction?.text).toBe('Take as needed for pain');
    });
  });

  describe('Multiple Doses (Tapering)', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should support multiple dose entries', () => {
      builder
        .buildDose({ value: 10, unit: 'mL' })
        .buildDose({ value: 7.5, unit: 'mL' })
        .buildDose({ value: 5, unit: 'mL' });

      const json = builder.toJSON() as Record<string, unknown>;
      expect((json as BuilderJsonState).state.doses).toHaveLength(3);
      expect((json as BuilderJsonState).state.doses[0].value).toBe(10);
      expect((json as BuilderJsonState).state.doses[1].value).toBe(7.5);
      expect((json as BuilderJsonState).state.doses[2].value).toBe(5);
    });
  });

  describe('Dose Range Support', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should handle dose ranges', () => {
      const doseRange: DoseInput = {
        value: 5,
        unit: 'mL',
        maxValue: 10
      };

      expect(() => {
        builder.buildDose(doseRange);
      }).not.toThrow();

      const json = builder.toJSON() as Record<string, unknown>;
      expect((json as BuilderJsonState).state.doses[0].maxValue).toBe(10);
    });
  });

  describe('Audit Trail', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should maintain comprehensive audit trail', () => {
      builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food']);

      const audit = builder.explain();
      expect(audit).toContain('SimpleLiquidBuilder initialized for Amoxicillin Oral Suspension');
      expect(audit).toContain('Validated dose form: Suspension');
      expect(audit).toContain('Added dose: 5 mL');
      expect(audit).toContain('Volume dose detected with concentration available: 50 mg/mL');
      expect(audit).toContain('Set timing: 2 per 1 d');
      expect(audit).toContain('Set route: by mouth');
      expect(audit).toContain('Added 1 special instructions');
    });
  });

  describe('FHIR Compliance', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should generate FHIR-compliant dose structure', () => {
      const instructions = builder
        .buildDose({ value: 250, unit: 'mg' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const doseAndRate = instructions[0].doseAndRate![0];
      expect(doseAndRate.type?.coding?.[0]?.system).toBe('http://terminology.hl7.org/CodeSystem/dose-rate-type');
      expect(doseAndRate.type?.coding?.[0]?.code).toBe('ordered');
      expect(doseAndRate.doseQuantity?.value).toBe(250);
      expect(doseAndRate.doseQuantity?.unit).toBe('mg');
    });

    it('should generate FHIR-compliant route structure for oral', () => {
      const instructions = builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const route = instructions[0].route!;
      expect(route.coding[0].system).toBe('http://snomed.info/sct');
      expect(route.coding[0].code).toBe('26643006'); // Oral route
      expect(route.coding[0].display).toBe('by mouth');
    });

    it('should generate FHIR-compliant route structure for IM injection', () => {
      const injectionBuilder = new SimpleLiquidBuilder(mockInjectionMedication);
      
      const instructions = injectionBuilder
        .buildDose({ value: 1, unit: 'mL' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('intramuscularly')
        .getResult();

      const route = instructions[0].route!;
      expect(route.coding[0].system).toBe('http://snomed.info/sct');
      expect(route.coding[0].code).toBe('78421000'); // IM route
      expect(route.coding[0].display).toBe('intramuscularly');
    });
  });

  describe('Serialization', () => {
    let builder: SimpleLiquidBuilder;

    beforeEach(() => {
      builder = new SimpleLiquidBuilder(mockLiquidMedication);
    });

    it('should serialize builder state', () => {
      builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth');

      const json = builder.toJSON() as Record<string, unknown>;
      expect(json.medication).toBeDefined();
      expect(json.state).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.builderType).toBe('SimpleLiquidBuilder');
      expect(json.version).toBe('1.0.0');
      expect((json as BuilderJsonState).state.doses).toHaveLength(1);
      expect((json as BuilderJsonState).state.timing).toBeDefined();
      expect((json as BuilderJsonState).state.route).toBe('by mouth');
    });
  });
});