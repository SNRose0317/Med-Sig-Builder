import { FractionalTabletBuilder } from '../FractionalTabletBuilder';
import { MedicationProfile, ScoringType } from '../../../types/MedicationProfile';
import { DoseInput } from '../ISignatureBuilder';

// Type for builder JSON state for testing
interface BuilderJsonState extends Record<string, unknown> {
  builderType?: string;
  version?: string;
  timestamp?: unknown;
  features?: {
    unicodeFractions?: boolean;
    splittingInstructions?: boolean;
    inheritedValidation?: boolean;
  };
  state: {
    doses: Array<{ value: number; maxValue?: number; unit: string }>;
    timing?: unknown;
    route?: string;
  };
  medication: {
    name: string;
  };
}

describe('FractionalTabletBuilder', () => {
  let mockScoredMedication: MedicationProfile;
  let mockUnscoredMedication: MedicationProfile;
  let mockQuarterScoredMedication: MedicationProfile;

  beforeEach(() => {
    mockScoredMedication = {
      id: 'med-123',
      name: 'Test Tablet',
      type: 'medication',
      isActive: true,
      doseForm: 'Tablet',
      isScored: ScoringType.HALF,
      code: { 
        coding: [{ display: 'Test 100mg' }] 
      },
      ingredient: [{
        name: 'Test Drug',
        strengthRatio: {
          numerator: { value: 100, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' }
        }
      }]
    };

    mockUnscoredMedication = {
      ...mockScoredMedication,
      name: 'Unscored Tablet',
      isScored: ScoringType.NONE
    };

    mockQuarterScoredMedication = {
      ...mockScoredMedication,
      name: 'Quarter Scored Tablet',
      isScored: ScoringType.QUARTER
    };
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with valid medication', () => {
      const builder = new FractionalTabletBuilder(mockScoredMedication);
      
      expect(builder).toBeDefined();
      const json = builder.toJSON() as BuilderJsonState;
      expect(json.builderType).toBe('FractionalTabletBuilder');
      expect(json.features?.unicodeFractions).toBe(true);
      expect(json.features?.splittingInstructions).toBe(true);
      expect(json.features?.inheritedValidation).toBe(true);
    });

    it('should inherit medication validation from parent', () => {
      const liquidMedication = { ...mockScoredMedication, doseForm: 'Solution' };
      
      expect(() => {
        new FractionalTabletBuilder(liquidMedication);
      }).toThrow('Invalid dose form for TabletBuilder');
    });

    it('should include fractional builder in audit trail', () => {
      const builder = new FractionalTabletBuilder(mockScoredMedication);
      const audit = builder.explain();
      
      expect(audit).toContain('FractionalTabletBuilder initialized for enhanced fraction support');
    });
  });

  describe('Unicode Fraction Formatting', () => {
    let builder: FractionalTabletBuilder;

    beforeEach(() => {
      builder = new FractionalTabletBuilder(mockQuarterScoredMedication);
    });

    it('should format quarter fractions with Unicode symbols', () => {
      builder.buildDose({ value: 0.25, unit: 'tablet' });
      const audit = builder.explain();
      
      expect(audit).toContain('Formatted fractional dose: ¼ tablet');
    });

    it('should format half fractions with Unicode symbols', () => {
      builder.buildDose({ value: 0.5, unit: 'tablet' });
      const audit = builder.explain();
      
      expect(audit).toContain('Formatted fractional dose: ½ tablet');
    });

    it('should format three-quarter fractions with Unicode symbols', () => {
      builder.buildDose({ value: 0.75, unit: 'tablet' });
      const audit = builder.explain();
      
      expect(audit).toContain('Formatted fractional dose: ¾ tablet');
    });

    it('should format mixed whole and fractional doses', () => {
      builder.buildDose({ value: 1.5, unit: 'tablet' });
      const audit = builder.explain();
      
      expect(audit).toContain('Formatted fractional dose: 1½ tablet');
    });

    it('should format multiple fractional doses', () => {
      builder.buildDose({ value: 2.25, unit: 'tablet' });
      const audit = builder.explain();
      
      expect(audit).toContain('Formatted fractional dose: 2¼ tablet');
    });

    it('should handle whole numbers without fractions', () => {
      builder.buildDose({ value: 2, unit: 'tablet' });
      const audit = builder.explain();
      
      expect(audit).not.toContain('Formatted fractional dose');
    });

    it('should handle range doses with fractions', () => {
      const doseRange: DoseInput = {
        value: 0.5,
        unit: 'tablet',
        maxValue: 1.5
      };
      
      builder.buildDose(doseRange);
      const audit = builder.explain();
      
      expect(audit).toContain('Formatted fractional dose: ½ tablet');
    });

    it('should not format non-tablet units', () => {
      builder.buildDose({ value: 0.5, unit: 'mg' });
      const audit = builder.explain();
      
      expect(audit).not.toContain('Formatted fractional dose');
    });
  });

  describe('Splitting Instructions', () => {
    let builder: FractionalTabletBuilder;

    beforeEach(() => {
      builder = new FractionalTabletBuilder(mockQuarterScoredMedication);
    });

    it('should add splitting instruction for quarter tablets', () => {
      const instructions = builder
        .buildDose({ value: 0.25, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      expect(additionalInstructions).toBeDefined();
      
      const splittingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Split tablet into quarters, take one piece')
      );
      expect(splittingInstruction).toBeDefined();
    });

    it('should add splitting instruction for half tablets', () => {
      const instructions = builder
        .buildDose({ value: 0.5, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const splittingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Split tablet in half')
      );
      expect(splittingInstruction).toBeDefined();
    });

    it('should add splitting instruction for three-quarter tablets', () => {
      const instructions = builder
        .buildDose({ value: 0.75, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const splittingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Split tablet into quarters, take three pieces')
      );
      expect(splittingInstruction).toBeDefined();
    });

    it('should not add splitting instruction for whole tablets', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const splittingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Split tablet')
      );
      expect(splittingInstruction).toBeUndefined();
    });

    it('should not duplicate splitting instructions for same fractions', () => {
      const instructions = builder
        .buildDose({ value: 0.5, unit: 'tablet' })
        .buildDose({ value: 0.5, unit: 'tablet' }) // Same fraction
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const splittingInstructions = additionalInstructions?.filter(inst => 
        inst.text?.includes('Split tablet in half')
      );
      expect(splittingInstructions).toHaveLength(1);
    });

    it('should combine splitting instructions with other additional instructions', () => {
      const instructions = builder
        .buildDose({ value: 0.5, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food'])
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      expect(additionalInstructions).toHaveLength(2);
      
      const foodInstruction = additionalInstructions?.find(inst => inst.text === 'with food');
      const splittingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Split tablet in half')
      );
      
      expect(foodInstruction).toBeDefined();
      expect(splittingInstruction).toBeDefined();
    });

    it('should not add splitting instruction for non-tablet units', () => {
      const instructions = builder
        .buildDose({ value: 0.5, unit: 'mg' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const splittingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Split tablet')
      );
      expect(splittingInstruction).toBeUndefined();
    });
  });

  describe('Validation Inheritance', () => {
    it('should inherit fractional validation from SimpleTabletBuilder', () => {
      const builder = new FractionalTabletBuilder(mockUnscoredMedication);
      
      expect(() => {
        builder.buildDose({ value: 0.5, unit: 'tablet' });
      }).toThrow('Fractional dose 0.5 not allowed for unscored tablet');
    });

    it('should inherit minimum dose validation', () => {
      const builder = new FractionalTabletBuilder(mockQuarterScoredMedication);
      
      expect(() => {
        builder.buildDose({ value: 0.1, unit: 'tablet' });
      }).toThrow('Dose cannot be less than 1/4 tablet');
    });

    it('should inherit scoring level validation', () => {
      const builder = new FractionalTabletBuilder(mockScoredMedication); // Half scored
      
      expect(() => {
        builder.buildDose({ value: 0.25, unit: 'tablet' });
      }).toThrow('Only half-tablet doses allowed for half-scored tablet, got 0.25');
    });

    it('should inherit all builder state validation', () => {
      const builder = new FractionalTabletBuilder(mockScoredMedication);
      
      expect(() => {
        builder.getResult();
      }).toThrow('No doses configured');
    });
  });

  describe('Enhanced Audit Trail', () => {
    let builder: FractionalTabletBuilder;

    beforeEach(() => {
      builder = new FractionalTabletBuilder(mockQuarterScoredMedication);
    });

    it('should include splitting instruction in audit trail', () => {
      builder.buildDose({ value: 0.25, unit: 'tablet' });
      const audit = builder.explain();
      
      expect(audit).toContain('Splitting instruction: Split tablet into quarters, take one piece');
    });

    it('should show fractional summary in explanation', () => {
      builder
        .buildDose({ value: 0.5, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const explanation = builder.explain();
      expect(explanation).toContain('--- Fractional Tablet Features ---');
      expect(explanation).toContain('Fractional doses: ½ tablet');
      expect(explanation).toContain('Unicode formatting: Enabled');
      expect(explanation).toContain('Splitting instructions: 1 added');
    });

    it('should format fractional doses in audit trail', () => {
      const doseRange: DoseInput = {
        value: 0.25,
        unit: 'tablet',
        maxValue: 0.75
      };
      
      builder.buildDose(doseRange);
      const audit = builder.explain();
      
      expect(audit).toContain('Added dose: ¼-¾ tablet');
    });
  });

  describe('FHIR Compliance', () => {
    let builder: FractionalTabletBuilder;

    beforeEach(() => {
      builder = new FractionalTabletBuilder(mockQuarterScoredMedication);
    });

    it('should maintain FHIR-compliant structure', () => {
      const instructions = builder
        .buildDose({ value: 0.5, unit: 'tablet' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      expect(instructions).toHaveLength(1);
      expect(instructions[0].text).toBeDefined();
      expect(instructions[0].doseAndRate).toBeDefined();
      expect(instructions[0].timing).toBeDefined();
      expect(instructions[0].route).toBeDefined();
    });

    it('should generate proper dose and rate structure', () => {
      const instructions = builder
        .buildDose({ value: 0.75, unit: 'tablet' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const doseAndRate = instructions[0].doseAndRate?.[0];
      expect(doseAndRate?.type?.coding?.[0]?.system).toBe('http://terminology.hl7.org/CodeSystem/dose-rate-type');
      expect(doseAndRate?.type?.coding?.[0]?.code).toBe('ordered');
      expect(doseAndRate?.doseQuantity?.value).toBe(0.75);
      expect(doseAndRate?.doseQuantity?.unit).toBe('tablet');
    });
  });

  describe('Edge Cases', () => {
    let builder: FractionalTabletBuilder;

    beforeEach(() => {
      builder = new FractionalTabletBuilder(mockQuarterScoredMedication);
    });

    it('should handle rounding errors in fractional calculations', () => {
      // Test with value that might have floating point precision issues
      // Use a value that would be valid but needs rounding
      const dose = { value: 0.7499999999999999, unit: 'tablet' };
      builder.buildDose(dose);
      
      const audit = builder.explain();
      expect(audit).toContain('Formatted fractional dose: ¾ tablet');
    });

    it('should handle multiple fractional doses', () => {
      builder
        .buildDose({ value: 0.25, unit: 'tablet' })
        .buildDose({ value: 0.5, unit: 'tablet' })
        .buildDose({ value: 0.75, unit: 'tablet' });

      const instructions = builder
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      expect(additionalInstructions).toHaveLength(3); // One for each unique fraction
    });

    it('should handle invalid fractional input gracefully', () => {
      expect(() => {
        builder.buildDose({ value: 0, unit: 'tablet' });
      }).toThrow('Invalid dose input');
    });

    it('should handle capsule units with fractional dosing', () => {
      builder.buildDose({ value: 0.5, unit: 'capsule' });
      const audit = builder.explain();
      
      expect(audit).toContain('Formatted fractional dose: ½ capsule');
    });
  });

  describe('Serialization', () => {
    it('should serialize builder state with fractional features', () => {
      const builder = new FractionalTabletBuilder(mockScoredMedication);
      
      builder
        .buildDose({ value: 0.5, unit: 'tablet' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth');

      const json = builder.toJSON() as BuilderJsonState;
      
      expect(json.medication).toBeDefined();
      expect(json.state).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.builderType).toBe('FractionalTabletBuilder');
      expect(json.features?.unicodeFractions).toBe(true);
      expect(json.features?.splittingInstructions).toBe(true);
      expect(json.features?.inheritedValidation).toBe(true);
    });
  });
});