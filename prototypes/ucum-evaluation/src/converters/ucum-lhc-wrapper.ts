/**
 * Wrapper for @lhncbc/ucum-lhc library
 */
import { UnitConverter, ConversionResult, ValidationResult } from '../types';

// @ts-ignore - Library doesn't have types
import { UcumLhcUtils } from '@lhncbc/ucum-lhc';

export class UcumLhcWrapper implements UnitConverter {
  name = '@lhncbc/ucum-lhc';
  private utils: any;

  constructor() {
    this.utils = UcumLhcUtils.getInstance();
  }

  convert(value: number, from: string, to: string): ConversionResult {
    try {
      const result = this.utils.convertUnitTo(value.toString(), from, to);
      
      if (result.status === 'succeeded') {
        return {
          success: true,
          value: parseFloat(result.toVal)
        };
      } else {
        return {
          success: false,
          error: result.msg ? result.msg.join('; ') : 'Conversion failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  validate(unit: string): ValidationResult {
    try {
      const result = this.utils.validateUnitString(unit, true);
      
      return {
        valid: result.status === 'valid',
        message: result.msg ? result.msg.join('; ') : undefined,
        suggestions: result.suggestions
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
      const units = this.utils.commensurablesList(unit);
      
      // Extract unit codes from the complex objects
      if (Array.isArray(units) && units.length > 0) {
        return units.flat().map((u: any) => u.csCode_ || u.code || '').filter(Boolean);
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }
}