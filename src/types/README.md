# Medication Schema Documentation

This directory contains the complete medication data model for the Med Sig Builder application. This documentation serves as the authoritative reference for understanding medication structure, FHIR compliance, and validation rules.

## Core Interfaces

### [`Medication`](./index.ts) - Primary Interface
The main medication interface used throughout the application, with FHIR R4 compliance and comprehensive validation.

### [`MedicationProfile`](./MedicationProfile.ts) - Extended Interface  
Enhanced medication interface with additional fields for advanced features like tapering, multi-ingredient compounds, and custom conversions.

## FHIR Packaging Model (Updated 2025-07-17)

**Critical:** Our medication data follows the correct FHIR R4 packaging standard after recent corrections.

### Key Concepts

1. **`totalVolume`** - Volume/quantity of the individual unit (vial, tablet, tube)
2. **`packageInfo.quantity`** - Same as totalVolume.value (unit dose)  
3. **`packageInfo.packSize`** - Number of units per dispensed package

### The FHIR Packaging Rule
```
Total Dispensed = packageInfo.quantity × packageInfo.packSize
```

## Complete Schema Examples

### Injectable Medication (Testosterone Cypionate)
```typescript
{
  id: "med-testosterone-cyp",
  name: "Testosterone Cypionate 200mg/mL",
  type: "medication",
  isActive: true,
  doseForm: "Injection",
  
  // FHIR coding
  code: {
    coding: [{
      system: "http://www.nlm.nih.gov/research/umls/rxnorm",
      code: "1647574",
      display: "Testosterone Cypionate 200 MG/ML Injectable Solution"
    }]
  },
  
  // Active ingredient with strength
  ingredient: [{
    name: "Testosterone Cypionate",
    strengthRatio: {
      numerator: { value: 200, unit: "mg" },
      denominator: { value: 1, unit: "mL" }
    }
  }],
  
  // FHIR Packaging (CORRECTED MODEL)
  totalVolume: {
    value: 10,        // 10mL per individual vial
    unit: "mL"
  },
  packageInfo: {
    quantity: 10,     // 10mL per vial (unit dose)
    unit: "mL",
    packSize: 2       // 2 vials per package
  }
  // Total dispensed: 10mL × 2 = 20mL
}
```

### Tablet Medication (Metformin)
```typescript
{
  id: "med-metformin-500",
  name: "Metformin 500mg",
  type: "medication",
  isActive: true,
  doseForm: "Tablet",
  
  code: {
    coding: [{
      system: "http://www.nlm.nih.gov/research/umls/rxnorm",
      code: "860975",
      display: "Metformin 500 MG Oral Tablet"
    }]
  },
  
  ingredient: [{
    name: "Metformin Hydrochloride",
    strengthRatio: {
      numerator: { value: 500, unit: "mg" },
      denominator: { value: 1, unit: "tablet" }
    }
  }],
  
  // FHIR Packaging for Tablets
  totalVolume: {
    value: 1,         // 1 tablet per unit dose
    unit: "tablet"
  },
  packageInfo: {
    quantity: 1,      // 1 tablet per unit dose
    unit: "tablet",
    packSize: 100     // 100 tablets per bottle
  },
  // Total dispensed: 1 tablet × 100 = 100 tablets
  
  // Tablet-specific fields
  isScored: "HALF",   // Can be split in half
  
  // Dosage constraints
  dosageConstraints: {
    minDose: { value: 0.5, unit: "tablet" },
    maxDose: { value: 2, unit: "tablet" },
    step: 0.5
  }
}
```

### Topical with Special Dispenser (Hormone Cream)
```typescript
{
  id: "med-hormone-cream",
  name: "Hormone Cream 10mg/g",
  type: "medication",
  isActive: true,
  doseForm: "Cream",
  
  ingredient: [{
    name: "Mixed Hormones",
    strengthRatio: {
      numerator: { value: 10, unit: "mg" },
      denominator: { value: 1, unit: "g" }
    }
  }],
  
  // FHIR Packaging for Topicals
  totalVolume: {
    value: 30,        // 30g per tube
    unit: "g"
  },
  packageInfo: {
    quantity: 30,     // 30g per tube (unit dose)
    unit: "g"
    // packSize defaults to 1 for single tubes
  },
  
  // Special dispenser information
  dispenserInfo: {
    type: "topiclick",
    unit: "click",
    pluralUnit: "clicks",
    conversionRatio: 4        // 4 clicks = 1 mL
  }
}
```

### Multi-Ingredient Compound
```typescript
{
  id: "med-combo-hormone",
  name: "Estradiol/Progesterone Cream",
  type: "compound",
  isActive: true,
  doseForm: "Cream",
  
  // Multiple active ingredients
  ingredient: [
    {
      name: "Estradiol",
      strengthRatio: {
        numerator: { value: 1, unit: "mg" },
        denominator: { value: 1, unit: "g" }
      }
    },
    {
      name: "Progesterone", 
      strengthRatio: {
        numerator: { value: 100, unit: "mg" },
        denominator: { value: 1, unit: "g" }
      }
    }
  ],
  
  totalVolume: {
    value: 50,        // 50g per tube
    unit: "g"
  },
  packageInfo: {
    quantity: 50,     // 50g per tube
    unit: "g"
  }
}
```

## Required Fields

### Core Fields (Always Required)
- `id` - Unique identifier
- `name` - Human-readable medication name
- `type` - Usually "medication"
- `isActive` - Active/inactive status
- `doseForm` - Dose form (Tablet, Injection, Cream, etc.)
- `code` - FHIR CodeableConcept with coding array
- `ingredient` - Array of active ingredients with strength ratios

