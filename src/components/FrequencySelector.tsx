import React, { useState } from 'react';
import frequencies, { frequencyOptions, getFrequency, frequencyLookup } from '../tables/frequencyTable';

interface FrequencySelectorProps {
  selectedFrequency: string;
  onSelectFrequency: (frequency: string) => void;
  error?: string;
  disabled?: boolean;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  selectedFrequency,
  onSelectFrequency,
  error,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelectFrequency = (frequencyValue: string) => {
    console.log('FrequencySelector: Selecting frequency:', frequencyValue);
    try {
      onSelectFrequency(frequencyValue);
      setIsOpen(false);
    } catch (error) {
      console.error('FrequencySelector: Error selecting frequency:', error);
      throw error;
    }
  };

  // Group frequencies by period unit for the dropdown
  const dailyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'd');
  const weeklyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'wk');
  const monthlyFrequencies = frequencyOptions.filter(f => frequencies[f.value]?.periodUnit === 'mo');

  // Find the currently selected frequency label (case-insensitive)
  const normalizedSelectedKey = selectedFrequency ? frequencyLookup.get(selectedFrequency.toLowerCase()) : null;
  const selectedFrequencyLabel = normalizedSelectedKey || 'Select frequency';

  return (
    <div className="frequency-selector">
      <div className="dropdown">
        <button 
          className={`form-select d-flex justify-content-between align-items-center ${error ? 'is-invalid' : ''}`}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          disabled={disabled}
          style={{textAlign: 'left'}}
        >
          {selectedFrequency ? selectedFrequencyLabel : '-- Select Frequency --'}
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2`}></i>
        </button>
        
        <ul 
          className={`dropdown-menu w-100 ${isOpen ? 'show' : ''}`} 
          style={{maxHeight: '300px', overflowY: 'auto'}}
        >
          {/* Daily Frequencies */}
          <li><h6 className="dropdown-header">Daily</h6></li>
          {dailyFrequencies.map(frequency => (
            <li key={frequency.value}>
              <button 
                className="dropdown-item" 
                type="button"
                onClick={() => handleSelectFrequency(frequency.value)}
              >
                {frequency.label}
              </button>
            </li>
          ))}
          
          {/* Weekly Frequencies */}
          <li><hr className="dropdown-divider" /></li>
          <li><h6 className="dropdown-header">Weekly</h6></li>
          {weeklyFrequencies.map(frequency => (
            <li key={frequency.value}>
              <button 
                className="dropdown-item" 
                type="button"
                onClick={() => handleSelectFrequency(frequency.value)}
              >
                {frequency.label}
              </button>
            </li>
          ))}
          
          {/* Monthly Frequencies */}
          <li><hr className="dropdown-divider" /></li>
          <li><h6 className="dropdown-header">Monthly</h6></li>
          {monthlyFrequencies.map(frequency => (
            <li key={frequency.value}>
              <button 
                className="dropdown-item" 
                type="button"
                onClick={() => handleSelectFrequency(frequency.value)}
              >
                {frequency.label}
              </button>
            </li>
          ))}
        </ul>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
      
      {selectedFrequency && (
        <div className="mt-2 d-flex align-items-center">
          {frequencies[selectedFrequency].abbreviation && (
            <span className="badge bg-light text-dark border me-2">
              {frequencies[selectedFrequency].abbreviation}
            </span>
          )}
          <small className="text-muted" style={{fontSize: "0.7rem"}}>
            {frequencies[selectedFrequency].humanReadable}
          </small>
        </div>
      )}
    </div>
  );
};

export default FrequencySelector;
