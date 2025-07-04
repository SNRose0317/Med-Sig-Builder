import React from 'react';
import MedicationManager from './MedicationManager';

function App() {
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
      
      <div className="container-fluid">
        <MedicationManager />
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
