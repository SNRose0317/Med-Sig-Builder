import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import doseForms, { doseFormOptions } from '../tables/doseForms';
import dispenserTypes, { dispenserOptions } from '../tables/dispensers';
import routes, { routeOptions } from '../tables/routes';
import frequencies, { frequencyOptions } from '../tables/frequencyTable';
import EmbeddedSignatureBuilder from './EmbeddedSignatureBuilder';
import { v4 as uuidv4 } from 'uuid';

interface MedicationFormProps {
  medication: Medication | null;
  isAddMode: boolean;
  onSave: (medication: Medication) => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ medication, isAddMode, onSave }) => {
  // Default empty form state
  const defaultMedication: Medication = {
    id: uuidv4(),
    name: '',
    type: 'medication',
    isActive: true,
    code: {
      coding: [{ display: '' }]
    },
    doseForm: '',
    extension: [],
    ingredient: [{
      name: '',
      strengthRatio: {
        numerator: { value: 0, unit: 'mg' },
        denominator: { value: 1, unit: '' }
      }
    }],
    allowedRoutes: [],
    defaultRoute: ''
  };

  const [formData, setFormData] = useState<Medication>(medication || defaultMedication);
  const [availableDispenserTypes, setAvailableDispenserTypes] = useState<string[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);
  

  // Update form when medication prop changes
  useEffect(() => {
    if (medication) {
      setFormData(medication);
    } else {
      setFormData(defaultMedication);
    }
  }, [medication]);

  // Update available dispenser types when dose form changes
  useEffect(() => {
    if (formData.doseForm) {
      // Filter dispenser types applicable to the selected dose form
      const availableDispensers = Object.keys(dispenserTypes).filter(
        dispenserKey => dispenserTypes[dispenserKey].applicableDoseForms.includes(formData.doseForm)
      );
      setAvailableDispenserTypes(availableDispensers);

      // Filter routes applicable to the selected dose form
      const doseFormData = doseForms[formData.doseForm];
      if (doseFormData) {
        setAvailableRoutes(doseFormData.applicableRoutes);
        
        // Set default route if not already set
        if (!formData.defaultRoute && doseFormData.defaultRoute) {
          setFormData(prev => ({
            ...prev,
            defaultRoute: doseFormData.defaultRoute,
            allowedRoutes: prev.allowedRoutes?.length ? prev.allowedRoutes : [doseFormData.defaultRoute]
          }));
        }
      }

      // Update denominator unit based on dose form
      if (doseForms[formData.doseForm]) {
        setFormData(prev => ({
          ...prev,
          ingredient: prev.ingredient.map(ing => ({
            ...ing,
            strengthRatio: {
              ...ing.strengthRatio,
              denominator: {
                ...ing.strengthRatio.denominator,
                unit: formData.doseForm === 'Cream' || formData.doseForm === 'Solution' ? 'mL' : doseForms[formData.doseForm].defaultUnit
              }
            }
          }))
        }));
      }
    }
  }, [formData.doseForm]);

  // Handle dispenser selection - set default units and conversion ratio
  const handleDispenserChange = (dispenserType: string) => {
    const selectedDispenser = dispenserTypes[dispenserType];
    if (selectedDispenser) {
      setFormData(prev => ({
        ...prev,
        dispenserInfo: {
          type: dispenserType,
          unit: selectedDispenser.defaultUnit,
          pluralUnit: selectedDispenser.pluralUnit,
          conversionRatio: selectedDispenser.defaultConversionRatio
        }
      }));
    } else {
      // Clear dispenser info if none selected
      const { dispenserInfo, ...rest } = formData;
      setFormData(rest as Medication);
    }
  };

  // Form field change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like "ingredient[0].name"
      const parts = name.split('.');
      if (parts[0] === 'ingredient' && parts.length === 3) {
        const idx = 0; // For now, we only support one ingredient
        const field = parts[2];
        
        setFormData(prev => ({
          ...prev,
          ingredient: prev.ingredient.map((ing, i) => 
            i === idx ? { ...ing, [field]: value } : ing
          )
        }));
      } else if (parts[0] === 'strengthRatio' && parts.length === 3) {
        const section = parts[1]; // numerator or denominator
        const field = parts[2];   // value or unit
        
        setFormData(prev => ({
          ...prev,
          ingredient: prev.ingredient.map((ing, i) => 
            i === 0 ? { 
              ...ing, 
              strengthRatio: {
                ...ing.strengthRatio,
                [section]: {
                  ...ing.strengthRatio[section as keyof typeof ing.strengthRatio],
                  [field]: field === 'value' ? parseFloat(value) : value
                }
              }
            } : ing
          )
        }));
      } else if (parts[0] === 'code' && parts[1] === 'coding') {
        setFormData(prev => ({
          ...prev,
          code: {
            coding: [{ display: value }]
          }
        }));
      } else if (parts[0] === 'dispenserInfo') {
        const field = parts[1];
        setFormData(prev => ({
          ...prev,
          dispenserInfo: {
            ...prev.dispenserInfo!,
            [field]: field === 'conversionRatio' ? parseFloat(value) : value
          }
        }));
      } else if (parts[0] === 'packageInfo') {
        const field = parts[1];
        
        // Handle numeric fields (quantity, packSize) and string field (unit) differently
        if (field === 'quantity') {
          const numValue = value === '' ? undefined : parseFloat(value);
          setFormData(prev => ({
            ...prev,
            packageInfo: {
              ...(prev.packageInfo || {}),
              quantity: numValue as number, // Cast needed since we're ensuring it's not undefined when submitting
              unit: prev.packageInfo?.unit || ''
            }
          }));
        } else if (field === 'packSize') {
          const numValue = value === '' ? undefined : parseFloat(value);
          setFormData(prev => ({
            ...prev,
            packageInfo: {
              ...(prev.packageInfo || { quantity: 0, unit: '' }),
              packSize: numValue
            }
          }));
        } else if (field === 'unit') {
          setFormData(prev => ({
            ...prev,
            packageInfo: {
              ...(prev.packageInfo || { quantity: 0 }),
              unit: value
            }
          }));
        }
      }
    } else {
      // Handle top-level properties
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Special case for dose form - need to update display name
      if (name === 'doseForm') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          code: {
            coding: [{ display: `${prev.name} ${value}` }]
          }
        }));
      }
      
      // Special case for name - need to update display name
      if (name === 'name') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          code: {
            coding: [{ display: `${value} ${prev.doseForm}` }]
          }
        }));
      }
    }
  };

  const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const selected = Array.from(e.target.options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setFormData(prev => ({
      ...prev,
      allowedRoutes: selected,
      defaultRoute: value // Set the first selected one as default
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a clean version of the form data for submission
    let updatedFormData = {
      ...formData,
      code: {
        coding: [{ display: `${formData.name} ${formData.doseForm}` }]
      }
    };
    
    // Format packageInfo correctly for submission
    if (formData.packageInfo) {
      // Only include packageInfo if quantity and unit are provided
      if (formData.packageInfo.quantity !== undefined && 
          formData.packageInfo.quantity !== null && 
          formData.packageInfo.quantity > 0 &&
          formData.packageInfo.unit) {
        
        const packageData = {
          quantity: formData.packageInfo.quantity,
          unit: formData.packageInfo.unit,
          // Only include packSize if it has a value
          ...(formData.packageInfo.packSize ? { packSize: formData.packageInfo.packSize } : {})
        };
        
        updatedFormData.packageInfo = packageData;
        
        // Ensure totalVolume is synchronized with packageInfo
        updatedFormData.totalVolume = {
          value: formData.packageInfo.quantity,
          unit: formData.packageInfo.unit
        };
        
        console.log('Saving medication with package info and total volume:', {
          packageInfo: updatedFormData.packageInfo,
          totalVolume: updatedFormData.totalVolume
        });
      } else {
        // If incomplete packageInfo, omit it from the submission
        const { packageInfo, totalVolume, ...restFormData } = updatedFormData;
        updatedFormData = restFormData as Medication;
      }
    }
    
    onSave(updatedFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="medication-form">
      <div className="form-section">
        <h4>Basic Information</h4>
        <div className="form-group">
          <label htmlFor="name">Medication Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="doseForm">Dose Form</label>
          <select
            id="doseForm"
            name="doseForm"
            value={formData.doseForm}
            onChange={handleInputChange}
            required
            className="form-control"
          >
            <option value="">-- Select Dose Form --</option>
            {doseFormOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-section">
          <h4>Package Information</h4>
          
          <div className="form-group">
            <div className="package-info-row">
              <div className="quantity-unit-group">
                <label htmlFor="packageInfo.quantity">Total Quantity</label>
                <div className="quantity-unit-inputs">
                  <input
                    type="number"
                    id="packageInfo.quantity"
                    name="packageInfo.quantity"
                    value={formData.packageInfo?.quantity || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      setFormData(prev => {
                        // Update both packageInfo and totalVolume since they should be the same
                        const packageUpdate = {
                          ...prev,
                          packageInfo: {
                            ...(prev.packageInfo || {}),
                            quantity: value as number,
                            unit: prev.packageInfo?.unit || (prev.ingredient[0]?.strengthRatio.denominator.unit || 'mL')
                          },
                          totalVolume: {
                            value: value as number,
                            unit: prev.packageInfo?.unit || (prev.ingredient[0]?.strengthRatio.denominator.unit || 'mL')
                          }
                        };
                        return packageUpdate;
                      });
                    }}
                    step="0.01"
                    min="0"
                    className="form-control quantity-input"
                  />
                  <input
                    type="text"
                    id="packageInfo.unit"
                    name="packageInfo.unit"
                    value={formData.packageInfo?.unit || (formData.ingredient[0]?.strengthRatio.denominator.unit || '')}
                    onChange={(e) => {
                      setFormData(prev => {
                        // Update both packageInfo and totalVolume since they should be the same
                        return {
                          ...prev,
                          packageInfo: {
                            ...(prev.packageInfo || { quantity: 0 }),
                            unit: e.target.value
                          },
                          totalVolume: {
                            value: prev.packageInfo?.quantity || 0,
                            unit: e.target.value
                          }
                        };
                      });
                    }}
                    className="form-control unit-input"
                    placeholder="unit"
                  />
                </div>
              </div>
              
              <div className="pack-size-group">
                <label htmlFor="packageInfo.packSize">Pack Size</label>
                <input
                  type="number"
                  id="packageInfo.packSize"
                  name="packageInfo.packSize"
                  value={formData.packageInfo?.packSize || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="form-control"
                  placeholder="optional"
                />
              </div>
            </div>
            <small className="form-text">This information is used for both package details and total volume calculations</small>
          </div>
        </div>
        
        {formData.doseForm && availableDispenserTypes.length > 0 && (
          <div className="form-group">
            <label htmlFor="dispenserType">Dispenser Type</label>
            <select
              id="dispenserType"
              name="dispenserType"
              value={formData.dispenserInfo?.type || ''}
              onChange={(e) => handleDispenserChange(e.target.value)}
              className="form-control"
            >
              <option value="">None</option>
              {availableDispenserTypes.map(dispenserKey => (
                <option key={dispenserKey} value={dispenserKey}>
                  {dispenserTypes[dispenserKey].name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {formData.dispenserInfo && (
          <div className="dispenser-details">
            <div className="form-group">
              <label htmlFor="dispenserInfo.unit">Dispenser Unit</label>
              <input
                type="text"
                id="dispenserInfo.unit"
                name="dispenserInfo.unit"
                value={formData.dispenserInfo.unit}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dispenserInfo.pluralUnit">Plural Unit</label>
              <input
                type="text"
                id="dispenserInfo.pluralUnit"
                name="dispenserInfo.pluralUnit"
                value={formData.dispenserInfo.pluralUnit}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dispenserInfo.conversionRatio">Conversion Ratio (to mL)</label>
              <input
                type="number"
                id="dispenserInfo.conversionRatio"
                name="dispenserInfo.conversionRatio"
                value={formData.dispenserInfo.conversionRatio}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                className="form-control"
              />
              <small className="form-text">
                {formData.dispenserInfo.conversionRatio === 4 
                  ? `4 ${formData.dispenserInfo.pluralUnit} = 1 mL` 
                  : formData.dispenserInfo.conversionRatio < 1
                    ? `1 ${formData.dispenserInfo.unit} = ${(1/formData.dispenserInfo.conversionRatio).toFixed(2)} mL`
                    : `${formData.dispenserInfo.conversionRatio} ${formData.dispenserInfo.pluralUnit} = 1 mL`
                }
              </small>
            </div>
          </div>
        )}
      </div>
      
      <div className="form-section">
        <h4>Strength Information</h4>
        <div className="form-group">
          <label htmlFor="ingredient.0.name">Active Ingredient</label>
          <input
            type="text"
            id="ingredient.0.name"
            name="ingredient.0.name"
            value={formData.ingredient[0]?.name || ''}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>
        
        <div className="strength-ratio">
          <div className="form-group">
            <label htmlFor="strengthRatio.numerator.value">Strength Value</label>
            <input
              type="number"
              id="strengthRatio.numerator.value"
              name="strengthRatio.numerator.value"
              value={formData.ingredient[0]?.strengthRatio.numerator.value || 0}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="strengthRatio.numerator.unit">Strength Unit</label>
            <select
              id="strengthRatio.numerator.unit"
              name="strengthRatio.numerator.unit"
              value={formData.ingredient[0]?.strengthRatio.numerator.unit || 'mg'}
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="mg">mg</option>
              <option value="mcg">mcg</option>
              <option value="g">g</option>
              <option value="%">%</option>
              <option value="unit">unit</option>
            </select>
          </div>
          
          <div className="form-group per-label">
            <label>per</label>
          </div>
          
          <div className="form-group">
            <label htmlFor="strengthRatio.denominator.value">Denominator Value</label>
            <input
              type="number"
              id="strengthRatio.denominator.value"
              name="strengthRatio.denominator.value"
              value={formData.ingredient[0]?.strengthRatio.denominator.value || 1}
              onChange={handleInputChange}
              min="1"
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="strengthRatio.denominator.unit">Denominator Unit</label>
            <input
              type="text"
              id="strengthRatio.denominator.unit"
              name="strengthRatio.denominator.unit"
              value={formData.ingredient[0]?.strengthRatio.denominator.unit || ''}
              onChange={handleInputChange}
              required
              className="form-control"
              readOnly={formData.doseForm !== ''}
            />
          </div>
        </div>
      </div>
      
      <div className="form-section">
        <h4>Route Information</h4>
        <div className="form-group">
          <label htmlFor="allowedRoutes">Allowed Routes</label>
          <select
            id="allowedRoutes"
            name="allowedRoutes"
            value={formData.allowedRoutes || []}
            onChange={handleRouteChange}
            multiple
            required
            className="form-control"
            size={Math.min(availableRoutes.length, 5)}
          >
            {availableRoutes.map(routeKey => (
              <option key={routeKey} value={routeKey}>
                {routeKey}
              </option>
            ))}
          </select>
          <small className="form-text">Hold Ctrl/Cmd to select multiple routes</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="defaultRoute">Default Route</label>
          <select
            id="defaultRoute"
            name="defaultRoute"
            value={formData.defaultRoute || ''}
            onChange={handleInputChange}
            required
            className="form-control"
          >
            <option value="">-- Select Default Route --</option>
            {(formData.allowedRoutes || []).map(routeKey => (
              <option key={routeKey} value={routeKey}>
                {routeKey}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="form-section">
        <h4>Dosage Constraints</h4>
        <p className="form-text mb-3">
          Set minimum and maximum dose limits for this medication. These constraints will be applied when creating prescriptions.
        </p>
        
        <div className="dosage-constraints-row">
          <div className="form-group min-dose-group">
            <label htmlFor="dosageConstraints.minDose.value">Min Dose</label>
            <div className="quantity-unit-inputs">
              <input
                type="number"
                id="dosageConstraints.minDose.value"
                name="dosageConstraints.minDose.value"
                value={formData.dosageConstraints?.minDose?.value || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    dosageConstraints: {
                      ...(prev.dosageConstraints || {}),
                      minDose: {
                        value: value as number,
                        unit: prev.dosageConstraints?.minDose?.unit || 
                              prev.ingredient[0]?.strengthRatio.numerator.unit || 'mg'
                      }
                    }
                  }));
                }}
                step="0.01"
                min="0"
                className="form-control quantity-input"
              />
              <input
                type="text"
                id="dosageConstraints.minDose.unit"
                name="dosageConstraints.minDose.unit"
                value={
                  formData.dosageConstraints?.minDose?.unit || 
                  formData.ingredient[0]?.strengthRatio.numerator.unit || 'mg'
                }
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    dosageConstraints: {
                      ...(prev.dosageConstraints || {}),
                      minDose: {
                        ...(prev.dosageConstraints?.minDose || { value: 0 }),
                        unit: e.target.value
                      }
                    }
                  }));
                }}
                className="form-control unit-input"
                placeholder="unit"
              />
            </div>
          </div>
          
          <div className="form-group max-dose-group">
            <label htmlFor="dosageConstraints.maxDose.value">Max Dose</label>
            <div className="quantity-unit-inputs">
              <input
                type="number"
                id="dosageConstraints.maxDose.value"
                name="dosageConstraints.maxDose.value"
                value={formData.dosageConstraints?.maxDose?.value || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    dosageConstraints: {
                      ...(prev.dosageConstraints || {}),
                      maxDose: {
                        value: value as number,
                        unit: prev.dosageConstraints?.maxDose?.unit || 
                              prev.ingredient[0]?.strengthRatio.numerator.unit || 'mg'
                      }
                    }
                  }));
                }}
                step="0.01"
                min="0"
                className="form-control quantity-input"
              />
              <input
                type="text"
                id="dosageConstraints.maxDose.unit"
                name="dosageConstraints.maxDose.unit"
                value={
                  formData.dosageConstraints?.maxDose?.unit || 
                  formData.ingredient[0]?.strengthRatio.numerator.unit || 'mg'
                }
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    dosageConstraints: {
                      ...(prev.dosageConstraints || {}),
                      maxDose: {
                        ...(prev.dosageConstraints?.maxDose || { value: 0 }),
                        unit: e.target.value
                      }
                    }
                  }));
                }}
                className="form-control unit-input"
                placeholder="unit"
              />
            </div>
          </div>
          
          <div className="form-group step-group">
            <label htmlFor="dosageConstraints.step">Step Size</label>
            <input
              type="number"
              id="dosageConstraints.step"
              name="dosageConstraints.step"
              value={formData.dosageConstraints?.step || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  dosageConstraints: {
                    ...(prev.dosageConstraints || {}),
                    step: value as number
                  }
                }));
              }}
              step="0.01"
              min="0"
              className="form-control"
              placeholder="Increment"
            />
            <small className="form-text">Amount to increment/decrement by</small>
          </div>
        </div>
      </div>
      
      
      {/* Signature Testing Section */}
      {formData.name && formData.doseForm && formData.ingredient[0]?.strengthRatio.numerator.value > 0 && (
        <div className="form-section">
          <EmbeddedSignatureBuilder
            medication={formData}
            defaultSettings={formData.defaultSignatureSettings}
            onSaveDefaults={(settings) => {
              setFormData(prev => ({
                ...prev,
                defaultSignatureSettings: settings
              }));
            }}
          />
        </div>
      )}
      
      <div className="form-actions">
        <button type="submit" className="btn btn-success">
          {isAddMode ? 'Add Medication' : 'Update Medication'}
        </button>
      </div>
      
      <style>
        {`
          .medication-form {
            max-width: 100%;
          }
          .form-section {
            margin-bottom: 1.5rem;
            padding: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-control {
            display: block;
            width: 100%;
            padding: 0.375rem 0.75rem;
            font-size: 1rem;
            line-height: 1.5;
            color: #495057;
            background-color: #fff;
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
          }
          .form-text {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.875rem;
            color: #6c757d;
          }
          .package-info-row {
            display: flex;
            gap: 1.5rem;
            align-items: flex-start;
          }
          .quantity-unit-group {
            flex: 3;
          }
          .pack-size-group {
            flex: 1;
            min-width: 120px;
          }
          .quantity-unit-inputs {
            display: flex;
            gap: 0.5rem;
          }
          .quantity-input {
            flex: 2;
          }
          .unit-input {
            flex: 1;
            min-width: 80px;
          }
          .strength-ratio {
            display: grid;
            grid-template-columns: 1fr 1fr 50px 1fr 1fr;
            gap: 0.5rem;
            align-items: end;
          }
          .per-label {
            text-align: center;
          }
          .per-label label {
            margin-bottom: 0.5rem;
          }
          .form-actions {
            margin-top: 1rem;
          }
          .btn {
            padding: 0.375rem 0.75rem;
            border-radius: 0.25rem;
            border: 1px solid transparent;
            cursor: pointer;
          }
          .btn-success {
            background-color: #28a745;
            color: white;
          }
          .dispenser-details {
            margin-top: 1rem;
            padding: 0.5rem;
            background-color: #f8f9fa;
            border-radius: 4px;
          }
          
          
          /* Dosage Constraints Styles */
          .dosage-constraints-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .min-dose-group, .max-dose-group {
            display: flex;
            flex-direction: column;
          }

          .step-group {
            display: flex;
            flex-direction: column;
          }

          @media (max-width: 768px) {
            .dosage-constraints-row {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
          }
        `}
      </style>
    </form>
  );
};

export default MedicationForm;
