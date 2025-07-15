/**
 * Tests for ConversionTracer
 */
import { ConversionTracer } from '../ConversionTracer';
import { TraceEvent } from '../types';

describe('ConversionTracer', () => {
  let tracer: ConversionTracer;
  
  beforeEach(() => {
    tracer = new ConversionTracer({ enabled: true });
  });
  
  describe('basic tracing', () => {
    it('should record trace events when enabled', () => {
      const event: TraceEvent = {
        type: 'conversion_start',
        description: 'Test conversion',
        data: { value: 100, unit: 'mg' }
      };
      
      tracer.trace(event);
      
      const json = JSON.parse(tracer.export('json'));
      expect(json.traces).toHaveLength(1);
      expect(json.traces[0]).toMatchObject({
        type: 'conversion_start',
        description: 'Test conversion',
        data: { value: 100, unit: 'mg' }
      });
      expect(json.traces[0].timestamp).toBeGreaterThanOrEqual(0);
    });
    
    it('should not record events when disabled', () => {
      tracer = new ConversionTracer({ enabled: false });
      
      tracer.trace({
        type: 'conversion_start',
        description: 'Test conversion'
      });
      
      const json = JSON.parse(tracer.export('json'));
      expect(json.traces).toHaveLength(0);
    });
    
    it('should respect max trace entries limit', () => {
      tracer = new ConversionTracer({ enabled: true, maxTraceEntries: 3 });
      
      for (let i = 0; i < 5; i++) {
        tracer.trace({
          type: 'conversion_step',
          description: `Step ${i}`
        });
      }
      
      const json = JSON.parse(tracer.export('json'));
      expect(json.traces).toHaveLength(3);
      expect(json.traces[0].description).toBe('Step 2');
      expect(json.traces[2].description).toBe('Step 4');
    });
  });
  
  describe('operation timing', () => {
    it('should track operation duration', async () => {
      tracer.trace({
        type: 'conversion_start',
        description: 'Test operation'
      });
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50));
      
      tracer.trace({
        type: 'conversion_end',
        description: 'Test operation'
      });
      
      const json = JSON.parse(tracer.export('json'));
      const endEvent = json.traces.find((t: any) => t.type === 'conversion_end');
      expect(endEvent.duration).toBeGreaterThan(40);
      expect(endEvent.duration).toBeLessThan(100);
    });
    
    it('should calculate performance metrics', () => {
      // Simulate multiple operations
      for (let i = 0; i < 3; i++) {
        tracer.trace({
          type: 'conversion_start',
          description: 'Convert units'
        });
        
        tracer.trace({
          type: 'conversion_end',
          description: 'Convert units'
        });
      }
      
      const metrics = tracer.getPerformanceMetrics();
      const convertMetric = metrics.find(m => m.operation === 'Convert units');
      
      expect(convertMetric).toBeDefined();
      expect(convertMetric!.count).toBe(3);
      expect(convertMetric!.averageDuration).toBeGreaterThanOrEqual(0);
      expect(convertMetric!.minDuration).toBeLessThanOrEqual(convertMetric!.maxDuration);
    });
  });
  
  describe('export formats', () => {
    beforeEach(() => {
      tracer.trace({
        type: 'conversion_start',
        description: 'Convert 100 mg to g'
      });
      
      tracer.trace({
        type: 'conversion_step',
        description: 'Apply factor 0.001',
        data: { factor: 0.001 }
      });
      
      tracer.trace({
        type: 'conversion_end',
        description: 'Result: 0.1 g'
      });
    });
    
    it('should export as JSON', () => {
      const json = JSON.parse(tracer.export('json'));
      
      expect(json).toHaveProperty('traces');
      expect(json).toHaveProperty('summary');
      expect(json).toHaveProperty('options');
      expect(json.traces).toHaveLength(3);
    });
    
    it('should export as DOT graph', () => {
      const dot = tracer.export('dot');
      
      expect(dot).toContain('digraph ConversionTrace');
      expect(dot).toContain('n0 [label="Convert 100 mg to g"');
      expect(dot).toContain('n1 [label="Apply factor 0.001');
      expect(dot).toContain('n2 [label="Result: 0.1 g"');
      expect(dot).toContain('n0 -> n1');
      expect(dot).toContain('n1 -> n2');
    });
    
    it('should export as human-readable text', () => {
      const text = tracer.export('text');
      
      expect(text).toContain('=== Conversion Trace ===');
      expect(text).toContain('Convert 100 mg to g');
      expect(text).toContain('Apply factor 0.001');
      expect(text).toContain('Result: 0.1 g');
      expect(text).toContain('[factor=0.001]');
      expect(text).toContain('=== Performance Summary ===');
    });
    
    it('should use appropriate colors in DOT output', () => {
      tracer.trace({
        type: 'error',
        description: 'Conversion failed',
        error: new Error('Invalid unit')
      });
      
      const dot = tracer.export('dot');
      
      expect(dot).toContain('fillcolor="#90EE90"'); // conversion_start
      expect(dot).toContain('fillcolor="#87CEEB"'); // conversion_step
      expect(dot).toContain('fillcolor="#98FB98"'); // conversion_end
      expect(dot).toContain('fillcolor="#FFA07A"'); // error
    });
  });
  
  describe('error handling', () => {
    it('should trace errors with details', () => {
      const error = new Error('Unit not found');
      
      tracer.trace({
        type: 'error',
        description: 'Conversion failed',
        error,
        data: { unit: 'xyz' }
      });
      
      const json = JSON.parse(tracer.export('json'));
      const errorTrace = json.traces[0];
      
      expect(errorTrace.type).toBe('error');
      expect(errorTrace.error).toBeDefined();
      expect(errorTrace.data.unit).toBe('xyz');
    });
  });
  
  describe('performance summary', () => {
    it('should identify bottlenecks', () => {
      // Perform actual timed operations
      tracer.trace({ type: 'conversion_start', description: 'Fast op' });
      tracer.trace({ type: 'conversion_end', description: 'Fast op' });
      
      tracer.trace({ type: 'conversion_start', description: 'Another fast op' });
      tracer.trace({ type: 'conversion_end', description: 'Another fast op' });
      
      // For the slow operation, manipulate internal state to simulate slowness
      const startTime = performance.now();
      tracer.trace({ type: 'conversion_start', description: 'Slow op' });
      
      // Manually add a large duration to operationTimings
      const timings = (tracer as any).operationTimings;
      const currentTimings = timings.get('Slow op') || [];
      timings.set('Slow op', [...currentTimings, 1000]); // 1 second - definitely a bottleneck
      
      tracer.trace({ type: 'conversion_end', description: 'Slow op' });
      
      const summary = tracer.getPerformanceSummary();
      
      // At least one operation should be identified as a bottleneck
      expect(summary.bottlenecks.length).toBeGreaterThan(0);
      
      // The slow operation should be in the bottlenecks
      const slowOpBottleneck = summary.bottlenecks.find(b => b.includes('Slow op'));
      expect(slowOpBottleneck).toBeDefined();
    });
  });
  
  describe('dry-run mode', () => {
    it('should indicate dry-run mode', () => {
      tracer = new ConversionTracer({ enabled: true, dryRun: true });
      
      expect(tracer.isDryRun).toBe(true);
      expect(tracer.isEnabled).toBe(true);
    });
  });
  
  describe('tracer control', () => {
    it('should allow enabling/disabling after creation', () => {
      tracer = new ConversionTracer({ enabled: false });
      expect(tracer.isEnabled).toBe(false);
      
      tracer.setEnabled(true);
      expect(tracer.isEnabled).toBe(true);
      
      tracer.trace({
        type: 'conversion_start',
        description: 'Should be recorded'
      });
      
      const json = JSON.parse(tracer.export('json'));
      expect(json.traces).toHaveLength(1);
    });
    
    it('should clear all traces', () => {
      tracer.trace({
        type: 'conversion_start',
        description: 'Test'
      });
      
      expect(JSON.parse(tracer.export('json')).traces).toHaveLength(1);
      
      tracer.clear();
      
      expect(JSON.parse(tracer.export('json')).traces).toHaveLength(0);
    });
  });
});