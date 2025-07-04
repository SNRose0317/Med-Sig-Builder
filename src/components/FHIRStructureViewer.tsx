import React, { useState } from 'react';

interface FHIRStructureViewerProps {
  fhirData: any;
}

const FHIRStructureViewer: React.FC<FHIRStructureViewerProps> = ({ fhirData }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));

  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const renderValue = (value: any, path: string = 'root', depth: number = 0): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-muted">null</span>;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-primary">{JSON.stringify(value)}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted">[]</span>;
      }
      
      const isExpanded = expandedPaths.has(path);
      return (
        <span>
          <button
            className="btn btn-link btn-sm p-0 me-1"
            onClick={() => togglePath(path)}
          >
            <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}></i>
          </button>
          [{value.length}]
          {isExpanded && (
            <div className="ms-3">
              {value.map((item, index) => (
                <div key={index}>
                  [{index}]: {renderValue(item, `${path}.${index}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </span>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-muted">{}</span>;
      }

      const isExpanded = expandedPaths.has(path);
      return (
        <span>
          <button
            className="btn btn-link btn-sm p-0 me-1"
            onClick={() => togglePath(path)}
          >
            <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}></i>
          </button>
          {`{ ${keys.length} properties }`}
          {isExpanded && (
            <div className="ms-3">
              {keys.map(key => (
                <div key={key}>
                  <span className="text-info">{key}</span>: {renderValue(value[key], `${path}.${key}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </span>
      );
    }

    return <span>{JSON.stringify(value)}</span>;
  };

  return (
    <div className="fhir-structure-viewer p-3 bg-light rounded">
      <h6 className="mb-3">FHIR MedicationRequest Structure</h6>
      <div className="fhir-tree" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
        {renderValue(fhirData)}
      </div>
    </div>
  );
};

export default FHIRStructureViewer;