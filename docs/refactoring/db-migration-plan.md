# Database Schema Migration Plan

## Overview
This document outlines the migration strategy for aligning the existing `medications` table with the new `MedicationProfile` interface introduced in the refactoring effort. The goal is to support new fields while maintaining backward compatibility and avoiding data transformation logic.

## Current vs Target Schema

### Current Schema (medications table)
```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('medication', 'supplement', 'compound')),
  is_active BOOLEAN DEFAULT true,
  dose_form TEXT NOT NULL,
  code JSONB,
  ingredient JSONB,
  package_info JSONB,
  dispenser_info JSONB,
  dosage_constraints_min_dose_value NUMERIC,
  dosage_constraints_min_dose_unit TEXT,
  dosage_constraints_max_dose_value NUMERIC,
  dosage_constraints_max_dose_unit TEXT,
  dosage_constraints_step NUMERIC,
  allowed_routes TEXT[],
  default_route TEXT,
  default_signature_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### New Fields Required
Based on the `MedicationProfile` interface, we need to add:

1. **Fractional Dosing Support**
   - `is_fractional` (BOOLEAN)
   - `is_scored` (TEXT) - enum values: 'NONE', 'HALF', 'QUARTER'

2. **Clinical Features**
   - `is_taper` (BOOLEAN)
   - `is_multi_ingredient` (BOOLEAN) - computed field

3. **Conversion & Calculation Data**
   - `concentration_ratio` (JSONB) - stores Ratio type
   - `molar_mass` (JSONB) - stores MolarMass type
   - `custom_conversions` (JSONB) - array of CustomConversion
   - `dispenser_metadata` (JSONB) - stores DispenserMetadata

4. **Additional Fields**
   - `total_volume` (JSONB) - stores Quantity
   - `extension` (JSONB) - FHIR extensions
   - `common_dosages` (JSONB) - array of common dosage objects
   - `eligible_genders` (TEXT[]) - array of gender values
   - `vendor` (TEXT)
   - `sku` (TEXT)
   - `position` (INTEGER)

## Migration Strategy

### Phase 1: Add New Columns (Non-Breaking)
```sql
-- Migration: 001_add_refactoring_fields.sql
ALTER TABLE medications
  -- Fractional dosing support
  ADD COLUMN IF NOT EXISTS is_fractional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_scored TEXT CHECK (is_scored IN ('NONE', 'HALF', 'QUARTER')),
  
  -- Clinical features
  ADD COLUMN IF NOT EXISTS is_taper BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_multi_ingredient BOOLEAN GENERATED ALWAYS AS 
    (jsonb_array_length(COALESCE(ingredient, '[]'::jsonb)) > 1) STORED,
  
  -- Conversion & calculation data
  ADD COLUMN IF NOT EXISTS concentration_ratio JSONB,
  ADD COLUMN IF NOT EXISTS molar_mass JSONB,
  ADD COLUMN IF NOT EXISTS custom_conversions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dispenser_metadata JSONB,
  
  -- Additional fields
  ADD COLUMN IF NOT EXISTS total_volume JSONB,
  ADD COLUMN IF NOT EXISTS extension JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS common_dosages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS eligible_genders TEXT[],
  ADD COLUMN IF NOT EXISTS vendor TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS position INTEGER;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_medications_is_scored ON medications(is_scored) WHERE is_scored IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medications_vendor ON medications(vendor) WHERE vendor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medications_position ON medications(position) WHERE position IS NOT NULL;
```

### Phase 2: Data Migration Rules

1. **Default Values**
   - `is_fractional`: Default to `false`, can be updated based on dose form
   - `is_scored`: Default to `NULL`, manually set based on medication data
   - `is_taper`: Default to `false`, set during medication configuration
   - `is_multi_ingredient`: Computed from ingredient array length

2. **Concentration Ratio Migration**
   - For liquid medications, derive from ingredient strength ratio
   - Example: 200mg/1mL → `{"numerator": {"value": 200, "unit": "mg"}, "denominator": {"value": 1, "unit": "mL"}}`

3. **Common Dosages**
   - Can be populated from historical prescription data
   - Format: `[{"value": 100, "unit": "mg", "frequency": "twice daily"}]`

### Phase 3: Dual-Write Strategy

During the transition period, the application will:

1. **Read Path**
   - Read from existing columns
   - Map to `MedicationProfile` interface in application code
   - New fields default to appropriate values if not present

2. **Write Path**
   - Write to both old and new columns
   - Maintain backward compatibility for existing clients
   - No data transformation in database layer

3. **Validation**
   - Add CHECK constraints for enum values
   - Validate JSONB structure for complex types
   - Ensure referential integrity

## Implementation Timeline

### Week 1-2 (During Epic 1)
- Create and test migration scripts
- Deploy schema changes to development environment
- Update database adapter to handle new fields

### Week 3-5 (During Epic 2-3)
- Implement dual-write logic in medication API
- Add validation for new fields
- Create data migration scripts for existing records

### Week 6+ (During Epic 4+)
- Monitor dual-write performance
- Gradually migrate existing records
- Update reporting to use new fields

## Rollback Plan

If issues arise, the migration can be rolled back:

```sql
-- Rollback: 001_rollback_refactoring_fields.sql
ALTER TABLE medications
  DROP COLUMN IF EXISTS is_fractional,
  DROP COLUMN IF EXISTS is_scored,
  DROP COLUMN IF EXISTS is_taper,
  DROP COLUMN IF EXISTS is_multi_ingredient,
  DROP COLUMN IF EXISTS concentration_ratio,
  DROP COLUMN IF EXISTS molar_mass,
  DROP COLUMN IF EXISTS custom_conversions,
  DROP COLUMN IF EXISTS dispenser_metadata,
  DROP COLUMN IF EXISTS total_volume,
  DROP COLUMN IF EXISTS extension,
  DROP COLUMN IF EXISTS common_dosages,
  DROP COLUMN IF EXISTS eligible_genders,
  DROP COLUMN IF EXISTS vendor,
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS position;

DROP INDEX IF EXISTS idx_medications_is_scored;
DROP INDEX IF EXISTS idx_medications_vendor;
DROP INDEX IF EXISTS idx_medications_position;
```

## Validation Queries

### Check for data integrity after migration
```sql
-- Verify computed field
SELECT id, name, 
  jsonb_array_length(COALESCE(ingredient, '[]'::jsonb)) as ingredient_count,
  is_multi_ingredient
FROM medications
WHERE is_multi_ingredient != (jsonb_array_length(COALESCE(ingredient, '[]'::jsonb)) > 1);

-- Check enum constraints
SELECT id, name, is_scored
FROM medications
WHERE is_scored NOT IN ('NONE', 'HALF', 'QUARTER')
  AND is_scored IS NOT NULL;

-- Validate JSONB structure
SELECT id, name, concentration_ratio
FROM medications
WHERE concentration_ratio IS NOT NULL
  AND (
    concentration_ratio->>'numerator' IS NULL OR
    concentration_ratio->>'denominator' IS NULL
  );
```

## Benefits of This Approach

1. **No Breaking Changes**: Existing applications continue to work
2. **No Complex Migrations**: Avoid flattening/un-flattening logic
3. **Gradual Adoption**: New features can be adopted incrementally
4. **Performance**: JSONB fields maintain query performance
5. **Type Safety**: Application layer ensures type safety via TypeScript

## Next Steps

1. Review migration plan with team
2. Create migration scripts in `supabase/migrations/`
3. Test migrations in development environment
4. Update database adapter to handle new fields
5. Document field mappings for API layer