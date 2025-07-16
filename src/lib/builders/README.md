# Medication Signature Builders

A flexible, type-safe builder pattern implementation for generating FHIR-compliant medication instructions. This module provides proof-of-concept builders that demonstrate the pattern and serve as templates for more complex implementations.

## Overview

The builders module implements the `ISignatureBuilder` interface to provide a fluent API for constructing medication instructions. Each builder is specialized for specific medication types and dose forms, with automatic validation, unit conversion, and audit trail functionality.

## Architecture

### Core Interface

All builders implement `ISignatureBuilder` which provides:

- **Fluent API**: Method chaining for readable instruction building
- **Type Safety**: Full TypeScript validation at compile time
- **FHIR Compliance**: Output conforms to FHIR R4 standards
- **Audit Trail**: Complete history of builder operations via `explain()`
- **Serialization**: JSON export for debugging and persistence

### Builder Implementations

#### SimpleTabletBuilder
Handles solid oral dose forms (tablets, capsules, troches, ODTs).

**Key Features:**
- Fractional dose validation against `medication.isScored` constraints
- Supports 1/4, 1/2, and whole tablet increments
- Template engine integration for localized output
- Comprehensive validation for tablet-specific constraints

**Supported Dose Forms:**
- `tablet`, `capsule`, `troche`, `odt`

#### FractionalTabletBuilder
Specialized builder for tablets requiring fractional dosing with enhanced formatting and patient guidance.

**Key Features:**
- Unicode fraction formatting (½, ¼, ¾) instead of decimal display
- Patient-friendly splitting instructions for each fraction
- Automatic rounding to nearest quarter for precision handling
- Enhanced audit trail with fraction-specific details
- Inherits all validation from SimpleTabletBuilder

**Supported Dose Forms:**
- `tablet`, `capsule` (same as SimpleTabletBuilder)

**Enhanced Output:**
- Displays "½ tablet" instead of "0.5 tablet"
- Includes splitting instructions like "Split tablet in half"
- Handles mixed fractions (e.g., "1¼ tablets")

#### SimpleLiquidBuilder
Handles liquid medications with concentration-based conversions.

**Key Features:**
- Automatic mg ↔ mL conversions using medication concentration
- Dual dosing display (e.g., "250 mg, as 5 mL")
- Route validation for liquids (oral, injection, topical)
- Automatic "shake well" instructions for suspensions

**Supported Dose Forms:**
- `solution`, `suspension`, `syrup`, `elixir`, `tincture`, `injection`, `vial`

## Usage

### Factory Function

The recommended approach is using the factory function which automatically selects the appropriate builder:

```typescript
import { createBuilder } from './lib/builders';

const builder = createBuilder(medication);
```

### Direct Instantiation

For specific builder requirements:

```typescript
import { 
  SimpleTabletBuilder, 
  SimpleLiquidBuilder,
  FractionalTabletBuilder 
} from './lib/builders';

const tabletBuilder = new SimpleTabletBuilder(medication);
const liquidBuilder = new SimpleLiquidBuilder(medication);
const fractionalBuilder = new FractionalTabletBuilder(scoredMedication);
```

## Examples

### Basic Tablet Instructions

```typescript
const instructions = createBuilder(tabletMedication)
  .buildDose({ value: 1, unit: 'tablet' })
  .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
  .buildRoute('by mouth')
  .getResult();

// Output: "Take 1 tablet by mouth twice daily"
```

### Fractional Dose with Validation

```typescript
// This will validate against medication.isScored
const instructions = createBuilder(scoredTablet)
  .buildDose({ value: 0.5, unit: 'tablet' })  // Half tablet - OK if isScored >= HALF
  .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
  .buildRoute('by mouth')
  .getResult();
```

### Enhanced Fractional Dosing with FractionalTabletBuilder

```typescript
import { FractionalTabletBuilder } from './lib/builders';

const instructions = new FractionalTabletBuilder(quarterScoredTablet)
  .buildDose({ value: 0.75, unit: 'tablet' })  // Will display as "¾ tablet"
  .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
  .buildRoute('by mouth')
  .getResult();

// Output text: "Take ¾ tablet by mouth twice daily"
// Additional instruction: "Split tablet into quarters, take three pieces"
```

### Liquid with Concentration Conversion

```typescript
const instructions = createBuilder(liquidMedication)
  .buildDose({ value: 250, unit: 'mg' })      // Will auto-convert to mL
  .buildTiming({ frequency: 3, period: 1, periodUnit: 'd' })
  .buildRoute('by mouth')
  .getResult();

// Output includes dual dose: "Take 250 mg, as 5 mL by mouth three times daily"
```

### PRN (As-Needed) Instructions

```typescript
const instructions = createBuilder(medication)
  .buildDose({ value: 2, unit: 'tablet' })
  .buildTiming({ frequency: 1, period: 6, periodUnit: 'h' })
  .buildRoute('by mouth')
  .buildAsNeeded({ asNeeded: true, indication: 'for pain' })
  .getResult();

// Includes PRN instruction in additionalInstructions
```

### Range Dosing

