/**
 * Legacy Signature Generation Golden Master Tests
 * 
 * Comprehensive test suite that captures the current behavior of the legacy
 * signature generation system as golden master baseline for regression testing.
 * 
 * @since 3.1.0
 */

import { generateSignature } from '../signature';
import type { GoldenTestCase } from '../../test/utils/golden-master-runner';
import { createSignatureGoldenMasterRunner } from '../../test/utils/golden-master-runner';
import { MEDICATION_FIXTURES } from '../../test/data/medication-fixtures';
import { DOSING_SCENARIOS } from '../../test/data/dosing-scenarios';
import { getAllEdgeCases } from '../../test/data/edge-cases';
import { getAllRealWorldExamples } from '../../test/data/real-world-examples';

/**
 * Test case generator - combines medications with dosing scenarios
 */
function generateTestCases(): GoldenTestCase[] {
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

  // Generate systematic combinations for comprehensive coverage
  const systematicCases = generateSystematicTestCases();
  testCases.push(...systematicCases);

  return testCases;
}

/**
 * Generate systematic test cases for comprehensive coverage
 */
function generateSystematicTestCases(): GoldenTestCase[] {
  const testCases: GoldenTestCase[] = [];
  let caseId = 1000; // Start with high number to avoid conflicts

  // Test all tablet medications with standard doses
  const tabletMeds = [
    MEDICATION_FIXTURES.tablets.metformin500,
    MEDICATION_FIXTURES.tablets.lisinopril10,
    MEDICATION_FIXTURES.tablets.levothyroxine25,
    MEDICATION_FIXTURES.tablets.omeprazole20
  ];

  const tabletDoses = DOSING_SCENARIOS.doses.tablets;
  const commonFrequencies = ['once daily', 'twice daily', 'three times daily'];

  tabletMeds.forEach(medication => {
    tabletDoses.forEach(doseScenario => {
      commonFrequencies.forEach(frequency => {
        testCases.push({
          id: `sys-tablet-${caseId++}`,
          name: `${medication.name} ${doseScenario.description} ${frequency}`,
          description: `Systematic test: ${medication.name} with ${doseScenario.description}`,
          category: 'tablet',
          input: {
            medication,
            dose: doseScenario.dose,
            route: 'by mouth',
            frequency
          },
          expected: {
            humanReadable: '' // Will be captured during test run
          },
          metadata: {
            clinicalIntent: `Systematic tablet testing`,
            version: '1.0.0'
          }
        });
      });
    });
  });

  // Test liquid medications with volume and weight doses
  const liquidMeds = [
    MEDICATION_FIXTURES.liquids.amoxicillinSuspension,
    MEDICATION_FIXTURES.liquids.acetaminophenSolution,
    MEDICATION_FIXTURES.liquids.insulin
  ];

  const liquidVolumes = DOSING_SCENARIOS.doses.volumes.slice(0, 8); // First 8 scenarios
  const liquidWeights = DOSING_SCENARIOS.doses.weights.slice(0, 8); // First 8 scenarios

  liquidMeds.forEach(medication => {
    // Test volume dosing
    liquidVolumes.forEach(doseScenario => {
      testCases.push({
        id: `sys-liquid-vol-${caseId++}`,
        name: `${medication.name} ${doseScenario.description} volume`,
        description: `Systematic liquid volume test: ${medication.name}`,
        category: 'liquid',
        input: {
          medication,
          dose: doseScenario.dose,
          route: 'by mouth',
          frequency: 'twice daily'
        },
        expected: {
          humanReadable: ''
        },
        metadata: {
          clinicalIntent: 'Systematic liquid volume testing',
          version: '1.0.0'
        }
      });
    });

    // Test weight dosing for medications with concentration
    if (medication.ingredient?.[0]?.strengthRatio) {
      liquidWeights.forEach(doseScenario => {
        testCases.push({
          id: `sys-liquid-weight-${caseId++}`,
          name: `${medication.name} ${doseScenario.description} weight`,
          description: `Systematic liquid weight test: ${medication.name}`,
          category: 'liquid',
          input: {
            medication,
            dose: doseScenario.dose,
            route: 'by mouth',
            frequency: 'twice daily'
          },
          expected: {
            humanReadable: ''
          },
          metadata: {
            clinicalIntent: 'Systematic liquid weight testing',
            version: '1.0.0'
          }
        });
      });
    }
  });

  // Test injectable medications
  const injectableMeds = [
    MEDICATION_FIXTURES.injectables.testosteroneCypionate,
    MEDICATION_FIXTURES.injectables.morphineInjection
  ];

  const injectionRoutes = ['intramuscularly', 'subcutaneously'];
  const injectionFrequencies = ['once weekly', 'twice weekly', 'once daily'];

  injectableMeds.forEach(medication => {
    injectionRoutes.forEach(route => {
      injectionFrequencies.forEach(frequency => {
        // Test both mg and mL dosing
        testCases.push({
          id: `sys-injection-mg-${caseId++}`,
          name: `${medication.name} mg dose ${route} ${frequency}`,
          description: `Injectable mg dosing test`,
          category: 'injection',
          input: {
            medication,
            dose: { value: 100, unit: 'mg' },
            route,
            frequency
          },
          expected: {
            humanReadable: ''
          },
          metadata: {
            clinicalIntent: 'Injectable mg dosing test',
            version: '1.0.0'
          }
        });

        testCases.push({
          id: `sys-injection-ml-${caseId++}`,
          name: `${medication.name} mL dose ${route} ${frequency}`,
          description: `Injectable mL dosing test`,
          category: 'injection',
          input: {
            medication,
            dose: { value: 0.5, unit: 'mL' },
            route,
            frequency
          },
          expected: {
            humanReadable: ''
          },
          metadata: {
            clinicalIntent: 'Injectable mL dosing test',
            version: '1.0.0'
          }
        });
      });
    });
  });

  // Test topical medications with Topiclick
  const topicalMeds = [
    MEDICATION_FIXTURES.topicals.hormoneCreams,
    MEDICATION_FIXTURES.topicals.hydrocortisoneCream
  ];

  const clickDoses = DOSING_SCENARIOS.doses.topicals.filter(d => d.dose.unit === 'click');
  const topicalFrequencies = ['once daily', 'twice daily'];

  topicalMeds.forEach(medication => {
    if (medication.dispenserInfo?.type === 'topiclick') {
      clickDoses.forEach(doseScenario => {
        topicalFrequencies.forEach(frequency => {
          testCases.push({
            id: `sys-topical-${caseId++}`,
            name: `${medication.name} ${doseScenario.description} ${frequency}`,
            description: `Topiclick dispenser test`,
            category: 'topical',
            input: {
              medication,
              dose: doseScenario.dose,
              route: 'topically',
              frequency,
              specialInstructions: 'using Topiclick dispenser'
            },
            expected: {
              humanReadable: ''
            },
            metadata: {
              clinicalIntent: 'Topiclick dispenser testing',
              version: '1.0.0'
            }
          });
        });
      });
    }
  });

  return testCases;
}

