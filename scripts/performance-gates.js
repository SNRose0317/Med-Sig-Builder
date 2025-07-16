#!/usr/bin/env node

/**
 * Performance Gates Implementation
 * SNR-124: CI/CD Performance Gates
 * 
 * Enforces performance thresholds in CI/CD pipeline
 * Integrates with Artillery test results and existing Jest benchmarks
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds configuration
const PERFORMANCE_GATES = {
  // Latency thresholds (milliseconds)
  latency: {
    p50: {
      threshold: 20,
      description: '50th percentile latency',
      critical: true
    },
    p95: {
      threshold: 50,
      description: '95th percentile latency',
      critical: true
    },
    p99: {
      threshold: 100,
      description: '99th percentile latency',
      critical: false
    }
  },
  
  // Throughput thresholds (operations per second)
  throughput: {
    min_rps: {
      threshold: 1000,
      description: 'Minimum requests per second',
      critical: true
    }
  },
  
  // Reliability thresholds (percentages)
  reliability: {
    success_rate: {
      threshold: 99.0,
      description: 'Success rate percentage',
      critical: true
    },
    error_rate: {
      threshold: 1.0,
      description: 'Maximum error rate percentage',
      critical: true
    }
  },
  
  // Resource thresholds
  resources: {
    memory_increase: {
      threshold: 50, // MB
      description: 'Maximum memory increase during load testing',
      critical: false
    },
    cpu_utilization: {
      threshold: 80, // Percentage
      description: 'Maximum CPU utilization',
      critical: false
    }
  }
};

class PerformanceGateEvaluator {
  constructor(config = PERFORMANCE_GATES) {
    this.gates = config;
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      summary: {}
    };
  }

  /**
   * Evaluate Artillery test results against performance gates
   */
  async evaluateArtilleryResults(resultsFile) {
    if (!fs.existsSync(resultsFile)) {
      throw new Error(`Artillery results file not found: ${resultsFile}`);
    }

    const data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    const aggregate = data.aggregate;

    console.log('📊 Evaluating Artillery Performance Results...\n');

    // Evaluate latency gates
    this.evaluateLatencyGates(aggregate.latency);
    
    // Evaluate throughput gates
    this.evaluateThroughputGates(aggregate.rps);
    
    // Evaluate reliability gates
    this.evaluateReliabilityGates(aggregate);
    
    return this.generateReport();
  }

  /**
   * Evaluate Jest performance benchmark results
   */
  async evaluateJestBenchmarks(benchmarkDir = './src/lib/dispatcher/__tests__') {
    console.log('🧪 Evaluating Jest Performance Benchmarks...\n');
    
    // Look for performance benchmark results
    const benchmarkFiles = fs.readdirSync(benchmarkDir)
      .filter(file => file.includes('performance') && file.endsWith('.test.ts'));
    
    if (benchmarkFiles.length === 0) {
      console.log('⚠️ No Jest performance benchmarks found');
      return;
    }

    // Run benchmarks and capture results
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npm', ['run', 'test:performance'], {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      jest.stdout.on('data', (data) => {
        output += data.toString();
      });

      jest.on('close', (code) => {
        if (code === 0) {
          this.parseBenchmarkOutput(output);
          resolve();
        } else {
          reject(new Error(`Jest benchmarks failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Parse Jest benchmark output for performance metrics
   */
  parseBenchmarkOutput(output) {
    const lines = output.split('\n');
    
    lines.forEach(line => {
      // Look for performance metrics in Jest output
      if (line.includes('Average performance:')) {
        const match = line.match(/(\d+\.?\d*)ms/);
        if (match) {
          const avgLatency = parseFloat(match[1]);
          this.evaluateGate('jest_avg_latency', avgLatency, 2, 'Jest average dispatcher latency', true);
        }
      }
      
      if (line.includes('P95:')) {
        const match = line.match(/P95: (\d+\.?\d*)ms/);
        if (match) {
          const p95Latency = parseFloat(match[1]);
          this.evaluateGate('jest_p95_latency', p95Latency, 50, 'Jest P95 dispatcher latency', true);
        }
      }
    });
  }

  /**
   * Evaluate latency-related performance gates
   */
  evaluateLatencyGates(latency) {
    console.log('🚀 Latency Gates:');
    
    Object.entries(this.gates.latency).forEach(([metric, config]) => {
      const actualValue = latency[metric];
      this.evaluateGate(
        `latency_${metric}`,
        actualValue,
        config.threshold,
        config.description,
        config.critical
      );
    });
    
    console.log('');
  }

  /**
   * Evaluate throughput-related performance gates
   */
  evaluateThroughputGates(rps) {
    console.log('⚡ Throughput Gates:');
    
    const avgRps = rps.mean || rps.avg || rps;
    this.evaluateGate(
      'throughput_rps',
      avgRps,
      this.gates.throughput.min_rps.threshold,
      this.gates.throughput.min_rps.description,
      this.gates.throughput.min_rps.critical,
      'minimum'
    );
    
    console.log('');
  }

  /**
   * Evaluate reliability-related performance gates
   */
  evaluateReliabilityGates(aggregate) {
    console.log('🛡️ Reliability Gates:');
    
    // Calculate success rate
    const totalRequests = aggregate.codes ? Object.values(aggregate.codes).reduce((a, b) => a + b, 0) : 0;
    const successfulRequests = aggregate.codes?.['200'] || 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    
    this.evaluateGate(
      'reliability_success_rate',
      successRate,
      this.gates.reliability.success_rate.threshold,
      this.gates.reliability.success_rate.description,
      this.gates.reliability.success_rate.critical,
      'minimum'
    );
    
    // Calculate error rate
    const errorRequests = totalRequests - successfulRequests;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    this.evaluateGate(
      'reliability_error_rate',
      errorRate,
      this.gates.reliability.error_rate.threshold,
      this.gates.reliability.error_rate.description,
      this.gates.reliability.error_rate.critical,
      'maximum'
    );
    
    console.log('');
  }

  /**
   * Evaluate a single performance gate
   */
  evaluateGate(gateId, actualValue, threshold, description, isCritical, comparison = 'maximum') {
    const passed = comparison === 'minimum' ? 
      actualValue >= threshold : 
      actualValue <= threshold;
    
    const status = passed ? '✅ PASS' : (isCritical ? '❌ FAIL' : '⚠️ WARN');
    const operator = comparison === 'minimum' ? '>=' : '<=';
    
    console.log(`  ${status} ${description}: ${actualValue.toFixed(2)} ${operator} ${threshold}`);
    
    const result = {
      gateId,
      description,
      actualValue,
      threshold,
      passed,
      critical: isCritical,
      comparison
    };
    
    if (passed) {
      this.results.passed.push(result);
    } else if (isCritical) {
      this.results.failed.push(result);
    } else {
      this.results.warnings.push(result);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    const totalGates = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
    const passedGates = this.results.passed.length;
    const failedGates = this.results.failed.length;
    const warningGates = this.results.warnings.length;
    
    this.results.summary = {
      totalGates,
      passedGates,
      failedGates,
      warningGates,
      overallStatus: failedGates === 0 ? 'PASS' : 'FAIL',
      passRate: (passedGates / totalGates) * 100
    };
    
    console.log('📋 Performance Gates Summary:');
    console.log(`  Total Gates: ${totalGates}`);
    console.log(`  Passed: ${passedGates} ✅`);
    console.log(`  Failed: ${failedGates} ${failedGates > 0 ? '❌' : ''}`);
    console.log(`  Warnings: ${warningGates} ${warningGates > 0 ? '⚠️' : ''}`);
    console.log(`  Pass Rate: ${this.results.summary.passRate.toFixed(1)}%`);
    console.log(`  Overall Status: ${this.results.summary.overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    
    return this.results;
  }

  /**
   * Export results to JSON for CI integration
   */
  exportResults(outputFile = 'performance-gates-results.json') {
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results exported to: ${outputFile}`);
  }

  /**
   * Generate GitHub Actions job summary
   */
  generateGitHubSummary() {
    const summary = [
      '## 🎯 Performance Gates Report',
      '',
      '### Summary',
      `- **Total Gates**: ${this.results.summary.totalGates}`,
      `- **Passed**: ${this.results.summary.passedGates} ✅`,
      `- **Failed**: ${this.results.summary.failedGates} ${this.results.summary.failedGates > 0 ? '❌' : ''}`,
      `- **Warnings**: ${this.results.summary.warningGates} ${this.results.summary.warningGates > 0 ? '⚠️' : ''}`,
      `- **Pass Rate**: ${this.results.summary.passRate.toFixed(1)}%`,
      `- **Overall Status**: ${this.results.summary.overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}`,
      '',
      '### Gate Details',
      '',
      '| Gate | Actual | Threshold | Status |',
      '|------|--------|-----------|---------|'
    ];

    // Add all gate results
    [...this.results.passed, ...this.results.failed, ...this.results.warnings].forEach(gate => {
      const status = gate.passed ? '✅ PASS' : (gate.critical ? '❌ FAIL' : '⚠️ WARN');
      const operator = gate.comparison === 'minimum' ? '>=' : '<=';
      summary.push(`| ${gate.description} | ${gate.actualValue.toFixed(2)} | ${operator} ${gate.threshold} | ${status} |`);
    });

    summary.push('');
    
    if (this.results.summary.overallStatus === 'FAIL') {
      summary.push('🚨 **Performance gates failed!** Review the metrics above and optimize before deployment.');
    } else {
      summary.push('🎉 **All critical performance gates passed!** Ready for deployment.');
    }

    return summary.join('\n');
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'evaluate';
  
  console.log('🎯 Performance Gates CI/CD Integration\n');
  
  const evaluator = new PerformanceGateEvaluator();
  
  try {
    switch (command) {
      case 'evaluate':
        // Look for Artillery results first
        const artilleryResults = [
          'artillery-report.json',
          'load-test-results.json',
          'performance-results.json'
        ].find(file => fs.existsSync(file));
        
        if (artilleryResults) {
          await evaluator.evaluateArtilleryResults(artilleryResults);
        } else {
          console.log('⚠️ No Artillery results found, running Jest benchmarks only');
        }
        
        // Always run Jest benchmarks if available
        try {
          await evaluator.evaluateJestBenchmarks();
        } catch (error) {
          console.log(`⚠️ Jest benchmarks failed: ${error.message}`);
        }
        
        break;
        
      case 'jest-only':
        await evaluator.evaluateJestBenchmarks();
        break;
        
      case 'artillery-only':
        const resultsFile = args[1] || 'artillery-report.json';
        await evaluator.evaluateArtilleryResults(resultsFile);
        break;
        
      default:
        console.log('Usage: node performance-gates.js [evaluate|jest-only|artillery-only] [results-file]');
        process.exit(1);
    }
    
    // Export results for CI
    evaluator.exportResults();
    
    // Generate GitHub summary if in CI environment
    if (process.env.GITHUB_ACTIONS) {
      const summary = evaluator.generateGitHubSummary();
      if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
      }
    }
    
    // Exit with appropriate code
    const exitCode = evaluator.results.summary.overallStatus === 'PASS' ? 0 : 1;
    console.log(`\n🎯 Performance gates ${exitCode === 0 ? 'PASSED' : 'FAILED'}`);
    process.exit(exitCode);
    
  } catch (error) {
    console.error(`❌ Performance gates evaluation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PerformanceGateEvaluator, PERFORMANCE_GATES };