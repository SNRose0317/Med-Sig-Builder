import { NasalSprayBuilder } from '../NasalSprayBuilder';
import { MedicationProfile } from '../../../types/MedicationProfile';
import { DoseInput } from '../ISignatureBuilder';

// Type for builder JSON state for testing
interface BuilderJsonState extends Record<string, unknown> {
  builderType?: string;
  version?: string;
  timestamp?: unknown;
  nasalSprayFeatures?: {
    nostrilPattern?: boolean;
    primingRequired?: boolean;
    displayFormat?: string;
    maxSprayValidation?: boolean;
  };
  originalDose?: DoseInput;
  state: {
    doses: Array<{ value: number; maxValue?: number; unit: string }>;
    timing?: unknown;
    route?: string;
  };
  medication: {
    name: string;
  };
}

describe('NasalSprayBuilder', () => {
  let mockNasalSprayMedication: MedicationProfile;
  let mockNasalSprayWithStrength: MedicationProfile;

  beforeEach(() => {
    mockNasalSprayMedication = {
      id: 'med-nasal-spray',
      name: 'Fluticasone Nasal Spray',
      type: 'medication',
      isActive: true,
      doseForm: 'Nasal Spray',
      dispenserInfo: {
        type: 'NasalSpray',
        unit: 'spray',
        pluralUnit: 'sprays',
        conversionRatio: 50, // 50 mcg per spray
        maxAmountPerDose: 2
      },
      code: { 
        coding: [{ display: 'Fluticasone propionate nasal spray' }] 
      },
      ingredient: [{
        name: 'Fluticasone propionate',
        strengthRatio: {
          numerator: { value: 50, unit: 'mcg' },
          denominator: { value: 1, unit: 'spray' }
        }
      }]
    };

    mockNasalSprayWithStrength = {
      ...mockNasalSprayMedication,
      name: 'Oxymetazoline Nasal Spray',
      ingredient: [{
        name: 'Oxymetazoline',
        strengthRatio: {
          numerator: { value: 0.05, unit: 'mg' },
          denominator: { value: 1, unit: 'spray' }
        }
      }]
    };
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with valid nasal spray medication', () => {
      const builder = new NasalSprayBuilder(mockNasalSprayMedication);
      
      expect(builder).toBeDefined();
      const json = builder.toJSON() as BuilderJsonState;
      expect(json.builderType).toBe('NasalSprayBuilder');
      expect(json.nasalSprayFeatures?.nostrilPattern).toBe(true);
      expect(json.nasalSprayFeatures?.primingRequired).toBe(true);
      expect(json.nasalSprayFeatures?.displayFormat).toBe('X sprays (Y mcg)');
      expect(json.nasalSprayFeatures?.maxSprayValidation).toBe(true);
    });

    it('should accept medications with NasalSpray dispenser info', () => {
      expect(() => {
        new NasalSprayBuilder(mockNasalSprayMedication);
      }).not.toThrow();
    });

    it('should warn about unusual dose forms without NasalSpray dispenser', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const tabletMedication = { ...mockNasalSprayMedication, doseForm: 'Tablet', dispenserInfo: undefined };
      new NasalSprayBuilder(tabletMedication);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Potentially invalid dose form for LiquidBuilder: Tablet. Expected: solution, suspension, syrup, elixir, tincture, injection, vial'
      );
      
      consoleSpy.mockRestore();
    });

    it('should include NasalSpray builder in audit trail', () => {
      const builder = new NasalSprayBuilder(mockNasalSprayMedication);
      const audit = builder.explain();
      
      expect(audit).toContain('NasalSprayBuilder initialized for nasal spray medication');
    });
  });

  describe('Spray Unit Handling', () => {
    let builder: NasalSprayBuilder;

    beforeEach(() => {
      builder = new NasalSprayBuilder(mockNasalSprayWithStrength);
    });

    it('should handle spray unit input', () => {
      builder.buildDose({ value: 2, unit: 'sprays' });
      const audit = builder.explain();
      
      expect(audit).toContain('Added dose: 2 sprays');
    });

    it('should calculate mcg equivalent from sprays', () => {
      builder.buildDose({ value: 2, unit: 'sprays' });
      const audit = builder.explain();
      
      expect(audit).toContain('Calculated dose: 2 sprays = 100.0 mcg');
    });

    it('should handle single spray dose', () => {
      builder.buildDose({ value: 1, unit: 'spray' });
      const audit = builder.explain();
      
      expect(audit).toContain('Added dose: 1 spray');
    });

    it('should handle range doses with sprays', () => {
      const doseRange: DoseInput = {
        value: 1,
        unit: 'sprays',
        maxValue: 2
      };
      
      builder.buildDose(doseRange);
      const audit = builder.explain();
      
      expect(audit).toContain('Added dose: 1 spray (50.0 mcg) - 2 sprays (100.0 mcg)');
    });

    it('should handle non-spray units normally', () => {
      builder.buildDose({ value: 1, unit: 'mL' });
      const audit = builder.explain();
      
      expect(audit).not.toContain('Calculated dose: 1 sprays');
      expect(audit).toContain('Added dose: 1 mL');
    });
  });

  describe('Display Formatting', () => {
    let builder: NasalSprayBuilder;

    beforeEach(() => {
      builder = new NasalSprayBuilder(mockNasalSprayMedication);
    });

    it('should format spray display as "X sprays (Y mcg)"', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      expect(instructions[0].text).toContain('2 sprays (100.0 mcg)');
    });

    it('should format single spray as "1 spray"', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'spray' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      expect(instructions[0].text).toContain('1 spray (50.0 mcg)');
    });

    it('should format multiple sprays as "X sprays"', () => {
      // Use a medication without max spray limit for this test
      const medicationNoLimit = { ...mockNasalSprayMedication, dispenserInfo: undefined };
      const builderNoLimit = new NasalSprayBuilder(medicationNoLimit);
      
      const instructions = builderNoLimit
        .buildDose({ value: 3, unit: 'sprays' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      expect(instructions[0].text).toContain('3 sprays (150.0 mcg)');
    });

    it('should fallback to spray count when no strength available', () => {
      const medicationNoStrength = { ...mockNasalSprayMedication, ingredient: [], dispenserInfo: undefined };
      const builderNoStrength = new NasalSprayBuilder(medicationNoStrength);
      
      const instructions = builderNoStrength
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      expect(instructions[0].text).toContain('2 sprays');
      expect(instructions[0].text).not.toContain('mcg');
    });

    it('should not modify non-spray dose displays', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      expect(instructions[0].text).toContain('1 mL');
      expect(instructions[0].text).not.toContain('spray');
    });
  });

  describe('Device Instructions', () => {
    let builder: NasalSprayBuilder;

    beforeEach(() => {
      builder = new NasalSprayBuilder(mockNasalSprayMedication);
    });

    it('should add priming instruction', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      expect(additionalInstructions).toBeDefined();
      
      const primingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Prime spray before first use')
      );
      expect(primingInstruction).toBeDefined();
    });

    it('should add nostril alternation instruction for multiple sprays', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const nostrilInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Alternate nostrils with each spray')
      );
      expect(nostrilInstruction).toBeDefined();
    });

    it('should not add nostril alternation for single spray', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'spray' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const nostrilInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Alternate nostrils with each spray')
      );
      expect(nostrilInstruction).toBeUndefined();
    });

    it('should add administration instruction', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const adminInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Gently blow nose before use')
      );
      expect(adminInstruction).toBeDefined();
    });

    it('should add cleaning instruction', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const cleaningInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Wipe tip clean after each use')
      );
      expect(cleaningInstruction).toBeDefined();
    });

    it('should combine nasal spray instructions with other additional instructions', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .buildSpecialInstructions(['avoid contact with eyes'])
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      expect(additionalInstructions).toHaveLength(5); // 4 nasal spray + 1 special
      
      const specialInstruction = additionalInstructions?.find(inst => 
        inst.text === 'avoid contact with eyes'
      );
      expect(specialInstruction).toBeDefined();
    });

    it('should not add nasal spray instructions for non-spray doses', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const sprayInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('spray')
      );
      expect(sprayInstruction).toBeUndefined();
    });
  });

  describe('Validation and Error Handling', () => {
    let builder: NasalSprayBuilder;

    beforeEach(() => {
      builder = new NasalSprayBuilder(mockNasalSprayMedication);
    });

    it('should validate dose input', () => {
      expect(() => {
        builder.buildDose({ value: 0, unit: 'sprays' });
      }).toThrow('Invalid dose input');
    });

    it('should validate negative sprays', () => {
      expect(() => {
        builder.buildDose({ value: -1, unit: 'sprays' });
      }).toThrow('Invalid dose input');
    });

    it('should validate maximum sprays per dose', () => {
      expect(() => {
        builder.buildDose({ value: 5, unit: 'sprays' }); // Max is 2
      }).toThrow('Spray count 5 exceeds maximum 2 sprays per dose');
    });

    it('should warn about high spray counts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const medicationNoLimit = { ...mockNasalSprayMedication, dispenserInfo: undefined };
      const builderNoLimit = new NasalSprayBuilder(medicationNoLimit);
      
      builderNoLimit.buildDose({ value: 6, unit: 'sprays' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'High spray count: 6 sprays per dose. Consider reviewing dosage.'
      );
      
      consoleSpy.mockRestore();
    });

    it('should require complete builder state', () => {
      expect(() => {
        builder.getResult();
      }).toThrow('No doses configured');
    });

    it('should inherit liquid builder validation', () => {
      builder.buildDose({ value: 2, unit: 'sprays' });
      
      expect(() => {
        builder.getResult();
      }).toThrow('No timing configured');
    });
  });

  describe('Enhanced Audit Trail', () => {
    let builder: NasalSprayBuilder;

    beforeEach(() => {
      builder = new NasalSprayBuilder(mockNasalSprayMedication);
    });

    it('should include spray validation in audit trail', () => {
      builder.buildDose({ value: 2, unit: 'sprays' });
      const audit = builder.explain();
      
      expect(audit).toContain('Validated spray count: 2 sprays');
    });

    it('should include mcg calculation in audit trail', () => {
      builder.buildDose({ value: 2, unit: 'sprays' });
      const audit = builder.explain();
      
      expect(audit).toContain('Calculated dose: 2 sprays = 100.0 mcg');
    });

    it('should show nasal spray summary in explanation', () => {
      builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const explanation = builder.explain();
      expect(explanation).toContain('--- Nasal Spray Dispenser Features ---');
      expect(explanation).toContain('Original dose: 2 sprays (100.0 mcg)');
      expect(explanation).toContain('Mcg equivalent: 100.0 mcg');
      expect(explanation).toContain('Nostril pattern: Alternate nostrils');
      expect(explanation).toContain('Priming required: Yes');
      expect(explanation).toContain('Device instructions: 4 added');
    });

    it('should format spray doses in audit trail', () => {
      const doseRange: DoseInput = {
        value: 1,
        unit: 'sprays',
        maxValue: 2
      };
      
      builder.buildDose(doseRange);
      const audit = builder.explain();
      
      expect(audit).toContain('Added dose: 1 spray (50.0 mcg) - 2 sprays (100.0 mcg)');
    });
  });

  describe('FHIR Compliance', () => {
    let builder: NasalSprayBuilder;

    beforeEach(() => {
      builder = new NasalSprayBuilder(mockNasalSprayMedication);
    });

    it('should maintain FHIR-compliant structure', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      expect(instructions).toHaveLength(1);
      expect(instructions[0].text).toBeDefined();
      expect(instructions[0].doseAndRate).toBeDefined();
      expect(instructions[0].timing).toBeDefined();
      expect(instructions[0].route).toBeDefined();
    });

    it('should generate proper dose and rate structure', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const doseAndRate = instructions[0].doseAndRate?.[0];
      expect(doseAndRate?.type?.coding?.[0]?.system).toBe('http://terminology.hl7.org/CodeSystem/dose-rate-type');
      expect(doseAndRate?.type?.coding?.[0]?.code).toBe('ordered');
      expect(doseAndRate?.doseQuantity?.value).toBe(2);
      expect(doseAndRate?.doseQuantity?.unit).toBe('sprays');
    });

    it('should generate proper timing structure', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'spray' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally')
        .getResult();

      const timing = instructions[0].timing;
      expect(timing?.repeat?.frequency).toBe(2);
      expect(timing?.repeat?.period).toBe(1);
      expect(timing?.repeat?.periodUnit).toBe('d');
    });
  });

  describe('Edge Cases and Integration', () => {
    let builder: NasalSprayBuilder;

    beforeEach(() => {
      builder = new NasalSprayBuilder(mockNasalSprayMedication);
    });

    it('should handle PRN instructions with sprays', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'spray' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('intranasally')
        .buildAsNeeded({ asNeeded: true, indication: 'for congestion' })
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const prnInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('as needed for congestion')
      );
      expect(prnInstruction).toBeDefined();
    });

    it('should handle multiple spray doses', () => {
      builder
        .buildDose({ value: 1, unit: 'spray' })
        .buildDose({ value: 2, unit: 'sprays' });

      const json = builder.toJSON() as BuilderJsonState;
      expect(json.state.doses).toHaveLength(2);
      expect(json.state.doses[0].value).toBe(1);
      expect(json.state.doses[1].value).toBe(2);
    });

    it('should handle medications with dispenserMetadata', () => {
      const medicationWithMetadata = { 
        ...mockNasalSprayMedication, 
        dispenserMetadata: { type: 'NasalSpray' } 
      };
      
      expect(() => {
        new NasalSprayBuilder(medicationWithMetadata);
      }).not.toThrow();
    });
  });

  describe('Serialization', () => {
    it('should serialize builder state with nasal spray features', () => {
      const builder = new NasalSprayBuilder(mockNasalSprayMedication);
      
      builder
        .buildDose({ value: 2, unit: 'sprays' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('intranasally');

      const json = builder.toJSON() as BuilderJsonState;
      
      expect(json.medication).toBeDefined();
      expect(json.state).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.builderType).toBe('NasalSprayBuilder');
      expect(json.nasalSprayFeatures?.nostrilPattern).toBe(true);
      expect(json.nasalSprayFeatures?.primingRequired).toBe(true);
      expect(json.nasalSprayFeatures?.displayFormat).toBe('X sprays (Y mcg)');
      expect(json.nasalSprayFeatures?.maxSprayValidation).toBe(true);
      expect(json.originalDose).toEqual({ value: 2, unit: 'sprays' });
    });
  });
});