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

## Architectural Decisions (Consensus from Multi-Model Review)

### 1. Specificity-Based Dispatcher
Replace numeric scoring with explicit specificity levels:
```typescript
enum SpecificityLevel {
  MEDICATION_SKU,     // Most specific
  MEDICATION_ID,
  DOSE_FORM_AND_INGREDIENT,
  DOSE_FORM,
  DEFAULT             // Least specific
}
```

### 2. Composition Over Inheritance
Use base strategies + modifiers instead of monolithic builders:
- Base: `OralSolidDosingStrategy`, `TopicalLiquidDosingStrategy`
- Modifiers: `FractionalDoseModifier`, `PRNConstraintModifier`, `DoseRangeModifier`

### 3. Immutable Value Objects
Never pass naked numbers for doses - use type-safe objects

### 4. Clinical Guardrails
Declarative YAML ruleset for clinical constraints, validated by pharmacists

### 5. Explainable AI
All modules must implement `explain(): string` for audit trails

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
  - Support runtime custom conversions array
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

- **Subtask 1.1.4**: Design DB Schema and Migration Plan
  - Align database with new MedicationProfile model
  - Plan dual-write strategy for migration
  - Avoid flattening/un-flattening logic
  - **Deliverable**: `docs/db-migration-plan.md`

#### Task 1.2: Design Architecture Patterns
- **Subtask 1.2.1**: Define ISignatureBuilder Interface
  - Methods: buildDose(), buildTiming(), buildRoute(), buildConstraints()
  - Required: explain(): string, toJSON(): object
  - Support for getResult(): SignatureInstruction[]
  - **Deliverable**: `src/lib/builders/ISignatureBuilder.ts`

- **Subtask 1.2.2**: Design Strategy Pattern Contracts
  - Define InstructionStrategy type with SpecificityLevel enum
  - Remove numeric scoring in favor of explicit levels
  - Document strategy selection algorithm
  - **Deliverable**: `src/lib/strategies/types.ts`

- **Subtask 1.2.3**: Plan Functional Architecture
  - Define composable function signatures
  - Document data flow boundaries
  - Create type-safe predicate system
  - **Deliverable**: `docs/functional-architecture.md`

#### Task 1.3: Design Immutable Value Objects for Doses
- Define Dose, Frequency, Route as immutable types
- Never allow naked numbers in the system
- Include validation in constructors
- **Deliverable**: `src/types/value-objects.ts`

#### Task 1.4: Create Clinical Guardrails Schema
- Design YAML schema for clinical constraints
- Include max doses, contraindications, interactions
- Plan for versioning and change management
- **Deliverable**: `src/guardrails/schema.yaml`

#### Task 1.5: Guardrails Change Management Process
- Document 2-sign-off workflow
- Set up linting for YAML changes
- Create audit trail requirements
- **Deliverable**: `docs/guardrails-governance.md`

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
  - Implement explain() method for all conversions
  - Isolate third-party dependencies
  - **Deliverable**: `src/lib/units/UnitConverter.ts`

- **Subtask 2.2.2**: Implement Medication-Specific Conversions
  - Support runtime custom conversions from MedicationProfile
  - Topiclick: 4 clicks = 1 mL (via configuration)
  - Concentration-based: mg → mL using strength ratio
  - Tablet strength: tablets → mg using ingredient data
  - **Deliverable**: `src/lib/units/MedicationConversions.ts`

- **Subtask 2.2.3**: Define Error Handling Strategy
  - ImpossibleConversionError
  - MissingContextError (no concentration)
  - InvalidUnitError
  - Never return defaults or fail silently
  - **Deliverable**: `src/lib/units/ConversionErrors.ts`

#### Task 2.3: ConfidenceScoreService
- **Subtask 2.3.1**: Design Confidence Score Algorithm
  - Return {score: 0-1, rationale: string[], explain(): string}
  - Consider conversion complexity, data completeness
  - **Deliverable**: `src/lib/confidence/ConfidenceScoreService.ts`

