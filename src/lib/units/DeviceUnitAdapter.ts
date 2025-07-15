/**
 * Device Unit Adapter - Tier 2 of Two-Tier Anti-Corruption Layer
 * 
 * This adapter handles medication-specific device units that aren't part
 * of the standard UCUM specification, such as clicks (Topiclick), drops,
 * tablets, capsules, patches, etc.
 */
import {
  IDeviceUnitAdapter,
  IUCUMWrapper,
  DeviceUnit,
  ConversionContext,
  ConversionSuccess,
  ConversionStep
} from './types';
import {
  ConversionErrors,
  MissingContextError
} from './ConversionErrors';

/**
 * Default device unit definitions for common medical devices
 */
const DEFAULT_DEVICE_UNITS: DeviceUnit[] = [
  {
    id: '{click}',
    display: 'click',
    pluralDisplay: 'clicks',
    ratioTo: 'mL',
    factor: 0.25, // 4 clicks = 1 mL (Topiclick standard)
    metadata: {
      device: 'Topiclick',
      airPrimeLoss: 4, // First 4 clicks are wasted
      instructions: 'Prime device with 4 clicks before first use'
    }
  },
  {
    id: '{drop}',
    display: 'drop',
    pluralDisplay: 'drops',
    ratioTo: 'mL',
    factor: 0.05, // 20 drops = 1 mL (standard assumption)
    metadata: {
      instructions: 'Size may vary based on dropper and liquid viscosity'
    }
  },
  {
    id: '{tablet}',
    display: 'tablet',
    pluralDisplay: 'tablets',
    ratioTo: 'mg',
    factor: NaN, // Requires context (tablet strength)
    metadata: {
      instructions: 'Requires tablet strength for conversion to mass'
    }
  },
  {
    id: '{capsule}',
    display: 'capsule',
    pluralDisplay: 'capsules',
    ratioTo: 'mg',
    factor: NaN, // Requires context (capsule strength)
    metadata: {
      instructions: 'Requires capsule strength for conversion to mass'
    }
  },
  {
    id: '{patch}',
    display: 'patch',
    pluralDisplay: 'patches',
    ratioTo: 'mg',
    factor: NaN, // Requires context (patch strength)
    metadata: {
      instructions: 'Requires patch strength and duration for total dose'
    }
  },
  {
    id: '{puff}',
    display: 'puff',
    pluralDisplay: 'puffs',
    ratioTo: 'mcg',
    factor: NaN, // Requires context (dose per puff)
    metadata: {
      device: 'Inhaler',
      instructions: 'Requires dose per puff from medication information'
    }
  },
  {
    id: '{spray}',
    display: 'spray',
    pluralDisplay: 'sprays',
    ratioTo: 'mcg',
    factor: NaN, // Requires context (dose per spray)
    metadata: {
      device: 'Nasal spray',
      instructions: 'Requires dose per spray from medication information'
    }
  },
  {
    id: '{application}',
    display: 'application',
    pluralDisplay: 'applications',
    ratioTo: 'g',
    factor: NaN, // Highly variable
    metadata: {
      instructions: 'Amount varies based on area and thickness of application'
    }
  }
];

/**
 * Device Unit Adapter implementation
 */
export class DeviceUnitAdapter implements IDeviceUnitAdapter {
  private deviceUnits: Map<string, DeviceUnit> = new Map();
  
  constructor(private ucumWrapper: IUCUMWrapper) {
    // Register default device units
    DEFAULT_DEVICE_UNITS.forEach(unit => {
      this.registerDeviceUnit(unit);
    });
  }
  
  /**
   * Register a custom device unit
   */
  registerDeviceUnit(unit: DeviceUnit): void {
    this.deviceUnits.set(unit.id, unit);
  }
  
  /**
   * Check if a unit is a device unit
   */
  isDeviceUnit(unit: string): boolean {
    return this.deviceUnits.has(unit);
  }
  
  /**
   * Get device unit metadata
   */
  getDeviceUnit(unit: string): DeviceUnit | undefined {
    return this.deviceUnits.get(unit);
  }
  
