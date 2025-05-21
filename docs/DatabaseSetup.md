# Setting Up the Supabase Database for Med Sig Builder

This guide outlines multiple methods to set up the database schema for the Medication Signature Builder application in Supabase.

## Method 1: Using the Supabase SQL Editor (Web UI)

This is the simplest approach for one-time setup.

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to the "SQL Editor" tab in the left sidebar
4. Click "New Query"
5. Copy and paste the entire contents of `supabase/medications-schema.sql` into the editor
6. Click "Run" to execute the SQL commands
7. Verify the table was created by checking the "Table Editor" tab

**Pros:** Simple, no additional tools required, immediate feedback
**Cons:** Manual process, not easily repeatable for CI/CD workflows

## Method 2: Using the Supabase CLI

The Supabase CLI provides a more developer-friendly workflow for managing database migrations.

### Prerequisites

1. Install the Supabase CLI:
```bash
# Using npm
npm install -g supabase

# Using Homebrew (macOS)
brew install supabase/tap/supabase
```

2. Log in to Supabase CLI:
```bash
supabase login
```

### Setup with Existing Schema

1. Link your local project with your Supabase project:
```bash
supabase link --project-ref your-project-reference
```
(Replace `your-project-reference` with the reference ID from your Supabase project URL)

2. Push the schema to your Supabase project:
```bash
# Navigate to project root
cd med-sig-builder

# Push only the schema (not data)
supabase db push --schema-only
```

### Creating Migrations from Scratch

If you prefer to manage database changes through migrations:

1. Initialize Supabase in your project (if not already done):
```bash
supabase init
```

2. Create a new migration:
```bash
supabase migration new create_medications_table
```

3. Copy the contents of `supabase/medications-schema.sql` into the newly created migration file in `.supabase/migrations/`

4. Apply the migration:
```bash
supabase db push
```

**Pros:** Reproducible, version-controlled, works well with CI/CD
**Cons:** Requires CLI setup, more complex initial configuration

## Method 3: Using Programmatic API Access

You can also use the Supabase Management API to programmatically manage your database.

```javascript
import { createClient } from '@supabase/supabase-js'

// Service role key with admin privileges (keep secure!)
const supabaseAdmin = createClient(
  'https://your-project.supabase.co',
  'your-service-role-key'
)

const setupDatabase = async () => {
  const schemaSQL = fs.readFileSync('./supabase/medications-schema.sql', 'utf8')
  
  const { error } = await supabaseAdmin.rpc('pg_execute', {
    query: schemaSQL
  })
  
  if (error) {
    console.error('Error setting up database:', error)
  } else {
    console.log('Database setup successfully')
  }
}
```

**Pros:** Can be integrated into setup scripts, fully automated
**Cons:** Requires service role key with elevated privileges (security risk), not recommended for client-side usage

## Method 4: Using Prisma with Supabase

For more complex applications, you might want to use Prisma as an ORM with Supabase.

1. Initialize Prisma:
```bash
npm install prisma --save-dev
npx prisma init
```

2. Configure database URL in `.env`:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

3. Define your schema in `prisma/schema.prisma`:
```prisma
model Medication {
  id            String   @id @default(uuid())
  name          String
  type          String
  isActive      Boolean  @default(true)
  code          Json?
  doseForm      String
  totalVolume   Json?
  extension     Json?
  dispenserInfo Json?
  ingredient    Json
  allowedRoutes String[]
  defaultRoute  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

4. Push the schema to your database:
```bash
npx prisma db push
```

**Pros:** Type-safe database operations, schema management, migrations
**Cons:** Adds another dependency, learning curve if you're not familiar with Prisma

## Troubleshooting Common Issues

### "Relation does not exist" Error

If you encounter the error: "Database error: relation 'public.medications' does not exist"

**Solution:**
1. Confirm your SQL was executed successfully in the Supabase dashboard
2. Check that the schema name matches (`public.medications`)
3. Verify your connection has the correct permissions

### Connection Issues

If you can't connect to your Supabase database:

1. Check that your `.env` file has the correct URL and API key
2. Make sure your API key has the necessary permissions
3. Confirm your IP isn't blocked by any database restrictions

### UUID Extension Missing

If you see an error about the UUID extension:

```sql
-- Run this in SQL Editor first before creating tables
create extension if not exists "uuid-ossp";
```

## Recommended Approach for This Project

For the Medication Signature Builder, we recommend:

1. **Development/Initial Setup**: Use the SQL Editor (Method 1) for quick setup
2. **Team Development**: Use Supabase CLI with migrations (Method 2) for version control
3. **Production Deployment**: Include migration in your CI/CD pipeline using either CLI or API approach
