/**
 * NasalSprayBuilder
 * 
 * Specialized builder for nasal spray medications with nostril patterns,
 * priming instructions, and dose validation.
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
 * Builder for nasal spray medications
 */
export class NasalSprayBuilder extends SimpleLiquidBuilder {
  // Store original dose for display formatting
  private originalDose?: DoseInput;
  
  constructor(medication: MedicationProfile) {
    super(medication);
    
    // Override audit trail to indicate NasalSpray builder
    this.addAuditEntry('NasalSprayBuilder initialized for nasal spray medication');
    this.validateNasalSprayMedication();
  }

  /**
   * Override buildDose to properly handle spray auditing
   */
  buildDose(dose: DoseInput): ISignatureBuilder {
    // Validate input
    if (!isValidDoseInput(dose)) {
      throw new Error('Invalid dose input');
    }

    // Handle spray units specifically
    if (dose.unit === 'spray' || dose.unit === 'sprays') {
      // Store original dose for display formatting
      this.originalDose = dose;
      
      // Validate spray count
      this.validateSprayCount(dose.value);
      
      // Add to internal state using spray values
      this.state.doses.push(dose);
      
      // Add spray-specific audit entry using original dose
      this.addAuditEntry(`Added dose: ${this.formatDoseForAudit(dose)}`);
      
      // Calculate and log mcg equivalent if available
      const mcgEquivalent = this.calculateMcgFromSprays(dose.value);
      if (mcgEquivalent !== null) {
        this.addAuditEntry(`Calculated dose: ${dose.value} ${dose.value === 1 ? 'spray' : 'sprays'} = ${mcgEquivalent.toFixed(1)} mcg`);
      }
      
    } else {
      // Handle non-spray units normally
      this.state.doses.push(dose);
      this.addAuditEntry(`Added dose: ${this.formatDoseForAudit(dose)}`);
    }
    
    return this;
  }

  /**
   * Generate final FHIR-compliant instruction with nasal spray formatting
   * 
   * @returns Array of SignatureInstruction with nasal spray-specific formatting
   */
  getResult(): SignatureInstruction[] {
    // Get base instruction from parent
    const instructions = super.getResult();
    
    // Apply nasal spray-specific formatting if we have spray dose
    if (this.originalDose && (this.originalDose.unit === 'spray' || this.originalDose.unit === 'sprays')) {
      instructions[0] = this.formatNasalSprayInstruction(instructions[0]);
    }
    
    // Add nasal spray-specific instructions
    const nasalSprayInstructions = this.getNasalSprayInstructions();
    if (nasalSprayInstructions.length > 0) {
      instructions[0].additionalInstructions = [
        ...(instructions[0].additionalInstructions || []),
        ...nasalSprayInstructions
      ];
      
      this.addAuditEntry(`Added ${nasalSprayInstructions.length} nasal spray-specific instructions`);
    }
    
    return instructions;
  }

  /**
   * Override to provide nasal spray context formatting
   */
  protected createMedicationRequestContext(): MedicationRequestContext {
    const context = super.createMedicationRequestContext();
    
    // Keep the original dose structure but add custom formatting in the template
    // The template will handle the display formatting
    
    return context;
  }

  /**
   * Format instruction text for nasal spray display
   */
  private formatNasalSprayInstruction(instruction: SignatureInstruction): SignatureInstruction {
    if (!this.originalDose) return instruction;
    
    const sprayDisplay = this.formatSprayDisplay(this.originalDose.value);
    
    // Replace spray references with formatted display
    const sprayPattern = new RegExp(`${this.originalDose.value}\\s*${this.originalDose.unit}`, 'gi');
    const modifiedText = instruction.text?.replace(sprayPattern, sprayDisplay) || instruction.text;
    
    return {
      ...instruction,
      text: modifiedText
    };
  }

  /**
   * Format spray display as "X sprays (Y mcg)" or "X sprays per nostril"
   */
  private formatSprayDisplay(sprays: number): string {
    const sprayText = sprays === 1 ? 'spray' : 'sprays';
    const mcgValue = this.calculateMcgFromSprays(sprays);
    
    if (mcgValue !== null) {
      return `${sprays} ${sprayText} (${mcgValue.toFixed(1)} mcg)`;
    } else {
      return `${sprays} ${sprayText}`;
    }
  }

  /**
   * Calculate mcg equivalent from sprays using medication strength
   */
  private calculateMcgFromSprays(sprays: number): number | null {
    // Try to get dose per spray from medication
    const ingredient = this.medication.ingredient?.[0];
    if (ingredient?.strengthRatio) {
      const ratio = ingredient.strengthRatio;
      
      // Check if we have mcg per spray
      if (ratio.numerator.unit === 'mcg' && 
          (ratio.denominator.unit === 'spray' || ratio.denominator.unit === 'sprays')) {
        const mcgPerSpray = ratio.numerator.value / ratio.denominator.value;
        return sprays * mcgPerSpray;
      }
      
      // Check if we have mg per spray - convert to mcg
      if (ratio.numerator.unit === 'mg' && 
          (ratio.denominator.unit === 'spray' || ratio.denominator.unit === 'sprays')) {
        const mgPerSpray = ratio.numerator.value / ratio.denominator.value;
        return sprays * mgPerSpray * 1000; // Convert mg to mcg
      }
    }
    
    // Try dispenserInfo for dose per spray
    if (this.medication.dispenserInfo && this.medication.dispenserInfo.type === 'NasalSpray') {
      // Could have dose per spray information
      const conversionRatio = this.medication.dispenserInfo.conversionRatio;
      if (conversionRatio) {
        return sprays * conversionRatio;
      }
    }
    
    return null;
  }

