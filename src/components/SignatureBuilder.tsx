import React, { useState, useEffect, useCallback } from 'react';
import { Medication } from '../types/index';
import { 
  DoseInput as DoseInputType, 
  generateSignature, 
  validateDose, 
  getDispensingUnit, 
  isMultiIngredient,
  getStrengthMode,
  getDenominatorUnit 
} from '../lib/signature';
import { calculateDaysSupply, getDoseConstraintMessage } from '../lib/calculations';
import { medicationsAPI } from '../api/medications';
import RouteSelector from './RouteSelector';
import FHIRStructureViewer from './FHIRStructureViewer';
import { 
  routes, 
  routeOptions, 
  frequencies, 
  frequencyOptions, 
  doseForms,
  getFrequency,
  getVerb 
} from '../constants/medication-data';

interface SignatureBuilderProps {
  selectedMedication: Medication | null;
  dosage: DoseInputType;
  route: string;
  frequency: string;
  specialInstructions: string;
  errors: Record<string, string>;
  signature?: { humanReadable: string; fhirRepresentation: any } | null;
  onMedicationSelect: (medication: Medication) => void;
  onDosageChange: (dosage: DoseInputType) => void;
  onRouteChange: (route: string) => void;
  onFrequencyChange: (frequency: string) => void;
  onSpecialInstructionsChange: (instructions: string) => void;
  onErrorsChange: (errors: Record<string, string>) => void;
}

