import { 
  ISignatureBuilder, 
  DoseInput, 
  TimingInput, 
  RouteInput,
  DoseConstraints,
  AsNeededInput,
  BuilderState,
  isValidDoseInput,
  isValidTimingInput
} from '../ISignatureBuilder';
import { SignatureInstruction } from '../../../types/SignatureInstruction';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';

// Mock implementation for testing the interface contract
class MockSignatureBuilder implements ISignatureBuilder {
  private state: BuilderState = {
    doses: [],
    timing: null,
    route: null,
    constraints: null,
    asNeeded: null,
    specialInstructions: [],
    auditTrail: []
  };

  constructor(private context: MedicationRequestContext) {
    this.addAuditEntry('Builder initialized');
  }

  buildDose(dose: DoseInput): ISignatureBuilder {
    if (!isValidDoseInput(dose)) {
      throw new Error('Invalid dose input');
    }
    this.state.doses.push(dose);
    this.addAuditEntry(`Added dose: ${dose.value} ${dose.unit}`);
    return this;
  }

  buildTiming(timing: TimingInput): ISignatureBuilder {
    if (!isValidTimingInput(timing)) {
      throw new Error('Invalid timing input');
    }
    this.state.timing = timing;
    this.addAuditEntry(`Set timing: ${timing.frequency} per ${timing.period} ${timing.periodUnit}`);
    return this;
  }

  buildRoute(route: RouteInput): ISignatureBuilder {
    if (!route || typeof route !== 'string') {
      throw new Error('Invalid route input');
    }
    this.state.route = route;
    this.addAuditEntry(`Set route: ${route}`);
    return this;
  }

  buildConstraints(constraints: DoseConstraints): ISignatureBuilder {
    this.state.constraints = constraints;
    this.addAuditEntry('Added dose constraints');
    return this;
  }

  buildAsNeeded(asNeeded: AsNeededInput): ISignatureBuilder {
    this.state.asNeeded = asNeeded;
    this.addAuditEntry(`Set as needed: ${asNeeded.indication || 'true'}`);
    return this;
  }

  buildSpecialInstructions(instructions: string[]): ISignatureBuilder {
    this.state.specialInstructions.push(...instructions);
    this.addAuditEntry(`Added ${instructions.length} special instructions`);
    return this;
  }

  getResult(): SignatureInstruction[] {
    // Simple implementation for testing
    if (!this.state.doses.length || !this.state.timing || !this.state.route) {
      throw new Error('Incomplete builder state');
    }

    return [{
      text: this.generateText(),
      doseAndRate: this.state.doses.map(dose => ({
        doseQuantity: {
          value: dose.value,
          unit: dose.unit
        }
      })),
      timing: {
        repeat: {
          frequency: this.state.timing.frequency,
          period: this.state.timing.period,
          periodUnit: this.state.timing.periodUnit
        }
      },
      route: {
        coding: [{
          display: this.state.route
        }]
      }
    }];
  }

  explain(): string {
    return this.state.auditTrail.join('\n');
  }

  toJSON(): object {
    return {
      context: this.context,
      state: this.state,
      timestamp: new Date().toISOString()
    };
  }

  private addAuditEntry(entry: string): void {
    this.state.auditTrail.push(`[${new Date().toISOString()}] ${entry}`);
  }

  private generateText(): string {
    const dose = this.state.doses[0];
    const timing = this.state.timing!;
    return `Take ${dose.value} ${dose.unit} ${this.state.route} ${timing.frequency} times per ${timing.period} ${timing.periodUnit}`;
  }
}

