import { 
  SignatureInstruction, 
  DoseAndRate,
  Timing,
  RelationshipType,
  isSignatureInstruction,
  createSignatureInstruction
} from '../SignatureInstruction';

describe('SignatureInstruction', () => {
  describe('Interface definition', () => {
    it('should accept valid FHIR R4 compliant signature instruction', () => {
      const validInstruction: SignatureInstruction = {
        text: 'Take 1 tablet by mouth twice daily with food.',
        timing: {
          repeat: {
            frequency: 2,
            period: 1,
            periodUnit: 'd'
          }
        },
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route'
          }]
        },
        doseAndRate: [{
          doseQuantity: {
            value: 1,
            unit: 'tablet',
            system: 'http://unitsofmeasure.org',
            code: 'TAB'
          }
        }]
      };

      expect(validInstruction).toBeDefined();
      expect(validInstruction.text).toBe('Take 1 tablet by mouth twice daily with food.');
    });

    it('should support complex timing patterns', () => {
      const complexTiming: SignatureInstruction = {
        text: 'Take 2 tablets by mouth every morning and 1 tablet every evening.',
        timing: {
          repeat: {
            when: ['MORN', 'EVE'],
            frequency: 2,
            period: 1,
            periodUnit: 'd'
          }
        },
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route'
          }]
        },
        doseAndRate: [
          {
            doseQuantity: {
              value: 2,
              unit: 'tablet'
            },
            when: ['MORN']
          },
          {
            doseQuantity: {
              value: 1,
              unit: 'tablet'
            },
            when: ['EVE']
          }
        ]
      };

      expect(complexTiming.doseAndRate).toHaveLength(2);
      expect(complexTiming.timing?.repeat?.when).toContain('MORN');
    });

    it('should support PRN (as needed) medications', () => {
      const prnInstruction: SignatureInstruction = {
        text: 'Take 1-2 tablets by mouth every 4-6 hours as needed for pain.',
        timing: {
          repeat: {
            frequency: 1,
            frequencyMax: 6,
            period: 1,
            periodUnit: 'd',
            periodMax: 1
          }
        },
        asNeeded: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '182896000',
            display: 'Pain'
          }]
        },
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route'
          }]
        },
        doseAndRate: [{
          doseRange: {
            low: { value: 1, unit: 'tablet' },
            high: { value: 2, unit: 'tablet' }
          }
        }],
        maxDosePerPeriod: {
          numerator: { value: 12, unit: 'tablet' },
          denominator: { value: 24, unit: 'hour' }
        }
      };

      expect(prnInstruction.asNeeded).toBeDefined();
      expect(prnInstruction.maxDosePerPeriod).toBeDefined();
    });

    it('should support relationship metadata for complex regimens', () => {
      const taperInstruction: SignatureInstruction = {
        text: 'Take 2 tablets daily for 1 week, then 1 tablet daily.',
        sequence: 1,
        relationship: {
          type: RelationshipType.SEQUENTIAL,
          targetId: 'instruction-2'
        },
        timing: {
          bounds: {
            start: '2024-01-01',
            end: '2024-01-07'
          },
          repeat: {
            frequency: 1,
            period: 1,
            periodUnit: 'd'
          }
        },
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route'
          }]
        },
        doseAndRate: [{
          doseQuantity: {
            value: 2,
            unit: 'tablet'
          }
        }]
      };

      expect(taperInstruction.relationship?.type).toBe(RelationshipType.SEQUENTIAL);
      expect(taperInstruction.sequence).toBe(1);
    });
  });

  describe('Type guards', () => {
    it('should correctly identify valid signature instructions', () => {
      const valid = {
        text: 'Take 1 tablet daily',
        doseAndRate: [{
          doseQuantity: {
            value: 1,
            unit: 'tablet'
          }
        }]
      };

      expect(isSignatureInstruction(valid)).toBe(true);
    });

    it('should reject invalid instructions', () => {
      const invalid = {
        text: 'Take medication',
        // Missing doseAndRate
      };

      expect(isSignatureInstruction(invalid)).toBe(false);
    });

    it('should reject objects with invalid dose structures', () => {
      const invalid = {
        text: 'Take 1 tablet',
        doseAndRate: [{
          // Invalid: missing value
          doseQuantity: {
            unit: 'tablet'
          }
        }]
      };

      expect(isSignatureInstruction(invalid)).toBe(false);
    });
  });

  describe('Factory function', () => {
    it('should create basic signature instruction', () => {
      const instruction = createSignatureInstruction({
        text: 'Apply 2 clicks topically twice daily',
        doseValue: 2,
        doseUnit: 'click',
        frequency: 2,
        period: 1,
        periodUnit: 'd',
        route: 'topically'
      });

      expect(instruction.text).toBe('Apply 2 clicks topically twice daily');
      expect(instruction.doseAndRate?.[0].doseQuantity?.value).toBe(2);
      expect(instruction.timing?.repeat?.frequency).toBe(2);
    });

    it('should create instruction with special instructions', () => {
      const instruction = createSignatureInstruction({
        text: 'Inject 200 mg intramuscularly once weekly in thigh',
        doseValue: 200,
        doseUnit: 'mg',
        frequency: 1,
        period: 1,
        periodUnit: 'wk',
        route: 'intramuscularly',
        additionalInstructions: 'in thigh',
        site: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '68367000',
            display: 'Thigh'
          }]
        }
      });

      expect(instruction.additionalInstructions?.[0].text).toBe('in thigh');
      expect(instruction.site?.coding[0].display).toBe('Thigh');
    });
  });

  describe('FHIR compliance', () => {
    it('should serialize to valid FHIR JSON', () => {
      const instruction: SignatureInstruction = {
        text: 'Take 500 mg by mouth twice daily',
        timing: {
          repeat: {
            frequency: 2,
            period: 1,
            periodUnit: 'd'
          }
        },
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route'
          }]
        },
        doseAndRate: [{
          doseQuantity: {
            value: 500,
            unit: 'mg',
            system: 'http://unitsofmeasure.org',
            code: 'mg'
          }
        }]
      };

      const json = JSON.stringify(instruction);
      const parsed = JSON.parse(json);

      expect(parsed.timing.repeat.frequency).toBe(2);
      expect(parsed.doseAndRate[0].doseQuantity.value).toBe(500);
    });
  });
});