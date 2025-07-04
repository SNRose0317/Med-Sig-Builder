import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { getMedications, deleteMedication, initializeMedicationsDatabase } from '../services/medicationService';
import defaultMedications from '../data/medications.json';
import MedicationManagement from './MedicationManagement';

const MedicationOverviewTable: React.FC = () => {
  const [medicationsList, setMedicationsList] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [showManagement, setShowManagement] = useState<boolean>(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(true);

  // Load medications from Supabase on component mount
  useEffect(() => {
    let mounted = true;
    let initializationAttempted = false;
    
    const fetchMedications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const meds = await getMedications();
        
        if (!mounted) return;
        
        // If no medications exist in the database, initialize with default data
        if (meds.length === 0 && !isInitializing && !initializationAttempted) {
          initializationAttempted = true;
          setIsInitializing(true);
          try {
            await initializeMedicationsDatabase(defaultMedications as Medication[]);
            const initializedMeds = await getMedications();
            
            if (mounted) {
              setMedicationsList(initializedMeds);
            }
          } catch (initError) {
            console.error('Error initializing medications:', initError);
            
            if (mounted) {
              const errorMessage = initError instanceof Error 
                ? `Database initialization error: ${initError.message}`
                : 'Unknown error initializing medications database';
              setError(errorMessage);
              setMedicationsList([]);
            }
          } finally {
            if (mounted) {
              setIsInitializing(false);
            }
          }
        } else {
          setMedicationsList(meds);
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        
        if (mounted) {
          const errorMessage = err instanceof Error 
            ? err.message
            : 'Failed to connect to the database';
          setError(errorMessage);
          setMedicationsList([]);
          
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
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddNewClick = () => {
    setSelectedMedication(null);
    setIsAddMode(true);
    setShowManagement(true);
  };

  const handleEditClick = (medication: Medication) => {
    setSelectedMedication(medication);
    setIsAddMode(false);
    setShowManagement(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }
    
    try {
      setError(null);
      await deleteMedication(id);
      setMedicationsList(medicationsList.filter(med => med.id !== id));
    } catch (err) {
      console.error('Error deleting medication:', err);
      const errorMessage = err instanceof Error 
        ? `Failed to delete medication: ${err.message}` 
        : 'Failed to delete medication due to an unknown error';
      setError(errorMessage);
    }
  };

  const handleMedicationSaved = (savedMedication: Medication) => {
    if (isAddMode) {
      setMedicationsList([...medicationsList, savedMedication]);
    } else {
      setMedicationsList(
        medicationsList.map(med => med.id === savedMedication.id ? savedMedication : med)
      );
    }
    setShowManagement(false);
  };

  // Format the strength ratio for display
  const formatStrength = (medication: Medication): string => {
    if (!medication.ingredient[0]?.strengthRatio) return 'N/A';
    
    const { numerator, denominator } = medication.ingredient[0].strengthRatio;
    return `${numerator.value}${numerator.unit}/${denominator.value}${denominator.unit}`;
  };

  if (showManagement) {
    return (
      <div>
        <div className="medication-overview-header mb-3">
          <button onClick={() => setShowManagement(false)} className="btn btn-secondary">
            <i className="bi bi-arrow-left"></i> Back to Overview
          </button>
        </div>
        <MedicationManagement 
          initialMedication={selectedMedication}
          initialAddMode={isAddMode}
          onMedicationSaved={handleMedicationSaved}
          standalone={true}
        />
      </div>
    );
  }

  return (
    <div className="medication-overview">
      <div className="medication-overview-header">
        <h2>Medications Overview</h2>
        <button onClick={handleAddNewClick} className="btn btn-primary">
          <i className="bi bi-plus-circle"></i> Add New Medication
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          {error}
          <button 
            className="btn-close float-end" 
            onClick={() => setError(null)} 
            aria-label="Close"
          ></button>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <div>Loading medications...</div>
        </div>
      ) : isInitializing ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <div>Initializing database...</div>
        </div>
      ) : medicationsList.length === 0 ? (
        <div className="empty-state">
          <p>No medications found. Add your first medication using the button above.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dose Form</th>
                <th>Strength</th>
                <th>Package Size</th>
                <th>Routes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicationsList.map(medication => (
                <tr key={medication.id}>
                  <td>{medication.name}</td>
                  <td>{medication.doseForm}</td>
                  <td>{formatStrength(medication)}</td>
                  <td>
                    {medication.packageInfo ? 
                      `${medication.packageInfo.quantity} ${medication.packageInfo.unit}` : 
                      'N/A'}
                  </td>
                  <td>
                    {(medication.allowedRoutes?.length) ? 
                      medication.allowedRoutes.join(', ') : 
                      'N/A'}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleEditClick(medication)}
                        className="btn btn-sm btn-outline-primary"
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(medication.id)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .medication-overview {
          padding: 1rem;
        }
        .medication-overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          color: #6c757d;
        }
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 0.25rem solid rgba(0, 0, 0, 0.1);
          border-right-color: #0d6efd;
          border-radius: 50%;
          animation: spinner 1s linear infinite;
          margin-bottom: 1rem;
        }
        @keyframes spinner {
          to { transform: rotate(360deg); }
        }
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #6c757d;
          background-color: #f8f9fa;
          border-radius: 0.25rem;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .btn {
          display: inline-block;
          font-weight: 400;
          line-height: 1.5;
          text-align: center;
          text-decoration: none;
          vertical-align: middle;
          cursor: pointer;
          user-select: none;
          border: 1px solid transparent;
          padding: 0.375rem 0.75rem;
          font-size: 1rem;
          border-radius: 0.25rem;
          transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
        }
        .btn-primary {
          color: #fff;
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        .btn-secondary {
          color: #fff;
          background-color: #6c757d;
          border-color: #6c757d;
        }
        .btn-outline-primary {
          color: #0d6efd;
          border-color: #0d6efd;
          background-color: transparent;
        }
        .btn-outline-danger {
          color: #dc3545;
          border-color: #dc3545;
          background-color: transparent;
        }
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          border-radius: 0.2rem;
        }
        .mb-3 {
          margin-bottom: 1rem;
        }
        .alert {
          position: relative;
          padding: 0.75rem 1.25rem;
          margin-bottom: 1rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
        }
        .alert-danger {
          color: #721c24;
          background-color: #f8d7da;
          border-color: #f5c6cb;
        }
        .btn-close {
          box-sizing: content-box;
          width: 1em;
          height: 1em;
          padding: 0.25em 0.25em;
          color: #000;
          background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
          border: 0;
          border-radius: 0.25rem;
          opacity: 0.5;
        }
        .float-end {
          float: right;
        }
      `}</style>
    </div>
  );
};

export default MedicationOverviewTable;