- **Subtask 2.3.2**: Create REST Endpoint
  - Expose confidence scoring via API
  - Include structured logging
  - **Deliverable**: API endpoint implementation

#### Task 2.4: Instrumentation & Trace Framework
- **Subtask 2.4.1**: Build Trace/Dry-Run Mode
  - Feature flag controlled
  - Emit JSON + optional DOT graph
  - PHI scrubbing for logs
  - **Deliverable**: `src/lib/instrumentation/Tracer.ts`

- **Subtask 2.4.2**: Integration with Dispatcher
  - Log all strategy evaluations
  - Record decision paths
  - Performance metrics
  - **Deliverable**: Dispatcher integration

#### Task 2.5: Property-Based Testing Framework
- **Subtask 2.5.1**: Set up fast-check
  - Configure for TypeScript
  - Create generators for medication contexts
  - **Deliverable**: Test framework setup

- **Subtask 2.5.2**: Build Golden Master Differential Harness
  - Property-based comparison of legacy vs new
  - Automated edge case discovery
  - **Deliverable**: `tests/property-based/harness.ts`

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

#### Task 3.5: Refactor calculateDaysSupply
- **Subtask 3.5.1**: Extract Shared Temporal Parser
  - Parse frequency strings to structured data
  - Handle all period units correctly (not hardcoded 30 days/month)
  - **Deliverable**: `src/lib/temporal/TemporalParser.ts`

- **Subtask 3.5.2**: Implement DaysSupplyStrategy
  - Dispatch based on medication context
  - Use UCUM for accurate conversions
  - **Deliverable**: `src/lib/strategies/DaysSupplyStrategy.ts`

#### Task 3.6: CI/CD Performance Gates
- **Subtask 3.6.1**: Set up Artillery Load Testing
  - Define performance benchmarks
  - P95 latency must be <50ms
  - **Deliverable**: Artillery test configuration

- **Subtask 3.6.2**: GitHub Action Integration
  - Fail builds on performance regression
  - Track metrics over time
  - **Deliverable**: `.github/workflows/performance.yml`

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
  - Build confidence score for parse quality
  - Compare clinical intent, not text
  - Flag low-confidence parses for human review
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

#### Task 5.4: UI Integration for Confidence Scores
- **Subtask 5.4.1**: Integrate ConfidenceScoreService
  - Call confidence score endpoint
  - Handle loading/error states
  - **Deliverable**: React hook implementation

- **Subtask 5.4.2**: Build Warning UI Components
  - Yellow banner for auto-converted signatures
  - Show confidence score and rationale
  - Allow user to request manual review
  - **Deliverable**: `src/components/ConfidenceWarning.tsx`

---

### Epic 6: API & Database Migration (Week 3-5, parallel)

**Objective**: Modernize the data layer to support new architecture without breaking existing systems.

#### Task 6.1: Design Versioned API Envelope
- **Subtask 6.1.1**: Create v2 API Contracts
  - Support MedicationProfile v2 structure
  - Maintain backward compatibility
  - Version negotiation headers
  - **Deliverable**: OpenAPI specification

- **Subtask 6.1.2**: Implement Dual-Write Logic
  - Write to both v1 and v2 formats
  - Feature flag controlled
  - Performance monitoring
  - **Deliverable**: API middleware

#### Task 6.2: Database Schema Migration
- **Subtask 6.2.1**: Design New Schema
  - Align with MedicationProfile model
  - Eliminate flattening logic
  - Support JSONB for flexibility
  - **Deliverable**: Migration scripts

- **Subtask 6.2.2**: Implement Ghost Table Strategy
  - Create shadow tables
  - Backfill with zero downtime
  - Atomic cutover plan
  - **Deliverable**: Migration tooling

#### Task 6.3: Client Migration Support
- **Subtask 6.3.1**: Mobile App Migration Scripts
  - SQLite/Realm schema updates
  - Offline data migration
  - **Deliverable**: Mobile migration package