### FHIR Packaging (Required for calculations)
- `totalVolume` - Individual unit volume/quantity
- `packageInfo.quantity` - Unit dose (should match totalVolume.value)
- `packageInfo.unit` - Unit of measurement

### Optional Fields
- `packageInfo.packSize` - Units per package (defaults to 1)
- `dispenserInfo` - Special dispenser configuration
- `dosageConstraints` - Min/max dose validation
- `isScored` - Tablet scoring capability
- `allowedRoutes` - Valid administration routes
- `eligibleGenders` - Gender restrictions

## Validation Rules

### FHIR Packaging Validation
```typescript
// totalVolume and packageInfo.quantity must match
medication.totalVolume.value === medication.packageInfo.quantity

// Units must be compatible
medication.totalVolume.unit === medication.packageInfo.unit

// packSize must be positive integer (if provided)
medication.packageInfo.packSize >= 1
```

### Fractional Dose Validation
```typescript
// Tablet fractioning rules
if (dose % 1 !== 0) {  // Fractional dose
  if (dose % 0.25 === 0 && medication.isScored === 'QUARTER') {
    // ✓ Quarter doses allowed
  } else if (dose % 0.5 === 0 && ['HALF', 'QUARTER'].includes(medication.isScored)) {
    // ✓ Half doses allowed  
  } else {
    // ✗ Invalid fractional dose
    throw new Error(`Dose ${dose} tablets requires appropriate scoring`);
  }
}
```

### Strength Ratio Validation
```typescript
// All ingredients must have valid strength ratios
ingredient.strengthRatio.numerator.value > 0
ingredient.strengthRatio.denominator.value > 0
typeof ingredient.strengthRatio.numerator.unit === 'string'
typeof ingredient.strengthRatio.denominator.unit === 'string'
```

## Days Supply Calculation Impact

The corrected FHIR packaging model ensures accurate days supply calculations:

```typescript
// Calculate total available medication
const availablePerUnit = medication.packageInfo.quantity;
const unitsPerPackage = medication.packageInfo.packSize || 1;
const totalAvailable = availablePerUnit * unitsPerPackage;

// Calculate consumption
const doseAmount = 1; // mg, mL, tablet, etc.
const dosesPerDay = 2; // based on frequency
const consumptionPerDay = doseAmount * dosesPerDay;

// Days supply
const daysSupply = Math.floor(totalAvailable / consumptionPerDay);
```

## Type Guards

### Medication Validation
```typescript
import { isMedicationProfile } from './MedicationProfile';

// Use type guards for validation
if (isMedicationProfile(data)) {
  // TypeScript knows data is MedicationProfile
  console.log(data.ingredient[0].strengthRatio);
}
```

### FHIR Packaging Check
```typescript
function hasValidPackaging(med: Medication): boolean {
  return med.totalVolume && 
         med.packageInfo &&
         med.totalVolume.value === med.packageInfo.quantity &&
         med.totalVolume.unit === med.packageInfo.unit;
}
```

## Common Patterns

### Unit Conversion
```typescript
// Weight to volume conversion using strength ratio
const strengthValue = ingredient.strengthRatio.numerator.value / 
                     ingredient.strengthRatio.denominator.value;

// Convert 250mg to mL for 200mg/mL concentration
const volumeInML = 250 / 200; // = 1.25 mL
```

### Dispenser Conversion
```typescript
// Topiclick: 4 clicks = 1 mL
if (medication.dispenserInfo?.type === 'topiclick') {
  const mlAmount = clickAmount / medication.dispenserInfo.conversionRatio;
}
```

### Fractional Display
```typescript
// Convert decimal to fraction display
const fractions = {
  0.25: '¼',
  0.5: '½', 
  0.75: '¾'
};

const displayDose = fractions[dose % 1] ? 
  Math.floor(dose) + fractions[dose % 1] : 
  dose.toString();
```

## Integration Points

### With Builders
The medication schema integrates with the builder pattern:
```typescript
import { createBuilder } from '../lib/builders';

const builder = createBuilder(medication); // Auto-selects based on doseForm
```

### With Calculations
Days supply and unit conversions use the schema:
```typescript
import { calculateDaysSupply } from '../lib/calculations';

const daysSupply = calculateDaysSupply(medication, dose, frequency);
```

### With Database
The schema maps to Supabase database fields:
- JSONB fields: `code`, `ingredient`, `packageInfo`, `dispenserInfo`
- Flat fields: `dosageConstraints` columns
- Array fields: `allowedRoutes`, `eligibleGenders`

## Migration Notes

### Recent FHIR Packaging Correction (2025-07-17)
All medication fixtures were updated to use the correct FHIR packaging model:

**Before (INCORRECT):**
```typescript
packageInfo: { quantity: 100, unit: 'tablet' } // Total package
```

**After (CORRECT):**
```typescript
totalVolume: { value: 1, unit: 'tablet' },      // Individual unit
packageInfo: { 
  quantity: 1,      // Unit dose
  unit: 'tablet', 
  packSize: 100     // Units per package
}
```

This ensures FHIR compliance and accurate calculations throughout the application.

## Related Documentation

- [Builders README](../lib/builders/README.md) - Builder pattern implementation
- [FHIR Packaging Analysis](../../docs/FHIR-Packaging-Analysis.md) - Analysis of the packaging corrections
- [Medication UI Fields](../../docs/medication-ui-fields.md) - UI form documentation
- [Project Context](../../CLAUDE.md) - Full project overview

---

*This documentation is the authoritative reference for medication schema. All other documentation should cross-reference this file.*