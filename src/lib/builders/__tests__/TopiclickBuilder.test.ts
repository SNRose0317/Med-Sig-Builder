import { TopiclickBuilder } from '../TopiclickBuilder';
import { MedicationProfile } from '../../../types/MedicationProfile';
import { DoseInput } from '../ISignatureBuilder';

// Type for builder JSON state for testing
interface BuilderJsonState extends Record<string, unknown> {
  builderType?: string;
  version?: string;
  timestamp?: unknown;
  topiclickFeatures?: {
    clicksPerMl?: number;
    airPrimeLoss?: number;
    displayFormat?: string;
    deviceInstructions?: boolean;
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

describe('TopiclickBuilder', () => {
  let mockTopiclickMedication: MedicationProfile;
  let mockTopiclickWithConcentration: MedicationProfile;

  beforeEach(() => {
    mockTopiclickMedication = {
      id: 'med-topiclick',
      name: 'Estradiol Gel with Topiclick',
      type: 'medication',
      isActive: true,
      doseForm: 'Gel',
      dispenserInfo: {
        type: 'Topiclick',
        unit: 'click',
        pluralUnit: 'clicks',
        conversionRatio: 0.25 // 4 clicks = 1 mL
      },
      code: { 
        coding: [{ display: 'Estradiol 0.75mg/g gel' }] 
      },
      ingredient: [{
        name: 'Estradiol',
        strengthRatio: {
          numerator: { value: 0.75, unit: 'mg' },
          denominator: { value: 1, unit: 'g' }
        }
      }]
    };

    mockTopiclickWithConcentration = {
      ...mockTopiclickMedication,
      name: 'Testosterone Gel with Topiclick',
      concentrationRatio: {
        numerator: { value: 50, unit: 'mg' },
        denominator: { value: 1, unit: 'mL' }
      },
      ingredient: [{
        name: 'Testosterone',
        strengthRatio: {
          numerator: { value: 50, unit: 'mg' },
          denominator: { value: 1, unit: 'mL' }
        }
      }]
    };
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with valid Topiclick medication', () => {
      const builder = new TopiclickBuilder(mockTopiclickMedication);
      
      expect(builder).toBeDefined();
      const json = builder.toJSON() as BuilderJsonState;
      expect(json.builderType).toBe('TopiclickBuilder');
      expect(json.topiclickFeatures?.clicksPerMl).toBe(4);
      expect(json.topiclickFeatures?.airPrimeLoss).toBe(4);
      expect(json.topiclickFeatures?.displayFormat).toBe('X clicks (Y mg)');
      expect(json.topiclickFeatures?.deviceInstructions).toBe(true);
    });

    it('should accept medications with Topiclick dispenser info', () => {
      expect(() => {
        new TopiclickBuilder(mockTopiclickMedication);
      }).not.toThrow();
    });

    it('should warn about unusual dose forms without Topiclick dispenser', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const tabletMedication = { ...mockTopiclickMedication, doseForm: 'Tablet', dispenserInfo: undefined };
      new TopiclickBuilder(tabletMedication);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Potentially invalid dose form for LiquidBuilder: Tablet. Expected: solution, suspension, syrup, elixir, tincture, injection, vial'
      );
      
      consoleSpy.mockRestore();
    });

    it('should include Topiclick builder in audit trail', () => {
      const builder = new TopiclickBuilder(mockTopiclickMedication);
      const audit = builder.explain();
      
      expect(audit).toContain('TopiclickBuilder initialized for Topiclick dispenser support');
    });
  });

  describe('Click Unit Conversion', () => {
    let builder: TopiclickBuilder;

    beforeEach(() => {
      builder = new TopiclickBuilder(mockTopiclickWithConcentration);
    });

    it('should convert clicks to mL (4 clicks = 1 mL)', () => {
      builder.buildDose({ value: 8, unit: 'clicks' });
      const audit = builder.explain();
      
      expect(audit).toContain('Converted 8 clicks to 2 mL (4 clicks per mL)');
    });

    it('should convert clicks to mg using concentration', () => {
      builder.buildDose({ value: 4, unit: 'clicks' });
      const audit = builder.explain();
      
      expect(audit).toContain('Calculated dose: 4 clicks = 50.0 mg');
    });

    it('should handle fractional click conversions', () => {
      builder.buildDose({ value: 2, unit: 'clicks' });
      const audit = builder.explain();
      
      expect(audit).toContain('Converted 2 clicks to 0.5 mL (4 clicks per mL)');
    });

    it('should handle single click dose', () => {
      builder.buildDose({ value: 1, unit: 'click' });
      const audit = builder.explain();
      
      expect(audit).toContain('Converted 1 clicks to 0.25 mL (4 clicks per mL)');
    });

    it('should handle range doses with clicks', () => {
      const doseRange: DoseInput = {
        value: 2,
        unit: 'clicks',
        maxValue: 6
      };
      
      builder.buildDose(doseRange);
      const audit = builder.explain();
      
      expect(audit).toContain('Converted 2 clicks to 0.5 mL');
    });

    it('should handle non-click units normally', () => {
      builder.buildDose({ value: 1, unit: 'mL' });
      const audit = builder.explain();
      
      expect(audit).not.toContain('Converted');
      expect(audit).toContain('Added dose: 1 mL');
    });
  });

  describe('Display Formatting', () => {
    let builder: TopiclickBuilder;

    beforeEach(() => {
      builder = new TopiclickBuilder(mockTopiclickWithConcentration);
    });

    it('should format click display as "X clicks (Y mg)"', () => {
      const instructions = builder
        .buildDose({ value: 4, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      expect(instructions[0].text).toContain('4 clicks (50.0 mg)');
    });

    it('should format single click as "1 click"', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'click' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      expect(instructions[0].text).toContain('1 click (12.5 mg)');
    });

    it('should format multiple clicks as "X clicks"', () => {
      const instructions = builder
        .buildDose({ value: 8, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      expect(instructions[0].text).toContain('8 clicks (100.0 mg)');
    });

    it('should fallback to mL display when no concentration available', () => {
      const medicationNoConcentration = { ...mockTopiclickMedication, concentrationRatio: undefined, ingredient: [] };
      const builderNoConc = new TopiclickBuilder(medicationNoConcentration);
      
      const instructions = builderNoConc
        .buildDose({ value: 4, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      expect(instructions[0].text).toContain('4 clicks (1 mL)');
    });

    it('should not modify non-click dose displays', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'mL' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      expect(instructions[0].text).toContain('1 mL');
      expect(instructions[0].text).not.toContain('clicks');
    });
  });

  describe('Device Instructions', () => {
    let builder: TopiclickBuilder;

    beforeEach(() => {
      builder = new TopiclickBuilder(mockTopiclickMedication);
    });

    it('should add Topiclick priming instruction', () => {
      const instructions = builder
        .buildDose({ value: 4, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      expect(additionalInstructions).toBeDefined();
      
      const primingInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Prime device with 4 clicks before first use')
      );
      expect(primingInstruction).toBeDefined();
    });

    it('should add volume per click instruction', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const volumeInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Each click dispenses 0.25 mL')
      );
      expect(volumeInstruction).toBeDefined();
    });

    it('should add usage instruction', () => {
      const instructions = builder
        .buildDose({ value: 3, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const usageInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('Rotate base until you hear the required number of clicks')
      );
      expect(usageInstruction).toBeDefined();
    });

    it('should combine Topiclick instructions with other additional instructions', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .buildSpecialInstructions(['apply to clean, dry skin'])
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      expect(additionalInstructions).toHaveLength(4); // 3 Topiclick + 1 special
      
      const specialInstruction = additionalInstructions?.find(inst => 
        inst.text === 'apply to clean, dry skin'
      );
      expect(specialInstruction).toBeDefined();
    });

    it('should not add Topiclick instructions for non-click doses', () => {
      const instructions = builder
        .buildDose({ value: 1, unit: 'mL' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const topiclickInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('click')
      );
      expect(topiclickInstruction).toBeUndefined();
    });
  });

  describe('Validation and Error Handling', () => {
    let builder: TopiclickBuilder;

    beforeEach(() => {
      builder = new TopiclickBuilder(mockTopiclickMedication);
    });

    it('should validate dose input', () => {
      expect(() => {
        builder.buildDose({ value: 0, unit: 'clicks' });
      }).toThrow('Invalid dose input');
    });

    it('should validate negative clicks', () => {
      expect(() => {
        builder.buildDose({ value: -2, unit: 'clicks' });
      }).toThrow('Invalid dose input');
    });

    it('should require complete builder state', () => {
      expect(() => {
        builder.getResult();
      }).toThrow('No doses configured');
    });

    it('should inherit liquid builder validation', () => {
      builder.buildDose({ value: 2, unit: 'clicks' });
      
      expect(() => {
        builder.getResult();
      }).toThrow('No timing configured');
    });
  });

  describe('Enhanced Audit Trail', () => {
    let builder: TopiclickBuilder;

    beforeEach(() => {
      builder = new TopiclickBuilder(mockTopiclickWithConcentration);
    });

    it('should include click conversion in audit trail', () => {
      builder.buildDose({ value: 4, unit: 'clicks' });
      const audit = builder.explain();
      
      expect(audit).toContain('Converted 4 clicks to 1 mL (4 clicks per mL)');
    });

    it('should include mg calculation in audit trail', () => {
      builder.buildDose({ value: 4, unit: 'clicks' });
      const audit = builder.explain();
      
      expect(audit).toContain('Calculated dose: 4 clicks = 50.0 mg');
    });

    it('should show Topiclick summary in explanation', () => {
      builder
        .buildDose({ value: 4, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      const explanation = builder.explain();
      expect(explanation).toContain('--- Topiclick Dispenser Features ---');
      expect(explanation).toContain('Original dose: 4 clicks (50.0 mg)');
      expect(explanation).toContain('Conversion: 4 clicks = 1 mL');
      expect(explanation).toContain('Clicks per mL: 4');
      expect(explanation).toContain('Air-prime loss: 4 clicks');
      expect(explanation).toContain('Device instructions: 3 added');
    });

    it('should format click doses in audit trail', () => {
      const doseRange: DoseInput = {
        value: 2,
        unit: 'clicks',
        maxValue: 6
      };
      
      builder.buildDose(doseRange);
      const audit = builder.explain();
      
      expect(audit).toContain('Added dose: 2 clicks (25.0 mg) - 6 clicks (75.0 mg)');
    });
  });

  describe('FHIR Compliance', () => {
    let builder: TopiclickBuilder;

    beforeEach(() => {
      builder = new TopiclickBuilder(mockTopiclickWithConcentration);
    });

    it('should maintain FHIR-compliant structure', () => {
      const instructions = builder
        .buildDose({ value: 4, unit: 'clicks' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      expect(instructions).toHaveLength(1);
      expect(instructions[0].text).toBeDefined();
      expect(instructions[0].doseAndRate).toBeDefined();
      expect(instructions[0].timing).toBeDefined();
      expect(instructions[0].route).toBeDefined();
    });

    it('should generate proper dose and rate structure', () => {
      const instructions = builder
        .buildDose({ value: 4, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      const doseAndRate = instructions[0].doseAndRate?.[0];
      expect(doseAndRate?.type?.coding?.[0]?.system).toBe('http://terminology.hl7.org/CodeSystem/dose-rate-type');
      expect(doseAndRate?.type?.coding?.[0]?.code).toBe('ordered');
      expect(doseAndRate?.doseQuantity?.value).toBe(1); // Converted to mL
      expect(doseAndRate?.doseQuantity?.unit).toBe('mL');
    });

    it('should generate proper timing structure', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'clicks' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('topically')
        .getResult();

      const timing = instructions[0].timing;
      expect(timing?.repeat?.frequency).toBe(2);
      expect(timing?.repeat?.period).toBe(1);
      expect(timing?.repeat?.periodUnit).toBe('d');
    });
  });

  describe('Edge Cases and Integration', () => {
    let builder: TopiclickBuilder;

    beforeEach(() => {
      builder = new TopiclickBuilder(mockTopiclickMedication);
    });

    it('should handle very small click doses', () => {
      builder.buildDose({ value: 0.25, unit: 'clicks' });
      const audit = builder.explain();
      
      expect(audit).toContain('Converted 0.25 clicks to 0.0625 mL');
    });

    it('should handle large click doses', () => {
      builder.buildDose({ value: 40, unit: 'clicks' });
      const audit = builder.explain();
      
      expect(audit).toContain('Converted 40 clicks to 10 mL');
    });

    it('should handle PRN instructions with clicks', () => {
      const instructions = builder
        .buildDose({ value: 2, unit: 'clicks' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('topically')
        .buildAsNeeded({ asNeeded: true, indication: 'for symptoms' })
        .getResult();

      const additionalInstructions = instructions[0].additionalInstructions;
      const prnInstruction = additionalInstructions?.find(inst => 
        inst.text?.includes('as needed for symptoms')
      );
      expect(prnInstruction).toBeDefined();
    });

    it('should handle multiple click doses', () => {
      builder
        .buildDose({ value: 2, unit: 'clicks' })
        .buildDose({ value: 4, unit: 'clicks' })
        .buildDose({ value: 6, unit: 'clicks' });

      const json = builder.toJSON() as BuilderJsonState;
      expect(json.state.doses).toHaveLength(3);
      expect(json.state.doses[0].value).toBe(0.5); // 2 clicks = 0.5 mL
      expect(json.state.doses[1].value).toBe(1);   // 4 clicks = 1 mL
      expect(json.state.doses[2].value).toBe(1.5); // 6 clicks = 1.5 mL
    });
  });

  describe('Serialization', () => {
    it('should serialize builder state with Topiclick features', () => {
      const builder = new TopiclickBuilder(mockTopiclickMedication);
      
      builder
        .buildDose({ value: 4, unit: 'clicks' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('topically');

      const json = builder.toJSON() as BuilderJsonState;
      
      expect(json.medication).toBeDefined();
      expect(json.state).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.builderType).toBe('TopiclickBuilder');
      expect(json.topiclickFeatures?.clicksPerMl).toBe(4);
      expect(json.topiclickFeatures?.airPrimeLoss).toBe(4);
      expect(json.topiclickFeatures?.displayFormat).toBe('X clicks (Y mg)');
      expect(json.topiclickFeatures?.deviceInstructions).toBe(true);
      expect(json.originalDose).toEqual({ value: 4, unit: 'clicks' });
    });
  });
});