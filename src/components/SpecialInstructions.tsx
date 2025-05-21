import React from 'react';
import { Medication } from '../types';
import routes from '../tables/routes';

interface SpecialInstructionsProps {
  medication: Medication | null;
  selectedRoute: string;
  specialInstructions: string;
  onUpdateInstructions: (instructions: string) => void;
}

const SpecialInstructions: React.FC<SpecialInstructionsProps> = ({
  medication,
  selectedRoute,
  specialInstructions,
  onUpdateInstructions
}) => {
  const routeInfo = selectedRoute ? routes[selectedRoute] : null;
  const suggestInstructions = routeInfo?.requiresSpecialInstructions || false;
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateInstructions(e.target.value);
  };
  
  // Only show this component if a medication and route are selected
  if (!medication || !selectedRoute) {
    return null;
  }
  
  return (
    <div className="special-instructions">
      {suggestInstructions && (
        <div className="d-flex mb-2">
          <span className="badge bg-info text-white d-inline-flex align-items-center" style={{fontSize: "0.7rem"}}>
            <i className="bi bi-info-circle me-1"></i>
            Recommended for {routeInfo?.humanReadable}
          </span>
        </div>
      )}
      
      <textarea
        className="form-control"
        value={specialInstructions}
        onChange={handleChange}
        placeholder={suggestInstructions 
          ? `${routeInfo?.humanReadable} site or location (optional)` 
          : "Additional instructions (optional)"}
        rows={2}
      />
      
      <div className="form-text small mt-1">
        {suggestInstructions 
          ? `Consider specifying the ${routeInfo?.humanReadable.toLowerCase()} site`
          : 'E.g., "with food", "on empty stomach", "in left arm"'}
      </div>
    </div>
  );
};

export default SpecialInstructions;
