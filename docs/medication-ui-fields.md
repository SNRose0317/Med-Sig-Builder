# Medication UI Fields Documentation

**📖 For complete schema information, see the authoritative documentation:** [`src/types/README.md`](../src/types/README.md)

## Current Implementation vs Screenshot Comparison

### Fields Present in Both Current Implementation and Screenshot:

1. **Name** (text input)
   - Current: ✅ Implemented
   - Screenshot: ✅ Shown

2. **Gender** (multi-select)
   - Current: ✅ Implemented as `eligibleGenders` with MALE/FEMALE/OTHER options
   - Screenshot: ✅ Shown as dropdown with "Female" selected

3. **Dose Form** (select)
   - Current: ✅ Implemented with full list of options
   - Screenshot: ✅ Shown with "Vial" selected

4. **Route** (select) 
   - Current: ✅ Implemented with route-dose form validation
   - Screenshot: ✅ Shown with "Intramuscularly" selected

5. **Ingredient Information**
   - Current: ✅ Implemented with name and strengthRatio (numerator/denominator)
   - Screenshot: ✅ Shows "Testosterone Cypionate" with strength 200mg/mL

### Fields Missing from Current Implementation (Shown in Screenshot):

1. **Type** (dropdown)
   - Screenshot shows: "Medication" dropdown
   - Current: ❌ Not implemented as a user-editable field (hardcoded as 'medication')

2. **Min QTY** (number input)
   - Screenshot shows: Numeric input field
   - Current: ❌ Not implemented (we have dosageConstraints.minDose but not minQTY)

3. **Default QTY** (number input)
   - Screenshot shows: Numeric input field
   - Current: ❌ Not implemented

4. **Max Qty** (number input)
   - Screenshot shows: Numeric input field
   - Current: ❌ Not implemented (we have dosageConstraints.maxDose but not maxQTY)

5. **Dispensing Method** (select)
   - Screenshot shows: "Syringe" selected
   - Current: ❌ Not implemented as a standalone field

6. **Strength Mode** (select)
   - Screenshot shows: "Ratio( for liquids )" option
   - Current: ❌ Not implemented as user-editable (calculated programmatically)

7. **Total Volume** (number input)
   - Screenshot shows: "10" value
   - Current: ✅ Implemented in FHIR model (represents individual unit/vial volume)
   - FHIR Standard: Individual unit volume (e.g., 10mL per vial, 1 tablet per unit)

8. **Packaging Volume** (number input)
   - Screenshot shows: "10" value
   - Current: ✅ Implemented as `packageInfo.packSize` (how many units per package)
   - FHIR Standard: Number of individual units in a dispensed package

9. **Multi-ingredient medication** (checkbox)
   - Screenshot shows: Checkbox with description "Uses direct volume instead of active ingredient"
   - Current: ❌ Not implemented as user-editable (auto-detected)

### Fields in Current Implementation but NOT in Screenshot:

1. **Code** (JSONB)
   - Current: ✅ Implemented
   - Screenshot: ❌ Not shown

2. **Is Active** (checkbox)
   - Current: ✅ Implemented
   - Screenshot: ❌ Not shown

3. **Allowed Routes** (multi-select)
   - Current: ✅ Implemented
   - Screenshot: ❌ Not shown

4. **Default Route** (select)
   - Current: ✅ Implemented
   - Screenshot: ❌ Not shown

5. **Package Info** (quantity/unit/packSize)
   - Current: ✅ Implemented with correct FHIR packaging model
   - FHIR Standard: `quantity` = unit dose, `packSize` = units per package
   - Example: Testosterone 200mg/mL: `quantity: 10mL` (per vial), `packSize: 2` (2 vials per package)
   - Screenshot: ❌ Not shown

6. **Dispenser Info** (type/unit/conversionRatio)
   - Current: ✅ Implemented
   - Screenshot: ❌ Not shown

7. **Dosage Constraints** (minDose/maxDose/step)
   - Current: ✅ Implemented
   - Screenshot: ❌ Not shown (different from Min/Max QTY)

8. **Default Signature Settings**
   - Current: ✅ Implemented
   - Screenshot: ❌ Not shown

