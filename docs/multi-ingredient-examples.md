# Multi-Ingredient Detection Implementation

## Overview
The multi-ingredient detection system now integrates with the strength mode concept to ensure proper dosing for complex formulations.

## Key Functions

### 1. `isMultiIngredient(medication)`
Determines if a medication has multiple active ingredients by counting ingredients with valid strength data.

### 2. `getStrengthMode(doseForm)`
Returns 'ratio' or 'quantity' based on the dose form:
- **Ratio Mode**: Liquids, Creams (denominator in mL or g)
- **Quantity Mode**: Tablets, Capsules (denominator is the dose form)

### 3. `getDenominatorUnit(doseForm)`
Returns the appropriate denominator unit:
- Liquids → 'mL'
- Creams → 'g'
- Solids → dose form name (e.g., 'tablet')

### 4. `getDispensingUnit(medication)`
Determines the unit for dosing based on:
- Multi-ingredient status
- Strength mode
- Dose form

## Dosing Rules

### Multi-Ingredient + Ratio Mode
- **Always** uses volume/weight dosing (mL or g)
- No dual input shown
- Signature format: "Inject 0.5 mL" or "Apply 2 g"

### Single-Ingredient + Ratio Mode
- Can use either active ingredient OR volume dosing
- Shows dual input for conversions
- Signature format: "100 mg, as 0.5 mL"

### Single-Ingredient + Quantity Mode
- Uses active ingredient dosing
- Shows dual input for tablet/capsule counts
- Signature format: "Take 2 tablets (20 mg)"

## Examples

### 1. Multi-Ingredient Injectable (Ratio Mode)
```javascript
medication: {
  name: "Testosterone Blend",
  doseForm: "Vial",
  ingredient: [
    { name: "Testosterone Cypionate", strengthRatio: { numerator: { value: 100, unit: "mg" }, denominator: { value: 1, unit: "mL" } } },
    { name: "Testosterone Propionate", strengthRatio: { numerator: { value: 100, unit: "mg" }, denominator: { value: 1, unit: "mL" } } }
  ]
}

// Result:
// - isMultiIngredient: true
// - strengthMode: 'ratio'
// - dispensingUnit: 'mL'
// - Dose options: ['mL'] only
// - SIG: "Inject 0.5 mL intramuscularly"
```

### 2. Single-Ingredient Injectable (Ratio Mode)
```javascript
medication: {
  name: "Testosterone Cypionate",
  doseForm: "Vial",
  ingredient: [
    { name: "Testosterone Cypionate", strengthRatio: { numerator: { value: 200, unit: "mg" }, denominator: { value: 1, unit: "mL" } } }
  ]
}

// Result:
// - isMultiIngredient: false
// - strengthMode: 'ratio'
// - dispensingUnit: 'mg'
// - Dose options: ['mg', 'mL']
// - SIG: "Inject 100 mg, as 0.5 mL intramuscularly"
```

### 3. Single-Ingredient Tablet (Quantity Mode)
```javascript
medication: {
  name: "Metformin",
  doseForm: "Tablet",
  ingredient: [
    { name: "Metformin HCl", strengthRatio: { numerator: { value: 500, unit: "mg" }, denominator: { value: 1, unit: "tablet" } } }
  ]
}

// Result:
// - isMultiIngredient: false
// - strengthMode: 'quantity'
// - dispensingUnit: 'mg'
// - Dose options: ['mg', 'tablet']
// - SIG: "Take 2 tablets (1000 mg) by mouth"
```

### 4. Multi-Ingredient Cream (Ratio Mode)
```javascript
medication: {
  name: "HRT Cream",
  doseForm: "Cream",
  ingredient: [
    { name: "Estradiol", strengthRatio: { numerator: { value: 2, unit: "mg" }, denominator: { value: 1, unit: "g" } } },
    { name: "Progesterone", strengthRatio: { numerator: { value: 100, unit: "mg" }, denominator: { value: 1, unit: "g" } } }
  ]
}

// Result:
// - isMultiIngredient: true
// - strengthMode: 'ratio'
// - dispensingUnit: 'g'
// - Dose options: ['g'] only
// - SIG: "Apply 0.5 g topically"
```

## UI Behavior

### Multi-Ingredient Badge
When a medication is multi-ingredient, a badge appears:
```html
<span class="badge bg-primary">
  <i class="bi bi-layers"></i> Multi-Ingredient
</span>
```

### Dose Input
- **Multi-ingredient**: Single input, volume/weight unit only
- **Single-ingredient**: Dual input with conversion between units

### Strength Display
- **Multi-ingredient**: Shows all ingredients (e.g., "Testosterone Cypionate: 100mg/mL + Testosterone Propionate: 100mg/mL")
- **Single-ingredient**: Shows simple strength (e.g., "200mg/mL")

## Integration Points

### 1. Signature Generation
The `formatDose` function in `signature.ts` handles the logic for formatting doses based on multi-ingredient status and strength mode.

### 2. Days Supply Calculation
Multi-ingredient medications calculate days supply based on volume consumption rather than individual ingredient strengths.

### 3. Dose Validation
Constraints are applied based on the dispensing unit, ensuring safety for multi-ingredient formulations.