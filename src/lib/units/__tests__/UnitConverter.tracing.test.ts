/**
 * Tests for UnitConverter tracing integration
 */
import { UnitConverter } from '../UnitConverter';
import { ConversionContext } from '../types';

describe('UnitConverter - Tracing Integration', () => {
  let converter: UnitConverter;
  
  beforeEach(() => {
    converter = new UnitConverter(
      undefined,
      undefined,
      undefined,
      { enabled: true }
    );
  });
  
  describe('basic tracing', () => {
    it('should trace simple conversions', () => {
      converter.convert(1000, 'mg', 'g');
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'conversion_start',
          description: 'Convert 1000 mg to g'
        })
      );
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'validation_start',
          description: 'Validating input units'
        })
      );
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'conversion_end',
          description: 'Conversion complete',
          data: expect.objectContaining({ result: 1 })
        })
      );
    });
    
    it('should trace identity conversions', () => {
      converter.convert(100, 'mg', 'mg');
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'adapter_selection',
          description: 'Identity conversion detected'
        })
      );
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'conversion_end',
          description: 'Identity conversion complete'
        })
      );
    });
    
    it('should trace device unit conversions', () => {
      converter.convert(4, '{click}', 'mL');
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'adapter_selection',
          description: 'Using device adapter for conversion',
          data: expect.objectContaining({ isDeviceUnit: true })
        })
      );
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'conversion_step',
          description: expect.stringContaining('click')
        })
      );
    });
    
    it('should trace concentration conversions', () => {
      const context: ConversionContext = {
        strengthRatio: {
          numerator: { value: 100, unit: 'mg' },
          denominator: { value: 2, unit: 'mL' }
        }
      };
      
      converter.convert(4, 'mL', 'mg', context);
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'adapter_selection',
          description: 'Concentration conversion required'
        })
      );
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'conversion_step',
          description: 'Starting concentration-based conversion'
        })
      );
    });
  });
  
  describe('error tracing', () => {
    it('should trace validation errors', () => {
      expect(() => converter.convert(100, 'invalid', 'mg')).toThrow();
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      expect(json.traces).toContainEqual(
        expect.objectContaining({
          type: 'error',
          description: 'Conversion failed'
        })
      );
    });
    
    it('should trace missing context errors', () => {
      expect(() => converter.convert(1, '{tablet}', 'mg')).toThrow();
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      const errorTrace = json.traces.find((t: any) => t.type === 'error');
      expect(errorTrace).toBeDefined();
      expect(errorTrace.data.errorType).toBe('MissingContextError');
    });
  });
  
  describe('confidence tracing', () => {
    it('should trace confidence calculations', () => {
      const context: ConversionContext = {
        medication: {
          id: 'test',
          name: 'Test Med',
          type: 'Medication',
          doseForm: 'tablet',
          ingredient: [{
            strengthQuantity: { value: 100, unit: 'mg' }
          }]
        }
      };
      
      converter.convert(2, '{tablet}', 'mg', context);
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      const confidenceTraces = json.traces.filter(
        (t: any) => t.type === 'confidence_calculation'
      );
      
      expect(confidenceTraces).toHaveLength(2); // start and end
      expect(confidenceTraces[1].data).toHaveProperty('score');
      expect(confidenceTraces[1].data).toHaveProperty('level');
    });
  });
  
  describe('performance metrics', () => {
    it('should track conversion performance', () => {
      // Perform multiple conversions
      converter.convert(1000, 'mg', 'g');
      converter.convert(1, 'g', 'mg');
      converter.convert(100, 'mg', 'mg');
      
      const tracer = converter.getTracer();
      const metrics = tracer.getPerformanceMetrics();
      
      // Check what operations are actually tracked
      expect(metrics.length).toBeGreaterThan(0);
      
      // Look for any conversion-related metric
      const conversionMetrics = metrics.filter(
        m => m.operation.toLowerCase().includes('convert') || 
             m.operation.toLowerCase().includes('validat')
      );
      
      expect(conversionMetrics.length).toBeGreaterThan(0);
      
      // Check that we have metrics for validation (which we know is tracked)
      const validationMetric = metrics.find(
        m => m.operation === 'Validating input units'
      );
      
      expect(validationMetric).toBeDefined();
      expect(validationMetric!.count).toBe(3); // 3 conversions = 3 validations
      expect(validationMetric!.averageDuration).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('export formats', () => {
    beforeEach(() => {
      converter.convert(1000, 'mcg', 'mg');
    });
    
    it('should export as text', () => {
      const text = converter.exportTrace('text');
      
      expect(text).toContain('=== Conversion Trace ===');
      expect(text).toContain('Convert 1000 mcg to mg');
      expect(text).toContain('=== Performance Summary ===');
    });
    
    it('should export as DOT graph', () => {
      const dot = converter.exportTrace('dot');
      
      expect(dot).toContain('digraph ConversionTrace');
      expect(dot).toContain('rankdir=TB');
      expect(dot).toMatch(/n\d+ -> n\d+/);
    });
    
    it('should export as JSON', () => {
      const json = converter.exportTrace('json');
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveProperty('traces');
      expect(parsed).toHaveProperty('summary');
      expect(parsed.traces.length).toBeGreaterThan(0);
    });
  });
  
  describe('tracer control', () => {
    it('should disable tracing on demand', () => {
      converter.setTracingEnabled(false);
      converter.convert(100, 'mg', 'g');
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      
      // Should have traces from before disabling
      const beforeDisable = json.traces.length;
      
      converter.convert(200, 'mg', 'g');
      
      const trace2 = converter.exportTrace('json');
      const json2 = JSON.parse(trace2);
      
      // Should have same number of traces
      expect(json2.traces.length).toBe(beforeDisable);
    });
    
    it('should access tracer directly', () => {
      const tracer = converter.getTracer();
      
      expect(tracer).toBeDefined();
      expect(tracer.isEnabled).toBe(true);
      
      tracer.clear();
      
      const trace = converter.exportTrace('json');
      const json = JSON.parse(trace);
      expect(json.traces).toHaveLength(0);
    });
  });
  
  describe('dry-run mode', () => {
    it('should support dry-run mode', () => {
      converter = new UnitConverter(
        undefined,
        undefined,
        undefined,
        { enabled: true, dryRun: true }
      );
      
      const tracer = converter.getTracer();
      expect(tracer.isDryRun).toBe(true);
      
      // Conversions should still work in dry-run mode
      const result = converter.convert(1000, 'mg', 'g');
      expect(result.value).toBe(1);
    });
  });
});