```typescript
const instructions = createBuilder(medication)
  .buildDose({ value: 1, unit: 'tablet', maxValue: 2 })  // 1-2 tablets
  .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
  .buildRoute('by mouth')
  .getResult();
```

### Multiple Doses (Tapering)

```typescript
const builder = createBuilder(medication)
  .buildDose({ value: 10, unit: 'mg' })    // Week 1
  .buildDose({ value: 7.5, unit: 'mg' })   // Week 2  
  .buildDose({ value: 5, unit: 'mg' })     // Week 3
  .buildTiming({ frequency: 1, period: 1, periodUnit: 'd' })
  .buildRoute('by mouth');

const instructions = builder.getResult();
// Generates tapering schedule instructions
```

## Validation

### Dose Validation

- **Positive values**: All doses must be > 0
- **Unit validation**: Units must be appropriate for medication type
- **Range validation**: If `maxValue` provided, must be >= `value`
- **Fractional tablets**: Validated against `medication.isScored` enum

### Timing Validation

- **Frequency**: Must be positive integer
- **Period**: Must be positive number
- **Period Unit**: Must be valid time unit (d, h, min, etc.)

### Route Validation

- **Tablet routes**: Validates oral routes are appropriate
- **Liquid routes**: Supports oral, injection, and topical routes
- **Warning system**: Logs warnings for unusual route/dose form combinations

## Error Handling

Builders throw descriptive errors for validation failures:

```typescript
try {
  builder.buildDose({ value: 0.3, unit: 'tablet' });  // Invalid for unscored tablet
} catch (error) {
  console.error(error.message); // "Dose 0.3 tablets requires quarter scoring. Medication is not scored."
}
```

## Audit Trail

Every builder maintains a complete audit trail:

```typescript
const builder = createBuilder(medication)
  .buildDose({ value: 1, unit: 'tablet' })
  .buildTiming({ frequency: 2, period: 1, periodUnit: 'd' })
  .buildRoute('by mouth');

console.log(builder.explain());
// Output:
// [2025-07-16T02:10:00.000Z] SimpleTabletBuilder initialized for Metformin 500mg
// [2025-07-16T02:10:00.001Z] Validated dose form: Tablet
// [2025-07-16T02:10:00.002Z] Added dose: 1 tablet
// [2025-07-16T02:10:00.003Z] Validated fractional dose: 1 tablet (whole tablet, no scoring required)
// [2025-07-16T02:10:00.004Z] Set timing: 2 per 1 d
// [2025-07-16T02:10:00.005Z] Set route: by mouth
```

## FHIR Compliance

All generated instructions conform to FHIR R4 standards:

```typescript
const instructions = builder.getResult();

// FHIR-compliant structure
console.log(instructions[0]);
// {
//   text: "Take 1 tablet by mouth twice daily",
//   doseAndRate: [{
//     type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/dose-rate-type", code: "ordered" }] },
//     doseQuantity: { value: 1, unit: "tablet" }
//   }],
//   timing: {
//     repeat: { frequency: 2, period: 1, periodUnit: "d" }
//   },
//   route: {
//     coding: [{ system: "http://snomed.info/sct", code: "26643006", display: "by mouth" }]
//   }
// }
```

## Testing

The module includes comprehensive test coverage:

- **Unit tests**: All builder methods and validation logic
- **Integration tests**: Template engine and unit converter integration  
- **Property-based tests**: Edge cases and fractional dose validation
- **FHIR compliance tests**: Output structure validation

Run tests:
```bash
npm test -- src/lib/builders/
```

## Extending the Pattern

To create new builders:

1. **Implement ISignatureBuilder**: All required methods must be implemented
2. **Add to factory function**: Update `createBuilder()` with new dose form mappings
3. **Create comprehensive tests**: Follow existing test patterns
4. **Document usage**: Add examples to this README

### Example: CustomBuilder

```typescript
export class CustomBuilder implements ISignatureBuilder {
  constructor(private medication: MedicationProfile) {
    // Initialize template engine, validators, etc.
  }

  buildDose(dose: DoseInput): ISignatureBuilder {
    // Custom dose validation logic
    return this;
  }

  // ... implement all required methods

  explain(): string {
    return this.auditTrail.join('\n');
  }
}
```

## Integration Points

- **Template Engine**: Uses centralized template system for localized output
- **Unit Converter**: Integrates with UnitConverter for dose conversions
- **Type System**: Full TypeScript integration with branded types
- **FHIR Types**: Compatible with existing SignatureInstruction types

## Performance

- **Lazy Evaluation**: Template rendering only occurs in `getResult()`
- **Immutable State**: All input objects remain unchanged
- **Memory Efficient**: Minimal object allocation during building
- **Caching**: Template engine caches compiled templates

## Future Enhancements

Planned builder implementations:
- **PatchBuilder**: Transdermal patches with application sites
- **InhalerBuilder**: MDI/DPI with technique instructions  
- **CompoundBuilder**: Custom compounded medications
- **PediatricBuilder**: Age/weight-based dosing calculations
- **OncologyBuilder**: BSA-based chemotherapy dosing

This module serves as the foundation for these future builders, with proven patterns and comprehensive validation.