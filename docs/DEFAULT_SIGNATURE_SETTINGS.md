# Default Signature Settings Feature

## Overview

The Default Signature Settings feature allows healthcare providers to save preferred prescription settings for each medication. When a medication is selected in the signature builder, its default settings automatically populate the form fields, saving time and ensuring consistency.

## How It Works

### 1. Setting Defaults During Medication Management

When adding or editing a medication in the Medication Management tab:

1. **Configure the medication** with all necessary properties (name, dose form, strength, etc.)
2. **Test the signature output** using the embedded signature builder
3. **Save preferred settings** by clicking "Save as Default" when you find the ideal combination

![Embedded Signature Builder](../screenshots/embedded-signature-builder.png)

The embedded signature builder provides:
- Real-time signature preview
- Color-coded validation:
  - 🟢 **Green**: Valid configuration
  - 🟡 **Yellow**: Valid but unusual dose
  - 🔴 **Red**: Invalid configuration
- Days supply calculation (when package info is available)
- Collapsible interface to save space

### 2. Using Defaults in Signature Builder

When selecting a medication with saved defaults:

1. The medication selector shows a **"Defaults"** badge
2. Upon selection, fields auto-populate:
   - Dosage amount and unit
   - Frequency
   - Special instructions (if any)
3. Route is automatically set from medication's configured default route
4. A notification confirms defaults were loaded
5. Users can modify dosage, frequency, and special instructions as needed

## Data Structure

Default settings are stored in the `default_signature_settings` column as JSON:

```json
{
  "dosage": {
    "value": 100,
    "unit": "mg"
  },
  "frequency": "twice daily",
  "specialInstructions": "with food"
}
```

Note: Route is not stored in defaults as it comes from the medication's `defaultRoute` configuration.

## Implementation Details

### Database Schema

```sql
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS default_signature_settings jsonb;
```

### Component Architecture

1. **EmbeddedSignatureBuilder** (`src/components/EmbeddedSignatureBuilder.tsx`)
   - Compact signature testing interface
   - Live validation and preview
   - Saves defaults to parent form state

2. **MedicationForm** (`src/components/MedicationForm.tsx`)
   - Includes embedded builder when medication has required data
   - Persists defaults with medication save

3. **MedicationSelector** (`src/components/MedicationSelector.tsx`)
   - Shows defaults badge
   - Triggers callback when medication with defaults is selected
   - Displays loading notification

4. **App State Management** (`src/reducer.ts`)
   - `LOAD_DEFAULTS` action populates form fields
   - Maintains clean state separation

## User Workflows

### Setting Up a New Medication with Defaults

1. Navigate to **Medication Management** tab
2. Click **Add Medication**
3. Fill in medication details:
   - Name, dose form, active ingredient
   - Strength ratio (e.g., 100mg/5mL)
   - Package information
   - Allowed routes
   - Dosage constraints
4. Expand **Test Signature Output** section
5. Enter typical prescription values:
   - Common dosage (e.g., 10mg)
   - Standard frequency (e.g., "twice daily")
   - Any special instructions (if needed)
6. Verify the signature preview looks correct
7. Click **Save as Default**
8. Save the medication

### Using Defaults for Prescriptions

1. Go to **Signature Builder** tab
2. Select a medication
3. If defaults exist:
   - Fields auto-populate
   - Notification appears: "Default signature settings have been loaded"
4. Review/modify as needed
5. Generate signature

### Updating Defaults

1. Edit the medication in **Medication Management**
2. Adjust values in the embedded signature builder
3. Click **Save as Default** again
4. Save the medication

## Benefits

### Time Savings
- Eliminates repetitive data entry
- Reduces prescription creation time
- Maintains consistency across prescriptions

### Quality Assurance
- Validates signatures during medication setup
- Catches configuration errors early
- Ensures dosage constraints are respected

### Flexibility
- Defaults are suggestions, not requirements
- Users can always override values
- Supports medication-specific patterns

## Technical Notes

### Validation Logic

The embedded builder validates configurations by checking:

1. **Required fields**: All fields must be filled
2. **Dosage constraints**: 
   - Minimum dose limits
   - Maximum dose limits
   - Step increments
3. **Common dosage patterns**: Warns if dose is significantly different from typical values

### Performance Considerations

- Defaults are loaded synchronously with medication selection
- No additional API calls required
- Cached with medication data

### Database Migration

To enable this feature, run the following migration:

```sql
-- Add default_signature_settings column to medications table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS default_signature_settings jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN public.medications.default_signature_settings IS 
'Stores default signature settings for the medication including dosage, frequency, and special instructions';
```

## Troubleshooting

### Defaults Not Loading

1. **Check if column exists**: Run the verification script
   ```bash
   node scripts/verify-migration.js
   ```

2. **Verify medication has defaults**: Check in Medication Management tab

3. **Clear browser cache**: Force reload the application

### Validation Errors

- **Red border**: Configuration has errors (check constraints)
- **Yellow border**: Unusual but valid dose
- **Missing preview**: Fill in all required fields

## Future Enhancements

1. **Multiple defaults per medication**: Different defaults for different conditions
2. **Provider-specific defaults**: Personal preferences per user
3. **Smart suggestions**: ML-based default recommendations
4. **Bulk default import**: CSV upload for multiple medications
5. **Default templates**: Shareable configuration sets

## API Reference

### Medication Type

```typescript
interface Medication {
  // ... existing fields ...
  defaultSignatureSettings?: {
    dosage: {
      value: number;
      unit: string;
    };
    frequency: string;
    specialInstructions?: string;
  };
}
```

### Component Props

```typescript
interface EmbeddedSignatureBuilderProps {
  medication: Medication;
  defaultSettings?: DefaultSignatureSettings;
  onSaveDefaults?: (settings: DefaultSignatureSettings) => void;
}
```

### Reducer Actions

```typescript
type Action = 
  | { type: 'LOAD_DEFAULTS'; defaults: DefaultSignatureSettings }
  // ... other actions ...
```