describe('ISignatureBuilder', () => {
  let mockContext: MedicationRequestContext;

  beforeEach(() => {
    mockContext = {
      id: 'test-123',
      timestamp: new Date().toISOString(),
      medication: {
        id: 'med-123',
        name: 'Test Medication',
        type: 'medication',
        isActive: true,
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Test Med' }] },
        ingredient: [{
          name: 'Test Ingredient',
          strengthRatio: {
            numerator: { value: 100, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }]
      },
      patient: {
        id: 'patient-123',
        age: 45,
        weight: { value: 70, unit: 'kg' }
      },
      dose: { value: 100, unit: 'mg' },
      frequency: 'twice daily',
      route: 'by mouth'
    };
  });

  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      const result = builder
        .buildDose({ value: 100, unit: 'mg' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food']);

      expect(result).toBe(builder);
    });

    it('should build valid SignatureInstruction array', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      const instructions = builder
        .buildDose({ value: 500, unit: 'mg' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .getResult();

      expect(instructions).toHaveLength(1);
      expect(instructions[0].text).toContain('500 mg');
      expect(instructions[0].doseAndRate?.[0].doseQuantity?.value).toBe(500);
    });
  });

  describe('Multiple doses (tapering)', () => {
    it('should support multiple dose entries', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      builder
        .buildDose({ value: 100, unit: 'mg' })
        .buildDose({ value: 50, unit: 'mg' })
        .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth');

      const json = builder.toJSON() as any;
      expect(json.state.doses).toHaveLength(2);
      expect(json.state.doses[0].value).toBe(100);
      expect(json.state.doses[1].value).toBe(50);
    });
  });

  describe('Validation', () => {
    it('should validate dose input', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      expect(() => {
        builder.buildDose({ value: -1, unit: 'mg' });
      }).toThrow('Invalid dose input');
    });

    it('should validate timing input', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      expect(() => {
        builder.buildTiming({ frequency: 0, period: 1, periodUnit: 'd' });
      }).toThrow('Invalid timing input');
    });

    it('should require complete state before getResult', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      expect(() => {
        builder.getResult();
      }).toThrow('Incomplete builder state');
    });
  });

  describe('PRN medications', () => {
    it('should support as-needed configuration', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      builder
        .buildDose({ value: 10, unit: 'mg' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('by mouth')
        .buildAsNeeded({ asNeeded: true, indication: 'for pain' });

      const json = builder.toJSON() as any;
      expect(json.state.asNeeded).toBeDefined();
      expect(json.state.asNeeded.indication).toBe('for pain');
    });
  });

  describe('Constraints', () => {
    it('should support dose constraints', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      builder
        .buildDose({ value: 10, unit: 'mg' })
        .buildTiming({ frequency: 1, period: 4, periodUnit: 'h' })
        .buildRoute('by mouth')
        .buildConstraints({
          maxDosePerPeriod: {
            dose: { value: 60, unit: 'mg' },
            period: { value: 24, unit: 'hour' }
          }
        });

      const json = builder.toJSON() as any;
      expect(json.state.constraints).toBeDefined();
      expect(json.state.constraints.maxDosePerPeriod.dose.value).toBe(60);
    });
  });

  describe('Audit trail', () => {
    it('should maintain audit trail of all operations', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      builder
        .buildDose({ value: 100, unit: 'mg' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth')
        .buildSpecialInstructions(['with food', 'at bedtime']);

      const audit = builder.explain();
      expect(audit).toContain('Builder initialized');
      expect(audit).toContain('Added dose: 100 mg');
      expect(audit).toContain('Set timing: 2 per 1 d');
      expect(audit).toContain('Set route: by mouth');
      expect(audit).toContain('Added 2 special instructions');
    });
  });

  describe('Serialization', () => {
    it('should serialize builder state', () => {
      const builder = new MockSignatureBuilder(mockContext);
      
      builder
        .buildDose({ value: 100, unit: 'mg' })
        .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
        .buildRoute('by mouth');

      const json = builder.toJSON() as any;
      expect(json.context).toBeDefined();
      expect(json.state).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.state.doses).toHaveLength(1);
      expect(json.state.timing).toBeDefined();
      expect(json.state.route).toBe('by mouth');
    });
  });
});

describe('Input validation functions', () => {
  describe('isValidDoseInput', () => {
    it('should validate correct dose input', () => {
      expect(isValidDoseInput({ value: 100, unit: 'mg' })).toBe(true);
      expect(isValidDoseInput({ value: 0.5, unit: 'tablet' })).toBe(true);
    });

    it('should reject invalid dose input', () => {
      expect(isValidDoseInput({ value: -1, unit: 'mg' })).toBe(false);
      expect(isValidDoseInput({ value: 0, unit: 'mg' })).toBe(false);
      expect(isValidDoseInput({ value: 100, unit: '' })).toBe(false);
      expect(isValidDoseInput(null as any)).toBe(false);
    });
  });

  describe('isValidTimingInput', () => {
    it('should validate correct timing input', () => {
      expect(isValidTimingInput({ frequency: 2, period: 1, periodUnit: 'd' })).toBe(true);
      expect(isValidTimingInput({ frequency: 1, period: 8, periodUnit: 'h' })).toBe(true);
    });

    it('should reject invalid timing input', () => {
      expect(isValidTimingInput({ frequency: 0, period: 1, periodUnit: 'd' })).toBe(false);
      expect(isValidTimingInput({ frequency: 1, period: 0, periodUnit: 'd' })).toBe(false);
      expect(isValidTimingInput({ frequency: 1, period: 1, periodUnit: '' })).toBe(false);
      expect(isValidTimingInput(null as any)).toBe(false);
    });
  });
});