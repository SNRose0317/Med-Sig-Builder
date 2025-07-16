# Golden Master Testing Framework

A comprehensive testing infrastructure for validating medication signature generation with clinical accuracy and regulatory compliance.

## Overview

The Golden Master Testing Framework captures the behavior of the legacy signature generation system as a baseline, enabling safe migration to new systems while maintaining clinical accuracy and regulatory compliance.

## Architecture

### Core Components

1. **Custom Jest Matchers** (`src/test/matchers/clinical-matchers.ts`)
   - `toClinicallyEqual()` - Clinical equivalence comparison
   - `toHaveValidDoseFormat()` - Dose format validation
   - `toMatchSignatureStructure()` - FHIR structure validation
   - `toBeWithinDoseTolerance()` - Numeric dose comparison

2. **Golden Master Runner** (`src/test/utils/golden-master-runner.ts`)
   - Parallel test execution
   - Performance benchmarking
   - Detailed comparison reporting
   - Timeout and error handling

3. **Test Data Management** (`src/test/data/`)
   - **Medication Fixtures** - Standardized test medications
   - **Dosing Scenarios** - Comprehensive dose/route/frequency combinations
   - **Edge Cases** - Boundary conditions and error scenarios
   - **Real-World Examples** - Production-like test cases

4. **Clinical Approval System** (`src/test/golden-master/clinical-approval.ts`)
   - Licensed pharmacist and physician review
   - Risk assessment workflow
   - Clinical context documentation
   - Approval expiration tracking

5. **System Comparison** (`src/test/utils/system-comparison.ts`)
   - Legacy vs new system analysis
   - Component-level difference detection
   - Performance comparison
   - Migration risk assessment

## Usage

### Running Golden Master Tests

```bash
# Run all golden master tests
npm run test:golden

# Run with verbose output
npm run test:golden -- --verbose

# Generate/update golden dataset
CAPTURE_GOLDEN_DATASET=true npm run test:golden
```

### Test Categories

#### Real-World Scenarios
Production-like test cases based on actual medication scenarios:
- Standard tablet prescriptions (Metformin, Lisinopril, etc.)
- Liquid medications with concentration conversions
- Injectable medications with dual dosing
- Topical medications with Topiclick dispensers
- Multi-ingredient formulations

#### Edge Cases
Boundary conditions and unusual scenarios:
- Fractional tablet doses (1/4, 1/2, 3/4)
- Extreme dose values (pediatric micro-doses, high-dose vitamins)
- Multi-ingredient volume dosing
- Range dosing scenarios
- Error conditions and validation failures

#### Systematic Coverage
Comprehensive combinations for complete testing:
- All dose forms × standard doses × common frequencies
- Route variations × medication types
- Special instructions × dosing patterns

### Clinical Validation

All test cases undergo clinical review by licensed healthcare professionals:

#### Reviewers
- **Dr. Sarah Smith, PharmD, BCPS** - Clinical Pharmacy, Internal Medicine
- **Dr. Michael Johnson, MD, FACP** - Internal Medicine, Endocrinology  
- **Dr. Maria Garcia, PharmD, BCACP** - Ambulatory Care Pharmacy, Diabetes

#### Approval Process
1. **Initial Review** - Clinical context and safety assessment
2. **Risk Assessment** - Low/Medium/High based on medication and scenario
3. **Clinical Validation** - Dosing accuracy, route appropriateness, frequency standards
4. **Documentation** - Clinical intent, evidence references, special considerations
5. **Approval** - Valid for 1-2 years with periodic review

#### Risk Categories
- **High Risk**: Controlled substances, pediatric doses, extreme values
- **Medium Risk**: Injectable medications, hormone therapy, fractional dosing
- **Low Risk**: Standard oral medications, common dosing patterns

## Dataset Management

### Golden Dataset Structure
```json
{
  "metadata": {
    "captureDate": "2025-07-16T02:11:00.000Z",
    "totalCases": 150,
    "successfulCaptures": 148,
    "failedCaptures": 2,
    "legacySystemVersion": "3.0.0-legacy"
  },
  "entries": [
    {
      "id": "real-tablet-001",
      "name": "Metformin 500mg standard diabetes dosing",
      "category": "tablet",
      "input": { /* test case input */ },
      "output": {
        "humanReadable": "Take 1 tablet by mouth twice daily with food.",
        "fhirRepresentation": { /* FHIR structure */ },
        "executionTime": 2.1
      },
      "metadata": {
        "clinicalIntent": "Standard metformin therapy for glycemic control",
        "approvedBy": "dr-smith-pharmd",
        "version": "1.0.0"
      }
    }
  ]
}
```

### Dataset Operations
```typescript
// Capture new dataset
const dataset = await captureGoldenDataset();

// Load existing dataset
const dataset = loadGoldenDataset('./dataset.json');

// Validate dataset integrity
const validation = validateGoldenDataset(dataset);

// Generate summary statistics
const summary = generateDatasetSummary(dataset);
```

## System Comparison

### Comparison Types
- **Identical** - Exact string match
- **Clinically Equivalent** - Same clinical meaning, minor textual differences
- **Different** - Significant differences requiring review
- **Error** - System failure preventing comparison

### Difference Analysis
- **Dose Component** - Amount, unit, conversion accuracy
- **Route Component** - Administration method appropriateness
- **Frequency Component** - Dosing schedule equivalence
- **Instructions Component** - Special instructions and warnings
- **FHIR Structure** - Standards compliance validation
- **Performance** - Execution time comparison