const SignatureBuilder: React.FC<SignatureBuilderProps> = ({ 
  selectedMedication,
  dosage,
  route,
  frequency,
  specialInstructions,
  errors,
  signature,
  onMedicationSelect,
  onDosageChange,
  onRouteChange,
  onFrequencyChange,
  onSpecialInstructionsChange,
  onErrorsChange
}) => {
  // Local state for UI
  const [medicationsDropdownOpen, setMedicationsDropdownOpen] = useState(false);
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = useState(false);
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState(true);
  const [medicationsError, setMedicationsError] = useState<string | null>(null);
  const [showDefaultsNotification, setShowDefaultsNotification] = useState(false);
  const [showFHIRViewer, setShowFHIRViewer] = useState(false);
  
  // Dose input state
  const [primaryDoseValue, setPrimaryDoseValue] = useState<string>('');
  const [secondaryDoseValue, setSecondaryDoseValue] = useState<string>('');
  const [primaryUnit, setPrimaryUnit] = useState<string>('');
  const [secondaryUnit, setSecondaryUnit] = useState<string>('');
  const [showDualInput, setShowDualInput] = useState<boolean>(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch medications on mount
  useEffect(() => {
    let mounted = true;
    
    const fetchMedications = async () => {
      try {
        setIsLoadingMedications(true);
        setMedicationsError(null);
        const meds = await medicationsAPI.getAll();
        
        if (mounted) {
          setMedications(meds);
          setMedicationsError(null);
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load medications';
          setMedicationsError(errorMessage);
        }
      } finally {
        if (mounted) {
          setIsLoadingMedications(false);
        }
      }
    };
    
    fetchMedications();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Determine if medication supports dual input
  useEffect(() => {
    if (!selectedMedication) {
      setShowDualInput(false);
      return;
    }

    const strengthRatio = selectedMedication.ingredient?.[0]?.strengthRatio;
    const doseForm = selectedMedication.doseForm;
    const multiIngredient = isMultiIngredient(selectedMedication);
    const strengthMode = getStrengthMode(doseForm);
    const denominatorUnit = getDenominatorUnit(doseForm);
    
    // Multi-ingredient medications in ratio mode only show volume/weight input
    if (multiIngredient && strengthMode === 'ratio') {
      setShowDualInput(false);
      // Set default unit to denominator unit (mL for liquids, g for creams)
      onDosageChange({ ...dosage, unit: denominatorUnit });
      return;
    }
    
    // Single-ingredient medications can have dual input based on strength mode
    if (!multiIngredient && strengthRatio) {
      if (strengthMode === 'ratio') {
        // Ratio mode: show both active ingredient and volume/weight
        setShowDualInput(true);
        setPrimaryUnit(strengthRatio.numerator.unit);
        setSecondaryUnit(denominatorUnit);
        
        // Special case for Topiclick dispenser
        if (doseForm === 'Cream' && selectedMedication.dispenserInfo) {
          setSecondaryUnit(selectedMedication.dispenserInfo.unit);
        }
      } else {
        // Quantity mode: show both active ingredient and dose form count
        setShowDualInput(true);
        setPrimaryUnit(strengthRatio.numerator.unit);
        setSecondaryUnit(doseForm.toLowerCase());
      }
    } else {
      setShowDualInput(false);
    }
  }, [selectedMedication]);

  // Update dose values when dosage changes
  useEffect(() => {
    if (!selectedMedication || !showDualInput) return;

    const strengthRatio = selectedMedication.ingredient?.[0]?.strengthRatio;
    if (!strengthRatio) return;

    if (dosage.unit === primaryUnit) {
      setPrimaryDoseValue(dosage.value.toString());
      const converted = calculateConversion(dosage.value, primaryUnit, secondaryUnit);
      setSecondaryDoseValue(converted !== null ? converted.toString() : '');
    } else if (dosage.unit === secondaryUnit) {
      setSecondaryDoseValue(dosage.value.toString());
      const converted = calculateConversion(dosage.value, secondaryUnit, primaryUnit);
      setPrimaryDoseValue(converted !== null ? converted.toString() : '');
    }
  }, [dosage, selectedMedication, primaryUnit, secondaryUnit, showDualInput]);

  // Calculate conversion between units
  const calculateConversion = useCallback((value: number, fromUnit: string, toUnit: string): number | null => {
    if (!selectedMedication?.ingredient?.[0]?.strengthRatio) return null;

    const strengthRatio = selectedMedication.ingredient[0].strengthRatio;
    const strengthValue = strengthRatio.numerator.value / strengthRatio.denominator.value;

    if (fromUnit === strengthRatio.numerator.unit && toUnit === strengthRatio.denominator.unit) {
      return Number((value / strengthValue).toFixed(2));
    }
    else if (fromUnit === strengthRatio.denominator.unit && toUnit === strengthRatio.numerator.unit) {
      return Number((value * strengthValue).toFixed(0));
    }
    else if (fromUnit === strengthRatio.numerator.unit && toUnit === selectedMedication.doseForm.toLowerCase()) {
      return Number((value / strengthRatio.numerator.value).toFixed(2));
    }
    else if (fromUnit === selectedMedication.doseForm.toLowerCase() && toUnit === strengthRatio.numerator.unit) {
      return Number((value * strengthRatio.numerator.value).toFixed(0));
    }
    else if (selectedMedication.dispenserInfo) {
      const conversionRatio = selectedMedication.dispenserInfo.conversionRatio;
      
      if (fromUnit === selectedMedication.dispenserInfo.unit && toUnit === strengthRatio.numerator.unit) {
        const mlValue = value / conversionRatio;
        return Number((mlValue * strengthValue).toFixed(0));
      }
      else if (fromUnit === strengthRatio.numerator.unit && toUnit === selectedMedication.dispenserInfo.unit) {
        const mlValue = value / strengthValue;
        return Math.round(mlValue * conversionRatio);
      }
    }

    return null;
  }, [selectedMedication]);

  // Medication selection
  const handleSelectMedication = (medication: Medication) => {
    onMedicationSelect(medication);
    setMedicationsDropdownOpen(false);
    
    // Load defaults if available
    if (medication.defaultSignatureSettings) {
      // Load defaults
      if (medication.defaultSignatureSettings) {
        onDosageChange(medication.defaultSignatureSettings.dosage);
        onFrequencyChange(medication.defaultSignatureSettings.frequency);
        if (medication.defaultSignatureSettings.specialInstructions) {
          onSpecialInstructionsChange(medication.defaultSignatureSettings.specialInstructions);
        }
      }
      setShowDefaultsNotification(true);
      setTimeout(() => setShowDefaultsNotification(false), 3000);
    }
  };

  // Dose input handlers
  const handlePrimaryDoseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrimaryDoseValue(value);

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        onDosageChange({ value: numValue, unit: primaryUnit });
        
        const converted = calculateConversion(numValue, primaryUnit, secondaryUnit);
        if (converted !== null) {
          setSecondaryDoseValue(converted.toString());
        }
      }
    }, 300);

    setDebounceTimer(timer);
  };

  const handleSecondaryDoseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSecondaryDoseValue(value);

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        const converted = calculateConversion(numValue, secondaryUnit, primaryUnit);
        if (converted !== null) {
          setPrimaryDoseValue(converted.toString());
          onDosageChange({ value: converted, unit: primaryUnit });
        }
      }
    }, 300);

    setDebounceTimer(timer);
  };

  const handleSingleDoseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const numValue = isNaN(value) ? 0 : value;
    onDosageChange({ ...dosage, value: numValue });
  };

  const handleDoseUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDosageChange({ ...dosage, unit: e.target.value });
  };

  // Route selection
  const handleSelectRoute = (route: string) => {
    onRouteChange(route);
    setRouteDropdownOpen(false);
  };

  // Frequency selection
  const handleSelectFrequency = (frequency: string) => {
    onFrequencyChange(frequency);
    setFrequencyDropdownOpen(false);
  };

  // Special instructions
  const handleSpecialInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSpecialInstructionsChange(e.target.value);
  };

  // Get available routes for selected medication
  const getAvailableRoutes = () => {
    if (!selectedMedication) return [];
    
    const doseForm = doseForms[selectedMedication.doseForm];
    if (!doseForm) return routeOptions;

    return routeOptions.filter(route => 
      routes[route.value].applicableForms.includes(selectedMedication!.doseForm)
    );
  };

  // Get unit options for single dose input
  const getUnitOptions = (): string[] => {
    if (!selectedMedication) return ['mg'];
    
    let options: string[] = [];
    const doseForm = selectedMedication.doseForm;
    const strengthRatio = selectedMedication.ingredient?.[0]?.strengthRatio;
    const multiIngredient = isMultiIngredient(selectedMedication);
    const strengthMode = getStrengthMode(doseForm);
    const denominatorUnit = getDenominatorUnit(doseForm);

    // Multi-ingredient medications in ratio mode only show volume/weight unit
    if (multiIngredient && strengthMode === 'ratio') {
      return [denominatorUnit];
    }

    // Build options based on strength mode
    if (strengthMode === 'ratio') {
      // Ratio mode: offer both active ingredient and volume/weight units
      if (strengthRatio) {
        options = [strengthRatio.numerator.unit, denominatorUnit];
        
        // Add dispenser unit for creams with special dispensers
        if (doseForm === 'Cream' && selectedMedication.dispenserInfo) {
          options.push(selectedMedication.dispenserInfo.unit);
        }
      } else {
        options = [denominatorUnit];
      }
    } else {
      // Quantity mode: offer both active ingredient and dose form units
      if (strengthRatio) {
        options = [strengthRatio.numerator.unit, doseForm.toLowerCase()];
      } else {
        options = [doseForm.toLowerCase()];
      }
    }
    
    // Special cases
    if (doseForm === 'Nasal Spray') {
      options = strengthRatio ? ['spray', strengthRatio.numerator.unit] : ['spray'];
    } else if (['Foam', 'Shampoo'].includes(doseForm)) {
      options = ['application'];
      if (strengthRatio) {
        options.push(strengthRatio.numerator.unit);
      }
    }

    return [...new Set(options)].filter(Boolean);
  };

  // Format medication strength
  const formatStrength = (medication: Medication): string => {
    if (!medication.ingredient || medication.ingredient.length === 0) return '';
    
    // For multi-ingredient, show all ingredients
    if (isMultiIngredient(medication)) {
      return medication.ingredient
        .filter(ing => ing.strengthRatio)
        .map(ing => {
          const { numerator, denominator } = ing.strengthRatio;
          return `${ing.name}: ${numerator.value}${numerator.unit}/${denominator.value}${denominator.unit}`;
        })
        .join(' + ');
    }
    
    // For single ingredient, show simple strength
    const { numerator, denominator } = medication.ingredient[0].strengthRatio;
    return `${numerator.value}${numerator.unit}/${denominator.value}${denominator.unit}`;
  };

  // Calculate days supply
  const daysSupply = selectedMedication && 
                    selectedMedication.packageInfo &&
                    dosage.value > 0 && 
                    frequency
    ? calculateDaysSupply(selectedMedication, {
        value: dosage.value,
        unit: dosage.unit,
        frequencyKey: frequency
      })
    : null;

  // Get constraint info
  const getConstraintInfo = () => {
    if (!selectedMedication?.dosageConstraints) return null;
    
    const { minDose, maxDose } = selectedMedication.dosageConstraints;
    const constraints = [];
    
    if (minDose && minDose.unit === primaryUnit) {
      constraints.push({ type: 'min', value: minDose.value, unit: minDose.unit });
    }
    if (maxDose && maxDose.unit === primaryUnit) {
      constraints.push({ type: 'max', value: maxDose.value, unit: maxDose.unit });
    }
    
    return constraints.length > 0 ? constraints : null;
  };

  const availableRoutes = getAvailableRoutes();
  const unitOptions = getUnitOptions();
  const routeInfo = route ? routes[route] : null;
  const suggestSpecialInstructions = routeInfo?.requiresSpecialInstructions || false;
  const constraints = getConstraintInfo();

  // Group frequencies by period
  const dailyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'd');
  const weeklyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'wk');
  const monthlyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'mo');

  return (
    <div className="signature-builder">
      <h3>Medication Signature Builder</h3>
      
      {/* Medication Selector - only show if no medication is selected */}
      {!selectedMedication && (
        <div className="form-group mb-3">
          <label className="form-label">Medication</label>
          <div className="dropdown">
            <button 
              className="form-select d-flex justify-content-between align-items-center"
              type="button"
              onClick={() => setMedicationsDropdownOpen(!medicationsDropdownOpen)}
              aria-expanded={medicationsDropdownOpen}
              style={{textAlign: 'left'}}
            >
              -- Select a Medication --
              <i className={`bi bi-chevron-${medicationsDropdownOpen ? 'up' : 'down'} ms-2`}></i>
            </button>
            
            <ul 
              className={`dropdown-menu w-100 ${medicationsDropdownOpen ? 'show' : ''}`} 
              style={{maxHeight: '300px', overflowY: 'auto'}}
            >
            {isLoadingMedications ? (
              <li className="dropdown-item text-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span>Loading medications...</span>
              </li>
            ) : medicationsError ? (
              <li className="dropdown-item text-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <span>Error loading medications</span>
              </li>
            ) : medications.length === 0 ? (
              <li className="dropdown-item text-center text-muted">
                No medications found
              </li>
            ) : (
              medications.map((medication) => (
                <li key={medication.id}>
                  <button 
                    className="dropdown-item" 
                    type="button"
                    onClick={() => handleSelectMedication(medication)}
                  >
                    <div className="d-flex flex-column">
                      <span>{medication.name}</span>
                      <small className="text-muted">
                        {medication.ingredient[0]?.strengthRatio && formatStrength(medication)}
                        {medication.doseForm && ` (${medication.doseForm})`}
                      </small>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        </div>
      )}
        
      {selectedMedication && (
          <div className="medication-info mb-3">
            <div className="d-flex flex-wrap gap-2 mt-1">
              {selectedMedication.doseForm && (
                <span className="badge bg-light text-dark border me-1">
                  {selectedMedication.doseForm}
                </span>
              )}
              {selectedMedication.ingredient[0]?.strengthRatio && (
                <span className="badge bg-light text-dark border me-1">
                  {formatStrength(selectedMedication)}
                </span>
              )}
              {isMultiIngredient(selectedMedication) && (
                <span className="badge bg-primary text-white" title="Multi-ingredient formulation - dosed by volume">
                  <i className="bi bi-layers"></i> Multi-Ingredient
                </span>
              )}
              {selectedMedication.totalVolume && (
                <span className="badge bg-light text-dark border me-1">
                  {selectedMedication.totalVolume.value} {selectedMedication.totalVolume.unit}
                </span>
              )}
              {selectedMedication.extension?.[0]?.["us-controlled"] && (
                <span className="badge bg-warning text-dark">
                  Schedule {selectedMedication.extension[0].schedule}
                </span>
              )}
              {selectedMedication.eligibleGenders && selectedMedication.eligibleGenders.length > 0 && (
                <>
                  {selectedMedication.eligibleGenders.map(gender => (
                    <span 
                      key={gender}
                      className={`badge gender-${gender.toLowerCase()}`}
                      title={`${gender} only medication`}
                    >
                      {gender === 'MALE' ? '♂' : gender === 'FEMALE' ? '♀' : '⚥'} {gender}
                    </span>
                  ))}
                </>
              )}
              {selectedMedication.defaultSignatureSettings && (
                <span className="badge bg-info text-dark" title="Has default signature settings">
                  <i className="bi bi-star-fill"></i> Defaults
                </span>
              )}
            </div>
          </div>
      )}

      {showDefaultsNotification && (
        <div className="alert alert-info alert-dismissible fade show mt-2" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          Default signature settings have been loaded
        </div>
      )}

      {selectedMedication && (
        <>
          {/* Dose Input */}
          <div className="form-group mb-3">
            <label className="form-label">Dose</label>
            {showDualInput ? (
              <div className="dual-dose-container">
                <div className="dose-field">
                  <input
                    type="number"
                    className="form-control"
                    value={primaryDoseValue}
                    onChange={handlePrimaryDoseChange}
                    step="any"
                    placeholder="0"
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
                    value={secondaryDoseValue}
                    onChange={handleSecondaryDoseChange}
                    step="any"
                    placeholder="0"
                    aria-label={`Dose in ${secondaryUnit}`}
                  />
                  <span className="unit-label">{secondaryUnit}</span>
                </div>
              </div>
            ) : (
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  value={dosage.value || ''}
                  onChange={handleSingleDoseChange}
                  step="0.01"
                  placeholder="Amount"
                  aria-label="Dose amount"
                />
                <select
                  className="form-select flex-grow-0 w-auto"
                  value={dosage.unit}
                  onChange={handleDoseUnitChange}
                  disabled={unitOptions.length <= 1}
                  aria-label="Dose unit"
                >
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            )}
            
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

          {/* Route Selector */}
          <div className="form-group mb-3">
            <label className="form-label">Route</label>
            <RouteSelector
              medication={selectedMedication}
              selectedRoute={route}
              onSelectRoute={onRouteChange}
              error={errors.route}
            />
          </div>

          {/* Frequency Selector */}
          <div className="form-group mb-3">
            <label className="form-label">Frequency</label>
            <div className="dropdown">
              <button 
                className="form-select d-flex justify-content-between align-items-center"
                type="button"
                onClick={() => setFrequencyDropdownOpen(!frequencyDropdownOpen)}
                aria-expanded={frequencyDropdownOpen}
                style={{textAlign: 'left'}}
              >
                {frequency || '-- Select Frequency --'}
                <i className={`bi bi-chevron-${frequencyDropdownOpen ? 'up' : 'down'} ms-2`}></i>
              </button>
              
              <ul 
                className={`dropdown-menu w-100 ${frequencyDropdownOpen ? 'show' : ''}`} 
                style={{maxHeight: '300px', overflowY: 'auto'}}
              >
                <li><h6 className="dropdown-header">Daily</h6></li>
                {dailyFrequencies.map(frequency => (
                  <li key={frequency.value}>
                    <button 
                      className="dropdown-item" 
                      type="button"
                      onClick={() => handleSelectFrequency(frequency.value)}
                    >
                      {frequency.label}
                    </button>
                  </li>
                ))}
                
                <li><hr className="dropdown-divider" /></li>
                <li><h6 className="dropdown-header">Weekly</h6></li>
                {weeklyFrequencies.map(frequency => (
                  <li key={frequency.value}>
                    <button 
                      className="dropdown-item" 
                      type="button"
                      onClick={() => handleSelectFrequency(frequency.value)}
                    >
                      {frequency.label}
                    </button>
                  </li>
                ))}
                
                <li><hr className="dropdown-divider" /></li>
                <li><h6 className="dropdown-header">Monthly</h6></li>
                {monthlyFrequencies.map(frequency => (
                  <li key={frequency.value}>
                    <button 
                      className="dropdown-item" 
                      type="button"
                      onClick={() => handleSelectFrequency(frequency.value)}
                    >
                      {frequency.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {frequency && frequencies[frequency] && (
              <div className="mt-2 d-flex align-items-center">
                {frequencies[frequency].abbreviation && (
                  <span className="badge bg-light text-dark border me-2">
                    {frequencies[frequency].abbreviation}
                  </span>
                )}
                <small className="text-muted" style={{fontSize: "0.7rem"}}>
                  {frequencies[frequency].humanReadable}
                </small>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          {route && (
            <div className="form-group mb-3">
              <label className="form-label">Special Instructions</label>
              {suggestSpecialInstructions && (
                <div className="d-flex mb-2">
                  <span className="badge bg-info text-white d-inline-flex align-items-center" style={{fontSize: "0.7rem"}}>
                    <i className="bi bi-info-circle me-1"></i>
                    Recommended for {routeInfo?.humanReadable}
                  </span>
                </div>
              )}
              
              <textarea
                className="form-control"
                value={specialInstructions}
                onChange={handleSpecialInstructionsChange}
                placeholder={suggestSpecialInstructions 
                  ? `${routeInfo?.humanReadable} site or location (optional)` 
                  : "Additional instructions (optional)"}
                rows={2}
              />
              
              <div className="form-text small mt-1">
                {suggestSpecialInstructions 
                  ? `Consider specifying the ${routeInfo?.humanReadable.toLowerCase()} site`
                  : 'E.g., "with food", "on empty stomach", "in left arm"'}
              </div>
            </div>
          )}

          {/* Days Supply Calculator */}
          {daysSupply !== null && (
            <div className="days-supply-calculator mb-3">
              <h5>Days Supply</h5>
              <p className="mb-0">
                <strong>{daysSupply} days</strong> based on package size and dosing frequency
              </p>
              <small className="text-muted">
                Package: {selectedMedication.packageInfo?.quantity} {selectedMedication.packageInfo?.unit} | 
                Dose: {dosage.value} {dosage.unit} | 
                Frequency: {frequencies[frequency]?.humanReadable}
              </small>
            </div>
          )}

          {/* FHIR Structure Viewer Toggle */}
          <div className="mb-3">
            <button 
              type="button"
              className="btn btn-link btn-sm p-0"
              onClick={() => setShowFHIRViewer(!showFHIRViewer)}
            >
              <i className={`bi bi-chevron-${showFHIRViewer ? 'up' : 'down'} me-1`}></i>
              {showFHIRViewer ? 'Hide' : 'Show'} FHIR Structure
            </button>
          </div>

          {/* FHIR Structure Viewer */}
          {showFHIRViewer && signature && (
            <FHIRStructureViewer fhirData={signature.fhirRepresentation} />
          )}
        </>
      )}

      <style>{`
        .signature-builder {
          padding: 1rem;
        }

        .dual-dose-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dose-field {
          flex: 1;
          position: relative;
        }

        .unit-label {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          pointer-events: none;
        }

        .conversion-arrow {
          color: #6c757d;
          font-size: 1.2rem;
        }

        .days-supply-calculator {
          padding: 1rem;
          border: 1px solid #007bff;
          border-radius: 4px;
          background-color: #f0f8ff;
        }

        .days-supply-calculator h5 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .dropdown-menu {
          position: absolute;
          z-index: 1000;
        }

        .dropdown-menu.show {
          display: block;
        }

        .constraint-info {
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default SignatureBuilder;