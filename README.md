# Medication Signature Builder

A web application for creating standardized medication signatures (instructions) for prescriptions. The application helps healthcare providers create clear, consistent medication instructions that can be included in prescriptions.

## Features

- Create medication signatures using a structured form
- Select from common medications with predefined dose forms
- Support for special dispensers like Topiclick for creams
- Automatic conversion between different units (mg, mL, tablets, etc.)
- Generate human-readable instructions that follow best practices
- Manage medications in a database
- **NEW: Default Signature Settings** - Save preferred prescription settings for each medication
- **NEW: Bi-directional Dosage Input** - Enter values in either unit with real-time conversion

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- Supabase account (for database functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/med-sig-builder.git
cd med-sig-builder
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and update with your Supabase credentials:
```bash
cp .env.example .env
```

Update the `.env` file with your Supabase URL and anon key:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database schema in Supabase (multiple methods available):
   
   **Method 1: Using our setup script:**
   ```bash
   npm run setup-db
   ```
   This script will:
   - Check if your database is properly configured
   - Use your Supabase service role key (if available) to set up the tables automatically
   - Provide detailed instructions if the anon key doesn't have sufficient permissions
   
   **Method 2: Manual setup via SQL Editor:**
   - Log in to your [Supabase Dashboard](https://app.supabase.com/)
   - Select your project
   - Navigate to the SQL Editor
   - Create a new query
   - Copy and paste the contents of `supabase/medications-schema.sql` into the editor
   - Run the query to create the table, policies, and triggers
   
   **For more options**, see our [Database Setup Guide](docs/DatabaseSetup.md) which covers:
   - Using the Supabase CLI
   - Creating migrations
   - Programmatic API access
   - Using Prisma with Supabase

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173` (or whatever port Vite assigns)

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `data/` - Local data (used as fallback or for initialization)
  - `services/` - API services for external data sources
  - `tables/` - Reference data (frequencies, routes, verbs, etc.)
  - `utils/` - Utility functions

## Database Connection Troubleshooting

If you see the error "Database connection error: Database error: relation 'public.medications' does not exist", this means the medications table hasn't been created in your Supabase database yet. 

To fix this:

1. Make sure your Supabase URL and anon key are correctly set in the `.env` file.
2. Follow step 4 in the installation instructions to create the medications table in your Supabase database.
3. If you want to verify if your connection to Supabase is working, check your network requests in the browser developer tools.

If you're still having issues connecting to Supabase:

1. Check if the Supabase service is running by logging into your Supabase dashboard
2. Verify there are no restrictions on your API keys
3. Check if your database migrations ran successfully

## New Features

### Default Signature Settings
Save time by storing preferred prescription settings for each medication. When you select a medication with saved defaults, the dosage, route, frequency, and special instructions automatically populate. [Learn more](docs/DEFAULT_SIGNATURE_SETTINGS.md)

### Bi-directional Dosage Input
Enter dosage values in either unit (e.g., mg or mL) and see real-time conversion in the companion field. This feature works with:
- Injectable solutions (mg ↔ mL)
- Tablets/Capsules (tablets ↔ mg)
- Creams with dispensers (clicks ↔ mL ↔ mg)
- And more!

## Development Documentation

For detailed information about the application architecture and design, see:

- [Architecture Documentation](docs/Architecture.md)
- [Topiclick Dispenser Integration](docs/TopiclickDispenser.md)
- [Default Signature Settings](docs/DEFAULT_SIGNATURE_SETTINGS.md)
- [Main Documentation](DOCUMENTATION.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
