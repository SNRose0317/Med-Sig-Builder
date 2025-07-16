/**
 * Integration Tests for Epic 3 Implementation
 * 
 * Verifies that the complete dispatcher system works correctly
 * with all strategies and maintains backward compatibility.
 */

import { generateSignature, getRegistry } from '../../signature/SignatureBuilderAdapter';
import { StrategyDispatcher } from '../StrategyDispatcher';
import { Medication } from '../../../types';

describe('Epic 3 Integration Tests', () => {
  describe('Backward Compatibility', () => {
    it('should generate same output as original implementation for tablets', () => {
      const medication: Medication = {
        id: 'metformin-500',
        name: 'Metformin 500mg',
        type: 'prescription',
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Metformin' }] },
        ingredient: [{
          name: 'Metformin',
          strengthRatio: {
            numerator: { value: 500, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        isActive: true,
        dosageConstraints: {}
      };

      const result = generateSignature(
        medication,
        { value: 2, unit: 'tablet' },
        'Orally',
        'Twice Daily'
      );

      expect(result.humanReadable).toContain('Take 2 tablets');
      expect(result.humanReadable).toContain('by mouth');
      expect(result.humanReadable).toContain('twice daily');
      expect(result.fhirRepresentation.dosageInstruction.route).toBe('Orally');
      expect(result.fhirRepresentation.dosageInstruction.doseAndRate.doseQuantity).toEqual({
        value: 2,
        unit: 'tablet'
      });
    });

    it('should handle fractional tablet doses', () => {
      const medication: Medication = {
        id: 'warfarin-5',
        name: 'Warfarin 5mg',
        type: 'prescription',
        doseForm: 'Tablet',
        code: { coding: [{ system: 'RxNorm', code: '11289', display: 'Warfarin' }] },
        ingredient: [{
          name: 'Warfarin',
          strengthRatio: {
            numerator: { value: 5, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        isActive: true,
        dosageConstraints: {}
      };

      const result = generateSignature(
        medication,
        { value: 0.5, unit: 'tablet' },
        'Orally',
        'Once Daily'
      );

      expect(result.humanReadable).toBe('Take 1/2 tablet by mouth once daily.');
    });

    it('should handle liquid medications', () => {
      const medication: Medication = {
        id: 'amox-susp',
        name: 'Amoxicillin Suspension 250mg/5mL',
        type: 'prescription',
        doseForm: 'Suspension',
        code: { coding: [{ system: 'RxNorm', code: '308182', display: 'Amoxicillin' }] },
        ingredient: [{
          name: 'Amoxicillin',
          strengthRatio: {
            numerator: { value: 250, unit: 'mg' },
            denominator: { value: 5, unit: 'mL' }
          }
        }],
        isActive: true,
        dosageConstraints: {}
      };

      const result = generateSignature(
        medication,
        { value: 10, unit: 'mL' },
        'Orally',
        'Three Times Daily'
      );

      expect(result.humanReadable).toContain('Take 10 mL by mouth three times daily');
      expect(result.humanReadable).toContain('shake well before use');
    });

    it('should handle testosterone cypionate with dual dosing', () => {
      const medication: Medication = {
        id: 'testosterone-cypionate-200mg-ml',
        name: 'Testosterone Cypionate 200mg/mL',
        type: 'prescription',
        doseForm: 'Vial',
        code: { coding: [{ display: 'Testosterone Cypionate' }] },
        ingredient: [{
          name: 'Testosterone Cypionate',
          strengthRatio: {
            numerator: { value: 200, unit: 'mg' },
            denominator: { value: 1, unit: 'mL' }
          }
        }],
        isActive: true,
        dosageConstraints: {}
      };

      const result = generateSignature(
        medication,
        { value: 200, unit: 'mg' },
        'Intramuscularly',
        'Once Weekly'
      );

      expect(result.humanReadable).toBe(
        'Inject 200 mg, as 1.00 mL intramuscularly (rotate injection sites) once weekly.'
      );
    });

    it('should handle Topiclick dispenser', () => {
      const medication: Medication = {
        id: 'estradiol-cream',
        name: 'Estradiol Cream with Topiclick',
        type: 'prescription',
        doseForm: 'Cream',
        code: { coding: [{ display: 'Estradiol' }] },
        ingredient: [{
          name: 'Estradiol',
          strengthRatio: {
            numerator: { value: 10, unit: 'mg' },
            denominator: { value: 1, unit: 'g' }
          }
        }],
        dispenserInfo: { type: 'Topiclick', unit: 'click', pluralUnit: 'clicks', conversionRatio: 4 },
        isActive: true,
        dosageConstraints: {}
      };

      const result = generateSignature(
        medication,
        { value: 4, unit: 'click' },
        'Topically',
        'Once Daily'
      );

      expect(result.humanReadable).toContain('4 clicks');
      expect(result.humanReadable).toContain('10.0 mg');
      expect(result.humanReadable).toContain('Topiclick dispenser');
    });

    it('should handle special instructions', () => {
      const medication: Medication = {
        id: 'levothyroxine-50',
        name: 'Levothyroxine 50mcg',
        type: 'prescription',
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Levothyroxine' }] },
        ingredient: [{
          name: 'Levothyroxine',
          strengthRatio: {
            numerator: { value: 50, unit: 'mcg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        isActive: true,
        dosageConstraints: {}
      };

      const result = generateSignature(
        medication,
        { value: 1, unit: 'tablet' },
        'Orally',
        'Once Daily',
        'on empty stomach 30 minutes before breakfast'
      );

      expect(result.humanReadable).toContain('Take 1 tablet');
      expect(result.humanReadable).toContain('by mouth');
      expect(result.humanReadable).toContain('once daily');
      expect(result.humanReadable).toContain('on empty stomach 30 minutes before breakfast');
      expect(result.fhirRepresentation.dosageInstruction.additionalInstructions).toEqual({
        text: 'on empty stomach 30 minutes before breakfast'
      });
    });
  });

  describe('Registry Introspection', () => {
    it('should provide registry visualization', () => {
      const registry = getRegistry();
      const visualization = registry.visualizeRegistry();

      expect(visualization).toContain('Base Strategies:');
      expect(visualization).toContain('default');
      expect(visualization).toContain('tablet');
      expect(visualization).toContain('liquid');
      expect(visualization).toContain('testosterone-cypionate');
      
      expect(visualization).toContain('Modifier Strategies:');
      expect(visualization).toContain('topiclick');
      expect(visualization).toContain('strength-display');
    });

    it('should explain strategy selection', () => {
      const registry = getRegistry();
      const dispatcher = new StrategyDispatcher(registry);
      
      const context = {
        id: 'test-req',
        timestamp: new Date().toISOString(),
        patient: { id: 'test-patient', age: 30 },
        medication: {
          id: 'test-tablet',
          name: 'Test Tablet',
          type: 'medication' as const,
          isActive: true,
          doseForm: 'Tablet',
          code: { coding: [{ display: 'Test Tablet' }] },
          ingredient: [{ name: 'Test', strengthRatio: { numerator: { value: 100, unit: 'mg' }, denominator: { value: 1, unit: 'tablet' } } }]
        },
        dose: { value: 1, unit: 'tablet' },
        route: 'oral',
        frequency: 'once daily'
      };

      const explanation = dispatcher.explainSelection(context);
      
      expect(explanation).toContain('Test Tablet');
      expect(explanation).toContain('Tablet');
      expect(explanation).toContain('Selected Base Strategy:');
      expect(explanation).toContain('TabletStrategy');
    });
  });

  describe('Error Handling', () => {
    it('should fallback gracefully when strategy dispatch fails', () => {
      const medication: Medication = {
        id: 'unknown',
        name: 'Unknown Med',
        type: 'prescription',
        doseForm: 'UnknownForm',
        isActive: true,
        code: { coding: [{ display: 'Unknown' }] },
        ingredient: [{ name: 'Unknown', strengthRatio: { numerator: { value: 1, unit: 'unit' }, denominator: { value: 1, unit: 'unit' } } }],
        dosageConstraints: {}
      };

      // Should use fallback without throwing
      const result = generateSignature(
        medication,
        { value: 1, unit: 'unit' },
        'Orally',
        'Once Daily'
      );

      expect(result.humanReadable).toContain('Take 1 unit');
    });
  });

  describe('Performance', () => {
    it('should complete 1000 signatures in reasonable time', () => {
      const medication: Medication = {
        id: 'perf-test',
        name: 'Performance Test Med',
        type: 'prescription',
        doseForm: 'Tablet',
        code: { coding: [{ display: 'Performance Test' }] },
        ingredient: [{
          name: 'Test Ingredient',
          strengthRatio: {
            numerator: { value: 100, unit: 'mg' },
            denominator: { value: 1, unit: 'tablet' }
          }
        }],
        isActive: true,
        dosageConstraints: {}
      };

      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        generateSignature(
          medication,
          { value: 1, unit: 'tablet' },
          'Orally',
          'Twice Daily'
        );
      }
      
      const duration = performance.now() - start;
      const avgTime = duration / 1000;
      
      console.log(`1000 signatures completed in ${duration.toFixed(0)}ms (avg: ${avgTime.toFixed(2)}ms)`);
      
      // Should complete in less than 1 second total
      expect(duration).toBeLessThan(1000);
      // Average should be less than 1ms per signature
      expect(avgTime).toBeLessThan(1);
    });
  });
});