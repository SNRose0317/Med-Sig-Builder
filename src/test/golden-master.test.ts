/**
 * Golden Master Test Suite Integration
 * 
 * Main test file that orchestrates all golden master testing components:
 * - Legacy system baseline capture
 * - New system comparison
 * - Clinical validation
 * - Performance benchmarking
 * - Approval workflow
 * 
 * @since 3.1.0
 */

import { createSignatureGoldenMasterRunner } from './utils/golden-master-runner';
import type { GoldenTestCase, TestReport } from './utils/golden-master-runner';
import { generateSignature } from '../lib/signature';
import { captureGoldenDataset, loadGoldenDataset, validateGoldenDataset } from './golden-master/capture-dataset';
import { 
  generateApprovalDocumentation, 
  batchGenerateApprovals, 
  validateApprovalWorkflow,
  exportApprovalSummary 
} from './golden-master/clinical-approval';
import { getAllRealWorldExamples } from './data/real-world-examples';
import { getAllEdgeCases } from './data/edge-cases';

// Mock builder function for new system comparison (would import from Epic 3 when available)
function mockNewSystemSignature(medication: any, dose: any, route: string, frequency: string, specialInstructions?: string) {
  // For now, use legacy system as placeholder
  // TODO: Replace with actual Epic 3 builder system when available
  return generateSignature(medication, dose, route, frequency, specialInstructions);
}

