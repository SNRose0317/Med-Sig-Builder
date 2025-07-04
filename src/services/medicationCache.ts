import { Medication } from '../types';

class MedicationCache {
  private cache: Medication[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private fetchPromise: Promise<Medication[]> | null = null;

  isCacheValid(): boolean {
    return this.cache !== null && Date.now() - this.lastFetch < this.CACHE_DURATION;
  }

  getCache(): Medication[] | null {
    if (this.isCacheValid()) {
      return this.cache;
    }
    return null;
  }

  setCache(medications: Medication[]): void {
    this.cache = medications;
    this.lastFetch = Date.now();
  }

  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
    this.fetchPromise = null;
  }

  getFetchPromise(): Promise<Medication[]> | null {
    return this.fetchPromise;
  }

  setFetchPromise(promise: Promise<Medication[]>): void {
    this.fetchPromise = promise;
  }

  clearFetchPromise(): void {
    this.fetchPromise = null;
  }

  async getMedications(fetchFn: () => Promise<Medication[]>): Promise<Medication[]> {
    // Return cached data if valid
    const cached = this.getCache();
    if (cached) {
      return cached;
    }

    // If a fetch is already in progress, return that promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Otherwise, start a new fetch
    try {
      this.fetchPromise = fetchFn();
      const medications = await this.fetchPromise;
      this.setCache(medications);
      return medications;
    } finally {
      this.clearFetchPromise();
    }
  }

  updateMedication(updatedMedication: Medication): void {
    if (this.cache) {
      const index = this.cache.findIndex(med => med.id === updatedMedication.id);
      if (index !== -1) {
        this.cache[index] = updatedMedication;
      }
    }
  }

  removeMedication(medicationId: string): void {
    if (this.cache) {
      this.cache = this.cache.filter(med => med.id !== medicationId);
    }
  }
}

export const medicationCache = new MedicationCache();