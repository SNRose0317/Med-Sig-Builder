# FHIR Structure Viewer

## Overview

The FHIR Structure Viewer is a developer tool that provides complete visibility into the inner workings of the Med Sig Builder application. It displays the FHIR-compliant data structures for medications, user inputs, and generated prescription outputs in real-time.

## Purpose

This tool helps developers:
- Understand the complete data flow through the application
- See how user inputs are transformed into FHIR resources
- Debug prescription generation issues
- Validate FHIR compliance
- Learn the application's data architecture

## Features

### Three-Tab Interface

1. **Medication Resource Tab**
   - Shows the complete FHIR Medication resource
   - Includes all medication properties in FHIR format
   - Displays strength ratios, dose forms, and package information
   - Shows controlled substance extensions when applicable

2. **Current Inputs Tab**
   - Displays real-time user input values
   - Shows dosage, route, frequency, and special instructions
   - Updates immediately as users type or select values
   - Helps debug input validation issues

3. **MedicationRequest Output Tab**
   - Shows the generated FHIR MedicationRequest resource
   - Includes dosage instructions in FHIR format
   - Displays timing codes, route codes, and dose quantities
   - Shows both human-readable and FHIR representations

### Visual Features

- **Syntax Highlighting**: JSON is color-coded for easy reading
  - Red: Primary resource keys (resourceType, id, status)
  - Blue: Property names
  - Dark blue: String values
  - Blue: Numeric values
  - Red: Boolean values
  - Gray: Null values

- **Collapsible Interface**: Toggle visibility to save screen space
- **Developer Mode Badge**: Clearly indicates this is a developer tool
- **Responsive Design**: Scrollable content area for large JSON structures

## Implementation Details

### Component Location
`src/components/FHIRStructureViewer.tsx`

### Integration Points

1. **Main Signature Builder** (`src/App.tsx`)
   - Viewer appears below the signature builder form
   - Always visible to developers

2. **Embedded Signature Builder** (`src/components/EmbeddedSignatureBuilder.tsx`)
   - Viewer appears when the embedded builder is expanded
   - Helps test default signature settings

### Data Transformation

The viewer demonstrates several key transformations:

#### Medication Resource
```javascript
{
  resourceType: "Medication",
  id: "medication-id",
  code: { /* RxNorm codes */ },
  ingredient: [{ /* Strength ratios */ }],
  doseForm: { /* SNOMED codes */ },
  // ... additional FHIR properties
}
```

#### MedicationRequest with Dosage
```javascript
{
  resourceType: "MedicationRequest",
  dosageInstruction: [{
    text: "Take 2 tablets by mouth twice daily",
    timing: { /* FHIR timing structure */ },
    route: { /* SNOMED route codes */ },
    doseAndRate: [{ /* Structured dose */ }]
  }]
}
```

### Code Mappings

The viewer includes several important code mappings:

#### Frequency Codes
- `once daily` → `QD`
- `twice daily` → `BID`
- `three times daily` → `TID`
- `four times daily` → `QID`

#### Route Codes (SNOMED)
- `by mouth` → `26643006`
- `topical` → `45890007`
- `sublingual` → `37839007`
- And more...

## Usage

### For Developers

1. **Understanding Data Flow**
   - Select a medication to see its FHIR structure
   - Enter prescription details
   - Watch how inputs transform into FHIR resources
   - See the final MedicationRequest output

2. **Debugging**
   - Check if medication data is properly formatted
   - Verify user inputs are captured correctly
   - Ensure FHIR output matches expectations
   - Validate code mappings

3. **Learning**
   - Study FHIR resource structures
   - Understand medication data modeling
   - Learn prescription generation logic
   - See real-world FHIR implementation

### For QA/Testing

1. **Validation**
   - Verify all medication properties appear in FHIR format
   - Check timing calculations are correct
   - Ensure route and frequency codes map properly
   - Validate dose conversions

2. **Edge Cases**
   - Test with different medication types
   - Try various dosage units
   - Check controlled substance handling
   - Verify special instruction processing

## Technical Architecture

### State Management
The viewer receives props from parent components:
- `medication`: Current selected medication
- `dosage`: User-entered dose value and unit
- `route`: Selected administration route
- `frequency`: Selected frequency
- `specialInstructions`: Additional instructions
- `signature`: Generated signature object

### Performance
- Uses `useMemo` for expensive JSON transformations
- Only renders when expanded (in embedded builder)
- Efficient syntax highlighting with regex
- Minimal re-renders with proper React patterns

### Styling
- Self-contained CSS using styled components pattern
- Responsive design with proper scrolling
- Professional developer tool appearance
- Clear visual hierarchy

## Future Enhancements

1. **Export Functionality**
   - Copy JSON to clipboard
   - Download as file
   - Share via URL

2. **Validation Features**
   - FHIR validation against profiles
   - Highlight validation errors
   - Show warnings for non-standard usage

3. **Advanced Views**
   - XML format option
   - Side-by-side comparison
   - Diff view for changes
   - Resource relationship diagrams

4. **Developer Tools**
   - Console logging integration
   - Performance metrics
   - Memory usage tracking
   - API call inspection

## Troubleshooting

### Viewer Not Showing
1. Check if medication is selected
2. Verify component is imported correctly
3. Ensure props are passed properly

### JSON Formatting Issues
1. Verify data is valid JSON
2. Check for circular references
3. Ensure proper null handling

### Performance Issues
1. Large medication lists may slow initial render
2. Complex medications with many ingredients
3. Consider pagination for large datasets

## Best Practices

1. **Always include viewer in development builds**
2. **Consider removing or hiding in production**
3. **Use for onboarding new developers**
4. **Reference during code reviews**
5. **Include in documentation screenshots**

## Security Considerations

- Never expose PHI in the viewer
- Use mock data for demonstrations
- Consider access controls in production
- Sanitize any user-generated content

This tool provides unprecedented visibility into the Med Sig Builder's data architecture, making it easier to maintain, debug, and enhance the application.