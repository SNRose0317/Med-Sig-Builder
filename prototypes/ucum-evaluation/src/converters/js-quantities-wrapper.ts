/**
 * Wrapper for js-quantities library
 */
import { UnitConverter, ConversionResult, ValidationResult } from '../types';
import Qty from 'js-quantities';

export class JsQuantitiesWrapper implements UnitConverter {
  name = 'js-quantities';
  
  // Map medical units to js-quantities compatible units
  private unitMap: Record<string, string> = {
    'mg': 'milligram',
    'g': 'gram',
    'kg': 'kilogram',
    'mcg': 'microgram',
    'ug': 'microgram',
    'ng': 'nanogram',
    'pg': 'picogram',
    'mL': 'milliliter',
    'L': 'liter',
    'dL': 'deciliter',
    'uL': 'microliter',
    'mg/mL': 'milligram/milliliter',
    'g/L': 'gram/liter',
    'tablet': 'item',
    'capsule': 'item',
    '[iU]': 'item', // International units as items
    '[drp]': 'item' // Drops as items
  };

  private reverseMap: Record<string, string> = {};

  constructor() {
    // Build reverse mapping
    for (const [medical, jsq] of Object.entries(this.unitMap)) {
      this.reverseMap[jsq] = medical;
    }
  }

  private toJsQuantitiesUnit(unit: string): string {
    return this.unitMap[unit] || unit;
  }

  convert(value: number, from: string, to: string): ConversionResult {
    try {
      const fromUnit = this.toJsQuantitiesUnit(from);
      const toUnit = this.toJsQuantitiesUnit(to);
      
      const qty = Qty(value, fromUnit);
      const converted = qty.to(toUnit);
      
      return {
        success: true,
        value: converted.scalar
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
      const jsUnit = this.toJsQuantitiesUnit(unit);
      // Try to create a quantity with the unit
      Qty(1, jsUnit);
      
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
    try {
      const jsUnit = this.toJsQuantitiesUnit(unit);
      const qty = Qty(1, jsUnit);
      const kind = qty.kind();
      
      // Get all units of the same kind
      const compatibleUnits: string[] = [];
      
      // Check common medical units
      const testUnits = ['mg', 'g', 'kg', 'mcg', 'ng', 'mL', 'L', 'dL'];
      
      for (const testUnit of testUnits) {
        try {
          const testJsUnit = this.toJsQuantitiesUnit(testUnit);
          const testQty = Qty(1, testJsUnit);
          
          if (testQty.kind() === kind) {
            compatibleUnits.push(testUnit);
          }
        } catch {
          // Unit not compatible
        }
      }
      
      return compatibleUnits;
    } catch (error) {
      return [];
    }
  }
}