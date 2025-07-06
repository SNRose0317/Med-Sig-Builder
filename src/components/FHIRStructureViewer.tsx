import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FHIRStructureViewerProps {
  data: any;
}

const FHIRStructureViewer: React.FC<FHIRStructureViewerProps> = ({ data }) => {
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
      return <span className="text-muted-foreground">null</span>;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-blue-400">{JSON.stringify(value)}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }
      
      const isExpanded = expandedPaths.has(path);
      return (
        <span>
          <button
            className="p-0 mr-1 text-muted-foreground hover:text-foreground focus:outline-none"
            onClick={() => togglePath(path)}
          >
            {isExpanded ? <ChevronDown className="inline h-3 w-3" /> : <ChevronRight className="inline h-3 w-3" />}
          </button>
          <span className="text-muted-foreground">[{value.length}]</span>
          {isExpanded && (
            <div className="ml-6">
              {value.map((item, index) => (
                <div key={index} className="py-0.5">
                  <span className="text-muted-foreground">[{index}]:</span> {renderValue(item, `${path}.${index}`, depth + 1)}
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
        return <span className="text-muted-foreground">{'{}'}</span>;
      }

      const isExpanded = expandedPaths.has(path);
      return (
        <span>
          <button
            className="p-0 mr-1 text-muted-foreground hover:text-foreground focus:outline-none"
            onClick={() => togglePath(path)}
          >
            {isExpanded ? <ChevronDown className="inline h-3 w-3" /> : <ChevronRight className="inline h-3 w-3" />}
          </button>
          <span className="text-muted-foreground">{`{ ${keys.length} properties }`}</span>
          {isExpanded && (
            <div className="ml-6">
              {keys.map(key => (
                <div key={key} className="py-0.5">
                  <span className="text-cyan-400">{key}</span>
                  <span className="text-muted-foreground">:</span> {renderValue(value[key], `${path}.${key}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </span>
      );
    }

    return <span className="text-secondary-foreground">{JSON.stringify(value)}</span>;
  };

  return (
    <div className="p-4 bg-card rounded-lg">
      <h6 className="mb-3 text-sm font-semibold text-secondary-foreground">FHIR MedicationRequest Structure</h6>
      <div className="font-mono text-sm text-secondary-foreground">
        {renderValue(data)}
      </div>
    </div>
  );
};

export default FHIRStructureViewer;