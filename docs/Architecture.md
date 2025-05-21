# Medication Signature Builder - Architecture Documentation

## Overview

The Medication Signature Builder is a specialized application designed to convert medication details, dosage information, and timing instructions into standardized, human-readable signature instructions. It also generates FHIR-compliant JSON representations for integration with electronic health record systems.

## Core Concepts

1. **Medication Selection**: User selects medications from a standardized database.
2. **Dosage Configuration**: User inputs dosage in appropriate units (mg, mL, tablets, etc.).
3. **Instruction Configuration**: User selects frequency, route of administration, and special instructions.
4. **Signature Generation**: The application generates both human-readable and FHIR-compliant signatures.

## Architecture Design

```mermaid
graph TD
    A[Main Application] --> B[Medication Selection Module]
    A --> C[Dosage Configuration Module]
    A --> D[Instruction Builder Module]
    A --> E[Signature Preview Module]
    
    B --> B1[Medication Search]
    B --> B2[Medication Details]
    
    C --> C1[Dose Calculator]
    C --> C2[Unit Converter]
    C --> C3[Validation Engine]
    
    D --> D1[Frequency Mapper]
    D --> D2[Route Selector]
    D --> D3[Special Instructions]
    
    E --> E1[FHIR Generator]
    E --> E2[Human-Readable Formatter]
    E --> E3[Syntax Validator]
</mermaid>

## Data Models

### 1. Medication Model

```typescript
interface Medication {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  code: {
    coding: Array<{
      system?: string;
      code?: string;
      display: string;
    }>;
  };
  doseForm: string;
  totalVolume?: {
    value: number;
    unit: string;
  };
  extension?: Array<{
    "us-controlled"?: boolean;
    schedule?: string;
    [key: string]: any;
  }>;
  ingredient: Array<{
    name: string;
    strengthRatio: {
      numerator: {
        value: number;
        unit: string;
      };
      denominator: {
        value: number;
        unit: string;
      };
    };
  }>;
  allowedRoutes?: string[];
  defaultRoute?: string;
  commonDosages?: Array<{
    value: number;
    unit: string;
    frequency?: string;
  }>;
  dosageConstraints?: {
    minDose?: {
      value: number;
      unit: string;
    };
    maxDose?: {
      value: number;
      unit: string;
    };
    step?: number;
  };
}
```

### 2. Dose Form Model

```typescript
interface DoseForm {
  id: string;
  name: string;
  isCountable: boolean;
  defaultUnit: string;
  pluralUnit: string;
  applicableRoutes: string[];
  defaultRoute: string;
  verb: string;
}
```

### 3. Route of Administration (ROA) Model

```typescript
interface Route {
  id: string;
  name: string;
  code: string;
  description: string;
  applicableForms: string[];
  humanReadable: string;
  fhirCode: string;
  requiresSpecialInstructions: boolean;
  specialInstructionsTemplate?: string;
  verbMap?: Record<string, string>;
}
```

### 4. Frequency Model

```typescript
interface Frequency {
  id: string;
  name: string;
  count: number;
  frequency?: number;
  period?: number;
  periodUnit: string;
  humanReadable: string;
  abbreviation?: string;
  fhirMapping: {
    frequency?: number;
    period?: number;
    periodUnit: string;
    [key: string]: any;
  };
}
```

## Dual Dosage Representation

A key feature of this application is the ability to generate medication instructions that include both weight-based (mg) and volume-based (mL) dosage representations in a single signature line.

### Conversion Logic

```typescript
interface DualDosage {
  weightBased: {
    value: number;
    unit: string;
  };
  volumeBased: {
    value: number;
    unit: string;
  };
}

