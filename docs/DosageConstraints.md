# Dosage Constraints

This document describes the dosage constraints feature in the Medication Signature Builder application.

## Overview

The dosage constraints feature allows you to define minimum and maximum dose limits, as well as step increments for medications. This ensures that prescribed doses remain within safe and clinically appropriate ranges.

## Configuration Options

When editing a medication in the Medication Form, you can define the following constraints:

1. **Minimum Dose**: The lowest acceptable dose value for the medication
   - Value: Numeric value (e.g., 50)
   - Unit: Unit of measure (e.g., mg, mcg, mL)

2. **Maximum Dose**: The highest acceptable dose value for the medication
   - Value: Numeric value (e.g., 200)
   - Unit: Unit of measure (e.g., mg, mcg, mL)

3. **Step Size**: The increment value for dosage adjustments
   - Value: Numeric value (e.g., 25)
   - This defines the granularity of dose changes (e.g., doses can only be 0, 25, 50, 75, etc.)

## Example Use Cases

### Testosterone Injections

For testosterone injections, you might set:
- Min Dose: 50 mg
- Max Dose: 200 mg
- Step Size: 50 mg

This ensures patients receive at least 50mg per dose, no more than 200mg, and doses are adjusted in 50mg increments.

### Topical Creams with Dispensers

For creams dispensed with devices like Topiclick:
- Min Dose: 1 click
- Max Dose: 4 clicks
- Step Size: 1 click

## How Constraints Are Applied

Dose constraints are applied in several ways:

1. **In the Dose Input Component**:
   - Visual indicators show min/max/step values
   - The number input has min/max/step attributes that restrict input values
   - When a user enters a value outside the allowed range, it's automatically adjusted

2. **In Dosage Calculations**:
   - The `buildDosage.ts` utility enforces constraints during dose calculations
   - When converting between different units (e.g., mg to mL), constraints are preserved
   - Step sizes are applied when rounding values

## Technical Implementation

The constraints are stored in the medication object structure:

```typescript
dosageConstraints?: {
  minDose?: {
    value: number;
    unit: string;
  };
  maxDose?: {
    value: number;
    unit: string;
  };
  step?: number;
}
```

These values are persisted to the database when you save a medication.
