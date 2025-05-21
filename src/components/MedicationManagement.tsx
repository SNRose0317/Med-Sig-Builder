import React, { useState, useEffect } from 'react';
import MedicationForm from './MedicationForm';
import { Medication } from '../types';
import defaultMedications from '../data/medications.json';
import { getMedications, saveMedication, deleteMedication, initializeMedicationsDatabase } from '../services/medicationService';

const MedicationManagement: React.FC = () => {
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(true);
  const [medicationsList, setMedicationsList] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  
  // Load medications from Supabase on component mount
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setIsLoading(true);
        const meds = await getMedications();
        
        // If no medications exist in the database, initialize with default data
        if (meds.length === 0 && !isInitializing) {
          setIsInitializing(true);
          try {
            await initializeMedicationsDatabase(defaultMedications as Medication[]);
            const initializedMeds = await getMedications();
            setMedicationsList(initializedMeds);
          } catch (initError) {
            console.error('Error initializing medications:', initError);
            const errorMessage = initError instanceof Error 
              ? `Database initialization error: ${initError.message}`
              : 'Unknown error initializing medications database';
            setError(errorMessage);
            setMedicationsList([]);
          } finally {
            setIsInitializing(false);
          }
        } else {
          setMedicationsList(meds);
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        const errorMessage = err instanceof Error 
          ? `Database connection error: ${err.message}`
          : 'Failed to connect to the database';
        setError(errorMessage);
        setMedicationsList([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMedications();
  }, []);

  const handleAddNewClick = () => {
    setSelectedMedication(null);
    setIsAddMode(true);
  };

  const handleEditClick = (medication: Medication) => {
    setSelectedMedication(medication);
    setIsAddMode(false);
  };

  const handleSave = async (medication: Medication) => {
    try {
      setError(null);
      const savedMedication = await saveMedication(medication);
      
      if (isAddMode) {
        setMedicationsList([...medicationsList, savedMedication]);
      } else {
        setMedicationsList(
          medicationsList.map(med => med.id === savedMedication.id ? savedMedication : med)
        );
      }
      setSelectedMedication(null);
    } catch (err) {
      console.error('Error saving medication:', err);
      const errorMessage = err instanceof Error 
        ? `Failed to save medication: ${err.message}`
        : 'Failed to save medication due to an unknown error';
      setError(errorMessage);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }
    
    try {
      setError(null);
      await deleteMedication(id);
      setMedicationsList(medicationsList.filter(med => med.id !== id));
      
      // If the deleted medication was selected, clear the selection
      if (selectedMedication && selectedMedication.id === id) {
        setSelectedMedication(null);
        setIsAddMode(true);
      }
    } catch (err) {
      console.error('Error deleting medication:', err);
      const errorMessage = err instanceof Error 
        ? `Failed to delete medication: ${err.message}` 
        : 'Failed to delete medication due to an unknown error';
      setError(errorMessage);
    }
  };

  return (
    <div className="medication-management">
      <div className="medication-management-header">
        <h2>Medication Management</h2>
        <button onClick={handleAddNewClick} className="btn btn-primary">
          Add New Medication
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

      <div className="medication-management-content">
        <div className="medication-list">
          <h3>Existing Medications</h3>
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <div>Loading medications...</div>
            </div>
          ) : medicationsList.length > 0 ? (
            <div className="list-container">
              {medicationsList.map(medication => (
                <div key={medication.id} className="medication-item">
                  <div className="medication-info">
                    <span className="medication-name">{medication.name}</span>
                    <span className="medication-dose-form">{medication.doseForm}</span>
                  </div>
                  <div className="medication-actions">
                    <button 
                      onClick={() => handleEditClick(medication)}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(medication.id)}
                      className="btn btn-danger btn-sm ms-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No medications found. Add your first medication using the form.
            </div>
          )}
        </div>

        <div className="medication-form-container">
          <h3>{isAddMode ? 'Add New Medication' : 'Edit Medication'}</h3>
          {isInitializing ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <div>Initializing database...</div>
            </div>
          ) : (
            <MedicationForm 
              medication={selectedMedication} 
              isAddMode={isAddMode} 
              onSave={handleSave} 
            />
          )}
        </div>
      </div>

      <style>{`
        .medication-management {
          padding: 1rem;
        }
        .medication-management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .medication-management-content {
          display: flex;
          gap: 2rem;
        }
        .medication-list {
          flex: 1;
        }
        .medication-form-container {
          flex: 2;
        }
        .list-container {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: auto;
          max-height: 500px;
        }
        .medication-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #e0e0e0;
        }
        .medication-item:last-child {
          border-bottom: none;
        }
        .medication-name {
          font-weight: bold;
          margin-right: 0.5rem;
        }
        .medication-dose-form {
          color: #666;
          font-size: 0.9rem;
        }
        .btn {
          padding: 0.375rem 0.75rem;
          border-radius: 0.25rem;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .btn-primary {
          background-color: #0d6efd;
          color: white;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
        .btn-danger {
          background-color: #dc3545;
          color: white;
        }
        .ms-2 {
          margin-left: 0.5rem;
        }
        .medication-actions {
          display: flex;
          gap: 0.25rem;
        }
        .alert {
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
        .mb-3 {
          margin-bottom: 1rem;
        }
        .float-end {
          float: right;
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
          cursor: pointer;
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
      `}</style>
    </div>
  );
};

export default MedicationManagement;
