# Medication UI Fields Documentation

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
   - Current: ❌ Not implemented as form field (exists in type but not in form)

8. **Packaging Volume** (number input)
   - Screenshot shows: "10" value
   - Current: ❌ Not implemented

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

5. **Package Info** (quantity/unit)
   - Current: ✅ Implemented
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

## Recommendations:

1. Add the missing quantity fields (Min QTY, Default QTY, Max Qty) which appear to be different from dose constraints
2. Add Type selector to allow different medication types
3. Add Dispensing Method as a standalone field
4. Add Total Volume and Packaging Volume fields to the form
5. Make Strength Mode user-selectable instead of auto-calculated
6. Add Multi-ingredient checkbox to allow manual override of auto-detection