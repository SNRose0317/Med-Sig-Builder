import { supabase } from './supabaseClient'
import { Medication } from '../types'
import { objectToDatabaseFormat, objectToApplicationFormat } from './dbAdapter'
import { v4 as uuidv4 } from 'uuid'

/**
 * Fetch all medications from the database
 */
export const getMedications = async (): Promise<Medication[]> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
  
  if (error) {
    console.error('Error fetching medications:', error)
    throw new Error(`Database error: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('No data returned from the database')
  }
  
  // Convert from snake_case database columns to camelCase properties
  return data.map(item => objectToApplicationFormat(item) as Medication);
}

/**
 * Save a medication (create or update)
 */
export const saveMedication = async (medication: Medication): Promise<Medication> => {
  if (!medication) {
    throw new Error('No medication data provided')
  }
  
  // If it's a new medication or has a non-UUID id, generate a proper UUID
  const rawMedicationToSave = { 
    ...medication,
    // Ensure proper boolean value for isActive
    isActive: Boolean(medication.isActive),
    // If no ID or ID doesn't match UUID pattern, generate a new one
    id: (!medication.id || !medication.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) 
        ? uuidv4() 
        : medication.id
  }
  
  // Convert to snake_case for database storage
  const medicationToSave = objectToDatabaseFormat(rawMedicationToSave);
  
  const { data, error } = await supabase
    .from('medications')
    .upsert(medicationToSave, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
  
  if (error) {
    console.error('Error saving medication:', error)
    throw new Error(`Database error while saving medication: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    throw new Error('No data returned after saving medication')
  }
  
  // Convert back to camelCase for application use
  return objectToApplicationFormat(data[0]) as Medication;
}

/**
 * Delete a medication by ID
 */
export const deleteMedication = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('No medication ID provided for deletion')
  }
  
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting medication:', error)
    throw new Error(`Database error while deleting medication: ${error.message}`)
  }
}

/**
 * Initialize the database with the medications from the JSON file
 * This is used only once to populate the database initially
 */
export const initializeMedicationsDatabase = async (medications: Medication[]): Promise<void> => {
  if (!medications || medications.length === 0) {
    throw new Error('No medications provided for initialization')
  }
  
  // Convert IDs to proper UUIDs and convert to snake_case for database storage
  const dbMedications = medications.map(med => {
    // Create a copy with a UUID instead of string ID
    const medWithUuid = {
      ...med,
      id: uuidv4() // Generate a proper UUID
    };
    
    // Convert camelCase properties to snake_case
    return objectToDatabaseFormat(medWithUuid);
  });
  
  // Initialize medications one by one to better handle errors
  for (const medication of dbMedications) {
    try {
      const { error } = await supabase
        .from('medications')
        .insert(medication);
      
      if (error) {
        console.error(`Error inserting medication: ${error.message}`, medication);
        // Continue with other medications instead of failing completely
      }
    } catch (err) {
      console.error('Unexpected error during medication insertion:', err);
      // Continue with other medications
    }
  }
}
