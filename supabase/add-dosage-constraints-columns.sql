-- Add dosage constraints columns to the medications table

-- Check if the columns already exist before adding them
DO $$
BEGIN
    -- Add min_dose_value column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'medications' 
                  AND column_name = 'min_dose_value') THEN
        ALTER TABLE public.medications ADD COLUMN min_dose_value NUMERIC;
    END IF;

    -- Add min_dose_unit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'medications' 
                  AND column_name = 'min_dose_unit') THEN
        ALTER TABLE public.medications ADD COLUMN min_dose_unit TEXT;
    END IF;

    -- Add max_dose_value column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'medications' 
                  AND column_name = 'max_dose_value') THEN
        ALTER TABLE public.medications ADD COLUMN max_dose_value NUMERIC;
    END IF;

    -- Add max_dose_unit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'medications' 
                  AND column_name = 'max_dose_unit') THEN
        ALTER TABLE public.medications ADD COLUMN max_dose_unit TEXT;
    END IF;

    -- Add dose_step column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'medications' 
                  AND column_name = 'dose_step') THEN
        ALTER TABLE public.medications ADD COLUMN dose_step NUMERIC;
    END IF;
END $$;

-- Add comment explaining the purpose of these columns
COMMENT ON COLUMN public.medications.min_dose_value IS 'Minimum allowed dose value for the medication';
COMMENT ON COLUMN public.medications.min_dose_unit IS 'Unit for minimum dose (mg, mcg, etc.)';
COMMENT ON COLUMN public.medications.max_dose_value IS 'Maximum allowed dose value for the medication';
COMMENT ON COLUMN public.medications.max_dose_unit IS 'Unit for maximum dose (mg, mcg, etc.)';
COMMENT ON COLUMN public.medications.dose_step IS 'Step size for incrementing/decrementing doses';
