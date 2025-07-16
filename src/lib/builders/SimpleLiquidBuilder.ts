/**
 * SimpleLiquidBuilder
 * 
 * Proof-of-concept builder for liquid medications with support for
 * volume/weight conversions and concentration handling.
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
import { MedicationProfile } from '../../types/MedicationProfile';
import { createTemplateEngine } from '../templates/templates';
import { TemplateEngine, TemplateData } from '../templates/types';
import { TemplateDataBuilder } from '../templates/TemplateDataBuilder';
import { UnitConverter } from '../units/UnitConverter';
import { ConversionContext } from '../units/types';

/**
 * Builder for liquid medications with concentration handling
 */
export class SimpleLiquidBuilder implements ISignatureBuilder {
  private templateEngine: TemplateEngine;
  private unitConverter: UnitConverter;
  protected state: BuilderState;

  constructor(protected medication: MedicationProfile) {
    this.templateEngine = createTemplateEngine();
    this.unitConverter = new UnitConverter();
    this.state = {
      doses: [],
      timing: null,
      route: null,
      constraints: null,
      asNeeded: null,
      specialInstructions: [],
      auditTrail: []
    };
    
    this.addAuditEntry(`SimpleLiquidBuilder initialized for ${medication.name}`);
    this.validateMedication();
  }

