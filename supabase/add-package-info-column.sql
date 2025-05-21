-- Add package_info column to medications table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'medications'
        AND column_name = 'package_info'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medications
        ADD COLUMN package_info jsonb;
        
        RAISE NOTICE 'Added package_info column to medications table';
    ELSE
        RAISE NOTICE 'package_info column already exists in medications table';
    END IF;
END
$$;
