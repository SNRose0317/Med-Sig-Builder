# Medication Signature Builder

A user-friendly web application for creating standardized medication instructions (known as medication "sigs" in healthcare) based on medication details, dosage, and frequency.

## What is a Medication Signature?

A medication signature (or "sig") is the part of a prescription that tells a patient how to take their medication. For example:

> "Take 1 tablet by mouth twice daily"

This application helps healthcare providers create these instructions in a standardized format, ensuring accuracy and consistency.

## How It Works

1. **Select a Medication**: Choose from a dropdown list of medications
2. **Enter the Dose**: Specify how much medication to take (in mg, mL, tablets, etc.)
3. **Choose How Often**: Select a frequency (daily, twice daily, weekly, etc.)
4. **Add Special Instructions**: Include any additional directions if needed
5. **Generate**: The app creates a properly formatted medication signature

The application automatically adjusts the available options based on the type of medication selected. For example, if you select an injectable medication, it will show options for injection routes. If you select a tablet, it will show oral routes.

## Understanding Medication Signatures

A complete medication signature typically includes:

- **Verb**: The action to take (take, inject, apply)
- **Dose**: The amount of medication (1 tablet, 500 mg, 2 sprays)
- **Route**: How to administer the medication (by mouth, intramuscularly, topically)
- **Frequency**: When to take the medication (daily, twice daily, weekly)
- **Special Instructions**: Additional directions (with food, in left arm)

For example:
- "**Take** (verb) **1 tablet** (dose) **by mouth** (route) **twice daily** (frequency) **with food** (special instruction)"
- "**Inject** (verb) **0.5 mL** (dose) **subcutaneously** (route) **once weekly** (frequency) **in the abdomen** (special instruction)"

## Technical Details

### For Developers

The Medication Signature Builder is built with:
- React 18
- TypeScript
- Vite
- Bootstrap 5 for styling

### Data Model

The application uses several key data structures:

- **Medication**: Contains details about the medication including name, form, strength, ingredients, and available routes
- **Route**: Information about how the medication is administered
- **Frequency**: Defines when the medication should be taken
- **FHIR Compatibility**: Outputs data that can be used in healthcare information systems

For more detailed information on how medication signatures are constructed and the logic behind the application, please see the [detailed documentation](./DOCUMENTATION.md).

## Installation

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

## License

MIT
