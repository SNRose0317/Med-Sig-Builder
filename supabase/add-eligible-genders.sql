-- Add eligible_genders column to medications table
-- This field specifies which genders a medication is appropriate for

-- Add the column as text array with empty array default
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS eligible_genders text[] DEFAULT '{}';

-- Create GIN index for efficient array queries
-- This allows fast queries like: WHERE 'MALE' = ANY(eligible_genders)
CREATE INDEX IF NOT EXISTS medications_eligible_genders_idx 
ON public.medications USING GIN (eligible_genders);

-- Add comment for documentation
COMMENT ON COLUMN public.medications.eligible_genders IS 
'Array of genders this medication is eligible for. Values: MALE, FEMALE, OTHER. Empty array means no gender restrictions.';

-- Example of how to update existing medications (commented out)
-- UPDATE public.medications 
-- SET eligible_genders = ARRAY['MALE'] 
-- WHERE name LIKE '%Testosterone%200mg%';

-- UPDATE public.medications 
-- SET eligible_genders = ARRAY['FEMALE'] 
-- WHERE name LIKE '%Testosterone%25mg%';

-- UPDATE public.medications 
-- SET eligible_genders = ARRAY['MALE', 'FEMALE', 'OTHER'] 
-- WHERE name = 'Metformin';