- **Subtask 6.3.2**: Analytics Pipeline Updates
  - Update CDC consumers
  - Maintain SNOMED code paths
  - **Deliverable**: Analytics migration guide

---

### Epic 7: Deployment & Production Rollout (Week 10-12)

**Objective**: Safely migrate to the new system with zero clinical impact.

#### Task 7.1: Shadow Mode Implementation
- **Subtask 7.1.1**: Build Shadow Mode Infrastructure
  - Process requests with both systems
  - Log results without user impact
  - Performance monitoring
  - **Deliverable**: Shadow mode middleware

- **Subtask 7.1.2**: Create Monitoring Dashboard
  - Real-time discrepancy rates
  - Performance metrics
  - Error tracking
  - **Deliverable**: Monitoring dashboard

#### Task 7.2: Feature Flag System
- **Subtask 7.2.1**: Implement Feature Flags
  - User percentage controls
  - Medication type controls
  - Instant rollback capability
  - **Deliverable**: Feature flag integration

- **Subtask 7.2.2**: Define Rollout Strategy
  - Phase 1: Internal users only
  - Phase 2: 1% of traffic
  - Phase 3: 10%, 50%, 100%
  - Phase 4: Complex medications
  - **Deliverable**: Rollout plan document

#### Task 7.3: Production Migration
- **Subtask 7.3.1**: Execute Phased Rollout
  - Follow defined strategy
  - Monitor at each phase
  - Clinical team on standby
  - **Deliverable**: Migration execution

- **Subtask 7.3.2**: Post-Migration Validation
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

## End Goal Application Design

### Overview: What, How, and Why

The Medication Signature Builder is a clinical tool that transforms medication data into human-readable prescription instructions while maintaining FHIR compliance. The application ensures patient safety through precise dosing calculations, unit conversions, and clinical constraints.

### Core Application Flow

```
Medication Creation → Signature Input → Dynamic Conversion → Output Generation → Days Supply
```

### Example 1: Injectable - Testosterone Cypionate 200mg/mL x 10mL

#### Step 1: Creating the Medication

**User Inputs:**
- **Name**: Testosterone Cypionate
- **Type**: medication
- **Dose Form**: Vial
- **Ingredient**: 
  - Name: Testosterone Cypionate
  - Strength: 200 mg per 1 mL (ratio mode)
- **Package Info**: 
  - Quantity: 1
  - Unit: Vial
- **Total Volume**: 10 mL
- **Default Route**: Intramuscularly
- **Allowed Routes**: ["Intramuscularly", "Subcutaneous"]

**Why These Fields Matter:**
- **Strength Ratio (200mg/1mL)**: Enables conversion between volume (mL) and weight (mg)
- **Total Volume (10mL)**: Required for days supply calculation
- **Routes**: Determines available administration methods and verbs

#### Step 2: Signature Creation - Input 0.2 mL Three Times Weekly

**User Inputs:**
- **Dose**: 0.2 (user selects mL from dropdown)
- **Route**: Intramuscularly (pre-selected from default)
- **Frequency**: "Three Times Per Week"
- **Special Instructions**: (optional)

**Dynamic Conversion Process:**
1. System detects dose unit is mL (volume)
2. Looks up medication strength ratio: 200mg/1mL
3. Calculates: 0.2 mL × (200mg/1mL) = 40mg
4. Formats as dual dose: "0.2 mL, as 40 mg"

**Signature Generation:**
```typescript
// In formatDose() function:
if ((medication.doseForm === 'Vial' || medication.doseForm === 'Solution') && 
    dose.unit === strengthRatio.numerator.unit) {
  const mlValue = (dose.value / strengthValue).toFixed(2);
  return `${dose.value} ${dose.unit}, as ${mlValue} mL`;
}
```

**Output**: "Inject 0.2 mL, as 40 mg, intramuscularly three times weekly."

#### Step 3: Days Supply Calculation

