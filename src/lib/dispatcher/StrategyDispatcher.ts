/**
 * Specificity-Based Strategy Dispatcher
 * 
 * Core dispatcher that selects the most specific base strategy
 * and applies all relevant modifiers to generate medication
 * signature instructions.
 * 
 * @since 3.0.0
 */

import { MedicationRequestContext } from '../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../types/SignatureInstruction';
import { 
  IBaseStrategy, 
  IModifierStrategy, 
  compareSpecificity,
  sortModifiersByPriority
} from '../strategies/types';
import { StrategyRegistry } from '../registry/StrategyRegistry';
import { 
  AmbiguousStrategyError, 
  NoMatchingStrategyError 
} from './errors';

/**
 * Audit entry for strategy selection decisions
 */
export interface StrategySelectionAudit {
  timestamp: Date;
  context: MedicationRequestContext;
  candidateStrategies: Array<{
    name: string;
    specificity: number;
    matched: boolean;
  }>;
  selectedStrategy: string | null;
  appliedModifiers: string[];
  executionTimeMs: number;
}

/**
 * Main dispatcher for strategy selection and composition
 */
export class StrategyDispatcher {
  private registry: StrategyRegistry;
  private auditLog: StrategySelectionAudit[] = [];
  private readonly maxAuditLogSize = 1000;

  constructor(registry: StrategyRegistry) {
    this.registry = registry;
  }

  /**
   * Dispatches a medication request context to generate signature instructions
   * 
   * @param context - The medication request context
   * @returns Generated signature instruction
   * @throws {AmbiguousStrategyError} When multiple strategies at same specificity match
   * @throws {NoMatchingStrategyError} When no strategy matches the context
   */
  dispatch(context: MedicationRequestContext): SignatureInstruction {
    const startTime = performance.now();
    const audit: StrategySelectionAudit = {
      timestamp: new Date(),
      context,
      candidateStrategies: [],
      selectedStrategy: null,
      appliedModifiers: [],
      executionTimeMs: 0
    };

    try {
      // Find all matching base strategies
      const allStrategies = this.registry.getBaseStrategies();
      const matchingStrategies: IBaseStrategy[] = [];
      
      // Track all candidates for audit
      for (const [name, strategy] of allStrategies) {
        const matched = strategy.matches(context);
        audit.candidateStrategies.push({
          name,
          specificity: strategy.specificity,
          matched
        });
        
        if (matched) {
          matchingStrategies.push(strategy);
        }
      }

      // Sort by specificity (highest first)
      matchingStrategies.sort(compareSpecificity);

      // Check for ambiguous matches
      if (matchingStrategies.length >= 2) {
        const [first, second] = matchingStrategies;
        if (first.specificity === second.specificity) {
          throw AmbiguousStrategyError.create(
            matchingStrategies.map(s => ({
              name: s.constructor.name,
              specificity: s.specificity
            })),
            context
          );
        }
      }

      // Select highest specificity strategy
      const baseStrategy = matchingStrategies[0];
      if (!baseStrategy) {
        const availableStrategies = Array.from(allStrategies.keys());
        throw NoMatchingStrategyError.create(context, availableStrategies);
      }

      audit.selectedStrategy = baseStrategy.constructor.name;

      // Build base instruction
      let instruction = baseStrategy.buildInstruction(context);

      // Apply all matching modifiers in priority order
      const allModifiers = this.registry.getModifiers();
      const applicableModifiers: IModifierStrategy[] = [];

      for (const [name, modifier] of allModifiers) {
        if (modifier.appliesTo(context)) {
          applicableModifiers.push(modifier);
          audit.appliedModifiers.push(name);
        }
      }

      // Sort by priority and apply
      const sortedModifiers = sortModifiersByPriority(applicableModifiers);
      for (const modifier of sortedModifiers) {
        instruction = modifier.modify(instruction, context);
      }

      // Record execution time
      audit.executionTimeMs = performance.now() - startTime;
      this.recordAudit(audit);

      return instruction;

    } catch (error) {
      // Record failed dispatch in audit
      audit.executionTimeMs = performance.now() - startTime;
      this.recordAudit(audit);
      throw error;
    }
  }

