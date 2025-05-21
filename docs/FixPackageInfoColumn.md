# Fixing the Package Info Column Issue

This document addresses the error:

```
Failed to save medication: Database error while saving medication: Could not find the 'package_info' column of 'medications' in the schema cache
```

## Problem

The error indicates that the application is trying to access a column named `package_info` in the `medications` table, but this column doesn't exist in the schema cache. This could be due to one of the following:

1. The column actually doesn't exist in the database
2. The column exists but with a different name or case sensitivity
3. The schema cache is out of date and needs to be refreshed

## Solution Steps

### 1. Add Missing Column If Needed

Run the SQL script `add-package-info-column.sql` to add the column if it doesn't exist:

```sql
-- Check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'medications' 
                  AND column_name = 'package_info') THEN
        -- Add the package_info column as JSONB type
        ALTER TABLE public.medications ADD COLUMN package_info JSONB;
        
        -- Add a comment explaining the column
        COMMENT ON COLUMN public.medications.package_info IS 'JSON containing package details (quantity, unit, etc.)';
    END IF;
END $$;
```

### 2. Verify Column Existence

After running the script, verify that the column exists:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'medications'
AND column_name = 'package_info';
```

### 3. Refresh Schema Cache

If the column exists but the application still can't find it:

1. Restart the Supabase service or client
2. Clear any cached schema information in the application

### 4. Updating Application Code

Make sure the application uses consistent naming:

- Application: `packageInfo` (camelCase)
- Database: `package_info` (snake_case)

The application should correctly convert between these naming conventions when interacting with the database.

## Implementation Details

The fix includes:

1. Adding the missing column to the database
2. Enhancing the `dbAdapter.ts` and `dbAdapter.ext.ts` files to correctly handle package information
3. Updating the `medicationService.ts` file to use these adapters properly

## Verifying the Fix

After applying these changes, test saving a medication with package information to confirm the issue is resolved.
