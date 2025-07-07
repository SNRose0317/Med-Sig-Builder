# Medication Signature Builder Refactoring Project Plan

## Project Overview

**Goal**: Transform the medication signature builder from cascading complexity (720+ lines of tangled logic) into a robust, maintainable architecture using modern design patterns while maintaining all clinical functionality and safety.

**Timeline**: 10-12 weeks (extended from original 7-8 weeks to include validation and safe deployment)

**Key Outcomes**:
- Eliminate cascading complexity tied to dose form selection
- Reduce code from ~720 lines to ~500 lines
- Improve testability with 90%+ coverage
- Support complex medication regimens (tapering, concurrent, conditional)
- Ensure full FHIR R4 compliance
- Enable internationalization from day one

---

## Epic Structure

### Epic 1: Foundation & Core Contracts (Week 1-2)

**Objective**: Define the foundational contracts and data structures that will drive the entire refactoring.

#### Task 1.1: Define Core Data Models
- **Subtask 1.1.1**: Create MedicationProfile Interface
  - Include all existing Medication fields
  - Add flags: isFractional, isTaper, isMultiIngredient
  - Add concentrationRatio for liquids
  - Add molarMass for electrolyte conversions
  - Document with JSDoc comments
  - **Deliverable**: `src/types/MedicationProfile.ts`

- **Subtask 1.1.2**: Design SignatureInstruction Model (FHIR-compliant)
  - Mirror FHIR R4 Dosage resource structure
  - Support timing patterns (repeat, when[], asNeeded, bounds)
  - Include doseAndRate with quantity structure
  - Add relationship metadata (SEQUENTIAL, CONCURRENT, CONDITIONAL)
  - **Deliverable**: `src/types/SignatureInstruction.ts`

- **Subtask 1.1.3**: Create MedicationRequestContext DTO
  - Stable input contract for the system
  - Include medication profile, patient context, formulary flags
  - Decouple from internal representations
  - **Deliverable**: `src/types/MedicationRequestContext.ts`

#### Task 1.2: Design Architecture Patterns
- **Subtask 1.2.1**: Define ISignatureBuilder Interface
  - Methods: buildDose(), buildTiming(), buildRoute(), buildConstraints()
  - Support for getResult(): SignatureInstruction[]
  - **Deliverable**: `src/lib/builders/ISignatureBuilder.ts`

- **Subtask 1.2.2**: Design Strategy Pattern Contracts
  - Define InstructionStrategy type
  - Create predicate scoring system (0-100)
  - Document strategy selection algorithm
  - **Deliverable**: `src/lib/strategies/types.ts`

- **Subtask 1.2.3**: Plan Functional Architecture
  - Define composable function signatures
  - Document data flow boundaries
  - Create type-safe predicate system
  - **Deliverable**: `docs/functional-architecture.md`

---

### Epic 2: Safety-Critical Unit Conversion Engine (Week 2-3)

**Objective**: Implement a UCUM-compliant unit conversion system as an isolated, safety-critical module with 100% test coverage.

#### Task 2.1: UCUM Library Selection
- **Subtask 2.1.1**: Research TypeScript UCUM Libraries
  - Evaluate: @lhncbc/ucum-lhc, ucum-ts, js-quantities
  - Criteria: FHIR alignment, TypeScript support, bundle size, maintenance
  - Benchmark performance for client-side use
  - **Deliverable**: Technical decision document

- **Subtask 2.1.2**: Prototype Integration Options
  - Test top 2-3 candidates
  - Measure bundle size impact
  - Verify conversion accuracy
  - **Deliverable**: Proof of concept implementations

#### Task 2.2: Build Unit Converter Service
- **Subtask 2.2.1**: Create Anti-Corruption Layer
  - Wrap selected UCUM library
  - Define clean public interface
  - Isolate third-party dependencies
  - **Deliverable**: `src/lib/units/UnitConverter.ts`

- **Subtask 2.2.2**: Implement Medication-Specific Conversions
  - Topiclick: 4 clicks = 1 mL (hardcoded)
  - Concentration-based: mg → mL using strength ratio
  - Tablet strength: tablets → mg using ingredient data
  - **Deliverable**: `src/lib/units/MedicationConversions.ts`

- **Subtask 2.2.3**: Define Error Handling Strategy
  - ImpossibleConversionError
  - MissingContextError (no concentration)
  - InvalidUnitError
  - Never return defaults or fail silently
  - **Deliverable**: `src/lib/units/ConversionErrors.ts`

#### Task 2.3: Comprehensive Testing
- **Subtask 2.3.1**: Unit Test Suite
  - 100% code coverage requirement
  - Test all conversion paths
  - Test all error conditions
  - Performance benchmarks
  - **Deliverable**: `src/lib/units/__tests__/`

---

### Epic 3: Core Framework Implementation (Week 4-6)