  /**
   * Gets a composition preview without executing
   * Useful for debugging and testing
   */
  preview(context: MedicationRequestContext): {
    baseStrategy: string | null;
    modifiers: string[];
    wouldSucceed: boolean;
    error?: string;
  } {
    try {
      const allStrategies = this.registry.getBaseStrategies();
      const matchingStrategies: IBaseStrategy[] = [];
      
      for (const [, strategy] of allStrategies) {
        if (strategy.matches(context)) {
          matchingStrategies.push(strategy);
        }
      }

      matchingStrategies.sort(compareSpecificity);

      // Check for issues
      if (matchingStrategies.length === 0) {
        return {
          baseStrategy: null,
          modifiers: [],
          wouldSucceed: false,
          error: 'No matching strategy found'
        };
      }

      if (matchingStrategies.length >= 2) {
        const [first, second] = matchingStrategies;
        if (first.specificity === second.specificity) {
          return {
            baseStrategy: first.constructor.name,
            modifiers: [],
            wouldSucceed: false,
            error: 'Ambiguous strategy match'
          };
        }
      }

      const baseStrategy = matchingStrategies[0];
      const applicableModifiers: string[] = [];

      for (const [name, modifier] of this.registry.getModifiers()) {
        if (modifier.appliesTo(context)) {
          applicableModifiers.push(name);
        }
      }

      return {
        baseStrategy: baseStrategy.constructor.name,
        modifiers: applicableModifiers,
        wouldSucceed: true
      };

    } catch (error) {
      return {
        baseStrategy: null,
        modifiers: [],
        wouldSucceed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Explains the selection logic for a given context
   */
  explainSelection(context: MedicationRequestContext): string {
    const preview = this.preview(context);
    const lines: string[] = [
      '=== Strategy Selection Explanation ===',
      `Context: ${context.medication?.name || 'Unknown medication'}`,
      `Dose Form: ${context.medication?.doseForm || 'Unknown'}`,
      ''
    ];

    if (!preview.wouldSucceed) {
      lines.push(`❌ Selection would fail: ${preview.error}`);
      return lines.join('\n');
    }

    lines.push(`✅ Selected Base Strategy: ${preview.baseStrategy}`);
    
    if (preview.modifiers.length > 0) {
      lines.push('');
      lines.push('Applied Modifiers (in order):');
      preview.modifiers.forEach((mod, i) => {
        lines.push(`  ${i + 1}. ${mod}`);
      });
    } else {
      lines.push('No modifiers would be applied');
    }

    return lines.join('\n');
  }

  /**
   * Gets recent audit entries
   */
  getAuditLog(limit?: number): StrategySelectionAudit[] {
    const actualLimit = limit || this.auditLog.length;
    return this.auditLog.slice(-actualLimit);
  }

  /**
   * Clears the audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Records an audit entry, maintaining size limit
   */
  private recordAudit(audit: StrategySelectionAudit): void {
    this.auditLog.push(audit);
    
    // Trim old entries if exceeding limit
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
    }
  }

  /**
   * Gets performance statistics from audit log
   */
  getPerformanceStats(): {
    count: number;
    avgTimeMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  } {
    if (this.auditLog.length === 0) {
      return {
        count: 0,
        avgTimeMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0
      };
    }

    const times = this.auditLog.map(a => a.executionTimeMs).sort((a, b) => a - b);
    const sum = times.reduce((acc, t) => acc + t, 0);
    
    const percentile = (p: number) => {
      const index = Math.ceil(times.length * p) - 1;
      return times[Math.max(0, Math.min(index, times.length - 1))];
    };

    return {
      count: times.length,
      avgTimeMs: sum / times.length,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99)
    };
  }
}