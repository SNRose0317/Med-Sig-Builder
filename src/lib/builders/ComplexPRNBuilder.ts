/**
 * ComplexPRNBuilder
 * 
 * Specialized builder for complex PRN (as needed) medications with dose ranges,
 * frequency ranges, and maximum daily dose constraints. Handles sophisticated
 * PRN scenarios like "1-2 tablets every 4-6 hours as needed, max 6 tablets daily".
 * 
 * @since 3.2.0
 */

import { SimpleTabletBuilder } from './SimpleTabletBuilder';
import { 
  ISignatureBuilder, 
  DoseInput,
  TimingInput,
  isValidTimingInput
} from './ISignatureBuilder';
import { 
  IComplexRegimenBuilder, 
  DoseRangeInput,
  FrequencyRangeInput,
  MaxDailyDoseConstraint,
  TaperingPhase,
  ConditionalInstruction,
  InstructionRelationship,
  MultiIngredientDoseInput,
  ComplexRegimenBuilderState,
  isValidDoseRangeInput,
  isValidFrequencyRangeInput
} from './IComplexRegimenBuilder';
import { SignatureInstruction, Range } from '../../types/SignatureInstruction';
import { MedicationProfile } from '../../types/MedicationProfile';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';

/**
 * PRN timing configuration with ranges
 */
interface PRNTimingConfiguration {
  /** Minimum interval between doses (in hours) */
  minInterval: number;
  /** Maximum interval between doses (in hours) */
  maxInterval?: number;
  /** Maximum administrations per day */
  maxAdministrationsPerDay?: number;
  /** Warning threshold (percentage of max daily dose) */
  warningThreshold?: number;
}

/**
 * Complex PRN state tracking
 */
interface ComplexPRNState {
  /** Dose range configuration */
  doseRange?: DoseRangeInput;
  /** Frequency range configuration */
  frequencyRange?: FrequencyRangeInput;
  /** Maximum daily dose constraints */
  maxDailyConstraints: MaxDailyDoseConstraint[];
  /** PRN timing configuration */
  prnTiming?: PRNTimingConfiguration;
  /** Additional safety warnings */
  safetyWarnings: string[];
}

/**
 * Builder for complex PRN medications with ranges and constraints
 */
export class ComplexPRNBuilder extends SimpleTabletBuilder implements IComplexRegimenBuilder {
  
  // Complex regimen state
  protected complexState: ComplexRegimenBuilderState;
  
  // PRN-specific state
  private prnState: ComplexPRNState;
  
  constructor(medication: MedicationProfile) {
    super(medication);
    
    // Initialize complex regimen state
    this.complexState = {
      phases: [],
      conditionals: [],
      relationships: [],
      doseRanges: [],
      frequencyRanges: [],
      maxDailyConstraints: [],
      multiIngredientDoses: [],
      complexAuditTrail: []
    };
    
    // Initialize PRN-specific state
    this.prnState = {
      maxDailyConstraints: [],
      safetyWarnings: []
    };
    
    // Override audit trail to indicate ComplexPRN builder
    this.addAuditEntry('ComplexPRNBuilder initialized for advanced PRN dosing');
    this.validatePRNMedication();
  }

  /**
   * Build dose range for PRN medications (e.g., 1-2 tablets)
   */
  buildDoseRange(doseRange: DoseRangeInput): IComplexRegimenBuilder {
    if (!isValidDoseRangeInput(doseRange)) {
      throw new Error('Invalid dose range input');
    }

    this.prnState.doseRange = doseRange;
    this.complexState.doseRanges.push(doseRange);
    
    // Validate dose range against medication constraints
    this.validateDoseRange(doseRange);
    
    // Set the minimum dose as the base dose for validation purposes
    // This ensures the base builder has a valid dose configuration
    this.buildDose({ value: doseRange.minValue, unit: doseRange.unit });
    
    this.addComplexAuditEntry(`Added dose range: ${doseRange.minValue}-${doseRange.maxValue} ${doseRange.unit}`);
    
    return this;
  }

