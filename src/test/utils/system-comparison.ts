/**
 * System Comparison Framework
 * 
 * Provides sophisticated comparison between legacy signature generation
 * and new Epic 3 builder system outputs with detailed analysis.
 * 
 * @since 3.1.0
 */

import type { SignatureResult } from '../../types';
import type { GoldenTestCase, TestResult } from './golden-master-runner';
import { compareSignatures, compareDoses } from '../matchers/clinical-matchers';

export interface SystemComparisonResult {
  testCaseId: string;
  comparisonType: 'identical' | 'clinically-equivalent' | 'different' | 'error';
  confidence: number; // 0-1 scale
  differences: SystemDifference[];
  legacyOutput: SignatureResult;
  newSystemOutput: SignatureResult;
  legacyExecutionTime: number;
  newSystemExecutionTime: number;
  performanceRatio: number; // new/legacy execution time ratio
  summary: string;
}

export interface SystemDifference {
  component: 'dose' | 'route' | 'frequency' | 'instructions' | 'structure' | 'performance';
  severity: 'critical' | 'major' | 'minor' | 'cosmetic';
  description: string;
  legacyValue: string;
  newSystemValue: string;
  clinicalImpact: 'none' | 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface ComparisonReport {
  summary: {
    totalComparisons: number;
    identical: number;
    clinicallyEquivalent: number;
    different: number;
    errors: number;
    overallAgreement: number;
  };
  performance: {
    legacyAverageTime: number;
    newSystemAverageTime: number;
    performanceImprovement: number;
    p95LegacyTime: number;
    p95NewSystemTime: number;
  };
  differences: {
    critical: SystemDifference[];
    major: SystemDifference[];
    minor: SystemDifference[];
    cosmetic: SystemDifference[];
  };
  categoryBreakdown: Record<string, {
    total: number;
    identical: number;
    equivalent: number;
    different: number;
  }>;
  recommendations: string[];
}

/**
 * Compare outputs from legacy and new systems
 */
export function compareSystemOutputs(
  testCase: GoldenTestCase,
  legacyResult: TestResult,
  newSystemResult: TestResult
): SystemComparisonResult {
  
  const differences: SystemDifference[] = [];
  let confidence = 1.0;
  let comparisonType: SystemComparisonResult['comparisonType'] = 'identical';

  // Handle error cases
  if (!legacyResult.passed || !newSystemResult.passed) {
    return {
      testCaseId: testCase.id,
      comparisonType: 'error',
      confidence: 0,
      differences: [{
        component: 'structure',
        severity: 'critical',
        description: 'One or both systems failed to execute',
        legacyValue: legacyResult.passed ? 'success' : 'failed',
        newSystemValue: newSystemResult.passed ? 'success' : 'failed',
        clinicalImpact: 'high',
        recommendation: 'Fix system errors before comparison'
      }],
      legacyOutput: legacyResult.actualOutput,
      newSystemOutput: newSystemResult.actualOutput,
      legacyExecutionTime: legacyResult.executionTime,
      newSystemExecutionTime: newSystemResult.executionTime,
      performanceRatio: newSystemResult.executionTime / legacyResult.executionTime,
      summary: 'System error prevents meaningful comparison'
    };
  }

  const legacySignature = legacyResult.actualOutput.humanReadable;
  const newSystemSignature = newSystemResult.actualOutput.humanReadable;

  // Exact comparison first
  if (legacySignature === newSystemSignature) {
    comparisonType = 'identical';
  } else {
    // Detailed component comparison
    const componentDifferences = analyzeComponentDifferences(
      legacyResult.actualOutput,
      newSystemResult.actualOutput,
      testCase
    );
    
    differences.push(...componentDifferences);
    
    // Determine overall comparison type
    const criticalDiffs = differences.filter(d => d.severity === 'critical');
    const majorDiffs = differences.filter(d => d.severity === 'major');
    
    if (criticalDiffs.length > 0) {
      comparisonType = 'different';
      confidence = 0.3;
    } else if (majorDiffs.length > 0) {
      comparisonType = 'different';
      confidence = 0.6;
    } else {
      comparisonType = 'clinically-equivalent';
      confidence = 0.8;
    }
  }

  // Performance comparison
  const performanceRatio = newSystemResult.executionTime / legacyResult.executionTime;
  if (Math.abs(performanceRatio - 1) > 0.5) { // >50% difference
    differences.push({
      component: 'performance',
      severity: performanceRatio > 2 ? 'major' : 'minor',
      description: `Performance ${performanceRatio > 1 ? 'regression' : 'improvement'} detected`,
      legacyValue: `${legacyResult.executionTime.toFixed(1)}ms`,
      newSystemValue: `${newSystemResult.executionTime.toFixed(1)}ms`,
      clinicalImpact: 'low',
      recommendation: performanceRatio > 2 ? 'Investigate performance regression' : 'Performance improvement noted'
    });
  }

  return {
    testCaseId: testCase.id,
    comparisonType,
    confidence,
    differences,
    legacyOutput: legacyResult.actualOutput,
    newSystemOutput: newSystemResult.actualOutput,
    legacyExecutionTime: legacyResult.executionTime,
    newSystemExecutionTime: newSystemResult.executionTime,
    performanceRatio,
    summary: generateComparisonSummary(comparisonType, differences, confidence)
  };
}

/**
 * Analyze specific component differences
 */
function analyzeComponentDifferences(
  legacyOutput: SignatureResult,
  newSystemOutput: SignatureResult,
  testCase: GoldenTestCase
): SystemDifference[] {
  
  const differences: SystemDifference[] = [];
  
  // Dose analysis
  const doseComparison = compareDoses(legacyOutput.humanReadable, newSystemOutput.humanReadable);
  if (!doseComparison.isEquivalent) {
    differences.push({
      component: 'dose',
      severity: 'critical',
      description: 'Dose amounts or units differ',
      legacyValue: doseComparison.expectedDose,
      newSystemValue: doseComparison.actualDose,
      clinicalImpact: 'high',
      recommendation: 'Verify dose calculation logic'
    });
  }

  // Route analysis
  const legacyRoute = extractRoute(legacyOutput.humanReadable);
  const newSystemRoute = extractRoute(newSystemOutput.humanReadable);
  if (legacyRoute !== newSystemRoute) {
    differences.push({
      component: 'route',
      severity: 'major',
      description: 'Route of administration differs',
      legacyValue: legacyRoute,
      newSystemValue: newSystemRoute,
      clinicalImpact: 'medium',
      recommendation: 'Verify route mapping logic'
    });
  }

  // Frequency analysis
  const legacyFreq = extractFrequency(legacyOutput.humanReadable);
  const newSystemFreq = extractFrequency(newSystemOutput.humanReadable);
  if (!areFrequenciesEquivalent(legacyFreq, newSystemFreq)) {
    differences.push({
      component: 'frequency',
      severity: 'major',
      description: 'Dosing frequency differs',
      legacyValue: legacyFreq,
      newSystemValue: newSystemFreq,
      clinicalImpact: 'medium',
      recommendation: 'Verify frequency translation logic'
    });
  }

  // Special instructions analysis
  const legacyInstructions = extractSpecialInstructions(legacyOutput.humanReadable);
  const newSystemInstructions = extractSpecialInstructions(newSystemOutput.humanReadable);
  if (legacyInstructions !== newSystemInstructions) {
    differences.push({
      component: 'instructions',
      severity: 'minor',
      description: 'Special instructions differ',
      legacyValue: legacyInstructions || 'none',
      newSystemValue: newSystemInstructions || 'none',
      clinicalImpact: 'low',
      recommendation: 'Review instruction handling logic'
    });
  }

  // FHIR structure analysis
  const structureDiffs = analyzeFhirStructure(legacyOutput.fhirRepresentation, newSystemOutput.fhirRepresentation);
  differences.push(...structureDiffs);

  return differences;
}

/**
 * Extract route from signature text
 */
function extractRoute(signature: string): string {
  const routeMatch = signature.match(/(by mouth|orally|topically|intramuscularly|subcutaneously|intravenously)/i);
  return routeMatch ? routeMatch[1].toLowerCase() : 'unknown';
}

/**
 * Extract frequency from signature text
 */
function extractFrequency(signature: string): string {
  const freqMatch = signature.match(/(once|twice|three times|four times)\s*(daily|weekly|per day|per week)/i);
  if (freqMatch) {
    return `${freqMatch[1]} ${freqMatch[2]}`.toLowerCase();
  }
  
  const hourlyMatch = signature.match(/every\s+(\d+)\s+hours?/i);
  if (hourlyMatch) {
    return `every ${hourlyMatch[1]} hours`;
  }
  
  return 'unknown';
}

/**
 * Check if frequencies are clinically equivalent
 */
function areFrequenciesEquivalent(freq1: string, freq2: string): boolean {
  const equivalents: Record<string, string[]> = {
    'once daily': ['once daily', 'daily', 'once per day'],
    'twice daily': ['twice daily', 'bid', 'twice per day'],
    'three times daily': ['three times daily', 'tid', 'thrice daily'],
    'four times daily': ['four times daily', 'qid']
  };
  
  for (const [canonical, variants] of Object.entries(equivalents)) {
    if (variants.includes(freq1.toLowerCase()) && variants.includes(freq2.toLowerCase())) {
      return true;
    }
  }
  
  return freq1.toLowerCase() === freq2.toLowerCase();
}

/**
 * Extract special instructions
 */
function extractSpecialInstructions(signature: string): string | null {
  // Look for instructions after the main signature pattern
  const match = signature.match(/\w+\s+[\d./]+\s+\w+\s+\w+\s+[\w\s]+\s+(.+)\./);
  return match ? match[1].trim() : null;
}

/**
 * Analyze FHIR structure differences
 */
function analyzeFhirStructure(legacyFhir: any, newSystemFhir: any): SystemDifference[] {
  const differences: SystemDifference[] = [];
  
  // Check required fields
  const requiredFields = ['dosageInstruction'];
  requiredFields.forEach(field => {
    const legacyHas = legacyFhir && legacyFhir[field];
    const newSystemHas = newSystemFhir && newSystemFhir[field];
    
    if (legacyHas !== newSystemHas) {
      differences.push({
        component: 'structure',
        severity: 'major',
        description: `FHIR field '${field}' presence differs`,
        legacyValue: legacyHas ? 'present' : 'missing',
        newSystemValue: newSystemHas ? 'present' : 'missing',
        clinicalImpact: 'medium',
        recommendation: 'Ensure FHIR structure consistency'
      });
    }
  });
  
  // Check dose values in FHIR
  if (legacyFhir?.dosageInstruction?.doseAndRate?.doseQuantity && 
      newSystemFhir?.dosageInstruction?.doseAndRate?.doseQuantity) {
    
    const legacyDose = legacyFhir.dosageInstruction.doseAndRate.doseQuantity;
    const newSystemDose = newSystemFhir.dosageInstruction.doseAndRate.doseQuantity;
    
    if (legacyDose.value !== newSystemDose.value || legacyDose.unit !== newSystemDose.unit) {
      differences.push({
        component: 'structure',
        severity: 'critical',
        description: 'FHIR dose values differ',
        legacyValue: `${legacyDose.value} ${legacyDose.unit}`,
        newSystemValue: `${newSystemDose.value} ${newSystemDose.unit}`,
        clinicalImpact: 'high',
        recommendation: 'Verify FHIR dose mapping'
      });
    }
  }
  
  return differences;
}

/**
 * Generate comparison summary text
 */
function generateComparisonSummary(
  comparisonType: SystemComparisonResult['comparisonType'],
  differences: SystemDifference[],
  confidence: number
): string {
  
  switch (comparisonType) {
    case 'identical':
      return 'Systems produce identical outputs';
    
    case 'clinically-equivalent':
      const minorCount = differences.filter(d => d.severity === 'minor' || d.severity === 'cosmetic').length;
      return `Systems are clinically equivalent with ${minorCount} minor differences (confidence: ${(confidence * 100).toFixed(0)}%)`;
    
    case 'different':
      const criticalCount = differences.filter(d => d.severity === 'critical').length;
      const majorCount = differences.filter(d => d.severity === 'major').length;
      return `Systems differ significantly: ${criticalCount} critical, ${majorCount} major differences (confidence: ${(confidence * 100).toFixed(0)}%)`;
    
    case 'error':
      return 'Comparison failed due to system errors';
    
    default:
      return 'Unknown comparison result';
  }
}

/**
 * Generate comprehensive comparison report
 */
export function generateComparisonReport(comparisons: SystemComparisonResult[]): ComparisonReport {
  const summary = {
    totalComparisons: comparisons.length,
    identical: comparisons.filter(c => c.comparisonType === 'identical').length,
    clinicallyEquivalent: comparisons.filter(c => c.comparisonType === 'clinically-equivalent').length,
    different: comparisons.filter(c => c.comparisonType === 'different').length,
    errors: comparisons.filter(c => c.comparisonType === 'error').length,
    overallAgreement: 0
  };
  
  summary.overallAgreement = (summary.identical + summary.clinicallyEquivalent) / summary.totalComparisons;
  
  // Performance analysis
  const validComparisons = comparisons.filter(c => c.comparisonType !== 'error');
  const legacyTimes = validComparisons.map(c => c.legacyExecutionTime);
  const newSystemTimes = validComparisons.map(c => c.newSystemExecutionTime);
  
  const performance = {
    legacyAverageTime: legacyTimes.reduce((a, b) => a + b, 0) / legacyTimes.length,
    newSystemAverageTime: newSystemTimes.reduce((a, b) => a + b, 0) / newSystemTimes.length,
    performanceImprovement: 0,
    p95LegacyTime: legacyTimes.sort((a, b) => a - b)[Math.floor(legacyTimes.length * 0.95)] || 0,
    p95NewSystemTime: newSystemTimes.sort((a, b) => a - b)[Math.floor(newSystemTimes.length * 0.95)] || 0
  };
  
  performance.performanceImprovement = (performance.legacyAverageTime - performance.newSystemAverageTime) / performance.legacyAverageTime;
  
  // Collect all differences
  const allDifferences = comparisons.flatMap(c => c.differences);
  const differences = {
    critical: allDifferences.filter(d => d.severity === 'critical'),
    major: allDifferences.filter(d => d.severity === 'major'),
    minor: allDifferences.filter(d => d.severity === 'minor'),
    cosmetic: allDifferences.filter(d => d.severity === 'cosmetic')
  };
  
  // Category breakdown
  const categoryBreakdown: Record<string, any> = {};
  const categories = [...new Set(comparisons.map(c => c.testCaseId.split('-')[1] || 'unknown'))];
  
  categories.forEach(category => {
    const categoryComparisons = comparisons.filter(c => c.testCaseId.includes(category));
    categoryBreakdown[category] = {
      total: categoryComparisons.length,
      identical: categoryComparisons.filter(c => c.comparisonType === 'identical').length,
      equivalent: categoryComparisons.filter(c => c.comparisonType === 'clinically-equivalent').length,
      different: categoryComparisons.filter(c => c.comparisonType === 'different').length
    };
  });
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (differences.critical.length > 0) {
    recommendations.push(`Address ${differences.critical.length} critical differences before deployment`);
  }
  
  if (differences.major.length > 5) {
    recommendations.push(`Review ${differences.major.length} major differences for clinical impact`);
  }
  
  if (performance.performanceImprovement < -0.5) {
    recommendations.push('Investigate significant performance regression');
  } else if (performance.performanceImprovement > 0.2) {
    recommendations.push('Document performance improvements achieved');
  }
  
  if (summary.overallAgreement < 0.9) {
    recommendations.push('Low system agreement - requires detailed review before migration');
  } else if (summary.overallAgreement > 0.95) {
    recommendations.push('High system agreement - migration appears safe');
  }
  
  return {
    summary,
    performance,
    differences,
    categoryBreakdown,
    recommendations
  };
}

/**
 * Export comparison results for regulatory documentation
 */
export function exportComparisonDocumentation(report: ComparisonReport): any {
  return {
    executiveSummary: {
      totalTestCases: report.summary.totalComparisons,
      systemAgreement: `${(report.summary.overallAgreement * 100).toFixed(1)}%`,
      criticalDifferences: report.differences.critical.length,
      performanceChange: `${(report.performance.performanceImprovement * 100).toFixed(1)}%`,
      migrationRecommendation: report.recommendations[0] || 'No specific recommendations'
    },
    detailedAnalysis: {
      agreementBreakdown: {
        identical: `${report.summary.identical} (${((report.summary.identical / report.summary.totalComparisons) * 100).toFixed(1)}%)`,
        clinicallyEquivalent: `${report.summary.clinicallyEquivalent} (${((report.summary.clinicallyEquivalent / report.summary.totalComparisons) * 100).toFixed(1)}%)`,
        different: `${report.summary.different} (${((report.summary.different / report.summary.totalComparisons) * 100).toFixed(1)}%)`,
        errors: `${report.summary.errors} (${((report.summary.errors / report.summary.totalComparisons) * 100).toFixed(1)}%)`
      },
      performanceMetrics: {
        legacySystemAverage: `${report.performance.legacyAverageTime.toFixed(1)}ms`,
        newSystemAverage: `${report.performance.newSystemAverageTime.toFixed(1)}ms`,
        improvementPercentage: `${(report.performance.performanceImprovement * 100).toFixed(1)}%`,
        p95Legacy: `${report.performance.p95LegacyTime.toFixed(1)}ms`,
        p95NewSystem: `${report.performance.p95NewSystemTime.toFixed(1)}ms`
      },
      riskAssessment: {
        high: report.differences.critical.length,
        medium: report.differences.major.length,
        low: report.differences.minor.length + report.differences.cosmetic.length
      }
    },
    recommendations: report.recommendations,
    generateDate: new Date().toISOString()
  };
}