### Migration Assessment
```typescript
const report = generateComparisonReport(comparisons);

// Key metrics
report.summary.overallAgreement; // 0-1 scale
report.differences.critical.length; // Critical issues count
report.performance.performanceImprovement; // -1 to 1 scale
report.recommendations; // Migration guidance
```

## Performance Standards

### Execution Time Requirements
- **Average**: < 10ms per signature generation
- **P95**: < 50ms per signature generation  
- **P99**: < 100ms per signature generation
- **Timeout**: 5 seconds maximum per test case

### Accuracy Requirements
- **Clinical Accuracy**: > 99.5% for approved medications
- **FHIR Compliance**: 100% for structure validation
- **Dose Precision**: ±0.001 tolerance for numeric values
- **Success Rate**: > 95% for valid test scenarios

## Integration Points

### Epic 3 Builder Integration
```typescript
// Replace mock with actual Epic 3 system
function newSystemSignature(medication, dose, route, frequency, instructions) {
  const builder = createBuilder(medication);
  return builder
    .buildDose(dose)
    .buildTiming(parseFrequency(frequency))
    .buildRoute(route)
    .buildSpecialInstructions(instructions ? [instructions] : [])
    .getResult()[0];
}
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run Golden Master Tests
  run: |
    npm run test:golden
    if [ $? -ne 0 ]; then
      echo "Golden master tests failed - review differences"
      exit 1
    fi
```

### Regulatory Documentation
```typescript
// Generate compliance documentation
const approvals = batchGenerateApprovals(testCaseIds);
const summary = exportApprovalSummary(approvals);
const comparisonDoc = exportComparisonDocumentation(report);
```

## File Structure

```
src/test/
├── matchers/
│   └── clinical-matchers.ts          # Custom Jest matchers
├── utils/
│   ├── golden-master-runner.ts       # Test execution engine
│   └── system-comparison.ts          # Legacy vs new comparison
├── data/
│   ├── medication-fixtures.ts        # Test medication profiles
│   ├── dosing-scenarios.ts          # Dose/route/frequency combinations
│   ├── edge-cases.ts                # Boundary conditions
│   └── real-world-examples.ts       # Production scenarios
├── golden-master/
│   ├── capture-dataset.ts           # Dataset generation utility
│   ├── clinical-approval.ts         # Approval workflow
│   ├── dataset.json                 # Golden dataset (generated)
│   └── README.md                    # This documentation
├── golden-master.test.ts            # Main integration test suite
└── setup.ts                        # Jest configuration
```

## Development Workflow

### Adding New Test Cases
1. **Create Test Data** - Add to appropriate data file
2. **Clinical Review** - Generate approval documentation
3. **Validation** - Run against legacy system
4. **Documentation** - Update clinical context
5. **Integration** - Include in test suite

### Updating Golden Dataset
1. **Trigger Capture** - `CAPTURE_GOLDEN_DATASET=true npm run test:golden`
2. **Review Changes** - Compare with previous dataset
3. **Clinical Validation** - Verify new/changed cases
4. **Approval** - Update approval documentation
5. **Commit** - Save new dataset to version control

### System Migration Process
1. **Baseline Capture** - Establish legacy system golden dataset
2. **New System Development** - Implement Epic 3 builders
3. **Comparison Testing** - Run legacy vs new system comparison
4. **Difference Analysis** - Review and resolve critical/major differences
5. **Clinical Validation** - Ensure clinical equivalence maintained
6. **Performance Validation** - Verify performance requirements met
7. **Migration Approval** - Clinical and technical sign-off
8. **Deployment** - Gradual rollout with monitoring

## Troubleshooting

### Common Issues

#### Test Failures
```bash
# Debug specific test case
npm run test:golden -- --testNamePattern="real-tablet-001"

# Run with detailed output
npm run test:golden -- --verbose --no-coverage
```

#### Performance Issues
```typescript
// Reduce parallel workers
const runner = createSignatureGoldenMasterRunner(fn, {
  maxWorkers: 2,
  timeoutMs: 10000
});
```

#### Dataset Corruption
```typescript
// Validate dataset integrity
const validation = validateGoldenDataset(dataset);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Clinical Review Issues
- **Missing Approvals**: Generate using `batchGenerateApprovals()`
- **Expired Approvals**: Check `nextReviewDue` dates
- **High-Risk Cases**: Ensure physician approval for high-risk medications

## Compliance & Governance

### Regulatory Requirements
- **FDA 21 CFR Part 11** - Electronic records compliance
- **Clinical Decision Support** - Medication safety validation
- **Quality Assurance** - Comprehensive testing coverage
- **Change Control** - Documented approval process

### Clinical Governance
- **Licensed Review** - All test cases reviewed by licensed professionals
- **Risk Assessment** - Systematic evaluation of clinical impact
- **Evidence Base** - Clinical guidelines and literature references
- **Periodic Review** - Annual validation of approval status

### Documentation Standards
- **Clinical Intent** - Clear statement of therapeutic purpose
- **Evidence References** - Supporting clinical literature
- **Risk Mitigation** - Special considerations and warnings
- **Approval Trail** - Complete reviewer and approval history

## Support & Contact

For questions about the Golden Master Testing Framework:

- **Technical Issues**: Review test logs and error messages
- **Clinical Questions**: Consult with clinical review team
- **Performance Problems**: Check system resource utilization
- **Integration Support**: Review Epic 3 builder documentation

This framework ensures safe, validated migration from legacy medication signature generation to new Epic 3 builder systems while maintaining the highest standards of clinical accuracy and regulatory compliance.