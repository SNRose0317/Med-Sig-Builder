import React, { useState, useEffect, useCallback } from 'react';
import { Medication } from '../types';
import { generateSignature, DoseInput as DoseInputType } from '../utils/buildDosage';
import DoseInput from './DoseInput';
import FrequencySelector from './FrequencySelector';
import SpecialInstructions from './SpecialInstructions';
import DaysSupplyCalculator from './DaysSupplyCalculator';
import FHIRStructureViewer from './FHIRStructureViewer';
import routes from '../tables/routes';
import { getFrequency } from '../tables/frequencyTable';

interface EmbeddedSignatureBuilderProps {
  medication: Medication;
  defaultSettings?: {
    dosage: DoseInputType;
    frequency: string;
    specialInstructions?: string;
  };
  onSaveDefaults?: (settings: {
    dosage: DoseInputType;
    frequency: string;
    specialInstructions?: string;
  }) => void;
}

const EmbeddedSignatureBuilder: React.FC<EmbeddedSignatureBuilderProps> = ({
  medication,
  defaultSettings,
  onSaveDefaults
}) => {
  // Initialize state with defaults or reasonable starting values
  const [dosage, setDosage] = useState<DoseInputType>(
    defaultSettings?.dosage || { value: 0, unit: 'mg' }
  );
  const [selectedFrequency, setSelectedFrequency] = useState<string>(
    defaultSettings?.frequency || ''
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    defaultSettings?.specialInstructions || ''
  );
  
  // Get the route from medication configuration
  const selectedRoute = medication.defaultRoute || 
    (medication.allowedRoutes && medication.allowedRoutes.length > 0 ? medication.allowedRoutes[0] : '');
  const [signature, setSignature] = useState<{ humanReadable: string; fhirRepresentation: any } | null>(null);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'warning' | 'invalid'>('invalid');
  const [isExpanded, setIsExpanded] = useState(false);

  // Validate the current configuration
  const validateConfiguration = useCallback(() => {
    console.log('EmbeddedSignatureBuilder: Validating configuration', {
      dosage,
      selectedRoute,
      selectedFrequency
    });
    
    // Check if all required fields are filled
    if (!dosage.value || !selectedRoute || !selectedFrequency) {
      setValidationStatus('invalid');
      return;
    }

    // Check dosage constraints
    if (medication.dosageConstraints) {
      const { minDose, maxDose } = medication.dosageConstraints;
      
      // Convert dosage to the same unit as constraints for comparison
      let isWithinRange = true;
      let hasWarning = false;
      
      if (minDose && dosage.unit === minDose.unit && dosage.value < minDose.value) {
        isWithinRange = false;
      }
      
      if (maxDose && dosage.unit === maxDose.unit && dosage.value > maxDose.value) {
        isWithinRange = false;
      }
      
      // Check if dose is unusually high or low (even if within constraints)
      if (medication.commonDosages && medication.commonDosages.length > 0) {
        const commonValues = medication.commonDosages
          .filter(d => d.unit === dosage.unit)
          .map(d => d.value);
        
        if (commonValues.length > 0) {
          const avgDose = commonValues.reduce((a, b) => a + b, 0) / commonValues.length;
          if (dosage.value < avgDose * 0.5 || dosage.value > avgDose * 2) {
            hasWarning = true;
          }
        }
      }
      
      if (!isWithinRange) {
        setValidationStatus('invalid');
      } else if (hasWarning) {
        setValidationStatus('warning');
      } else {
        setValidationStatus('valid');
      }
    } else {
      setValidationStatus('valid');
    }
  }, [medication, dosage, selectedRoute, selectedFrequency]);

  // Update signature whenever inputs change
  useEffect(() => {
    if (medication && dosage.value > 0 && selectedRoute && selectedFrequency) {
      try {
        const result = generateSignature(
          medication,
          dosage,
          selectedRoute,
          selectedFrequency,
          specialInstructions
        );
        setSignature(result);
      } catch (error) {
        console.error('Error generating signature:', error);
        setSignature(null);
      }
    } else {
      setSignature(null);
    }
  }, [medication, dosage, selectedRoute, selectedFrequency, specialInstructions]);

  // Validate configuration in a separate effect
  useEffect(() => {
    validateConfiguration();
  }, [validateConfiguration]);

  // Handle saving defaults
  const handleSaveDefaults = () => {
    if (onSaveDefaults && validationStatus !== 'invalid') {
      onSaveDefaults({
        dosage,
        frequency: selectedFrequency.toLowerCase(), // Save in lowercase for consistency
        specialInstructions
      });
    }
  };

  // Get validation color
  const getValidationColor = () => {
    switch (validationStatus) {
      case 'valid': return '#28a745';
      case 'warning': return '#ffc107';
      case 'invalid': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Get validation message
  const getValidationMessage = () => {
    if (!dosage.value || !selectedRoute || !selectedFrequency) {
      return 'Please fill in all required fields';
    }
    
    switch (validationStatus) {
      case 'valid': return 'Configuration is valid';
      case 'warning': return 'Configuration is valid but dose may be unusual';
      case 'invalid': return 'Configuration has errors';
      default: return '';
    }
  };

  return (
    <div className="embedded-signature-builder">
      <div className="builder-header">
        <h5>
          <i className="bi bi-clipboard-check me-2"></i>
          Test Signature Output
        </h5>
        <button
          type="button"
          className="btn btn-sm btn-link"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="builder-inputs">
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">Dosage</label>
                <DoseInput
                  medication={medication}
                  dosage={dosage}
                  onUpdateDosage={setDosage}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Route</label>
                <div className="form-control-plaintext">
                  <span className="text-muted">
                    {selectedRoute || 'No route configured'}
                    {selectedRoute && routes[selectedRoute]?.requiresSpecialInstructions && (
                      <span className="badge bg-info text-white ms-2" style={{fontSize: "0.7rem"}}>
                        <i className="bi bi-info-circle me-1"></i>
                        Special instructions recommended
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label small">Frequency</label>
                <FrequencySelector
                  selectedFrequency={selectedFrequency}
                  onSelectFrequency={setSelectedFrequency}
                  disabled={false}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Special Instructions</label>
                <SpecialInstructions
                  medication={medication}
                  selectedRoute={selectedRoute}
                  specialInstructions={specialInstructions}
                  onUpdateInstructions={setSpecialInstructions}
                />
              </div>
            </div>
          </div>

          <div className="signature-preview" style={{ borderColor: getValidationColor() }}>
            <div className="preview-header">
              <span className="preview-label">Preview:</span>
              <span className="validation-status" style={{ color: getValidationColor() }}>
                {getValidationMessage()}
              </span>
            </div>
            {signature ? (
              <div className="signature-text">{signature.humanReadable}</div>
            ) : (
              <div className="signature-placeholder">
                Fill in the fields above to see the signature preview
              </div>
            )}
          </div>

          {/* Days Supply Calculation */}
          {medication.packageInfo && 
           medication.packageInfo.quantity > 0 && 
           medication.packageInfo.unit && 
           dosage.value > 0 && 
           selectedFrequency && (
            <div className="mt-3">
              <DaysSupplyCalculator
                medication={medication}
                doseValue={dosage.value}
                doseUnit={dosage.unit}
                frequency={selectedFrequency}
              />
            </div>
          )}

          <div className="builder-actions">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleSaveDefaults}
              disabled={validationStatus === 'invalid'}
            >
              <i className="bi bi-save me-1"></i>
              Save as Default
            </button>
            {defaultSettings && (
              <span className="text-muted small ms-2">
                <i className="bi bi-check-circle text-success me-1"></i>
                Default settings saved
              </span>
            )}
          </div>
        </>
      )}
      
      {/* FHIR Structure Viewer - Only show when expanded */}
      {isExpanded && (
        <FHIRStructureViewer
          medication={medication}
          dosage={dosage}
          route={selectedRoute}
          frequency={selectedFrequency}
          specialInstructions={specialInstructions}
          signature={signature}
        />
      )}

      <style>{`
        .embedded-signature-builder {
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
          padding: 1rem;
          background-color: #f8f9fa;
          margin-top: 1rem;
        }

        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .builder-header h5 {
          margin: 0;
          font-size: 1rem;
          color: #495057;
        }

        .builder-inputs {
          margin-bottom: 1rem;
        }

        .signature-preview {
          border: 2px solid;
          border-radius: 0.375rem;
          padding: 1rem;
          background-color: white;
          margin-bottom: 1rem;
          transition: border-color 0.3s ease;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .preview-label {
          font-weight: 600;
          color: #495057;
          font-size: 0.875rem;
        }

        .validation-status {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .signature-text {
          font-size: 1.1rem;
          color: #212529;
          font-weight: 500;
          padding: 0.5rem;
          background-color: #e9ecef;
          border-radius: 0.25rem;
        }

        .signature-placeholder {
          color: #6c757d;
          font-style: italic;
          font-size: 0.875rem;
        }

        .builder-actions {
          display: flex;
          align-items: center;
        }

        .form-label {
          margin-bottom: 0.25rem;
          font-weight: 600;
          color: #495057;
        }
        
        .form-control-plaintext {
          padding: 0.375rem 0.75rem;
          background-color: #e9ecef;
          border: 1px solid #ced4da;
          border-radius: 0.25rem;
          min-height: calc(1.5em + 0.75rem + 2px);
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default EmbeddedSignatureBuilder;