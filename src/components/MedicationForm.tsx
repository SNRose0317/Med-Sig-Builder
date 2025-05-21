import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import doseForms, { doseFormOptions } from '../tables/doseForms';
import dispenserTypes, { dispenserOptions } from '../tables/dispensers';
import routes, { routeOptions } from '../tables/routes';
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
    
    // Update the display name to include the dose form
    const updatedFormData = {
      ...formData,
      code: {
        coding: [{ display: `${formData.name} ${formData.doseForm}` }]
      }
    };
    
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
        `}
      </style>
    </form>
  );
};

export default MedicationForm;
