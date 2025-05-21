# Medication Signature Builder: Detailed Documentation

This document provides a comprehensive explanation of how the Medication Signature Builder works, including the underlying logic, data structures, and transformation processes.

## Understanding Medication Signatures

### What is a Medication Signature?

A medication signature (commonly called a "sig" in healthcare) is a standardized set of instructions that tell a patient:
- What medication to take
- How much to take (dose)
- How to take it (route of administration)
- When to take it (frequency)
- Any special instructions

For example: "Take 1 tablet by mouth twice daily with food."

### Components of a Medication Signature

1. **Verb**: The action word that describes what to do with the medication
   - Examples: take, inject, apply, insert, spray
   - Each route of administration has appropriate verbs

2. **Dose**: The amount of medication to be administered
   - Can be expressed in various units depending on the medication:
     - Weight-based units: mg, mcg, g
     - Volume-based units: mL
     - Count-based units: tablets, capsules, sprays, drops
   - May include dose conversion (e.g., "500 mg (1 tablet)")

3. **Route**: The path by which the medication enters the body
   - Examples: by mouth (oral), intramuscular, subcutaneous, topical, rectal
   - Determines what verbs are appropriate

4. **Frequency**: How often the medication should be taken
   - Examples: once daily, twice daily, every 8 hours, once weekly
   - Maps to standard timing codes in healthcare systems

5. **Special Instructions**: Additional information needed for proper administration
   - Examples: with food, on an empty stomach, in the left eye, before bedtime

## The Logic of Building a Medication Signature

### 1. Medication Selection Logic

When a user selects a medication, the application:
- Identifies the medication's dose form (tablet, solution, cream, etc.)
- Determines appropriate routes of administration based on dose form
- Sets up appropriate dose units based on the medication's properties
- Configures unit conversion if applicable (e.g., for injectable medications)

For example:
- Selecting a tablet medication will enable oral routes and units like "mg" or "tablets"
- Selecting an injectable medication will enable injection routes and units like "mL" or "mg"

### 2. Dose Representation Logic

Medications can have complex dosing representations:

#### For Simple Medications (e.g., tablets, capsules):
- Weight (e.g., 500 mg) and count (e.g., 1 tablet) are interchangeable
- The application calculates the conversion: "500 mg (1 tablet)" or "1 tablet (500 mg)"

#### For Injectable Medications:
- Often have a strength ratio (e.g., 200 mg per 1 mL)
- The dose can be expressed in weight or volume: "200 mg" or "1 mL"
- The application calculates the equivalent doses

#### For Topical Medications:
- May be dosed by application amount or by weight/percentage
- The application provides appropriate units

### 3. Frequency Mapping

Each frequency selection maps to:
- Human-readable text ("twice daily")
- Medical abbreviation ("BID")
- FHIR-compatible timing objects that include:
  - Period (how long between doses)
  - Period unit (day, week, month)
  - Frequency (how many times per period)

For example, "twice daily" becomes:
```json
{
  "timing": {
    "repeat": {
      "frequency": 2,
      "period": 1,
      "periodUnit": "d"
    }
  }
}
```

### 4. Building the Final Signature

The application assembles the signature by:
1. Selecting the appropriate verb based on the route
2. Formatting the dose with appropriate units
3. Adding the route phrase (e.g., "by mouth", "intramuscularly")
4. Appending the frequency (e.g., "twice daily")
5. Adding any special instructions

## FHIR Compatibility

The application generates medication instructions that conform to the Fast Healthcare Interoperability Resources (FHIR) standard, which is widely used for healthcare data exchange.

### FHIR MedicationRequest Structure

```json
{
  "dosageInstruction": {
    "route": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "26643006",
          "display": "Oral route"
        }
      ]
    },
    "doseAndRate": {
      "doseQuantity": {
        "value": 500,
        "unit": "mg",
        "system": "http://unitsofmeasure.org",
        "code": "mg"
      }
    },
    "timing": {
      "repeat": {
        "frequency": 2,
        "period": 1,
        "periodUnit": "d"
      }
    },
    "text": "Take 500 mg by mouth twice daily"
  }
}
```

## Implementation Details

### Medication Data Structure

```typescript
interface Medication {
  name: string;
  type: string;
  isActive: boolean;
  Medication: {
    code: {
      coding: Array<{
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
    }>;
  };
  ingredient?: Array<{
    name: string;
    strengthRatio?: {
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
  MedicationRequest: {
    dosageInstruction: {
      route: string;
      doseAndRate: {
        doseQuantity: {
          value: number;
          unit: string;
        };
      };
      timing: {
        repeat: {
          count?: number;
          periodUnit: string;
        };
      };
    };
  };
}
```

### Frequency Data Structure

```typescript
interface FrequencyOption {
  label: string;
  value: string;
  abbreviation: string;
  timing: {
    repeat: {
      frequency?: number;
      period?: number;
      periodUnit: string;
      count?: number;
    };
  };
}
```

### Route Data Structure

```typescript
interface Route {
  code: string;
  display: string;
  verb: string;
  requiresLocation: boolean;
}
```

## Signature Generation Process

1. **Input Collection**:
   - Medication is selected from a predefined list
   - Dose is entered with appropriate units
   - Route is selected based on available options for the medication
   - Frequency is selected from standardized options
   - Special instructions are optionally added

2. **Data Transformation**:
   - The application converts units if necessary (e.g., mg to tablets)
   - It selects the appropriate verb based on the route
   - It formats the dose with appropriate units
   - It constructs the frequency phrase

3. **Output Generation**:
   - A human-readable signature is generated (e.g., "Take 1 tablet by mouth twice daily")
   - A FHIR-compatible data structure is created for integration with other systems
   - Both formats are displayed to the user

## Best Practices for Medication Signatures

- **Clarity**: Instructions should be clear and unambiguous
- **Completeness**: All necessary components should be included
- **Consistency**: Similar medications should have similarly structured instructions
- **Standard Terminology**: Using consistent terminology improves patient understanding

## Examples of Generated Signatures

### Oral Medication (Tablet)
- Input:
  - Medication: Amoxicillin 500mg/capsule
  - Dose: 500 mg (1 capsule)
  - Route: Oral
  - Frequency: Twice daily
  - Special Instructions: With food
- Output:
  - "Take 1 capsule (500 mg) by mouth twice daily with food"

### Injectable Medication
- Input:
  - Medication: Testosterone Cypionate 200mg/mL
  - Dose: 200 mg (1 mL)
  - Route: Intramuscular
  - Frequency: Once weekly
  - Special Instructions: In left gluteal muscle
- Output:
  - "Inject 1 mL (200 mg) intramuscularly once weekly in left gluteal muscle"

### Nasal Spray
- Input:
  - Medication: Fluticasone Propionate 50mcg/spray
  - Dose: 2 sprays (100 mcg)
  - Route: Intranasal
  - Frequency: Once daily
  - Special Instructions: In each nostril
- Output:
  - "Spray 2 sprays (100 mcg) into each nostril once daily"
