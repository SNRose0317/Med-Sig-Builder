import {
  // Branded types
  Mass,
  Volume,
  Count,
  MassUnit,
  VolumeUnit,
  CountUnit,
  
  // Value objects
  Dose,
  Frequency,
  Route,
  
  // Type guards
  isMass,
  isVolume,
  isCount,
  isDose,
  isFrequency,
  isRoute,
  
  // Factory functions
  mass,
  volume,
  count,
  
  // Constants
  MASS_UNITS,
  VOLUME_UNITS,
  COUNT_UNITS,
  ROUTE_VERBS
} from '../value-objects';

describe('Branded Types', () => {
  describe('Mass type', () => {
    it('should create valid mass values', () => {
      const m1 = mass(100, 'mg');
      expect(m1._brand).toBe('Mass');
      expect(m1.value).toBe(100);
      expect(m1.unit).toBe('mg');
    });

    it('should validate mass units', () => {
      expect(() => mass(100, 'mg')).not.toThrow();
      expect(() => mass(5, 'g')).not.toThrow();
      expect(() => mass(1000, 'mcg')).not.toThrow();
      expect(() => mass(100, 'mL' as any)).toThrow('Invalid mass unit');
    });

    it('should reject negative values', () => {
      expect(() => mass(-100, 'mg')).toThrow('Mass value must be positive');
      expect(() => mass(0, 'mg')).toThrow('Mass value must be positive');
    });

    it('should support type guard', () => {
      const m = mass(100, 'mg');
      const v = volume(10, 'mL');
      
      expect(isMass(m)).toBe(true);
      expect(isMass(v)).toBe(false);
      expect(isMass(null)).toBe(false);
      expect(isMass({ value: 100, unit: 'mg' })).toBe(false);
    });
  });

  describe('Volume type', () => {
    it('should create valid volume values', () => {
      const v1 = volume(10, 'mL');
      expect(v1._brand).toBe('Volume');
      expect(v1.value).toBe(10);
      expect(v1.unit).toBe('mL');
    });

    it('should validate volume units', () => {
      expect(() => volume(10, 'mL')).not.toThrow();
      expect(() => volume(1, 'L')).not.toThrow();
      expect(() => volume(100, 'mg' as any)).toThrow('Invalid volume unit');
    });

    it('should reject negative values', () => {
      expect(() => volume(-10, 'mL')).toThrow('Volume value must be positive');
      expect(() => volume(0, 'mL')).toThrow('Volume value must be positive');
    });

    it('should support type guard', () => {
      const v = volume(10, 'mL');
      const m = mass(100, 'mg');
      
      expect(isVolume(v)).toBe(true);
      expect(isVolume(m)).toBe(false);
    });
  });

  describe('Count type', () => {
    it('should create valid count values', () => {
      const c1 = count(2, 'tablet');
      expect(c1._brand).toBe('Count');
      expect(c1.value).toBe(2);
      expect(c1.unit).toBe('tablet');
    });

    it('should validate count units', () => {
      expect(() => count(1, 'tablet')).not.toThrow();
      expect(() => count(2, 'capsule')).not.toThrow();
      expect(() => count(4, 'click')).not.toThrow();
      expect(() => count(1, 'mg' as any)).toThrow('Invalid count unit');
    });

    it('should support fractional tablets', () => {
      const halfTablet = count(0.5, 'tablet');
      expect(halfTablet.value).toBe(0.5);
    });

    it('should support type guard', () => {
      const c = count(2, 'tablet');
      const m = mass(100, 'mg');
      
      expect(isCount(c)).toBe(true);
      expect(isCount(m)).toBe(false);
    });
  });

  describe('Type safety', () => {
    it('should prevent mixing incompatible types at compile time', () => {
      const m = mass(100, 'mg');
      const v = volume(10, 'mL');
      
      // TypeScript should prevent these at compile time
      // These tests verify runtime behavior matches compile-time safety
      expect(m._brand).not.toBe(v._brand);
      expect(isMass(m) && !isVolume(m)).toBe(true);
      expect(isVolume(v) && !isMass(v)).toBe(true);
    });
  });
});