## Summary of Missing Fields to Implement:

1. **Type selector** - Allow selecting medication type
2. **Min QTY, Default QTY, Max Qty** - Quantity constraints (different from dose constraints)
3. **Dispensing Method** - How the medication is dispensed
4. **Strength Mode** - User-selectable ratio vs quantity mode
5. **Total Volume** - Add to form (already in type definition)
6. **Packaging Volume** - New field
7. **Multi-ingredient checkbox** - Make auto-detection user-overridable

## Current Form Structure in MedicationManager.tsx:

```typescript
// Current form fields:
- name (text)
- eligibleGenders (multi-select)
- doseForm (select)
- allowedRoutes (multi-select)
- defaultRoute (select)
- isActive (checkbox)
- code.coding[0].display (text)
- ingredient[0].name (text)
- ingredient[0].strengthRatio.numerator.value (number)
- ingredient[0].strengthRatio.numerator.unit (text)
- ingredient[0].strengthRatio.denominator.value (number)
- ingredient[0].strengthRatio.denominator.unit (select)
- packageInfo.quantity (number)
- packageInfo.unit (text)
- dispenserInfo.type (select)
- dispenserInfo.unit (text)
- dispenserInfo.conversionRatio (number)
- dosageConstraints.minDose.value (number)
- dosageConstraints.minDose.unit (text)
- dosageConstraints.maxDose.value (number)
- dosageConstraints.maxDose.unit (text)
- dosageConstraints.step (number)
- defaultSignatureSettings (nested fields)
```

## FHIR Packaging Model Implementation (Updated 2025-07-17)

Our medication data now follows the correct FHIR R4 packaging standard:

### Key FHIR Packaging Concepts:

1. **`totalVolume`** - Volume/quantity of the individual unit (vial, tablet, tube)
   - Examples: 
     - 10mL per vial (injectable)
     - 1 tablet per unit (oral solid)
     - 30g per tube (topical)

2. **`packageInfo.quantity`** - Same as totalVolume (unit dose)
   - Represents the dispensing unit size

3. **`packageInfo.packSize`** - Number of units per dispensed package
   - Examples:
     - 2 vials per package (total = 20mL)
     - 90 tablets per bottle
     - 1 tube per package

### Practical Examples:

**Testosterone Cypionate 200mg/mL:**
```json
{
  "totalVolume": { "value": 10, "unit": "mL" },  // 10mL per vial
  "packageInfo": {
    "quantity": 10,     // 10mL per vial (unit dose)
    "unit": "mL",
    "packSize": 2       // 2 vials per package (total = 20mL)
  }
}
```

**Metformin 500mg Tablets:**
```json
{
  "totalVolume": { "value": 1, "unit": "tablet" },  // 1 tablet per unit
  "packageInfo": {
    "quantity": 1,      // 1 tablet per unit dose
    "unit": "tablet",
    "packSize": 100     // 100 tablets per bottle
  }
}
```

**Hormone Cream:**
```json
{
  "totalVolume": { "value": 30, "unit": "g" },  // 30g per tube
  "packageInfo": {
    "quantity": 30,     // 30g per tube (unit dose)
    "unit": "g"         // Single tube per package (packSize = 1, optional)
  }
}
```

### Days Supply Calculation Impact:

The corrected packaging model ensures accurate days supply calculations:
- Uses `packageInfo.quantity` for available medication amount
- Multiplies by `packageInfo.packSize` when calculating total dispensed quantity
- Maintains proper unit conversions between dose and package units

## Recommendations:

1. Add the missing quantity fields (Min QTY, Default QTY, Max Qty) which appear to be different from dose constraints
2. Add Type selector to allow different medication types
3. Add Dispensing Method as a standalone field
4. **Update UI forms to clearly explain FHIR packaging fields:**
   - Total Volume: "Volume per individual unit (vial/tablet/tube)"
   - Pack Size: "How many units come in a dispensed package"
5. Make Strength Mode user-selectable instead of auto-calculated
6. Add Multi-ingredient checkbox to allow manual override of auto-detection