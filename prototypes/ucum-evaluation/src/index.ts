/**
 * Main evaluation runner for UCUM libraries
 */
import { Benchmark } from './benchmark';
import { UcumLhcWrapper } from './converters/ucum-lhc-wrapper';
import { JsQuantitiesWrapper } from './converters/js-quantities-wrapper';
import { UnitMathWrapper } from './converters/unitmath-wrapper';
import { ConvertUnitsWrapper } from './converters/convert-units-wrapper';
import { LibraryEvaluation } from './types';

async function main() {
  console.log('UCUM Library Evaluation for Med Sig Builder');
  console.log('==========================================\n');

  const benchmark = new Benchmark();
  const evaluations: LibraryEvaluation[] = [];

  // Test each library
  const converters = [
    new UcumLhcWrapper(),
    new JsQuantitiesWrapper(),
    new UnitMathWrapper(),
    new ConvertUnitsWrapper()
  ];

  for (const converter of converters) {
    try {
      const evaluation = await benchmark.runBenchmark(converter);
      evaluations.push(evaluation);
    } catch (error) {
      console.error(`Failed to benchmark ${converter.name}:`, error);
    }
  }

  // Save results
  benchmark.saveResults(evaluations);
  
  // Print summary
  benchmark.printSummary(evaluations);

  // Generate recommendation
  generateRecommendation(evaluations);
}

function generateRecommendation(evaluations: LibraryEvaluation[]) {
  console.log('\n=== RECOMMENDATION ===\n');

  // Score each library
  const scores = evaluations.map(evaluation => {
    let score = 0;
    
    // Accuracy (most important for medical) - 40 points
    const accuracyRate = evaluation.accuracy.passedTests / (evaluation.accuracy.passedTests + evaluation.accuracy.failedTests);
    score += accuracyRate * 40;
    
    // UCUM compliance - 20 points
    if (evaluation.features.ucumCompliant) score += 20;
    
    // Performance - 15 points
    if (evaluation.performance.avgConversionTime < 1) score += 15;
    else if (evaluation.performance.avgConversionTime < 5) score += 10;
    else if (evaluation.performance.avgConversionTime < 10) score += 5;
    
    // Bundle size - 10 points
    const sizeKB = evaluation.bundleSize.total / 1024;
    if (sizeKB < 50) score += 10;
    else if (sizeKB < 200) score += 7;
    else if (sizeKB < 500) score += 4;
    
    // Features - 10 points
    if (evaluation.features.unitValidation) score += 2;
    if (evaluation.features.suggestions) score += 2;
    if (evaluation.features.commensurableUnits) score += 3;
    if (evaluation.features.errorMessages === 'excellent') score += 3;
    else if (evaluation.features.errorMessages === 'good') score += 2;
    
    // Developer experience - 5 points
    if (evaluation.developerExperience.typeSupport === 'native') score += 2;
    else if (evaluation.developerExperience.typeSupport === 'definitions') score += 1;
    if (evaluation.developerExperience.documentation === 'comprehensive') score += 2;
    else if (evaluation.developerExperience.documentation === 'adequate') score += 1;
    if (evaluation.developerExperience.apiDesign === 'excellent') score += 1;
    
    return { name: evaluation.name, score, evaluation: evaluation };
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  console.log('Library Scores (out of 100):');
  scores.forEach(({ name, score }) => {
    console.log(`  ${name}: ${score.toFixed(1)}`);
  });

  const winner = scores[0];
  console.log(`\nRecommended Library: ${winner.name}`);
  console.log(`\nReason: ${generateReason(winner.evaluation)}`);
}

function generateReason(evaluation: LibraryEvaluation): string {
  const reasons: string[] = [];
  
  if (evaluation.features.ucumCompliant) {
    reasons.push('Full UCUM compliance for medical units');
  }
  
  const accuracyRate = evaluation.accuracy.passedTests / (evaluation.accuracy.passedTests + evaluation.accuracy.failedTests);
  if (accuracyRate > 0.9) {
    reasons.push(`High accuracy (${(accuracyRate * 100).toFixed(1)}% tests passed)`);
  }
  
  if (evaluation.performance.avgConversionTime < 1) {
    reasons.push('Excellent performance');
  }
  
  if (evaluation.features.commensurableUnits) {
    reasons.push('Supports finding compatible units');
  }
  
  return reasons.join(', ');
}

// Run the evaluation
main().catch(console.error);