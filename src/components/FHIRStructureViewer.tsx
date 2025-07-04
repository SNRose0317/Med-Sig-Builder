import React, { useState, useMemo } from 'react';
import { Medication } from '../types';
import { DoseInput } from '../utils/buildDosage';
import { frequencyLookup } from '../tables/frequencyTable';

interface FHIRStructureViewerProps {
  medication: Medication | null;
  dosage: DoseInput;
  route: string;
  frequency: string;
  specialInstructions: string;
  signature: {
    humanReadable: string;
    fhirRepresentation: any;
  } | null;
}

const FHIRStructureViewer: React.FC<FHIRStructureViewerProps> = ({
  medication,
  dosage,
  route,
  frequency,
  specialInstructions,
  signature
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'medication' | 'inputs' | 'output'>('medication');

  // Helper functions for frequency parsing - moved before useMemo
  const getFrequencyComponents = (freq: string) => {
    const normalizedFreq = freq.toLowerCase();
    const frequencyMap: Record<string, { frequency: number; period: number; periodUnit: string }> = {
      'once daily': { frequency: 1, period: 1, periodUnit: 'd' },
      'twice daily': { frequency: 2, period: 1, periodUnit: 'd' },
      'three times daily': { frequency: 3, period: 1, periodUnit: 'd' },
      'four times daily': { frequency: 4, period: 1, periodUnit: 'd' },
      'every 4 hours': { frequency: 6, period: 1, periodUnit: 'd' },
      'every 6 hours': { frequency: 4, period: 1, periodUnit: 'd' },
      'every 8 hours': { frequency: 3, period: 1, periodUnit: 'd' },
      'every 12 hours': { frequency: 2, period: 1, periodUnit: 'd' },
      'at bedtime': { frequency: 1, period: 1, periodUnit: 'd' },
      'as needed': { frequency: 1, period: 1, periodUnit: 'd' }
    };
    return frequencyMap[normalizedFreq] || { frequency: 1, period: 1, periodUnit: 'd' };
  };

  const getFrequencyCode = (freq: string) => {
    const normalizedFreq = freq.toLowerCase();
    const codeMap: Record<string, string> = {
      'once daily': 'QD',
      'twice daily': 'BID',
      'three times daily': 'TID',
      'four times daily': 'QID',
      'every 4 hours': 'Q4H',
      'every 6 hours': 'Q6H',
      'every 8 hours': 'Q8H',
      'every 12 hours': 'Q12H',
      'at bedtime': 'QHS',
      'as needed': 'PRN'
    };
    return codeMap[normalizedFreq] || 'QD';
  };

  const getRouteCode = (routeDisplay: string) => {
    const routeCodeMap: Record<string, string> = {
      'by mouth': '26643006',
      'sublingual': '37839007',
      'topical': '45890007',
      'inhalation': '18679011',
      'intranasal': '46713006',
      'in the eye': '54485002',
      'in the ear': '33815001',
      'rectal': '37161004',
      'vaginal': '16857009',
      'subcutaneous': '34206005',
      'intramuscular': '78421000',
      'intravenous': '47625008'
    };
    return routeCodeMap[routeDisplay] || '26643006';
  };

  // Generate FHIR Medication Resource
  const fhirMedication = useMemo(() => {
    if (!medication) return null;

    return {
      resourceType: "Medication",
      id: medication.id,
      meta: {
        profile: ["http://hl7.org/fhir/StructureDefinition/Medication"]
      },
      code: medication.code,
      status: medication.isActive ? "active" : "inactive",
      doseForm: {
        coding: [{
          system: "http://snomed.info/sct",
          display: medication.doseForm
        }]
      },
      ingredient: medication.ingredient.map(ing => ({
        itemCodeableConcept: {
          coding: [{
            display: ing.name
          }]
        },
        strength: {
          numerator: {
            value: ing.strengthRatio.numerator.value,
            unit: ing.strengthRatio.numerator.unit,
            system: "http://unitsofmeasure.org",
            code: ing.strengthRatio.numerator.unit
          },
          denominator: {
            value: ing.strengthRatio.denominator.value,
            unit: ing.strengthRatio.denominator.unit,
            system: "http://unitsofmeasure.org",
            code: ing.strengthRatio.denominator.unit
          }
        }
      })),
      ...(medication.totalVolume && {
        amount: {
          numerator: {
            value: medication.totalVolume.value,
            unit: medication.totalVolume.unit,
            system: "http://unitsofmeasure.org",
            code: medication.totalVolume.unit
          },
          denominator: {
            value: 1,
            unit: "package",
            system: "http://unitsofmeasure.org",
            code: "{package}"
          }
        }
      }),
      ...(medication.packageInfo && {
        batch: {
          quantity: {
            value: medication.packageInfo.quantity,
            unit: medication.packageInfo.unit,
            system: "http://unitsofmeasure.org"
          }
        }
      }),
      ...(medication.extension && {
        extension: medication.extension.map(ext => {
          if (ext["us-controlled"]) {
            return {
              url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-medication-controlled-substance",
              valueCoding: {
                system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-medication-controlled-substance",
                code: ext.schedule,
                display: `Schedule ${ext.schedule}`
              }
            };
          }
          return ext;
        })
      })
    };
  }, [medication]);

  // Generate FHIR MedicationRequest Dosage Instruction
  const fhirDosageInstruction = useMemo(() => {
    if (!medication || !dosage.value || !route || !frequency) return null;

    return {
      resourceType: "MedicationRequest",
      id: "example-request",
      meta: {
        profile: ["http://hl7.org/fhir/StructureDefinition/MedicationRequest"]
      },
      status: "active",
      intent: "order",
      medicationReference: {
        reference: `Medication/${medication.id}`,
        display: medication.name
      },
      subject: {
        reference: "Patient/example",
        display: "Example Patient"
      },
      dosageInstruction: [{
        sequence: 1,
        text: signature?.humanReadable || "Generating...",
        timing: {
          repeat: {
            frequency: getFrequencyComponents(frequency).frequency,
            period: getFrequencyComponents(frequency).period,
            periodUnit: getFrequencyComponents(frequency).periodUnit
          },
          code: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
              code: getFrequencyCode(frequency),
              display: frequency
            }]
          }
        },
        route: {
          coding: [{
            system: "http://snomed.info/sct",
            code: getRouteCode(route),
            display: route
          }]
        },
        doseAndRate: [{
          type: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/dose-rate-type",
              code: "ordered",
              display: "Ordered"
            }]
          },
          doseQuantity: {
            value: dosage.value,
            unit: dosage.unit,
            system: "http://unitsofmeasure.org",
            code: dosage.unit
          }
        }],
        ...(specialInstructions && {
          additionalInstruction: [{
            coding: [{
              display: specialInstructions
            }]
          }]
        })
      }]
    };
  }, [medication, dosage, route, frequency, specialInstructions, signature]);

  // Format JSON with syntax highlighting
  const formatJSON = (obj: any) => {
    if (!obj) return 'No data available';
    
    const json = JSON.stringify(obj, null, 2);
    
    // Simple syntax highlighting
    return json
      .replace(/("resourceType":|"id":|"status":|"intent":)/g, '<span class="json-key-primary">$1</span>')
      .replace(/("[\w-]+":)/g, '<span class="json-key">$1</span>')
      .replace(/(:\s*"[^"]*")/g, '<span class="json-string">$1</span>')
      .replace(/(:\s*\d+\.?\d*)/g, '<span class="json-number">$1</span>')
      .replace(/(:\s*(true|false))/g, '<span class="json-boolean">$1</span>')
      .replace(/(:\s*null)/g, '<span class="json-null">$1</span>');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'medication':
        return (
          <div className="json-viewer">
            <h6 className="viewer-section-title">FHIR Medication Resource</h6>
            <pre dangerouslySetInnerHTML={{ __html: formatJSON(fhirMedication) }} />
          </div>
        );
      case 'inputs':
        return (
          <div className="json-viewer">
            <h6 className="viewer-section-title">Current Input Values</h6>
            <pre dangerouslySetInnerHTML={{ 
              __html: formatJSON({
                dosage: dosage.value ? dosage : null,
                route: route || null,
                frequency: frequency || null,
                specialInstructions: specialInstructions || null
              }) 
            }} />
          </div>
        );
      case 'output':
        return (
          <div className="json-viewer">
            <h6 className="viewer-section-title">FHIR MedicationRequest with Dosage Instructions</h6>
            <pre dangerouslySetInnerHTML={{ __html: formatJSON(fhirDosageInstruction) }} />
            
            {signature && (
              <>
                <h6 className="viewer-section-title mt-4">Generated Signature</h6>
                <div className="signature-output-display">
                  <div className="sig-label">Human Readable:</div>
                  <div className="sig-value">{signature.humanReadable}</div>
                  <div className="sig-label mt-2">FHIR Representation:</div>
                  <pre className="sig-value" dangerouslySetInnerHTML={{ __html: formatJSON(signature.fhirRepresentation) }} />
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fhir-structure-viewer">
      <div className="viewer-header">
        <h5>
          <i className="bi bi-code-slash me-2"></i>
          FHIR Structure Viewer
          <span className="badge bg-secondary ms-2">Developer Mode</span>
        </h5>
        <button
          type="button"
          className="btn btn-sm btn-link"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'} FHIR Details
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="viewer-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'medication' ? 'active' : ''}`}
              onClick={() => setActiveTab('medication')}
            >
              <i className="bi bi-capsule me-1"></i>
              Medication Resource
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'inputs' ? 'active' : ''}`}
              onClick={() => setActiveTab('inputs')}
            >
              <i className="bi bi-input-cursor me-1"></i>
              Current Inputs
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'output' ? 'active' : ''}`}
              onClick={() => setActiveTab('output')}
            >
              <i className="bi bi-file-earmark-medical me-1"></i>
              MedicationRequest Output
            </button>
          </div>

          <div className="viewer-content">
            {renderContent()}
          </div>

          <div className="viewer-footer">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              This viewer shows the FHIR-compliant structure of medication data, user inputs, and generated prescription outputs.
            </small>
          </div>
        </>
      )}

      <style>{`
        .fhir-structure-viewer {
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
          background-color: #f8f9fa;
          margin-top: 1.5rem;
          overflow: hidden;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #e9ecef;
          border-bottom: 1px solid #dee2e6;
        }

        .viewer-header h5 {
          margin: 0;
          font-size: 1rem;
          color: #495057;
          display: flex;
          align-items: center;
        }

        .viewer-tabs {
          display: flex;
          background-color: #e9ecef;
          border-bottom: 1px solid #dee2e6;
          padding: 0 1rem;
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 0.75rem 1rem;
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          color: #495057;
        }

        .tab-btn.active {
          color: #0d6efd;
          border-bottom-color: #0d6efd;
        }

        .viewer-content {
          padding: 1rem;
          max-height: 500px;
          overflow-y: auto;
          background-color: white;
        }

        .json-viewer {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
        }

        .json-viewer pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          line-height: 1.5;
        }

        .viewer-section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #495057;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #dee2e6;
        }

        .json-key-primary {
          color: #d73a49;
          font-weight: 600;
        }

        .json-key {
          color: #005cc5;
          font-weight: 500;
        }

        .json-string {
          color: #032f62;
        }

        .json-number {
          color: #005cc5;
        }

        .json-boolean {
          color: #d73a49;
        }

        .json-null {
          color: #6a737d;
        }

        .signature-output-display {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 0.25rem;
          margin-top: 0.5rem;
        }

        .sig-label {
          font-weight: 600;
          color: #495057;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .sig-value {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          color: #212529;
          background-color: white;
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .viewer-footer {
          padding: 0.75rem 1rem;
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
          text-align: center;
        }

        /* Scrollbar styling for the viewer */
        .viewer-content::-webkit-scrollbar {
          width: 8px;
        }

        .viewer-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .viewer-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .viewer-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default FHIRStructureViewer;