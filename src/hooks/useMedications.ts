import { useState, useEffect, useCallback } from 'react';
import type { Medication } from '../types';
import type { MedicationFilters, PaginationState } from '../components/MedicationControls';
import { medicationsAPI } from '../api/medications';
import defaultMedications from '../data/medications.json';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MedicationFilters>({
    search: '',
    showInactive: false,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    total: 0,
  });

  // Filtered medications based on current filters
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const meds = await medicationsAPI.getAll();
      
      if (meds.length === 0) {
        // Initialize with default medications
        try {
          await medicationsAPI.initializeDatabase(defaultMedications as Medication[]);
          const initializedMeds = await medicationsAPI.getAll();
          setMedications(initializedMeds);
        } catch (initError) {
          console.error('Error initializing medications:', initError);
          setError('Failed to initialize medications database');
          // Use default medications as fallback
          setMedications(defaultMedications as Medication[]);
        }
      } else {
        setMedications(meds);
      }
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError('Failed to load medications. Using local data.');
      // Use default medications as fallback
      setMedications(defaultMedications as Medication[]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters and pagination
  useEffect(() => {
    let filtered = [...medications];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.name.toLowerCase().includes(searchLower) ||
          med.doseForm?.toLowerCase().includes(searchLower) ||
          med.type?.toLowerCase().includes(searchLower)
      );
    }

    // Apply active/inactive filter
    if (!filters.showInactive) {
      filtered = filtered.filter((med) => med.isActive);
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter((med) => med.type === filters.type);
    }

    // Apply dose form filter
    if (filters.doseForm) {
      filtered = filtered.filter((med) => med.doseForm === filters.doseForm);
    }

    // Apply multi-ingredient filter
    if (filters.multiIngredient !== undefined) {
      filtered = filtered.filter((med) => {
        const isMulti = med.ingredient && med.ingredient.length > 1;
        return filters.multiIngredient ? isMulti : !isMulti;
      });
    }

    // Update total count
    setPagination(prev => ({ ...prev, total: filtered.length }));

    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    setFilteredMedications(paginated);
  }, [medications, filters, pagination.page, pagination.pageSize]);

  // Load medications on mount
  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const updateFilters = useCallback((newFilters: Partial<MedicationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  }, []);

  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const addMedication = useCallback(async (medication: Medication) => {
    try {
      setError(null);
      const created = await medicationsAPI.create(medication);
      setMedications(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Error creating medication:', err);
      setError('Failed to create medication');
      throw err;
    }
  }, []);

  const updateMedication = useCallback(async (medication: Medication) => {
    try {
      setError(null);
      const updated = await medicationsAPI.update(medication.id, medication);
      setMedications(prev => prev.map(med => med.id === updated.id ? updated : med));
      return updated;
    } catch (err) {
      console.error('Error updating medication:', err);
      setError('Failed to update medication');
      throw err;
    }
  }, []);

  const deleteMedication = useCallback(async (id: string) => {
    try {
      setError(null);
      await medicationsAPI.delete(id);
      setMedications(prev => prev.filter(med => med.id !== id));
    } catch (err) {
      console.error('Error deleting medication:', err);
      setError('Failed to delete medication');
      throw err;
    }
  }, []);

  const toggleMedicationStatus = useCallback(async (id: string) => {
    try {
      setError(null);
      const medication = medications.find(med => med.id === id);
      if (!medication) return;
      
      const updated = await medicationsAPI.update(medication.id, {
        ...medication,
        isActive: !medication.isActive
      });
      
      setMedications(prev => prev.map(med => med.id === updated.id ? updated : med));
      return updated;
    } catch (err) {
      console.error('Error toggling medication status:', err);
      setError('Failed to toggle medication status');
      throw err;
    }
  }, [medications]);

  return {
    medications: filteredMedications,
    allMedications: medications,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePagination,
    refetch: fetchMedications,
    addMedication,
    updateMedication,
    deleteMedication,
    toggleMedicationStatus,
  };
}