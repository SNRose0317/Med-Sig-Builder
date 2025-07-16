/**
 * TaperingDoseBuilder
 * 
 * Specialized builder for medications with tapering schedules and sequential dose reductions.
 * Handles phase-based dosing, duration management, and FHIR sequential relationship modeling.
 * 
 * @since 3.2.0
 */

import { SimpleTabletBuilder } from './SimpleTabletBuilder';
import { 
  ISignatureBuilder, 
  DoseInput,
  TimingInput,
  isValidDoseInput,
  isValidTimingInput
} from './ISignatureBuilder';
import { 
  IComplexRegimenBuilder, 
  TaperingPhase,
  ConditionalInstruction,
  DoseRangeInput,
  FrequencyRangeInput,
  MaxDailyDoseConstraint,
  MultiIngredientDoseInput,
  ComplexRegimenBuilderState,
  isValidTaperingPhase
} from './IComplexRegimenBuilder';
import { SignatureInstruction, RelationshipType, InstructionRelationship } from '../../types/SignatureInstruction';
import { MedicationProfile } from '../../types/MedicationProfile';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';

/**
 * Phase transition types for tapering schedules
 */
export enum TaperingTransitionType {
  /** Immediate transition to next phase */
  IMMEDIATE = 'IMMEDIATE',
  /** Gradual reduction over time */
  GRADUAL = 'GRADUAL',
  /** Conditional transition based on symptoms */
  CONDITIONAL = 'CONDITIONAL',
  /** Provider-directed transition */
  PROVIDER_DIRECTED = 'PROVIDER_DIRECTED'
}

/**
 * Enhanced tapering phase with transition metadata
 */
export interface TaperingPhaseWithTransition extends TaperingPhase {
  /** Sequence number for ordering */
  sequenceNumber: number;
  /** Transition type to next phase */
  transitionType?: TaperingTransitionType;
  /** Minimum duration before allowing transition */
  minimumDuration?: {
    value: number;
    unit: string;
  };
  /** Conditions that must be met before transition */
  transitionConditions?: string[];
  /** Phase completion criteria */
  completionCriteria?: string;
}

/**
 * Tapering schedule state
 */
interface TaperingState {
  /** All phases in the tapering schedule */
  phases: TaperingPhaseWithTransition[];
  /** Current active phase (if any) */
  currentPhase?: TaperingPhaseWithTransition;
  /** Whether schedule is descending (tapering down) */
  isDescending: boolean;
  /** Total duration of tapering schedule */
  totalDuration?: {
    value: number;
    unit: string;
  };
  /** Safety monitoring requirements */
  monitoringRequirements: string[];
  /** Discontinuation warnings */
  discontinuationWarnings: string[];
}

/**
 * Builder for tapering dose schedules and sequential instructions
 */
export class TaperingDoseBuilder extends SimpleTabletBuilder implements IComplexRegimenBuilder {
  
  // Complex regimen state
  protected complexState: ComplexRegimenBuilderState;
  
  // Tapering-specific state
  private taperingState: TaperingState;
  
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
    
    // Initialize tapering state
    this.taperingState = {
      phases: [],
      isDescending: true,
      monitoringRequirements: [],
      discontinuationWarnings: []
    };
    
