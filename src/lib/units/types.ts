/**
 * Type definitions for the Unit Converter system
 */
import { MedicationProfile } from '../../types/MedicationProfile';

/**
 * Represents a unit of measurement
 */
export interface Unit {
  /** The unit code (e.g., 'mg', 'mL', '{click}') */
  code: string;
  /** Human-readable display name */
  display: string;
  /** Whether this is a custom device unit */
  isCustom: boolean;
  /** UCUM dimension if applicable */
  dimension?: string;
}

/**
 * Context information for conversions that require additional data
 */
export interface ConversionContext {
  /** Medication profile for strength/concentration data */
  medication?: MedicationProfile;
  /** Specific lot number for lot-specific conversions */
  lotNumber?: string;
  /** Air-prime loss (e.g., first N clicks wasted) */
  airPrimeLoss?: number;
  /** Custom conversion factors */
  customConversions?: CustomConversion[];
  /** Strength ratio for concentration conversions */
  strengthRatio?: {
    numerator: { value: number; unit: string };
    denominator: { value: number; unit: string };
  };
}

/**
 * Custom conversion definition
 */
export interface CustomConversion {
  /** Source unit */
  from: string;
  /** Target unit */
  to: string;
  /** Conversion factor */
  factor: number;
  /** Optional description */
  description?: string;
}

/**
 * Device unit definition for custom medical devices
 */
export interface DeviceUnit {
  /** Unit identifier (e.g., '{click}') */
  id: string;
  /** Display name (e.g., 'click') */
  display: string;
  /** Plural display (e.g., 'clicks') */
  pluralDisplay: string;
  /** UCUM unit this converts to */
  ratioTo: string;
  /** Conversion factor */
  factor: number;
  /** Device-specific metadata */
  metadata?: DeviceMetadata;
}

/**
 * Metadata for device units
 */
export interface DeviceMetadata {
  /** Device name (e.g., 'Topiclick') */
  device?: string;
  /** Air-prime loss (first N units wasted) */
  airPrimeLoss?: number;
  /** Lot-specific conversion factors */
  lotVariations?: Map<string, number>;
  /** Usage instructions */
  instructions?: string;
}

/**
 * Represents a step in the conversion process
 */
export interface ConversionStep {
  /** Step description */
  description: string;
  /** Input value */
  fromValue: number;
  /** Input unit */
  fromUnit: string;
  /** Output value */
  toValue: number;
  /** Output unit */
  toUnit: string;
  /** Factor applied */
  factor?: number;
  /** Type of conversion */
  type: 'standard' | 'device' | 'concentration' | 'custom';
}

/**
 * Successful conversion result
 */
export interface ConversionSuccess {
  /** The converted value */
  value: number;
  /** The original value */
  originalValue: number;
  /** The original unit */
  fromUnit: string;
  /** The target unit */
  toUnit: string;
  /** Conversion trace for debugging */
  trace: ConversionStep[];
  /** Conversion confidence score (0-1) */
  confidence?: number;
}

/**
 * Options for unit conversion
 */
export interface ConversionOptions {
  /** Enable detailed tracing */
  trace?: boolean;
  /** Precision tolerance (default: 1e-6) */
  tolerance?: number;
  /** Maximum conversion steps allowed */
  maxSteps?: number;
  /** Strict mode - fail on any warnings */
  strict?: boolean;
}

/**
 * Unit validation result
 */
export interface UnitValidation {
  /** Whether the unit is valid */
  valid: boolean;
  /** The normalized unit code */
  normalized?: string;
  /** Error message if invalid */
  error?: string;
  /** Suggested corrections */
  suggestions?: string[];
  /** Unit type (standard, device, compound) */
  type?: 'standard' | 'device' | 'compound';
}

/**
 * Interface for UCUM wrapper implementations
 */
export interface IUCUMWrapper {
  /** Convert between standard units */
  convert(value: number, from: string, to: string): number;
  /** Validate a unit string */
  validate(unit: string): UnitValidation;
  /** Get compatible units */
  getCompatibleUnits(unit: string): string[];
  /** Check if two units are compatible */
  areUnitsCompatible(unit1: string, unit2: string): boolean;
}

/**
 * Interface for device unit adapter
 */
export interface IDeviceUnitAdapter {
  /** Register a custom device unit */
  registerDeviceUnit(unit: DeviceUnit): void;
  /** Convert involving device units */
  convert(
    value: number, 
    from: string, 
    to: string, 
    context?: ConversionContext
  ): ConversionSuccess;
  /** Check if unit is a device unit */
  isDeviceUnit(unit: string): boolean;
  /** Get device unit metadata */
  getDeviceUnit(unit: string): DeviceUnit | undefined;
}

/**
 * Main unit converter interface
 */
export interface IUnitConverter {
  /** Convert between any units */
  convert(
    value: number,
    from: string,
    to: string,
    context?: ConversionContext,
    options?: ConversionOptions
  ): ConversionSuccess;
  
  /** Validate a unit */
  validate(unit: string): UnitValidation;
  
  /** Get explanation of last conversion */
  explain(): string;
  
  /** Get compatible units for a given unit */
  getCompatibleUnits(unit: string): Unit[];
  
  /** Register custom device unit */
  registerDeviceUnit(unit: DeviceUnit): void;
}