describe('Dose Value Object', () => {
  describe('creation', () => {
    it('should create dose from mass', () => {
      const dose = Dose.fromMass(100, 'mg');
      expect(dose.getValue()).toBe(100);
      expect(dose.getUnit()).toBe('mg');
      expect(dose.isMass()).toBe(true);
      expect(dose.isVolume()).toBe(false);
      expect(dose.isCount()).toBe(false);
    });

    it('should create dose from volume', () => {
      const dose = Dose.fromVolume(5, 'mL');
      expect(dose.getValue()).toBe(5);
      expect(dose.getUnit()).toBe('mL');
      expect(dose.isVolume()).toBe(true);
      expect(dose.isMass()).toBe(false);
    });

    it('should create dose from count', () => {
      const dose = Dose.fromCount(2, 'tablet');
      expect(dose.getValue()).toBe(2);
      expect(dose.getUnit()).toBe('tablet');
      expect(dose.isCount()).toBe(true);
    });

    it('should create dose from branded types', () => {
      const m = mass(100, 'mg');
      const dose = Dose.fromBranded(m);
      expect(dose.getValue()).toBe(100);
      expect(dose.getUnit()).toBe('mg');
    });
  });

  describe('validation', () => {
    it('should reject invalid values', () => {
      expect(() => Dose.fromMass(-100, 'mg')).toThrow();
      expect(() => Dose.fromMass(0, 'mg')).toThrow();
      expect(() => Dose.fromVolume(-5, 'mL')).toThrow();
    });

    it('should reject invalid units', () => {
      expect(() => Dose.fromMass(100, 'invalid' as any)).toThrow();
      expect(() => Dose.fromVolume(10, 'tablets' as any)).toThrow();
    });
  });

  describe('comparison methods', () => {
    it('should support equality comparison', () => {
      const dose1 = Dose.fromMass(100, 'mg');
      const dose2 = Dose.fromMass(100, 'mg');
      const dose3 = Dose.fromMass(200, 'mg');
      const dose4 = Dose.fromMass(100, 'g');
      
      expect(dose1.equals(dose2)).toBe(true);
      expect(dose1.equals(dose3)).toBe(false);
      expect(dose1.equals(dose4)).toBe(false);
    });

    it('should not allow comparison between different types', () => {
      const massDose = Dose.fromMass(100, 'mg');
      const volumeDose = Dose.fromVolume(10, 'mL');
      
      expect(() => massDose.equals(volumeDose)).toThrow('Cannot compare different dose types');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const dose = Dose.fromMass(100, 'mg');
      const json = dose.toJSON();
      
      expect(json).toEqual({
        type: 'mass',
        value: 100,
        unit: 'mg'
      });
    });

    it('should deserialize from JSON', () => {
      const json = {
        type: 'mass' as const,
        value: 100,
        unit: 'mg' as MassUnit
      };
      
      const dose = Dose.fromJSON(json);
      expect(dose.getValue()).toBe(100);
      expect(dose.getUnit()).toBe('mg');
      expect(dose.isMass()).toBe(true);
    });

    it('should round-trip serialize', () => {
      const original = Dose.fromVolume(5.5, 'mL');
      const json = original.toJSON();
      const restored = Dose.fromJSON(json);
      
      expect(original.equals(restored)).toBe(true);
    });
  });

  describe('type guard', () => {
    it('should identify dose objects', () => {
      const dose = Dose.fromMass(100, 'mg');
      const notDose = { value: 100, unit: 'mg' };
      
      expect(isDose(dose)).toBe(true);
      expect(isDose(notDose)).toBe(false);
      expect(isDose(null)).toBe(false);
    });
  });
});

