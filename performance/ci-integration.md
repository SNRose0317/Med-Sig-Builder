# CI/CD Performance Gates Integration

## SNR-124: Complete Implementation ✅

### Overview

The CI/CD Performance Gates system provides automated performance validation in GitHub Actions workflows, ensuring that code changes meet performance standards before deployment.

### Components

#### 1. Performance Gates Script (`scripts/performance-gates.js`)
- **Purpose**: Evaluates performance metrics against predefined thresholds
- **Features**:
  - Artillery load test result analysis
  - Jest benchmark result evaluation
  - Configurable performance thresholds
  - GitHub Actions integration
  - JSON report generation

#### 2. CI Performance Gates Workflow (`.github/workflows/ci-performance-gates.yml`)
- **Purpose**: Automated performance validation in pull requests and pushes
- **Features**:
  - Jest performance benchmarks
  - Conditional Artillery load tests
  - Performance gates evaluation
  - PR comments with results
  - Workflow failure on gate violations

#### 3. Performance Monitoring Workflow (`.github/workflows/performance-monitoring.yml`)
- **Purpose**: Continuous performance monitoring of deployed environments
- **Features**:
  - Scheduled monitoring runs
  - Alerting via Slack/GitHub issues
  - Performance trend tracking
  - Environment-specific configurations

### Performance Thresholds

| Metric | Threshold | Critical | Description |
|--------|-----------|----------|-------------|
| P50 Latency | < 20ms | ✅ | 50th percentile response time |
| P95 Latency | < 50ms | ✅ | 95th percentile response time |
| P99 Latency | < 100ms | ⚠️ | 99th percentile response time |
| Throughput | > 1000 ops/sec | ✅ | Minimum requests per second |
| Success Rate | > 99% | ✅ | Percentage of successful requests |
| Memory Increase | < 50MB | ⚠️ | Memory usage during load testing |

### Usage

#### Local Development

```bash
# Run performance gates on existing results
npm run perf:gates

# Run Jest benchmarks only
npm run perf:gates:jest

# Run Artillery analysis only (requires results file)
npm run perf:gates:artillery

# Full performance validation
npm run benchmark && npm run perf:gates
```

#### CI/CD Integration

The performance gates automatically run on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual workflow dispatch

#### Workflow Configuration

```yaml
# Basic usage in another workflow
- name: Run Performance Gates
  uses: ./.github/workflows/ci-performance-gates.yml
  with:
    performance_threshold_p95: 50
    run_load_tests: true
```

#### Environment Variables

```bash
# Performance thresholds
PERFORMANCE_THRESHOLD_P50=20
PERFORMANCE_THRESHOLD_P95=50
PERFORMANCE_THRESHOLD_P99=100
THROUGHPUT_THRESHOLD=1000

# CI environment
GITHUB_ACTIONS=true
GITHUB_STEP_SUMMARY=/path/to/summary
```

### Reports and Outputs

#### Performance Gates Report (`performance-gates-results.json`)
```json
{
  "passed": [...],
  "failed": [...], 
  "warnings": [...],
  "summary": {
    "totalGates": 8,
    "passedGates": 7,
    "failedGates": 0,
    "warningGates": 1,
    "overallStatus": "PASS",
    "passRate": 87.5
  }
}
```

#### GitHub Actions Summary
- Automated job summary with performance metrics
- PR comments with detailed results
- Workflow status based on gate results

#### Slack Alerts (Production)
- Real-time alerts for performance degradation
- Configurable via `SLACK_WEBHOOK_URL` secret
- Production environment monitoring only

### Integration Points

#### With Existing Jest Benchmarks
- Automatically evaluates `src/lib/dispatcher/__tests__/performance.benchmark.ts`
- Validates dispatcher overhead < 2ms requirement
- Checks P95 latency against thresholds

#### With Artillery Load Tests
- Processes Artillery JSON results
- Validates latency percentiles
- Checks throughput and success rates
- Memory usage monitoring

#### With GitHub Actions
- Workflow status integration
- PR comments and reviews
- Artifact storage for reports
- Environment-specific configurations

### Failure Scenarios

#### Critical Gate Failures
- **Result**: Workflow fails, PR cannot be merged
- **Actions**: Review performance metrics, optimize code
- **Examples**: P50 > 20ms, Success rate < 99%

#### Warning Gate Failures
- **Result**: Workflow passes with warnings
- **Actions**: Monitor trends, consider optimization
- **Examples**: P99 > 100ms, Memory increase > 50MB

### Configuration Options

#### Custom Thresholds
Modify `PERFORMANCE_GATES` in `scripts/performance-gates.js`:

```javascript
const PERFORMANCE_GATES = {
  latency: {
    p50: { threshold: 15, critical: true },
    p95: { threshold: 40, critical: true }
  },
  throughput: {
    min_rps: { threshold: 1500, critical: true }
  }
};
```

#### Workflow Customization
- Conditional load test execution
- Environment-specific targets
- Custom artifact retention
- Alert configuration

### Monitoring and Alerting

#### Continuous Monitoring
- Runs every 6 hours on deployed environments
- Configurable monitoring duration
- Automatic issue creation for degradation

#### Alert Thresholds
- Production: Stricter thresholds, immediate alerts
- Staging: Relaxed thresholds, warning notifications
- Development: Basic monitoring only

### Best Practices

#### Development Workflow
1. Run local benchmarks before committing
2. Monitor PR performance gate results
3. Address failures before requesting review
4. Use warnings as optimization guidance

#### CI/CD Integration
1. Run gates on all PR changes
2. Block deployment on critical failures
3. Store performance history for trending
4. Alert on production degradation

#### Performance Optimization
1. Use gate failures to identify bottlenecks
2. Implement caching for repeated operations
3. Optimize database queries and API calls
4. Monitor memory usage and prevent leaks

### Troubleshooting

#### Common Issues
1. **Jest benchmarks not found**: Verify test file patterns
2. **Artillery results missing**: Check test execution logs
3. **Threshold violations**: Review recent code changes
4. **CI workflow failures**: Check environment setup

#### Debug Commands
```bash
# Verbose performance gates output
node scripts/performance-gates.js evaluate --verbose

# Manual Artillery run
artillery run performance/load-test.yml --output debug-results.json

# Jest benchmark debugging
npm run test:performance -- --verbose
```

### Next Steps

✅ **SNR-124 Complete**: Full CI/CD performance gates implementation

✅ **SNR-125 Complete**: Artillery load testing configuration

✅ **SNR-126 Complete**: GitHub Actions integration

🎯 **Epic 3 Complete**: All performance testing infrastructure ready for production use