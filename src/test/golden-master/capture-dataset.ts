/**
 * Golden Dataset Capture Utility
 * 
 * Runs the legacy signature generation system against all test scenarios
 * and captures the outputs as the golden master baseline dataset.
 * 
 * @since 3.1.0
 */

import { generateSignature } from '../../lib/signature';
import { createSignatureGoldenMasterRunner } from '../utils/golden-master-runner';
import type { GoldenTestCase, TestResult } from '../utils/golden-master-runner';
import { getAllRealWorldExamples } from '../data/real-world-examples';
import { getAllEdgeCases } from '../data/edge-cases';
import { MEDICATION_FIXTURES } from '../data/medication-fixtures';
import { DOSING_SCENARIOS } from '../data/dosing-scenarios';

export interface GoldenDatasetEntry {
  id: string;
  name: string;
  category: string;
  input: {
    medication: any;
    dose: any;
    route: string;
    frequency: string;
    specialInstructions?: string;
  };
  output: {
    humanReadable: string;
    fhirRepresentation: any;
    executionTime: number;
    timestamp: string;
  };
  metadata: {
    clinicalIntent: string;
    approvedBy?: string;
    approvedDate?: string;
    version: string;
    captureDate: string;
    legacySystemVersion: string;
  };
}

export interface GoldenDataset {
  metadata: {
    captureDate: string;
    totalCases: number;
    successfulCaptures: number;
    failedCaptures: number;
    legacySystemVersion: string;
    captureMethod: string;
  };
  entries: GoldenDatasetEntry[];
  failures: Array<{
    testCase: Partial<GoldenTestCase>;
    error: string;
    timestamp: string;
  }>;
}

/**
 * Generate all test cases for dataset capture
 */
function generateAllTestCases(): GoldenTestCase[] {
  const testCases: GoldenTestCase[] = [];

  // Add real-world examples
  const realWorldExamples = getAllRealWorldExamples();
  realWorldExamples.forEach((example, index) => {
    if (example.input && example.expected) {
      testCases.push({
        id: example.id || `real-${index}`,
        name: example.name || `Real world case ${index}`,
        description: example.description || 'Real world medication scenario',
        category: example.category || 'complex',
        input: example.input,
        expected: example.expected,
        metadata: example.metadata || {
          clinicalIntent: 'Real world scenario',
          version: '1.0.0'
        }
      });
    }
  });

  // Add edge cases
  const edgeCases = getAllEdgeCases();
  edgeCases.forEach((edgeCase, index) => {
    if (edgeCase.input && edgeCase.expected) {
      testCases.push({
        id: edgeCase.id || `edge-${index}`,
        name: edgeCase.name || `Edge case ${index}`,
        description: edgeCase.description || 'Edge case scenario',
        category: edgeCase.category || 'edge-case',
        input: edgeCase.input,
        expected: edgeCase.expected,
        metadata: edgeCase.metadata || {
          clinicalIntent: 'Edge case testing',
          version: '1.0.0'
        }
      });
    }
  });

  // Add systematic combinations
  const systematicCases = generateSystematicCombinations();
  testCases.push(...systematicCases);

  return testCases;
}

/**
 * Generate systematic combinations for comprehensive coverage
 */
