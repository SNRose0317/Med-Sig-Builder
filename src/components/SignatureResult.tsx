import React, { useState } from 'react';
import { Medication } from '../types/index';
import { frequencies, routes } from '../constants/medication-data';
import { calculateDaysSupply } from '../lib/calculations';
import { DoseInput } from '../lib/signature';

interface SignatureResultProps {
  selectedMedication: Medication | null;
  dosage: DoseInput;
  route: string;
  frequency: string;
  specialInstructions: string;
  signature: { humanReadable: string; fhirRepresentation: any } | null;
  onReset?: () => void;
}

const SignatureResult: React.FC<SignatureResultProps> = ({ 
  selectedMedication,
  dosage,
  route,
  frequency,
  specialInstructions,
  signature,
  onReset 
}) => {
  const [showFhir, setShowFhir] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Calculate days supply if possible
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

  const handleCopy = async () => {
    if (signature?.humanReadable) {
      try {
        await navigator.clipboard.writeText(signature.humanReadable);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleCopyFhir = async () => {
    if (signature?.fhirRepresentation) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(signature.fhirRepresentation, null, 2));
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy FHIR:', err);
      }
    }
  };

  if (!signature) {
    return (
      <div className="signature-result">
        <div className="empty-state">
          <i className="bi bi-prescription2 display-4 text-muted"></i>
          <p className="mt-3">Fill out the form to generate a medication signature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signature-result">
      <div className="result-header">
        <h3>Generated Signature</h3>
        {onReset && (
          <button onClick={onReset} className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-counterclockwise"></i> New Signature
          </button>
        )}
      </div>

      {/* Main signature display */}
      <div className="signature-display">
        <div className="signature-text">
          {signature.humanReadable}
        </div>
        
        <div className="signature-actions">
          <button 
            className={`btn btn-sm ${copySuccess ? 'btn-success' : 'btn-outline-primary'}`}
            onClick={handleCopy}
          >
            <i className={`bi bi-${copySuccess ? 'check' : 'clipboard'} me-1`}></i>
            {copySuccess ? 'Copied!' : 'Copy Signature'}
          </button>
          
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowDetails(!showDetails)}
          >
            <i className={`bi bi-${showDetails ? 'eye-slash' : 'eye'} me-1`}></i>
            {showDetails ? 'Hide' : 'Show'} Details
          </button>

          <button 
            className="btn btn-sm btn-outline-info"
            onClick={() => setShowFhir(!showFhir)}
          >
            <i className="bi bi-code-slash me-1"></i>
            FHIR
          </button>
        </div>
      </div>

      {/* Prescription details */}
      {showDetails && selectedMedication && (
        <div className="prescription-details">
          <h5>Prescription Details</h5>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Medication:</span>
              <span className="detail-value">{selectedMedication.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Dose Form:</span>
              <span className="detail-value">{selectedMedication.doseForm}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Strength:</span>
              <span className="detail-value">
                {selectedMedication.ingredient[0]?.strengthRatio && 
                  `${selectedMedication.ingredient[0].strengthRatio.numerator.value}${selectedMedication.ingredient[0].strengthRatio.numerator.unit}/` +
                  `${selectedMedication.ingredient[0].strengthRatio.denominator.value}${selectedMedication.ingredient[0].strengthRatio.denominator.unit}`
                }
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Dose:</span>
              <span className="detail-value">{dosage.value} {dosage.unit}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Route:</span>
              <span className="detail-value">{routes[route]?.humanReadable || route}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Frequency:</span>
              <span className="detail-value">{frequencies[frequency]?.humanReadable || frequency}</span>
            </div>
            {specialInstructions && (
              <div className="detail-item full-width">
                <span className="detail-label">Special Instructions:</span>
                <span className="detail-value">{specialInstructions}</span>
              </div>
            )}
            {daysSupply !== null && (
              <div className="detail-item">
                <span className="detail-label">Days Supply:</span>
                <span className="detail-value">{daysSupply} days</span>
              </div>
            )}
            {selectedMedication.packageInfo && (
              <div className="detail-item">
                <span className="detail-label">Package:</span>
                <span className="detail-value">
                  {selectedMedication.packageInfo.quantity} {selectedMedication.packageInfo.unit}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FHIR Representation */}
      {showFhir && (
        <div className="fhir-section">
          <div className="fhir-header">
            <h5>FHIR Representation</h5>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={handleCopyFhir}
            >
              <i className="bi bi-clipboard me-1"></i> Copy FHIR
            </button>
          </div>
          <pre className="fhir-content">
            {JSON.stringify(signature.fhirRepresentation, null, 2)}
          </pre>
          <div className="fhir-info">
            <i className="bi bi-info-circle me-1"></i>
            This FHIR-compliant structure can be integrated with healthcare systems that support HL7 FHIR standards.
          </div>
        </div>
      )}

      <style>{`
        .signature-result {
          padding: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .result-header h3 {
          margin: 0;
        }

        .signature-display {
          background-color: #f8f9fa;
          border: 2px solid #0d6efd;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .signature-text {
          font-size: 1.25rem;
          font-weight: 500;
          color: #212529;
          margin-bottom: 1rem;
          padding: 1rem;
          background-color: white;
          border-radius: 0.25rem;
          border: 1px solid #dee2e6;
        }

        .signature-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .prescription-details {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .prescription-details h5 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #495057;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-label {
          font-size: 0.875rem;
          color: #6c757d;
          font-weight: 500;
        }

        .detail-value {
          font-size: 1rem;
          color: #212529;
        }

        .fhir-section {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .fhir-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .fhir-header h5 {
          margin: 0;
          color: #495057;
        }

        .fhir-content {
          background-color: white;
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          padding: 1rem;
          font-size: 0.875rem;
          overflow-x: auto;
          max-height: 400px;
          margin-bottom: 1rem;
        }

        .fhir-info {
          font-size: 0.875rem;
          color: #6c757d;
          font-style: italic;
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

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          border-radius: 0.2rem;
        }

        .btn-outline-primary {
          color: #0d6efd;
          border-color: #0d6efd;
          background-color: transparent;
        }

        .btn-outline-primary:hover {
          color: #fff;
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .btn-outline-secondary {
          color: #6c757d;
          border-color: #6c757d;
          background-color: transparent;
        }

        .btn-outline-secondary:hover {
          color: #fff;
          background-color: #6c757d;
          border-color: #6c757d;
        }

        .btn-outline-info {
          color: #0dcaf0;
          border-color: #0dcaf0;
          background-color: transparent;
        }

        .btn-outline-info:hover {
          color: #000;
          background-color: #0dcaf0;
          border-color: #0dcaf0;
        }

        .btn-success {
          color: #fff;
          background-color: #28a745;
          border-color: #28a745;
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
          
          .signature-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SignatureResult;