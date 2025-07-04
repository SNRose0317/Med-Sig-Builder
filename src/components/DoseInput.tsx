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
  // State for dual input values
  const [primaryValue, setPrimaryValue] = useState<string>('');
  const [secondaryValue, setSecondaryValue] = useState<string>('');
  const [primaryUnit, setPrimaryUnit] = useState<string>('');
  const [secondaryUnit, setSecondaryUnit] = useState<string>('');
  const [showDualInput, setShowDualInput] = useState<boolean>(false);
  
  // Debounce timer ref
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Determine if medication supports dual input
  useEffect(() => {
    if (!medication) {
      setShowDualInput(false);
      return;
    }

    const strengthRatio = medication.ingredient?.[0]?.strengthRatio;
    const doseForm = medication.doseForm;
    
    // Enable dual input for medications with strength ratios
    if (strengthRatio && (doseForm === 'Vial' || doseForm === 'Solution')) {
      setShowDualInput(true);
      setPrimaryUnit(strengthRatio.numerator.unit);
      setSecondaryUnit(strengthRatio.denominator.unit);
    } else if (strengthRatio && ['Tablet', 'Capsule', 'ODT'].includes(doseForm)) {
      setShowDualInput(true);
      setPrimaryUnit(strengthRatio.numerator.unit);
      setSecondaryUnit(doseForm.toLowerCase());
    } else if (strengthRatio && doseForm === 'Cream' && medication.dispenserInfo) {
      setShowDualInput(true);
      setPrimaryUnit(strengthRatio.numerator.unit);
      setSecondaryUnit(medication.dispenserInfo.unit);
    } else {
      setShowDualInput(false);
    }
  }, [medication]);

  // Calculate conversion between units
  const calculateConversion = useCallback((value: number, fromUnit: string, toUnit: string): number | null => {
    if (!medication?.ingredient?.[0]?.strengthRatio) return null;

    const strengthRatio = medication.ingredient[0].strengthRatio;
    const strengthValue = strengthRatio.numerator.value / strengthRatio.denominator.value;

    // mg to mL conversion
    if (fromUnit === strengthRatio.numerator.unit && toUnit === strengthRatio.denominator.unit) {
      return Number((value / strengthValue).toFixed(2));
    }
    // mL to mg conversion
    else if (fromUnit === strengthRatio.denominator.unit && toUnit === strengthRatio.numerator.unit) {
      return Number((value * strengthValue).toFixed(0));
    }
    // mg to tablets conversion
    else if (fromUnit === strengthRatio.numerator.unit && toUnit === medication.doseForm.toLowerCase()) {
      return Number((value / strengthRatio.numerator.value).toFixed(2));
    }
    // tablets to mg conversion
    else if (fromUnit === medication.doseForm.toLowerCase() && toUnit === strengthRatio.numerator.unit) {
      return Number((value * strengthRatio.numerator.value).toFixed(0));
    }
    // Special dispenser conversions (e.g., clicks)
    else if (medication.dispenserInfo) {
      const conversionRatio = medication.dispenserInfo.conversionRatio;
      
      // clicks to mg
      if (fromUnit === medication.dispenserInfo.unit && toUnit === strengthRatio.numerator.unit) {
        const mlValue = value / conversionRatio;
        return Number((mlValue * strengthValue).toFixed(0));
      }
      // mg to clicks
      else if (fromUnit === strengthRatio.numerator.unit && toUnit === medication.dispenserInfo.unit) {
        const mlValue = value / strengthValue;
        return Math.round(mlValue * conversionRatio);
      }
    }

    return null;
  }, [medication]);

  // Update values based on current dosage prop
  useEffect(() => {
    if (!medication || !showDualInput) return;

    const strengthRatio = medication.ingredient?.[0]?.strengthRatio;
    if (!strengthRatio) return;

    // Set primary value based on current dosage
    if (dosage.unit === primaryUnit) {
      setPrimaryValue(dosage.value.toString());
      const converted = calculateConversion(dosage.value, primaryUnit, secondaryUnit);
      setSecondaryValue(converted !== null ? converted.toString() : '');
    } else if (dosage.unit === secondaryUnit) {
      setSecondaryValue(dosage.value.toString());
      const converted = calculateConversion(dosage.value, secondaryUnit, primaryUnit);
      setPrimaryValue(converted !== null ? converted.toString() : '');
    }
  }, [dosage, medication, primaryUnit, secondaryUnit, calculateConversion, showDualInput]);

  // Handle primary input change
  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrimaryValue(value);

    // Clear existing timer
    if (debounceTimer) clearTimeout(debounceTimer);

    // Set new timer
    const timer = setTimeout(() => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        // Update the main dosage
        onUpdateDosage({ value: numValue, unit: primaryUnit });
        
        // Calculate and update secondary value
        const converted = calculateConversion(numValue, primaryUnit, secondaryUnit);
        if (converted !== null) {
          setSecondaryValue(converted.toString());
        }
      }
    }, 300);

    setDebounceTimer(timer);
  };

  // Handle secondary input change
  const handleSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSecondaryValue(value);

    // Clear existing timer
    if (debounceTimer) clearTimeout(debounceTimer);

    // Set new timer
    const timer = setTimeout(() => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        // Calculate primary value
        const converted = calculateConversion(numValue, secondaryUnit, primaryUnit);
        if (converted !== null) {
          setPrimaryValue(converted.toString());
          // Update the main dosage with the primary unit value
          onUpdateDosage({ value: converted, unit: primaryUnit });
        }
      }
    }, 300);

    setDebounceTimer(timer);
  };

  // Handle single input mode
  const handleSingleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const numValue = isNaN(value) ? 0 : value;
    onUpdateDosage({ ...dosage, value: numValue });
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateDosage({ ...dosage, unit: e.target.value });
  };

  // Get constraint info
  const getConstraintInfo = () => {
    if (!medication?.dosageConstraints) return null;
    
    const { minDose, maxDose } = medication.dosageConstraints;
    const constraints = [];
    
    if (minDose && minDose.unit === primaryUnit) {
      constraints.push({ type: 'min', value: minDose.value, unit: minDose.unit });
    }
    if (maxDose && maxDose.unit === primaryUnit) {
      constraints.push({ type: 'max', value: maxDose.value, unit: maxDose.unit });
    }
    
    return constraints.length > 0 ? constraints : null;
  };

  // Render dual input mode
  if (showDualInput && medication) {
    const constraints = getConstraintInfo();
    
    return (
      <div className="dose-input">
        <div className="dual-dose-container">
          <div className="dose-field">
            <input
              type="number"
              className={`form-control ${error ? 'is-invalid' : ''}`}
              value={primaryValue}
              onChange={handlePrimaryChange}
              step="any"
              placeholder="0"
              disabled={!medication}
              aria-label={`Dose in ${primaryUnit}`}
            />
            <span className="unit-label">{primaryUnit}</span>
          </div>
          
          <div className="conversion-arrow">
            <i className="bi bi-arrow-left-right"></i>
          </div>
          
          <div className="dose-field">
            <input
              type="number"
              className="form-control"
              value={secondaryValue}
              onChange={handleSecondaryChange}
              step="any"
              placeholder="0"
              disabled={!medication}
              aria-label={`Dose in ${secondaryUnit}`}
            />
            <span className="unit-label">{secondaryUnit}</span>
          </div>
        </div>
        
        {error && <div className="invalid-feedback d-block">{error}</div>}
        
        {/* Constraint info */}
        {constraints && (
          <div className="constraint-info small mt-1">
            {constraints.map((constraint, idx) => (
              <span key={idx} className="me-2 badge bg-light text-dark border">
                <i className={`bi bi-arrow-${constraint.type === 'min' ? 'down' : 'up'}-short`}></i>
                {' '}{constraint.type === 'min' ? 'Min' : 'Max'}: {constraint.value} {constraint.unit}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render single input mode (fallback)
  const unitOptions = medication ? getUnitOptions(medication) : ['mg'];
  
  return (
    <div className="dose-input">
      <div className="dose-input-container">
        <div className="input-group">
          <input
            type="number"
            className={`form-control ${error ? 'is-invalid' : ''}`}
            value={dosage.value || ''}
            onChange={handleSingleInputChange}
            step="0.01"
            placeholder="Amount"
            disabled={!medication}
            aria-label="Dose amount"
          />
          <select
            className="form-select flex-grow-0 w-auto"
            value={dosage.unit}
            onChange={handleUnitChange}
            disabled={!medication || unitOptions.length <= 1}
            aria-label="Dose unit"
          >
            {unitOptions.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
    </div>
  );
};

// Helper function to get unit options for single input mode
function getUnitOptions(medication: Medication): string[] {
  let options: string[] = [];
  const doseForm = medication.doseForm;
  const strengthRatio = medication.ingredient?.[0]?.strengthRatio;

  if (doseForm === 'Vial' || doseForm === 'Solution') {
    options = ['mg', 'mL'];
  } else if (['Tablet', 'Capsule', 'Patch', 'ODT'].includes(doseForm)) {
    if (strengthRatio) {
      options = [doseForm.toLowerCase(), strengthRatio.numerator.unit];
    } else {
      options = [doseForm.toLowerCase()];
    }
  } else if (doseForm === 'Nasal Spray') {
    if (strengthRatio) {
      options = ['spray', strengthRatio.numerator.unit];
    } else {
      options = ['spray'];
    }
  } else if (['Cream', 'Gel', 'Foam', 'Shampoo'].includes(doseForm)) {
    if (strengthRatio) {
      options = ['application', strengthRatio.numerator.unit];
      if (medication.dispenserInfo) {
        options.push(medication.dispenserInfo.unit);
      }
    } else {
      options = ['application'];
    }
  } else {
    if (strengthRatio) {
      options = [strengthRatio.denominator.unit, strengthRatio.numerator.unit];
    } else {
      options = ['mg'];
    }
  }

  return [...new Set(options)].filter(Boolean);
}

export default DoseInput;