**Calculation Logic:**
```
Total Volume: 10 mL
Dose per administration: 0.2 mL
Frequency: 3 times per week = 3/7 per day
Daily usage: 0.2 mL × (3/7) = 0.0857 mL/day
Days Supply: 10 mL ÷ 0.0857 mL/day = 116 days
```

**Note**: The system uses the volume (0.2 mL) for calculation, not the weight (40mg), because the medication is dispensed by volume.

### Example 2: Tablet - Metformin 500mg

#### Step 1: Creating the Medication

**User Inputs:**
- **Name**: Metformin
- **Dose Form**: Tablet
- **Ingredient**: 
  - Name: Metformin HCl
  - Strength: 500 mg per 1 tablet (quantity mode)
- **Package Info**: 
  - Quantity: 60
  - Unit: tablets
- **Default Route**: Orally
- **Dosage Constraints**:
  - Min: 0.5 tablet
  - Max: 4 tablets
  - Step: 0.5

**Why Quantity Mode:**
- Tablets use "quantity" mode where strength is per unit (500mg per tablet)
- Not ratio mode like liquids (mg per mL)

#### Step 2: Signature Creation - Input 2 tablets Twice Daily

**User Inputs:**
- **Dose**: 2 tablets
- **Route**: Orally
- **Frequency**: "Twice Daily"

**Tablet Formatting:**
```typescript
function formatTabletDose(value: number): string {
  if (value < 0.25) return '1/4 tablet'; // CRITICAL: Never go below 1/4
  if (value === 2) return '2 tablets';
  // Special fraction handling...
}
```

**Output**: "Take 2 tablets by mouth twice daily."

**Days Supply**: 60 tablets ÷ (2 tablets × 2 times/day) = 15 days

### Example 3: Topical - Testosterone Cream 100mg/mL with Topiclick

#### Step 1: Creating the Medication

**User Inputs:**
- **Name**: Testosterone Cream
- **Dose Form**: Cream
- **Ingredient**: 
  - Name: Testosterone
  - Strength: 100 mg per 1 mL
- **Dispenser Info**:
  - Type: Topiclick
  - Unit: click
  - Plural: clicks
  - Conversion: 4 (4 clicks = 1 mL)
- **Total Volume**: 30 mL

**Why Topiclick Uses mL:**
- Topiclick dispensers measure volume (mL), not weight (g)
- Aligns with 4 clicks = 1 mL conversion
- Different from standard creams that use mg/g

#### Step 2: Signature Creation - Input 2 clicks Twice Daily

**User Inputs:**
- **Dose**: 2 clicks (special dispenser unit appears)
- **Route**: Topically
- **Frequency**: "Twice Daily"

**Click to mg Conversion Process:**
1. User enters: 2 clicks
2. Convert clicks to mL: 2 clicks ÷ 4 = 0.5 mL
3. Convert mL to mg: 0.5 mL × 100mg/mL = 50mg
4. Format: "2 clicks (50 mg)"

**Code Logic:**
```typescript
if (medication.doseForm === 'Cream' && doseForm?.dispenserConversion) {
  if (dose.unit === dispenserUnit) {
    const mlValue = dose.value / conversionRatio; // 2/4 = 0.5
    const mgValue = mlValue * strengthRatio.numerator.value; // 0.5 × 100 = 50
    return `${dose.value} ${unitText} (${mgValue.toFixed(0)} ${strengthRatio.numerator.unit})`;
  }
}
```

**Output**: "Apply 2 clicks (50 mg) topically twice daily."

**Days Supply**: 
- Daily usage: 2 clicks × 2 = 4 clicks/day = 1 mL/day
- Days supply: 30 mL ÷ 1 mL/day = 30 days

### Route Differentiation: IM vs SubQ

**Same Medication, Different Route:**

Using the same Testosterone Cypionate example:
- **IM Route**: "Inject 0.2 mL, as 40 mg, intramuscularly three times weekly."
- **SubQ Route**: "Inject 0.2 mL, as 40 mg, subcutaneously three times weekly."