  /**
   * Build frequency range for PRN medications (e.g., every 4-6 hours)
   */
  buildFrequencyRange(frequencyRange: FrequencyRangeInput): IComplexRegimenBuilder {
    if (!isValidFrequencyRangeInput(frequencyRange)) {
      throw new Error('Invalid frequency range input');
    }

    this.prnState.frequencyRange = frequencyRange;
    this.complexState.frequencyRanges.push(frequencyRange);
    
    // Calculate PRN timing configuration
    this.calculatePRNTiming(frequencyRange);
    
    // Set the minimum frequency as the base timing for validation purposes
    // This ensures the base builder has a valid timing configuration
    this.buildTiming({ 
      frequency: frequencyRange.minFrequency, 
      period: frequencyRange.period, 
      periodUnit: frequencyRange.periodUnit 
    });
    
    // Validate frequency range for safety
    this.validateFrequencyRange(frequencyRange);
    
    this.addComplexAuditEntry(`Added frequency range: every ${frequencyRange.minFrequency}-${frequencyRange.maxFrequency} ${frequencyRange.periodUnit}`);
    
    return this;
  }

  /**
   * Build maximum daily dose constraints
   */
  buildMaxDailyDoseConstraint(constraint: MaxDailyDoseConstraint): IComplexRegimenBuilder {
    this.prnState.maxDailyConstraints.push(constraint);
    this.complexState.maxDailyConstraints.push(constraint);
    
    // Validate constraint against dose range
    this.validateMaxDailyConstraint(constraint);
    
    this.addComplexAuditEntry(`Added max daily dose constraint: ${constraint.maxDosePerDay.value} ${constraint.maxDosePerDay.unit}`);
    
    return this;
  }

  /**
   * Override buildDose to handle dose ranges
   */
  buildDose(dose: DoseInput): ISignatureBuilder {
    // If we have a dose range configured, validate against it
    if (this.prnState.doseRange) {
      this.validateDoseAgainstRange(dose);
    }
    
    // Call parent implementation
    super.buildDose(dose);
    
    return this;
  }

  /**
   * Override buildTiming to handle frequency ranges
   */
  buildTiming(timing: TimingInput): ISignatureBuilder {
    if (!isValidTimingInput(timing)) {
      throw new Error('Invalid timing input');
    }

    // If we have a frequency range, validate against it
    if (this.prnState.frequencyRange) {
      this.validateTimingAgainstRange(timing);
    }
    
    // Call parent implementation
    super.buildTiming(timing);
    
    return this;
  }

  /**
   * Generate final FHIR-compliant instruction with PRN ranges
   */
  getResult(): SignatureInstruction[] {
    // Get base instruction from parent
    const instructions = super.getResult();
    
    // Enhance with PRN range information
    if (this.prnState.doseRange || this.prnState.frequencyRange) {
      instructions[0] = this.enhanceInstructionWithPRNRanges(instructions[0]);
    }
    
    // Add PRN-specific instructions and warnings
    const prnInstructions = this.getPRNInstructions();
    if (prnInstructions.length > 0) {
      instructions[0].additionalInstructions = [
        ...(instructions[0].additionalInstructions || []),
        ...prnInstructions
      ];
      
      this.addAuditEntry(`Added ${prnInstructions.length} PRN-specific instructions`);
    }
    
    // Add maximum daily dose to FHIR structure
    if (this.prnState.maxDailyConstraints.length > 0) {
      this.addMaxDailyDoseToInstruction(instructions[0]);
    }
    
    return instructions;
  }

  /**
   * Generate complex regimen results with PRN relationships
   */
  getComplexResult(): SignatureInstruction[] {
    const baseInstructions = this.getResult();
    
    // Add PRN-specific relationship information
    if (this.complexState.relationships.length > 0) {
      baseInstructions[0].relationship = this.complexState.relationships[0];
    }
    
    return baseInstructions;
  }

  /**
   * Override to provide PRN context formatting
   */
  protected createMedicationRequestContext(): MedicationRequestContext {
    const context = super.createMedicationRequestContext();
    
    // Add PRN range information to context
    if (this.prnState.doseRange) {
      const rangeText = `${this.prnState.doseRange.minValue}-${this.prnState.doseRange.maxValue} ${this.prnState.doseRange.unit}`;
      context.dose = {
        value: this.prnState.doseRange.minValue, // Use min value as base
        unit: this.prnState.doseRange.unit
      };
      
      // Add range information to special instructions
      const existingInstructions = context.specialInstructions || '';
      context.specialInstructions = existingInstructions 
        ? `${existingInstructions}; Dose range: ${rangeText}`
        : `Dose range: ${rangeText}`;
    }
    
    return context;
  }

