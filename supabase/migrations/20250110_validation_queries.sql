-- Validation queries for medication profile refactoring migration
-- Run these after applying the migration to ensure data integrity

-- 1. Verify computed is_multi_ingredient field
WITH ingredient_check AS (
  SELECT 
    id, 
    name,
    jsonb_array_length(COALESCE(ingredient, '[]'::jsonb)) as actual_count,
    is_multi_ingredient,
    CASE 
      WHEN jsonb_array_length(COALESCE(ingredient, '[]'::jsonb)) > 1 THEN true
      ELSE false
    END as expected_multi
  FROM medications
)
SELECT 
  COUNT(*) as mismatched_count,
  array_agg(name) as mismatched_medications
FROM ingredient_check
WHERE is_multi_ingredient != expected_multi;

-- 2. Check is_scored enum constraint
SELECT 
  COUNT(*) as invalid_scored_count,
  array_agg(name || ' (' || is_scored || ')') as invalid_entries
FROM medications
WHERE is_scored IS NOT NULL 
  AND is_scored NOT IN ('NONE', 'HALF', 'QUARTER');

-- 3. Validate concentration_ratio JSONB structure
SELECT 
  id,
  name,
  concentration_ratio
FROM medications
WHERE concentration_ratio IS NOT NULL
  AND (
    concentration_ratio->'numerator'->>'value' IS NULL OR
    concentration_ratio->'numerator'->>'unit' IS NULL OR
    concentration_ratio->'denominator'->>'value' IS NULL OR
    concentration_ratio->'denominator'->>'unit' IS NULL OR
    NOT (concentration_ratio->'numerator'->>'value')::text ~ '^[0-9]+\.?[0-9]*$' OR
    NOT (concentration_ratio->'denominator'->>'value')::text ~ '^[0-9]+\.?[0-9]*$'
  );

-- 4. Validate molar_mass JSONB structure
SELECT 
  id,
  name,
  molar_mass
FROM medications
WHERE molar_mass IS NOT NULL
  AND (
    molar_mass->>'value' IS NULL OR
    molar_mass->>'unit' IS NULL OR
    NOT (molar_mass->>'value')::text ~ '^[0-9]+\.?[0-9]*$'
  );

-- 5. Validate custom_conversions array structure
SELECT 
  id,
  name,
  jsonb_array_element(custom_conversions, 0) as first_conversion
FROM medications
WHERE jsonb_array_length(custom_conversions) > 0
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(custom_conversions) AS conv
    WHERE conv->'from'->>'value' IS NULL
      OR conv->'from'->>'unit' IS NULL
      OR conv->'to'->>'value' IS NULL
      OR conv->'to'->>'unit' IS NULL
      OR conv->>'factor' IS NULL
      OR NOT (conv->>'factor')::text ~ '^[0-9]+\.?[0-9]*$'
  );

-- 6. Check eligible_genders values
SELECT 
  COUNT(*) as invalid_gender_count,
  array_agg(name) as medications_with_invalid_genders
FROM medications
WHERE eligible_genders IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM unnest(eligible_genders) AS gender
    WHERE gender NOT IN ('MALE', 'FEMALE', 'OTHER')
  );

-- 7. Summary statistics
SELECT 
  COUNT(*) as total_medications,
  COUNT(*) FILTER (WHERE is_fractional = true) as fractional_count,
  COUNT(*) FILTER (WHERE is_scored IS NOT NULL) as scored_count,
  COUNT(*) FILTER (WHERE is_taper = true) as taper_count,
  COUNT(*) FILTER (WHERE is_multi_ingredient = true) as multi_ingredient_count,
  COUNT(*) FILTER (WHERE concentration_ratio IS NOT NULL) as with_concentration_ratio,
  COUNT(*) FILTER (WHERE molar_mass IS NOT NULL) as with_molar_mass,
  COUNT(*) FILTER (WHERE jsonb_array_length(custom_conversions) > 0) as with_custom_conversions,
  COUNT(*) FILTER (WHERE vendor IS NOT NULL) as with_vendor,
  COUNT(*) FILTER (WHERE eligible_genders IS NOT NULL) as with_gender_restrictions
FROM medications;