**How It Works:**
1. Route selection changes the verb mapping
2. Both use "Inject" verb (from verbMappings)
3. Route name ("intramuscularly" vs "subcutaneously") comes from routes data
4. All calculations remain the same

**Verb Mapping System:**
```typescript
export const verbMappings: VerbMapping[] = [
  { doseForm: "Vial", route: "Intramuscularly", verb: "Inject" },
  { doseForm: "Vial", route: "Subcutaneous", verb: "Inject" },
  // Different verbs for different combinations:
  { doseForm: "Tablet", route: "Orally", verb: "Take" },
  { doseForm: "Tablet", route: "Sublingually", verb: "Place" },
];
```

### Key Design Principles

1. **Safety First**: 
   - Never allow doses below 1/4 tablet
   - Validate against min/max constraints
   - Force volume dosing for multi-ingredient medications

2. **Clarity in Dual Dosing**:
   - Injectables show both volume and weight: "0.2 mL, as 40 mg"
   - Topiclick shows clicks and weight: "2 clicks (50 mg)"
   - Provides both practical (what to measure) and clinical (actual dose) information

3. **Flexible Unit System**:
   - Users can input in their preferred unit
   - System converts as needed for display
   - Days supply always uses dispensing unit

4. **FHIR Compliance**:
   - All outputs map to FHIR R4 Dosage resource
   - Maintains structured data alongside human-readable text

### Why This Architecture Matters

1. **Clinical Safety**: Precise conversions prevent dosing errors
2. **User Flexibility**: Multiple input methods accommodate different workflows
3. **Regulatory Compliance**: FHIR structure ensures interoperability
4. **Maintainability**: Clear separation between data, logic, and presentation
5. **Extensibility**: New dose forms/dispensers can be added without breaking existing logic

### Summary of Critical Business Rules

#### Conversion Rules
1. **Topiclick**: Always 4 clicks = 1 mL
2. **Multi-ingredient**: Force volume dosing (mL or g)
3. **Tablets**: Minimum 1/4 tablet, format fractions nicely
4. **Dual dosing**: Show both practical and clinical units

#### Strength Modes
- **Ratio Mode**: Liquids/Creams (mg/mL, mg/g)
- **Quantity Mode**: Solids (mg per tablet)

#### Days Supply
- Always calculate using dispensing unit
- Week = 7 days (not hardcoded 30 days/month)
- Account for pack sizes and special dispensers

#### Route/Verb Mapping
- Each dose form + route combination has specific verb
- Route determines available special instructions
- Same calculation logic regardless of route

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

---

## Current System Analysis: Cascading Complexity Deep Dive

### Core Problem: Dose Form Selection Triggers Cascade

The current system has 720+ lines of tangled logic because dose form selection triggers a cascade of dependent changes:

```typescript
// Current cascade flow in SignatureBuilder.tsx:
doseForm changes → unit changes → dose constraints change → 
validation changes → dispenser info changes → signature format changes
```

### Key Complexity Points Identified

#### 1. Multi-Ingredient Detection (signature.ts:18-34)
```typescript
export function isMultiIngredient(medication: Medication): boolean {
  // Counts ingredients with valid strength ratios
  // Forces volume dosing (mL) for multi-ingredient medications
}
```
**Impact**: Changes entire dosing paradigm from weight (mg) to volume (mL)

#### 2. Strength Mode Logic (signature.ts:41-44)
```typescript
export function getStrengthMode(doseForm: string): 'ratio' | 'quantity' {
  const solidForms = ['Capsule', 'Tablet', 'Troche', 'ODT'];
  return solidForms.includes(doseForm) ? 'quantity' : 'ratio';
}
```
**Impact**: Determines how strength is expressed (per unit vs per volume)