  /**
   * Calculate PRN timing configuration from frequency range
   */
  private calculatePRNTiming(frequencyRange: FrequencyRangeInput): void {
    // Convert frequency range to interval range
    const periodHours = this.convertPeriodToHours(frequencyRange.period, frequencyRange.periodUnit);
    
    // Calculate intervals (inverse of frequency)
    const maxInterval = periodHours / frequencyRange.minFrequency;
    const minInterval = periodHours / frequencyRange.maxFrequency;
    
    // Calculate maximum administrations per day
    const maxAdministrationsPerDay = Math.floor(24 / minInterval);
    
    this.prnState.prnTiming = {
      minInterval,
      maxInterval,
      maxAdministrationsPerDay,
      warningThreshold: 0.8 // 80% of max daily dose
    };
    
    this.addComplexAuditEntry(`Calculated PRN timing: ${minInterval.toFixed(1)}-${maxInterval.toFixed(1)} hour intervals, max ${maxAdministrationsPerDay} times daily`);
  }

  /**
   * Convert period to hours
   */
  private convertPeriodToHours(period: number, periodUnit: string): number {
    switch (periodUnit.toLowerCase()) {
      case 'h':
      case 'hour':
      case 'hours':
        return period;
      case 'd':
      case 'day':
      case 'days':
        return period * 24;
      case 'min':
      case 'minute':
      case 'minutes':
        return period / 60;
      default:
        return period; // Assume hours as default
    }
  }

  /**
   * Enhance instruction text with PRN range information
   */
  private enhanceInstructionWithPRNRanges(instruction: SignatureInstruction): SignatureInstruction {
    let enhancedText = instruction.text;
    
    // Replace dose with dose range if configured
    if (this.prnState.doseRange) {
      const rangeText = this.formatDoseRange(this.prnState.doseRange);
      // Find and replace the dose portion
      const dosePattern = /\d+(\.\d+)?\s+\w+/;
      enhancedText = enhancedText.replace(dosePattern, rangeText);
    }
    
    // Add frequency range information
    if (this.prnState.frequencyRange) {
      const frequencyText = this.formatFrequencyRange(this.prnState.frequencyRange);
      enhancedText = enhancedText.replace(/every \d+(\.\d+)? \w+/, frequencyText);
    }
    
    // Update FHIR doseAndRate with range
    const updatedDoseAndRate = this.buildDoseAndRateWithRange();
    
    return {
      ...instruction,
      text: enhancedText,
      doseAndRate: updatedDoseAndRate
    };
  }

  /**
   * Format dose range for display
   */
  private formatDoseRange(doseRange: DoseRangeInput): string {
    if (doseRange.minValue === doseRange.maxValue) {
      return `${doseRange.minValue} ${doseRange.unit}`;
    }
    
    const unit = doseRange.maxValue === 1 ? doseRange.unit : `${doseRange.unit}s`;
    return `${doseRange.minValue}-${doseRange.maxValue} ${unit}`;
  }

  /**
   * Format frequency range for display
   */
  private formatFrequencyRange(frequencyRange: FrequencyRangeInput): string {
    if (frequencyRange.minFrequency === frequencyRange.maxFrequency) {
      return `every ${frequencyRange.minFrequency} ${frequencyRange.periodUnit}`;
    }
    
    return `every ${frequencyRange.minFrequency}-${frequencyRange.maxFrequency} ${frequencyRange.periodUnit}`;
  }

