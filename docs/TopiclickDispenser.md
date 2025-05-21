# Topiclick Dispenser Integration Guide

This document explains how the Medication Signature Builder handles medications dispensed using Topiclick applicators, particularly topical creams with specific dosage calculations.

## Overview

Topiclick is a metered-dose topical applicator commonly used for dispensing creams and gels. The system uses "clicks" as a unit of measurement, with a standard conversion ratio where **4 clicks = 1 mL**.

For creams with a specific drug concentration (e.g., 100mg/mL), this allows for precise dosing. For example, if a cream contains 100mg/mL and the prescribed dose is 2 clicks:
- 2 clicks = 0.5 mL
- 0.5 mL of a 100mg/mL cream = 50mg of active ingredient

## Implementation in the Med Sig Builder

### Database Storage

Medications that use Topiclick dispensers store the following information:

```json
{
  "dispenserInfo": {
    "type": "Topiclick",
    "unit": "click",
    "pluralUnit": "clicks",
    "conversionRatio": 4
  }
}
```

This structure is stored in the `dispenser_info` column of the medications table in Supabase.

### Dose Input Component

When a medication with a Topiclick dispenser is selected:

1. The dose input component automatically adds "click" as an available unit option
2. Users can enter the dose in clicks, mL, or mg (active ingredient)
3. Real-time conversions are displayed showing equivalent dosages:
   - Clicks ↔ mL ↔ mg

### Signature Generation

For medications with Topiclick dispensers, the application can generate instructions in multiple formats:

- "Apply 2 clicks topically to affected area twice daily"
- "Apply 0.5 mL topically to affected area twice daily"
- "Apply 50 mg topically to affected area twice daily"

The default is to use clicks as the primary unit since this is what patients will use with their Topiclick device, but providers can select alternative formats if needed.

## Example Calculations

For a testosterone cream (100mg/mL) dispensed via Topiclick (4 clicks = 1mL):

| Clicks | mL Equivalent | mg Equivalent |
|--------|---------------|---------------|
| 1      | 0.25 mL       | 25 mg         |
| 2      | 0.5 mL        | 50 mg         |
| 4      | 1.0 mL        | 100 mg        |
| 8      | 2.0 mL        | 200 mg        |

## Medication Creation with Topiclick Dispensers

When creating or editing a medication:

1. Select "Cream" as the dose form
2. Choose "Topiclick" from the dispenser type dropdown
3. The default conversion ratio will be set to 4 (clicks per mL)
4. You can adjust this ratio if a different Topiclick device is used

## Best Practices for Prescribers

- When prescribing medications with Topiclick dispensers, it's recommended to specify the dose in clicks since this is what patients will see on their device
- Include the equivalent amount in mg in parentheses for clarity
- For certain medications where active ingredient amount is critical, consider making both measurements prominent in the instructions

## Supported Dispensers

The system supports multiple dispenser types, each with their own conversion ratios:

- **Topiclick**: 4 clicks = 1 mL
- **Pump Dispenser**: 1 pump ≈ 1.5 mL  
- **Dropper**: 20 drops ≈ 1 mL
- **Oral Syringe**: Direct mL measurement
- **Inhaler**: Measured in puffs