describe('Frequency Value Object', () => {
  describe('creation', () => {
    it('should create simple frequency', () => {
      const freq = Frequency.create({
        times: 2,
        period: 1,
        periodUnit: 'day'
      });
      
      expect(freq.getTimes()).toBe(2);
      expect(freq.getPeriod()).toBe(1);
      expect(freq.getPeriodUnit()).toBe('day');
      expect(freq.getWhen()).toBeUndefined();
    });

    it('should create frequency with specific times', () => {
      const freq = Frequency.create({
        times: 2,
        period: 1,
        periodUnit: 'day',
        when: ['morning', 'evening']
      });
      
      expect(freq.getWhen()).toEqual(['morning', 'evening']);
    });

    it('should create PRN frequency', () => {
      const freq = Frequency.createPRN({
        minInterval: 4,
        intervalUnit: 'hour',
        indication: 'for pain'
      });
      
      expect(freq.isPRN()).toBe(true);
      expect(freq.getMinInterval()).toBe(4);
      expect(freq.getIndication()).toBe('for pain');
    });
  });

  describe('validation', () => {
    it('should reject invalid times', () => {
      expect(() => Frequency.create({
        times: 0,
        period: 1,
        periodUnit: 'day'
      })).toThrow('Times must be positive');
      
      expect(() => Frequency.create({
        times: -1,
        period: 1,
        periodUnit: 'day'
      })).toThrow('Times must be positive');
    });

    it('should reject invalid period', () => {
      expect(() => Frequency.create({
        times: 2,
        period: 0,
        periodUnit: 'day'
      })).toThrow('Period must be positive');
    });

    it('should validate period units', () => {
      expect(() => Frequency.create({
        times: 2,
        period: 1,
        periodUnit: 'invalid' as any
      })).toThrow('Invalid period unit');
    });

    it('should validate PRN minimum interval', () => {
      expect(() => Frequency.createPRN({
        minInterval: 0,
        intervalUnit: 'hour'
      })).toThrow('Minimum interval must be positive');
    });
  });

  describe('common patterns', () => {
    it('should create daily frequency', () => {
      const daily = Frequency.daily();
      expect(daily.getTimes()).toBe(1);
      expect(daily.getPeriod()).toBe(1);
      expect(daily.getPeriodUnit()).toBe('day');
    });

    it('should create twice daily', () => {
      const bid = Frequency.twiceDaily();
      expect(bid.getTimes()).toBe(2);
      expect(bid.getPeriod()).toBe(1);
      expect(bid.getPeriodUnit()).toBe('day');
    });

    it('should create three times daily', () => {
      const tid = Frequency.threeTimesDaily();
      expect(tid.getTimes()).toBe(3);
    });

    it('should create four times daily', () => {
      const qid = Frequency.fourTimesDaily();
      expect(qid.getTimes()).toBe(4);
    });

    it('should create every X hours', () => {
      const q8h = Frequency.everyXHours(8);
      expect(q8h.getTimes()).toBe(1);
      expect(q8h.getPeriod()).toBe(8);
      expect(q8h.getPeriodUnit()).toBe('hour');
    });
  });

  describe('comparison', () => {
    it('should support equality comparison', () => {
      const freq1 = Frequency.twiceDaily();
      const freq2 = Frequency.twiceDaily();
      const freq3 = Frequency.daily();
      
      expect(freq1.equals(freq2)).toBe(true);
      expect(freq1.equals(freq3)).toBe(false);
    });

    it('should compare PRN frequencies', () => {
      const prn1 = Frequency.createPRN({
        minInterval: 4,
        intervalUnit: 'hour',
        indication: 'for pain'
      });
      
      const prn2 = Frequency.createPRN({
        minInterval: 4,
        intervalUnit: 'hour',
        indication: 'for pain'
      });
      
      expect(prn1.equals(prn2)).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should serialize regular frequency', () => {
      const freq = Frequency.twiceDaily();
      const json = freq.toJSON();
      
      expect(json).toEqual({
        type: 'regular',
        times: 2,
        period: 1,
        periodUnit: 'day'
      });
    });

    it('should serialize PRN frequency', () => {
      const freq = Frequency.createPRN({
        minInterval: 6,
        intervalUnit: 'hour',
        indication: 'for nausea'
      });
      
      const json = freq.toJSON();
      expect(json.type).toBe('prn');
      expect(json.minInterval).toBe(6);
    });

    it('should deserialize from JSON', () => {
      const json = {
        type: 'regular' as const,
        times: 3,
        period: 1,
        periodUnit: 'day' as const
      };
      
      const freq = Frequency.fromJSON(json);
      expect(freq.getTimes()).toBe(3);
    });
  });

  describe('type guard', () => {
    it('should identify frequency objects', () => {
      const freq = Frequency.daily();
      expect(isFrequency(freq)).toBe(true);
      expect(isFrequency({})).toBe(false);
    });
  });
});