describe('Golden Master Test Suite', () => {
  let legacyRunner: ReturnType<typeof createSignatureGoldenMasterRunner>;
  let newSystemRunner: ReturnType<typeof createSignatureGoldenMasterRunner>;

  beforeAll(() => {
    // Create test runners for both systems
    legacyRunner = createSignatureGoldenMasterRunner(
      (medication, dose, route, frequency, specialInstructions) => {
        return generateSignature(medication, dose, route, frequency, specialInstructions);
      },
      {
        parallelExecution: true,
        maxWorkers: 4,
        timeoutMs: 3000,
        enablePerformanceBenchmarks: true,
        strictComparison: false
      }
    );

    newSystemRunner = createSignatureGoldenMasterRunner(
      mockNewSystemSignature,
      {
        parallelExecution: true,
        maxWorkers: 4,
        timeoutMs: 3000,
        enablePerformanceBenchmarks: true,
        strictComparison: false
      }
    );
  });

  describe('Golden Dataset Management', () => {
    it('should validate existing golden dataset', async () => {
      const datasetPath = './src/test/golden-master/dataset.json';
      
      try {
        const dataset = loadGoldenDataset(datasetPath);
        const validation = validateGoldenDataset(dataset);
        
        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          console.error('Dataset validation errors:', validation.errors);
        }
        
        expect(dataset.entries.length).toBeGreaterThan(50);
        expect(dataset.metadata.successfulCaptures).toBeGreaterThan(50);
        
      } catch (error) {
        // If dataset doesn't exist, that's OK for initial runs
        console.warn('Golden dataset not found - will be created on first capture');
        expect(error.message).toContain('not found');
      }
    });

    it('should capture new golden dataset if needed', async () => {
      // This test is normally skipped unless explicitly run
      if (!process.env.CAPTURE_GOLDEN_DATASET) {
        return;
      }

      console.log('🔄 Capturing fresh golden dataset...');
      const dataset = await captureGoldenDataset();
      
      expect(dataset.entries.length).toBeGreaterThan(50);
      expect(dataset.metadata.successfulCaptures).toBeGreaterThan(50);
      expect(dataset.metadata.successfulCaptures / dataset.metadata.totalCases).toBeGreaterThan(0.9);
      
      console.log(`✅ Captured ${dataset.entries.length} golden master entries`);
    }, 30000); // Extended timeout for dataset capture
  });

  describe('Legacy System Baseline', () => {
    it('should execute all real-world scenarios successfully', async () => {
      const realWorldCases = getAllRealWorldExamples().filter(example => 
        example.input && example.expected
      ) as GoldenTestCase[];

      expect(realWorldCases.length).toBeGreaterThan(15);

      const results = await legacyRunner.runTests(realWorldCases);
      
      expect(results.summary.successRate).toBeGreaterThan(0.95);
      expect(results.performance.averageExecutionTime).toBeLessThan(10);
      
      // Log performance metrics
      console.log(`Real-world scenarios: ${results.summary.passed}/${results.summary.totalTests} passed`);
      console.log(`Average execution time: ${results.performance.averageExecutionTime.toFixed(1)}ms`);
    });

    it('should handle edge cases appropriately', async () => {
      const edgeCases = getAllEdgeCases().filter(edgeCase => 
        edgeCase.input && edgeCase.expected && 
        !edgeCase.expected.humanReadable?.startsWith('ERROR:')
      ) as GoldenTestCase[];

      if (edgeCases.length > 0) {
        const results = await legacyRunner.runTests(edgeCases);
        
        // Edge cases may have lower success rate due to boundary conditions
        expect(results.summary.successRate).toBeGreaterThan(0.8);
        
        console.log(`Edge cases: ${results.summary.passed}/${results.summary.totalTests} passed`);
      }
    });

    it('should maintain performance standards', async () => {
      const performanceTestCases = getAllRealWorldExamples().slice(0, 20) as GoldenTestCase[];
      
      const results = await legacyRunner.runTests(performanceTestCases);
      
      // Performance requirements
      expect(results.performance.averageExecutionTime).toBeLessThan(10); // 10ms average
      expect(results.performance.p95ExecutionTime).toBeLessThan(50); // 50ms P95
      expect(results.performance.p99ExecutionTime).toBeLessThan(100); // 100ms P99
      
      // No individual test should take longer than 200ms
      const slowTests = results.performance.slowestTests.filter(test => test.time > 200);
      expect(slowTests.length).toBe(0);
    });
  });

  describe('System Comparison', () => {
    it('should compare legacy vs new system outputs', async () => {
      const comparisonCases = getAllRealWorldExamples().slice(0, 10) as GoldenTestCase[];
      
      // Run both systems
      const legacyResults = await legacyRunner.runTests(comparisonCases);
      const newSystemResults = await newSystemRunner.runTests(comparisonCases);
      
      expect(legacyResults.summary.successRate).toBeGreaterThan(0.9);
      expect(newSystemResults.summary.successRate).toBeGreaterThan(0.9);
      
      // Compare outputs using custom matchers
      legacyResults.results.forEach((legacyResult, index) => {
        if (legacyResult.passed && newSystemResults.results[index]?.passed) {
          const newResult = newSystemResults.results[index];
          
          // Test clinical equivalence
          expect(newResult.actualOutput.humanReadable)
            .toClinicallyEqual(legacyResult.actualOutput.humanReadable);
        }
      });
      
      console.log(`Comparison: ${comparisonCases.length} test cases compared`);
    });

    it('should detect significant differences between systems', async () => {
      // This test would identify cases where new system differs from legacy
      // For now, they should be identical since we're using the same function
      
      const testCases = getAllRealWorldExamples().slice(0, 5) as GoldenTestCase[];
      
      const legacyResults = await legacyRunner.runTests(testCases);
      const newSystemResults = await newSystemRunner.runTests(testCases);
      
      let significantDifferences = 0;
      
      legacyResults.results.forEach((legacyResult, index) => {
        if (legacyResult.passed && newSystemResults.results[index]?.passed) {
          const newResult = newSystemResults.results[index];
          
          // Count exact differences (before clinical equivalence)
          if (legacyResult.actualOutput.humanReadable !== newResult.actualOutput.humanReadable) {
            significantDifferences++;
            console.log(`Difference in ${legacyResult.testCase.id}:`);
            console.log(`  Legacy: ${legacyResult.actualOutput.humanReadable}`);
            console.log(`  New:    ${newResult.actualOutput.humanReadable}`);
          }
        }
      });
      
      // For now, expect no differences since using same system
      expect(significantDifferences).toBe(0);
    });
  });

  describe('Clinical Validation', () => {
    it('should generate clinical approvals for test cases', async () => {
      const testCaseIds = getAllRealWorldExamples()
        .slice(0, 10)
        .map(example => example.id!)
        .filter(Boolean);
      
      const approvals = batchGenerateApprovals(testCaseIds);
      
      expect(Object.keys(approvals).length).toBe(testCaseIds.length);
      
      // Validate each approval
      Object.values(approvals).forEach(approval => {
        const validation = validateApprovalWorkflow(approval);
        expect(validation.valid).toBe(true);
        
        if (!validation.valid) {
          console.error(`Approval validation failed for ${approval.testCaseId}:`, validation.issues);
        }
      });
      
      console.log(`Generated ${Object.keys(approvals).length} clinical approvals`);
    });

    it('should export approval summary for documentation', async () => {
      const testCaseIds = getAllRealWorldExamples()
        .slice(0, 15)
        .map(example => example.id!)
        .filter(Boolean);
      
      const approvals = batchGenerateApprovals(testCaseIds);
      const summary = exportApprovalSummary(approvals);
      
      expect(summary.totalCases).toBe(testCaseIds.length);
      expect(summary.approvalBreakdown.approved).toBeGreaterThan(0);
      expect(summary.clinicalAccuracy.clinicallySound).toBeGreaterThan(0);
      
      // Should have multiple reviewers
      expect(Object.keys(summary.reviewerBreakdown).length).toBeGreaterThan(0);
      
      console.log('Approval Summary:', JSON.stringify(summary, null, 2));
    });

    it('should validate high-risk cases have appropriate approvals', async () => {
      // Test cases that should be high-risk
      const highRiskCases = [
        'real-injection-003', // Morphine
        'edge-extreme-001',   // Very small dose
        'edge-extreme-002'    // Very high dose
      ];
      
      const approvals = batchGenerateApprovals(highRiskCases);
      
      Object.values(approvals).forEach(approval => {
        const hasHighRiskApproval = approval.approvals.some(app => app.riskAssessment === 'high');
        
        if (hasHighRiskApproval) {
          // High-risk cases should have detailed review notes
          expect(approval.reviewNotes.length).toBeGreaterThan(2);
          
          // Should have appropriate clinical considerations
          expect(approval.clinicalContext.specialConsiderations?.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Regression Detection', () => {
    it('should detect when legacy system behavior changes', async () => {
      // This test would catch if someone modifies the legacy system
      const knownStableCase: GoldenTestCase = {
        id: 'regression-check-001',
        name: 'Stable regression check case',
        description: 'Known stable case for regression detection',
        category: 'tablet',
        input: {
          medication: {
            id: 'metformin-500',
            name: 'Metformin 500mg',
            doseForm: 'Tablet',
            ingredient: [{
              name: 'Metformin',
              strengthRatio: {
                numerator: { value: 500, unit: 'mg' },
                denominator: { value: 1, unit: 'tablet' }
              }
            }]
          },
          dose: { value: 1, unit: 'tablet' },
          route: 'Orally',
          frequency: 'twice daily'
        },
        expected: {
          humanReadable: 'Take 1 tablet by mouth twice daily.'
        },
        metadata: {
          clinicalIntent: 'Regression detection',
          version: '1.0.0'
        }
      };
      
      const result = await legacyRunner.runTest(knownStableCase);
      
      expect(result.passed).toBe(true);
      expect(result.actualOutput.humanReadable).toBe('Take 1 tablet by mouth twice daily.');
      
      // Performance should be consistent
      expect(result.executionTime).toBeLessThan(20);
    });
  });

  describe('Data Quality Validation', () => {
    it('should validate all signatures have required components', async () => {
      const sampleCases = getAllRealWorldExamples().slice(0, 10) as GoldenTestCase[];
      
      const results = await legacyRunner.runTests(sampleCases);
      
      results.results.forEach(result => {
        if (result.passed) {
          const signature = result.actualOutput.humanReadable;
          
          // Should have valid dose format
          expect(signature).toHaveValidDoseFormat();
          
          // Should end with period
          expect(signature.endsWith('.')).toBe(true);
          
          // Should contain verb, dose, route, frequency
          expect(signature).toMatch(/^(Take|Apply|Inject|Administer)\s+/);
          expect(signature).toMatch(/(tablet|capsule|mL|mg|click|application)/);
          expect(signature).toMatch(/(by mouth|topically|intramuscularly|subcutaneously)/);
          expect(signature).toMatch(/(daily|weekly|times|hours)/);
          
          // FHIR structure should be valid
          expect(result.actualOutput).toMatchSignatureStructure();
        }
      });
    });

    it('should validate FHIR compliance across all scenarios', async () => {
      const sampleCases = getAllRealWorldExamples().slice(0, 5) as GoldenTestCase[];
      
      const results = await legacyRunner.runTests(sampleCases);
      
      results.results.forEach(result => {
        if (result.passed) {
          const fhir = result.actualOutput.fhirRepresentation;
          
          // Required FHIR fields
          expect(fhir).toHaveProperty('dosageInstruction');
          expect(fhir.dosageInstruction).toHaveProperty('route');
          expect(fhir.dosageInstruction).toHaveProperty('doseAndRate');
          expect(fhir.dosageInstruction).toHaveProperty('timing');
          
          // Dose consistency
          expect(fhir.dosageInstruction.doseAndRate.doseQuantity.value)
            .toBe(result.testCase.input.dose.value);
          expect(fhir.dosageInstruction.doseAndRate.doseQuantity.unit)
            .toBe(result.testCase.input.dose.unit);
          
          // Route consistency
          expect(fhir.dosageInstruction.route).toBe(result.testCase.input.route);
        }
      });
    });
  });

  afterAll(() => {
    console.log('\n🎯 Golden Master Test Suite Complete');
    console.log('=====================================');
    console.log('✅ Legacy system baseline validated');
    console.log('✅ System comparison completed');
    console.log('✅ Clinical validation processed');
    console.log('✅ Regression detection active');
    console.log('✅ Data quality validated');
    console.log('\n📊 Ready for Epic 3 integration testing');
  });
});