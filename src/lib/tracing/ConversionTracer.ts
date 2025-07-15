/**
 * Conversion Tracer
 * 
 * Provides detailed tracing and performance monitoring for unit conversions.
 * Supports multiple output formats for debugging and analysis.
 */
import {
  TracerOptions,
  TraceEvent,
  TraceEntry,
  TraceOutputFormat,
  PerformanceMetrics,
  PerformanceSummary
} from './types';

/**
 * Default tracer options
 */
const DEFAULT_OPTIONS: Required<TracerOptions> = {
  enabled: false,
  includeMemoryMetrics: false,
  maxTraceEntries: 1000,
  dryRun: false
};

/**
 * Conversion tracer implementation
 */
export class ConversionTracer {
  private options: Required<TracerOptions>;
  private traces: TraceEntry[] = [];
  private startTime: number = 0;
  private operationTimings: Map<string, number[]> = new Map();
  private currentOperationStart: Map<string, number> = new Map();
  
  constructor(options?: TracerOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startTime = performance.now();
  }
  
  /**
   * Check if tracing is enabled
   */
  get isEnabled(): boolean {
    return this.options.enabled;
  }
  
  /**
   * Check if in dry-run mode
   */
  get isDryRun(): boolean {
    return this.options.dryRun;
  }
  
  /**
   * Record a trace event
   */
  trace(event: TraceEvent): void {
    if (!this.options.enabled) return;
    
    const entry: TraceEntry = {
      ...event,
      timestamp: performance.now() - this.startTime
    };
    
    // Add memory metrics if enabled
    if (this.options.includeMemoryMetrics && typeof process !== 'undefined') {
      entry.metadata = {
        ...entry.metadata,
        memory: process.memoryUsage?.().heapUsed
      };
    }
    
    // Handle operation timing
    if (event.type === 'conversion_start' || event.type === 'validation_start') {
      this.startOperation(event.description);
    } else if (event.type === 'conversion_end' || event.type === 'validation_end') {
      entry.duration = this.endOperation(event.description);
    }
    
    // Add to traces
    this.traces.push(entry);
    
    // Trim if exceeding max entries
    if (this.traces.length > this.options.maxTraceEntries) {
      this.traces = this.traces.slice(-this.options.maxTraceEntries);
    }
  }
  
  /**
   * Start timing an operation
   */
  private startOperation(name: string): void {
    this.currentOperationStart.set(name, performance.now());
  }
  
  /**
   * End timing an operation and record duration
   */
  private endOperation(name: string): number | undefined {
    const startTime = this.currentOperationStart.get(name);
    if (startTime === undefined) return undefined;
    
    const duration = performance.now() - startTime;
    this.currentOperationStart.delete(name);
    
    // Record timing for metrics
    if (!this.operationTimings.has(name)) {
      this.operationTimings.set(name, []);
    }
    this.operationTimings.get(name)!.push(duration);
    
    return duration;
  }
  
