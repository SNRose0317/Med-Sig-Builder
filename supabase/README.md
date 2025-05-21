# Supabase Integration for Medication Signature Builder

This directory contains files related to the Supabase database integration for the Medication Signature Builder application.

## Setup Instructions

### 1. Schema Setup

To set up the database schema in your Supabase project:

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `https://wazdaloyxlsxnmuhgtms.supabase.co`
3. Navigate to the SQL Editor
4. Create a new query
5. Copy and paste the contents of `medications-schema.sql` into the editor
6. Run the query to create the table, policies, and triggers

Alternatively, you can use the Supabase CLI to apply the schema:

```bash
supabase login
supabase link --project-ref wazdaloyxlsxnmuhgtms
supabase db push --schema-only
```

### 2. Integration with the Application

The application is already set up to connect to your Supabase instance with the following files:

- `src/services/supabaseClient.ts` - Sets up the Supabase client connection
- `src/services/medicationService.ts` - Provides functions for CRUD operations on medications

### 3. Data Model

The medication data model in Supabase includes:

- Basic information (name, type, active status)
- Dosage information (dose form, strength, etc.)
- Dispenser information (for special dispensers like TopiClick)
- Route information (how the medication is administered)

### 4. Security

The current setup uses Row Level Security (RLS) with an open policy for development purposes. For production, you should implement more restrictive policies based on user authentication.

### 5. Backup and Maintenance

It's recommended to:

- Set up regular backups of your Supabase database
- Monitor database performance and storage usage
- Periodically review and clean up unused data

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check the browser console for error messages
2. Verify your API key and URL in `supabaseClient.ts`
3. Ensure your database schema matches the expected structure
4. Check that the RLS policies allow the operations you're trying to perform

For more help, refer to the [Supabase documentation](https://supabase.com/docs).