  /**
   * Get nasal spray-specific instructions
   */
  private getNasalSprayInstructions(): Array<{text: string}> {
    // Only add instructions if we have a spray dose
    if (!this.originalDose || (this.originalDose.unit !== 'spray' && this.originalDose.unit !== 'sprays')) {
      return [];
    }
    
    const instructions: Array<{text: string}> = [];
    
    // Add priming instruction
    instructions.push({
      text: 'Prime spray before first use and after periods of non-use'
    });
    
    // Add nostril pattern instruction
    if (this.originalDose.value > 1) {
      instructions.push({
        text: 'Alternate nostrils with each spray'
      });
    }
    
    // Add administration instruction
    instructions.push({
      text: 'Gently blow nose before use, insert tip into nostril, and spray while breathing in'
    });
    
    // Add cleaning instruction
    instructions.push({
      text: 'Wipe tip clean after each use'
    });
    
    return instructions;
  }

  /**
   * Validate spray count against medication limits
   */
  private validateSprayCount(sprays: number): void {
    // Check maximum sprays per dose
    if (this.medication.dispenserInfo?.maxAmountPerDose) {
      const maxSprays = this.medication.dispenserInfo.maxAmountPerDose;
      if (sprays > maxSprays) {
        throw new Error(`Spray count ${sprays} exceeds maximum ${maxSprays} sprays per dose`);
      }
    }
    
    // General safety check - most nasal sprays shouldn't exceed 4 sprays per dose
    if (sprays > 4) {
      console.warn(`High spray count: ${sprays} sprays per dose. Consider reviewing dosage.`);
    }
    
    this.addAuditEntry(`Validated spray count: ${sprays} sprays`);
  }

  /**
   * Validate medication is appropriate for nasal spray builder
   */
  private validateNasalSprayMedication(): void {
    const doseForm = this.medication.doseForm?.toLowerCase() || '';
    const validForms = ['nasal spray', 'spray', 'nasal solution'];
    
    // Check if it's a valid dose form OR has nasal spray dispenser info
    const hasNasalSprayDispenser = this.medication.dispenserInfo?.type === 'NasalSpray' ||
                                  this.medication.dispenserMetadata?.type === 'NasalSpray' ||
                                  this.medication.name?.toLowerCase().includes('nasal');
    
    if (!validForms.includes(doseForm) && !hasNasalSprayDispenser) {
      console.warn(`NasalSpray builder used for ${this.medication.doseForm}. Expected: ${validForms.join(', ')} or NasalSpray dispenser info`);
    }
    
    this.addAuditEntry(`Validated nasal spray medication: ${this.medication.name}`);
  }

  /**
   * Override format dose for audit to show sprays nicely
   */
  protected formatDoseForAudit(dose: DoseInput): string {
    if (dose.unit === 'spray' || dose.unit === 'sprays') {
      const sprayDisplay = this.formatSprayDisplay(dose.value);
      
      if (dose.maxValue) {
        const maxSprayDisplay = this.formatSprayDisplay(dose.maxValue);
        return `${sprayDisplay} - ${maxSprayDisplay}`;
      }
      
      return sprayDisplay;
    }
    
    // Fall back to parent implementation
    return super.formatDoseForAudit(dose);
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
      builderType: 'NasalSprayBuilder',
      nasalSprayFeatures: {
        nostrilPattern: true,
        primingRequired: true,
        displayFormat: 'X sprays (Y mcg)',
        maxSprayValidation: true
      },
      originalDose: this.originalDose
    };
  }

  /**
   * Enhanced explanation with nasal spray capabilities
   */
  explain(): string {
    const baseExplanation = super.explain();
    
    if (this.originalDose && (this.originalDose.unit === 'spray' || this.originalDose.unit === 'sprays')) {
      const sprayDisplay = this.formatSprayDisplay(this.originalDose.value);
      const mcgEquivalent = this.calculateMcgFromSprays(this.originalDose.value);
      
      return `${baseExplanation}\n\n--- Nasal Spray Dispenser Features ---\n` +
             `Original dose: ${sprayDisplay}\n` +
             `Mcg equivalent: ${mcgEquivalent ? mcgEquivalent.toFixed(1) + ' mcg' : 'Not available'}\n` +
             `Nostril pattern: ${this.originalDose.value > 1 ? 'Alternate nostrils' : 'Single nostril'}\n` +
             `Priming required: Yes\n` +
             `Device instructions: ${this.getNasalSprayInstructions().length} added`;
    }
    
    return baseExplanation;
  }
}