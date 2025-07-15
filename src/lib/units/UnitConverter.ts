/**
 * Unit Converter - Main conversion orchestrator
 * 
 * This is the main entry point for unit conversions in the medication signature builder.
 * It coordinates between the UCUM wrapper (Tier 1) and device unit adapter (Tier 2)
 * to provide comprehensive unit conversion capabilities with full traceability.
 */
import {
  IUnitConverter,
  IUCUMWrapper,
  IDeviceUnitAdapter,
  ConversionContext,
  ConversionOptions,
  ConversionSuccess,
  UnitValidation,
  Unit,
  DeviceUnit,
  ConversionStep
} from './types';
import { UCUMWrapper } from './UCUMWrapper';
import { DeviceUnitAdapter } from './DeviceUnitAdapter';
import {
  ConversionError,
  ConversionErrors,
  ImpossibleConversionError,
  MissingContextError,
  PrecisionError
} from './ConversionErrors';
import { ConfidenceScoreService } from '../confidence/ConfidenceScoreService';
import { ConfidenceScore } from '../confidence/types';
import { ConversionTracer } from '../tracing/ConversionTracer';
import { TracerOptions } from '../tracing/types';

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: Required<ConversionOptions> = {
  trace: true,
  tolerance: 1e-6,
  maxSteps: 10,
  strict: false
};

/**
 * Main Unit Converter implementation
 */
export class UnitConverter implements IUnitConverter {
  private ucumWrapper: IUCUMWrapper;
  private deviceAdapter: IDeviceUnitAdapter;
  private confidenceService: ConfidenceScoreService;
  private tracer: ConversionTracer;
  private lastConversion: ConversionSuccess | null = null;
  private lastConfidenceScore: ConfidenceScore | null = null;
  
  constructor(
    ucumWrapper?: IUCUMWrapper,
    deviceAdapter?: IDeviceUnitAdapter,
    confidenceService?: ConfidenceScoreService,
    tracerOptions?: TracerOptions | ConversionTracer
  ) {
    this.ucumWrapper = ucumWrapper || new UCUMWrapper();
    this.deviceAdapter = deviceAdapter || new DeviceUnitAdapter(this.ucumWrapper);
    this.confidenceService = confidenceService || new ConfidenceScoreService();
    
    // Accept either tracer options or an existing tracer instance
    if (tracerOptions instanceof ConversionTracer) {
      this.tracer = tracerOptions;
    } else {
      this.tracer = new ConversionTracer(tracerOptions);
    }
  }
  
