/**
 * Tests for FHIR Temporal Parser
 * 
 * Validates parsing of natural language timing strings to FHIR
 * structures, with special focus on titration schedule support.
 */

import { FHIRTemporalParser, parseTiming, isTitrationSchedule } from '../FHIRTemporalParser';
import { createDuration, createFHIRTiming } from '../types';

describe('FHIRTemporalParser', () => {
  let parser: FHIRTemporalParser;

  beforeEach(() => {
    parser = new FHIRTemporalParser();
  });

  describe('Single Timing Parsing', () => {
    it('should parse once daily correctly', () => {
      const result = parser.parse('once daily');
      
      expect(result.isTitration).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'd'
        }
      });
    });

    it('should parse twice daily correctly', () => {
      const result = parser.parse('twice daily');
      
      expect(result.isTitration).toBe(false);
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 2,
          period: 1,
          periodUnit: 'd'
        }
      });
    });

    it('should parse once weekly correctly', () => {
      const result = parser.parse('once weekly');
      
      expect(result.isTitration).toBe(false);
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'wk'
        }
      });
    });

    it('should parse every 8 hours correctly', () => {
      const result = parser.parse('every 8 hours');
      
      expect(result.isTitration).toBe(false);
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 1,
          period: 8,
          periodUnit: 'h'
        }
      });
    });

    it('should handle unknown patterns with fallback', () => {
      const result = parser.parse('some unknown pattern');
      
      expect(result.isTitration).toBe(false);
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.warnings).toHaveLength(1);
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'd'
        }
      });
    });
  });

  describe('Titration Sequence Parsing', () => {
    it('should parse GLP-1 agonist titration schedule', () => {
      const phases = [
        'Week 1-4: Inject once weekly',
        'Week 5-8: Inject once weekly',
        'Week 9+: Inject once weekly'
      ];

      const result = parser.parse(phases);
      
      expect(result.isTitration).toBe(true);
      expect(result.phases).toHaveLength(3);
      expect(result.confidence).toBeGreaterThan(0.8);

      // Check first phase
      const phase1 = result.phases![0];
      expect(phase1.timing.repeat?.frequency).toBe(1);
      expect(phase1.timing.repeat?.periodUnit).toBe('wk');
      expect(phase1.timing.repeat?.count).toBe(4); // 4 weeks * 1 dose per week
      expect(phase1.isMaintenancePhase).toBe(false);

      // Check maintenance phase
      const maintenancePhase = result.phases![2];
      expect(maintenancePhase.isMaintenancePhase).toBe(true);
      expect(maintenancePhase.duration.value).toBe(Infinity);
    });

    it('should parse daily titration schedule', () => {
      const phases = [
        'Day 1-7: Take once daily',
        'Day 8-14: Take twice daily',
        'Day 15+: Take three times daily'
      ];

      const result = parser.parse(phases);
      
      expect(result.isTitration).toBe(true);
      expect(result.phases).toHaveLength(3);

      // Check day-based calculations
      const phase1 = result.phases![0];
      expect(phase1.timing.repeat?.frequency).toBe(1);
      expect(phase1.timing.repeat?.periodUnit).toBe('d');
      expect(phase1.timing.repeat?.count).toBe(7); // 7 days * 1 dose per day

      const phase2 = result.phases![1];
      expect(phase2.timing.repeat?.frequency).toBe(2);
      expect(phase2.timing.repeat?.count).toBe(14); // 7 days * 2 doses per day
    });

    it('should detect titration in single string', () => {
      const titrationString = 'Week 1-4: once weekly, then Week 5-8: once weekly, then Week 9+: once weekly';
      
      const result = parser.parse(titrationString);
      
      expect(result.isTitration).toBe(true);
      expect(result.phases).toHaveLength(3);
    });

    it('should handle malformed titration gracefully', () => {
      const malformed = [
        'Week invalid range',
        'No timing info here',
        ''
      ];

      const result = parser.parse(malformed);
      
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('calculateDosesPerPeriod', () => {
    it('should calculate daily doses correctly', () => {
      const timing = createFHIRTiming(2, 1, 'd'); // Twice daily
      const oneDayPeriod = createDuration(1, 'd');
      
      const dosesPerDay = parser.calculateDosesPerPeriod(timing, oneDayPeriod);
      
      expect(dosesPerDay).toBe(2);
    });

    it('should calculate weekly doses correctly', () => {
      const timing = createFHIRTiming(1, 1, 'wk'); // Once weekly
      const oneWeekPeriod = createDuration(1, 'wk');
      
      const dosesPerWeek = parser.calculateDosesPerPeriod(timing, oneWeekPeriod);
      
      expect(dosesPerWeek).toBe(1);
    });

    it('should handle unit conversions', () => {
      const timing = createFHIRTiming(1, 1, 'wk'); // Once weekly
      const sevenDayPeriod = createDuration(7, 'd');
      
      const dosesPerSevenDays = parser.calculateDosesPerPeriod(timing, sevenDayPeriod);
      
      expect(dosesPerSevenDays).toBe(1);
    });
  });

  describe('calculatePhaseDuration', () => {
    it('should calculate duration from bounds', () => {
      const timing = createFHIRTiming(1, 1, 'wk', {
        boundsDuration: createDuration(4, 'wk')
      });
      
      const duration = parser.calculatePhaseDuration(timing);
      
      expect(duration).toEqual(createDuration(4, 'wk'));
    });

    it('should calculate duration from count and frequency', () => {
      const timing = createFHIRTiming(1, 1, 'wk', {
        count: 4 // 4 doses at once weekly = 4 weeks
      });
      
      const duration = parser.calculatePhaseDuration(timing);
      
      expect(duration).toEqual(createDuration(4, 'wk'));
    });

    it('should return null for indefinite timing', () => {
      const timing = createFHIRTiming(1, 1, 'd'); // No bounds or count
      
      const duration = parser.calculatePhaseDuration(timing);
      
      expect(duration).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should detect titration in array', () => {
      const phases = ['Week 1-4: once weekly', 'Week 5+: once weekly'];
      
      expect(isTitrationSchedule(phases)).toBe(true);
    });

    it('should detect titration in string', () => {
      const titrationString = 'Week 1-4: once weekly, then Week 5+: once weekly';
      
      expect(isTitrationSchedule(titrationString)).toBe(true);
    });

    it('should not detect titration in simple string', () => {
      expect(isTitrationSchedule('once daily')).toBe(false);
    });

    it('should parse using convenience function', () => {
      const result = parseTiming('twice daily');
      
      expect(result.isTitration).toBe(false);
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 2,
          period: 1,
          periodUnit: 'd'
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = parser.parse('');
      
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle null/undefined input safely', () => {
      // TypeScript prevents this at compile time, but test runtime safety
      const result = parser.parse(null as any);
      
      expect(result.confidence).toBe(0);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle complex frequency expressions', () => {
      const result = parser.parse('Take 2 tablets by mouth three times daily with meals');
      
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 3,
          period: 1,
          periodUnit: 'd'
        }
      });
    });
  });

  describe('Integration with Existing Frequencies', () => {
    it('should use existing frequency definitions when available', () => {
      // Test that it uses the frequency data from medication-data.ts
      const result = parser.parse('Once Daily');
      
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.timing).toMatchObject({
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'd'
        }
      });
    });

    it('should handle case variations', () => {
      const variations = ['TWICE DAILY', 'twice daily', 'Twice Daily', 'TWICE daily'];
      
      variations.forEach(variation => {
        const result = parser.parse(variation);
        expect(result.timing).toMatchObject({
          repeat: {
            frequency: 2,
            period: 1,
            periodUnit: 'd'
          }
        });
      });
    });
  });
});