function generateSystematicCombinations(): GoldenTestCase[] {
  const testCases: GoldenTestCase[] = [];
  let caseId = 2000; // Start high to avoid conflicts

  // Core tablet scenarios
  const tabletMeds = [MEDICATION_FIXTURES.tablets.metformin500, MEDICATION_FIXTURES.tablets.lisinopril10];
  const tabletDoses = [
    { value: 1, unit: 'tablet' },
    { value: 0.5, unit: 'tablet' },
    { value: 2, unit: 'tablet' }
  ];
  const frequencies = ['once daily', 'twice daily', 'three times daily'];

  tabletMeds.forEach(medication => {
    tabletDoses.forEach(dose => {
      frequencies.forEach(frequency => {
        testCases.push({
          id: `capture-tablet-${caseId++}`,
          name: `${medication.name} ${dose.value} ${dose.unit} ${frequency}`,
          description: `Systematic tablet capture`,
          category: 'tablet',
          input: { medication, dose, route: 'by mouth', frequency },
          expected: { humanReadable: '' },
          metadata: { clinicalIntent: 'Systematic capture', version: '1.0.0' }
        });
      });
    });
  });

  // Core liquid scenarios
  const liquidMeds = [MEDICATION_FIXTURES.liquids.amoxicillinSuspension];
  const liquidDoses = [
    { value: 5, unit: 'mL' },
    { value: 250, unit: 'mg' },
    { value: 10, unit: 'mL' }
  ];

  liquidMeds.forEach(medication => {
    liquidDoses.forEach(dose => {
      frequencies.forEach(frequency => {
        testCases.push({
          id: `capture-liquid-${caseId++}`,
          name: `${medication.name} ${dose.value} ${dose.unit} ${frequency}`,
          description: `Systematic liquid capture`,
          category: 'liquid',
          input: { medication, dose, route: 'by mouth', frequency },
          expected: { humanReadable: '' },
          metadata: { clinicalIntent: 'Systematic capture', version: '1.0.0' }
        });
      });
    });
  });

  // Injectable scenarios
  const injectableMeds = [MEDICATION_FIXTURES.injectables.testosteroneCypionate];
  const injectionDoses = [
    { value: 100, unit: 'mg' },
    { value: 0.5, unit: 'mL' },
    { value: 200, unit: 'mg' }
  ];
  const injectionRoutes = ['intramuscularly', 'subcutaneously'];

  injectableMeds.forEach(medication => {
    injectionDoses.forEach(dose => {
      injectionRoutes.forEach(route => {
        testCases.push({
          id: `capture-injection-${caseId++}`,
          name: `${medication.name} ${dose.value} ${dose.unit} ${route}`,
          description: `Systematic injection capture`,
          category: 'injection',
          input: { medication, dose, route, frequency: 'once weekly' },
          expected: { humanReadable: '' },
          metadata: { clinicalIntent: 'Systematic capture', version: '1.0.0' }
        });
      });
    });
  });

  // Topiclick scenarios
  const topicalMeds = [MEDICATION_FIXTURES.topicals.hormoneCreams];
  const clickDoses = [
    { value: 2, unit: 'click' },
    { value: 4, unit: 'click' },
    { value: 8, unit: 'click' }
  ];

  topicalMeds.forEach(medication => {
    clickDoses.forEach(dose => {
      frequencies.forEach(frequency => {
        testCases.push({
          id: `capture-topical-${caseId++}`,
          name: `${medication.name} ${dose.value} ${dose.unit} ${frequency}`,
          description: `Systematic Topiclick capture`,
          category: 'topical',
          input: { 
            medication, 
            dose, 
            route: 'topically', 
            frequency,
            specialInstructions: 'using Topiclick dispenser'
          },
          expected: { humanReadable: '' },
          metadata: { clinicalIntent: 'Systematic capture', version: '1.0.0' }
        });
      });
    });
  });

  return testCases;
}

/**
 * Capture golden dataset from legacy system
 */
export async function captureGoldenDataset(): Promise<GoldenDataset> {
  console.log('🔍 Capturing golden dataset from legacy signature system...');
  
  const startTime = Date.now();
  const captureDate = new Date().toISOString();
  
  // Generate all test cases
  const testCases = generateAllTestCases();
  console.log(`📋 Generated ${testCases.length} test cases for capture`);

  // Create golden master runner
  const goldenMasterRunner = createSignatureGoldenMasterRunner(
    (medication, dose, route, frequency, specialInstructions) => {
      return generateSignature(medication, dose, route, frequency, specialInstructions);
    },
    {
      parallelExecution: true,
      maxWorkers: 4,
      timeoutMs: 5000,
      enablePerformanceBenchmarks: true,
      strictComparison: false
    }
  );

  // Run all test cases
  console.log('⚡ Running legacy system against all test cases...');
  const results = await goldenMasterRunner.runTests(testCases);

  console.log(`✅ Completed ${results.summary.totalTests} test cases`);
  console.log(`   Passed: ${results.summary.passed}`);
  console.log(`   Failed: ${results.summary.failed}`);
  console.log(`   Success Rate: ${(results.summary.successRate * 100).toFixed(1)}%`);

  // Convert results to dataset entries
  const entries: GoldenDatasetEntry[] = [];
  const failures: GoldenDataset['failures'] = [];

  results.results.forEach(result => {
    if (result.passed) {
      entries.push({
        id: result.testCase.id,
        name: result.testCase.name,
        category: result.testCase.category,
        input: result.testCase.input,
        output: {
          humanReadable: result.actualOutput.humanReadable,
          fhirRepresentation: result.actualOutput.fhirRepresentation,
          executionTime: result.executionTime,
          timestamp: captureDate
        },
        metadata: {
          ...result.testCase.metadata,
          captureDate,
          legacySystemVersion: '3.0.0-legacy',
        }
      });
    } else {
      failures.push({
        testCase: result.testCase,
        error: result.error?.message || result.differences.join('; '),
        timestamp: captureDate
      });
    }
  });

  const dataset: GoldenDataset = {
    metadata: {
      captureDate,
      totalCases: testCases.length,
      successfulCaptures: entries.length,
      failedCaptures: failures.length,
      legacySystemVersion: '3.0.0-legacy',
      captureMethod: 'automated-golden-master-runner'
    },
    entries,
    failures
  };

  const endTime = Date.now();
  console.log(`🎯 Dataset capture completed in ${((endTime - startTime) / 1000).toFixed(1)}s`);
  console.log(`   Captured: ${entries.length} successful outputs`);
  console.log(`   Failed: ${failures.length} test cases`);
  console.log(`   Performance: ${results.performance.averageExecutionTime.toFixed(1)}ms average`);

  return dataset;
}

