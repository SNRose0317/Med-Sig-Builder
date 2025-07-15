/**
 * Wrapper for convert-units library
 */
import { UnitConverter, ConversionResult, ValidationResult } from '../types';
const convert = require('convert-units');

export class ConvertUnitsWrapper implements UnitConverter {
  name = 'convert-units';
  
  // Map medical units to convert-units format
  private unitMap: Record<string, { unit: string, measure: string }> = {
    'mg': { unit: 'mg', measure: 'mass' },
    'g': { unit: 'g', measure: 'mass' },
    'kg': { unit: 'kg', measure: 'mass' },
    'mcg': { unit: 'mcg', measure: 'mass' },
    'ug': { unit: 'mcg', measure: 'mass' }, // Map ug to mcg
    'oz': { unit: 'oz', measure: 'mass' },
    'lb': { unit: 'lb', measure: 'mass' },
    'mL': { unit: 'ml', measure: 'volume' },
    'L': { unit: 'l', measure: 'volume' },
    'fl-oz': { unit: 'fl-oz', measure: 'volume' },
    'cup': { unit: 'cup', measure: 'volume' },
    'tsp': { unit: 'tsp', measure: 'volume' },
    'Tbs': { unit: 'Tbs', measure: 'volume' }
  };

  convert(value: number, from: string, to: string): ConversionResult {
    try {
      const fromUnit = this.unitMap[from];
      const toUnit = this.unitMap[to];
      
      if (!fromUnit || !toUnit) {
        return {
          success: false,
          error: `Unit not supported: ${!fromUnit ? from : to}`
        };
      }
      
      if (fromUnit.measure !== toUnit.measure) {
        return {
          success: false,
          error: `Cannot convert between ${fromUnit.measure} and ${toUnit.measure}`
        };
      }
      
      const result = convert(value).from(fromUnit.unit).to(toUnit.unit);
      
      return {
        success: true,
        value: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  validate(unit: string): ValidationResult {
    const mapped = this.unitMap[unit];
    
    if (!mapped) {
      return {
        valid: false,
        message: 'Unit not supported'
      };
    }
    
    try {
      // Check if the unit exists in the library
      const allUnits = convert().possibilities();
      const valid = allUnits.includes(mapped.unit);
      
      return {
        valid,
        message: valid ? undefined : 'Unit not found in library'
      };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Validation error'
      };
    }
  }

  getCommensurableUnits(unit: string): string[] {
    try {
      const mapped = this.unitMap[unit];
      if (!mapped) return [];
      
      // Get all units of the same measure
      const compatible: string[] = [];
      
      for (const [medUnit, info] of Object.entries(this.unitMap)) {
        if (info.measure === mapped.measure) {
          compatible.push(medUnit);
        }
      }
      
      return compatible;
    } catch (error) {
      return [];
    }
  }
}