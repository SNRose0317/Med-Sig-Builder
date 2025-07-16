/**
 * TopiclickBuilder
 * 
 * Specialized builder for medications using the Topiclick dispensing system.
 * Handles 4 clicks = 1 mL conversion with air-prime loss accounting and
 * device-specific formatting and instructions.
 * 
 * @since 3.1.0
 */

import { SimpleLiquidBuilder } from './SimpleLiquidBuilder';
import { 
  ISignatureBuilder, 
  DoseInput,
  isValidDoseInput
} from './ISignatureBuilder';
import { SignatureInstruction } from '../../types/SignatureInstruction';
import { MedicationProfile } from '../../types/MedicationProfile';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';

/**
 * Builder for medications using Topiclick dispensing system
 */
export class TopiclickBuilder extends SimpleLiquidBuilder {
  private readonly CLICKS_PER_ML = 4;
  private readonly AIR_PRIME_LOSS_CLICKS = 4;
  
  // Store original dose for display formatting
  private originalDose?: DoseInput;
  
  constructor(medication: MedicationProfile) {
    super(medication);
    
    // Override audit trail to indicate Topiclick builder
    this.addAuditEntry('TopiclickBuilder initialized for Topiclick dispenser support');
    this.validateTopiclickMedication();
  }


  /**
   * Generate final FHIR-compliant instruction with Topiclick formatting
   * 
   * @returns Array of SignatureInstruction with Topiclick-specific formatting
   */
  getResult(): SignatureInstruction[] {
    // Get base instruction from parent
    const instructions = super.getResult();
    
    // Apply Topiclick-specific formatting if we have click dose
    if (this.originalDose && (this.originalDose.unit === 'click' || this.originalDose.unit === 'clicks')) {
      instructions[0] = this.formatTopiclickInstruction(instructions[0]);
    }
    
    // Add Topiclick-specific instructions
    const topiclickInstructions = this.getTopiclickInstructions();
    if (topiclickInstructions.length > 0) {
      instructions[0].additionalInstructions = [
        ...(instructions[0].additionalInstructions || []),
        ...topiclickInstructions
      ];
      
      this.addAuditEntry(`Added ${topiclickInstructions.length} Topiclick-specific instructions`);
    }
    
    return instructions;
  }

  /**
   * Override to provide Topiclick context formatting
   */
  protected createMedicationRequestContext(): MedicationRequestContext {
    const context = super.createMedicationRequestContext();
    
    // Keep the original dose structure but add custom formatting in the template
    // The template will handle the display formatting
    
    return context;
  }

  /**
   * Format instruction text for Topiclick display
   */
  private formatTopiclickInstruction(instruction: SignatureInstruction): SignatureInstruction {
    if (!this.originalDose) return instruction;
    
    const clickDisplay = this.formatClickDisplay(this.originalDose.value);
    
    // Replace mL references with click display
    const mlPattern = /\d+(\.\d+)?\s*mL/g;
    const modifiedText = instruction.text?.replace(mlPattern, clickDisplay) || instruction.text;
    
    return {
      ...instruction,
      text: modifiedText
    };
  }

  /**
   * Format click display as "X clicks (Y mg)"
   */
  private formatClickDisplay(clicks: number): string {
    const clickText = clicks === 1 ? 'click' : 'clicks';
    const mgValue = this.calculateMgFromClicks(clicks);
    
    if (mgValue !== null) {
      return `${clicks} ${clickText} (${mgValue.toFixed(1)} mg)`;
    } else {
      const mlValue = clicks / this.CLICKS_PER_ML;
      return `${clicks} ${clickText} (${mlValue} mL)`;
    }
  }

  /**
   * Calculate mg equivalent from clicks using medication concentration
   */
  private calculateMgFromClicks(clicks: number): number | null {
    const mlValue = clicks / this.CLICKS_PER_ML;
    
    // Try to get concentration from medication
    const ingredient = this.medication.ingredient?.[0];
    if (ingredient?.strengthRatio) {
      const ratio = ingredient.strengthRatio;
      const mgPerMl = ratio.numerator.value / ratio.denominator.value;
      return mlValue * mgPerMl;
    }
    
    // Try concentrationRatio if available
    if (this.medication.concentrationRatio) {
      const ratio = this.medication.concentrationRatio;
      const mgPerMl = ratio.numerator.value / ratio.denominator.value;
      return mlValue * mgPerMl;
    }
    
    return null;
  }

  /**
   * Get Topiclick-specific instructions
   */
  private getTopiclickInstructions(): Array<{text: string}> {
    // Only add instructions if we have a click dose
    if (!this.originalDose || (this.originalDose.unit !== 'click' && this.originalDose.unit !== 'clicks')) {
      return [];
    }
    
    const instructions: Array<{text: string}> = [];
    
    // Add priming instruction
    instructions.push({
      text: 'Prime device with 4 clicks before first use'
    });
    
    // Add volume per click instruction
    instructions.push({
      text: 'Each click dispenses 0.25 mL'
    });
    
    // Add usage instruction
    instructions.push({
      text: 'Rotate base until you hear the required number of clicks'
    });
    
    return instructions;
  }

