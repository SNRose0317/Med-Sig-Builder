import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { getMedications } from '../services/medicationService';

interface MedicationSelectorProps {
  selectedMedication: Medication | null;
  onSelectMedication: (medication: Medication) => void;
  onDefaultsLoaded?: (defaults: {
    dosage: { value: number; unit: string };
    frequency: string;
    specialInstructions?: string;
  }) => void;
}

const MedicationSelector: React.FC<MedicationSelectorProps> = ({
  selectedMedication,
  onSelectMedication,
  onDefaultsLoaded
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch medications from Supabase on component mount
  useEffect(() => {
    let mounted = true;
    
    const fetchMedications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const meds = await getMedications();
        
        // Only update state if component is still mounted
        if (mounted) {
          setMedications(meds);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        
        // Only update state if component is still mounted
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load medications';
          setError(errorMessage);
          
          // If it's a connection error, don't keep retrying
          if (errorMessage.includes('connect')) {
            console.log('Connection error detected, not retrying');
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchMedications();
    
    // Cleanup function to prevent state updates on unmounted components
    return () => {
      mounted = false;
    };
  }, []);
  
  const [showDefaultsNotification, setShowDefaultsNotification] = useState(false);

  const handleSelect = (medication: Medication) => {
    onSelectMedication(medication);
    setIsOpen(false);
    
    // Check if medication has default signature settings
    if (medication.defaultSignatureSettings && onDefaultsLoaded) {
      onDefaultsLoaded(medication.defaultSignatureSettings);
      setShowDefaultsNotification(true);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowDefaultsNotification(false);
      }, 3000);
    }
  };

  // Format the strength ratio for display
  const formatStrength = (medication: Medication): string => {
    if (!medication.ingredient[0]?.strengthRatio) return '';
    
    const { numerator, denominator } = medication.ingredient[0].strengthRatio;
    return `${numerator.value}${numerator.unit}/${denominator.value}${denominator.unit}`;
  };

  return (
    <div className="medication-selector">
      <div className="dropdown">
        <button 
          className="form-select d-flex justify-content-between align-items-center"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          style={{textAlign: 'left'}}
        >
          {selectedMedication 
            ? selectedMedication.name
            : '-- Select a Medication --'
          }
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2`}></i>
        </button>
        
        <ul 
          className={`dropdown-menu w-100 ${isOpen ? 'show' : ''}`} 
          style={{maxHeight: '300px', overflowY: 'auto'}}
        >
          {isLoading ? (
            <li className="dropdown-item text-center">
              <div className="d-flex align-items-center justify-content-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span>Loading medications...</span>
              </div>
            </li>
          ) : error ? (
            <li className="dropdown-item text-danger">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <span>Error loading medications</span>
              </div>
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
                  onClick={() => handleSelect(medication)}
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
      
      {selectedMedication && (
        <div className="medication-info mt-2">
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
            {selectedMedication.defaultSignatureSettings && (
              <span className="badge bg-info text-dark" title="Has default signature settings">
                <i className="bi bi-star-fill"></i> Defaults
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Defaults loaded notification */}
      {showDefaultsNotification && (
        <div className="alert alert-info alert-dismissible fade show mt-2" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          Default signature settings have been loaded
        </div>
      )}
    </div>
  );
};

export default MedicationSelector;
