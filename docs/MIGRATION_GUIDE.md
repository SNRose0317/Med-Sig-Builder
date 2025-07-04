# Database Migration Guide

## Default Signature Settings Migration

To enable the Default Signature Settings feature, you need to add a new column to your medications table.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase SQL Editor:
   https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql/new

2. Copy and paste this SQL:
   ```sql
   -- Add default_signature_settings column to medications table
   ALTER TABLE public.medications 
   ADD COLUMN IF NOT EXISTS default_signature_settings jsonb;

   -- Add comment to describe the column
   COMMENT ON COLUMN public.medications.default_signature_settings IS 
   'Stores default signature settings for the medication including dosage, route, frequency, and special instructions';
   ```

3. Click **Run** to execute the migration

4. Verify the migration succeeded by checking the table structure in the Table Editor

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

1. Install Supabase CLI (if not already installed):
   ```bash
   brew install supabase/tap/supabase
   ```

2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Apply the migration:
   ```bash
   supabase db push supabase/add-default-signature-settings.sql
   ```

### Option 3: Using the Verification Script

We've included a verification script to check if the migration has been applied:

```bash
node scripts/verify-migration.js
```

This script will:
- Check if the column exists
- Show you the exact SQL to run if it doesn't
- Confirm successful migration

### Migration Files

All database migrations are stored in the `/supabase` directory:

- `medications-schema.sql` - Initial table schema
- `add-package-info-column.sql` - Added package information support
- `add-dosage-constraints-columns.sql` - Added min/max dose constraints
- `add-default-signature-settings.sql` - **NEW** - Adds default signature settings

### Troubleshooting

#### Column already exists error
This is fine! The migration uses `IF NOT EXISTS` so it's safe to run multiple times.

#### Permission denied error
Make sure you're using the service role key or have appropriate permissions in your Supabase project.

#### Connection errors
1. Check your internet connection
2. Verify your Supabase project is active
3. Ensure your API keys are correct in `.env`

### Next Steps

After applying the migration:
1. Restart your development server
2. Edit a medication and test the embedded signature builder
3. Save default settings for common medications
4. Enjoy faster prescription creation!