**Objective**: Build the framework components and establish comprehensive testing infrastructure.

#### Task 3.1: Implement Dispatcher System
- **Subtask 3.1.1**: Build Specificity-Scored Dispatcher
  - Predicate-based selection with scoring (0-100)
  - Most specific strategy wins
  - Order-independent registration
  - **Deliverable**: `src/lib/dispatcher/StrategyDispatcher.ts`

- **Subtask 3.1.2**: Create Strategy Registry
  - Hold all InstructionStrategy implementations
  - Support dynamic registration
  - Provide debugging/introspection
  - **Deliverable**: `src/lib/dispatcher/StrategyRegistry.ts`

#### Task 3.2: Build Template Engine
- **Subtask 3.2.1**: Integrate ICU MessageFormat
  - Set up for i18n from day one
  - Support pluralization, gender, lists
  - Create initial English templates
  - **Deliverable**: `src/lib/templates/TemplateEngine.ts`

- **Subtask 3.2.2**: Define Template Library
  - ORAL_TABLET_TEMPLATE
  - LIQUID_DOSE_TEMPLATE
  - TOPICAL_APPLICATION_TEMPLATE
  - PRN_INSTRUCTION_TEMPLATE
  - **Deliverable**: `src/lib/templates/library/`

#### Task 3.3: Implement Simple Builders
- **Subtask 3.3.1**: SimpleTabletBuilder
  - Basic oral tablet dosing
  - Proof of concept for pattern
  - Full test coverage
  - **Deliverable**: `src/lib/builders/SimpleTabletBuilder.ts`

- **Subtask 3.3.2**: SimpleLiquidBuilder
  - Basic liquid dosing with concentration
  - Handle mL and mg inputs
  - **Deliverable**: `src/lib/builders/SimpleLiquidBuilder.ts`

#### Task 3.4: Establish Golden Master Testing
- **Subtask 3.4.1**: Create Test Infrastructure
  - Jest/Vitest configuration
  - Custom matchers for clinical intent
  - Test data management
  - **Deliverable**: Test configuration files

- **Subtask 3.4.2**: Build Initial Golden Dataset
  - 100+ clinically validated examples
  - Cover basic tablet and liquid cases
  - YAML/JSON format for easy updates
  - **Deliverable**: `tests/golden-master/dataset.json`

---

### Epic 4: Complex Builder Implementation (Week 7-9)

**Objective**: Implement all concrete builders for complex medication scenarios.

#### Task 4.1: Fractional Dosing Support
- **Subtask 4.1.1**: FractionalTabletBuilder
  - Handle 1/4, 1/2, 3/4 tablet dosing
  - Proper fraction formatting
  - Minimum 1/4 tablet constraint
  - **Deliverable**: `src/lib/builders/FractionalTabletBuilder.ts`

#### Task 4.2: Special Dispenser Support
- **Subtask 4.2.1**: TopiclickBuilder
  - 4 clicks = 1 mL conversion
  - Display format: "X clicks (Y mg)"
  - Integration with UnitConverter
  - **Deliverable**: `src/lib/builders/TopiclickBuilder.ts`

- **Subtask 4.2.2**: NasalSprayBuilder
  - Handle "spray" units
  - Support per-nostril instructions
  - **Deliverable**: `src/lib/builders/NasalSprayBuilder.ts`

#### Task 4.3: Complex Regimen Support
- **Subtask 4.3.1**: MultiIngredientBuilder
  - List all active ingredients
  - Show individual strengths
  - Handle compound medications
  - **Deliverable**: `src/lib/builders/MultiIngredientBuilder.ts`

- **Subtask 4.3.2**: ComplexPRNBuilder
  - Dose ranges (1-2 tablets)
  - Frequency ranges (4-6 hours)
  - Max dose constraints
  - **Deliverable**: `src/lib/builders/ComplexPRNBuilder.ts`

- **Subtask 4.3.3**: TaperingDoseBuilder
  - Sequential instruction lists
  - Duration-based changes
  - Clear transition points
  - **Deliverable**: `src/lib/builders/TaperingDoseBuilder.ts`

#### Task 4.4: Expand Golden Master Coverage
- **Subtask 4.4.1**: Add Complex Test Cases
  - 500+ additional test cases
  - Cover all builder types
  - Include edge cases
  - Clinical review required

---

### Epic 5: Validation & Verification (Week 7-10, parallel with Epic 4)

**Objective**: Prove the new system is clinically equivalent to or better than the legacy system.

#### Task 5.1: Create Comprehensive Test Dataset
- **Subtask 5.1.1**: Extract Production Samples
  - 1,000-10,000 anonymized real prescriptions
  - Cover all medication types and edge cases
  - Include known problematic cases
  - **Deliverable**: `tests/validation/production-dataset.json`

