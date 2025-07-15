/**
 * Confidence Score Service
 * 
 * Calculates confidence scores for unit conversions to help healthcare
 * providers understand the reliability of conversion results.
 */
import { ConversionStep } from '../units/types';
import {
  ConfidenceScore,
  ConfidenceLevel,
  ConfidenceFactors,
  ConfidenceAdjustment,
  ConversionTrace
} from './types';

/**
 * Service for calculating conversion confidence scores
 */
export class ConfidenceScoreService {
  /**
   * Calculate confidence score for a conversion
   */
  calculate(trace: ConversionTrace): ConfidenceScore {
    // Get base score based on complexity
    const baseScore = this.getBaseScore(trace);
    
    // Calculate all adjustments
    const adjustments = this.getAdjustments(trace);
    
    // Apply adjustments to base score
    const adjustedScore = adjustments.reduce(
      (score, adj) => score + adj.value,
      baseScore
    );
    
    // Clamp to 0-1 range
    const finalScore = Math.max(0, Math.min(1, adjustedScore));
    
    // Calculate individual factors
    const factors = this.calculateFactors(trace, adjustments);
    
    // Get human-readable rationale
    const rationale = this.generateRationale(trace, adjustments);
    
    // Determine level
    const level = this.getLevel(finalScore);
    
    return {
      score: finalScore,
      level,
      rationale,
      factors,
      adjustments,
      explain: () => this.generateExplanation(trace, finalScore, adjustments)
    };
  }
  
  /**
   * Get base score based on conversion complexity
   */
  private getBaseScore(trace: ConversionTrace): number {
    const stepCount = trace.steps.length;
    
    if (stepCount === 0) return 1.0;      // No conversion needed
    if (stepCount === 1) return 0.95;     // Direct conversion
    if (stepCount === 2) return 0.85;     // Single intermediate
    if (stepCount === 3) return 0.70;     // Two intermediates
    return 0.50;                           // Complex chain
  }
  
  /**
   * Calculate all adjustments based on conversion characteristics
   */
  private getAdjustments(trace: ConversionTrace): ConfidenceAdjustment[] {
    const adjustments: ConfidenceAdjustment[] = [];
    
    // Positive adjustments
    if (trace.hasLotSpecificData) {
      adjustments.push({
        value: 0.10,
        reason: 'Lot-specific conversion data available',
        category: 'data'
      });
    }
    
    if (trace.usedRationalArithmetic) {
      adjustments.push({
        value: 0.05,
        reason: 'Using rational number arithmetic',
        category: 'precision'
      });
    }
    
    // Check for direct UCUM units
    const hasOnlyStandardUnits = trace.steps.every(
      step => step.type === 'standard'
    );
    if (hasOnlyStandardUnits && trace.steps.length > 0) {
      adjustments.push({
        value: 0.05,
        reason: 'Direct UCUM standard units',
        category: 'reliability'
      });
    }
    
    // Negative adjustments
    if (trace.usedDefaults) {
      adjustments.push({
        value: -0.10,
        reason: 'Using default conversion factors',
        category: 'data'
      });
    }
    
    if (trace.hasApproximations) {
      adjustments.push({
        value: -0.15,
        reason: 'Approximations required',
        category: 'precision'
      });
    }
    
    if (trace.missingRequiredContext) {
      adjustments.push({
        value: -0.20,
        reason: 'Missing required context data',
        category: 'data'
      });
    }
    
    // Step-type specific adjustments
    trace.steps.forEach(step => {
      switch (step.type) {
        case 'device':
          // Device conversions have inherent uncertainty
          adjustments.push({
            value: -0.05,
            reason: `Device conversion: ${step.description}`,
            category: 'reliability'
          });
          break;
        case 'concentration':
          // Concentration conversions depend on accuracy of strength data
          adjustments.push({
            value: -0.03,
            reason: `Concentration-based conversion: ${step.description}`,
            category: 'data'
          });
          break;
        case 'custom':
          // Custom conversions have unknown reliability
          adjustments.push({
            value: -0.10,
            reason: `Custom conversion rule: ${step.description}`,
            category: 'reliability'
          });
          break;
      }
    });
    
    // Floating-point precision concerns for very small or large values
    if (this.hasPrecisionConcerns(trace)) {
      adjustments.push({
        value: -0.05,
        reason: 'Floating-point precision loss possible',
        category: 'precision'
      });
    }
    
    return adjustments;
  }
  
  /**
   * Calculate individual scoring factors
   */
  private calculateFactors(
    trace: ConversionTrace,
    adjustments: ConfidenceAdjustment[]
  ): ConfidenceFactors {
    // Group adjustments by category
    const byCategory = adjustments.reduce((acc, adj) => {
      if (!acc[adj.category]) acc[adj.category] = [];
      acc[adj.category].push(adj);
      return acc;
    }, {} as Record<string, ConfidenceAdjustment[]>);
    
    // Calculate complexity factor (based on step count)
    const complexityBase = this.getBaseScore(trace);
    const complexityAdjustments = (byCategory.complexity || [])
      .reduce((sum, adj) => sum + adj.value, 0);
    const complexity = Math.max(0, Math.min(1, complexityBase + complexityAdjustments));
    
    // Calculate data completeness factor
    const dataAdjustments = (byCategory.data || [])
      .reduce((sum, adj) => sum + adj.value, 0);
    const dataCompleteness = Math.max(0, Math.min(1, 1.0 + dataAdjustments));
    
    // Calculate precision factor
    const precisionAdjustments = (byCategory.precision || [])
      .reduce((sum, adj) => sum + adj.value, 0);
    const precision = Math.max(0, Math.min(1, 1.0 + precisionAdjustments));
    
    return { complexity, dataCompleteness, precision };
  }
  
