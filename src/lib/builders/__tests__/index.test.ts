import { createBuilder, ISignatureBuilder } from '../index';
import { SimpleTabletBuilder } from '../SimpleTabletBuilder';
import { SimpleLiquidBuilder } from '../SimpleLiquidBuilder';
import { MedicationProfile } from '../../../types/MedicationProfile';

describe('Builder Factory', () => {
  let mockTabletMedication: MedicationProfile;
  let mockLiquidMedication: MedicationProfile;

  beforeEach(() => {
    mockTabletMedication = {
      id: 'med-tablet',
      name: 'Test Tablet',
      type: 'medication',
      isActive: true,
      doseForm: 'Tablet',
      code: { coding: [{ display: 'Test Tablet' }] },
      ingredient: [{
        name: 'Test Ingredient',
        strengthRatio: {
          numerator: { value: 100, unit: 'mg' },
          denominator: { value: 1, unit: 'tablet' }
        }
      }]
    };

    mockLiquidMedication = {
      id: 'med-liquid',
      name: 'Test Liquid',
      type: 'medication',
      isActive: true,
      doseForm: 'Solution',
      code: { coding: [{ display: 'Test Solution' }] },
      ingredient: [{
        name: 'Test Ingredient',
        strengthRatio: {
          numerator: { value: 250, unit: 'mg' },
          denominator: { value: 5, unit: 'mL' }
        }
      }]
    };
  });

  describe('createBuilder', () => {
    it('should create SimpleTabletBuilder for tablet dose forms', () => {
      const solidForms = ['tablet', 'capsule', 'troche', 'odt'];
      
      solidForms.forEach(form => {
        const medication = { ...mockTabletMedication, doseForm: form };
        const builder = createBuilder(medication);
        
        expect(builder).toBeInstanceOf(SimpleTabletBuilder);
      });
    });

    it('should create SimpleLiquidBuilder for liquid dose forms', () => {
      const liquidForms = ['solution', 'suspension', 'syrup', 'elixir', 'injection'];
      
      liquidForms.forEach(form => {
        const medication = { ...mockLiquidMedication, doseForm: form };
        const builder = createBuilder(medication);
        
        expect(builder).toBeInstanceOf(SimpleLiquidBuilder);
      });
    });

    it('should default to SimpleTabletBuilder for unknown dose forms', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const unknownMedication = { 
        ...mockTabletMedication, 
        doseForm: 'Unknown Form' 
      };
      
      const builder = createBuilder(unknownMedication);
      
      expect(builder).toBeInstanceOf(SimpleTabletBuilder);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown dose form: Unknown Form. Defaulting to TabletBuilder.'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle case-insensitive dose form matching', () => {
      const upperCaseMedication = { 
        ...mockTabletMedication, 
        doseForm: 'TABLET' 
      };
      
      const builder = createBuilder(upperCaseMedication);
      expect(builder).toBeInstanceOf(SimpleTabletBuilder);
    });
  });

  describe('Builder Integration', () => {
    it('should create functional tablet builder through factory', () => {
      const builder = createBuilder(mockTabletMedication);
      
      const instructions = builder
        .buildDose({ value: 1, unit: 'tablet' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      expect(instructions).toHaveLength(1);
      expect(instructions[0].text).toBeDefined();
      expect(instructions[0].doseAndRate).toHaveLength(1);
    });

    it('should create functional liquid builder through factory', () => {
      const builder = createBuilder(mockLiquidMedication);
      
      const instructions = builder
        .buildDose({ value: 5, unit: 'mL' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      expect(instructions).toHaveLength(1);
      expect(instructions[0].text).toBeDefined();
      expect(instructions[0].doseAndRate).toHaveLength(1);
    });
  });
});