- **Subtask 5.1.2**: Classify Test Cases
  - Group by complexity level
  - Tag with expected edge cases
  - Document clinical intent
  - **Deliverable**: Test case documentation

#### Task 5.2: Build Dual-Run Validation Harness
- **Subtask 5.2.1**: Create Test Runner
  - Run both legacy and new systems
  - Capture all outputs
  - Log execution metrics
  - **Deliverable**: `tests/validation/dual-run-harness.ts`

- **Subtask 5.2.2**: Implement Semantic Diffing
  - Parse legacy strings to structured format
  - Compare clinical intent, not text
  - Handle acceptable variations
  - **Deliverable**: `tests/validation/semantic-diff.ts`

#### Task 5.3: Discrepancy Management
- **Subtask 5.3.1**: Build Triage System
  - Classify: Legacy Bug, Refactor Bug, Acceptable
  - Generate discrepancy reports
  - Track resolution status
  - **Deliverable**: Triage tooling and reports

- **Subtask 5.3.2**: Clinical Review Process
  - Engage clinical experts
  - Review all discrepancies
  - Document decisions
  - **Deliverable**: Clinical sign-off documentation

---

### Epic 6: Deployment & Production Rollout (Week 10-12)

**Objective**: Safely migrate to the new system with zero clinical impact.

#### Task 6.1: Shadow Mode Implementation
- **Subtask 6.1.1**: Build Shadow Mode Infrastructure
  - Process requests with both systems
  - Log results without user impact
  - Performance monitoring
  - **Deliverable**: Shadow mode middleware

- **Subtask 6.1.2**: Create Monitoring Dashboard
  - Real-time discrepancy rates
  - Performance metrics
  - Error tracking
  - **Deliverable**: Monitoring dashboard

#### Task 6.2: Feature Flag System
- **Subtask 6.2.1**: Implement Feature Flags
  - User percentage controls
  - Medication type controls
  - Instant rollback capability
  - **Deliverable**: Feature flag integration

- **Subtask 6.2.2**: Define Rollout Strategy
  - Phase 1: Internal users only
  - Phase 2: 1% of traffic
  - Phase 3: 10%, 50%, 100%
  - Phase 4: Complex medications
  - **Deliverable**: Rollout plan document

#### Task 6.3: Production Migration
- **Subtask 6.3.1**: Execute Phased Rollout
  - Follow defined strategy
  - Monitor at each phase
  - Clinical team on standby
  - **Deliverable**: Migration execution

- **Subtask 6.3.2**: Post-Migration Validation
  - Verify all metrics
  - Confirm zero clinical errors
  - Performance benchmarks
  - **Deliverable**: Post-migration report

---

## Risk Register

### High Priority Risks
1. **Clinical Safety**: Any error could impact patient care
   - Mitigation: Golden master testing, dual-run validation, shadow mode
   
2. **FHIR Compliance**: Incorrect mapping could break integrations
   - Mitigation: FHIR-first modeling, contract tests
   
3. **Performance**: Client-side bundle size and execution speed
   - Mitigation: Library evaluation, lazy loading, performance tests

### Medium Priority Risks
1. **Timeline Overrun**: Complex edge cases take longer than expected
   - Mitigation: Phased approach, defer 10% complex cases if needed
   
2. **Legacy Bug Discovery**: Finding errors in current system
   - Mitigation: Clear policy on bug handling, clinical review

---

## Success Criteria

1. **Zero Clinical Errors**: No medication errors introduced during migration
2. **Code Reduction**: 30% reduction in complexity metrics
3. **Test Coverage**: 90%+ coverage on business logic
4. **Performance**: <100ms signature generation time
5. **Shadow Mode Success**: <5% discrepancy rate before full rollout
6. **User Satisfaction**: No increase in user-reported issues

---

## Technical Decisions Log

### Decided
- TypeScript/React with functional patterns where appropriate
- FHIR R4 compliance as core requirement
- ICU MessageFormat for internationalization
- Shadow mode deployment strategy

### To Be Decided
- Specific UCUM library selection (Phase 2)
- Monitoring platform choice (Phase 6)
- Feature flag service (Phase 6)

---

## Appendix: Complexity Examples

### Topiclick Conversion
- Input: 8 clicks
- Conversion: 8 clicks ÷ 4 = 2 mL
- With 50mg/mL strength: 2 mL × 50 = 100mg
- Output: "Apply 8 clicks (100 mg) topically twice daily"

### Tapering Regimen
- Input: Prednisone taper
- Output: List of 3 SignatureInstructions
  1. "Take 3 tablets by mouth daily for 7 days"
  2. "Take 2 tablets by mouth daily for 7 days"
  3. "Take 1 tablet by mouth daily for 7 days"

### Complex PRN
- Input: Pain medication with constraints
- Output: "Take 1-2 tablets by mouth every 4-6 hours as needed for pain, not to exceed 6 tablets in 24 hours"