  /**
   * Validate medication is appropriate for Topiclick builder
   */
  private validateTopiclickMedication(): void {
    const doseForm = this.medication.doseForm?.toLowerCase() || '';
    const validForms = ['cream', 'gel', 'ointment'];
    
    // Check if it's a valid dose form OR has Topiclick dispenser info
    const hasTopiclickDispenser = this.medication.dispenserInfo?.type === 'Topiclick' ||
                                 this.medication.dispenserMetadata?.type === 'Topiclick' ||
                                 this.medication.name?.toLowerCase().includes('topiclick');
    
    if (!validForms.includes(doseForm) && !hasTopiclickDispenser) {
      console.warn(`Topiclick builder used for ${this.medication.doseForm}. Expected: ${validForms.join(', ')} or Topiclick dispenser info`);
    }
    
    this.addAuditEntry(`Validated Topiclick medication: ${this.medication.name}`);
  }

  /**
   * Override format dose for audit to show clicks nicely
   */
  protected formatDoseForAudit(dose: DoseInput): string {
    if (dose.unit === 'click' || dose.unit === 'clicks') {
      const clickDisplay = this.formatClickDisplay(dose.value);
      
      if (dose.maxValue) {
        const maxClickDisplay = this.formatClickDisplay(dose.maxValue);
        return `${clickDisplay} - ${maxClickDisplay}`;
      }
      
      return clickDisplay;
    }
    
    // Fall back to parent implementation
    return super.formatDoseForAudit(dose);
  }

  /**
   * Override buildDose to properly handle click auditing
   */
  buildDose(dose: DoseInput): ISignatureBuilder {
    // Validate input
    if (!isValidDoseInput(dose)) {
      throw new Error('Invalid dose input');
    }

    // Handle click units specifically
    if (dose.unit === 'click' || dose.unit === 'clicks') {
      // Store original dose for display formatting
      this.originalDose = dose;
      
      // Convert clicks to mL for internal processing
      const mlValue = dose.value / this.CLICKS_PER_ML;
      const mlDose: DoseInput = {
        value: mlValue,
        unit: 'mL',
        maxValue: dose.maxValue ? dose.maxValue / this.CLICKS_PER_ML : undefined
      };
      
      // Add to internal state using mL values
      this.state.doses.push(mlDose);
      
      // Add click-specific audit entry using original dose
      this.addAuditEntry(`Added dose: ${this.formatDoseForAudit(dose)}`);
      
      // Additional audit for conversion
      this.addAuditEntry(`Converted ${dose.value} clicks to ${mlValue} mL (${this.CLICKS_PER_ML} clicks per mL)`);
      
      // Calculate and log mg equivalent
      const mgEquivalent = this.calculateMgFromClicks(dose.value);
      if (mgEquivalent !== null) {
        this.addAuditEntry(`Calculated dose: ${dose.value} clicks = ${mgEquivalent.toFixed(1)} mg`);
      }
      
    } else {
      // Handle non-click units normally
      this.state.doses.push(dose);
      this.addAuditEntry(`Added dose: ${this.formatDoseForAudit(dose)}`);
    }
    
    return this;
  }

  /**
   * Override audit entry to access protected method
   */
  protected addAuditEntry(entry: string): void {
    super.addAuditEntry(entry);
  }

  /**
   * Override builder type in JSON serialization
   */
  toJSON(): object {
    const baseJson = super.toJSON() as Record<string, unknown>;
    
    return {
      ...baseJson,
      builderType: 'TopiclickBuilder',
      topiclickFeatures: {
        clicksPerMl: this.CLICKS_PER_ML,
        airPrimeLoss: this.AIR_PRIME_LOSS_CLICKS,
        displayFormat: 'X clicks (Y mg)',
        deviceInstructions: true
      },
      originalDose: this.originalDose
    };
  }

  /**
   * Enhanced explanation with Topiclick capabilities
   */
  explain(): string {
    const baseExplanation = super.explain();
    
    if (this.originalDose && (this.originalDose.unit === 'click' || this.originalDose.unit === 'clicks')) {
      const clickDisplay = this.formatClickDisplay(this.originalDose.value);
      const mlEquivalent = this.originalDose.value / this.CLICKS_PER_ML;
      
      return `${baseExplanation}\n\n--- Topiclick Dispenser Features ---\n` +
             `Original dose: ${clickDisplay}\n` +
             `Conversion: ${this.originalDose.value} clicks = ${mlEquivalent} mL\n` +
             `Clicks per mL: ${this.CLICKS_PER_ML}\n` +
             `Air-prime loss: ${this.AIR_PRIME_LOSS_CLICKS} clicks\n` +
             `Device instructions: ${this.getTopiclickInstructions().length} added`;
    }
    
    return baseExplanation;
  }
}