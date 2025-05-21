# Database Mapping

This document provides a reference for how application model fields are mapped to database columns.

## Medication Object

| Application Field (camelCase) | Database Column (snake_case) | Type    | Description                           |
|-------------------------------|------------------------------|---------|---------------------------------------|
| id                           | id                           | UUID    | Unique identifier for the medication  |
| name                         | name                         | TEXT    | Medication name                       |
| type                         | type                         | TEXT    | Type of medication                    |
| isActive                     | is_active                    | BOOLEAN | Whether the medication is active      |
| doseForm                     | dose_form                    | TEXT    | Form of the medication (tablet, etc.) |
| code                         | code                         | JSONB   | Coding information for the medication |
| extension                    | extension                    | JSONB   | Additional extension data             |
| ingredient                   | ingredient                   | JSONB   | Active ingredients and strength info  |
| allowedRoutes                | allowed_routes               | TEXT[]  | Routes allowed for this medication    |
| defaultRoute                 | default_route                | TEXT    | Default route for this medication     |

## Package Information

Package information is stored as JSON in the database:

| Application Field (camelCase)    | Database Column (snake_case) | Type    | Description                           |
|----------------------------------|------------------------------|---------|---------------------------------------|
| packageInfo.quantity             | package_info -> quantity     | NUMERIC | Total quantity in the package         |
| packageInfo.unit                 | package_info -> unit         | TEXT    | Unit of measurement                   |
| packageInfo.packSize             | package_info -> pack_size    | NUMERIC | Size of individual packs (optional)   |

## Total Volume

Total volume is also stored in the database:

| Application Field (camelCase)    | Database Column (snake_case) | Type    | Description                           |
|----------------------------------|------------------------------|---------|---------------------------------------|
| totalVolume.value                | total_volume -> value        | NUMERIC | Volume value                          |
| totalVolume.unit                 | total_volume -> unit         | TEXT    | Volume unit                           |

## Dispenser Information

Dispenser information is stored as JSON in the database:

| Application Field (camelCase)    | Database Column (snake_case)    | Type    | Description                           |
|----------------------------------|--------------------------------|---------|---------------------------------------|
| dispenserInfo.type               | dispenser_info -> type         | TEXT    | Type of dispenser                     |
| dispenserInfo.unit               | dispenser_info -> unit         | TEXT    | Single unit name                      |
| dispenserInfo.pluralUnit         | dispenser_info -> plural_unit  | TEXT    | Plural unit name                      |
| dispenserInfo.conversionRatio    | dispenser_info -> conversion_ratio | NUMERIC | Conversion ratio to mL               |
| dispenserInfo.maxAmountPerDose   | dispenser_info -> max_amount_per_dose | NUMERIC | Maximum per dose (optional)         |

## Dosage Constraints

Dosage constraints use individual columns for numeric values and units:

| Application Field (camelCase)    | Database Column (snake_case) | Type    | Description                            |
|----------------------------------|------------------------------|---------|----------------------------------------|
| dosageConstraints.minDose.value  | min_dose_value               | NUMERIC | Minimum allowed dose value             |
| dosageConstraints.minDose.unit   | min_dose_unit                | TEXT    | Unit for the minimum dose              |
| dosageConstraints.maxDose.value  | max_dose_value               | NUMERIC | Maximum allowed dose value             |
| dosageConstraints.maxDose.unit   | max_dose_unit                | TEXT    | Unit for the maximum dose              |
| dosageConstraints.step           | dose_step                    | NUMERIC | Step size for incrementing doses       |

## Conversion Process

The application uses the `objectToDatabaseFormat` and `objectToApplicationFormat` functions in `dbAdapter.ts` to automatically convert between camelCase and snake_case:

1. When saving a medication:
   - Application model (camelCase) → `objectToDatabaseFormat` → Database columns (snake_case)

2. When retrieving a medication:
   - Database result (snake_case) → `objectToApplicationFormat` → Application model (camelCase)

### Example

An application object with dosage constraints:

```javascript
{
  name: "Testosterone Cypionate",
  doseForm: "Solution",
  dosageConstraints: {
    minDose: { value: 50, unit: "mg" },
    maxDose: { value: 200, unit: "mg" },
    step: 50
  }
}
```

Gets converted to a database object:

```javascript
{
  name: "Testosterone Cypionate",
  dose_form: "Solution",
  min_dose_value: 50,
  min_dose_unit: "mg",
  max_dose_value: 200,
  max_dose_unit: "mg",
  dose_step: 50
}
