import React, { useState, useEffect } from 'react';
import { Medication } from '../types/index';
import { medicationsAPI } from '../api/medications';
import defaultMedications from '../data/medications.json';
import { v4 as uuidv4 } from 'uuid';
import { doseForms, doseFormOptions, dispenserTypes, dispenserOptions, routes, routeOptions, frequencies, frequencyOptions } from '../constants/medication-data';
import SignatureBuilder from './SignatureBuilder';
import SignatureResult from './SignatureResult';
import { generateSignature, DoseInput } from '../lib/signature';

type ViewMode = 'list' | 'form' | 'signature';

interface MedicationManagerProps {
  onMedicationSelect?: (medication: Medication) => void;
}

// Default medication template - moved outside component to prevent recreating on each render
const createDefaultMedication = (): Medication => ({
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
});

const MedicationManager: React.FC<MedicationManagerProps> = ({ onMedicationSelect }) => {
  // State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isAddMode, setIsAddMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'doseForm' | 'strength'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state

  const [formData, setFormData] = useState<Medication>(createDefaultMedication());
  const [availableDispenserTypes, setAvailableDispenserTypes] = useState<string[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);
  
  // Signature builder state
  const [dosage, setDosage] = useState<DoseInput>({ value: 0, unit: 'mg' });
  const [route, setRoute] = useState('');
  const [frequency, setFrequency] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [signature, setSignature] = useState<{ humanReadable: string; fhirRepresentation: any } | null>(null);
  const [sigErrors, setSigErrors] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);


  // Generate signature when inputs change for form mode
  useEffect(() => {
    if (!formData.id || isAddMode || viewMode !== 'form') return;
    if (!dosage.value || !route || !frequency) {
      setSignature(null);
      return;
    }

    try {
      const result = generateSignature(
        formData,
        dosage,
        route,
        frequency,
        specialInstructions
      );
      setSignature(result);
    } catch (error) {
      console.error('Error generating signature:', error);
      setSignature(null);
    }
  }, [formData, dosage, route, frequency, specialInstructions, isAddMode, viewMode]);

  // Load medications on mount
  useEffect(() => {
    let mounted = true;
    
    const fetchMedications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const meds = await medicationsAPI.getAll();
        
        if (!mounted) return;
        
        if (meds.length === 0) {
          // Initialize with default medications
          try {
            await medicationsAPI.initializeDatabase(defaultMedications as Medication[]);
            const initializedMeds = await medicationsAPI.getAll();
            
            if (mounted) {
              setMedications(initializedMeds);
            }
          } catch (initError) {
            console.error('Error initializing medications:', initError);
            if (mounted) {
              setError('Failed to initialize medications database');
            }
          }
        } else {
          setMedications(meds);
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        if (mounted) {
          setError('Failed to load medications. Using local data.');
          // Use default medications as fallback
          setMedications(defaultMedications as Medication[]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchMedications();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Update form when selectedMedication changes
  useEffect(() => {
    if (selectedMedication) {
      setFormData(selectedMedication);
    } else {
      setFormData(createDefaultMedication());
    }
  }, [selectedMedication]);

  // Update available dispenser types and routes when dose form changes
  useEffect(() => {
    if (formData.doseForm) {
      // Filter dispenser types
      const availableDispensers = Object.keys(dispenserTypes).filter(
        dispenserKey => dispenserTypes[dispenserKey].applicableDoseForms.includes(formData.doseForm)
      );
      setAvailableDispenserTypes(availableDispensers);

      // Filter routes
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
          ingredient: (prev.ingredient || []).map(ing => ({
            ...ing,
            strengthRatio: {
              ...(ing.strengthRatio || { numerator: { value: 0, unit: 'mg' }, denominator: { value: 1, unit: '' } }),
              denominator: {
                ...(ing.strengthRatio?.denominator || { value: 1, unit: '' }),
                unit: formData.doseForm === 'Cream' || formData.doseForm === 'Solution' ? 'mL' : doseForms[formData.doseForm].defaultUnit
              }
            }
          }))
        }));
      }
    }
  }, [formData.doseForm]);


  // Handlers
  const handleAddNew = () => {
    setSelectedMedication(null);
    setIsAddMode(true);
    setViewMode('form');
  };

  const handleEdit = (medication: Medication) => {
    setSelectedMedication(medication);
    setFormData(medication);
    setIsAddMode(false);
    setViewMode('form');
    
    // Initialize signature builder state
    
    // Set default route
    const defaultRoute = medication.defaultRoute || 
      (medication.allowedRoutes && medication.allowedRoutes.length > 0 ? medication.allowedRoutes[0] : '');
    setRoute(defaultRoute);
    
    // Set appropriate default unit based on dosage form
    let defaultUnit = 'mg';
    if (medication.doseForm === 'Vial' || medication.doseForm === 'Solution') {
      defaultUnit = 'mL';
    } else if (['Tablet', 'Capsule', 'Patch', 'ODT'].includes(medication.doseForm)) {
      defaultUnit = medication.doseForm.toLowerCase();
    }
    
    // Set default dosage
    if (medication.commonDosages && medication.commonDosages.length > 0) {
      setDosage({
        value: medication.commonDosages[0].value,
        unit: medication.commonDosages[0].unit
      });
    } else if (medication.defaultSignatureSettings?.dosage) {
      setDosage(medication.defaultSignatureSettings.dosage);
    } else {
      setDosage({ value: 0, unit: defaultUnit });
    }
    
    // Set default frequency if available
    if (medication.defaultSignatureSettings?.frequency) {
      setFrequency(medication.defaultSignatureSettings.frequency);
    } else {
      setFrequency('');
    }
    
    // Clear signature and errors
    setSignature(null);
    setSigErrors({});
    setSpecialInstructions('');
    setShowResult(false);
  };


  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }
    
    try {
      setError(null);
      await medicationsAPI.delete(id);
      setMedications(medications.filter(med => med.id !== id));
    } catch (err) {
      console.error('Error deleting medication:', err);
      setError('Failed to delete medication');
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // Format the medication data
      let updatedFormData = {
        ...formData,
        code: {
          coding: [{ display: `${formData.name} ${formData.doseForm}` }]
        }
      };
      
      // Format packageInfo
      if (formData.packageInfo) {
        if (formData.packageInfo.quantity !== undefined && 
            formData.packageInfo.quantity !== null && 
            formData.packageInfo.quantity > 0 &&
            formData.packageInfo.unit) {
          
          const packageData = {
            quantity: formData.packageInfo.quantity,
            unit: formData.packageInfo.unit,
            ...(formData.packageInfo.packSize ? { packSize: formData.packageInfo.packSize } : {})
          };
          
          updatedFormData.packageInfo = packageData;
          
          // Ensure totalVolume is synchronized
          updatedFormData.totalVolume = {
            value: formData.packageInfo.quantity,
            unit: formData.packageInfo.unit
          };
        } else {
          // If incomplete packageInfo, omit it
          const { packageInfo, totalVolume, ...restFormData } = updatedFormData;
          updatedFormData = restFormData as Medication;
        }
      }
      
      let savedMedication: Medication;
      if (isAddMode) {
        savedMedication = await medicationsAPI.create(updatedFormData);
        setMedications([...medications, savedMedication]);
      } else {
        savedMedication = await medicationsAPI.update(updatedFormData.id, updatedFormData);
        setMedications(medications.map(med => 
          med.id === savedMedication.id ? savedMedication : med
        ));
      }
      
      setViewMode('list');
      setSelectedMedication(null);
    } catch (err) {
      console.error('Error saving medication:', err);
      setError('Failed to save medication');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts[0] === 'ingredient' && parts.length === 3) {
        const field = parts[2];
        setFormData(prev => ({
          ...prev,
          ingredient: (prev.ingredient || []).map((ing, i) => 
            i === 0 ? { ...ing, [field]: value } : ing
          )
        }));
      } else if (parts[0] === 'strengthRatio' && parts.length === 3) {
        const section = parts[1];
        const field = parts[2];
        setFormData(prev => ({
          ...prev,
          ingredient: (prev.ingredient || []).map((ing, i) => 
            i === 0 ? { 
              ...ing, 
              strengthRatio: {
                ...(ing.strengthRatio || { numerator: { value: 0, unit: 'mg' }, denominator: { value: 1, unit: '' } }),
                [section]: {
                  ...(ing.strengthRatio?.[section as keyof typeof ing.strengthRatio] || {}),
                  [field]: field === 'value' ? parseFloat(value) : value
                }
              }
            } : ing
          )
        }));
      } else if (parts[0] === 'packageInfo') {
        const field = parts[1];
        if (field === 'quantity' || field === 'packSize') {
          const numValue = value === '' ? undefined : parseFloat(value);
          setFormData(prev => ({
            ...prev,
            packageInfo: {
              ...(prev.packageInfo || { quantity: 0, unit: '' }),
              [field]: numValue
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            packageInfo: {
              ...(prev.packageInfo || { quantity: 0, unit: '' }),
              [field]: value
            }
          }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setFormData(prev => ({
      ...prev,
      allowedRoutes: selected,
      defaultRoute: selected[0] || ''
    }));
  };

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
      const { dispenserInfo, ...rest } = formData;
      setFormData(rest as Medication);
    }
  };

  // Utility functions
  const formatStrength = (medication: Medication): string => {
    if (!medication.ingredient[0]?.strengthRatio) return 'N/A';
    const { numerator, denominator } = medication.ingredient[0].strengthRatio;
    return `${numerator.value}${numerator.unit}/${denominator.value}${denominator.unit}`;
  };

  const filteredMedications = medications
    .filter(med => 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.doseForm.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'doseForm') {
        compareValue = a.doseForm.localeCompare(b.doseForm);
      } else if (sortBy === 'strength') {
        compareValue = formatStrength(a).localeCompare(formatStrength(b));
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const handleSort = (field: 'name' | 'doseForm' | 'strength') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Render form view
  if (viewMode === 'form') {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px 8px 0 0',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <button 
            onClick={() => setViewMode('list')} 
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <i className="bi bi-arrow-left"></i> Back to List
          </button>
          <h3 style={{
            color: 'white',
            fontWeight: '600',
            margin: '0',
            fontSize: '1.25rem',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>{isAddMode ? 'Add New Medication' : 'Edit Medication'}</h3>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSave(); }} 
          style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Basic Information */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '3px',
              height: '100%',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
            }}></div>
            
            <h4 style={{
              color: '#2d3748',
              fontWeight: '600',
              marginBottom: '1.25rem',
              paddingBottom: '0.5rem',
              fontSize: '1rem',
              position: 'relative'
            }}>
              Basic Information
              <div style={{
                position: 'absolute',
                left: '0',
                bottom: '-2px',
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: '1px'
              }}></div>
            </h4>
            
            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4a5568',
                fontWeight: '500',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
                position: 'relative',
                paddingLeft: '0.75rem'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '-0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '2px',
                  height: '12px',
                  background: 'linear-gradient(180deg, #667eea, #764ba2)',
                  borderRadius: '1px'
                }}></div>
                Medication Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  color: '#2d3748',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4a5568',
                fontWeight: '500',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
                position: 'relative',
                paddingLeft: '0.75rem'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '-0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '2px',
                  height: '12px',
                  background: 'linear-gradient(180deg, #667eea, #764ba2)',
                  borderRadius: '1px'
                }}></div>
                Dose Form
              </label>
              <select
                id="doseForm"
                name="doseForm"
                value={formData.doseForm}
                onChange={handleInputChange}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  color: '#2d3748',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Select Dose Form --</option>
                {doseFormOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Package Information */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '3px',
              height: '100%',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
            }}></div>
            
            <h4 style={{
              color: '#2d3748',
              fontWeight: '600',
              marginBottom: '1.25rem',
              paddingBottom: '0.5rem',
              fontSize: '1rem',
              position: 'relative'
            }}>
              Package Information
              <div style={{
                position: 'absolute',
                left: '0',
                bottom: '-2px',
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: '1px'
              }}></div>
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25px'
                }}>Total Quantity</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '0.5rem'
                }}>
                  <input
                    type="number"
                    id="packageInfo.quantity"
                    name="packageInfo.quantity"
                    value={formData.packageInfo?.quantity || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      color: '#2d3748',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  />
                  <input
                    type="text"
                    id="packageInfo.unit"
                    name="packageInfo.unit"
                    value={formData.packageInfo?.unit || (formData.ingredient?.[0]?.strengthRatio?.denominator?.unit || '')}
                    onChange={handleInputChange}
                    placeholder="unit"
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      color: '#2d3748',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25px'
                }}>Pack Size</label>
                <input
                  type="number"
                  id="packageInfo.packSize"
                  name="packageInfo.packSize"
                  value={formData.packageInfo?.packSize || ''}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="optional"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dispenser Type */}
          {formData.doseForm && availableDispenserTypes.length > 0 && (
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: '3px',
                height: '100%',
                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
              }}></div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25px'
                }}>Dispenser Type</label>
                <select
                  id="dispenserType"
                  name="dispenserType"
                  value={formData.dispenserInfo?.type || ''}
                  onChange={(e) => handleDispenserChange(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.4',
                    color: '#2d3748',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">None</option>
                  {availableDispenserTypes.map(dispenserKey => (
                    <option key={dispenserKey} value={dispenserKey}>
                      {dispenserTypes[dispenserKey].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Strength Information */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
            }}></div>
            
            <h4 style={{
              color: '#2d3748',
              fontWeight: '600',
              marginBottom: '1.25rem',
              paddingBottom: '0.5rem',
              fontSize: '1rem',
              position: 'relative'
            }}>
              Strength Information
              <div style={{
                position: 'absolute',
                left: '0',
                bottom: '-2px',
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: '1px'
              }}></div>
            </h4>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4a5568',
                fontWeight: '500',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.25px'
              }}>Active Ingredient</label>
              <input
                type="text"
                id="ingredient.0.name"
                name="ingredient.0.name"
                value={formData.ingredient?.[0]?.name || ''}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  color: '#2d3748',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto 1fr 1fr',
              gap: '0.5rem',
              alignItems: 'end',
              padding: '0.75rem',
              background: '#f7fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>Strength Value</label>
                <input
                  type="number"
                  id="strengthRatio.numerator.value"
                  name="strengthRatio.numerator.value"
                  value={formData.ingredient?.[0]?.strengthRatio?.numerator?.value || 0}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>Unit</label>
                <select
                  id="strengthRatio.numerator.unit"
                  name="strengthRatio.numerator.unit"
                  value={formData.ingredient?.[0]?.strengthRatio?.numerator?.unit || 'mg'}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px'
                  }}
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="g">g</option>
                  <option value="%">%</option>
                  <option value="unit">unit</option>
                </select>
              </div>
              
              <div style={{
                textAlign: 'center',
                paddingBottom: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#667eea'
              }}>
                per
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>Denominator</label>
                <input
                  type="number"
                  id="strengthRatio.denominator.value"
                  name="strengthRatio.denominator.value"
                  value={formData.ingredient?.[0]?.strengthRatio?.denominator?.value || 1}
                  onChange={handleInputChange}
                  min="1"
                  required
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>Unit</label>
                <input
                  type="text"
                  id="strengthRatio.denominator.unit"
                  name="strengthRatio.denominator.unit"
                  value={formData.ingredient?.[0]?.strengthRatio?.denominator?.unit || ""}
                  onChange={handleInputChange}
                  required
                  readOnly={formData.doseForm !== ''}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    background: formData.doseForm !== '' ? '#f7fafc' : 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
            }}></div>
            
            <h4 style={{
              color: '#2d3748',
              fontWeight: '600',
              marginBottom: '1.25rem',
              paddingBottom: '0.5rem',
              fontSize: '1rem',
              position: 'relative'
            }}>
              Route Information
              <div style={{
                position: 'absolute',
                left: '0',
                bottom: '-2px',
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: '1px'
              }}></div>
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25px'
                }}>Allowed Routes</label>
                <select
                  id="allowedRoutes"
                  name="allowedRoutes"
                  value={formData.allowedRoutes || []}
                  onChange={handleRouteChange}
                  multiple
                  required
                  size={Math.min(availableRoutes.length, 5)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                >
                  {availableRoutes.map(routeKey => (
                    <option key={routeKey} value={routeKey}>
                      {routeKey}
                    </option>
                  ))}
                </select>
                <small style={{
                  display: 'block',
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#6c757d'
                }}>Hold Ctrl/Cmd to select multiple routes</small>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4a5568',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25px'
                }}>Default Route</label>
                <select
                  id="defaultRoute"
                  name="defaultRoute"
                  value={formData.defaultRoute || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
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
          </div>

          {/* Gender Eligibility */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '3px',
              height: '100%',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
            }}></div>
            
            <h4 style={{
              color: '#2d3748',
              fontWeight: '600',
              marginBottom: '1.25rem',
              paddingBottom: '0.5rem',
              fontSize: '1rem',
              position: 'relative'
            }}>
              Gender Eligibility
              <div style={{
                position: 'absolute',
                left: '0',
                bottom: '-2px',
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: '1px'
              }}></div>
            </h4>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4a5568',
                fontWeight: '500',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.25px'
              }}>Eligible Genders</label>
              <select
                id="eligibleGenders"
                name="eligibleGenders"
                value={formData.eligibleGenders || []}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, eligibleGenders: selectedOptions as any[] });
                }}
                multiple
                size={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#2d3748',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <small style={{
                display: 'block',
                marginTop: '0.25rem',
                fontSize: '0.75rem',
                color: '#6c757d'
              }}>Hold Ctrl/Cmd to select multiple. Leave empty for no gender restrictions.</small>
            </div>
          </div>

          {/* Signature Builder Section - Only show when editing */}
          {!isAddMode && formData.id && (
            <div className="form-section">
              <h4>Signature Builder</h4>
              <div className="row">
                <div className={showResult && signature ? 'col-lg-6' : 'col-12'}>
                  <SignatureBuilder 
                    selectedMedication={formData}
                    dosage={dosage}
                    route={route}
                    frequency={frequency}
                    specialInstructions={specialInstructions}
                    errors={sigErrors}
                    signature={signature}
                    onMedicationSelect={(med) => setFormData(med)}
                    onDosageChange={setDosage}
                    onRouteChange={setRoute}
                    onFrequencyChange={setFrequency}
                    onSpecialInstructionsChange={setSpecialInstructions}
                    onErrorsChange={setSigErrors}
                  />
                </div>
                {showResult && signature && (
                  <div className="col-lg-6">
                    <SignatureResult 
                      selectedMedication={formData}
                      dosage={dosage}
                      route={route}
                      frequency={frequency}
                      specialInstructions={specialInstructions}
                      signature={signature}
                      onReset={() => {
                        setDosage({ value: 0, unit: 'mg' });
                        setRoute('');
                        setFrequency('');
                        setSpecialInstructions('');
                        setSignature(null);
                        setSigErrors({});
                        setShowResult(false);
                      }}
                    />
                  </div>
                )}
                {!showResult && signature && (
                  <div className="text-center mt-3">
                    <button 
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowResult(true)}
                    >
                      <i className="bi bi-eye"></i> View Generated Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{
            padding: '1rem',
            background: '#f7fafc',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            borderRadius: '0 0 8px 8px'
          }}>
            <button 
              type="submit" 
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '6px',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
                position: 'relative',
                overflow: 'hidden',
                color: '#fff',
                background: '#48bb78',
                boxShadow: '0 2px 4px rgba(72, 187, 120, 0.2)'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.background = '#38a169';
                target.style.transform = 'translateY(-1px)';
                target.style.boxShadow = '0 4px 8px rgba(72, 187, 120, 0.3)';
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.background = '#48bb78';
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 2px 4px rgba(72, 187, 120, 0.2)';
              }}
            >
              {isAddMode ? 'Add Medication' : 'Update Medication'}
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('list')} 
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
                position: 'relative',
                overflow: 'hidden',
                color: '#4a5568',
                background: '#ffffff',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.color = '#2d3748';
                target.style.background = '#f7fafc';
                target.style.borderColor = '#cbd5e0';
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.color = '#4a5568';
                target.style.background = '#ffffff';
                target.style.borderColor = '#e2e8f0';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      </div>
    );
  }


  // Render list view
  return (
    <div className="medication-manager">
      <div className="manager-header">
        <h2>Medication Management</h2>
        <button onClick={handleAddNew} className="btn btn-primary">
          <i className="bi bi-plus-circle"></i> Add New Medication
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          {error}
          <button 
            className="btn-close float-end" 
            onClick={() => setError(null)} 
            aria-label="Close"
          />
        </div>
      )}

      <div className="controls mb-3">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search medications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <div>Loading medications...</div>
        </div>
      ) : filteredMedications.length === 0 ? (
        <div className="empty-state">
          <p>{searchTerm ? 'No medications found matching your search.' : 'No medications found. Add your first medication using the button above.'}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>
                  Name {sortBy === 'name' && <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th className="sortable" onClick={() => handleSort('doseForm')}>
                  Dose Form {sortBy === 'doseForm' && <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th className="sortable" onClick={() => handleSort('strength')}>
                  Strength {sortBy === 'strength' && <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th>Package Size</th>
                <th>Gender</th>
                <th>Routes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedications.map(medication => (
                <React.Fragment key={medication.id}>
                  <tr>
                    <td>{medication.name}</td>
                    <td>{medication.doseForm}</td>
                    <td>{formatStrength(medication)}</td>
                    <td>
                      {medication.packageInfo ? 
                        `${medication.packageInfo.quantity} ${medication.packageInfo.unit}` : 
                        'N/A'}
                    </td>
                    <td>
                      {medication.eligibleGenders && medication.eligibleGenders.length > 0 ? (
                        <div className="d-flex gap-1">
                          {medication.eligibleGenders.map(gender => (
                            <span 
                              key={gender}
                              className={`badge gender-${gender.toLowerCase()}`}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              {gender === 'MALE' ? '♂' : gender === 'FEMALE' ? '♀' : '⚥'} {gender}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">All</span>
                      )}
                    </td>
                    <td>
                      {(medication.allowedRoutes?.length) ? 
                        medication.allowedRoutes.join(', ') : 
                        'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${medication.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {medication.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleEdit(medication)}
                          className="btn btn-sm btn-outline-primary"
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(medication.id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .medication-manager {
          padding: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          position: relative;
        }

        .medication-manager::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .manager-header h2 {
          color: #343a40;
          font-weight: 600;
          margin: 0;
        }

        .controls {
          margin-bottom: 1.5rem;
        }

        .search-input {
          max-width: 350px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 1rem;
        }

        .search-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }

        .table-responsive {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table {
          margin-bottom: 0;
        }

        .table thead th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          color: #495057;
          font-weight: 600;
          padding: 1rem;
          border-top: none;
        }

        .table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border-top: 1px solid #dee2e6;
        }

        .table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.15s ease;
        }

        .sortable:hover {
          background-color: #e9ecef !important;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .btn-outline-primary {
          color: #0d6efd;
          border: 1.5px solid #0d6efd;
          background-color: transparent;
        }

        .btn-outline-primary:hover {
          color: #fff;
          background-color: #0d6efd;
          border-color: #0d6efd;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(13, 110, 253, 0.3);
        }

        .btn-outline-danger {
          color: #dc3545;
          border: 1.5px solid #dc3545;
          background-color: transparent;
        }

        .btn-outline-danger:hover {
          color: #fff;
          background-color: #dc3545;
          border-color: #dc3545;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
        }

        .badge {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
        }

        .bg-success {
          background-color: #28a745 !important;
          color: white;
        }

        .bg-secondary {
          background-color: #6c757d !important;
          color: white;
        }

        /* Gender badges */
        .gender-male {
          background-color: #3498db !important;
          color: white;
        }

        .gender-female {
          background-color: #e91e63 !important;
          color: white;
        }

        .gender-other {
          background-color: #9c27b0 !important;
          color: white;
        }

        .d-flex {
          display: flex;
        }

        .gap-1 {
          gap: 0.25rem;
        }

        .gap-2 {
          gap: 0.5rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: #6c757d;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .spinner {
          width: 3rem;
          height: 3rem;
          border: 0.3rem solid rgba(13, 110, 253, 0.1);
          border-right-color: #0d6efd;
          border-radius: 50%;
          animation: spinner 1s linear infinite;
          margin-bottom: 1.5rem;
        }

        @keyframes spinner {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: #6c757d;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .alert {
          border-radius: 8px;
          border: none;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
        }

        .alert-danger {
          color: #721c24;
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
        }

        /* Ultra-Modern Form Styling */
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding: 2rem 2rem 1.5rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px 16px 0 0;
          color: white;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .form-header h3 {
          color: white;
          font-weight: 700;
          margin: 0;
          font-size: 1.8rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .medication-form {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(20px);
        }

        .form-section {
          margin-bottom: 0;
          padding: 2.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          position: relative;
        }

        .form-section::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .form-section h4 {
          color: #2d3748;
          font-weight: 700;
          margin-bottom: 2rem;
          padding-bottom: 0.75rem;
          border-bottom: 3px solid transparent;
          background: linear-gradient(90deg, #f7fafc, #f7fafc) padding-box,
                      linear-gradient(90deg, #667eea, #764ba2) border-box;
          border-image: linear-gradient(90deg, #667eea, #764ba2) 1;
          font-size: 1.3rem;
          position: relative;
        }

        .form-section h4::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -3px;
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
        }

        .form-group {
          margin-bottom: 2rem;
          position: relative;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.75rem;
          color: #4a5568;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
        }

        .form-group label::before {
          content: '';
          position: absolute;
          left: -1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 16px;
          background: linear-gradient(180deg, #667eea, #764ba2);
          border-radius: 2px;
        }

        .form-control {
          display: block;
          width: 100%;
          padding: 1rem 1.25rem;
          font-size: 1rem;
          line-height: 1.6;
          color: #2d3748;
          background: linear-gradient(145deg, #ffffff, #f7fafc);
          border: 2px solid transparent;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .form-control:focus {
          border-color: transparent;
          background: linear-gradient(145deg, #ffffff, #f7fafc);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1),
                      0 8px 25px rgba(102, 126, 234, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          outline: none;
          transform: translateY(-1px);
        }

        .form-control:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .form-text {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .package-info-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          align-items: flex-start;
        }

        .quantity-unit-group {
          position: relative;
        }

        .pack-size-group {
          position: relative;
        }

        .quantity-unit-inputs {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
          align-items: end;
        }

        .quantity-input {
          position: relative;
        }

        .unit-input {
          position: relative;
        }

        .strength-ratio {
          display: grid;
          grid-template-columns: 1fr 1fr auto 1fr 1fr;
          gap: 1rem;
          align-items: end;
          padding: 1.5rem;
          background: linear-gradient(145deg, #f7fafc, #edf2f7);
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .per-label {
          text-align: center;
        }

        .per-label label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #6c757d;
        }

        .form-actions {
          margin-top: 0;
          padding: 2.5rem;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          display: flex;
          gap: 1.25rem;
          justify-content: flex-end;
          border-radius: 0 0 16px 16px;
        }

        .btn {
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn:hover::before {
          left: 100%;
        }

        .btn-success {
          color: #fff;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
        }

        .btn-success:hover {
          background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
        }

        .btn-secondary {
          color: #4a5568;
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(74, 85, 104, 0.1);
        }

        .btn-secondary:hover {
          color: #2d3748;
          background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(74, 85, 104, 0.2);
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          margin: -0.75rem;
        }

        .col-12 {
          flex: 0 0 100%;
          padding: 0.75rem;
        }

        .col-lg-6 {
          flex: 0 0 50%;
          padding: 0.75rem;
        }

        .text-center {
          text-align: center;
        }

        .mt-3 {
          margin-top: 1rem;
        }

        .btn-primary {
          color: #fff;
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
        }
      `}</style>
    </div>
  );
};

export default MedicationManager;