  /**
   * Build FHIR dose and rate structure with range support
   */
  private buildDoseAndRateWithRange() {
    if (this.prnState.doseRange) {
      return [{
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type',
            code: 'ordered',
            display: 'Ordered'
          }]
        },
        doseRange: {
          low: {
            value: this.prnState.doseRange.minValue,
            unit: this.prnState.doseRange.unit
          },
          high: {
            value: this.prnState.doseRange.maxValue,
            unit: this.prnState.doseRange.unit
          }
        } as Range
      }];
    }
    
    // Fall back to parent implementation
    return super['buildDoseAndRate']();
  }

  /**
   * Get PRN-specific instructions and warnings
   */
  private getPRNInstructions(): Array<{text: string}> {
    const instructions: Array<{text: string}> = [];
    
    // Add maximum daily dose information
    if (this.prnState.maxDailyConstraints.length > 0) {
      const constraint = this.prnState.maxDailyConstraints[0];
      instructions.push({
        text: `Do not exceed ${constraint.maxDosePerDay.value} ${constraint.maxDosePerDay.unit} in 24 hours`
      });
      
      if (constraint.maxAdministrationsPerDay) {
        instructions.push({
          text: `Maximum ${constraint.maxAdministrationsPerDay} doses per day`
        });
      }
    }
    
    // Add minimum interval information
    if (this.prnState.prnTiming) {
      const timing = this.prnState.prnTiming;
      instructions.push({
        text: `Wait at least ${timing.minInterval} hours between doses`
      });
      
      if (timing.maxInterval && timing.maxInterval !== timing.minInterval) {
        instructions.push({
          text: `May space doses up to ${timing.maxInterval.toFixed(1)} hours apart`
        });
      }
    }
    
    // Add safety warnings
    this.prnState.safetyWarnings.forEach(warning => {
      instructions.push({ text: warning });
    });
    
    // Add general PRN guidance
    instructions.push({
      text: 'Take only when needed for symptoms'
    });
    
    if (this.medication.isControlled) {
      instructions.push({
        text: 'Controlled substance - use only as directed'
      });
    }
    
    return instructions;
  }

  /**
   * Add maximum daily dose to FHIR instruction
   */
  private addMaxDailyDoseToInstruction(instruction: SignatureInstruction): void {
    if (this.prnState.maxDailyConstraints.length > 0) {
      const constraint = this.prnState.maxDailyConstraints[0];
      
      instruction.maxDosePerPeriod = {
        numerator: {
          value: constraint.maxDosePerDay.value,
          unit: constraint.maxDosePerDay.unit
        },
        denominator: {
          value: 1,
          unit: 'd'
        }
      };
    }
  }

  /**
   * Validation methods
   */
  private validateDoseRange(doseRange: DoseRangeInput): void {
    // Check against medication dosage constraints with unit conversion
    if (this.medication.dosageConstraints?.minDose) {
      const minDose = this.medication.dosageConstraints.minDose;
      const minValueInMg = this.convertToMg(doseRange.minValue, doseRange.unit);
      const minDoseInMg = this.convertToMg(minDose.value, minDose.unit);
      
      if (minValueInMg < minDoseInMg) {
        throw new Error(`Dose range minimum ${doseRange.minValue} ${doseRange.unit} below medication minimum ${minDose.value} ${minDose.unit}`);
      }
    }
    
    if (this.medication.dosageConstraints?.maxDose) {
      const maxDose = this.medication.dosageConstraints.maxDose;
      const minValueInMg = this.convertToMg(doseRange.minValue, doseRange.unit);
      const maxValueInMg = this.convertToMg(doseRange.maxValue, doseRange.unit);
      const maxDoseInMg = this.convertToMg(maxDose.value, maxDose.unit);
      
      // If even the minimum dose exceeds medication maximum, that's a hard error
      if (minValueInMg > maxDoseInMg) {
        throw new Error(`Dose range minimum ${doseRange.minValue} ${doseRange.unit} exceeds medication maximum ${maxDose.value} ${maxDose.unit}`);
      }
      
      // If only the maximum dose exceeds limits, generate warning for clinical flexibility
      if (maxValueInMg > maxDoseInMg) {
        this.prnState.safetyWarnings.push(`Dose range maximum ${doseRange.maxValue} ${doseRange.unit} exceeds medication maximum ${maxDose.value} ${maxDose.unit} - verify with prescriber`);
      }
    }
    
    // Check for reasonable range
    if (doseRange.maxValue > doseRange.minValue * 10) {
      this.prnState.safetyWarnings.push('Large dose range detected - verify dosing requirements');
    }
  }

  /**
   * Convert dose value to mg for comparison
   */
  private convertToMg(value: number, unit: string): number {
    // If already in mg, return as-is
    if (unit === 'mg') {
      return value;
    }
    
    // For tablets, use strength ratio to convert
    if (unit === 'tablet' || unit === 'tablets') {
      const ingredient = this.medication.ingredient?.[0];
      if (ingredient?.strengthRatio) {
        const mgPerTablet = ingredient.strengthRatio.numerator.value;
        return value * mgPerTablet;
      }
    }
    
    // For unsupported units, return the value as-is (may cause validation issues)
    console.warn(`Unit conversion not supported for unit: ${unit}`);
    return value;
  }

  private validateFrequencyRange(frequencyRange: FrequencyRangeInput): void {
    // Check minimum interval is reasonable (not less than 1 hour for most medications)
    const periodHours = this.convertPeriodToHours(frequencyRange.period, frequencyRange.periodUnit);
    const minInterval = periodHours / frequencyRange.maxFrequency;
    
    if (minInterval < 1) {
      this.prnState.safetyWarnings.push('Very frequent dosing interval - verify safety');
    }
    
    // Check for reasonable frequency range
    if (frequencyRange.maxFrequency > frequencyRange.minFrequency * 5) {
      this.prnState.safetyWarnings.push('Wide frequency range detected - provide clear guidelines to patient');
    }
  }

  private validateMaxDailyConstraint(constraint: MaxDailyDoseConstraint): void {
    // Validate against dose range if present
    if (this.prnState.doseRange && this.prnState.prnTiming) {
      const maxPossibleDaily = this.prnState.doseRange.maxValue * this.prnState.prnTiming.maxAdministrationsPerDay!;
      
      if (constraint.maxDosePerDay.value < maxPossibleDaily) {
        this.addComplexAuditEntry(`Warning: Max daily dose (${constraint.maxDosePerDay.value}) less than theoretical maximum (${maxPossibleDaily.toFixed(1)})`);
      }
    }
  }

  private validateDoseAgainstRange(dose: DoseInput): void {
    if (!this.prnState.doseRange) return;
    
    if (dose.value < this.prnState.doseRange.minValue || dose.value > this.prnState.doseRange.maxValue) {
      throw new Error(`Dose ${dose.value} ${dose.unit} outside configured range ${this.prnState.doseRange.minValue}-${this.prnState.doseRange.maxValue} ${this.prnState.doseRange.unit}`);
    }
  }

  private validateTimingAgainstRange(timing: TimingInput): void {
    if (!this.prnState.frequencyRange) return;
    
    if (timing.frequency < this.prnState.frequencyRange.minFrequency || 
        timing.frequency > this.prnState.frequencyRange.maxFrequency) {
      throw new Error(`Frequency ${timing.frequency} outside configured range ${this.prnState.frequencyRange.minFrequency}-${this.prnState.frequencyRange.maxFrequency}`);
    }
  }

  private validatePRNMedication(): void {
    // Check if medication is appropriate for PRN use
    if (this.medication.defaultRoute && 
        !['oral', 'sublingual', 'topical', 'inhaled'].includes(this.medication.defaultRoute.toLowerCase())) {
      console.warn(`PRN builder used for medication with route: ${this.medication.defaultRoute}`);
    }
    
    this.addAuditEntry(`Validated PRN medication: ${this.medication.name}`);
  }

  // =============================================================================
  // IComplexRegimenBuilder Implementation (Required methods)
  // =============================================================================

  buildSequentialInstructions(phases: TaperingPhase[]): IComplexRegimenBuilder {
    this.complexState.phases = phases;
    this.addComplexAuditEntry(`Added ${phases.length} tapering phases`);
    return this;
  }

  buildConditionalLogic(conditional: ConditionalInstruction): IComplexRegimenBuilder {
    this.complexState.conditionals.push(conditional);
    this.addComplexAuditEntry(`Added conditional instruction: ${conditional.condition}`);
    return this;
  }

  buildRelationships(relationships: InstructionRelationship[]): IComplexRegimenBuilder {
    this.complexState.relationships = relationships;
    this.addComplexAuditEntry(`Added ${relationships.length} instruction relationships`);
    return this;
  }

  buildMultiIngredientDose(multiIngredientDose: MultiIngredientDoseInput): IComplexRegimenBuilder {
    this.complexState.multiIngredientDoses.push(multiIngredientDose);
    this.addComplexAuditEntry(`Added multi-ingredient dose configuration`);
    return this;
  }

  validateComplexRegimen(): string[] {
    const errors: string[] = [];
    
    // Validate PRN-specific constraints
    if (this.prnState.doseRange && this.prnState.maxDailyConstraints.length === 0) {
      errors.push('Dose range specified but no maximum daily dose constraint provided');
    }
    
    if (this.prnState.frequencyRange && !this.prnState.prnTiming) {
      errors.push('Frequency range specified but PRN timing not calculated');
    }
    
    return errors;
  }

  explainComplexRegimen(): string {
    const baseExplanation = this.explain();
    
    let complexExplanation = `${baseExplanation}\n\n--- Complex PRN Features ---\n`;
    
    if (this.prnState.doseRange) {
      complexExplanation += `Dose range: ${this.prnState.doseRange.minValue}-${this.prnState.doseRange.maxValue} ${this.prnState.doseRange.unit}\n`;
    }
    
    if (this.prnState.frequencyRange) {
      complexExplanation += `Frequency range: every ${this.prnState.frequencyRange.minFrequency}-${this.prnState.frequencyRange.maxFrequency} ${this.prnState.frequencyRange.periodUnit}\n`;
    }
    
    if (this.prnState.prnTiming) {
      const timing = this.prnState.prnTiming;
      complexExplanation += `Interval range: ${timing.minInterval.toFixed(1)}-${timing.maxInterval?.toFixed(1) || 'N/A'} hours\n`;
      complexExplanation += `Max daily administrations: ${timing.maxAdministrationsPerDay || 'N/A'}\n`;
    }
    
    if (this.prnState.maxDailyConstraints.length > 0) {
      complexExplanation += `Max daily constraints: ${this.prnState.maxDailyConstraints.length}\n`;
    }
    
    if (this.prnState.safetyWarnings.length > 0) {
      complexExplanation += `Safety warnings: ${this.prnState.safetyWarnings.length}\n`;
    }
    
    return complexExplanation;
  }

  /**
   * Add entry to complex audit trail
   */
  private addComplexAuditEntry(entry: string): void {
    const timestamp = new Date().toISOString();
    this.complexState.complexAuditTrail.push(`[${timestamp}] ${entry}`);
  }

  /**
   * Override builder type in JSON serialization
   */
  toJSON(): object {
    const baseJson = super.toJSON() as Record<string, unknown>;
    
    return {
      ...baseJson,
      builderType: 'ComplexPRNBuilder',
      prnFeatures: {
        hasDoseRange: !!this.prnState.doseRange,
        hasFrequencyRange: !!this.prnState.frequencyRange,
        maxDailyConstraints: this.prnState.maxDailyConstraints.length,
        safetyWarnings: this.prnState.safetyWarnings.length
      },
      prnState: this.prnState,
      complexState: this.complexState
    };
  }

  /**
   * Enhanced explanation with PRN capabilities
   */
  explain(): string {
    const baseExplanation = super.explain();
    
    let prnExplanation = `${baseExplanation}\n\n--- Complex PRN Features ---\n`;
    
    if (this.prnState.doseRange) {
      prnExplanation += `Dose range: ${this.formatDoseRange(this.prnState.doseRange)}\n`;
    }
    
    if (this.prnState.frequencyRange) {
      prnExplanation += `Frequency range: ${this.formatFrequencyRange(this.prnState.frequencyRange)}\n`;
    }
    
    if (this.prnState.maxDailyConstraints.length > 0) {
      const constraint = this.prnState.maxDailyConstraints[0];
      prnExplanation += `Max daily dose: ${constraint.maxDosePerDay.value} ${constraint.maxDosePerDay.unit}\n`;
    }
    
    if (this.prnState.safetyWarnings.length > 0) {
      prnExplanation += `Safety warnings: ${this.prnState.safetyWarnings.join('; ')}\n`;
    }
    
    return prnExplanation;
  }
}