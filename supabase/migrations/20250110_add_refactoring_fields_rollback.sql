-- Rollback migration: Remove refactoring fields
-- This rollback removes the fields added for the medication profile refactoring

-- Drop indexes first
DROP INDEX IF EXISTS idx_medications_is_scored;
DROP INDEX IF EXISTS idx_medications_vendor;
DROP INDEX IF EXISTS idx_medications_position;
DROP INDEX IF EXISTS idx_medications_is_fractional;
DROP INDEX IF EXISTS idx_medications_is_taper;

-- Remove columns
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

-- Note: The updated_at trigger will continue to work with remaining columns