/**
 * Golden master test runner setup
 */
describe('Legacy Signature Generation Golden Master Tests', () => {
  let goldenMasterRunner: ReturnType<typeof createSignatureGoldenMasterRunner>;
  let testCases: GoldenTestCase[];

  beforeAll(() => {
    // Create the golden master runner
    goldenMasterRunner = createSignatureGoldenMasterRunner(
      (medication, dose, route, frequency, specialInstructions) => {
        return generateSignature(medication, dose, route, frequency, specialInstructions);
      },
      {
        parallelExecution: true,
        maxWorkers: 4,
        timeoutMs: 2000,
        enablePerformanceBenchmarks: true,
        strictComparison: false
      }
    );

    // Generate all test cases
    testCases = generateTestCases();
    
    console.log(`Generated ${testCases.length} golden master test cases`);
  });

  describe('Real World Scenarios', () => {
    it('should handle common tablet prescriptions correctly', async () => {
      const tabletCases = testCases.filter(tc => tc.category === 'tablet' && tc.id.startsWith('real-'));
      expect(tabletCases.length).toBeGreaterThan(0);

      const results = await goldenMasterRunner.runTests(tabletCases);
      
      expect(results.summary.successRate).toBeGreaterThan(0.95);
      expect(results.performance.averageExecutionTime).toBeLessThan(10);
    });

    it('should handle liquid medications with proper conversions', async () => {
      const liquidCases = testCases.filter(tc => tc.category === 'liquid' && tc.id.startsWith('real-'));
      expect(liquidCases.length).toBeGreaterThan(0);

      const results = await goldenMasterRunner.runTests(liquidCases);
      
      expect(results.summary.successRate).toBeGreaterThan(0.95);
      
      // Check for dual dosing in results
      const dualDosingResults = results.results.filter(r => 
        r.actualOutput.humanReadable.includes(' as ')
      );
      expect(dualDosingResults.length).toBeGreaterThan(0);
    });

    it('should handle injectable medications with dual display', async () => {
      const injectionCases = testCases.filter(tc => tc.category === 'injection' && tc.id.startsWith('real-'));
      expect(injectionCases.length).toBeGreaterThan(0);

      const results = await goldenMasterRunner.runTests(injectionCases);
      
      expect(results.summary.successRate).toBeGreaterThan(0.95);
      
      // All injection results should include dual dosing
      results.results.forEach(result => {
        if (result.passed) {
          expect(result.actualOutput.humanReadable).toMatch(/\d+(\.\d+)? mg, as \d+(\.\d+)? mL/);
        }
      });
    });

    it('should handle topical medications with Topiclick conversions', async () => {
      const topicalCases = testCases.filter(tc => tc.category === 'topical' && tc.id.startsWith('real-'));
      expect(topicalCases.length).toBeGreaterThan(0);

      const results = await goldenMasterRunner.runTests(topicalCases);
      
      expect(results.summary.successRate).toBeGreaterThan(0.95);
      
      // Check for Topiclick conversions
      const topiclickResults = results.results.filter(r => 
        r.actualOutput.humanReadable.includes('clicks') && 
        r.actualOutput.humanReadable.includes('mg')
      );
      expect(topiclickResults.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle fractional tablet doses correctly', async () => {
      const fractionalCases = testCases.filter(tc => 
        tc.id.startsWith('edge-fractional-') || 
        (tc.input.dose.value < 1 && tc.input.dose.unit === 'tablet')
      );
      
      if (fractionalCases.length > 0) {
        const results = await goldenMasterRunner.runTests(fractionalCases);
        
        // Check that fractional formatting is correct
        results.results.forEach(result => {
          if (result.passed && result.actualOutput.humanReadable.includes('tablet')) {
            expect(result.actualOutput.humanReadable).toMatch(/(1\/4|1\/2|3\/4|1 and 1\/2|2 and 1\/2) tablet/);
          }
        });
      }
    });

    it('should handle extreme dose values appropriately', async () => {
      const extremeCases = testCases.filter(tc => tc.id.startsWith('edge-extreme-'));
      
      if (extremeCases.length > 0) {
        const results = await goldenMasterRunner.runTests(extremeCases);
        
        // Should handle both very small and very large doses
        const smallDoses = results.results.filter(r => 
          r.actualOutput.humanReadable.includes('0.0')
        );
        const largeDoses = results.results.filter(r => 
          r.actualOutput.humanReadable.includes('50000')
        );
        
        expect(smallDoses.length + largeDoses.length).toBeGreaterThan(0);
      }
    });

    it('should handle multi-ingredient medications with volume dosing', async () => {
      const multiCases = testCases.filter(tc => tc.id.startsWith('edge-multi-') || tc.id.startsWith('real-multi-'));
      
      if (multiCases.length > 0) {
        const results = await goldenMasterRunner.runTests(multiCases);
        
        // Multi-ingredient should use volume dosing (clicks, mL) not mg dosing
        results.results.forEach(result => {
          if (result.passed) {
            const signature = result.actualOutput.humanReadable;
            if (signature.includes('clicks')) {
              // Should not show individual mg amounts for multi-ingredient
              expect(signature).not.toMatch(/\d+ mg,/);
            }
          }
        });
      }
    });
  });

  describe('Systematic Coverage', () => {
    it('should handle all tablet dose scenarios', async () => {
      const tabletCases = testCases.filter(tc => tc.category === 'tablet' && tc.id.startsWith('sys-'));
      expect(tabletCases.length).toBeGreaterThan(20);

      const results = await goldenMasterRunner.runTests(tabletCases);
      
      expect(results.summary.successRate).toBeGreaterThan(0.9);
      expect(results.performance.averageExecutionTime).toBeLessThan(5);
    });

    it('should handle all liquid dose scenarios', async () => {
      const liquidCases = testCases.filter(tc => tc.category === 'liquid' && tc.id.startsWith('sys-'));
      expect(liquidCases.length).toBeGreaterThan(20);

      const results = await goldenMasterRunner.runTests(liquidCases);
      
      expect(results.summary.successRate).toBeGreaterThan(0.9);
    });

    it('should maintain performance standards', async () => {
      // Test a subset for performance
      const performanceCases = testCases.slice(0, 50);
      
      const results = await goldenMasterRunner.runTests(performanceCases);
      
      expect(results.performance.averageExecutionTime).toBeLessThan(10); // 10ms average
      expect(results.performance.p95ExecutionTime).toBeLessThan(50); // 50ms P95
      expect(results.summary.executionTime).toBeLessThan(5000); // 5 seconds total
    });
  });

  describe('FHIR Compliance', () => {
    it('should generate valid FHIR representations', async () => {
      const sampleCases = testCases.slice(0, 10);
      
      const results = await goldenMasterRunner.runTests(sampleCases);
      
      results.results.forEach(result => {
        if (result.passed) {
          const fhir = result.actualOutput.fhirRepresentation;
          
          expect(fhir).toHaveProperty('dosageInstruction');
          expect(fhir.dosageInstruction).toHaveProperty('route');
          expect(fhir.dosageInstruction).toHaveProperty('doseAndRate');
          expect(fhir.dosageInstruction).toHaveProperty('timing');
          
          // Validate structure matches signature
          expect(fhir.dosageInstruction.doseAndRate.doseQuantity.value).toBe(result.testCase.input.dose.value);
          expect(fhir.dosageInstruction.doseAndRate.doseQuantity.unit).toBe(result.testCase.input.dose.unit);
        }
      });
    });
  });

  describe('Custom Matchers Validation', () => {
    it('should demonstrate clinical equivalence matching', async () => {
      // Test a few cases manually to validate custom matchers
      const testCase = testCases.find(tc => tc.id === 'real-tablet-001');
      if (testCase) {
        const result = await goldenMasterRunner.runTest(testCase);
        
        // Test our custom matcher
        expect(result.actualOutput.humanReadable).toClinicallyEqual('Take 1 tablet by mouth twice daily with food.');
        expect(result.actualOutput).toMatchSignatureStructure();
        expect(result.actualOutput.humanReadable).toHaveValidDoseFormat();
      }
    });

    it('should detect dose differences with tolerance', async () => {
      expect(1.0).toBeWithinDoseTolerance(1.001, 0.01);
      expect(0.5).toBeWithinDoseTolerance(0.499, 0.01);
    });
  });

  afterAll(async () => {
    // Generate final comprehensive report
    console.log('\n=== Golden Master Test Suite Summary ===');
    
    const allResults = await goldenMasterRunner.runTests(testCases);
    
    console.log(`Total Test Cases: ${allResults.summary.totalTests}`);
    console.log(`Passed: ${allResults.summary.passed}`);
    console.log(`Failed: ${allResults.summary.failed}`);
    console.log(`Success Rate: ${(allResults.summary.successRate * 100).toFixed(1)}%`);
    console.log(`Average Execution Time: ${allResults.performance.averageExecutionTime.toFixed(1)}ms`);
    console.log(`P95 Execution Time: ${allResults.performance.p95ExecutionTime.toFixed(1)}ms`);
    
    console.log('\nCategory Breakdown:');
    Object.entries(allResults.categorySummary).forEach(([category, stats]) => {
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${((stats.passed / stats.total) * 100).toFixed(1)}%)`);
    });
    
    if (allResults.failures.length > 0) {
      console.log('\nFailures:');
      allResults.failures.slice(0, 5).forEach(failure => {
        console.log(`  - ${failure.testCase.name}: ${failure.differences.join(', ')}`);
      });
    }
  });
});