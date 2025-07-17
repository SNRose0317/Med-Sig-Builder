# FHIR Medication Packaging Analysis

**📖 For current schema documentation, see:** [`../src/types/README.md`](../src/types/README.md)

**✅ Status:** This issue has been resolved as of 2025-07-17. All medication fixtures now use the correct FHIR packaging model.

## Issue Discovered (RESOLVED)

The current medication fixtures are using an **incorrect FHIR packaging model**. While the calculation logic in `src/lib/calculations.ts` is correctly implemented to handle proper FHIR packaging, the medication data itself is wrong.

## Current Implementation (INCORRECT)

All medication fixtures are currently using:
```typescript
packageInfo: {
  quantity: 100,     // Total package quantity (WRONG)
  unit: 'tablet'
  // No packSize field
}
```

Examples:
- Metformin: `quantity: 100, unit: 'tablet'` (100 tablets total)
- Testosterone: `quantity: 10, unit: 'mL'` (10mL total)
- Lisinopril: `quantity: 90, unit: 'tablet'` (90 tablets total)

## Correct FHIR Model

Should be:
```typescript
packageInfo: {
  quantity: 1,       // Unit dose (per tablet, per vial)
  unit: 'tablet',
  packSize: 100      // Number of units in package
}
```

Examples:
- Metformin: `quantity: 1, unit: 'tablet', packSize: 100` (1 tablet per unit, 100 tablets in bottle)
- Testosterone: `quantity: 10, unit: 'mL', packSize: 2` (10mL per vial, 2 vials in package = 20mL total)
- Lisinopril: `quantity: 1, unit: 'tablet', packSize: 90` (1 tablet per unit, 90 tablets in bottle)

## Calculation Logic (ALREADY CORRECT)

The code in `src/lib/calculations.ts` lines 167-169 is correctly implemented:
```typescript
if (medication.packageInfo.packSize && medication.packageInfo.packSize > 1) {
  totalAmount = medication.packageInfo.quantity * medication.packageInfo.packSize;
}
```

This handles: Total = unit dose × number of units per package

## Impact

- **Days supply calculations** are likely incorrect due to wrong packaging data
- **Prescription quantities** may not match real-world packaging
- **FHIR compliance** is broken due to incorrect data model

## Required Fixes

1. Update all medication fixtures to use correct FHIR packaging model
2. Add `packSize` field to all medications
3. Change `quantity` to represent unit dose, not total package
4. Test calculations with corrected data
5. Update UI to clearly explain the FHIR model