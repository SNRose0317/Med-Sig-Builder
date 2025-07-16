import { createTemplateEngine, TEMPLATE_EXAMPLES } from '../templates';
import { TemplateKey } from '../types';

describe('Template Integration Tests', () => {
  let engine: ReturnType<typeof createTemplateEngine>;

  beforeEach(() => {
    engine = createTemplateEngine('en-US');
  });

  describe('Template Examples Validation', () => {
    it('should render ORAL_TABLET_TEMPLATE examples correctly', () => {
      const examples = TEMPLATE_EXAMPLES.ORAL_TABLET_TEMPLATE;
      
      examples.forEach(({ data, expected }, index) => {
        const result = engine.render('ORAL_TABLET_TEMPLATE', data);
        expect(result).toBe(expected);
      });
    });

    it('should render LIQUID_DOSE_TEMPLATE examples correctly', () => {
      const examples = TEMPLATE_EXAMPLES.LIQUID_DOSE_TEMPLATE;
      
      examples.forEach(({ data, expected }, index) => {
        const result = engine.render('LIQUID_DOSE_TEMPLATE', data);
        expect(result).toBe(expected);
      });
    });

    it('should render INJECTION_TEMPLATE examples correctly', () => {
      const examples = TEMPLATE_EXAMPLES.INJECTION_TEMPLATE;
      
      examples.forEach(({ data, expected }, index) => {
        const result = engine.render('INJECTION_TEMPLATE', data);
        expect(result).toBe(expected);
      });
    });

    it('should render TOPICAL_APPLICATION_TEMPLATE examples correctly', () => {
      const examples = TEMPLATE_EXAMPLES.TOPICAL_APPLICATION_TEMPLATE;
      
      examples.forEach(({ data, expected }, index) => {
        const result = engine.render('TOPICAL_APPLICATION_TEMPLATE', data);
        expect(result).toBe(expected);
      });
    });

    it('should render PRN_INSTRUCTION_TEMPLATE examples correctly', () => {
      const examples = TEMPLATE_EXAMPLES.PRN_INSTRUCTION_TEMPLATE;
      
      examples.forEach(({ data, expected }, index) => {
        const result = engine.render('PRN_INSTRUCTION_TEMPLATE', data);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should render templates in under 1ms (Epic requirement)', () => {
      const sampleData = {
        verb: 'Take',
        doseValue: 1,
        doseUnit: 'tablet',
        route: 'by mouth',
        frequency: 'twice daily'
      };

      // Warm up cache
      engine.render('ORAL_TABLET_TEMPLATE', sampleData);
      
      // Measure 100 renders
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        engine.render('ORAL_TABLET_TEMPLATE', sampleData);
      }
      const endTime = performance.now();
      
      const averageTime = (endTime - startTime) / 100;
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe('Fractional Dosing (Key Epic Requirement)', () => {
    it('should handle all fractional tablet doses correctly', () => {
      const testCases = [
        { dose: 0.25, expected: 'one quarter tablet' },
        { dose: 0.5, expected: 'half a tablet' },
        { dose: 0.75, expected: 'three quarters of a tablet' },
        { dose: 1, expected: 'one tablet' },
        { dose: 1.5, expected: 'one and a half tablets' },
        { dose: 2, expected: 'two tablets' }
      ];

      testCases.forEach(({ dose, expected }) => {
        const data = {
          verb: 'Take',
          doseValue: dose,
          doseUnit: 'tablet',
          route: 'by mouth',
          frequency: 'daily'
        };
        
        const result = engine.render('ORAL_TABLET_TEMPLATE', data);
        expect(result).toContain(expected);
      });
    });
  });

  describe('Dual Dosing (Injectable Support)', () => {
    it('should support dual dosing for injectables', () => {
      const data = {
        verb: 'Inject',
        doseValue: 0.5,
        doseUnit: 'mL',
        dualDose: '100 mg',
        route: 'intramuscularly',
        frequency: 'weekly'
      };
      
      const result = engine.render('INJECTION_TEMPLATE', data);
      expect(result).toBe('Inject 0.5 mL, as 100 mg, intramuscularly weekly.');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing templates gracefully', () => {
      const result = engine.render('NONEXISTENT_TEMPLATE' as TemplateKey, {
        verb: 'Take',
        route: 'by mouth',
        frequency: 'daily'
      });
      
      expect(result).toBe('[Template Error: NONEXISTENT_TEMPLATE]');
    });
  });
});