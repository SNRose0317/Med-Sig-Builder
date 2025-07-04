-- Add default_signature_settings column to medications table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS default_signature_settings jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN public.medications.default_signature_settings IS 
'Stores default signature settings for the medication including dosage, route, frequency, and special instructions';

-- Example structure:
-- {
--   "dosage": {
--     "value": 100,
--     "unit": "mg"
--   },
--   "route": "by mouth",
--   "frequency": "twice daily",
--   "specialInstructions": "with food"
-- }