describe('Route Value Object', () => {
  describe('creation', () => {
    it('should create route with appropriate verb', () => {
      const oral = Route.create('by mouth');
      expect(oral.getValue()).toBe('by mouth');
      expect(oral.getVerb()).toBe('Take');
      
      const topical = Route.create('topically');
      expect(topical.getVerb()).toBe('Apply');
      
      const injection = Route.create('subcutaneously');
      expect(injection.getVerb()).toBe('Inject');
    });

    it('should handle custom routes', () => {
      const custom = Route.create('via gastrostomy tube');
      expect(custom.getValue()).toBe('via gastrostomy tube');
      expect(custom.getVerb()).toBe('Administer');
    });
  });

  describe('validation', () => {
    it('should reject empty routes', () => {
      expect(() => Route.create('')).toThrow('Route cannot be empty');
    });

    it('should normalize whitespace', () => {
      const route = Route.create('  by mouth  ');
      expect(route.getValue()).toBe('by mouth');
    });
  });

  describe('common routes', () => {
    it('should provide factory methods for common routes', () => {
      const oral = Route.oral();
      expect(oral.getValue()).toBe('by mouth');
      expect(oral.getVerb()).toBe('Take');
      
      const sublingual = Route.sublingual();
      expect(sublingual.getValue()).toBe('sublingually');
      expect(sublingual.getVerb()).toBe('Place');
      
      const subcutaneous = Route.subcutaneous();
      expect(subcutaneous.getValue()).toBe('subcutaneously');
      expect(subcutaneous.getVerb()).toBe('Inject');
    });
  });

  describe('verb determination', () => {
    it('should determine correct verb for various routes', () => {
      const routes = [
        { route: 'by mouth', verb: 'Take' },
        { route: 'orally', verb: 'Take' },
        { route: 'topically', verb: 'Apply' },
        { route: 'to affected area', verb: 'Apply' },
        { route: 'subcutaneously', verb: 'Inject' },
        { route: 'intramuscularly', verb: 'Inject' },
        { route: 'intravenously', verb: 'Infuse' },
        { route: 'sublingually', verb: 'Place' },
        { route: 'rectally', verb: 'Insert' },
        { route: 'vaginally', verb: 'Insert' },
        { route: 'by inhalation', verb: 'Inhale' },
        { route: 'inhaled', verb: 'Inhale' }
      ];
      
      routes.forEach(({ route, verb }) => {
        const r = Route.create(route);
        expect(r.getVerb()).toBe(verb);
      });
    });
  });

  describe('comparison', () => {
    it('should support equality comparison', () => {
      const route1 = Route.oral();
      const route2 = Route.oral();
      const route3 = Route.sublingual();
      
      expect(route1.equals(route2)).toBe(true);
      expect(route1.equals(route3)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const route = Route.oral();
      const json = route.toJSON();
      
      expect(json).toEqual({
        value: 'by mouth',
        verb: 'Take'
      });
    });

    it('should deserialize from JSON', () => {
      const json = {
        value: 'topically',
        verb: 'Apply'
      };
      
      const route = Route.fromJSON(json);
      expect(route.getValue()).toBe('topically');
      expect(route.getVerb()).toBe('Apply');
    });
  });

  describe('type guard', () => {
    it('should identify route objects', () => {
      const route = Route.oral();
      expect(isRoute(route)).toBe(true);
      expect(isRoute({ value: 'by mouth' })).toBe(false);
    });
  });
});

describe('Integration', () => {
  it('should work together in a medication signature context', () => {
    // Create a complete medication instruction using value objects
    const dose = Dose.fromMass(500, 'mg');
    const frequency = Frequency.twiceDaily();
    const route = Route.oral();
    
    // Verify they can be used together
    expect(dose.getValue()).toBe(500);
    expect(frequency.getTimes()).toBe(2);
    expect(route.getVerb()).toBe('Take');
    
    // Simulate building an instruction
    const instruction = `${route.getVerb()} ${dose.getValue()} ${dose.getUnit()} ${route.getValue()} ${frequency.getTimes()} times daily`;
    expect(instruction).toBe('Take 500 mg by mouth 2 times daily');
  });

  it('should maintain type safety across operations', () => {
    const massDose = Dose.fromMass(100, 'mg');
    const volumeDose = Dose.fromVolume(5, 'mL');
    
    // These should be different types at runtime
    expect(massDose.isMass()).toBe(true);
    expect(volumeDose.isVolume()).toBe(true);
    
    // And should not be comparable
    expect(() => massDose.equals(volumeDose)).toThrow();
  });
});