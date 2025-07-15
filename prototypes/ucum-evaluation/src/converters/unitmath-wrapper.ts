/**
 * Wrapper for unitmath library
 */
import { UnitConverter, ConversionResult, ValidationResult } from '../types';
import unitmath from 'unitmath';

export class UnitMathWrapper implements UnitConverter {
  name = 'unitmath';

  convert(value: number, from: string, to: string): ConversionResult {
    try {
      // Create quantity with unit
      const quantity = unitmath(`${value} ${from}`);
      
      // Convert to target unit
      const converted = quantity.to(to);
      
      return {
        success: true,
        value: converted.value || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  validate(unit: string): ValidationResult {
    try {
      // Try to create a unit with value 1
      unitmath(`1 ${unit}`);
      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Invalid unit'
      };
    }
  }

  getCommensurableUnits(unit: string): string[] {
    // UnitMath doesn't have a direct API for this
    // We'll test common medical units
    const testUnits = ['mg', 'g', 'kg', 'mcg', 'ng', 'pg', 'mL', 'L', 'dL'];
    const compatible: string[] = [];
    
    try {
      const baseQuantity = unitmath(`1 ${unit}`);
      
      for (const testUnit of testUnits) {
        try {
          // Try to convert - if it works, they're compatible
          baseQuantity.to(testUnit);
          compatible.push(testUnit);
        } catch {
          // Not compatible
        }
      }
    } catch {
      // Invalid base unit
    }
    
    return compatible;
  }
}