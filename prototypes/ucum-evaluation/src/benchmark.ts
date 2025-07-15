/**
 * Benchmark framework for UCUM library evaluation
 */
import { UnitConverter, BenchmarkResult, LibraryEvaluation } from './types';
import { allTestCases, basicConversionTests } from './test-cases';
import * as fs from 'fs';
import * as path from 'path';

export class Benchmark {
  private results: BenchmarkResult[] = [];

  async runBenchmark(converter: UnitConverter): Promise<LibraryEvaluation> {
    console.log(`\n=== Benchmarking ${converter.name} ===`);
    
    const evaluation: LibraryEvaluation = {
      name: converter.name,
      bundleSize: await this.measureBundleSize(converter.name),
      performance: {
        avgConversionTime: 0,
        coldStartTime: 0,
        memoryBaseline: 0,
        memoryPeak: 0
      },
      accuracy: {
        passedTests: 0,
        failedTests: 0,
        roundTripError: 0,
        failedTestNames: []
      },
      features: {
        ucumCompliant: false,
        customUnits: false,
        unitValidation: false,
        suggestions: false,
        commensurableUnits: false,
        errorMessages: 'poor'
      },
      developerExperience: {
        typeSupport: 'none',
        documentation: 'lacking',
        apiDesign: 'poor',
        setupComplexity: 'simple'
      }
    };

    // Measure cold start time
    const coldStartBegin = process.hrtime.bigint();
    const coldResult = converter.convert(1000, 'mg', 'g');
    const coldStartEnd = process.hrtime.bigint();
    evaluation.performance.coldStartTime = Number(coldStartEnd - coldStartBegin) / 1_000_000; // ms

    // Measure memory baseline
    if (global.gc) global.gc();
    evaluation.performance.memoryBaseline = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Run accuracy tests
    const conversionTimes: number[] = [];
    
    for (const testCase of allTestCases) {
      const startTime = process.hrtime.bigint();
      const result = converter.convert(testCase.value, testCase.from, testCase.to);
      const endTime = process.hrtime.bigint();
      
      const executionTime = Number(endTime - startTime) / 1_000_000; // ms
      conversionTimes.push(executionTime);

      const benchmarkResult: BenchmarkResult = {
        libraryName: converter.name,
        testCase: testCase.name,
        success: false,
        executionTime,
        error: result.error
      };

      if (result.success && result.value !== undefined) {
        const tolerance = testCase.tolerance || 0.0001;
        const expectedFail = testCase.expected === -1;
        
        if (expectedFail) {
          // This test should fail
          benchmarkResult.success = false;
          evaluation.accuracy.failedTests++;
        } else {
          const difference = Math.abs(result.value - testCase.expected);
          const passed = difference <= tolerance;
          
          benchmarkResult.success = passed;
          if (passed) {
            evaluation.accuracy.passedTests++;
          } else {
            evaluation.accuracy.failedTests++;
            evaluation.accuracy.failedTestNames.push(testCase.name);
          }
        }
      } else {
        // Conversion failed
        const expectedFail = testCase.expected === -1;
        if (expectedFail) {
          // Expected to fail, count as passed
          benchmarkResult.success = true;
          evaluation.accuracy.passedTests++;
        } else {
          evaluation.accuracy.failedTests++;
          evaluation.accuracy.failedTestNames.push(testCase.name);
        }
      }

      this.results.push(benchmarkResult);
    }

    // Calculate average conversion time
    evaluation.performance.avgConversionTime = 
      conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length;

    // Measure peak memory
    evaluation.performance.memoryPeak = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Test round-trip accuracy
    const roundTripError = await this.measureRoundTripError(converter);
    evaluation.accuracy.roundTripError = roundTripError;

    // Test features
    evaluation.features = await this.evaluateFeatures(converter);

    // Evaluate developer experience based on library
    evaluation.developerExperience = this.evaluateDeveloperExperience(converter.name);

    return evaluation;
  }

  private async measureBundleSize(libraryName: string): Promise<{
    raw: number;
    dependencies: number;
    total: number;
  }> {
    // For prototype, we'll use rough estimates based on npm package info
    const sizes: Record<string, { raw: number; dependencies: number }> = {
      '@lhncbc/ucum-lhc': { raw: 2060000, dependencies: 1500000 }, // 2.06 MB + deps
      'js-quantities': { raw: 45000, dependencies: 0 }, // 45 KB, no deps
      'unitmath': { raw: 120000, dependencies: 50000 }, // 120 KB + small deps
      'convert-units': { raw: 35000, dependencies: 10000 } // 35 KB + small deps
    };

    const size = sizes[libraryName] || { raw: 0, dependencies: 0 };
    
    return {
      raw: size.raw,
      dependencies: size.dependencies,
      total: size.raw + size.dependencies
    };
  }