  /**
   * Configure dose with optional unit conversion
   */
  buildDose(dose: DoseInput): ISignatureBuilder {
    if (!isValidDoseInput(dose)) {
      throw new Error('Invalid dose input');
    }

    // Validate and potentially convert dose units
    this.validateAndProcessDose(dose);

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

    // Validate route for liquids
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
    
    // Build template data with dual dosing if applicable
    const templateData = this.buildLiquidTemplateData(context);
    
    // Render instruction text
    const text = this.templateEngine.render('LIQUID_DOSE_TEMPLATE', templateData);
    
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
      builderType: 'SimpleLiquidBuilder',
      version: '1.0.0'
    };
  }

  /**
   * Validate medication is appropriate for liquid builder
   */
  private validateMedication(): void {
    const doseForm = this.medication.doseForm?.toLowerCase() || '';
    const validForms = ['solution', 'suspension', 'syrup', 'elixir', 'tincture', 'injection', 'vial'];
    
    if (!validForms.includes(doseForm)) {
      console.warn(`Potentially invalid dose form for LiquidBuilder: ${this.medication.doseForm}. Expected: ${validForms.join(', ')}`);
    }
    
    this.addAuditEntry(`Validated dose form: ${this.medication.doseForm}`);
  }

  /**
   * Validate and process dose, handling conversions if needed
   */
  private validateAndProcessDose(dose: DoseInput): void {
    const unit = dose.unit.toLowerCase();
    
    // Check if we have concentration data and can do conversions
    if (this.medication.ingredient?.[0]?.strengthRatio) {
      const strengthRatio = this.medication.ingredient[0].strengthRatio;
      const mgPerMl = strengthRatio.numerator.value / strengthRatio.denominator.value;
      
      // Check for potential conversions
      if ((unit === 'mg' || unit === 'mcg') && strengthRatio.denominator.unit === 'mL') {
        this.addAuditEntry(`Weight dose detected with concentration available: ${mgPerMl} ${strengthRatio.numerator.unit}/mL`);
      } else if ((unit === 'ml' || unit === 'milliliter') && strengthRatio.numerator.unit === 'mg') {
        this.addAuditEntry(`Volume dose detected with concentration available: ${mgPerMl} mg/mL`);
      }
    }
    
    // Note: Basic validation (positive value, valid unit) is handled by isValidDoseInput
    
    if (dose.value > 1000 && (unit === 'ml' || unit === 'milliliter')) {
      console.warn(`Large volume dose: ${dose.value} ${dose.unit}. Please verify.`);
    }
  }

  /**
   * Validate route is appropriate for liquids
   */
  private validateRoute(route: string): void {
    const routeLower = route.toLowerCase();
    const oralRoutes = ['oral', 'orally', 'by mouth', 'po'];
    const injectionRoutes = ['im', 'intramuscular', 'iv', 'intravenous', 'sc', 'subcutaneous', 'sq'];
    const topicalRoutes = ['topical', 'topically'];
    
    const isValidRoute = [...oralRoutes, ...injectionRoutes, ...topicalRoutes]
      .some(valid => routeLower.includes(valid));
    
    if (!isValidRoute) {
      console.warn(`Unusual route for liquid: ${route}. Expected oral, injection, or topical route.`);
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
   * Build template data with dual dosing calculation
   */
  private buildLiquidTemplateData(context: MedicationRequestContext): TemplateData {
    const baseData = TemplateDataBuilder.forLiquid(context);
    
    // Calculate dual dosing if we have concentration and dose conversion
    const dose = this.state.doses[0];
    let dualDose = '';
    
    if (this.medication.ingredient?.[0]?.strengthRatio) {
      const strengthRatio = this.medication.ingredient[0].strengthRatio;
      
      // Try to calculate complementary dose (mg ↔ mL)
      try {
        const conversionContext: ConversionContext = {
          medication: this.medication
        };
        
        if (dose.unit.toLowerCase() === 'mg' && strengthRatio.denominator.unit === 'mL') {
          // Convert mg to mL
          const conversionResult = this.unitConverter.convert(
            dose.value, 
            'mg', 
            'mL', 
            conversionContext
          );
          
          if (conversionResult && typeof conversionResult.value === 'number') {
            dualDose = `, as ${conversionResult.value} mL`;
            this.addAuditEntry(`Calculated dual dose: ${dose.value} mg = ${conversionResult.value} mL`);
          }
        } else if ((dose.unit.toLowerCase() === 'ml' || dose.unit.toLowerCase() === 'milliliter') && strengthRatio.numerator.unit === 'mg') {
          // Convert mL to mg
          const conversionResult = this.unitConverter.convert(
            dose.value, 
            'mL', 
            'mg', 
            conversionContext
          );
          
          if (conversionResult && typeof conversionResult.value === 'number') {
            dualDose = `, as ${conversionResult.value} mg`;
            this.addAuditEntry(`Calculated dual dose: ${dose.value} mL = ${conversionResult.value} mg`);
          }
        }
      } catch (error) {
        // Conversion failed, continue without dual dose
        this.addAuditEntry(`Dual dose conversion failed: ${error}`);
      }
    }
    
    return {
      ...baseData,
      dualDose
    };
  }

  /**
   * Create MedicationRequestContext for template rendering
   */
  protected createMedicationRequestContext(): MedicationRequestContext {
    const dose = this.state.doses[0]; // Use first dose for primary instruction
    const timing = this.state.timing!;
    
    return {
      id: `liquid-builder-${Date.now()}`,
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
    
    // Determine SNOMED code based on route
    let snomedCode = '26643006'; // Default to oral
    const routeLower = this.state.route.toLowerCase();
    
    if (routeLower.includes('intramuscular') || routeLower.includes('im')) {
      snomedCode = '78421000';
    } else if (routeLower.includes('intravenous') || routeLower.includes('iv')) {
      snomedCode = '47625008';
    } else if (routeLower.includes('subcutaneous') || routeLower.includes('sc')) {
      snomedCode = '34206005';
    } else if (routeLower.includes('topical')) {
      snomedCode = '6064005';
    }
    
    return {
      coding: [{
        system: 'http://snomed.info/sct',
        code: snomedCode,
        display: this.state.route
      }]
    };
  }

  /**
   * Build additional instructions array
   */
  private buildAdditionalInstructions() {
    const additional = [];
    
    // Add shake instruction for suspensions
    if (this.medication.doseForm?.toLowerCase().includes('suspension')) {
      additional.push({ text: 'Shake well before use' });
    }
    
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