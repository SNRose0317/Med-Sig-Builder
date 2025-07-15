/**
 * Type definitions for the Confidence Score Service
 */
import { ConversionStep } from '../units/types';

/**
 * Confidence level categories
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'very-low';

/**
 * Detailed factors that contribute to the confidence score
 */
export interface ConfidenceFactors {
  /** Score based on conversion complexity (0-1) */
  complexity: number;
  /** Score based on data completeness (0-1) */
  dataCompleteness: number;
  /** Score based on precision/accuracy (0-1) */
  precision: number;
}

/**
 * Adjustment applied to the confidence score
 */
export interface ConfidenceAdjustment {
  /** The adjustment value (positive or negative) */
  value: number;
  /** Human-readable reason for the adjustment */
  reason: string;
  /** Category of adjustment for grouping */
  category: 'complexity' | 'data' | 'precision' | 'reliability';
}

/**
 * Complete confidence score with explanation
 */
export interface ConfidenceScore {
  /** The final confidence score (0-1) */
  score: number;
  /** Categorized confidence level */
  level: ConfidenceLevel;
  /** Human-readable reasons for the score */
  rationale: string[];
  /** Detailed breakdown of scoring factors */
  factors: ConfidenceFactors;
  /** All adjustments applied */
  adjustments: ConfidenceAdjustment[];
  /** Generate a detailed explanation */
  explain(): string;
}

/**
 * Conversion trace with additional metadata for confidence scoring
 */
export interface ConversionTrace {
  /** The conversion steps performed */
  steps: ConversionStep[];
  /** Whether default values were used */
  usedDefaults: boolean;
  /** Whether lot-specific data was available */
  hasLotSpecificData: boolean;
  /** Whether required context was missing */
  missingRequiredContext: boolean;
  /** Whether approximations were made */
  hasApproximations: boolean;
  /** Whether rational arithmetic was used */
  usedRationalArithmetic: boolean;
  /** Original conversion request details */
  request: {
    value: number;
    fromUnit: string;
    toUnit: string;
  };
}