  /**
   * Convert involving device units
   */
  convert(
    value: number,
    from: string,
    to: string,
    context?: ConversionContext
  ): ConversionSuccess {
    const trace: ConversionStep[] = [];
    
    // Check if either unit is a device unit
    const fromDevice = this.isDeviceUnit(from);
    const toDevice = this.isDeviceUnit(to);
    
    if (!fromDevice && !toDevice) {
      // Neither is a device unit, delegate to UCUM wrapper
      const convertedValue = this.ucumWrapper.convert(value, from, to);
      return {
        value: convertedValue,
        originalValue: value,
        fromUnit: from,
        toUnit: to,
        trace: [{
          description: 'Standard UCUM conversion',
          fromValue: value,
          fromUnit: from,
          toValue: convertedValue,
          toUnit: to,
          type: 'standard'
        }]
      };
    }
    
    // Handle device unit conversions
    if (fromDevice && toDevice) {
      // Both are device units
      return this.convertBetweenDeviceUnits(value, from, to, context, trace);
    } else if (fromDevice) {
      // From device to standard
      return this.convertFromDeviceUnit(value, from, to, context, trace);
    } else {
      // From standard to device
      return this.convertToDeviceUnit(value, from, to, context, trace);
    }
  }
  
  /**
   * Convert between two device units
   */
  private convertBetweenDeviceUnits(
    value: number,
    from: string,
    to: string,
    context: ConversionContext | undefined,
    trace: ConversionStep[]
  ): ConversionSuccess {
    const fromDevice = this.getDeviceUnit(from)!;
    const toDevice = this.getDeviceUnit(to)!;
    
    // Check if they convert to the same base unit
    if (fromDevice.ratioTo !== toDevice.ratioTo) {
      // Need to go through an intermediate unit
      const intermediateUnit = fromDevice.ratioTo;
      
      // Convert from source device to intermediate
      const intermediate = this.convertFromDeviceUnit(
        value, 
        from, 
        intermediateUnit, 
        context,
        trace
      );
      
      // Convert from intermediate to target device
      return this.convertToDeviceUnit(
        intermediate.value,
        intermediateUnit,
        to,
        context,
        trace
      );
    }
    
    // Direct conversion between compatible device units
    const fromFactor = this.getConversionFactor(fromDevice, context);
    const toFactor = this.getConversionFactor(toDevice, context);
    
    const baseValue = value * fromFactor;
    const finalValue = baseValue / toFactor;
    
    trace.push({
      description: `Convert ${from} to ${to} via ${fromDevice.ratioTo}`,
      fromValue: value,
      fromUnit: from,
      toValue: finalValue,
      toUnit: to,
      factor: fromFactor / toFactor,
      type: 'device'
    });
    
    return {
      value: finalValue,
      originalValue: value,
      fromUnit: from,
      toUnit: to,
      trace
    };
  }
  
  /**
   * Convert from device unit to standard unit
   */
  private convertFromDeviceUnit(
    value: number,
    from: string,
    to: string,
    context: ConversionContext | undefined,
    trace: ConversionStep[]
  ): ConversionSuccess {
    const deviceUnit = this.getDeviceUnit(from)!;
    const factor = this.getConversionFactor(deviceUnit, context);
    
    // Apply air-prime loss if applicable
    let effectiveValue = value;
    if (context?.airPrimeLoss && deviceUnit.metadata?.airPrimeLoss) {
      effectiveValue = Math.max(0, value - deviceUnit.metadata.airPrimeLoss);
      trace.push({
        description: `Air-prime adjustment: ${deviceUnit.metadata.airPrimeLoss} ${deviceUnit.pluralDisplay} wasted`,
        fromValue: value,
        fromUnit: from,
        toValue: effectiveValue,
        toUnit: from,
        type: 'device'
      });
    }
    
    // Convert to base unit
    const baseValue = effectiveValue * factor;
    const baseUnit = deviceUnit.ratioTo;
    
    trace.push({
      description: `Convert ${from} to ${baseUnit}`,
      fromValue: effectiveValue,
      fromUnit: from,
      toValue: baseValue,
      toUnit: baseUnit,
      factor,
      type: 'device'
    });
    
    // If target is the base unit, we're done
    if (baseUnit === to) {
      return {
        value: baseValue,
        originalValue: value,
        fromUnit: from,
        toUnit: to,
        trace
      };
    }
    
    // Otherwise, convert from base unit to target
    const finalValue = this.ucumWrapper.convert(baseValue, baseUnit, to);
    
    trace.push({
      description: `Convert ${baseUnit} to ${to}`,
      fromValue: baseValue,
      fromUnit: baseUnit,
      toValue: finalValue,
      toUnit: to,
      type: 'standard'
    });
    
    return {
      value: finalValue,
      originalValue: value,
      fromUnit: from,
      toUnit: to,
      trace
    };
  }
  
