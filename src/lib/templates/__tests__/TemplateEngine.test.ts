import { TemplateEngine } from '../TemplateEngine';
import { TemplateData, TemplateKey } from '../types';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine({ 
      locale: 'en-US', 
      enablePerformanceLogging: true 
    });
  });

  describe('Basic Template Registration and Rendering', () => {
    it('should register and render a simple template', () => {
      const templateKey: TemplateKey = 'ORAL_TABLET_TEMPLATE';
      const template = '{verb} {doseValue} {doseUnit} {route} {frequency}.';
      
      engine.registerTemplate('en-US', templateKey, template);
      
      const data: TemplateData = {
        verb: 'Take',
        doseValue: 1,
        doseUnit: 'tablet',
        route: 'by mouth',
        frequency: 'twice daily'
      };
      
      const result = engine.render(templateKey, data);
      expect(result).toBe('Take 1 tablet by mouth twice daily.');
    });

    it('should throw error for non-existent template', () => {
      const data: TemplateData = {
        verb: 'Take',
        route: 'by mouth',
        frequency: 'daily'
      };
      
      const result = engine.render('ORAL_TABLET_TEMPLATE', data);
      expect(result).toBe('[Template Error: ORAL_TABLET_TEMPLATE]');
    });
  });

  describe('ICU MessageFormat Features', () => {
    describe('Pluralization', () => {
      beforeEach(() => {
        const pluralTemplate = `{verb} {doseValue, plural,
          =0.25 {one quarter}
          =0.5 {half a}
          =0.75 {three quarters of a}
          =1 {one}
          =1.5 {one and a half}
          =2 {two}
          other {#}
        } {doseUnit, select,
          tablet {{doseValue, plural, one {tablet} other {tablets}}}
          capsule {{doseValue, plural, one {capsule} other {capsules}}}
          other {{doseUnit}}
        } {route} {frequency}.`;
        
        engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', pluralTemplate);
      });

      it('should handle fractional tablet doses correctly', () => {
        const testCases = [
          { doseValue: 0.25, expected: 'Take one quarter tablet by mouth daily.' },
          { doseValue: 0.5, expected: 'Take half a tablet by mouth daily.' },
          { doseValue: 0.75, expected: 'Take three quarters of a tablet by mouth daily.' },
          { doseValue: 1, expected: 'Take one tablet by mouth daily.' },
          { doseValue: 1.5, expected: 'Take one and a half tablets by mouth daily.' },
          { doseValue: 2, expected: 'Take two tablets by mouth daily.' },
          { doseValue: 3, expected: 'Take 3 tablets by mouth daily.' }
        ];

        testCases.forEach(({ doseValue, expected }) => {
          const data: TemplateData = {
            verb: 'Take',
            doseValue,
            doseUnit: 'tablet',
            route: 'by mouth',
            frequency: 'daily'
          };
          
          const result = engine.render('ORAL_TABLET_TEMPLATE', data);
          expect(result).toBe(expected);
        });
      });

      it('should handle singular vs plural units correctly', () => {
        const data1: TemplateData = {
          verb: 'Take',
          doseValue: 1,
          doseUnit: 'tablet',
          route: 'by mouth',
          frequency: 'daily'
        };
        
        const result1 = engine.render('ORAL_TABLET_TEMPLATE', data1);
        expect(result1).toBe('Take one tablet by mouth daily.');

        const data2: TemplateData = {
          verb: 'Take',
          doseValue: 2,
          doseUnit: 'tablet',
          route: 'by mouth',
          frequency: 'daily'
        };
        
        const result2 = engine.render('ORAL_TABLET_TEMPLATE', data2);
        expect(result2).toBe('Take two tablets by mouth daily.');
      });
    });

    describe('Conditional Logic', () => {
      beforeEach(() => {
        const conditionalTemplate = `{verb} {doseValue} {doseUnit}{dualDose, select,
          undefined {}
          other {, as {dualDose}}
        } {route} {frequency}{specialInstructions, select,
          undefined {}
          other { {specialInstructions}}
        }.`;
        
        engine.registerTemplate('en-US', 'LIQUID_DOSE_TEMPLATE', conditionalTemplate);
      });

      it('should render without optional parameters', () => {
        const data: TemplateData = {
          verb: 'Take',
          doseValue: 5,
          doseUnit: 'mL',
          route: 'by mouth',
          frequency: 'twice daily'
        };
        
        const result = engine.render('LIQUID_DOSE_TEMPLATE', data);
        expect(result).toBe('Take 5 mL by mouth twice daily.');
      });

      it('should render with dual dose information', () => {
        const data: TemplateData = {
          verb: 'Take',
          doseValue: 5,
          doseUnit: 'mL',
          dualDose: '250 mg',
          route: 'by mouth',
          frequency: 'twice daily'
        };
        
        const result = engine.render('LIQUID_DOSE_TEMPLATE', data);
        expect(result).toBe('Take 5 mL, as 250 mg, by mouth twice daily.');
      });

      it('should render with special instructions', () => {
        const data: TemplateData = {
          verb: 'Take',
          doseValue: 5,
          doseUnit: 'mL',
          route: 'by mouth',
          frequency: 'twice daily',
          specialInstructions: 'with food'
        };
        
        const result = engine.render('LIQUID_DOSE_TEMPLATE', data);
        expect(result).toBe('Take 5 mL by mouth twice daily with food.');
      });
    });

    describe('PRN Instructions', () => {
      beforeEach(() => {
        const prnTemplate = `{verb} {doseRange, select,
          undefined {{doseValue} {doseUnit}}
          other {{doseRange}}
        } {route} {frequencyRange, select,
          undefined {{frequency}}
          other {{frequencyRange}}
        } as needed{indication, select,
          undefined {}
          other { for {indication}}
        }{maxDose, select,
          undefined {}
          other {. Do not exceed {maxDose} in 24 hours}
        }.`;
        
        engine.registerTemplate('en-US', 'PRN_INSTRUCTION_TEMPLATE', prnTemplate);
      });

      it('should render simple PRN instruction', () => {
        const data: TemplateData = {
          verb: 'Take',
          doseValue: 1,
          doseUnit: 'tablet',
          route: 'by mouth',
          frequency: 'every 4 hours'
        };
        
        const result = engine.render('PRN_INSTRUCTION_TEMPLATE', data);
        expect(result).toBe('Take 1 tablet by mouth every 4 hours as needed.');
      });

      it('should render PRN with dose range and indication', () => {
        const data: TemplateData = {
          verb: 'Take',
          doseRange: '1-2 tablets',
          route: 'by mouth',
          frequency: 'every 4-6 hours',
          frequencyRange: 'every 4-6 hours',
          indication: 'pain',
          maxDose: '8 tablets'
        };
        
        const result = engine.render('PRN_INSTRUCTION_TEMPLATE', data);
        expect(result).toBe('Take 1-2 tablets by mouth every 4-6 hours as needed for pain. Do not exceed 8 tablets in 24 hours.');
      });
    });
  });

  describe('Performance and Caching', () => {
    beforeEach(() => {
      const simpleTemplate = '{verb} {doseValue} {doseUnit} {route} {frequency}.';
      engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', simpleTemplate);
    });

    it('should cache templates and show cache hits', () => {
      const data: TemplateData = {
        verb: 'Take',
        doseValue: 1,
        doseUnit: 'tablet',
        route: 'by mouth',
        frequency: 'daily'
      };
      
      // First render - cache miss
      engine.render('ORAL_TABLET_TEMPLATE', data);
      let metrics = engine.getPerformanceMetrics();
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheHits).toBe(0);
      
      // Second render - cache hit
      engine.render('ORAL_TABLET_TEMPLATE', data);
      metrics = engine.getPerformanceMetrics();
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheHits).toBe(1);
    });

    it('should render templates in under 1ms (performance requirement)', () => {
      const data: TemplateData = {
        verb: 'Take',
        doseValue: 1,
        doseUnit: 'tablet',
        route: 'by mouth',
        frequency: 'daily'
      };
      
      // Warm up cache
      engine.render('ORAL_TABLET_TEMPLATE', data);
      
      // Measure subsequent renders
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        engine.render('ORAL_TABLET_TEMPLATE', data);
      }
      const endTime = performance.now();
      
      const averageTime = (endTime - startTime) / 100;
      expect(averageTime).toBeLessThan(1); // <1ms requirement
    });

    it('should clear cache and reset metrics', () => {
      const data: TemplateData = {
        verb: 'Take',
        doseValue: 1,
        doseUnit: 'tablet',
        route: 'by mouth',
        frequency: 'daily'
      };
      
      engine.render('ORAL_TABLET_TEMPLATE', data);
      engine.render('ORAL_TABLET_TEMPLATE', data);
      
      let metrics = engine.getPerformanceMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      
      engine.clearCache();
      metrics = engine.getPerformanceMetrics();
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
    });
  });

  describe('Locale Management', () => {
    it('should change locale and clear relevant caches', () => {
      const englishTemplate = 'Take {doseValue} {doseUnit} by mouth {frequency}.';
      const spanishTemplate = 'Toma {doseValue} {doseUnit} por la boca {frequency}.';
      
      engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', englishTemplate);
      engine.registerTemplate('es-ES', 'ORAL_TABLET_TEMPLATE', spanishTemplate);
      
      const data: TemplateData = {
        verb: 'Take',
        doseValue: 1,
        doseUnit: 'tableta',
        route: 'by mouth',
        frequency: 'diariamente'
      };
      
      // Render in English
      let result = engine.render('ORAL_TABLET_TEMPLATE', data);
      expect(result).toBe('Take 1 tableta by mouth diariamente.');
      
      // Switch to Spanish
      engine.setLocale('es-ES');
      result = engine.render('ORAL_TABLET_TEMPLATE', data);
      expect(result).toBe('Toma 1 tableta por la boca diariamente.');
    });

    it('should maintain separate caches per locale', () => {
      const englishTemplate = 'Take {doseValue} tablet.';
      const spanishTemplate = 'Toma {doseValue} tableta.';
      
      engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', englishTemplate);
      engine.registerTemplate('es-ES', 'ORAL_TABLET_TEMPLATE', spanishTemplate);
      
      const data: TemplateData = {
        verb: 'Take',
        doseValue: 1,
        route: 'by mouth',
        frequency: 'daily'
      };
      
      // Render in English (cache miss)
      engine.render('ORAL_TABLET_TEMPLATE', data);
      
      // Switch to Spanish (different cache miss)
      engine.setLocale('es-ES');
      engine.render('ORAL_TABLET_TEMPLATE', data);
      
      // Back to English (should be cache hit)
      engine.setLocale('en-US');
      engine.render('ORAL_TABLET_TEMPLATE', data);
      
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.cacheMisses).toBe(2); // One for each locale
      expect(metrics.cacheHits).toBe(1);   // English cache hit
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed templates gracefully', () => {
      const malformedTemplate = '{verb} {doseValue unclosed bracket';
      engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', malformedTemplate);
      
      const data: TemplateData = {
        verb: 'Take',
        doseValue: 1,
        route: 'by mouth',
        frequency: 'daily'
      };
      
      const result = engine.render('ORAL_TABLET_TEMPLATE', data);
      expect(result).toBe('[Template Error: ORAL_TABLET_TEMPLATE]');
    });

    it('should handle missing template data gracefully', () => {
      const template = '{verb} {missingField} {route} {frequency}.';
      engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', template);
      
      const data: TemplateData = {
        verb: 'Take',
        route: 'by mouth',
        frequency: 'daily'
      };
      
      // Should render with placeholder for missing field
      const result = engine.render('ORAL_TABLET_TEMPLATE', data);
      expect(result).toContain('Take');
      expect(result).toContain('by mouth');
      expect(result).toContain('daily');
    });
  });
});