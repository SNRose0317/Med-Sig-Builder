/**
 * Type definitions for @lhncbc/ucum-lhc
 * 
 * Based on UCUM-LHC library documentation and source code analysis
 * This provides TypeScript support for the NIH UCUM implementation
 */

declare module '@lhncbc/ucum-lhc' {
  export interface UcumValidationResponse {
    /**
     * Indicates whether the unit string is valid
     */
    status: 'valid' | 'invalid' | 'error';
    
    /**
     * The parsed unit object if valid
     */
    unit?: UcumUnit;
    
    /**
     * Error or warning messages
     */
    message?: string;
    
    /**
     * Array of suggested unit corrections
     */
    suggestions?: string[];
  }

  export interface UcumUnit {
    /**
     * The unit code (e.g., 'mg', 'mL', 'mg/mL')
     */
    code: string;
    
    /**
     * Human-readable name
     */
    name?: string;
    
    /**
     * UCUM dimension vector
     */
    dimension?: number[];
    
    /**
     * Magnitude for conversions
     */
    magnitude?: number;
  }

  export interface UcumConversionResult {
    /**
     * The converted value
     */
    value: number | string;
    
    /**
     * The target unit
     */
    toUnit: string;
    
    /**
     * The original value
     */
    fromValue: number | string;
    
    /**
     * The original unit
     */
    fromUnit: string;
    
    /**
     * Status of the conversion
     */
    status: 'succeeded' | 'failed' | 'error';
    
    /**
     * Error message if conversion failed
     */
    message?: string;
  }

  export interface UcumCommensurableUnit {
    /**
     * Unit code
     */
    code: string;
    
    /**
     * Human-readable name
     */
    name: string;
    
    /**
     * Guidance text for usage
     */
    guidance?: string;
  }

  export interface UcumLhcUtils {
    /**
     * Validates a UCUM unit string
     * @param unitString - The unit expression to validate
     * @param suggest - Whether to return suggestions for invalid units
     * @returns Validation response
     */
    validateUnitString(
      unitString: string, 
      suggest?: boolean
    ): UcumValidationResponse;

    /**
     * Converts a value from one unit to another
     * @param value - The value to convert
     * @param fromUnit - The source unit
     * @param toUnit - The target unit
     * @returns Conversion result
     */
    convertUnitTo(
      value: string | number,
      fromUnit: string,
      toUnit: string
    ): UcumConversionResult;

    /**
     * Converts a unit expression to base units
     * @param value - The value to convert
     * @param unit - The unit to convert from
     * @returns Conversion result in base units
     */
    convertToBaseUnits(
      value: string | number,
      unit: string
    ): UcumConversionResult;

    /**
     * Gets a list of units that are commensurable with the given unit
     * @param unit - The unit to find commensurable units for
     * @returns Array of commensurable units
     */
    commensurablesList(unit: string): UcumCommensurableUnit[];

    /**
     * Checks if two units are commensurable (convertible)
     * @param unit1 - First unit
     * @param unit2 - Second unit
     * @returns True if units can be converted between each other
     */
    areUnitsCommensurable(unit1: string, unit2: string): boolean;

    /**
     * Gets unit definition details
     * @param unit - Unit code to look up
     * @returns Unit details or null if not found
     */
    getUnitDefinition(unit: string): UcumUnit | null;
  }

  export const UcumLhcUtils: {
    /**
     * Gets the singleton instance of UCUM utilities
     */
    getInstance(): UcumLhcUtils;
  };

  /**
   * UCUM Prefixes (e.g., 'k' for kilo, 'm' for milli)
   */
  export interface UcumPrefix {
    code: string;
    name: string;
    value: number;
  }

  /**
   * Error class for UCUM operations
   */
  export class UcumError extends Error {
    constructor(message: string);
    code?: string;
  }
}