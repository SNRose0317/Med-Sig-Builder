import {
  GuardrailsSchema,
  MedicationConstraints,
  Contraindication,
  DoseLimit,
  GuardrailViolation,
  GuardrailValidationResult,
  isGuardrailsSchema,
  isContraindication,
  isDoseLimit,
  PopulationDoseLimit,
  DrugInteraction,
  InjectionConstraints,
  ReconstitutionRules,
  SpecialHandling,
  FractionalDosing,
  ClinicalOverride
} from '../types';

describe('Guardrails Types', () => {
  describe('Type Guards', () => {
    describe('isGuardrailsSchema', () => {
      it('should validate correct schema structure', () => {
        const validSchema: GuardrailsSchema = {
          version: '1.0.0',
          effective_date: '2024-01-01',
          approved_by: [
            { name: 'Dr. Test', role: 'Clinical Reviewer', date: '2024-01-01' }
          ],
          medications: {
            metformin: {
              maxDailyDose: { value: 2000, unit: 'mg' }
            }
          },
          injection_constraints: {},
          reconstitution_rules: {
            defaultBeyondUseDate: '1 hour'
          },
          special_handling: {},
          fractional_dosing: {},
          drug_interactions: [],
          override_template: {
            requiredFields: ['reason'],
            example: 'Example override'
          }
        };

        expect(isGuardrailsSchema(validSchema)).toBe(true);
      });

      it('should reject invalid structures', () => {
        expect(isGuardrailsSchema(null)).toBe(false);
        expect(isGuardrailsSchema(undefined)).toBe(false);
        expect(isGuardrailsSchema({})).toBe(false);
        expect(isGuardrailsSchema({ version: '1.0' })).toBe(false);
        expect(isGuardrailsSchema({
          version: '1.0',
          effective_date: '2024-01-01',
          approved_by: 'not-an-array'
        })).toBe(false);
      });
    });

    describe('isContraindication', () => {
      it('should validate correct contraindication', () => {
        const valid: Contraindication = {
          condition: 'egfr < 30',
          severity: 'absolute',
          message: 'Contraindicated in renal failure'
        };

        expect(isContraindication(valid)).toBe(true);
      });

      it('should accept relative severity', () => {
        const valid: Contraindication = {
          condition: 'age > 80',
          severity: 'relative',
          message: 'Use with caution'
        };

        expect(isContraindication(valid)).toBe(true);
      });

      it('should reject invalid contraindications', () => {
        expect(isContraindication(null)).toBe(false);
        expect(isContraindication({})).toBe(false);
        expect(isContraindication({
          condition: 'test',
          severity: 'invalid',
          message: 'test'
        })).toBe(false);
      });
    });

    describe('isDoseLimit', () => {
      it('should validate basic dose limit', () => {
        const valid: DoseLimit = {
          value: 1000,
          unit: 'mg'
        };

        expect(isDoseLimit(valid)).toBe(true);
      });

      it('should validate dose limit with populations', () => {
        const valid: DoseLimit = {
          value: 2000,
          unit: 'mg',
          populations: [
            {
              condition: 'age < 18',
              value: 1000,
              unit: 'mg',
              reason: 'Pediatric dosing'
            }
          ]
        };

        expect(isDoseLimit(valid)).toBe(true);
      });

      it('should reject invalid dose limits', () => {
        expect(isDoseLimit(null)).toBe(false);
        expect(isDoseLimit({})).toBe(false);
        expect(isDoseLimit({ value: 'not-a-number' })).toBe(false);
        expect(isDoseLimit({ value: 100 })).toBe(false); // missing unit
      });
    });
  });

  describe('Data Structures', () => {
    describe('MedicationConstraints', () => {
      it('should support all constraint types', () => {
        const constraints: MedicationConstraints = {
          brandNames: ['Glucophage', 'Fortamet'],
          doseForms: ['Tablet', 'Extended Release Tablet'],
          maxDailyDose: {
            value: 2000,
            unit: 'mg',
            populations: [
              {
                condition: 'egfr < 45',
                value: 1000,
                unit: 'mg',
                reason: 'Renal impairment'
              }
            ]
          },
          maxSingleDose: { value: 1000, unit: 'mg' },
          minSingleDose: { value: 500, unit: 'mg' },
          doseStep: { value: 500, unit: 'mg' },
          injectionSites: ['subcutaneous'],
          contraindications: [
            {
              condition: 'egfr < 30',
              severity: 'absolute',
              message: 'Severe renal impairment'
            }
          ],
          blackBoxWarnings: ['Risk of lactic acidosis']
        };

        // Type checking - should compile without errors
        expect(constraints.brandNames).toHaveLength(2);
        expect(constraints.contraindications![0].severity).toBe('absolute');
      });
    });

    describe('InjectionConstraints', () => {
      it('should support site-specific limits', () => {
        const constraints: InjectionConstraints = {
          maxVolumePerSite: {
            default: { value: 5.0, unit: 'mL' },
            sites: {
              deltoid: { value: 2.0, unit: 'mL' },
              gluteal: { value: 5.0, unit: 'mL' }
            }
          },
          preferredSites: ['abdomen', 'thigh'],
          notes: 'Rotate injection sites',
          needleLengths: {
            deltoid: '1-1.5 inch',
            gluteal: '1.5-2 inch'
          }
        };

        expect(constraints.maxVolumePerSite?.sites?.deltoid.value).toBe(2.0);
      });
    });

    describe('GuardrailValidationResult', () => {
      it('should represent successful validation', () => {
        const result: GuardrailValidationResult = {
          valid: true
        };

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
        expect(result.warnings).toBeUndefined();
      });

      it('should represent validation with errors', () => {
        const result: GuardrailValidationResult = {
          valid: false,
          errors: [
            {
              type: 'dose_limit',
              severity: 'error',
              message: 'Dose exceeds maximum',
              constraint: 'max_daily_dose',
              actualValue: { value: 3000, unit: 'mg' },
              expectedValue: { value: 2000, unit: 'mg' }
            }
          ]
        };

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].type).toBe('dose_limit');
      });

      it('should support warnings without errors', () => {
        const result: GuardrailValidationResult = {
          valid: true,
          warnings: [
            {
              type: 'subtherapeutic_dose',
              message: 'Dose below usual therapeutic range',
              recommendation: 'Verify intentional low dose'
            }
          ]
        };

        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(1);
      });
    });

    describe('ClinicalOverride', () => {
      it('should capture override details', () => {
        const override: ClinicalOverride = {
          reason: 'Severe condition requiring higher dose',
          prescriber: 'Dr. Smith',
          date: '2024-01-15',
          patientSpecificFactors: [
            'Previous treatment failure',
            'High body weight'
          ],
          constraintOverridden: 'max_daily_dose'
        };

        expect(override.patientSpecificFactors).toHaveLength(2);
      });
    });

    describe('DrugInteraction', () => {
      it('should define interaction properties', () => {
        const interaction: DrugInteraction = {
          drugs: ['warfarin', 'aspirin'],
          severity: 'major',
          effect: 'Increased bleeding risk',
          recommendation: 'Monitor INR closely'
        };

        expect(interaction.severity).toBe('major');
        expect(interaction.drugs).toHaveLength(2);
      });
    });

    describe('SpecialHandling', () => {
      it('should support all special handling types', () => {
        const handling: SpecialHandling = {
          hazardousDrugs: [
            {
              medication: 'methotrexate',
              precautions: ['Use gloves', 'Prepare in BSC']
            }
          ],
          lightSensitive: ['nitroprusside'],
          refrigerationRequired: [
            {
              medication: 'insulin',
              storage: '2-8°C',
              inUseStability: '28 days at room temperature'
            }
          ],
          doNotShake: ['insulin glargine']
        };

        expect(handling.hazardousDrugs![0].precautions).toHaveLength(2);
        expect(handling.refrigerationRequired![0].storage).toBe('2-8°C');
      });
    });

    describe('FractionalDosing', () => {
      it('should define splitting rules', () => {
        const fractional: FractionalDosing = {
          tabletSplitting: {
            allowedFractions: [0.5, 0.25],
            notAllowed: ['extended_release', 'enteric_coated']
          },
          pediatricRules: {
            minTabletFraction: {
              ageRanges: [
                {
                  minAge: 0,
                  maxAge: 6,
                  minFraction: 0.25,
                  reason: 'Young children difficulty with smaller pieces'
                }
              ]
            }
          }
        };

        expect(fractional.tabletSplitting?.allowedFractions).toContain(0.5);
        expect(fractional.pediatricRules?.minTabletFraction?.ageRanges).toHaveLength(1);
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle population-specific dose adjustments', () => {
      const population: PopulationDoseLimit = {
        condition: 'age < 18 && weight < 50',
        value: 500,
        unit: 'mg',
        reason: 'Pediatric weight-based dosing'
      };

      expect(population.condition).toContain('&&');
    });

    it('should support multiple severity violations', () => {
      const violations: GuardrailViolation[] = [
        {
          type: 'contraindication',
          severity: 'error',
          message: 'Absolute contraindication',
          constraint: 'renal_failure'
        },
        {
          type: 'interaction',
          severity: 'warning',
          message: 'Drug interaction warning',
          constraint: 'warfarin_interaction'
        }
      ];

      const errors = violations.filter(v => v.severity === 'error');
      const warnings = violations.filter(v => v.severity === 'warning');

      expect(errors).toHaveLength(1);
      expect(warnings).toHaveLength(1);
    });
  });
});