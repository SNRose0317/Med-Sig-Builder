import React, { useState } from 'react';

interface SignatureOutputProps {
  signature: {
    humanReadable: string;
    fhirRepresentation: any;
  } | null;
}

const SignatureOutput: React.FC<SignatureOutputProps> = ({ signature }) => {
  const [showFhir, setShowFhir] = useState(false);

  if (!signature) {
    return (
      <div className="alert alert-info py-2 px-3 mb-0 small">
        Fill out the form to generate a medication signature.
      </div>
    );
  }

  return (
    <div className="signature-output">
      {/* Human readable signature */}
      <div className="human-readable-sig mb-3">
        <p className="fw-medium p-2 border rounded bg-white mb-2">
          {signature.humanReadable}
        </p>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-sm btn-outline-secondary py-1 px-2"
            onClick={() => navigator.clipboard.writeText(signature.humanReadable)}
          >
            <i className="bi bi-clipboard me-1"></i> Copy
          </button>
          
          <div className="form-check form-switch ms-auto mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="showFhirSwitch"
              checked={showFhir}
              onChange={() => setShowFhir(!showFhir)}
            />
            <label className="form-check-label small" htmlFor="showFhirSwitch">
              FHIR
            </label>
          </div>
        </div>
      </div>
      
      {/* FHIR Representation (collapsed by default) */}
      {showFhir && (
        <div className="fhir-representation">
          <pre className="bg-light p-2 rounded small mb-1" style={{maxHeight: "150px", overflow: "auto"}}>
            {JSON.stringify(signature.fhirRepresentation, null, 2)}
          </pre>
          <div className="form-text small">
            Structured FHIR data representation
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureOutput;
