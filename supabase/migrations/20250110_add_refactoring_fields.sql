-- Migration: Add new fields for medication profile refactoring
-- This migration adds fields to support the new MedicationProfile interface
-- while maintaining backward compatibility with existing applications

-- Add new columns for refactoring support
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
CREATE INDEX IF NOT EXISTS idx_medications_is_scored 
  ON medications(is_scored) 
  WHERE is_scored IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medications_vendor 
  ON medications(vendor) 
  WHERE vendor IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medications_position 
  ON medications(position) 
  WHERE position IS NOT NULL;

-- Add index for fractional medications
CREATE INDEX IF NOT EXISTS idx_medications_is_fractional 
  ON medications(is_fractional) 
  WHERE is_fractional = true;

-- Add index for taper medications
CREATE INDEX IF NOT EXISTS idx_medications_is_taper 
  ON medications(is_taper) 
  WHERE is_taper = true;

-- Add comments for documentation
COMMENT ON COLUMN medications.is_fractional IS 'Whether the medication supports fractional dosing';
COMMENT ON COLUMN medications.is_scored IS 'Tablet scoring capability: NONE, HALF, or QUARTER';
COMMENT ON COLUMN medications.is_taper IS 'Whether this medication is used in tapering regimens';
COMMENT ON COLUMN medications.is_multi_ingredient IS 'Computed: whether medication has multiple active ingredients';
COMMENT ON COLUMN medications.concentration_ratio IS 'Concentration as ratio for liquid medications (e.g., mg/mL)';
COMMENT ON COLUMN medications.molar_mass IS 'Molar mass for electrolyte conversions';
COMMENT ON COLUMN medications.custom_conversions IS 'Array of custom conversion rules for special cases';
COMMENT ON COLUMN medications.dispenser_metadata IS 'Metadata for special dispensers like Topiclick';
COMMENT ON COLUMN medications.total_volume IS 'Total volume for liquid medications';
COMMENT ON COLUMN medications.extension IS 'FHIR extensions for additional metadata';
COMMENT ON COLUMN medications.common_dosages IS 'Array of commonly prescribed dosages';
COMMENT ON COLUMN medications.eligible_genders IS 'Array of eligible genders: MALE, FEMALE, OTHER';
COMMENT ON COLUMN medications.vendor IS 'Medication vendor/manufacturer name';
COMMENT ON COLUMN medications.sku IS 'Stock keeping unit for inventory management';
COMMENT ON COLUMN medications.position IS 'Display position for ordering in UI';

-- Update the updated_at trigger to include new columns
DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();