#### 3. Special Dispenser Conversions (signature.ts:133-150)
```typescript
// Topiclick: 4 clicks = 1 mL hardcoded conversion
if (medication.doseForm === 'Cream' && doseForm?.dispenserConversion) {
  const mlValue = dose.value / conversionRatio;
  const mgValue = mlValue * strengthRatio.numerator.value;
  return `${dose.value} ${unitText} (${mgValue.toFixed(0)} ${strengthRatio.numerator.unit})`;
}
```
**Impact**: Special formatting and conversion logic for specific dispensers

#### 4. Tablet Fractioning Rules (signature.ts:98-123)
```typescript
function formatTabletDose(value: number): string {
  if (value < 0.25) return '1/4 tablet'; // CRITICAL: Never go below 1/4
  // Complex fraction formatting logic...
}
```
**Impact**: Enforces minimum 1/4 tablet constraint with special formatting

#### 5. Dual Dosing Display (signature.ts:183-186)
```typescript
// For injectables: "100 mg, as 2 mL"
if ((medication.doseForm === 'Vial' || medication.doseForm === 'Solution') && 
    dose.unit === strengthRatio.numerator.unit) {
  const mlValue = (dose.value / strengthValue).toFixed(2);
  return `${dose.value} ${dose.unit}, as ${mlValue} mL`;
}
```
**Impact**: Different display formats based on dose form and unit

#### 6. Days Supply Calculation Complexity (calculations.ts:14-71)
```typescript
export function calculateDaysSupply(
  medication: Medication,
  dose: DoseInfo
): number | null {
  // Complex logic handling:
  // - Special dispensers (Topiclick)
  // - Unit conversions (mg to tablets)
  // - Pack sizes
  // - Hardcoded 30 days/month assumption
}
```
**Problems**:
- Line 84: `'mo': 1/30` hardcodes month as 30 days
- No proper temporal parsing
- Unit conversion logic scattered throughout

### Reference Data Issues (medication-data.ts)

#### 1. Hardcoded Conversions
```typescript
// Line 624: Topiclick conversion
defaultConversionRatio: 4,  // 4 clicks = 1mL

// Line 632: Pump dispenser
defaultConversionRatio: 0.67,  // 1 pump ≈ 1.5mL

// Line 640: Dropper
defaultConversionRatio: 20,  // 20 drops ≈ 1mL
```
**Problem**: Conversions hardcoded in reference data instead of medication-specific

#### 2. Verb Mapping Complexity (lines 555-605)
```typescript
export const verbMappings: VerbMapping[] = [
  { doseForm: "Tablet", route: "Orally", verb: "Take" },
  { doseForm: "Tablet", route: "Sublingually", verb: "Place" },
  // 40+ hardcoded mappings...
];
```
**Problem**: Brittle mapping table that must be maintained manually

### Cascading Effects in SignatureBuilder Component

From analysis of SignatureBuilder.tsx:
1. **Dose Form Change** triggers:
   - Unit options update
   - Route options filter
   - Default route selection
   - Dose constraints update
   - Dispenser info check

2. **Unit Change** triggers:
   - Dose validation
   - Min/max constraint checks
   - Step increment validation
   - Signature regeneration

3. **Route Change** triggers:
   - Verb selection
   - Special instruction templates
   - Signature format updates

### Why Current Architecture Fails

1. **Tight Coupling**: Business rules scattered across components
2. **No Abstraction**: Direct manipulation of medication properties
3. **Cascading Updates**: One change triggers multiple dependent updates
4. **Hardcoded Logic**: Special cases handled inline rather than declaratively
5. **No Strategy Pattern**: Each medication type requires custom code paths

### Proposed Solution Benefits

The Strategy Pattern with Specificity-Based Dispatcher will:
1. **Isolate Rules**: Each strategy encapsulates its own logic
2. **Eliminate Cascades**: Strategies handle all aspects internally
3. **Enable Testing**: Each strategy can be tested in isolation
4. **Support Extension**: New medication types = new strategies
5. **Improve Clarity**: Clear separation of concerns