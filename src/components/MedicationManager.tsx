import React, { useState, useEffect } from 'react';
import { Medication } from '../types/index';
import { v4 as uuidv4 } from 'uuid';
import { useMedications } from '../hooks/useMedications';
import { MedicationTable } from './MedicationTable';
import { MedicationControls, PaginationControls } from './MedicationControls';
import { FormSection, FormField } from './ui/form-components';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Save, Trash2, ChevronLeft, X } from 'lucide-react';
import { doseForms, doseFormOptions, dispenserTypes, dispenserOptions, routes } from '../constants/medication-data';
import SignatureBuilder from './SignatureBuilder';
import { DoseInput, getStrengthMode } from '../lib/signature';

type ViewMode = 'list' | 'form';

interface MedicationManagerProps {
  onMedicationSelect?: (medication: Medication) => void;
}

// Default medication template
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

const MedicationManager: React.FC<MedicationManagerProps> = () => {
  // Use the new hook
  const {
    medications,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePagination,
    refetch,
    addMedication,
    updateMedication,
    deleteMedication,
  } = useMedications();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isAddMode, setIsAddMode] = useState(true);
  const [formData, setFormData] = useState<Medication>(createDefaultMedication());
  const [availableDispenserTypes, setAvailableDispenserTypes] = useState<string[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Signature builder state for embedded mode
  const [dosage, setDosage] = useState<DoseInput>({ value: 0, unit: 'mg' });
  const [route, setRoute] = useState('');
  const [frequency, setFrequency] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when selectedMedication changes
  useEffect(() => {
    if (selectedMedication) {
      setFormData(selectedMedication);
      // Initialize signature builder state
      const defaultRoute = selectedMedication.defaultRoute || 
        (selectedMedication.allowedRoutes && selectedMedication.allowedRoutes.length > 0 ? selectedMedication.allowedRoutes[0] : '');
      setRoute(defaultRoute);
      
      // Set appropriate default unit based on dosage form
      let defaultUnit = 'mg';
      if (selectedMedication.doseForm === 'Vial' || selectedMedication.doseForm === 'Solution') {
        defaultUnit = 'mL';
      } else if (['Tablet', 'Capsule', 'Patch', 'ODT'].includes(selectedMedication.doseForm)) {
        defaultUnit = selectedMedication.doseForm.toLowerCase();
      }
      
      setDosage({ value: 0, unit: defaultUnit });
      setFrequency('');
      setSpecialInstructions('');
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
  }, [formData.doseForm, formData.defaultRoute]);

  // Handlers
  const handleAddNew = () => {
    setSelectedMedication(null);
    setFormData(createDefaultMedication());
    setIsAddMode(true);
    setViewMode('form');
  };

  const handleEdit = (medication: Medication) => {
    setSelectedMedication(medication);
    setIsAddMode(false);
    setViewMode('form');
  };

  const handleDelete = async () => {
    if (!selectedMedication || !window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }
    
    try {
      await deleteMedication(selectedMedication.id);
      setViewMode('list');
      setSelectedMedication(null);
    } catch (err) {
      console.error('Error deleting medication:', err);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Format the medication data
      const updatedFormData = {
        ...formData,
        code: {
          coding: [{ display: `${formData.name} ${formData.doseForm}` }]
        }
      };
      
      if (isAddMode) {
        await addMedication(updatedFormData);
      } else {
        await updateMedication(updatedFormData);
      }
      
      setViewMode('list');
      setSelectedMedication(null);
    } catch (err) {
      console.error('Error saving medication:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedMedication(null);
  };

  // Gender eligibility handling
  const handleGenderChange = (gender: 'MALE' | 'FEMALE' | 'OTHER', checked: boolean) => {
    setFormData(prev => {
      const currentGenders = prev.eligibleGenders || [];
      if (checked) {
        if (!currentGenders.includes(gender)) {
          return { ...prev, eligibleGenders: [...currentGenders, gender] };
        }
      } else {
        return { ...prev, eligibleGenders: currentGenders.filter(g => g !== gender) };
      }
      return prev;
    });
  };

  // Multi-ingredient handling
  const handleIngredientChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newIngredients = [...(prev.ingredient || [])];
      if (field === 'name') {
        newIngredients[index] = { ...newIngredients[index], name: value as string };
      } else if (field.startsWith('strength')) {
        const parts = field.split('.');
        if (parts[1] === 'numerator') {
          newIngredients[index] = {
            ...newIngredients[index],
            strengthRatio: {
              ...newIngredients[index].strengthRatio,
              numerator: {
                ...newIngredients[index].strengthRatio.numerator,
                [parts[2]]: parts[2] === 'value' ? value as number : value as string
              }
            }
          };
        } else if (parts[1] === 'denominator') {
          newIngredients[index] = {
            ...newIngredients[index],
            strengthRatio: {
              ...newIngredients[index].strengthRatio,
              denominator: {
                ...newIngredients[index].strengthRatio.denominator,
                [parts[2]]: parts[2] === 'value' ? value as number : value as string
              }
            }
          };
        }
      }
      return { ...prev, ingredient: newIngredients };
    });
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredient: [
        ...(prev.ingredient || []),
        {
          name: '',
          strengthRatio: {
            numerator: { value: 0, unit: 'mg' },
            denominator: { value: 1, unit: prev.ingredient?.[0]?.strengthRatio?.denominator?.unit || '' }
          }
        }
      ]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredient: prev.ingredient?.filter((_, i) => i !== index) || []
    }));
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive-foreground px-6 py-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">�</span>
              <div>
                <p className="font-semibold">Error loading medications</p>
                <p className="text-sm text-destructive-foreground/80">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="mt-3 border-destructive text-destructive-foreground hover:bg-destructive/20 bg-transparent"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Controls */}
        <MedicationControls
          filters={filters}
          pagination={pagination}
          onFiltersChange={updateFilters}
          onPaginationChange={updatePagination}
          onAddNew={handleAddNew}
        />

        {/* Table */}
        <MedicationTable 
          medications={medications}
          loading={loading}
          onMedicationClick={handleEdit}
        />

        {/* Pagination */}
        <PaginationControls 
          pagination={pagination} 
          onPaginationChange={updatePagination} 
        />
      </div>
    );
  }

  // Form View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ChevronLeft className="w-4 h-4" />
            <button onClick={handleCancel} className="hover:underline">
              Back to Inventory
            </button>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            {isAddMode ? 'Add New Medication' : 'Edit Medication'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {!isAddMode && (
            <Button
              variant="destructive"
              size="lg"
              onClick={handleDelete}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving || !formData.name || !formData.doseForm}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* General Information */}
        <FormSection title="General Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-3">
              <FormField label="Name">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-input border-input text-foreground"
                  placeholder="Enter medication name"
                />
              </FormField>
            </div>
            <FormField label="Type">
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="bg-input border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="supplement">Supplement</SelectItem>
                  <SelectItem value="compound">Compound</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Dose Form">
              <Select value={formData.doseForm} onValueChange={(value) => setFormData({ ...formData, doseForm: value })}>
                <SelectTrigger className="bg-input border-input text-foreground">
                  <SelectValue placeholder="Select dose form" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {doseFormOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="col-span-3 flex items-center gap-6">
              <FormField label="Is Active">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </FormField>
            </div>
            <div className="col-span-3">
              <FormField label="Eligible Genders">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.eligibleGenders?.includes('MALE') || false}
                      onChange={(e) => handleGenderChange('MALE', e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-secondary-foreground">Male</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.eligibleGenders?.includes('FEMALE') || false}
                      onChange={(e) => handleGenderChange('FEMALE', e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-secondary-foreground">Female</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.eligibleGenders?.includes('OTHER') || false}
                      onChange={(e) => handleGenderChange('OTHER', e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-secondary-foreground">Other</span>
                  </label>
                </div>
              </FormField>
            </div>
          </div>
        </FormSection>

        {/* Ingredient & Strength */}
        <FormSection 
          title="Ingredient & Strength"
          description="Define active ingredients and their strength ratios"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FormField 
                label="Strength Mode"
                description="How ingredient strength is calculated"
              >
                <Select 
                  value={getStrengthMode(formData.doseForm)} 
                  onValueChange={() => {
                    // This is primarily for display, strength mode is auto-calculated based on dose form
                    // Could implement override logic here if needed
                  }}
                >
                  <SelectTrigger className="bg-input border-input text-foreground w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="ratio">Ratio (for liquids)</SelectItem>
                    <SelectItem value="quantity">Quantity (for solids)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField 
                label="Multi-ingredient"
                description="Override auto-detection for multi-ingredient compounds"
              >
                <label className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={(formData.ingredient?.length || 0) > 1}
                    onChange={() => {
                      // If unchecking, reduce to single ingredient
                      if ((formData.ingredient?.length || 0) > 1) {
                        setFormData({
                          ...formData,
                          ingredient: formData.ingredient?.slice(0, 1) || []
                        });
                      } else {
                        // If checking, add a second ingredient
                        addIngredient();
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-secondary-foreground">
                    Uses direct volume instead of active ingredient
                  </span>
                </label>
              </FormField>
            </div>
          </div>
          
          <div className="space-y-4">
            {formData.ingredient?.map((ingredient, index) => (
              <div key={index} className="p-4 bg-secondary rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-secondary-foreground">
                    Ingredient {index + 1}
                  </h4>
                  {formData.ingredient && formData.ingredient.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIngredient(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <FormField label="Ingredient Name">
                  <Input
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="bg-input border-input text-foreground"
                    placeholder="Enter ingredient name"
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Strength Value">
                    <Input
                      type="number"
                      value={ingredient.strengthRatio?.numerator?.value || 0}
                      onChange={(e) => handleIngredientChange(index, 'strength.numerator.value', Number(e.target.value))}
                      className="bg-input border-input text-foreground"
                    />
                  </FormField>
                  <FormField label="Unit">
                    <Input
                      value={ingredient.strengthRatio?.numerator?.unit || 'mg'}
                      onChange={(e) => handleIngredientChange(index, 'strength.numerator.unit', e.target.value)}
                      className="bg-input border-input text-foreground"
                    />
                  </FormField>
                </div>
                {getStrengthMode(formData.doseForm) === 'ratio' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Per Volume">
                      <Input
                        type="number"
                        value={ingredient.strengthRatio?.denominator?.value || 1}
                        onChange={(e) => handleIngredientChange(index, 'strength.denominator.value', Number(e.target.value))}
                        className="bg-input border-input text-foreground"
                      />
                    </FormField>
                    <FormField label="Unit">
                      <Input
                        value={ingredient.strengthRatio?.denominator?.unit || 'mL'}
                        onChange={(e) => handleIngredientChange(index, 'strength.denominator.unit', e.target.value)}
                        className="bg-input border-input text-foreground"
                      />
                    </FormField>
                  </div>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={addIngredient}
              variant="outline"
              className="w-full border-border text-secondary-foreground hover:bg-accent"
            >
              Add Ingredient
            </Button>
          </div>
        </FormSection>

        {/* Dosing & Dispensing */}
        <FormSection 
          title="Dosing & Dispensing"
          description="Route administration and dispensing method configuration"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Default Route"
              description="Primary administration route for this medication"
            >
              <Select 
                value={formData.defaultRoute} 
                onValueChange={(value) => setFormData({ ...formData, defaultRoute: value })}
              >
                <SelectTrigger className="bg-input border-input text-foreground">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {availableRoutes.map((route) => (
                    <SelectItem key={route} value={route}>
                      {routes[route]?.name || route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            {availableDispenserTypes.length > 0 && (
              <FormField 
                label="Dispenser Type"
                description="Special dispensing method (e.g., Topiclick, syringe)"
              >
                <Select 
                  value={formData.dispenserInfo?.type || ''} 
                  onValueChange={(value) => {
                    const dispenser = dispenserTypes[value];
                    setFormData({ 
                      ...formData, 
                      dispenserInfo: dispenser ? {
                        type: value,
                        unit: dispenser.defaultUnit,
                        pluralUnit: dispenser.pluralUnit,
                        conversionRatio: dispenser.defaultConversionRatio
                      } : undefined
                    });
                  }}
                >
                  <SelectTrigger className="bg-input border-input text-foreground">
                    <SelectValue placeholder="Select dispenser" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="">None</SelectItem>
                    {availableDispenserTypes.map((dispenser) => (
                      <SelectItem key={dispenser} value={dispenser}>
                        {dispenserOptions.find(d => d.value === dispenser)?.label || dispenser}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          </div>
        </FormSection>

        {/* Prescription Quantity Constraints */}
        <FormSection 
          title="Prescription Quantity Constraints"
          description="Define minimum, default, and maximum quantities for prescription orders"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField 
              label="Minimum Quantity"
              description="Smallest quantity that can be prescribed"
            >
              <Input
                type="number"
                value={formData.quantityConstraints?.minQty || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  quantityConstraints: {
                    ...formData.quantityConstraints,
                    minQty: e.target.value ? Number(e.target.value) : undefined,
                    defaultQty: formData.quantityConstraints?.defaultQty,
                    maxQty: formData.quantityConstraints?.maxQty
                  }
                })}
                className="bg-input border-input text-foreground"
                placeholder="e.g., 1, 30"
              />
            </FormField>
            
            <FormField 
              label="Default Quantity"
              description="Suggested quantity for new prescriptions"
            >
              <Input
                type="number"
                value={formData.quantityConstraints?.defaultQty || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  quantityConstraints: {
                    ...formData.quantityConstraints,
                    minQty: formData.quantityConstraints?.minQty,
                    defaultQty: e.target.value ? Number(e.target.value) : undefined,
                    maxQty: formData.quantityConstraints?.maxQty
                  }
                })}
                className="bg-input border-input text-foreground"
                placeholder="e.g., 30, 90"
              />
            </FormField>
            
            <FormField 
              label="Maximum Quantity"
              description="Largest quantity that can be prescribed"
            >
              <Input
                type="number"
                value={formData.quantityConstraints?.maxQty || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  quantityConstraints: {
                    ...formData.quantityConstraints,
                    minQty: formData.quantityConstraints?.minQty,
                    defaultQty: formData.quantityConstraints?.defaultQty,
                    maxQty: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                className="bg-input border-input text-foreground"
                placeholder="e.g., 180, 360"
              />
            </FormField>
          </div>
        </FormSection>

        {/* Package Information - FHIR Compliant */}
        <FormSection 
          title="Package Information" 
          description="FHIR-compliant packaging model for accurate dispensing and days supply calculations"
        >
          <div className="mb-4 p-4 bg-accent/20 border border-accent rounded-lg">
            <h4 className="text-sm font-medium text-accent-foreground mb-2">📋 FHIR Packaging Model</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Unit Dose (Quantity):</strong> Amount per individual unit (1 tablet, 10mL per vial, 30g per tube)<br/>
              <strong>Pack Size:</strong> How many units come in a dispensed package (100 tablets per bottle, 2 vials per package)<br/>
              <strong>Total Volume:</strong> Volume/quantity of the individual dispensing unit
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Unit Dose Fields */}
            <FormField 
              label="Unit Dose Quantity" 
              description="Amount per individual unit (e.g., 1 tablet, 10mL per vial)"
            >
              <Input
                type="number"
                value={formData.packageInfo?.quantity || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  packageInfo: {
                    ...formData.packageInfo,
                    quantity: Number(e.target.value),
                    unit: formData.packageInfo?.unit || ''
                  }
                })}
                className="bg-input border-input text-foreground"
                placeholder="e.g., 1, 10, 30"
              />
            </FormField>
            
            <FormField 
              label="Unit Dose Unit" 
              description="Unit type for individual dose (tablet, mL, g)"
            >
              <Input
                value={formData.packageInfo?.unit || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  packageInfo: {
                    ...formData.packageInfo,
                    quantity: formData.packageInfo?.quantity || 0,
                    unit: e.target.value
                  }
                })}
                className="bg-input border-input text-foreground"
                placeholder="tablet, mL, g, capsule"
              />
            </FormField>
            
            <FormField 
              label="Pack Size" 
              description="Number of units in dispensed package (optional for single-unit packages)"
            >
              <Input
                type="number"
                value={formData.packageInfo?.packSize || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  packageInfo: {
                    ...formData.packageInfo,
                    quantity: formData.packageInfo?.quantity || 0,
                    unit: formData.packageInfo?.unit || '',
                    packSize: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                className="bg-input border-input text-foreground"
                placeholder="e.g., 100, 2, 30"
              />
            </FormField>
            
            {/* Total Volume - Show for all dose forms, not just Vials */}
            <FormField 
              label="Total Volume" 
              description="Volume/quantity of individual unit (matches Unit Dose for FHIR compliance)"
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.totalVolume?.value || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    totalVolume: {
                      value: Number(e.target.value),
                      unit: formData.totalVolume?.unit || (formData.packageInfo?.unit || 'mL')
                    }
                  })}
                  className="bg-input border-input text-foreground flex-1"
                  placeholder="Same as unit dose"
                />
                <Input
                  value={formData.totalVolume?.unit || (formData.packageInfo?.unit || 'mL')}
                  onChange={(e) => setFormData({
                    ...formData,
                    totalVolume: {
                      value: formData.totalVolume?.value || 0,
                      unit: e.target.value
                    }
                  })}
                  className="bg-input border-input text-foreground w-20"
                  placeholder="Unit"
                />
              </div>
            </FormField>
          </div>
          
          {/* Example Section */}
          <div className="mt-6 p-4 bg-muted/20 border border-muted rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">💡 Examples</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Testosterone 200mg/mL:</strong> Unit Dose: 10mL, Pack Size: 2 (= 2 vials × 10mL = 20mL total)</div>
              <div><strong>Metformin 500mg:</strong> Unit Dose: 1 tablet, Pack Size: 100 (= 100 tablets per bottle)</div>
              <div><strong>Hormone Cream:</strong> Unit Dose: 30g, Pack Size: 1 (= single 30g tube)</div>
            </div>
          </div>
        </FormSection>

        {/* Signature Builder (for editing existing medications) */}
        {!isAddMode && (
          <FormSection title="Signature Builder">
            <SignatureBuilder
              selectedMedication={formData}
              dosage={dosage}
              route={route}
              frequency={frequency}
              specialInstructions={specialInstructions}
              errors={errors}
              onMedicationSelect={(med) => setFormData(med)}
              onDosageChange={setDosage}
              onRouteChange={setRoute}
              onFrequencyChange={setFrequency}
              onSpecialInstructionsChange={setSpecialInstructions}
              onErrorsChange={setErrors}
            />
          </FormSection>
        )}
      </div>
    </div>
  );
};

export default MedicationManager;