function calculateDualDosage(medication: Medication, userDosage: { value: number; unit: string }): DualDosage {
  // Get the medication strength ratio
  const strengthRatio = medication.ingredient[0].strengthRatio;
  const mgPerMl = strengthRatio.numerator.value / strengthRatio.denominator.value;
  
  let mgDose, mlDose;
  
  // Case 1: User entered weight-based dose (mg)
  if (userDosage.unit === 'mg') {
    mgDose = userDosage.value;
    mlDose = Number((userDosage.value / mgPerMl).toFixed(2));
  } 
  // Case 2: User entered volume-based dose (mL)
  else if (userDosage.unit === 'mL') {
    mlDose = userDosage.value;
    mgDose = Number((userDosage.value * mgPerMl).toFixed(0));
  }
  
  return {
    weightBased: { value: mgDose, unit: 'mg' },
    volumeBased: { value: mlDose, unit: 'mL' }
  };
}
```

### Example Output

For a medication like Testosterone Cypionate 200mg/mL:

- Input: 40mg, three times weekly
- Output: "Inject 40 mg, as 0.2 mL, intramuscularly three times weekly."

- Input: 0.2mL, three times weekly
- Output: "Inject 40 mg, as 0.2 mL, intramuscularly three times weekly."

### FHIR Representation of Dual Dosage

```json
{
  "dosageInstruction": {
    "route": "Intramuscularly",
    "doseAndRate": {
      "doseQuantity": {
        "value": 40,
        "unit": "mg"
      }
    },
    "extension": [{
      "url": "http://example.org/fhir/StructureDefinition/additional-dosage",
      "valueDosage": {
        "doseQuantity": {
          "value": 0.2,
          "unit": "mL"
        }
      }
    }],
    "timing": {
      "repeat": {
        "frequency": 3,
        "period": 1,
        "periodUnit": "wk"
      }
    }
  }
}
```

## Signature Generation Algorithm

The signature generation process follows these steps:

1. Retrieve the appropriate verb based on medication form and route
2. Format the dosage with appropriate units and dual representation if applicable
3. Retrieve the human-readable frequency
4. Build the signature based on route type and special instructions
5. Return both the human-readable signature and the FHIR representation

```typescript
function generateSignature(
  medication: Medication, 
  dosage: { value: number; unit: string }, 
  route: string, 
  frequency: string, 
  specialInstructions?: string
): { 
  humanReadable: string; 
  fhirRepresentation: any 
} {
  // Get appropriate verb based on medication form and route
  const doseForm = doseFormMap[medication.doseForm];
  const routeInfo = routeMap[route];
  const verb = routeInfo.verbMap?.[medication.doseForm] || doseForm.verb;
  
  // Determine if this medication should have dual representation
  const hasDualRepresentation = 
    medication.ingredient && 
    medication.ingredient[0].strengthRatio && 
    (medication.doseForm === 'Vial' || medication.doseForm === 'Solution');
  
  let doseText;
  
  if (hasDualRepresentation) {
    // Calculate dual dosage
    const dualDosage = calculateDualDosage(medication, dosage);
    
    // Format with both weight and volume
    doseText = `${dualDosage.weightBased.value} ${dualDosage.weightBased.unit}, as ${dualDosage.volumeBased.value} ${dualDosage.volumeBased.unit}`;
  } else {
    // Standard dosage formatting
    if (doseForm.isCountable && dosage.value === 1) {
      doseText = `${dosage.value} ${doseForm.defaultUnit}`;
    } else if (doseForm.isCountable) {
      doseText = `${dosage.value} ${doseForm.pluralUnit}`;
    } else {
      doseText = `${dosage.value} ${dosage.unit}`;
    }
  }
  
  // Get human-readable frequency
  const frequencyText = frequencyMap[frequency].humanReadable;
  
  // Build the signature based on route type
  let sig;
  
  if (routeInfo.requiresSpecialInstructions && specialInstructions) {
    // Use template with special instructions
    sig = routeInfo.specialInstructionsTemplate
      .replace('{dose}', doseText)
      .replace('{unit}', '')
      .replace('{route}', routeInfo.humanReadable)
      .replace('{frequency}', frequencyText)
      .replace('{site}', specialInstructions);
  } else {
    // Standard format
    sig = `${verb} ${doseText} ${routeInfo.humanReadable} ${frequencyText}`;
    
    // Add any special instructions if provided
    if (specialInstructions) {
      sig += ` ${specialInstructions}`;
    }
  }
  
  // Return both the human-readable sig and the FHIR representation
  return {
    humanReadable: sig.trim() + ".",
    fhirRepresentation: createFhirRepresentation(medication, dosage, route, frequency, specialInstructions)
  };
}
```

## File Structure

```
/med-sig-builder/
├── docs/
│   └── Architecture.md                 # This document
├── src/
│   ├── components/
│   │   ├── MedicationSelector.tsx      # Medication selection component
│   │   ├── DoseInput.tsx               # Dosage input component
│   │   ├── DoseFormSelector.tsx        # Dose form selection component
│   │   ├── RouteSelector.tsx           # Route selection component
│   │   ├── FrequencySelector.tsx       # Frequency selection component
│   │   └── ResultPanel.tsx             # Results display component
│   ├── data/
│   │   └── medications.json            # Medication database
│   ├── tables/
│   │   ├── doseForms.ts                # Dose form definitions
│   │   ├── routes.ts                   # Routes of administration data
│   │   ├── frequencyTable.ts           # Frequency definitions
│   │   └── verbs.ts                    # Action verb mappings
│   ├── utils/
│   │   └── buildDosage.ts              # Signature generation utility
│   ├── App.tsx                         # Main application component
│   └── reducer.ts                      # Application state management
├── index.html                          # Entry point HTML
└── README.md                           # Project overview
```

## Implementation Guidelines

### 1. Medication Selection Logic

- When a medication is selected:
  - Dynamically update available dose forms based on the medication
  - Set default route based on the most common administration method
  - Pre-populate common dosages if available

### 2. Dosage Input Logic

- For injectable medications:
  - Allow input in either mg or mL with automatic conversion
  - Apply dosage constraints (min/max values)
  - Display real-time conversion between weight and volume

### 3. Route Selection Logic

- Filter available routes based on the selected medication and dose form
- When route is changed:
  - Update verb selection
  - Toggle special instruction fields if required

### 4. Frequency Selection Logic

- Provide standard frequency options via dropdown
- Map selected frequency to both human-readable format and FHIR representation

### 5. Signature Generation Logic

- Convert all selections into standardized format
- Apply grammatical rules for readability
- Generate dual representation for applicable medications
- Produce both human-readable signature and FHIR-compatible JSON

## Business Rules

1. **Dose Form Compatibility**:
   - Only show routes compatible with the selected medication form
   - Automatically select default route for the chosen dose form

2. **Dose Validation**:
   - Enforce min/max dosage constraints for each medication
   - Validate dosage step increments
   - Provide warnings for unusual dosages

3. **Signature Generation**:
   - Select appropriate verbs based on route and dose form
   - Format plurals correctly based on dosage quantity
   - Handle special instructions intelligently

4. **Dual Dosage Representation**:
   - Only apply dual representation for medications with strength ratios
   - For weight to volume: Display to 2 decimal places (e.g., 0.25 mL)
   - For volume to weight: Round to nearest whole number for mg values
