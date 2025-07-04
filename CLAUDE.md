# Med Sig Builder - Claude AI Context

## Project Overview
The Medication Signature Builder is a React/TypeScript web application designed for healthcare providers to create standardized medication signatures (instructions) for prescriptions. It ensures clear, consistent medication instructions that follow healthcare best practices and FHIR standards.

## Core Purpose
- Generate human-readable medication instructions (e.g., "Take 1 tablet by mouth twice daily")
- Support complex dosing scenarios including special dispensers like Topiclick
- Calculate days supply based on package information and dosing
- Manage medications in a Supabase database
- Ensure FHIR compatibility for healthcare system integration

## Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Bootstrap (via CDN in index.html)
- **Database**: Supabase (PostgreSQL)
- **State Management**: useReducer hook with custom reducer
- **Package Manager**: npm

## Key Features

### 1. Medication Signature Building
- Select medication from database or local fallback
- Configure dose with appropriate units (mg, mL, tablets, clicks, etc.)
- Choose administration route (oral, intramuscular, topical, etc.)
- Set frequency (daily, twice daily, weekly, etc.)
- Add special instructions (with food, location-specific, etc.)
- Generate FHIR-compatible medication request data

### 2. Advanced Dosing Support
- **Unit Conversion**: Automatic conversion between weight (mg) and volume (mL) for injectables
- **Tablet Fractioning**: Supports doses like 1.5 tablets with minimum 1/4 tablet increments
- **Special Dispensers**: Topiclick support (4 clicks = 1 mL conversion)
- **Dosage Constraints**: Min/max dose validation and step increments

### 3. Days Supply Calculator
- Calculates how long a prescription will last based on:
  - Package information (quantity, unit)
  - Dose per administration
  - Frequency of administration
- Handles various dose forms (tablets, solutions, creams)

### 4. Medication Management
- View all medications in a sortable, filterable table
- Toggle medication active/inactive status
- Real-time database synchronization
- Local caching to reduce API calls

### 5. Database Features
- Supabase integration with Row Level Security
- Automatic timestamp tracking (created_at, updated_at)
- UUID-based medication IDs
- JSONB fields for complex nested data
- Database adapter for camelCase/snake_case conversion

## Recent Changes (Uncommitted)
- Added ConnectionStatus component for monitoring Supabase connectivity
- Added ErrorBoundary component for better error handling
- Implemented medication caching service to reduce duplicate API calls
- Modified MedicationSelector and MedicationOverviewTable
- Updated Supabase client configuration
- Added test-supabase.html for connection testing
- Added scripts/check-supabase-data.js for database verification

## Project Structure
```
src/
├── components/          # React components
│   ├── ConnectionStatus.tsx    # NEW: Connection monitoring
│   ├── DaysSupplyCalculator.tsx
│   ├── DoseInput.tsx
│   ├── ErrorBoundary.tsx       # NEW: Error handling
│   ├── FrequencySelector.tsx
│   ├── MedicationForm.tsx
│   ├── MedicationManagement.tsx
│   ├── MedicationOverviewTable.tsx
│   ├── MedicationSelector.tsx
│   ├── RouteSelector.tsx
│   ├── SignatureOutput.tsx
│   └── SpecialInstructions.tsx
├── services/            # External service integrations
│   ├── dbAdapter.ts     # Database field mapping
│   ├── dbAdapter.ext.ts # Extended DB mapping for constraints
│   ├── medicationCache.ts  # NEW: Caching layer
│   ├── medicationService.ts
│   └── supabaseClient.ts
├── tables/             # Reference data
├── utils/              # Utility functions
├── App.tsx            # Main application component
├── reducer.ts         # State management
└── types.ts          # TypeScript interfaces
```

## Database Schema
- **Table**: `medications`
- **Key Fields**:
  - `id` (UUID)
  - `name`, `type`, `dose_form`
  - `is_active` (boolean)
  - `code`, `ingredient` (JSONB)
  - `package_info`, `dispenser_info` (JSONB)
  - `dosage_constraints` (flattened to individual columns)
  - Timestamps with automatic triggers

## Environment Setup
- Requires `.env` file with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Database setup via SQL scripts in `supabase/` directory

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run setup-db` - Initialize database

## Current State
The application is functional with both signature building and medication management features. Recent work has focused on improving error handling, connection monitoring, and performance through caching. The UI uses a tabbed interface to separate the signature builder from medication management.

## Known Issues/TODOs
- Some files have uncommitted changes that need to be reviewed
- Connection status banner provides user feedback when Supabase is unreachable
- Caching layer reduces redundant API calls but may need cache invalidation strategy

## Integration Points
- FHIR-compatible output for healthcare system integration
- Supabase for cloud database storage
- Bootstrap for consistent healthcare UI patterns