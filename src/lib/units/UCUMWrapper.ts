/**
 * UCUM Wrapper - Tier 1 of Two-Tier Anti-Corruption Layer
 * 
 * This wrapper abstracts the js-quantities library to provide a consistent
 * UCUM-like interface. It handles standard medical units and provides
 * type safety regardless of the underlying library implementation.
 */
import Qty from 'js-quantities';
import { 
  IUCUMWrapper, 
  UnitValidation,
  ConversionSuccess
} from './types';
import {
  ConversionErrors,
  InvalidUnitError,
  ImpossibleConversionError,
  success,
  error
} from './ConversionErrors';

/**
 * Mapping of common medical units to js-quantities format
 * js-quantities uses some different conventions than UCUM
 */
const MEDICAL_UNIT_MAPPINGS: Record<string, string> = {
  // Mass units
  'mcg': 'ug',      // microgram
  'μg': 'ug',       // microgram (unicode)
  
  // Volume units  
  'mL': 'ml',       // milliliter
  'L': 'l',         // liter
  'dL': 'dl',       // deciliter
  'μL': 'ul',       // microliter (unicode)
  'uL': 'ul',       // microliter
  
  // Concentration units
  'mg/mL': 'mg/ml',
  'g/L': 'g/l',
  'mcg/mL': 'ug/ml',
  'μg/mL': 'ug/ml',
  
  // Time units (for frequency calculations)
  'd': 'day',       // day
  'h': 'hour',      // hour
  'min': 'minute',  // minute
  'mo': 'month',    // month
  'wk': 'week',     // week
  'a': 'year'       // year (annum)
};

/**
 * Units that js-quantities doesn't support but are valid in medical contexts
 */
const UNSUPPORTED_MEDICAL_UNITS = new Set([
  'IU',           // International Unit
  '{drop}',       // drops
  '{tablet}',     // tablets
  '{capsule}',    // capsules
  '{click}',      // device clicks (e.g., Topiclick)
  '{application}',// topical applications
  '{patch}',      // transdermal patches
  '{puff}',       // inhaler puffs
  '{spray}'       // nasal sprays
]);

/**
 * UCUM Wrapper implementation using js-quantities
 */
export class UCUMWrapper implements IUCUMWrapper {
  /**
   * Normalize a unit string to js-quantities format
   */
  private normalizeUnit(unit: string): string {
    // Check direct mapping first
    if (MEDICAL_UNIT_MAPPINGS[unit]) {
      return MEDICAL_UNIT_MAPPINGS[unit];
    }
    
    // Handle compound units (e.g., mg/mL)
    let normalized = unit;
    for (const [medical, jsq] of Object.entries(MEDICAL_UNIT_MAPPINGS)) {
      normalized = normalized.replace(new RegExp(medical, 'g'), jsq);
    }
    
    return normalized;
  }
  
  /**
   * Convert between standard units
   */
  convert(value: number, from: string, to: string): number {
    // Normalize units
    const normalizedFrom = this.normalizeUnit(from);
    const normalizedTo = this.normalizeUnit(to);
    
    try {
      // Create quantity with source unit
      const qty = Qty(value, normalizedFrom);
      
      // Attempt conversion
      const converted = qty.to(normalizedTo);
      
      // Return the scalar value
      return converted.scalar;
    } catch (err) {
      // Check if it's an incompatible units error
      if (err instanceof Error) {
        if (err.message.includes('Incompatible units')) {
          throw ConversionErrors.impossibleConversion(
            from,
            to,
            'Units have incompatible dimensions'
          );
        }
        // Re-throw other errors
        throw ConversionErrors.invalidUnit(
          err.message.includes(normalizedFrom) ? from : to,
          err.message
        );
      }
      throw err;
    }
  }
  
  /**
   * Validate a unit string
   */
  validate(unit: string): UnitValidation {
    // Check if it's an unsupported medical unit
    if (UNSUPPORTED_MEDICAL_UNITS.has(unit)) {
      return {
        valid: false,
        normalized: unit,
        error: `Unit '${unit}' is a valid medical unit but not supported by the underlying library`,
        type: 'device'
      };
    }
    
    const normalized = this.normalizeUnit(unit);
    
    try {
      // Try to create a quantity with the unit
      Qty(1, normalized);
      
      return {
        valid: true,
        normalized: unit,
        type: 'standard'
      };
    } catch (err) {
      // Try to provide helpful suggestions
      const suggestions = this.getSuggestions(unit);
      
      return {
        valid: false,
        normalized: unit,
        error: err instanceof Error ? err.message : 'Invalid unit',
        suggestions,
        type: 'standard'
      };
    }
  }
  
  /**
   * Get compatible units for a given unit
   */
  getCompatibleUnits(unit: string): string[] {
    const validation = this.validate(unit);
    if (!validation.valid) {
      return [];
    }
    
    const normalized = this.normalizeUnit(unit);
    
    try {
      const qty = Qty(1, normalized);
      const kind = qty.kind();
      
      // Map of unit kinds to common medical units
      const compatibleUnits: Record<string, string[]> = {
        'mass': ['pg', 'ng', 'mcg', 'mg', 'g', 'kg'],
        'volume': ['μL', 'mL', 'dL', 'L'],
        'time': ['min', 'h', 'd', 'wk', 'mo', 'a'],
        'length': ['nm', 'μm', 'mm', 'cm', 'm'],
        'concentration': ['mg/mL', 'g/L', 'mcg/mL']
      };
      
      // Return medical units for this kind
      return compatibleUnits[kind] || [];
    } catch {
      return [];
    }
  }
  
  /**
   * Check if two units are compatible (can be converted between)
   */
  areUnitsCompatible(unit1: string, unit2: string): boolean {
    // Both must be valid
    const validation1 = this.validate(unit1);
    const validation2 = this.validate(unit2);
    
    if (!validation1.valid || !validation2.valid) {
      return false;
    }
    
    const normalized1 = this.normalizeUnit(unit1);
    const normalized2 = this.normalizeUnit(unit2);
    
    try {
      // Try to convert 1 unit1 to unit2
      const qty = Qty(1, normalized1);
      qty.to(normalized2);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get unit suggestions for common typos
   */
  private getSuggestions(unit: string): string[] {
    const suggestions: string[] = [];
    
    // Common typos and their corrections
    const typoMap: Record<string, string[]> = {
      'mgg': ['mg'],
      'mgs': ['mg'],
      'mgr': ['mg'],
      'mil': ['mL'],
      'ml': ['mL'],
      'ug': ['mcg', 'μg'],
      'microgram': ['mcg', 'μg'],
      'milligram': ['mg'],
      'miligram': ['mg', 'milligram'],
      'milliliter': ['mL'],
      'liter': ['L'],
      'gram': ['g'],
      'kilogram': ['kg']
    };
    
    const lowerUnit = unit.toLowerCase();
    if (typoMap[lowerUnit]) {
      suggestions.push(...typoMap[lowerUnit]);
    }
    
    // Check for missing slash in compound units
    if (unit.match(/^(mg|g|mcg|μg)(ml|l|dl)$/i)) {
      const match = unit.match(/^(mg|g|mcg|μg)(ml|l|dl)$/i)!;
      suggestions.push(`${match[1]}/${match[2]}`);
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
}