# Medication Signature Builder

A web application for building standardized medication instructions (sigs) based on medication input, dosage, route, and frequency.

## Overview

The Medication Signature Builder allows healthcare providers to:

1. Select a medication from a predefined list
2. Choose a route of administration appropriate for the medication form
3. Specify dosage in the appropriate units (mg, mL, tablets, etc.)
4. Select frequency (daily, weekly, monthly, etc.)
5. Add special instructions when needed
6. Generate a standardized signature in both human-readable and FHIR format

## Features

- Dynamic form that adjusts based on medication properties
- Dual representation of dosages (weight-based and volume-based) for injectable medications
- Automatic calculation between mg and mL for medications with strength ratios
- Support for various dosage forms (tablets, capsules, solutions, etc.)
- Route-specific verb selection ("take", "inject", "apply", etc.)
- Special instructions handling for routes that require them
- FHIR-compatible output format

## Technology Stack

- React 18
- TypeScript
- Vite
- Bootstrap 5 for styling

## Data Model

The application uses several key data structures:

### Medication

Contains information about the medication including:
- Name, form, strength
- Ingredients with strength ratios (if applicable)
- Available routes of administration
- Common dosages

### Route

Information about how the medication is administered:
- Name and code
- Human-readable description
- FHIR codes
- Whether special instructions are required
- Templates for instruction formatting

### Frequency

Defines the timing for medication administration:
- Standard frequencies (daily, weekly, etc.)
- FHIR-compliant timing information
- Human-readable descriptions and medical abbreviations

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/SNRose0317/Med-Sig-Builder.git

# Navigate to the project directory
cd med-sig-builder

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Usage

1. Select a medication from the dropdown
2. Enter the appropriate dosage
3. Select the route of administration
4. Choose the frequency
5. Add any special instructions if required
6. Click "Generate Signature" to create the standardized medication instructions

## License

MIT