  /**
   * Export traces in specified format
   */
  export(format: TraceOutputFormat = 'json'): string {
    switch (format) {
      case 'json':
        return this.toJSON();
      case 'dot':
        return this.toDOT();
      case 'text':
        return this.toText();
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }
  
  /**
   * Export as JSON
   */
  private toJSON(): string {
    return JSON.stringify({
      traces: this.traces,
      summary: this.getPerformanceSummary(),
      options: this.options
    }, null, 2);
  }
  
  /**
   * Export as DOT graph for visualization
   */
  private toDOT(): string {
    const nodes: string[] = [];
    const edges: string[] = [];
    
    // Create nodes for each trace entry
    this.traces.forEach((trace, index) => {
      const label = this.createDOTLabel(trace);
      const color = this.getDOTColor(trace.type);
      nodes.push(`  n${index} [label="${label}", fillcolor="${color}", style="filled"];`);
    });
    
    // Create edges between consecutive events
    for (let i = 1; i < this.traces.length; i++) {
      const duration = this.traces[i].timestamp - this.traces[i - 1].timestamp;
      edges.push(`  n${i - 1} -> n${i} [label="${duration.toFixed(2)}ms"];`);
    }
    
    return `digraph ConversionTrace {
  rankdir=TB;
  node [shape=box, fontname="Arial", fontsize=10];
  edge [fontname="Arial", fontsize=9];
  
  label="Unit Conversion Trace";
  labelloc="t";
  
${nodes.join('\n')}

${edges.join('\n')}
}`;
  }
  
  /**
   * Create label for DOT node
   */
  private createDOTLabel(trace: TraceEntry): string {
    let label = trace.description;
    
    if (trace.data) {
      const key = Object.keys(trace.data)[0];
      if (key && trace.data[key] !== undefined) {
        label += `\\n${key}: ${trace.data[key]}`;
      }
    }
    
    if (trace.duration !== undefined) {
      label += `\\n(${trace.duration.toFixed(2)}ms)`;
    }
    
    return label.replace(/"/g, '\\"');
  }
  
  /**
   * Get color for DOT node based on event type
   */
  private getDOTColor(type: string): string {
    const colors: Record<string, string> = {
      conversion_start: '#90EE90',      // Light green
      conversion_end: '#98FB98',        // Pale green
      conversion_step: '#87CEEB',       // Sky blue
      validation_start: '#FFE4B5',      // Moccasin
      validation_end: '#FFDEAD',        // Navajo white
      adapter_selection: '#DDA0DD',     // Plum
      cache_hit: '#90EE90',            // Light green
      cache_miss: '#F0E68C',           // Khaki
      confidence_calculation: '#B0E0E6', // Powder blue
      error: '#FFA07A',                // Light salmon
      warning: '#FFFFE0',              // Light yellow
      performance_metric: '#E6E6FA'     // Lavender
    };
    
    return colors[type] || '#FFFFFF';
  }
  
  /**
   * Export as human-readable text
   */
  private toText(): string {
    const lines: string[] = [];
    
    lines.push('=== Conversion Trace ===');
    lines.push(`Total Duration: ${(performance.now() - this.startTime).toFixed(2)}ms`);
    lines.push(`Events: ${this.traces.length}`);
    lines.push('');
    
    // Group traces by operation
    let currentOperation: string | null = null;
    
    this.traces.forEach((trace, index) => {
      const indent = trace.type.includes('step') ? '  ' : '';
      const timestamp = `[${trace.timestamp.toFixed(2)}ms]`;
      
      // Add section headers
      if (trace.type === 'conversion_start') {
        if (currentOperation) lines.push('');
        currentOperation = trace.description;
        lines.push(`--- ${trace.description} ---`);
      }
      
      // Format the trace line
      let line = `${timestamp} ${indent}${trace.description}`;
      
      if (trace.duration !== undefined) {
        line += ` (${trace.duration.toFixed(2)}ms)`;
      }
      
      if (trace.data) {
        const dataStr = Object.entries(trace.data)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(', ');
        if (dataStr) {
          line += ` [${dataStr}]`;
        }
      }
      
      if (trace.error) {
        line += ` ERROR: ${trace.error.message}`;
      }
      
      lines.push(line);
    });
    
    // Add performance summary
    lines.push('');
    lines.push('=== Performance Summary ===');
    const summary = this.getPerformanceSummary();
    
    summary.metrics.forEach(metric => {
      lines.push(`${metric.operation}:`);
      lines.push(`  Count: ${metric.count}`);
      lines.push(`  Average: ${metric.averageDuration.toFixed(2)}ms`);
      lines.push(`  Min: ${metric.minDuration.toFixed(2)}ms`);
      lines.push(`  Max: ${metric.maxDuration.toFixed(2)}ms`);
    });
    
    if (summary.bottlenecks.length > 0) {
      lines.push('');
      lines.push('Bottlenecks:');
      summary.bottlenecks.forEach(b => lines.push(`  - ${b}`));
    }
    
    return lines.join('\n');
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    const metrics: PerformanceMetrics[] = [];
    
    this.operationTimings.forEach((timings, operation) => {
      if (timings.length === 0) return;
      
      const total = timings.reduce((sum, t) => sum + t, 0);
      const average = total / timings.length;
      const min = Math.min(...timings);
      const max = Math.max(...timings);
      
      metrics.push({
        operation,
        count: timings.length,
        totalDuration: total,
        averageDuration: average,
        minDuration: min,
        maxDuration: max
      });
    });
    
    return metrics;
  }
  
  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const metrics = this.getPerformanceMetrics();
    const totalDuration = performance.now() - this.startTime;
    const operationCount = this.traces.length;
    
    // Identify bottlenecks (operations taking >50% of average time)
    const avgDuration = totalDuration / operationCount;
    const bottlenecks = metrics
      .filter(m => m.averageDuration > avgDuration * 0.5)
      .map(m => `${m.operation} (avg ${m.averageDuration.toFixed(2)}ms)`);
    
    return {
      totalDuration,
      operationCount,
      metrics,
      bottlenecks
    };
  }
  
  /**
   * Clear all traces
   */
  clear(): void {
    this.traces = [];
    this.operationTimings.clear();
    this.currentOperationStart.clear();
    this.startTime = performance.now();
  }
  
  /**
   * Enable/disable tracing
   */
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
  }
  
  /**
   * Get a specific metric
   */
  getMetric(operation: string): PerformanceMetrics | undefined {
    return this.getPerformanceMetrics().find(m => m.operation === operation);
  }
}