  private async measureRoundTripError(converter: UnitConverter): Promise<number> {
    let totalError = 0;
    let testCount = 0;

    for (const test of basicConversionTests) {
      // Forward conversion
      const forward = converter.convert(test.value, test.from, test.to);
      if (forward.success && forward.value !== undefined) {
        // Reverse conversion
        const reverse = converter.convert(forward.value, test.to, test.from);
        if (reverse.success && reverse.value !== undefined) {
          const error = Math.abs(reverse.value - test.value) / test.value;
          totalError += error;
          testCount++;
        }
      }
    }

    return testCount > 0 ? totalError / testCount : 1.0;
  }

  private async evaluateFeatures(converter: UnitConverter): Promise<LibraryEvaluation['features']> {
    const features: LibraryEvaluation['features'] = {
      ucumCompliant: false,
      customUnits: false,
      unitValidation: false,
      suggestions: false,
      commensurableUnits: false,
      errorMessages: 'poor'
    };

    // Test UCUM compliance (check if it handles UCUM units correctly)
    const ucumTest = converter.convert(1, 'mg', 'g');
    features.ucumCompliant = ucumTest.success === true;

    // Test custom units
    const customTest = converter.convert(1, '{click}', '{click}');
    features.customUnits = customTest.success === true;

    // Test validation
    const validTest = converter.validate('mg');
    const invalidTest = converter.validate('invalid-unit');
    features.unitValidation = validTest.valid === true && invalidTest.valid === false;

    // Test suggestions
    if (invalidTest.suggestions && invalidTest.suggestions.length > 0) {
      features.suggestions = true;
    }

    // Test commensurable units
    if (converter.getCommensurableUnits) {
      const units = converter.getCommensurableUnits('mg');
      features.commensurableUnits = units.length > 0;
    }

    // Evaluate error messages
    const errorTest = converter.convert(1, 'mg', 'invalid');
    if (errorTest.error) {
      if (errorTest.error.includes('cannot convert') || errorTest.error.includes('incompatible')) {
        features.errorMessages = 'excellent';
      } else if (errorTest.error.length > 10) {
        features.errorMessages = 'good';
      }
    }

    return features;
  }

  private evaluateDeveloperExperience(libraryName: string): LibraryEvaluation['developerExperience'] {
    const experiences: Record<string, LibraryEvaluation['developerExperience']> = {
      '@lhncbc/ucum-lhc': {
        typeSupport: 'none', // No built-in types
        documentation: 'comprehensive', // Good docs
        apiDesign: 'good', // Decent API
        setupComplexity: 'simple' // Easy to set up
      },
      'js-quantities': {
        typeSupport: 'definitions', // Has @types
        documentation: 'adequate',
        apiDesign: 'excellent', // Very clean API
        setupComplexity: 'simple'
      },
      'unitmath': {
        typeSupport: 'native', // Built-in TypeScript
        documentation: 'adequate',
        apiDesign: 'excellent',
        setupComplexity: 'moderate' // Need to define units
      },
      'convert-units': {
        typeSupport: 'definitions',
        documentation: 'adequate',
        apiDesign: 'good',
        setupComplexity: 'simple'
      }
    };

    return experiences[libraryName] || {
      typeSupport: 'none',
      documentation: 'lacking',
      apiDesign: 'poor',
      setupComplexity: 'complex'
    };
  }

  saveResults(evaluations: LibraryEvaluation[]) {
    const reportPath = path.join(__dirname, '..', 'benchmark-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(evaluations, null, 2));
    
    console.log(`\nBenchmark results saved to: ${reportPath}`);
  }

  printSummary(evaluations: LibraryEvaluation[]) {
    console.log('\n=== BENCHMARK SUMMARY ===\n');
    
    for (const evaluation of evaluations) {
      console.log(`Library: ${evaluation.name}`);
      console.log(`  Bundle Size: ${(evaluation.bundleSize.total / 1024).toFixed(1)} KB`);
      console.log(`  Avg Conversion Time: ${evaluation.performance.avgConversionTime.toFixed(3)} ms`);
      console.log(`  Accuracy: ${evaluation.accuracy.passedTests}/${evaluation.accuracy.passedTests + evaluation.accuracy.failedTests} tests passed`);
      console.log(`  UCUM Compliant: ${evaluation.features.ucumCompliant ? 'Yes' : 'No'}`);
      console.log(`  TypeScript Support: ${evaluation.developerExperience.typeSupport}`);
      console.log('');
    }
  }
}