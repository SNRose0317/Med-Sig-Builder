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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  AlertTriangle, 
  Info,
  Eye,
  EyeOff,
  Calculator,
  Plus,
  X,
  Package
} from 'lucide-react';
import { FormSection, FormField } from './ui/form-components';

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

  // Auto-select route from medication
  useEffect(() => {
    if (selectedMedication?.defaultRoute && route !== selectedMedication.defaultRoute) {
      onRouteChange(selectedMedication.defaultRoute);
    }
  }, [selectedMedication, route, onRouteChange]);

  // Initialize dose inputs when medication selected
  useEffect(() => {
    if (selectedMedication) {
      const multiIngredient = isMultiIngredient(selectedMedication);
      const strengthMode = getStrengthMode(selectedMedication.doseForm);
      const denominatorUnit = getDenominatorUnit(selectedMedication.doseForm);
      
      // Setup default units
      if (multiIngredient && strengthMode === 'ratio') {
        setPrimaryUnit(denominatorUnit);
        setShowDualInput(false);
      } else if (selectedMedication.ingredient?.[0]?.strengthRatio) {
        const { numerator } = selectedMedication.ingredient[0].strengthRatio;
        setPrimaryUnit(numerator.unit);
        
        // Show dual input for ratio mode
        if (strengthMode === 'ratio') {
          setSecondaryUnit(denominatorUnit);
          setShowDualInput(true);
        } else {
          setShowDualInput(false);
        }
      }
      
      // Set default dose if available
      // TODO: Add defaultDose to dosageConstraints if needed
    }
  }, [selectedMedication]);

  // Convert dual input values to dosage
  const handleDoseInputChange = (value: string, unit: string, isPrimary: boolean) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Update local state immediately for responsive UI
    if (isPrimary) {
      setPrimaryDoseValue(value);
      if (!showDualInput || unit !== primaryUnit) {
        setPrimaryUnit(unit);
      }
    } else {
      setSecondaryDoseValue(value);
    }

    // Debounce the actual dosage update
    const timer = setTimeout(() => {
      const parsedValue = parseFloat(value || '0');
      
      if (showDualInput && primaryDoseValue && secondaryDoseValue) {
        // Dual input mode
        const primaryParsed = isPrimary ? parsedValue : parseFloat(primaryDoseValue);
        const secondaryParsed = !isPrimary ? parsedValue : parseFloat(secondaryDoseValue);
        
        onDosageChange({
          value: primaryParsed,
          unit: primaryUnit
        });
      } else {
        // Single input mode
        onDosageChange({
          value: parsedValue,
          unit: unit || primaryUnit
        });
      }
    }, 300);

    setDebounceTimer(timer);
  };

  // Validate dose on change
  useEffect(() => {
    if (selectedMedication && dosage.value > 0) {
      const validationResult = validateDose(selectedMedication, dosage);
      if (!validationResult.valid) {
        onErrorsChange({ ...errors, dose: validationResult.message || '' });
      } else {
        const { dose, ...otherErrors } = errors;
        onErrorsChange(otherErrors);
      }
    }
  }, [dosage, selectedMedication]);

  // Handle medication selection
  const handleSelectMedication = (medication: Medication) => {
    onMedicationSelect(medication);
    setMedicationsDropdownOpen(false);
    
    // Show notification about defaults
    if (medication.defaultRoute) {
      setShowDefaultsNotification(true);
      setTimeout(() => setShowDefaultsNotification(false), 3000);
    }
  };

  // Update dosage when unit changes
  const handleUnitChange = (unit: string) => {
    handleDoseInputChange(primaryDoseValue, unit, true);
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

  const unitOptions = getUnitOptions();
  const routeInfo = route ? routes[route] : null;
  const suggestSpecialInstructions = routeInfo?.requiresSpecialInstructions || false;
  const constraints = getConstraintInfo();

  // Group frequencies by period
  const dailyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'd');
  const weeklyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'wk');
  const monthlyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'mo');

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-foreground">Medication Signature Builder</h3>
      
      {/* Medication Selector - only show if no medication is selected */}
      {!selectedMedication && (
        <FormField label="Medication">
          <div className="relative">
            <button 
              className="w-full flex items-center justify-between gap-2 p-3 text-left bg-accent border border-border rounded-lg text-secondary-foreground hover:border-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              type="button"
              onClick={() => setMedicationsDropdownOpen(!medicationsDropdownOpen)}
              aria-expanded={medicationsDropdownOpen}
            >
              <span>-- Select a Medication --</span>
              {medicationsDropdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {medicationsDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {isLoadingMedications ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                    <span>Loading medications...</span>
                  </div>
                ) : medicationsError ? (
                  <div className="p-4 text-red-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>Error loading medications</span>
                  </div>
                ) : medications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No medications found
                  </div>
                ) : (
                  medications.map((medication) => (
                    <button 
                      key={medication.id}
                      className="w-full p-3 text-left hover:bg-accent focus:bg-accent focus:outline-none border-b border-border last:border-b-0"
                      type="button"
                      onClick={() => handleSelectMedication(medication)}
                    >
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{medication.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {medication.ingredient[0]?.strengthRatio && formatStrength(medication)}
                          {medication.doseForm && ` (${medication.doseForm})`}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </FormField>
      )}
        
      {selectedMedication && (
        <>
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex flex-wrap gap-2">
              {selectedMedication.doseForm && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {selectedMedication.doseForm}
                </Badge>
              )}
              {selectedMedication.ingredient[0]?.strengthRatio && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {formatStrength(selectedMedication)}
                </Badge>
              )}
              {isMultiIngredient(selectedMedication) && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Layers className="h-3 w-3 mr-1" />
                  Multi-Ingredient
                </Badge>
              )}
              {selectedMedication.totalVolume && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {selectedMedication.totalVolume.value} {selectedMedication.totalVolume.unit}
                </Badge>
              )}
              {selectedMedication.extension?.[0]?.["us-controlled"] && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Controlled Substance
                </Badge>
              )}
            </div>
          </div>

          {/* Show defaults notification */}
          {showDefaultsNotification && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm flex items-center">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              Default values have been applied based on medication configuration
            </div>
          )}

          {/* Dose Input */}
          <FormField label="Dose">
            {showDualInput ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={primaryDoseValue}
                  onChange={(e) => handleDoseInputChange(e.target.value, primaryUnit, true)}
                  placeholder="0"
                  step={selectedMedication?.dosageConstraints?.step || "0.25"}
                  min="0"
                  className={`bg-input border-input text-foreground ${errors.dose ? 'border-destructive' : ''}`}
                />
                <span className="text-muted-foreground">{primaryUnit}, as</span>
                <Input
                  type="number"
                  value={secondaryDoseValue}
                  onChange={(e) => handleDoseInputChange(e.target.value, secondaryUnit, false)}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  className="bg-input border-input text-foreground"
                />
                <span className="text-muted-foreground">{secondaryUnit}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={primaryDoseValue}
                  onChange={(e) => handleDoseInputChange(e.target.value, primaryUnit, true)}
                  placeholder="Enter dose"
                  step={selectedMedication?.dosageConstraints?.step || "0.25"}
                  min="0"
                  className={`flex-1 bg-input border-input text-foreground ${errors.dose ? 'border-destructive' : ''}`}
                />
                {unitOptions.length > 1 ? (
                  <Select value={primaryUnit} onValueChange={handleUnitChange}>
                    <SelectTrigger className="w-32 bg-input border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {unitOptions.map(unit => (
                        <SelectItem key={unit} value={unit} className="text-foreground hover:bg-accent">
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center px-3 bg-muted border border-border rounded-md">
                    <span className="text-muted-foreground">{primaryUnit}</span>
                  </div>
                )}
              </div>
            )}
            {errors.dose && (
              <p className="mt-1 text-sm text-red-400">{errors.dose}</p>
            )}
            {constraints && (
              <div className="mt-1 text-xs text-muted-foreground">
                {constraints.map((c, i) => (
                  <span key={i}>
                    {c.type === 'min' ? 'Min' : 'Max'}: {c.value} {c.unit}
                    {i < constraints.length - 1 && ' • '}
                  </span>
                ))}
              </div>
            )}
          </FormField>

          {/* Route Display */}
          <FormField label="Route">
            <div className="flex items-center px-3 py-2 bg-muted border border-border rounded-md">
              <span className="text-muted-foreground">{route}</span>
            </div>
          </FormField>

          {/* Frequency Selector */}
          <FormField label="Frequency">
            <Select value={frequency} onValueChange={onFrequencyChange}>
              <SelectTrigger className="bg-input border-input text-foreground">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {dailyFrequencies.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground">Daily</div>
                    {dailyFrequencies.map(freq => (
                      <SelectItem key={freq.value} value={freq.value} className="text-foreground hover:bg-accent">
                        {freq.label}
                      </SelectItem>
                    ))}
                  </>
                )}
                {weeklyFrequencies.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">Weekly</div>
                    {weeklyFrequencies.map(freq => (
                      <SelectItem key={freq.value} value={freq.value} className="text-foreground hover:bg-accent">
                        {freq.label}
                      </SelectItem>
                    ))}
                  </>
                )}
                {monthlyFrequencies.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">Monthly</div>
                    {monthlyFrequencies.map(freq => (
                      <SelectItem key={freq.value} value={freq.value} className="text-foreground hover:bg-accent">
                        {freq.label}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </FormField>

          {/* Special Instructions */}
          <FormField label="Special Instructions">
            {suggestSpecialInstructions && (
              <span className="ml-2 text-xs text-yellow-400">(Recommended for {route})</span>
            )}
            <Input
              value={specialInstructions}
              onChange={(e) => onSpecialInstructionsChange(e.target.value)}
              placeholder="e.g., with food, apply to affected area"
              className="bg-input border-input text-foreground"
            />
          </FormField>

          {/* Days Supply */}
          {daysSupply && (
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-secondary-foreground">Days Supply</span>
                </div>
                <span className="text-lg font-bold text-foreground">{daysSupply} days</span>
              </div>
              {selectedMedication.packageInfo && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Package: {selectedMedication.packageInfo.quantity} {selectedMedication.packageInfo.unit}
                </div>
              )}
            </div>
          )}

          {/* Signature Output */}
          {signature && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-bold text-foreground">Generated Signature</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFHIRViewer(!showFHIRViewer)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showFHIRViewer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="ml-2">FHIR</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-foreground font-medium">{signature.humanReadable}</p>
                </div>
                {showFHIRViewer && (
                  <div className="mt-4">
                    <FHIRStructureViewer data={signature.fhirRepresentation} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SignatureBuilder;