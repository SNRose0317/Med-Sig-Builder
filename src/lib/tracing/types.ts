/**
 * Type definitions for the conversion tracing framework
 */

/**
 * Trace event types for unit conversions
 */
export type TraceEventType = 
  | 'conversion_start'
  | 'conversion_end'
  | 'conversion_step'
  | 'validation_start'
  | 'validation_end'
  | 'adapter_selection'
  | 'cache_hit'
  | 'cache_miss'
  | 'confidence_calculation'
  | 'error'
  | 'warning'
  | 'performance_metric';

/**
 * Trace event structure
 */
export interface TraceEvent {
  type: TraceEventType;
  description: string;
  data?: Record<string, unknown>;
  error?: Error;
}

/**
 * Recorded trace entry with timing
 */
export interface TraceEntry extends TraceEvent {
  timestamp: number;
  duration?: number;
  metadata?: {
    memory?: number;
    [key: string]: unknown;
  };
}

/**
 * Tracer configuration options
 */
export interface TracerOptions {
  /** Enable/disable tracing */
  enabled?: boolean;
  /** Include memory usage metrics */
  includeMemoryMetrics?: boolean;
  /** Maximum number of trace entries to keep */
  maxTraceEntries?: number;
  /** Enable dry-run mode (no side effects) */
  dryRun?: boolean;
}

/**
 * Output format types
 */
export type TraceOutputFormat = 'json' | 'dot' | 'text';

/**
 * Performance metrics for operations
 */
export interface PerformanceMetrics {
  operation: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  memory?: {
    average: number;
    max: number;
  };
}

/**
 * Aggregated performance summary
 */
export interface PerformanceSummary {
  totalDuration: number;
  operationCount: number;
  metrics: PerformanceMetrics[];
  bottlenecks: string[];
}

/**
 * Conversion trace context
 */
export interface ConversionTraceContext {
  value: number;
  fromUnit: string;
  toUnit: string;
  adapterUsed?: string;
  cacheHit?: boolean;
  confidence?: number;
  steps?: number;
}