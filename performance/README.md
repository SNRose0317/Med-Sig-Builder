# Performance Testing Suite

Artillery-based load testing configuration for the Med Sig Builder application.

## SNR-125: Artillery Load Testing Setup ✅

### Quick Start

```bash
# Install Artillery globally
npm run artillery:install

# Run basic performance test
npm run artillery:performance

# Run stress test  
npm run artillery:stress

# Quick health check
npm run artillery:quick

# Run all performance tests
npm run perf:all

# Generate CI report
npm run perf:ci
npm run perf:report
```

### Test Configurations

#### 1. `load-test.yml` - Comprehensive Performance Testing
- **Purpose**: Validates performance under normal and peak load conditions
- **Phases**: Warm-up → Normal → Peak → Stress → Spike → Cool-down
- **Thresholds**: P50 < 20ms, P95 < 50ms, P99 < 100ms, 1000+ ops/sec
- **Scenarios**: 
  - Strategy Dispatcher Load Test (40%)
  - Golden Master Execution (25%) 
  - Builder Factory Stress Test (20%)
  - Memory Usage Monitor (10%)
  - Concurrent User Workflow (5%)

#### 2. `stress-test.yml` - High Load Stress Testing
- **Purpose**: Tests system behavior under extreme load conditions
- **Phases**: Baseline → Ramp → Sustained → Extreme → Recovery
- **Thresholds**: P50 < 50ms, P95 < 200ms, P99 < 500ms, 500+ ops/sec
- **Scenarios**:
  - High Throughput Dispatch (50%)
  - Memory Pressure Test (20%)
  - Stress User Workflow (20%)
  - Resource Exhaustion (10%)

#### 3. `artillery.config.yml` - Basic Load Testing
- **Purpose**: Simple configuration for development testing
- **Focus**: Core dispatcher functionality with realistic medication scenarios
- **Test Data**: Uses realistic medication profiles and dosing scenarios

### Test Data

#### `test-data.csv`
40 realistic medication scenarios covering:
- Common tablets (Metformin, Lisinopril, Levothyroxine)
- Liquid medications (Amoxicillin suspension, Acetaminophen)
- Injectables (Testosterone, Insulin, Morphine)
- Topical medications (Estradiol cream, Hydrocortisone)
- Complex scenarios (Multi-ingredient, PRN dosing, Tapering)

#### `artillery-scenarios.js`
Custom JavaScript functions for dynamic test data generation:
- `frequency()` - Random prescription frequencies
- `liquidDose()` / `liquidUnit()` - Liquid medication variations
- `testosteroneDose()` - TRT dose ranges
- `topiclickDose()` - Topical dispenser variations
- `patientAge()` - Age-appropriate patient demographics

### Performance Requirements (SNR-124)

| Metric | Target | Test Coverage |
|--------|--------|---------------|
| P50 Latency | < 20ms | ✅ All tests |
| P95 Latency | < 50ms | ✅ All tests |
| P99 Latency | < 100ms | ✅ All tests |
| Throughput | > 1000 ops/sec | ✅ Load tests |
| Success Rate | > 99% | ✅ All tests |
| Memory Usage | < 50MB increase | ✅ Monitored |

### Monitoring & Reporting

#### Built-in Metrics
- HTTP response times (P50, P95, P99)
- Request rates and throughput
- Success/error rates by endpoint
- Memory usage tracking
- Concurrent user simulation

#### Integration Options
- **Prometheus**: Metrics export for monitoring dashboards
- **StatsD**: Real-time metrics streaming
- **CloudWatch**: AWS monitoring integration
- **JSON Reports**: CI/CD pipeline integration

### CI/CD Integration

#### Performance Gates (SNR-124)
```bash
# Run performance tests with CI reporting
npm run perf:ci

# Generate HTML report
npm run perf:report

# Exit codes indicate pass/fail based on thresholds
echo $? # 0 = pass, 1 = fail
```

#### GitHub Actions Integration (SNR-126)
The configuration supports environment variables for CI integration:
- `TARGET_URL` - Test target URL
- `PROMETHEUS_HOST/PORT` - Metrics destination
- `AWS_REGION` - CloudWatch integration
- `TEST_RUN_ID` - Unique test identification

### Usage Examples

#### Local Development
```bash
# Start the development server
npm run dev

# In another terminal, run quick test
npm run artillery:quick

# Run full performance suite
npm run benchmark
```

#### CI/CD Pipeline
```bash
# Set environment variables
export TARGET_URL=https://staging.med-sig-builder.com
export PROMETHEUS_HOST=metrics.company.com

# Run CI performance tests
npm run perf:ci

# Check results
if [ $? -eq 0 ]; then
  echo "Performance tests passed"
else
  echo "Performance tests failed - check thresholds"
  exit 1
fi
```

#### Production Monitoring
```bash
# Run continuous monitoring against production
artillery run performance/load-test.yml \
  --target https://prod.med-sig-builder.com \
  --output production-metrics.json

# Generate production report
artillery report production-metrics.json
```

### Performance Optimization

Based on existing benchmarks in `src/lib/dispatcher/__tests__/performance.benchmark.ts`:

1. **Dispatcher Overhead**: Already < 2ms average
2. **Absolute Performance**: P95 < 50ms requirement met
3. **Scalability**: Maintains performance with 100+ strategies
4. **Memory Usage**: < 50MB increase over 10k operations

### Troubleshooting

#### Common Issues
1. **High Response Times**: Check server resources, database connections
2. **Memory Leaks**: Monitor heap usage, review object retention
3. **Throughput Limits**: Verify connection pooling, server capacity

#### Debugging
```bash
# Run with verbose output
artillery run performance/load-test.yml --verbose

# Monitor system resources during test
top -p $(pgrep node)

# Check for memory leaks
node --expose-gc your-app.js
```

### Next Steps

✅ **SNR-125 Complete**: Artillery configuration implemented with comprehensive test scenarios

⏳ **SNR-126**: GitHub Actions integration for automated performance testing

⏳ **SNR-124**: CI/CD performance gates implementation with threshold enforcement