import React, { useEffect, useState } from 'react';
import { Medication } from '../types';
import calculateDaysSupply from '../utils/calculateDaysSupply';
import frequencies from '../tables/frequencyTable';

interface DaysSupplyCalculatorProps {
  medication: Medication;
  doseValue: number;
  doseUnit: string;
  frequency: string;
}

const DaysSupplyCalculator: React.FC<DaysSupplyCalculatorProps> = ({ 
  medication, 
  doseValue, 
  doseUnit, 
  frequency 
}) => {
  const [daysSupply, setDaysSupply] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!medication || !medication.packageInfo || !doseValue || !frequency) {
      setDaysSupply(null);
      setErrorMessage("Insufficient data to calculate days supply");
      return;
    }

    try {
      // Log the parameters we're going to pass to calculateDaysSupply
      console.log('Calling calculateDaysSupply with:', {
        medicationName: medication.name,
        doseValue,
        doseUnit,
        frequency
      });
      
      const result = calculateDaysSupply(medication, {
        value: doseValue,
        unit: doseUnit,
        frequencyKey: frequency
      });
      
      console.log('Days supply calculation result:', result);
      
      setDaysSupply(result);
      
      if (result === null) {
        const errorMsg = "Could not calculate days supply with the provided information";
        console.error(errorMsg, {
          medication: medication.name,
          packageInfo: medication.packageInfo,
          doseValue,
          doseUnit,
          frequency
        });
        setErrorMessage(errorMsg);
      } else {
        setErrorMessage(null);
      }
    } catch (error) {
      console.error('Error in days supply calculation:', error);
      setDaysSupply(null);
      setErrorMessage(`Error calculating days supply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [medication, doseValue, doseUnit, frequency]);

  // For debugging - always show component with diagnostic info
  if (!medication?.packageInfo) {
    return (
      <div className="days-supply-calculator">
        <h4>Days Supply Calculator</h4>
        <div className="error">
          Package information is missing for this medication. Days supply cannot be calculated.
        </div>
      </div>
    );
  }

  const packageInfo = medication.packageInfo;
  const freqData = frequencies[frequency];
  
  // For debugging - log the parameters
  console.log('Days Supply Calculator Parameters:', {
    medication: medication.name,
    doseValue,
    doseUnit,
    frequency,
    freqData,
    frequencies: Object.keys(frequencies),
    packageInfo
  });
  
  // If missing frequency, display info about it
  if (!frequency) {
    return (
      <div className="days-supply-calculator">
        <h4>Days Supply Calculator</h4>
        <div className="error">
          Frequency not selected. Please select a medication frequency.
        </div>
      </div>
    );
  }

  return (
    <div className="days-supply-calculator">
      <h4>Days Supply Calculator</h4>
      
      {daysSupply !== null ? (
        <div className="result">
          <p><strong>Days Supply:</strong> {daysSupply} days</p>
          <button 
            className="details-toggle" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {showDetails && (
            <div className="calculation-details">
              <h5>Calculation Details:</h5>
              <table>
                <tbody>
                  <tr>
                    <td>Package Contains:</td>
                    <td>
                      {packageInfo.quantity} {packageInfo.unit}
                      {packageInfo.packSize && packageInfo.packSize > 1 
                        ? ` (Pack size: ${packageInfo.packSize})` 
                        : ''
                      }
                    </td>
                  </tr>
                  <tr>
                    <td>Dose Amount:</td>
                    <td>{doseValue} {doseUnit}</td>
                  </tr>
                  <tr>
                    <td>Frequency:</td>
                    <td>{freqData?.humanReadable || frequency}</td>
                  </tr>
                  {medication.dispenserInfo && doseUnit === medication.dispenserInfo.unit && (
                    <tr>
                      <td>Conversion:</td>
                      <td>
                        {medication.dispenserInfo.conversionRatio} {medication.dispenserInfo.pluralUnit} = 1 mL
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="error">
          {errorMessage || "Cannot calculate days supply with current data"}
        </div>
      )}

      <style>
        {`
          .days-supply-calculator {
            margin-top: 1rem;
            padding: 1rem;
            border: 1px solid #007bff;
            border-radius: 4px;
            background-color: #f0f8ff;
          }
          
          .days-supply-calculator h4 {
            margin-top: 0;
            margin-bottom: 0.5rem;
          }
          
          .days-supply-calculator .result {
            margin-bottom: 0.5rem;
          }
          
          .days-supply-calculator .error {
            color: #d32f2f;
            font-style: italic;
          }
          
          .details-toggle {
            background: none;
            border: none;
            color: #2196f3;
            cursor: pointer;
            padding: 0;
            font-size: 0.9rem;
            text-decoration: underline;
            margin-bottom: 0.5rem;
          }
          
          .calculation-details {
            margin-top: 0.5rem;
            padding: 0.5rem;
            background-color: #f0f0f0;
            border-radius: 4px;
          }
          
          .calculation-details h5 {
            margin-top: 0;
            margin-bottom: 0.5rem;
          }
          
          .calculation-details table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .calculation-details td {
            padding: 0.25rem;
          }
          
          .calculation-details td:first-child {
            font-weight: bold;
            width: 40%;
          }
        `}
      </style>
    </div>
  );
};

export default DaysSupplyCalculator;
