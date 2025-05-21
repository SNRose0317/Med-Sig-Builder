import React, { useEffect, useState } from 'react';
import { Medication } from '../types';
import { DoseInput as DoseInputType, calculateDualDosage } from '../utils/buildDosage';

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

  // Calculate dual dosage for display when either medication or dosage changes
  useEffect(() => {
    if (!medication) {
      setDualDosage(null);
      return;
    }

    // Only calculate dual dosage for medications with strength ratios
    // and only for Vial or Solution forms that would have mg/mL conversions
    if (
      medication.ingredient?.[0]?.strengthRatio &&
      (medication.doseForm === 'Vial' || medication.doseForm === 'Solution')
    ) {
      const dual = calculateDualDosage(medication, dosage);
      setDualDosage(dual);
    } else {
      setDualDosage(null);
    }
  }, [medication, dosage]);

  const handleDosageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onUpdateDosage({ ...dosage, value: isNaN(value) ? 0 : value });
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateDosage({ ...dosage, unit: e.target.value });
  };

  return (
    <div className="dose-input">
      <div className="input-group">
        <input
          type="number"
          id="dosage-value"
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={dosage.value || ''}
          onChange={handleDosageChange}
          step="0.01"
          min="0"
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

      {/* Display dual dosage if available */}
      {dualDosage && (
        <div className="mt-2">
          <span className="badge bg-light text-secondary d-inline-flex align-items-center" style={{fontSize: "0.7rem"}}>
            <i className="bi bi-arrow-repeat me-1"></i>
            {dosage.unit === 'mg' 
              ? `${dualDosage.volumeBased.value} ${dualDosage.volumeBased.unit}`
              : `${dualDosage.weightBased.value} ${dualDosage.weightBased.unit}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default DoseInput;
