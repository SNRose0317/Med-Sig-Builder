import { SimpleTabletBuilder } from '../SimpleTabletBuilder';
import { MedicationProfile, ScoringType } from '../../../types/MedicationProfile';
import { DoseInput, TimingInput } from '../ISignatureBuilder';

describe('SimpleTabletBuilder', () => {
  let mockMedication: MedicationProfile;

  beforeEach(() => {
    mockMedication = {
      id: 'med-123',
      name: 'Metformin',
      type: 'medication',
      isActive: true,
      doseForm: 'Tablet',
      code: { 
        coding: [{ display: 'Metformin 500mg' }] 
      },
      ingredient: [{
        name: 'Metformin Hydrochloride',
        strengthRatio: {
          numerator: { value: 500, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' }
        }
      }],
      isScored: ScoringType.HALF
    };
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with valid tablet medication', () => {
      const builder = new SimpleTabletBuilder(mockMedication);
      
      expect(builder).toBeDefined();
      const json = builder.toJSON() as any;
      expect(json.builderType).toBe('SimpleTabletBuilder');
      expect(json.medication.name).toBe('Metformin');
    });

    it('should reject invalid dose forms', () => {
      const invalidMedication = { 
        ...mockMedication, 
        doseForm: 'Injection' 
      };
      
      expect(() => {
        new SimpleTabletBuilder(invalidMedication);
      }).toThrow('Invalid dose form for TabletBuilder: Injection');
    });

    it('should accept valid tablet dose forms', () => {
      const validForms = ['tablet', 'capsule', 'troche', 'odt'];
      
      validForms.forEach(form => {
        const medication = { ...mockMedication, doseForm: form };
        expect(() => new SimpleTabletBuilder(medication)).not.toThrow();
      });
    });
  });

  describe('Dose Validation', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should accept whole tablet doses', () => {
      expect(() => {
        builder.buildDose({ value: 1, unit: 'tablet' });
      }).not.toThrow();
      
      expect(() => {
        builder.buildDose({ value: 2, unit: 'tablets' });
      }).not.toThrow();
    });

    it('should reject doses less than 1/4 tablet', () => {
      expect(() => {
        builder.buildDose({ value: 0.1, unit: 'tablet' });
      }).toThrow('Dose cannot be less than 1/4 tablet');
    });

    it('should validate fractional doses against scoring type', () => {
      // Half-scored tablet should allow 0.5
      expect(() => {
        builder.buildDose({ value: 0.5, unit: 'tablet' });
      }).not.toThrow();

      // Half-scored tablet should reject 0.25
      expect(() => {
        builder.buildDose({ value: 0.25, unit: 'tablet' });
      }).toThrow('Only half-tablet doses allowed for half-scored tablet');
    });

    it('should handle quarter-scored tablets', () => {
      const quarterScored = { 
        ...mockMedication, 
        isScored: ScoringType.QUARTER 
      };
      const builder = new SimpleTabletBuilder(quarterScored);

      // Should allow quarter fractions
      expect(() => {
        builder.buildDose({ value: 0.25, unit: 'tablet' });
      }).not.toThrow();
      
      expect(() => {
        builder.buildDose({ value: 0.75, unit: 'tablet' });
      }).not.toThrow();

      // Should reject invalid fractions
      expect(() => {
        builder.buildDose({ value: 0.33, unit: 'tablet' });
      }).toThrow('Invalid fraction 0.33 for quarter-scored tablet');
    });

    it('should reject fractional doses for unscored tablets', () => {
      const unscored = { 
        ...mockMedication, 
        isScored: ScoringType.NONE 
      };
      const builder = new SimpleTabletBuilder(unscored);

      expect(() => {
        builder.buildDose({ value: 0.5, unit: 'tablet' });
      }).toThrow('Fractional dose 0.5 not allowed for unscored tablet');
    });

    it('should allow mg/mcg doses without fractional validation', () => {
      expect(() => {
        builder.buildDose({ value: 2.5, unit: 'mg' });
      }).not.toThrow();
      
      expect(() => {
        builder.buildDose({ value: 250.5, unit: 'mcg' });
      }).not.toThrow();
    });
  });

  describe('Fluent API', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should support method chaining', () => {
      const result = builder
        .buildDose({ value: 1, unit: 'tablet' })
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

  describe('Instruction Generation', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should generate complete instruction', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'tablet' })
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

      builder.buildDose({ value: 1, unit: 'tablet' });
      expect(() => {
        builder.getResult();
      }).toThrow('No timing configured');

      builder.buildTiming({ frequency: 2, period: 1, periodUnit: 'd' });
      expect(() => {
        builder.getResult();
      }).toThrow('No route configured');
    });

    it('should include special instructions in output', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food', 'at bedtime'])
        .getResult();

      expect(instructions[0].additionalInstructions).toHaveLength(2);
      expect(instructions[0].additionalInstructions![0].text).toBe('with food');
      expect(instructions[0].additionalInstructions![1].text).toBe('at bedtime');
    });

    it('should handle PRN instructions', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('by mouth')
        .buildAsNeeded({ asNeeded: true, indication: 'for pain' })
        .getResult();

      expect(instructions[0].additionalInstructions).toBeDefined();
      const prnInstruction = instructions[0].additionalInstructions!
        .find(inst => inst.text && inst.text.includes('as needed'));
      expect(prnInstruction?.text).toBe('Take as needed for pain');
    });
  });

  describe('Dose Range Support', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should handle dose ranges', () => {
      const doseRange: DoseInput = {
        value: 1,
        unit: 'tablet',
        maxValue: 2
      };

      expect(() => {
        builder.buildDose(doseRange);
      }).not.toThrow();

      const json = builder.toJSON() as any;
      expect(json.state.doses[0].maxValue).toBe(2);
    });
  });

  describe('Multiple Doses (Tapering)', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should support multiple dose entries', () => {
      builder
        .buildDose({ value: 2, unit: 'tablets' })
        .buildDose({ value: 1, unit: 'tablet' })
        .buildDose({ value: 0.5, unit: 'tablet' });

      const json = builder.toJSON() as any;
      expect(json.state.doses).toHaveLength(3);
      expect(json.state.doses[0].value).toBe(2);
      expect(json.state.doses[1].value).toBe(1);
      expect(json.state.doses[2].value).toBe(0.5);
    });
  });

  describe('Audit Trail', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should maintain comprehensive audit trail', () => {
      builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food']);

      const audit = builder.explain();
      expect(audit).toContain('SimpleTabletBuilder initialized for Metformin');
      expect(audit).toContain('Validated dose form: Tablet');
      expect(audit).toContain('Added dose: 1 tablet');
      expect(audit).toContain('Validated fractional dose 1 against scoring type HALF');
      expect(audit).toContain('Set timing: 2 per 1 d');
      expect(audit).toContain('Set route: by mouth');
      expect(audit).toContain('Added 1 special instructions');
    });
  });

  describe('FHIR Compliance', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should generate FHIR-compliant dose structure', () => {
      const instructions = builder
        .buildDose({ value: 500, unit: 'mg' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const doseAndRate = instructions[0].doseAndRate![0];
      expect(doseAndRate.type?.coding?.[0]?.system).toBe('http://terminology.hl7.org/CodeSystem/dose-rate-type');
      expect(doseAndRate.type?.coding?.[0]?.code).toBe('ordered');
      expect(doseAndRate.doseQuantity?.value).toBe(500);
      expect(doseAndRate.doseQuantity?.unit).toBe('mg');
    });

    it('should generate FHIR-compliant timing structure', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ 
          frequency: 3, 
          period: 1, 
          periodUnit: 'd',
          when: ['MORN', 'NOON', 'EVE']
        })
        .buildRoute('by mouth')
        .getResult();

      const timing = instructions[0].timing!;
      expect(timing.repeat?.frequency).toBe(3);
      expect(timing.repeat?.period).toBe(1);
      expect(timing.repeat?.periodUnit).toBe('d');
      expect(timing.repeat?.when).toEqual(['MORN', 'NOON', 'EVE']);
    });

    it('should generate FHIR-compliant route structure', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const route = instructions[0].route!;
      expect(route.coding[0].system).toBe('http://snomed.info/sct');
      expect(route.coding[0].code).toBe('26643006');
      expect(route.coding[0].display).toBe('by mouth');
    });
  });

  describe('Serialization', () => {
    let builder: SimpleTabletBuilder;

    beforeEach(() => {
      builder = new SimpleTabletBuilder(mockMedication);
    });

    it('should serialize builder state', () => {
      builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth');

      const json = builder.toJSON() as any;
      expect(json.medication).toBeDefined();
      expect(json.state).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.builderType).toBe('SimpleTabletBuilder');
      expect(json.version).toBe('1.0.0');
      expect(json.state.doses).toHaveLength(1);
      expect(json.state.timing).toBeDefined();
      expect(json.state.route).toBe('by mouth');
    });
  });
});