import React, { useEffect, useState } from 'react';
import { Medication } from '../types';
import routes, { routeOptions } from '../tables/routes';
import doseForms from '../tables/doseForms';

interface RouteSelectorProps {
  medication: Medication | null;
  selectedRoute: string;
  onSelectRoute: (route: string) => void;
  error?: string;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  medication,
  selectedRoute,
  onSelectRoute,
  error
}) => {
  const [availableRoutes, setAvailableRoutes] = useState<{ value: string; label: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Update available routes when medication changes
  useEffect(() => {
    if (!medication) {
      setAvailableRoutes([]);
      return;
    }

    // Get dose form information
    const doseForm = doseForms[medication.doseForm];
    
    if (!doseForm) {
      setAvailableRoutes(routeOptions);
      return;
    }

    // Filter routes based on what's applicable for this dose form
    const filtered = routeOptions.filter(route => {
      return routes[route.value].applicableForms.includes(medication.doseForm);
    });

    setAvailableRoutes(filtered);

    // If current selection is not compatible, set to default
    if (filtered.length > 0 && !filtered.some(r => r.value === selectedRoute)) {
      // Use the medication's default route if it exists and is compatible
      if (medication.defaultRoute && filtered.some(r => r.value === medication.defaultRoute)) {
        onSelectRoute(medication.defaultRoute);
      } else {
        // Otherwise, use the dose form's default route if it's compatible
        if (filtered.some(r => r.value === doseForm.defaultRoute)) {
          onSelectRoute(doseForm.defaultRoute);
        } else {
          // Last resort, use the first available
          onSelectRoute(filtered[0].value);
        }
      }
    }
  }, [medication, selectedRoute, onSelectRoute]);

  const handleSelectRoute = (routeValue: string) => {
    onSelectRoute(routeValue);
    setIsOpen(false);
  };

  // Check if special instructions are required for this route
  const routeRequiresSpecialInstructions = selectedRoute && 
    routes[selectedRoute] && 
    routes[selectedRoute].requiresSpecialInstructions;

  // Find the currently selected route label
  const selectedRouteLabel = availableRoutes.find(r => r.value === selectedRoute)?.label || 'Select a route';

  return (
    <div className="route-selector">
      <div className="dropdown">
        <button 
          className={`form-select d-flex justify-content-between align-items-center ${error ? 'is-invalid' : ''}`}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          disabled={!medication || availableRoutes.length === 0}
          style={{textAlign: 'left'}}
        >
          {selectedRoute ? selectedRouteLabel : '-- Select Route --'}
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2`}></i>
        </button>
        
        <ul 
          className={`dropdown-menu w-100 ${isOpen ? 'show' : ''}`} 
          style={{maxHeight: '300px', overflowY: 'auto'}}
        >
          {availableRoutes.map(route => (
            <li key={route.value}>
              <button 
                className="dropdown-item" 
                type="button"
                onClick={() => handleSelectRoute(route.value)}
              >
                {route.label}
              </button>
            </li>
          ))}
        </ul>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>

      {routeRequiresSpecialInstructions && (
        <div className="mt-2">
          <span className="badge bg-info text-white d-flex align-items-center" style={{fontSize: "0.7rem"}}>
            <i className="bi bi-info-circle me-1"></i>
            Special instructions recommended
          </span>
        </div>
      )}
    </div>
  );
};

export default RouteSelector;