  /**
   * Convert from standard unit to device unit
   */
  private convertToDeviceUnit(
    value: number,
    from: string,
    to: string,
    context: ConversionContext | undefined,
    trace: ConversionStep[]
  ): ConversionSuccess {
    const deviceUnit = this.getDeviceUnit(to)!;
    const factor = this.getConversionFactor(deviceUnit, context);
    const baseUnit = deviceUnit.ratioTo;
    
    // Convert to base unit if needed
    let baseValue = value;
    if (from !== baseUnit) {
      baseValue = this.ucumWrapper.convert(value, from, baseUnit);
      trace.push({
        description: `Convert ${from} to ${baseUnit}`,
        fromValue: value,
        fromUnit: from,
        toValue: baseValue,
        toUnit: baseUnit,
        type: 'standard'
      });
    }
    
    // Convert from base unit to device unit
    const deviceValue = baseValue / factor;
    
    trace.push({
      description: `Convert ${baseUnit} to ${to}`,
      fromValue: baseValue,
      fromUnit: baseUnit,
      toValue: deviceValue,
      toUnit: to,
      factor: 1 / factor,
      type: 'device'
    });
    
    // Apply air-prime loss warning if applicable
    if (context?.airPrimeLoss && deviceUnit.metadata?.airPrimeLoss) {
      trace.push({
        description: `Note: First ${deviceUnit.metadata.airPrimeLoss} ${deviceUnit.pluralDisplay} will be wasted for priming`,
        fromValue: deviceValue,
        fromUnit: to,
        toValue: deviceValue + deviceUnit.metadata.airPrimeLoss,
        toUnit: to,
        type: 'device'
      });
    }
    
    return {
      value: deviceValue,
      originalValue: value,
      fromUnit: from,
      toUnit: to,
      trace
    };
  }
  
  /**
   * Get conversion factor for a device unit, considering context
   */
  private getConversionFactor(
    deviceUnit: DeviceUnit,
    context?: ConversionContext
  ): number {
    // Check for custom conversions in context first
    if (context?.customConversions) {
      const custom = context.customConversions.find(
        c => c.from === deviceUnit.id && c.to === deviceUnit.ratioTo
      );
      if (custom) {
        return custom.factor;
      }
    }
    
    // Check for medication-specific strength (for tablets, capsules, etc.)
    if (context?.medication && (deviceUnit.id === '{tablet}' || deviceUnit.id === '{capsule}')) {
      const ingredient = context.medication.ingredient?.[0];
      if (ingredient) {
        // Check if we have strengthQuantity (direct strength per unit)
        if (ingredient.strengthQuantity && 
            ingredient.strengthQuantity.unit === deviceUnit.ratioTo) {
          return ingredient.strengthQuantity.value;
        }
        
        // Check if we have strengthRatio where denominator is 1 unit
        if (ingredient.strengthRatio &&
            ingredient.strengthRatio.numerator.unit === deviceUnit.ratioTo &&
            ingredient.strengthRatio.denominator.value === 1 &&
            (ingredient.strengthRatio.denominator.unit === 'tablet' || 
             ingredient.strengthRatio.denominator.unit === 'capsule')) {
          return ingredient.strengthRatio.numerator.value;
        }
      }
    }
    
    // Check for lot-specific variations
    if (context?.lotNumber && deviceUnit.metadata?.lotVariations) {
      const lotFactor = deviceUnit.metadata.lotVariations.get(context.lotNumber);
      if (lotFactor !== undefined) {
        return lotFactor;
      }
    }
    
    // Check for NaN factor (requires context)
    if (isNaN(deviceUnit.factor)) {
      throw this.createMissingContextError(deviceUnit, context);
    }
    
    return deviceUnit.factor;
  }
  
  /**
   * Create appropriate missing context error
   */
  private createMissingContextError(
    deviceUnit: DeviceUnit,
    context?: ConversionContext
  ): MissingContextError {
    const requiredContext: string[] = [];
    
    switch (deviceUnit.id) {
      case '{tablet}':
      case '{capsule}':
        requiredContext.push('medication.ingredient[0].strengthQuantity', 'medication.ingredient[0].strengthRatio', 'customConversions');
        break;
      case '{patch}':
        requiredContext.push('medication.strength', 'patchDuration');
        break;
      case '{puff}':
      case '{spray}':
        requiredContext.push('medication.dosePerActuation');
        break;
      case '{application}':
        requiredContext.push('applicationAmount');
        break;
      default:
        requiredContext.push('conversionFactor');
    }
    
    return ConversionErrors.missingContext(
      requiredContext,
      `${deviceUnit.id} conversion`,
      context as Record<string, unknown>
    );
  }
}