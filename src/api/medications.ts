import { supabase } from './supabase';
import type { Medication } from '../types/index';

// Simple in-memory cache
let cache: { data: Medication[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Field mapping functions (inline to reduce file count)
function toDatabase(medication: any): any {
  return {
    ...medication,
    // camelCase to snake_case
    is_active: medication.isActive,
    dose_form: medication.doseForm,
    package_info: medication.packageInfo,
    dispenser_info: medication.dispenserInfo,
    allowed_routes: medication.allowedRoutes,
    default_route: medication.defaultRoute,
    common_dosages: medication.commonDosages,
    dosage_constraints: medication.dosageConstraints,
    default_signature_settings: medication.defaultSignatureSettings,
    eligible_genders: medication.eligibleGenders,
    
    // Flatten dosage constraints
    min_dose_value: medication.dosageConstraints?.minDose?.value,
    min_dose_unit: medication.dosageConstraints?.minDose?.unit,
    max_dose_value: medication.dosageConstraints?.maxDose?.value,
    max_dose_unit: medication.dosageConstraints?.maxDose?.unit,
    dose_step: medication.dosageConstraints?.step,
    
    // Remove JS-only fields
    isActive: undefined,
    doseForm: undefined,
    packageInfo: undefined,
    dispenserInfo: undefined,
    allowedRoutes: undefined,
    defaultRoute: undefined,
    commonDosages: undefined,
    dosageConstraints: undefined,
    defaultSignatureSettings: undefined,
    eligibleGenders: undefined
  };
}

function fromDatabase(row: any): any {
  return {
    ...row,
    // snake_case to camelCase
    isActive: row.is_active,
    doseForm: row.dose_form,
    packageInfo: row.package_info,
    dispenserInfo: row.dispenser_info,
    allowedRoutes: row.allowed_routes,
    defaultRoute: row.default_route,
    commonDosages: row.common_dosages,
    eligibleGenders: row.eligible_genders || [],
    
    // Reconstruct nested dosageConstraints
    dosageConstraints: row.min_dose_value ? {
      minDose: { value: row.min_dose_value, unit: row.min_dose_unit },
      maxDose: row.max_dose_value ? { value: row.max_dose_value, unit: row.max_dose_unit } : undefined,
      step: row.dose_step
    } : row.dosage_constraints,
    
    defaultSignatureSettings: row.default_signature_settings,
    
    // Remove DB-only fields
    is_active: undefined,
    dose_form: undefined,
    package_info: undefined,
    dispenser_info: undefined,
    allowed_routes: undefined,
    default_route: undefined,
    common_dosages: undefined,
    min_dose_value: undefined,
    min_dose_unit: undefined,
    max_dose_value: undefined,
    max_dose_unit: undefined,
    dose_step: undefined,
    default_signature_settings: undefined,
    eligible_genders: undefined
  };
}

export const medicationsAPI = {
  async getAll(): Promise<Medication[]> {
    // Check cache first
    if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
      return cache.data;
    }

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('name');

    if (error) throw error;
    
    const medications = data.map(fromDatabase);
    
    // Update cache
    cache = { data: medications, timestamp: Date.now() };
    
    return medications;
  },

  async create(medication: Omit<Medication, 'id'>): Promise<Medication> {
    const dbData = toDatabase(medication);
    
    const { data, error } = await supabase
      .from('medications')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate cache
    cache.data = null;
    
    return fromDatabase(data);
  },

  async update(id: string, updates: Partial<Medication>): Promise<Medication> {
    const dbData = toDatabase(updates);
    
    const { data, error } = await supabase
      .from('medications')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate cache
    cache.data = null;
    
    return fromDatabase(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Invalidate cache
    cache.data = null;
  },

  async initializeDatabase(medications: Medication[]): Promise<void> {
    if (!medications || medications.length === 0) {
      throw new Error('No medications provided for initialization');
    }
    
    // Initialize medications one by one
    for (const med of medications) {
      const dbData = toDatabase({
        ...med,
        id: crypto.randomUUID() // Generate proper UUID
      });
      
      try {
        const { error } = await supabase
          .from('medications')
          .insert(dbData);
        
        if (error) {
          console.error(`Error inserting ${med.name}:`, error);
        }
      } catch (err) {
        console.error(`Failed to insert ${med.name}:`, err);
      }
    }
    
    // Invalidate cache
    cache.data = null;
  }
};