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
- **Styling**: Tailwind CSS with custom Marek Health design system
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

## Recent Updates
### Refactoring (Phase 1-4 Complete)
- **Massive code reduction**: From 40+ files to 15 source files
- **Consolidated components**: 16 components → 4 focused components
- **Unified API layer**: 5 service files → 1 medications API
- **Simplified logic**: 722 lines of utilities → 399 lines in lib/
- **Preserved all functionality** while improving maintainability

### UI Styling Update (2025-07-04)
- Updated to match Marek Health design system
- Dark sidebar (gray-900) with emoji icons instead of SVG
- Light main content area (gray-800) 
- Tables with slightly darker background (gray-750)
- Consistent use of Marek brand colors throughout

## Project Structure (After Refactoring)
```
src/
├── api/                 # API layer
│   ├── medications.ts   # All CRUD operations with built-in caching
│   └── supabase.ts      # Client configuration
├── components/          # React components  
│   ├── App.tsx          # Main layout and routing
│   ├── ConnectionStatus.tsx    # Connection monitoring
│   ├── ErrorBoundary.tsx       # Error handling
│   ├── MedicationManager.tsx   # List/Add/Edit medications
│   ├── SignatureBuilder.tsx    # All signature inputs
│   └── SignatureResult.tsx     # Output display
├── lib/                 # Business logic
│   ├── signature.ts     # Signature generation (219 lines)
│   └── calculations.ts  # Days supply logic (180 lines)
├── constants/           
│   └── medication-data.ts # All reference data
├── types/              
│   └── index.ts        # TypeScript types
├── utils/              
│   └── errorLogger.ts  # Error logging utility
├── main.tsx            # App entry point
└── reducer.ts          # State management
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
The application has been successfully refactored to a minimal, clean codebase while preserving all functionality:
- **15 source files** (down from 40+)
- **Clear separation of concerns**: API, Components, Business Logic, Types
- **Optimized performance** with built-in caching
- **Maintained all features**: FHIR compliance, Topiclick support, dual dosing, etc.

## Key Business Logic Preserved
- **Topiclick conversion**: 4 clicks = 1 mL
- **Tablet fractioning**: Minimum 1/4 tablet
- **Dual dosage display**: "100 mg, as 2 mL" for injectables
- **Route-based verbs**: "Take" for oral, "Apply" for topical, etc.
- **Days supply calculation**: Handles all unit conversions
- **Dose validation**: Min/max constraints with step increments

## Integration Points
- FHIR-compatible output for healthcare system integration
- Supabase for cloud database storage
- Tailwind CSS for modern, responsive UI with Marek Health design system