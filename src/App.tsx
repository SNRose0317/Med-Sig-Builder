import React, { useReducer, useCallback, useState } from 'react';
import MedicationSelector from './components/MedicationSelector';
import DoseInput from './components/DoseInput';
import RouteSelector from './components/RouteSelector';
import FrequencySelector from './components/FrequencySelector';
import SpecialInstructions from './components/SpecialInstructions';
import SignatureOutput from './components/SignatureOutput';
import MedicationOverviewTable from './components/MedicationOverviewTable';
import DaysSupplyCalculator from './components/DaysSupplyCalculator';
import reducer, { initialState, validateState, AppState } from './reducer';
import { generateSignature, DoseInput as DoseInputType } from './utils/buildDosage';
import { Medication } from './types';
import routes from './tables/routes';

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTab, setActiveTab] = useState<'signature' | 'management'>('signature');
  
  // Handler for selecting a medication
  const handleSelectMedication = useCallback((medication: Medication) => {
    dispatch({ type: 'SELECT_MEDICATION', medication });
  }, []);
  
  // Handler for updating dosage information
  const handleUpdateDosage = useCallback((dosage: DoseInputType) => {
    dispatch({ type: 'UPDATE_DOSAGE', dosage });
    dispatch({ type: 'CLEAR_ERROR', field: 'dosage' });
  }, []);
  
  // Handler for selecting a route
  const handleSelectRoute = useCallback((route: string) => {
    dispatch({ type: 'SELECT_ROUTE', route });
    dispatch({ type: 'CLEAR_ERROR', field: 'route' });
  }, []);
  
  // Handler for selecting a frequency
  const handleSelectFrequency = useCallback((frequency: string) => {
    dispatch({ type: 'SELECT_FREQUENCY', frequency });
    dispatch({ type: 'CLEAR_ERROR', field: 'frequency' });
  }, []);
  
  // Handler for updating special instructions
  const handleUpdateInstructions = useCallback((instructions: string) => {
    dispatch({ type: 'UPDATE_SPECIAL_INSTRUCTIONS', instructions });
  }, []);
  
  // Handler for form submission to generate the signature
  const handleGenerateSignature = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    const { isValid, errors } = validateState(state);
    
    // If there are errors, update the state with error messages
    if (!isValid) {
      Object.entries(errors).forEach(([field, message]) => {
        dispatch({ type: 'SET_ERROR', field, message });
      });
      return;
    }
    
    // Generate the signature
    if (state.selectedMedication) {
      try {
        const result = generateSignature(
          state.selectedMedication,
          state.dosage,
          state.selectedRoute,
          state.selectedFrequency,
          state.specialInstructions
        );
        
        dispatch({ type: 'GENERATE_SIGNATURE', signature: result });
      } catch (error) {
        console.error('Error generating signature:', error);
        dispatch({
          type: 'SET_ERROR',
          field: 'general',
          message: `Error generating signature: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  }, [state]);
  
  // Handler for resetting the form
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);
  
  return (
    <div className="container-fluid bg-white min-vh-100">
      <div className="app-header py-2 mb-3 border-bottom">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <h1 className="h4 me-auto mb-0">Medication Signature Builder</h1>
            <div className="text-muted small">Healthcare Provider Tools</div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="container-fluid mb-4">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'signature' ? 'active' : ''}`}
              onClick={() => setActiveTab('signature')}
            >
              Signature Builder
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'management' ? 'active' : ''}`}
              onClick={() => setActiveTab('management')}
            >
              Medication Management
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      <div className="container-fluid">
        {activeTab === 'signature' && (
          <form onSubmit={handleGenerateSignature} className="compact-form">
            <div className="row g-3 mb-3">
              <div className="col-md-9">
                {/* Left Column - Main Inputs */}
                <div className="row g-2">
                  {/* Medication & Route Row */}
                  <div className="col-md-6">
                    <div className="input-group-label">Medication</div>
                    <MedicationSelector
                      selectedMedication={state.selectedMedication}
                      onSelectMedication={handleSelectMedication}
                    />
                  </div>
                  <div className="col-md-6">
                    {state.selectedMedication ? (
                      <>
                        <div className="input-group-label">Route</div>
                        <RouteSelector
                          medication={state.selectedMedication}
                          selectedRoute={state.selectedRoute}
                          onSelectRoute={handleSelectRoute}
                          error={state.errors.route}
                        />
                      </>
                    ) : (
                      <div className="input-placeholder">
                        <div className="input-group-label text-muted">Route</div>
                        <div className="form-select disabled">Select a medication first</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Dose & Frequency Row */}
                  {state.selectedMedication && state.selectedRoute && (
                    <>
                      <div className="col-md-6">
                        <div className="input-group-label">Dosage</div>
                        <DoseInput
                          medication={state.selectedMedication}
                          dosage={state.dosage}
                          onUpdateDosage={handleUpdateDosage}
                          error={state.errors.dosage}
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="input-group-label">Frequency</div>
                        <FrequencySelector
                          selectedFrequency={state.selectedFrequency}
                          onSelectFrequency={handleSelectFrequency}
                          error={state.errors.frequency}
                          disabled={!state.selectedMedication}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Special Instructions */}
                  {state.selectedMedication && state.selectedRoute && (
                    <div className="col-12">
                      <div className="input-group-label">
                        Special Instructions
                      </div>
                      <SpecialInstructions
                        medication={state.selectedMedication}
                        selectedRoute={state.selectedRoute}
                        specialInstructions={state.specialInstructions}
                        onUpdateInstructions={handleUpdateInstructions}
                      />
                    </div>
                  )}
                  
                  {/* Error Messages */}
                  {state.errors.general && (
                    <div className="col-12">
                      <div className="alert alert-danger py-2 px-3 mt-2 mb-0 small">
                        {state.errors.general}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {state.selectedMedication && state.selectedRoute && (
                    <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleReset}
                      >
                        <i className="bi bi-arrow-counterclockwise"></i> Reset
                      </button>
                      <button type="submit" className="btn btn-sm btn-primary">
                        <i className="bi bi-check-circle"></i> Generate
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-md-3">
                {/* Right Column - Output */}
                <div className="output-panel h-100">
                  <div className="output-panel-header">
                    <h3 className="h6 mb-0">Generated Signature</h3>
                  </div>
                  <div className="output-panel-body">
                    <SignatureOutput signature={state.generatedSignature} />
                    
                    {/* Days Supply Calculator - only show when we have a complete signature */}
                    {state.generatedSignature && (
                      <DaysSupplyCalculator
                        medication={state.selectedMedication!}
                        doseValue={state.dosage.value}
                        doseUnit={state.dosage.unit}
                        frequency={state.selectedFrequency}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
        
        {activeTab === 'management' && (
          <MedicationOverviewTable />
        )}
      </div>
      
      <footer className="py-2 mt-4 border-top text-center small text-muted">
        <div className="container-fluid">
          Medication Signature Builder &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default App;
