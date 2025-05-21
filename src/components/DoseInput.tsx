import React, { useEffect, useState, useCallback } from 'react';
import { Medication } from '../types';
import { DoseInput as DoseInputType, calculateDualDosage } from '../utils/buildDosage';
import doseForms from '../tables/doseForms';

interface DoseInputProps {
  medication: Medication | null;
  dosage: DoseInputType;
  onUpdateDosage: (dosage: DoseInputType) => void;
  error?: string;
}

const DoseInput: React.FC<DoseInputProps> = ({
  medication,
  dosage,
  onUpdateDosage,
  error
}) => {
  const [dualDosage, setDualDosage] = useState<{
    weightBased: { value: number; unit: string };
    volumeBased: { value: number; unit: string };
  } | null>(null);

  const [dispenserDosage, setDispenserDosage] = useState<{
    value: number;
    unit: string;
  } | null>(null);

  const [unitOptions, setUnitOptions] = useState<string[]>(['mg']);

  // Update unit options when medication changes
  useEffect(() => {
    if (!medication) return;

    let options: string[] = [];
    const doseForm = medication.doseForm;
    const strengthRatio = medication.ingredient?.[0]?.strengthRatio;

    // For vials and solutions, allow both mg and mL
    if (doseForm === 'Vial' || doseForm === 'Solution') {
      options = ['mg', 'mL'];
    } 
    // For countable items (tablets, capsules, etc.), provide both the item and the strength
    else if (['Tablet', 'Capsule', 'Patch', 'ODT'].includes(doseForm)) {
      if (strengthRatio) {
        options = [
          doseForm.toLowerCase(), 
          strengthRatio.numerator.unit
        ];
      } else {
        options = [doseForm.toLowerCase()];
      }
    }
    // For nasal sprays, offer both spray count and mcg
    else if (doseForm === 'Nasal Spray') {
      if (strengthRatio) {
        options = [
          'spray',
          strengthRatio.numerator.unit
        ];
      } else {
        options = ['spray'];
      }
    }
    // For creams and other topicals
    else if (['Cream', 'Gel', 'Foam', 'Shampoo'].includes(doseForm)) {
      if (strengthRatio) {
        options = [
          'application',
          strengthRatio.numerator.unit
        ];
        
        // Add dispenser unit (clicks) for creams with Topiclick
        const doseFormInfo = doseForms[doseForm];
        if (doseFormInfo.hasSpecialDispenser && doseFormInfo.dispenserConversion) {
          options.push('mL'); // Base unit for conversion
          options.push(doseFormInfo.dispenserConversion.dispenserUnit); // Add 'click' as an option
        }
      } else {
        options = ['application'];
      }
    }
    // For other forms, try to determine the appropriate units
    else {
      if (strengthRatio) {
        options = [
          strengthRatio.denominator.unit,
          strengthRatio.numerator.unit
        ];
      } else {
        options = ['mg']; // Default to mg if no specific unit can be determined
      }
    }

    // Remove duplicates and filter out empty values
    options = [...new Set(options)].filter(Boolean);
    
    setUnitOptions(options);
    
    // If the current unit is not in the new options, update to the first available
    if (!options.includes(dosage.unit)) {
      onUpdateDosage({ ...dosage, unit: options[0] });
    }
  }, [medication, dosage.unit, onUpdateDosage]);

  // Check if dose is within constraints (if defined)
  const checkDoseConstraints = useCallback((value: number, unit: string) => {
    if (!medication?.dosageConstraints) return null;
    
    const { minDose, maxDose } = medication.dosageConstraints;
    
    // Only apply constraints if the units match
    if (minDose && minDose.unit === unit && value < minDose.value) {
      return `Min dose: ${minDose.value} ${minDose.unit}`;
    }
    
    if (maxDose && maxDose.unit === unit && value > maxDose.value) {
      return `Max dose: ${maxDose.value} ${maxDose.unit}`;
    }
    
    return null;
  }, [medication]);
  
  // Apply dose constraints when unit changes
  useEffect(() => {
    if (!medication || !medication.dosageConstraints) return;
    
    const { minDose, maxDose, step } = medication.dosageConstraints;
    
    // Only apply constraints if the units match
    if (minDose && minDose.unit === dosage.unit && dosage.value < minDose.value) {
      // If below min dose, automatically adjust to min dose
      onUpdateDosage({ value: minDose.value, unit: dosage.unit });
    } else if (maxDose && maxDose.unit === dosage.unit && dosage.value > maxDose.value) {
      // If above max dose, automatically adjust to max dose
      onUpdateDosage({ value: maxDose.value, unit: dosage.unit });
    }
  }, [medication, dosage.unit, onUpdateDosage]);
  
  // Calculate dual dosage and dispenser dosage for display when either medication or dosage changes
  useEffect(() => {
    if (!medication) {
      setDualDosage(null);
      setDispenserDosage(null);
      return;
    }

    // Calculate dual dosage for medications with strength ratios
    if (medication.ingredient?.[0]?.strengthRatio) {
      // For Vial or Solution forms that would have mg/mL conversions
      if (medication.doseForm === 'Vial' || medication.doseForm === 'Solution') {
        const dual = calculateDualDosage(medication, dosage);
        setDualDosage(dual);
      } 
      // For Creams with Topiclick dispenser, show clicks conversion
      else if (medication.doseForm === 'Cream') {
        const doseFormInfo = doseForms[medication.doseForm];
        const strengthRatio = medication.ingredient[0].strengthRatio;
        
        if (doseFormInfo.hasSpecialDispenser && doseFormInfo.dispenserConversion) {
          const conversionRatio = doseFormInfo.dispenserConversion.conversionRatio; // clicks per mL
          
          // Calculate conversions based on input unit
          if (dosage.unit === doseFormInfo.dispenserConversion.dispenserUnit) {
      // Input is in clicks, convert to mL
      const mlValue = dosage.value / conversionRatio;
      
      // Calculate mg value based on strength ratio (e.g., 100mg/mL)
      // For 2 clicks of a 100mg/mL cream:
      // - 2 clicks / 4 clicks per mL = 0.5 mL
      // - 0.5 mL * 100 mg/mL = 50 mg
      const mgValue = mlValue * strengthRatio.numerator.value;
      
      setDispenserDosage({
        value: Number(mlValue.toFixed(2)),
        unit: 'mL'
      });
      
      setDualDosage({
        weightBased: { value: Number(mgValue.toFixed(0)), unit: strengthRatio.numerator.unit },
        volumeBased: { value: Number(mlValue.toFixed(2)), unit: 'mL' }
      });
          } 
          else if (dosage.unit === 'mL') {
            // Input is in mL, convert to clicks
            const clickValue = dosage.value * conversionRatio;
            const mgValue = dosage.value * (strengthRatio.numerator.value / strengthRatio.denominator.value);
            
            setDispenserDosage({
              value: Math.round(clickValue), // Round to whole clicks
              unit: clickValue === 1 ? 
                doseFormInfo.dispenserConversion.dispenserUnit : 
                doseFormInfo.dispenserConversion.dispenserPluralUnit
            });
            
            setDualDosage({
              weightBased: { value: Number(mgValue.toFixed(0)), unit: strengthRatio.numerator.unit },
              volumeBased: { value: dosage.value, unit: 'mL' }
            });
          }
          else if (dosage.unit === strengthRatio.numerator.unit) {
            // Input is in mg (or other strength unit), convert to mL and clicks
            const mlValue = dosage.value / (strengthRatio.numerator.value / strengthRatio.denominator.value);
            const clickValue = mlValue * conversionRatio;
            
            setDispenserDosage({
              value: Math.round(clickValue), // Round to whole clicks
              unit: clickValue === 1 ? 
                doseFormInfo.dispenserConversion.dispenserUnit : 
                doseFormInfo.dispenserConversion.dispenserPluralUnit
            });
            
            setDualDosage({
              weightBased: { value: dosage.value, unit: strengthRatio.numerator.unit },
              volumeBased: { value: Number(mlValue.toFixed(2)), unit: 'mL' }
            });
          }
          else {
            // For other units or if there's no dispenser, calculate regular dual dosage
            const dual = calculateDualDosage(medication, dosage);
            setDualDosage(dual);
            setDispenserDosage(null);
          }
        } else {
          // Regular dual dosage for creams without dispenser
          const dual = calculateDualDosage(medication, dosage);
          setDualDosage(dual);
          setDispenserDosage(null);
        }
      } else {
        // Regular dual dosage for other medication forms
        const dual = calculateDualDosage(medication, dosage);
        setDualDosage(dual);
        setDispenserDosage(null);
      }
    } else {
      setDualDosage(null);
      setDispenserDosage(null);
    }
  }, [medication, dosage]);

  const handleDosageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const numValue = isNaN(value) ? 0 : value;
    
    // Apply step constraint if defined
    if (medication?.dosageConstraints?.step) {
      const step = medication.dosageConstraints.step;
      const rounded = Math.round(numValue / step) * step;
      onUpdateDosage({ ...dosage, value: rounded });
    } else {
      onUpdateDosage({ ...dosage, value: numValue });
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateDosage({ ...dosage, unit: e.target.value });
  };

  return (
    <div className="dose-input">
      <div className="dose-input-container">
        <div className="input-group">
        <input
          type="number"
          id="dosage-value"
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={dosage.value || ''}
          onChange={handleDosageChange}
          step={medication?.dosageConstraints?.step || "0.01"}
          min={medication?.dosageConstraints?.minDose?.unit === dosage.unit ? 
            medication.dosageConstraints.minDose.value : "0"}
          max={medication?.dosageConstraints?.maxDose?.unit === dosage.unit ? 
            medication.dosageConstraints.maxDose.value : undefined}
          placeholder="Amount"
          disabled={!medication}
          aria-label="Dose amount"
        />
        <select
          id="dosage-unit"
          className="form-select flex-grow-0 w-auto"
          value={dosage.unit}
          onChange={handleUnitChange}
          disabled={!medication || unitOptions.length <= 1}
          aria-label="Dose unit"
        >
          {unitOptions.map(unit => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        {error && <div className="invalid-feedback">{error}</div>}
        
        </div>
        
        {/* Show constraint info if available */}
        {medication?.dosageConstraints && dosage.unit && (
          <div className="constraint-info small mt-1">
            {medication.dosageConstraints.minDose?.unit === dosage.unit && (
              <span className="me-2 badge bg-light text-dark border">
                <i className="bi bi-arrow-down-short"></i> Min: {medication.dosageConstraints.minDose.value} {dosage.unit}
              </span>
            )}
            {medication.dosageConstraints.maxDose?.unit === dosage.unit && (
              <span className="badge bg-light text-dark border">
                <i className="bi bi-arrow-up-short"></i> Max: {medication.dosageConstraints.maxDose.value} {dosage.unit}
              </span>
            )}
            {medication.dosageConstraints.step && (
              <span className="ms-2 badge bg-light text-dark border">
                <i className="bi bi-arrows-collapse"></i> Step: {medication.dosageConstraints.step}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Component styles are now included in the main CSS file */}

      {/* Display conversion information */}
      <div className="mt-1 conversion-info">
        {/* Display dispenser conversion (clicks) for creams */}
        {dispenserDosage && (
          <span className="badge bg-light text-secondary d-inline-flex align-items-center me-1" style={{fontSize: "0.7rem"}}>
            <i className="bi bi-arrow-repeat me-1"></i>
            {dosage.unit !== dispenserDosage.unit ? 
              `${dispenserDosage.value} ${dispenserDosage.unit}` : 
              `${dualDosage?.volumeBased.value} ${dualDosage?.volumeBased.unit}`}
          </span>
        )}
        
        {/* Display dual dosage (mg/mL) if available */}
        {dualDosage && !dispenserDosage && (
          <span className="badge bg-light text-secondary d-inline-flex align-items-center" style={{fontSize: "0.7rem"}}>
            <i className="bi bi-arrow-repeat me-1"></i>
            {dosage.unit === 'mg' 
              ? `${dualDosage.volumeBased.value} ${dualDosage.volumeBased.unit}`
              : `${dualDosage.weightBased.value} ${dualDosage.weightBased.unit}`}
          </span>
        )}
        
        {/* Display strength equivalence for creams with Topiclick */}
        {dispenserDosage && dualDosage && (
          <span className="badge bg-light text-secondary d-inline-flex align-items-center" style={{fontSize: "0.7rem"}}>
            <i className="bi bi-arrow-right me-1"></i>
            {`${dualDosage.weightBased.value} ${dualDosage.weightBased.unit}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default DoseInput;