  /**
   * Generate human-readable rationale
   */
  private generateRationale(
    trace: ConversionTrace,
    adjustments: ConfidenceAdjustment[]
  ): string[] {
    const rationale: string[] = [];
    
    // Add step count description
    const stepCount = trace.steps.length;
    if (stepCount === 0) {
      rationale.push('No conversion needed - units are identical');
    } else if (stepCount === 1) {
      rationale.push('Direct conversion between units');
    } else {
      rationale.push(`Multi-step conversion requiring ${stepCount} steps`);
    }
    
    // Add significant adjustments
    const significantAdjustments = adjustments
      .filter(adj => Math.abs(adj.value) >= 0.05)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    significantAdjustments.forEach(adj => {
      rationale.push(adj.reason);
    });
    
    return rationale;
  }
  
  /**
   * Determine confidence level from score
   */
  private getLevel(score: number): ConfidenceLevel {
    if (score >= 0.9) return 'high';
    if (score >= 0.7) return 'medium';
    if (score >= 0.5) return 'low';
    return 'very-low';
  }
  
  /**
   * Check if conversion has precision concerns
   */
  private hasPrecisionConcerns(trace: ConversionTrace): boolean {
    const { value } = trace.request;
    
    // Very small values (risk of underflow)
    if (Math.abs(value) < 1e-6 && Math.abs(value) > 0) {
      return true;
    }
    
    // Very large values (risk of overflow)
    if (Math.abs(value) > 1e15) {
      return true;
    }
    
    // Check if any step involves very small or large factors
    return trace.steps.some(step => {
      if (!step.factor) return false;
      return Math.abs(step.factor) < 1e-6 || Math.abs(step.factor) > 1e6;
    });
  }
  
  /**
   * Generate detailed explanation of the confidence score
   */
  private generateExplanation(
    trace: ConversionTrace,
    finalScore: number,
    adjustments: ConfidenceAdjustment[]
  ): string {
    const level = this.getLevel(finalScore);
    const percentage = Math.round(finalScore * 100);
    
    let explanation = `Confidence Score: ${percentage}% (${level})\n\n`;
    
    explanation += `Conversion: ${trace.request.value} ${trace.request.fromUnit} → ${trace.request.toUnit}\n`;
    explanation += `Steps required: ${trace.steps.length}\n\n`;
    
    if (trace.steps.length > 0) {
      explanation += 'Conversion path:\n';
      trace.steps.forEach((step, index) => {
        explanation += `${index + 1}. ${step.description}\n`;
      });
      explanation += '\n';
    }
    
    explanation += 'Score calculation:\n';
    explanation += `Base score: ${this.getBaseScore(trace).toFixed(2)}\n`;
    
    if (adjustments.length > 0) {
      explanation += '\nAdjustments:\n';
      adjustments.forEach(adj => {
        const sign = adj.value >= 0 ? '+' : '';
        explanation += `${sign}${adj.value.toFixed(2)}: ${adj.reason}\n`;
      });
    }
    
    explanation += `\nFinal score: ${finalScore.toFixed(2)} (${percentage}%)\n`;
    
    // Add interpretation
    explanation += '\nInterpretation:\n';
    switch (level) {
      case 'high':
        explanation += 'This conversion is highly reliable and can be trusted for clinical use.';
        break;
      case 'medium':
        explanation += 'This conversion is reasonably reliable but should be verified for critical dosing.';
        break;
      case 'low':
        explanation += 'This conversion has significant uncertainty. Manual verification is recommended.';
        break;
      case 'very-low':
        explanation += 'This conversion is unreliable due to missing data or complex transformations. Do not use without verification.';
        break;
    }
    
    return explanation;
  }
  
  /**
   * Create a ConversionTrace from ConversionSteps
   * This is a helper method to bridge the current implementation
   */
  createTraceFromSteps(
    steps: ConversionStep[],
    request: { value: number; fromUnit: string; toUnit: string },
    context?: {
      usedDefaults?: boolean;
      hasLotSpecificData?: boolean;
      missingRequiredContext?: boolean;
    }
  ): ConversionTrace {
    return {
      steps,
      request,
      usedDefaults: context?.usedDefaults || false,
      hasLotSpecificData: context?.hasLotSpecificData || false,
      missingRequiredContext: context?.missingRequiredContext || false,
      hasApproximations: false, // Could be detected from steps
      usedRationalArithmetic: false // Current implementation uses floating-point
    };
  }
}