/**
 * Save golden dataset to JSON file
 */
export function saveGoldenDataset(dataset: GoldenDataset, filePath: string): void {
  const fs = require('fs');
  const path = require('path');
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Save with pretty formatting
  fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));
  console.log(`💾 Saved golden dataset to ${filePath}`);
}

/**
 * Load golden dataset from JSON file
 */
export function loadGoldenDataset(filePath: string): GoldenDataset {
  const fs = require('fs');
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Golden dataset file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Validate golden dataset integrity
 */
export function validateGoldenDataset(dataset: GoldenDataset): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check metadata
  if (!dataset.metadata) {
    errors.push('Missing metadata');
  } else {
    if (!dataset.metadata.captureDate) errors.push('Missing capture date');
    if (!dataset.metadata.legacySystemVersion) errors.push('Missing legacy system version');
    if (dataset.metadata.totalCases !== dataset.metadata.successfulCaptures + dataset.metadata.failedCaptures) {
      errors.push('Total cases count mismatch');
    }
  }
  
  // Check entries
  if (!Array.isArray(dataset.entries)) {
    errors.push('Entries must be an array');
  } else {
    dataset.entries.forEach((entry, index) => {
      if (!entry.id) errors.push(`Entry ${index}: Missing id`);
      if (!entry.input) errors.push(`Entry ${index}: Missing input`);
      if (!entry.output) errors.push(`Entry ${index}: Missing output`);
      if (!entry.output.humanReadable) errors.push(`Entry ${index}: Missing humanReadable output`);
      if (!entry.metadata) errors.push(`Entry ${index}: Missing metadata`);
    });
  }
  
  // Check for duplicates
  const ids = dataset.entries.map(e => e.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate entry IDs found');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate summary statistics for dataset
 */
export function generateDatasetSummary(dataset: GoldenDataset): any {
  const categoryCounts: Record<string, number> = {};
  const routeCounts: Record<string, number> = {};
  const frequencyCounts: Record<string, number> = {};
  
  dataset.entries.forEach(entry => {
    // Category distribution
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    
    // Route distribution
    const route = entry.input.route;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
    
    // Frequency distribution  
    const frequency = entry.input.frequency;
    frequencyCounts[frequency] = (frequencyCounts[frequency] || 0) + 1;
  });
  
  return {
    totalEntries: dataset.entries.length,
    totalFailures: dataset.failures.length,
    successRate: (dataset.entries.length / dataset.metadata.totalCases * 100).toFixed(1) + '%',
    categoryDistribution: categoryCounts,
    routeDistribution: routeCounts,
    frequencyDistribution: frequencyCounts,
    captureDate: dataset.metadata.captureDate,
    legacySystemVersion: dataset.metadata.legacySystemVersion
  };
}

// CLI interface for running capture
if (require.main === module) {
  (async () => {
    try {
      const dataset = await captureGoldenDataset();
      const outputPath = './src/test/golden-master/dataset.json';
      saveGoldenDataset(dataset, outputPath);
      
      const validation = validateGoldenDataset(dataset);
      if (!validation.valid) {
        console.error('❌ Dataset validation failed:', validation.errors);
        process.exit(1);
      }
      
      const summary = generateDatasetSummary(dataset);
      console.log('\n📊 Dataset Summary:');
      console.log(JSON.stringify(summary, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to capture golden dataset:', error);
      process.exit(1);
    }
  })();
}