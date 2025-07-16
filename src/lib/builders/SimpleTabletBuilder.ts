/**
 * SimpleTabletBuilder
 * 
 * Proof-of-concept builder for oral solid medications (tablets, capsules)
 * with support for fractional dosing and scored tablet validation.
 * 
 * @since 3.0.0
 */

import { 
  ISignatureBuilder, 
  DoseInput, 
  TimingInput, 
  RouteInput,
  DoseConstraints,
  AsNeededInput,
  BuilderState,
  isValidDoseInput,
  isValidTimingInput
} from './ISignatureBuilder';
import { SignatureInstruction } from '../../types/SignatureInstruction';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';
import { MedicationProfile, ScoringType } from '../../types/MedicationProfile';
import { createTemplateEngine } from '../templates/templates';
import { TemplateEngine } from '../templates/types';
import { TemplateDataBuilder } from '../templates/TemplateDataBuilder';

/**
 * Builder for tablet and similar solid oral medications
 */
export class SimpleTabletBuilder implements ISignatureBuilder {
  private templateEngine: TemplateEngine;
  protected state: BuilderState;

  constructor(protected medication: MedicationProfile) {
    this.templateEngine = createTemplateEngine();
    this.state = {
      doses: [],
      timing: null,
      route: null,
      constraints: null,
      asNeeded: null,
      specialInstructions: [],
      auditTrail: []
    };
    
    this.addAuditEntry(`SimpleTabletBuilder initialized for ${medication.name}`);
    this.validateMedication();
  }

  /**
   * Configure dose with tablet-specific fractional validation
   */
  buildDose(dose: DoseInput): ISignatureBuilder {
    if (!isValidDoseInput(dose)) {
      throw new Error('Invalid dose input');
    }

    // Validate fractional doses against scoring
    this.validateFractionalDose(dose);

    this.state.doses.push(dose);
    this.addAuditEntry(`Added dose: ${this.formatDoseForAudit(dose)}`);
    
    return this;
  }

  /**
   * Set timing patterns
   */
  buildTiming(timing: TimingInput): ISignatureBuilder {
    if (!isValidTimingInput(timing)) {
      throw new Error('Invalid timing input');
    }

    this.state.timing = timing;
    this.addAuditEntry(`Set timing: ${timing.frequency} per ${timing.period} ${timing.periodUnit}`);
    
    return this;
  }

  /**
   * Set administration route
   */
  buildRoute(route: RouteInput): ISignatureBuilder {
    if (!route || typeof route !== 'string') {
      throw new Error('Invalid route input');
    }

    // Validate route for tablets (should be oral)
    this.validateRoute(route);

    this.state.route = route;
    this.addAuditEntry(`Set route: ${route}`);
    
    return this;
  }

  /**
   * Add dose constraints
   */
  buildConstraints(constraints: DoseConstraints): ISignatureBuilder {
    this.state.constraints = constraints;
    this.addAuditEntry('Added dose constraints');
    
    return this;
  }

  /**
   * Configure PRN instructions
   */
  buildAsNeeded(asNeeded: AsNeededInput): ISignatureBuilder {
    this.state.asNeeded = asNeeded;
    this.addAuditEntry(`Set as needed: ${asNeeded.indication || 'true'}`);
    
    return this;
  }

  /**
   * Add special instructions
   */
  buildSpecialInstructions(instructions: string[]): ISignatureBuilder {
    this.state.specialInstructions.push(...instructions);
    this.addAuditEntry(`Added ${instructions.length} special instructions`);
    
    return this;
  }

  /**
   * Generate final FHIR-compliant instruction
   */
  getResult(): SignatureInstruction[] {
    this.validateBuilderState();

    // Create medication request context for template rendering
    const context = this.createMedicationRequestContext();
    
    // Build template data
    const templateData = TemplateDataBuilder.forTablet(context);
    
    // Render instruction text
    const text = this.templateEngine.render('ORAL_TABLET_TEMPLATE', templateData);
    
    // Build FHIR instruction
    const instruction: SignatureInstruction = {
      text,
      doseAndRate: this.buildDoseAndRate(),
      timing: this.buildTimingStructure(),
      route: this.buildRouteStructure(),
      additionalInstructions: this.buildAdditionalInstructions()
    };

    this.addAuditEntry('Generated final instruction');
    
    return [instruction];
  }

  /**
   * Return audit trail
   */
  explain(): string {
    return this.state.auditTrail.join('\n');
  }

  /**
   * Serialize builder state
   */
  toJSON(): object {
    return {
      medication: this.medication,
      state: this.state,
      timestamp: new Date().toISOString(),
      builderType: 'SimpleTabletBuilder',
      version: '1.0.0'
    };
  }

  /**
   * Validate medication is appropriate for tablet builder
   */
  private validateMedication(): void {
    const doseForm = this.medication.doseForm?.toLowerCase() || '';
    const validForms = ['tablet', 'capsule', 'troche', 'odt'];
    
    if (!validForms.includes(doseForm)) {
      throw new Error(`Invalid dose form for TabletBuilder: ${this.medication.doseForm}. Expected: ${validForms.join(', ')}`);
    }
    
    this.addAuditEntry(`Validated dose form: ${this.medication.doseForm}`);
  }