  /**
   * Convert between any units with full context support
   */
  convert(
    value: number,
    from: string,
    to: string,
    context?: ConversionContext,
    options?: ConversionOptions
  ): ConversionSuccess {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const trace: ConversionStep[] = [];
    
    // Start conversion trace
    this.tracer.trace({
      type: 'conversion_start',
      description: `Convert ${value} ${from} to ${to}`,
      data: { value, fromUnit: from, toUnit: to, context: context ? '[provided]' : undefined }
    });
    
    try {
      // Validate inputs
      this.tracer.trace({
        type: 'validation_start',
        description: 'Validating input units'
      });
      
      this.validateInputs(value, from, to);
      
      this.tracer.trace({
        type: 'validation_end',
        description: 'Validating input units'
      });
      
      // Check for identity conversion
      if (from === to) {
        this.tracer.trace({
          type: 'adapter_selection',
          description: 'Identity conversion detected',
          data: { reason: 'fromUnit === toUnit' }
        });
        
        const identityTrace = opts.trace ? [{
          description: 'Identity conversion',
          fromValue: value,
          fromUnit: from,
          toValue: value,
          toUnit: to,
          type: 'standard' as const
        }] : [];
        
        const result: ConversionSuccess = {
          value,
          originalValue: value,
          fromUnit: from,
          toUnit: to,
          trace: identityTrace
        };
        
        // Calculate confidence for identity conversion
        this.tracer.trace({
          type: 'confidence_calculation',
          description: 'Calculating confidence score'
        });
        
        const confidenceTrace = this.confidenceService.createTraceFromSteps(
          identityTrace,
          { value, fromUnit: from, toUnit: to },
          {
            usedDefaults: false,
            hasLotSpecificData: context?.lotNumber !== undefined,
            missingRequiredContext: false
          }
        );
        
        this.lastConfidenceScore = this.confidenceService.calculate(confidenceTrace);
        result.confidence = this.lastConfidenceScore.score;
        
        this.tracer.trace({
          type: 'confidence_calculation',
          description: 'Calculating confidence score',
          data: { 
            score: result.confidence, 
            level: this.lastConfidenceScore.level 
          }
        });
        
        this.lastConversion = result;
        
        this.tracer.trace({
          type: 'conversion_end',
          description: 'Identity conversion complete',
          data: { result: value }
        });
        
        return result;
      }
      
      // Check if concentration conversion is needed
      if (this.isConcentrationConversion(from, to, context)) {
        this.tracer.trace({
          type: 'adapter_selection',
          description: 'Concentration conversion required',
          data: { reason: 'mass/volume conversion with strengthRatio' }
        });
        
        return this.handleConcentrationConversion(
          value, from, to, context, trace, opts
        );
      }
      
      // Delegate to device adapter (which handles both device and standard units)
      this.tracer.trace({
        type: 'adapter_selection',
        description: 'Using device adapter for conversion',
        data: { 
          isDeviceUnit: this.deviceAdapter.isDeviceUnit(from) || this.deviceAdapter.isDeviceUnit(to) 
        }
      });
      
      const result = this.deviceAdapter.convert(value, from, to, context);
      
      // Trace each conversion step
      result.trace.forEach(step => {
        this.tracer.trace({
          type: 'conversion_step',
          description: step.description,
          data: {
            fromValue: step.fromValue,
            fromUnit: step.fromUnit,
            toValue: step.toValue,
            toUnit: step.toUnit,
            factor: step.factor,
            stepType: step.type
          }
        });
      });
      
      // Apply precision check if in strict mode
      if (opts.strict && result.trace.length > 0) {
        this.checkPrecision(result, opts.tolerance);
      }
      
      // Update trace based on options
      if (!opts.trace) {
        result.trace = [];
      } else if (result.trace.length > opts.maxSteps) {
        throw new Error(`Conversion exceeded maximum steps (${opts.maxSteps})`);
      }
      
      // Calculate confidence score using the ConfidenceScoreService
      this.tracer.trace({
        type: 'confidence_calculation',
        description: 'Calculating conversion confidence'
      });
      
      const confidenceTrace = this.confidenceService.createTraceFromSteps(
        result.trace,
        { value, fromUnit: from, toUnit: to },
        {
          usedDefaults: context?.customConversions ? false : result.trace.some(s => s.type === 'device'),
          hasLotSpecificData: context?.lotNumber !== undefined,
          missingRequiredContext: false // We would have thrown earlier if required context was missing
        }
      );
      
      this.lastConfidenceScore = this.confidenceService.calculate(confidenceTrace);
      result.confidence = this.lastConfidenceScore.score;
      
      this.tracer.trace({
        type: 'confidence_calculation',
        description: 'Calculating conversion confidence',
        data: { 
          score: result.confidence, 
          level: this.lastConfidenceScore.level,
          steps: result.trace.length
        }
      });
      
      this.lastConversion = result;
      
      // Trace successful completion
      this.tracer.trace({
        type: 'conversion_end',
        description: 'Conversion complete',
        data: { 
          result: result.value,
          confidence: result.confidence,
          steps: result.trace.length
        }
      });
      
      return result;
      
    } catch (error) {
      // Trace the error
      this.tracer.trace({
        type: 'error',
        description: 'Conversion failed',
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          errorType: error?.constructor?.name,
          message: error instanceof Error ? error.message : String(error)
        }
      });
      
      // Re-throw conversion errors as-is
      if (error instanceof ConversionError) {
        throw error;
      }
      
      // Wrap other errors
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Validate a unit string
   */
  validate(unit: string): UnitValidation {
    // Check device units first
    if (this.deviceAdapter.isDeviceUnit(unit)) {
      const deviceUnit = this.deviceAdapter.getDeviceUnit(unit);
      return {
        valid: true,
        normalized: unit,
        type: 'device'
      };
    }
    
    // Check standard units
    return this.ucumWrapper.validate(unit);
  }
  
  /**
   * Get explanation of last conversion
   */
  explain(): string {
    if (!this.lastConversion) {
      return 'No conversion has been performed yet.';
    }
    
    // If we have a detailed confidence score, use its explanation
    if (this.lastConfidenceScore) {
      return this.lastConfidenceScore.explain();
    }
    
    // Otherwise, provide a basic explanation
    const { value, originalValue, fromUnit, toUnit, trace, confidence } = this.lastConversion;
    
    let explanation = `Converted ${originalValue} ${fromUnit} to ${value} ${toUnit}\n`;
    
    if (trace.length > 0) {
      explanation += '\nConversion steps:\n';
      trace.forEach((step, index) => {
        explanation += `${index + 1}. ${step.description}\n`;
        explanation += `   ${step.fromValue} ${step.fromUnit} → ${step.toValue} ${step.toUnit}`;
        if (step.factor) {
          explanation += ` (factor: ${step.factor})`;
        }
        explanation += '\n';
      });
    }
    
    if (confidence !== undefined) {
      explanation += `\nConfidence: ${(confidence * 100).toFixed(1)}%`;
    }
    
    return explanation;
  }
  
  /**
   * Get compatible units for a given unit
   */
  getCompatibleUnits(unit: string): Unit[] {
    const units: Unit[] = [];
    
    // Check if it's a device unit
    if (this.deviceAdapter.isDeviceUnit(unit)) {
      const deviceUnit = this.deviceAdapter.getDeviceUnit(unit)!;
      
      // Add the device unit itself
      units.push({
        code: deviceUnit.id,
        display: deviceUnit.display,
        isCustom: true,
        dimension: deviceUnit.ratioTo
      });
      
      // Add other device units with same base
      const allDeviceUnits = this.getAllDeviceUnits();
      allDeviceUnits.forEach(du => {
        if (du.id !== unit && du.ratioTo === deviceUnit.ratioTo) {
          units.push({
            code: du.id,
            display: du.display,
            isCustom: true,
            dimension: du.ratioTo
          });
        }
      });
      
      // Add compatible standard units
      const standardUnits = this.ucumWrapper.getCompatibleUnits(deviceUnit.ratioTo);
      standardUnits.forEach(su => {
        units.push({
          code: su,
          display: su,
          isCustom: false,
          dimension: deviceUnit.ratioTo
        });
      });
    } else {
      // Standard unit - get compatible units from UCUM
      const standardUnits = this.ucumWrapper.getCompatibleUnits(unit);
      standardUnits.forEach(su => {
        units.push({
          code: su,
          display: su,
          isCustom: false
        });
      });
      
      // Add device units that convert to compatible dimensions
      const validation = this.ucumWrapper.validate(unit);
      if (validation.valid) {
        const allDeviceUnits = this.getAllDeviceUnits();
        allDeviceUnits.forEach(du => {
          if (this.ucumWrapper.areUnitsCompatible(unit, du.ratioTo)) {
            units.push({
              code: du.id,
              display: du.display,
              isCustom: true,
              dimension: du.ratioTo
            });
          }
        });
      }
    }
    
    return units;
  }
  
  /**
   * Register custom device unit
   */
  registerDeviceUnit(unit: DeviceUnit): void {
    this.deviceAdapter.registerDeviceUnit(unit);
  }
  
  /**
   * Validate conversion inputs
   */
  private validateInputs(value: number, from: string, to: string): void {
    if (!isFinite(value)) {
      throw new Error('Value must be a finite number');
    }
    
    const fromValidation = this.validate(from);
    if (!fromValidation.valid) {
      throw ConversionErrors.invalidUnit(
        from,
        fromValidation.error,
        fromValidation.suggestions
      );
    }
    
    const toValidation = this.validate(to);
    if (!toValidation.valid) {
      throw ConversionErrors.invalidUnit(
        to,
        toValidation.error,
        toValidation.suggestions
      );
    }
  }
  
  /**
   * Check if conversion requires concentration context
   */
  private isConcentrationConversion(
    from: string,
    to: string,
    context?: ConversionContext
  ): boolean {
    // Only use concentration conversion if context provides strengthRatio
    if (!context?.strengthRatio) {
      return false;
    }
    
    // Simple heuristic: mass to volume or volume to mass typically needs concentration
    const fromValidation = this.validate(from);
    const toValidation = this.validate(to);
    
    if (!fromValidation.valid || !toValidation.valid) {
      return false;
    }
    
    // Check if we're converting between mass and volume
    const massUnits = ['pg', 'ng', 'mcg', 'μg', 'mg', 'g', 'kg'];
    const volumeUnits = ['μL', 'uL', 'mL', 'dL', 'L'];
    
    const fromIsMass = massUnits.includes(from) || 
      (this.deviceAdapter.isDeviceUnit(from) && 
       massUnits.includes(this.deviceAdapter.getDeviceUnit(from)?.ratioTo || ''));
    
    const toIsVolume = volumeUnits.includes(to) ||
      (this.deviceAdapter.isDeviceUnit(to) &&
       volumeUnits.includes(this.deviceAdapter.getDeviceUnit(to)?.ratioTo || ''));
    
    const fromIsVolume = volumeUnits.includes(from) ||
      (this.deviceAdapter.isDeviceUnit(from) &&
       volumeUnits.includes(this.deviceAdapter.getDeviceUnit(from)?.ratioTo || ''));
    
    const toIsMass = massUnits.includes(to) ||
      (this.deviceAdapter.isDeviceUnit(to) &&
       massUnits.includes(this.deviceAdapter.getDeviceUnit(to)?.ratioTo || ''));
    
    return (fromIsMass && toIsVolume) || (fromIsVolume && toIsMass);
  }
  
  /**
   * Handle concentration-based conversions
   */
  private handleConcentrationConversion(
    value: number,
    from: string,
    to: string,
    context: ConversionContext | undefined,
    trace: ConversionStep[],
    options: Required<ConversionOptions>
  ): ConversionSuccess {
    this.tracer.trace({
      type: 'conversion_step',
      description: 'Starting concentration-based conversion',
      data: { 
        value, 
        from, 
        to,
        hasStrengthRatio: !!context?.strengthRatio 
      }
    });
    
    // Check if we have strength ratio in context
    if (!context?.strengthRatio) {
      throw ConversionErrors.missingContext(
        ['strengthRatio'],
        `${from} to ${to} conversion`,
        context as Record<string, unknown>
      );
    }
    
    const { numerator, denominator } = context.strengthRatio;
    
    // Validate strength ratio units
    const numValidation = this.validate(numerator.unit);
    const denomValidation = this.validate(denominator.unit);
    
    if (!numValidation.valid || !denomValidation.valid) {
      throw new Error('Invalid units in strength ratio');
    }
    
    // Convert through the concentration
    // Example: 2 mL of 100 mg/mL = 200 mg
    let result: number;
    
    // Determine if we're converting volume to mass or mass to volume
    const volumeUnits = ['μL', 'uL', 'mL', 'dL', 'L'];
    const fromIsVolume = volumeUnits.includes(from) ||
      (this.deviceAdapter.isDeviceUnit(from) &&
       volumeUnits.includes(this.deviceAdapter.getDeviceUnit(from)?.ratioTo || ''));
    
    if (fromIsVolume) {
      // Converting from volume to mass
      // First convert input to denominator unit if needed
      let volumeInDenomUnit = value;
      let currentUnit = from;
      
      if (from !== denominator.unit) {
        try {
          const volumeConversion = this.deviceAdapter.convert(
            value, from, denominator.unit, context
          );
          volumeInDenomUnit = volumeConversion.value;
          currentUnit = denominator.unit;
          trace.push(...volumeConversion.trace);
        } catch (e) {
          // If direct conversion fails, we need better unit compatibility checking
          throw new Error(`Cannot convert ${from} to ${denominator.unit} for concentration calculation`);
        }
      }
      
      // Apply concentration
      const massValue = (volumeInDenomUnit * numerator.value) / denominator.value;
      
      trace.push({
        description: `Apply concentration ${numerator.value} ${numerator.unit}/${denominator.value} ${denominator.unit}`,
        fromValue: volumeInDenomUnit,
        fromUnit: currentUnit,
        toValue: massValue,
        toUnit: numerator.unit,
        factor: numerator.value / denominator.value,
        type: 'concentration'
      });
      
      // Convert to target unit
      if (numerator.unit !== to) {
        const finalConversion = this.deviceAdapter.convert(
          massValue, numerator.unit, to, context
        );
        trace.push(...finalConversion.trace);
        result = finalConversion.value;
      } else {
        result = massValue;
      }
    } else {
      // Converting from mass to volume
      // First convert input to numerator unit if needed
      let massInNumUnit = value;
      let currentUnit = from;
      
      if (from !== numerator.unit) {
        try {
          const massConversion = this.deviceAdapter.convert(
            value, from, numerator.unit, context
          );
          massInNumUnit = massConversion.value;
          currentUnit = numerator.unit;
          trace.push(...massConversion.trace);
        } catch (e) {
          // If direct conversion fails, we need better unit compatibility checking
          throw new Error(`Cannot convert ${from} to ${numerator.unit} for concentration calculation`);
        }
      }
      
      // Apply inverse concentration
      const volumeValue = (massInNumUnit * denominator.value) / numerator.value;
      
      trace.push({
        description: `Apply inverse concentration ${denominator.value} ${denominator.unit}/${numerator.value} ${numerator.unit}`,
        fromValue: massInNumUnit,
        fromUnit: currentUnit,
        toValue: volumeValue,
        toUnit: denominator.unit,
        factor: denominator.value / numerator.value,
        type: 'concentration'
      });
      
      // Convert to target unit
      if (denominator.unit !== to) {
        const finalConversion = this.deviceAdapter.convert(
          volumeValue, denominator.unit, to, context
        );
        trace.push(...finalConversion.trace);
        result = finalConversion.value;
      } else {
        result = volumeValue;
      }
    }
    
    const finalResult: ConversionSuccess = {
      value: result,
      originalValue: value,
      fromUnit: from,
      toUnit: to,
      trace
    };
    
    // Check max steps constraint
    if (options.trace && trace.length > options.maxSteps) {
      throw new Error(`Conversion exceeded maximum steps (${options.maxSteps})`);
    }
    
    // Update trace based on options
    if (!options.trace) {
      finalResult.trace = [];
    }
    
    // Calculate confidence score using the ConfidenceScoreService
    const confidenceTrace = this.confidenceService.createTraceFromSteps(
      trace,
      { value, fromUnit: from, toUnit: to },
      {
        usedDefaults: false, // Concentration conversions use explicit strength ratio
        hasLotSpecificData: context?.lotNumber !== undefined,
        missingRequiredContext: false // We would have thrown earlier if strengthRatio was missing
      }
    );
    
    this.lastConfidenceScore = this.confidenceService.calculate(confidenceTrace);
    finalResult.confidence = this.lastConfidenceScore.score;
    
    this.lastConversion = finalResult;
    return finalResult;
  }
  
  /**
   * Check precision constraints
   */
  private checkPrecision(result: ConversionSuccess, tolerance: number): void {
    // Don't check precision for very small or very large values
    if (Math.abs(result.value) < 1e-10 || Math.abs(result.value) > 1e10) {
      return;
    }
    
    // Check for significant rounding errors
    const expectedDigits = -Math.floor(Math.log10(tolerance));
    const roundedValue = Number(result.value.toFixed(expectedDigits));
    const absoluteError = Math.abs(result.value - roundedValue);
    const relativeError = absoluteError / Math.abs(result.value);
    
    if (relativeError > tolerance) {
      throw ConversionErrors.precisionLoss(
        result.originalValue,
        result.fromUnit,
        result.toUnit,
        tolerance,
        relativeError
      );
    }
  }
  
  
  /**
   * Get all registered device units
   */
  private getAllDeviceUnits(): DeviceUnit[] {
    // This is a bit of a hack - we'd ideally have a method on IDeviceUnitAdapter
    // For now, we'll check common device units
    const commonDeviceUnits = [
      '{click}', '{drop}', '{tablet}', '{capsule}',
      '{patch}', '{puff}', '{spray}', '{application}'
    ];
    
    const units: DeviceUnit[] = [];
    for (const unitId of commonDeviceUnits) {
      const unit = this.deviceAdapter.getDeviceUnit(unitId);
      if (unit) {
        units.push(unit);
      }
    }
    
    return units;
  }
  
  /**
   * Get the tracer instance for debugging and export
   */
  getTracer(): ConversionTracer {
    return this.tracer;
  }
  
  /**
   * Enable/disable tracing
   */
  setTracingEnabled(enabled: boolean): void {
    this.tracer.setEnabled(enabled);
  }
  
  /**
   * Export trace in specified format
   */
  exportTrace(format: 'json' | 'dot' | 'text' = 'text'): string {
    return this.tracer.export(format);
  }
}