    // Override audit trail to indicate TaperingDose builder
    this.addAuditEntry('TaperingDoseBuilder initialized for sequential dosing');
    this.validateTaperingMedication();
  }

  /**
   * Build sequential instructions for tapering schedules
   */
  buildSequentialInstructions(phases: TaperingPhase[]): IComplexRegimenBuilder {
    // Validate all phases
    if (!phases.every(phase => isValidTaperingPhase(phase))) {
      throw new Error('Invalid tapering phases provided');
    }

    if (phases.length === 0) {
      throw new Error('At least one tapering phase is required');
    }

    // Convert to enhanced phases with sequence numbers
    const enhancedPhases: TaperingPhaseWithTransition[] = phases.map((phase, index) => ({
      ...phase,
      sequenceNumber: index + 1,
      transitionType: TaperingTransitionType.IMMEDIATE,
      minimumDuration: phase.duration
    }));

    // Store phases and validate sequence
    this.taperingState.phases = enhancedPhases;
    this.complexState.phases = phases;
    
    this.validateTaperingSequence();
    this.detectTaperingDirection();
    this.calculateTotalDuration();
    
    this.addComplexAuditEntry(`Added ${phases.length} sequential tapering phases`);
    this.addTaperingAnalysisToAudit();
    
    return this;
  }

  /**
   * Set current active phase
   */
  setCurrentPhase(phaseNumber: number): TaperingDoseBuilder {
    const phase = this.taperingState.phases.find(p => p.sequenceNumber === phaseNumber);
    if (!phase) {
      throw new Error(`Phase ${phaseNumber} not found in tapering schedule`);
    }

    this.taperingState.currentPhase = phase;
    
    // Apply the phase's dose and timing
    this.buildDose(phase.dose);
    this.buildTiming(phase.timing);
    
    this.addComplexAuditEntry(`Set current phase to ${phaseNumber}: ${phase.name}`);
    
    return this;
  }

  /**
   * Add monitoring requirements for tapering
   */
  addMonitoringRequirement(requirement: string): TaperingDoseBuilder {
    this.taperingState.monitoringRequirements.push(requirement);
    this.addComplexAuditEntry(`Added monitoring requirement: ${requirement}`);
    
    return this;
  }

  /**
   * Add discontinuation warning
   */
  addDiscontinuationWarning(warning: string): TaperingDoseBuilder {
    this.taperingState.discontinuationWarnings.push(warning);
    this.addComplexAuditEntry(`Added discontinuation warning: ${warning}`);
    
    return this;
  }

  /**
   * Generate complex regimen results with relationships
   */
  getComplexResult(): SignatureInstruction[] {
    if (this.taperingState.phases.length === 0) {
      throw new Error('No tapering phases configured');
    }

    const instructions: SignatureInstruction[] = [];
    const relationships: Array<{from: string, to: string, type: RelationshipType}> = [];

    // Generate instruction for each phase
    this.taperingState.phases.forEach((phase, index) => {
      const phaseInstruction = this.generatePhaseInstruction(phase, index);
      instructions.push(phaseInstruction);

      // Create sequential relationship to next phase
      if (index < this.taperingState.phases.length - 1) {
        relationships.push({
          from: phaseInstruction.id || `phase-${index + 1}`,
          to: `phase-${index + 2}`,
          type: RelationshipType.SEQUENTIAL
        });
      }
    });

    // Add relationships to complex state
    this.complexState.relationships = relationships.map(rel => ({
      sourceInstructionId: rel.from,
      targetInstructionId: rel.to,
      relationshipType: rel.type,
      description: 'Sequential tapering phase'
    }));

    // Add tapering-specific instructions
    this.addTaperingInstructions(instructions);

    this.addComplexAuditEntry(`Generated ${instructions.length} sequential instructions with ${relationships.length} relationships`);

    return instructions;
  }

  /**
   * Get current phase instruction only
   */
  getResult(): SignatureInstruction[] {
    if (this.taperingState.currentPhase) {
      const currentInstruction = this.generatePhaseInstruction(this.taperingState.currentPhase, 0);
      
      // Add tapering context to the instruction
      this.addTaperingContextToInstruction(currentInstruction);
      
      return [currentInstruction];
    }

    // If no current phase, generate instructions for all phases
    return this.getComplexResult();
  }

  /**
   * Validate complex regimen constraints
   */
  validateComplexRegimen(): string[] {
    const errors: string[] = [];

    // Validate phase sequence
    if (this.taperingState.phases.length === 0) {
      errors.push('No tapering phases configured');
      return errors;
    }

    // Validate dose progression
    const doseErrors = this.validateDoseProgression();
    errors.push(...doseErrors);

    // Validate timing consistency
    const timingErrors = this.validateTimingConsistency();
    errors.push(...timingErrors);

    // Validate duration logic
    const durationErrors = this.validateDurationLogic();
    errors.push(...durationErrors);

    // Validate medication-specific constraints
    const medicationErrors = this.validateMedicationConstraints();
    errors.push(...medicationErrors);

    return errors;
  }

  /**
   * Get detailed explanation of complex regimen logic
   */
  explainComplexRegimen(): string {
    const baseExplanation = this.explain();
    
    let complexExplanation = `${baseExplanation}\n\n--- Tapering Schedule Analysis ---\n`;
    
    if (this.taperingState.phases.length > 0) {
      complexExplanation += `Total phases: ${this.taperingState.phases.length}\n`;
      complexExplanation += `Direction: ${this.taperingState.isDescending ? 'Descending (tapering down)' : 'Ascending (tapering up)'}\n`;
      
      if (this.taperingState.totalDuration) {
        complexExplanation += `Total duration: ${this.taperingState.totalDuration.value} ${this.taperingState.totalDuration.unit}\n`;
      }
      
      complexExplanation += '\nPhase breakdown:\n';
      this.taperingState.phases.forEach((phase, index) => {
        const doseText = `${phase.dose.value} ${phase.dose.unit}`;
        const timingText = this.formatTimingForExplanation(phase.timing);
        const durationText = `${phase.duration.value} ${phase.duration.unit}`;
        
        complexExplanation += `  ${index + 1}. ${phase.name}: ${doseText} ${timingText} for ${durationText}\n`;
        
        if (phase.specialInstructions && phase.specialInstructions.length > 0) {
          complexExplanation += `     Instructions: ${phase.specialInstructions.join(', ')}\n`;
        }
      });
    }
    
    if (this.taperingState.monitoringRequirements.length > 0) {
      complexExplanation += '\nMonitoring requirements:\n';
      this.taperingState.monitoringRequirements.forEach(req => {
        complexExplanation += `  - ${req}\n`;
      });
    }
    
    if (this.taperingState.discontinuationWarnings.length > 0) {
      complexExplanation += '\nDiscontinuation warnings:\n';
      this.taperingState.discontinuationWarnings.forEach(warning => {
        complexExplanation += `  - ${warning}\n`;
      });
    }
    
    if (this.complexState.complexAuditTrail.length > 0) {
      complexExplanation += '\nTapering Operations:\n';
      this.complexState.complexAuditTrail.forEach(entry => {
        complexExplanation += `  - ${entry}\n`;
      });
    }
    
    return complexExplanation;
  }

  // =============================================================================
  // IComplexRegimenBuilder Implementation (Basic implementations for interface compliance)
  // =============================================================================

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

  buildDoseRange(doseRange: DoseRangeInput): IComplexRegimenBuilder {
    this.complexState.doseRanges.push(doseRange);
    this.addComplexAuditEntry(`Added dose range: ${doseRange.minValue}-${doseRange.maxValue} ${doseRange.unit}`);
    
    return this;
  }

  buildFrequencyRange(frequencyRange: FrequencyRangeInput): IComplexRegimenBuilder {
    this.complexState.frequencyRanges.push(frequencyRange);
    this.addComplexAuditEntry(`Added frequency range: every ${frequencyRange.minFrequency}-${frequencyRange.maxFrequency} ${frequencyRange.periodUnit}`);
    
    return this;
  }

  buildMaxDailyDoseConstraint(constraint: MaxDailyDoseConstraint): IComplexRegimenBuilder {
    this.complexState.maxDailyConstraints.push(constraint);
    this.addComplexAuditEntry(`Added max daily dose constraint: ${constraint.maxDosePerDay.value} ${constraint.maxDosePerDay.unit}`);
    
    return this;
  }

  buildMultiIngredientDose(multiIngredientDose: MultiIngredientDoseInput): IComplexRegimenBuilder {
    this.complexState.multiIngredientDoses.push(multiIngredientDose);
    this.addComplexAuditEntry(`Added multi-ingredient dose configuration`);
    
    return this;
  }

  // =============================================================================
  // Private Implementation Methods
  // =============================================================================

  /**
   * Generate instruction for a specific phase
   */
  private generatePhaseInstruction(phase: TaperingPhaseWithTransition, index: number): SignatureInstruction {
    // Temporarily set phase data
    const originalDose = this.state.dose;
    const originalTiming = this.state.timing;
    const originalRoute = this.state.route;
    
    // Apply phase dose and timing
    this.buildDose(phase.dose);
    this.buildTiming(phase.timing);
    
    // Ensure route is set for phase instruction
    if (!this.state.route) {
      this.buildRoute('by mouth');
    }
    
    // Generate base instruction
    const instructions = super.getResult();
    const phaseInstruction = { ...instructions[0] };
    
    // Restore original state
    this.state.dose = originalDose;
    this.state.timing = originalTiming;
    this.state.route = originalRoute;
    
    // Enhance with phase-specific information
    phaseInstruction.id = `phase-${phase.sequenceNumber}`;
    phaseInstruction.text = `Phase ${phase.sequenceNumber} (${phase.name}): ${phaseInstruction.text}`;
    
    // Add phase duration to timing (using bounds period)
    if (phaseInstruction.timing) {
      // For now, we'll add duration in a comment since Period is for start/end dates
      // In a real implementation, you'd calculate actual start/end dates
      phaseInstruction.timing.bounds = {
        start: new Date().toISOString(), // Current date as start
        end: new Date(Date.now() + this.convertDurationToMs(phase.duration)).toISOString()
      };
    }
    
    // Add phase-specific instructions
    const phaseInstructions: Array<{text: string}> = [];
    
    phaseInstructions.push({
      text: `Continue for ${phase.duration.value} ${phase.duration.unit}`
    });
    
    if (phase.specialInstructions && phase.specialInstructions.length > 0) {
      phase.specialInstructions.forEach(instruction => {
        phaseInstructions.push({ text: instruction });
      });
    }
    
    if (phase.transitionNote) {
      phaseInstructions.push({ text: `Next phase: ${phase.transitionNote}` });
    }
    
    // Add to additional instructions
    phaseInstruction.additionalInstructions = [
      ...(phaseInstruction.additionalInstructions || []),
      ...phaseInstructions
    ];
    
    return phaseInstruction;
  }

  /**
   * Add tapering-specific instructions to instruction set
   */
  private addTaperingInstructions(instructions: SignatureInstruction[]): void {
    if (instructions.length === 0) return;
    
    const generalInstructions: Array<{text: string}> = [];
    
    // Add schedule overview
    generalInstructions.push({
      text: `Complete tapering schedule: ${this.taperingState.phases.length} phases over ${this.getTotalDurationText()}`
    });
    
    // Add direction-specific warnings
    if (this.taperingState.isDescending) {
      generalInstructions.push({
        text: 'Do not stop abruptly - follow tapering schedule exactly'
      });
    }
    
    // Add monitoring requirements
    this.taperingState.monitoringRequirements.forEach(requirement => {
      generalInstructions.push({ text: requirement });
    });
    
    // Add discontinuation warnings
    this.taperingState.discontinuationWarnings.forEach(warning => {
      generalInstructions.push({ text: warning });
    });
    
    // Add medication-specific tapering warnings
    if (this.requiresSlowTapering()) {
      generalInstructions.push({
        text: 'This medication requires gradual dose reduction to prevent withdrawal symptoms'
      });
    }
    
    // Add to first instruction
    instructions[0].additionalInstructions = [
      ...(instructions[0].additionalInstructions || []),
      ...generalInstructions
    ];
  }

  /**
   * Add tapering context to current phase instruction
   */
  private addTaperingContextToInstruction(instruction: SignatureInstruction): void {
    if (!this.taperingState.currentPhase) return;
    
    const phase = this.taperingState.currentPhase;
    const contextInstructions: Array<{text: string}> = [];
    
    contextInstructions.push({
      text: `Current phase: ${phase.name} (${phase.sequenceNumber} of ${this.taperingState.phases.length})`
    });
    
    if (phase.duration) {
      contextInstructions.push({
        text: `Phase duration: ${phase.duration.value} ${phase.duration.unit}`
      });
    }
    
    // Find next phase
    const nextPhase = this.taperingState.phases.find(p => p.sequenceNumber === phase.sequenceNumber + 1);
    if (nextPhase) {
      const nextDoseText = `${nextPhase.dose.value} ${nextPhase.dose.unit}`;
      contextInstructions.push({
        text: `Next phase: Reduce to ${nextDoseText}`
      });
    } else {
      contextInstructions.push({
        text: 'Final phase - complete tapering schedule'
      });
    }
    
    instruction.additionalInstructions = [
      ...(instruction.additionalInstructions || []),
      ...contextInstructions
    ];
  }

  /**
   * Validate tapering medication is appropriate
   */
  private validateTaperingMedication(): void {
    // Check if medication commonly requires tapering
    const taperingMedications = [
      'prednisone', 'prednisolone', 'methylprednisolone', // Corticosteroids
      'lorazepam', 'clonazepam', 'diazepam', // Benzodiazepines
      'sertraline', 'paroxetine', 'venlafaxine', // Antidepressants
      'gabapentin', 'pregabalin' // Anticonvulsants
    ];
    
    const medName = this.medication.name.toLowerCase();
    const requiresTapering = taperingMedications.some(med => medName.includes(med));
    
    if (requiresTapering) {
      this.addMonitoringRequirement('Monitor for withdrawal symptoms during tapering');
      this.addDiscontinuationWarning('Do not discontinue abruptly without medical supervision');
    }
    
    this.addAuditEntry(`Validated tapering medication: ${this.medication.name} (requires gradual reduction: ${requiresTapering})`);
  }

  /**
   * Validate tapering sequence logic
   */
  private validateTaperingSequence(): void {
    if (this.taperingState.phases.length < 2) {
      console.warn('Tapering schedule should have at least 2 phases for gradual reduction');
    }
    
    // Check for sequence gaps
    const sequenceNumbers = this.taperingState.phases.map(p => p.sequenceNumber).sort((a, b) => a - b);
    for (let i = 1; i <= sequenceNumbers.length; i++) {
      if (!sequenceNumbers.includes(i)) {
        throw new Error(`Missing sequence number ${i} in tapering phases`);
      }
    }
    
    this.addComplexAuditEntry('Validated tapering sequence integrity');
  }

  /**
   * Detect tapering direction (ascending vs descending)
   */
  private detectTaperingDirection(): void {
    if (this.taperingState.phases.length < 2) return;
    
    const firstDose = this.taperingState.phases[0].dose.value;
    const lastDose = this.taperingState.phases[this.taperingState.phases.length - 1].dose.value;
    
    this.taperingState.isDescending = firstDose > lastDose;
    
    this.addComplexAuditEntry(`Detected tapering direction: ${this.taperingState.isDescending ? 'descending' : 'ascending'}`);
  }

  /**
   * Calculate total duration of tapering schedule
   */
  private calculateTotalDuration(): void {
    if (this.taperingState.phases.length === 0) return;
    
    // Convert all durations to days for calculation
    let totalDays = 0;
    
    this.taperingState.phases.forEach(phase => {
      const duration = phase.duration;
      let daysInPhase = duration.value;
      
      // Convert to days
      switch (duration.unit.toLowerCase()) {
        case 'week':
        case 'weeks':
        case 'w':
          daysInPhase *= 7;
          break;
        case 'month':
        case 'months':
        case 'mo':
          daysInPhase *= 30; // Approximate
          break;
        case 'day':
        case 'days':
        case 'd':
        default:
          // Already in days
          break;
      }
      
      totalDays += daysInPhase;
    });
    
    // Store as weeks if > 14 days, otherwise days
    if (totalDays > 14) {
      this.taperingState.totalDuration = {
        value: Math.round(totalDays / 7 * 10) / 10, // Round to 1 decimal
        unit: 'weeks'
      };
    } else {
      this.taperingState.totalDuration = {
        value: totalDays,
        unit: 'days'
      };
    }
    
    this.addComplexAuditEntry(`Calculated total duration: ${this.taperingState.totalDuration.value} ${this.taperingState.totalDuration.unit}`);
  }

  /**
   * Validate dose progression makes sense
   */
  private validateDoseProgression(): string[] {
    const errors: string[] = [];
    
    if (this.taperingState.phases.length < 2) return errors;
    
    const doses = this.taperingState.phases.map(p => p.dose.value);
    
    // Check for consistent progression
    let isConsistentlyDescending = true;
    let isConsistentlyAscending = true;
    
    for (let i = 1; i < doses.length; i++) {
      if (doses[i] >= doses[i - 1]) {
        isConsistentlyDescending = false;
      }
      if (doses[i] <= doses[i - 1]) {
        isConsistentlyAscending = false;
      }
    }
    
    if (!isConsistentlyDescending && !isConsistentlyAscending) {
      errors.push('Inconsistent dose progression - doses should consistently increase or decrease');
    }
    
    // Check for too-large dose jumps
    for (let i = 1; i < doses.length; i++) {
      const change = Math.abs(doses[i] - doses[i - 1]);
      const percentChange = change / doses[i - 1] * 100;
      
      if (percentChange > 50) {
        errors.push(`Large dose change detected between phases ${i} and ${i + 1}: ${percentChange.toFixed(1)}% change`);
      }
    }
    
    return errors;
  }

  /**
   * Validate timing consistency across phases
   */
  private validateTimingConsistency(): string[] {
    const errors: string[] = [];
    
    // Check that all phases have consistent timing patterns
    const firstTiming = this.taperingState.phases[0]?.timing;
    if (!firstTiming) return errors;
    
    this.taperingState.phases.forEach((phase, index) => {
      if (phase.timing.frequency !== firstTiming.frequency ||
          phase.timing.periodUnit !== firstTiming.periodUnit) {
        console.warn(`Phase ${index + 1} has different timing pattern than initial phase`);
      }
    });
    
    return errors;
  }

  /**
   * Validate duration logic
   */
  private validateDurationLogic(): string[] {
    const errors: string[] = [];
    
    this.taperingState.phases.forEach((phase, index) => {
      if (phase.duration.value <= 0) {
        errors.push(`Phase ${index + 1} has invalid duration: ${phase.duration.value}`);
      }
      
      // Warn about very short phases
      if (phase.duration.value < 3 && phase.duration.unit === 'days') {
        console.warn(`Phase ${index + 1} has very short duration: ${phase.duration.value} days`);
      }
    });
    
    return errors;
  }

  /**
   * Validate medication-specific constraints
   */
  private validateMedicationConstraints(): string[] {
    const errors: string[] = [];
    
    // Check against medication constraints
    this.taperingState.phases.forEach((phase, index) => {
      const constraints = this.medication.dosageConstraints;
      if (constraints) {
        if (constraints.minDose && phase.dose.value < constraints.minDose.value) {
          errors.push(`Phase ${index + 1} dose below medication minimum: ${phase.dose.value} < ${constraints.minDose.value}`);
        }
        
        if (constraints.maxDose && phase.dose.value > constraints.maxDose.value) {
          errors.push(`Phase ${index + 1} dose above medication maximum: ${phase.dose.value} > ${constraints.maxDose.value}`);
        }
      }
    });
    
    return errors;
  }

  /**
   * Check if medication requires slow tapering
   */
  private requiresSlowTapering(): boolean {
    const medName = this.medication.name.toLowerCase();
    const slowTaperingMeds = [
      'benzodiazepine', 'lorazepam', 'clonazepam', 'diazepam',
      'prednisone', 'prednisolone', 'steroid',
      'antidepressant', 'ssri', 'snri'
    ];
    
    return slowTaperingMeds.some(med => medName.includes(med));
  }

  /**
   * Get total duration as formatted text
   */
  private getTotalDurationText(): string {
    if (!this.taperingState.totalDuration) return 'unspecified duration';
    
    const duration = this.taperingState.totalDuration;
    return `${duration.value} ${duration.unit}`;
  }

  /**
   * Format timing for explanation text
   */
  private formatTimingForExplanation(timing: TimingInput): string {
    if (timing.frequency === 1) {
      return `once every ${timing.period} ${timing.periodUnit}`;
    } else {
      return `${timing.frequency} times every ${timing.period} ${timing.periodUnit}`;
    }
  }

  /**
   * Add tapering analysis to audit trail
   */
  private addTaperingAnalysisToAudit(): void {
    if (this.taperingState.phases.length > 0) {
      this.addComplexAuditEntry(`Tapering direction: ${this.taperingState.isDescending ? 'descending' : 'ascending'}`);
      
      if (this.taperingState.totalDuration) {
        this.addComplexAuditEntry(`Total duration: ${this.getTotalDurationText()}`);
      }
      
      // Log dose progression
      const doseProgression = this.taperingState.phases.map(p => `${p.dose.value}${p.dose.unit}`).join(' → ');
      this.addComplexAuditEntry(`Dose progression: ${doseProgression}`);
    }
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
      builderType: 'TaperingDoseBuilder',
      taperingFeatures: {
        phaseCount: this.taperingState.phases.length,
        isDescending: this.taperingState.isDescending,
        totalDuration: this.taperingState.totalDuration,
        hasMonitoring: this.taperingState.monitoringRequirements.length > 0,
        currentPhase: this.taperingState.currentPhase?.sequenceNumber
      },
      taperingState: this.taperingState,
      complexState: this.complexState
    };
  }

  /**
   * Convert duration to milliseconds
   */
  private convertDurationToMs(duration: { value: number; unit: string }): number {
    const msPerUnit: Record<string, number> = {
      'day': 24 * 60 * 60 * 1000,
      'days': 24 * 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'weeks': 7 * 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000, // Approximate
      'months': 30 * 24 * 60 * 60 * 1000,
      'mo': 30 * 24 * 60 * 60 * 1000
    };
    
    const multiplier = msPerUnit[duration.unit.toLowerCase()] || msPerUnit['day'];
    return duration.value * multiplier;
  }

  /**
   * Enhanced explanation with tapering capabilities
   */
  explain(): string {
    const baseExplanation = super.explain();
    
    if (this.taperingState.phases.length > 0) {
      const taperingInfo = `\n\n--- Tapering Features ---\n` +
                          `Phase count: ${this.taperingState.phases.length}\n` +
                          `Direction: ${this.taperingState.isDescending ? 'Descending (tapering down)' : 'Ascending (tapering up)'}\n` +
                          `Total duration: ${this.getTotalDurationText()}\n` +
                          `Current phase: ${this.taperingState.currentPhase?.sequenceNumber || 'Not set'}\n` +
                          `Monitoring requirements: ${this.taperingState.monitoringRequirements.length}\n` +
                          `Discontinuation warnings: ${this.taperingState.discontinuationWarnings.length}`;
      
      return baseExplanation + taperingInfo;
    }
    
    return baseExplanation;
  }
}