# Changelog

All notable changes to the Medication Signature Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Default Signature Settings**: Save and reuse preferred prescription settings for each medication
  - Embedded signature builder in medication forms for testing output
  - Auto-population of dosage, route, frequency, and special instructions
  - Visual indicators for medications with saved defaults
  - Real-time validation with color-coded feedback
- **Bi-directional Dosage Input**: Enter values in either unit with automatic conversion
  - Synchronized dual input fields (e.g., mg ↔ mL)
  - Support for various medication forms (injectables, tablets, creams with dispensers)
  - Debounced updates to prevent calculation loops
  - Responsive design that adapts to mobile screens
- Database migration for `default_signature_settings` column
- Verification scripts for database migrations
- Comprehensive documentation for new features

### Changed
- Enhanced MedicationSelector to show defaults badge and load notifications
- Updated reducer with LOAD_DEFAULTS action for state management
- Improved DoseInput component with dual input mode
- Updated medication form to include signature testing section
- Integrated Days Supply Calculator into the Test Signature Output section (removed standalone calculator)

### Technical
- Added `defaultSignatureSettings` field to Medication TypeScript interface
- Created `EmbeddedSignatureBuilder` component for inline testing
- Added migration file: `add-default-signature-settings.sql`
- Added helper scripts: `apply-migration.js` and `verify-migration.js`

## [1.2.0] - 2025-01-15

### Added
- Medication overview table and database integration
- Days supply calculator for medication packages
- Database connection status indicator
- Error boundary for better error handling
- Medication caching service for performance

### Changed
- Migrated from JSON file to Supabase database for medication storage
- Enhanced medication management with full CRUD operations
- Improved error handling with user-friendly messages

## [1.1.0] - 2025-01-08

### Added
- Support for special dispensers (Topiclick for creams)
- Package information tracking (quantity, unit, pack size)
- Dosage constraints (min/max doses)
- Days supply calculations

### Changed
- Enhanced medication data model
- Improved unit conversions for various dose forms

## [1.0.0] - 2024-12-15

### Initial Release
- Basic medication signature builder
- Support for common medications and dose forms
- Route and frequency selection
- Special instructions support
- Human-readable signature generation
- FHIR-compatible output