  /**
   * Validate fractional doses against tablet scoring
   */
  private validateFractionalDose(dose: DoseInput): void {
    // Only validate if unit is tablet/capsule
    const unit = dose.unit.toLowerCase();
    if (!['tablet', 'tablets', 'capsule', 'capsules'].includes(unit)) {
      return; // Other units (mg, mcg) don't need fractional validation
    }

    const scoring = this.medication.isScored || ScoringType.NONE;
    
    // Check fractional constraints
    if (dose.value < 0.25) {
      throw new Error('Dose cannot be less than 1/4 tablet');
    }

    // Check if fraction is allowed by scoring
    const fraction = dose.value % 1;
    if (fraction !== 0) {
      if (scoring === ScoringType.NONE) {
        throw new Error(`Fractional dose ${dose.value} not allowed for unscored tablet`);
      }
      
      if (scoring === ScoringType.HALF && fraction !== 0.5) {
        throw new Error(`Only half-tablet doses allowed for half-scored tablet, got ${dose.value}`);
      }
      
      if (scoring === ScoringType.QUARTER) {
        const validFractions = [0.25, 0.5, 0.75];
        if (!validFractions.includes(fraction)) {
          throw new Error(`Invalid fraction ${fraction} for quarter-scored tablet. Allowed: 0.25, 0.5, 0.75`);
        }
      }
    }

    this.addAuditEntry(`Validated fractional dose ${dose.value} against scoring type ${scoring}`);
  }

  /**
   * Validate route is appropriate for tablets
   */
  private validateRoute(route: string): void {
    const routeLower = route.toLowerCase();
    const validRoutes = ['oral', 'orally', 'by mouth', 'po'];
    
    if (!validRoutes.some(valid => routeLower.includes(valid))) {
      console.warn(`Unusual route for tablet: ${route}. Expected oral route.`);
    }
  }

  /**
   * Validate builder has required state
   */
  private validateBuilderState(): void {
    if (!this.state.doses.length) {
      throw new Error('No doses configured');
    }
    
    if (!this.state.timing) {
      throw new Error('No timing configured');
    }
    
    if (!this.state.route) {
      throw new Error('No route configured');
    }
  }

  /**
   * Create MedicationRequestContext for template rendering
   */
  protected createMedicationRequestContext(): MedicationRequestContext {
    const dose = this.state.doses[0]; // Use first dose for primary instruction
    const timing = this.state.timing!;
    
    return {
      id: `tablet-builder-${Date.now()}`,
      timestamp: new Date().toISOString(),
      medication: this.medication,
      patient: {
        id: 'builder-patient',
        age: 45 // Default for builder context
      },
      dose: {
        value: dose.value,
        unit: dose.unit
      },
      frequency: this.formatFrequencyForContext(timing),
      route: this.state.route!,
      specialInstructions: this.state.specialInstructions.join('; ') || undefined,
      asNeeded: this.state.asNeeded?.indication,
      maxDosePerPeriod: this.state.constraints?.maxDosePerPeriod ? {
        dose: this.state.constraints.maxDosePerPeriod.dose,
        period: this.state.constraints.maxDosePerPeriod.period
      } : undefined
    };
  }

  /**
   * Build FHIR dose and rate structure
   */
  private buildDoseAndRate() {
    return this.state.doses.map(dose => ({
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type',
          code: 'ordered',
          display: 'Ordered'
        }]
      },
      doseQuantity: {
        value: dose.value,
        unit: dose.unit
      }
    }));
  }

  /**
   * Build FHIR timing structure
   */
  private buildTimingStructure() {
    if (!this.state.timing) return undefined;
    
    const timing = this.state.timing;
    
    return {
      repeat: {
        frequency: timing.frequency,
        period: timing.period,
        periodUnit: timing.periodUnit,
        when: timing.when
      }
    };
  }

  /**
   * Build FHIR route structure
   */
  private buildRouteStructure() {
    if (!this.state.route) return undefined;
    
    return {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '26643006', // Oral route
        display: this.state.route
      }]
    };
  }

  /**
   * Build additional instructions array
   */
  private buildAdditionalInstructions() {
    const additional = [];
    
    if (this.state.specialInstructions.length) {
      additional.push(...this.state.specialInstructions.map(inst => ({ text: inst })));
    }
    
    if (this.state.asNeeded?.asNeeded) {
      additional.push({
        text: `Take as needed${this.state.asNeeded.indication ? ` ${this.state.asNeeded.indication}` : ''}`
      });
    }
    
    return additional.length ? additional : undefined;
  }

  /**
   * Format frequency for MedicationRequestContext
   */
  private formatFrequencyForContext(timing: TimingInput): string {
    if (timing.frequency === 1 && timing.period === 1 && timing.periodUnit === 'd') {
      return 'once daily';
    }
    if (timing.frequency === 2 && timing.period === 1 && timing.periodUnit === 'd') {
      return 'twice daily';
    }
    if (timing.frequency === 3 && timing.period === 1 && timing.periodUnit === 'd') {
      return 'three times daily';
    }
    
    return `${timing.frequency} times per ${timing.period} ${timing.periodUnit}`;
  }

  /**
   * Format dose for audit trail
   */
  protected formatDoseForAudit(dose: DoseInput): string {
    if (dose.maxValue) {
      return `${dose.value}-${dose.maxValue} ${dose.unit}`;
    }
    return `${dose.value} ${dose.unit}`;
  }

  /**
   * Add entry to audit trail
   */
  protected addAuditEntry(entry: string): void {
    const timestamp = new Date().toISOString();
    this.state.auditTrail.push(`[${timestamp}] ${entry}`);
  }
}