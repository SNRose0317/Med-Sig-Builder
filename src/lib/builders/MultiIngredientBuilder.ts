/**
 * MultiIngredientBuilder
 * 
 * Specialized builder for multi-ingredient and compound medications.
 * Handles ingredient breakdown display, compound ratio calculations,
 * and proper FHIR representation for combination products.
 * 
 * @since 3.2.0
 */

import { SimpleLiquidBuilder } from './SimpleLiquidBuilder';
import { 
  ISignatureBuilder, 
  DoseInput,
  isValidDoseInput
} from './ISignatureBuilder';
import { 
  IComplexRegimenBuilder, 
  MultiIngredientDoseInput,
  isValidTaperingPhase,
  TaperingPhase,
  ConditionalInstruction,
  InstructionRelationship,
  DoseRangeInput,
  FrequencyRangeInput,
  MaxDailyDoseConstraint,
  ComplexRegimenBuilderState
} from './IComplexRegimenBuilder';
import { SignatureInstruction } from '../../types/SignatureInstruction';
import { MedicationProfile } from '../../types/MedicationProfile';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';

/**
 * Individual ingredient dose breakdown
 */
interface IngredientDose {
  /** Ingredient name */
  name: string;
  /** Amount of this ingredient in the dose */
  amount: number;
  /** Unit for this ingredient */
  unit: string;
  /** Percentage of total dose (optional) */
  percentage?: number;
  /** Display string for this ingredient */
  display: string;
}

/**
 * Builder for multi-ingredient and compound medications
 */
export class MultiIngredientBuilder extends SimpleLiquidBuilder implements IComplexRegimenBuilder {
  
  // Complex regimen state
  protected complexState: ComplexRegimenBuilderState;
  
  // Store ingredient-specific information
  private ingredientBreakdown: IngredientDose[] = [];
  private showIngredientBreakdown: boolean = true;
  
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
    
    // Override audit trail to indicate MultiIngredient builder
    this.addAuditEntry('MultiIngredientBuilder initialized for compound medication');
    this.validateMultiIngredientMedication();
    
    // Pre-calculate ingredient information
    this.calculateIngredientBreakdown();
  }

  /**
   * Override buildDose to handle multi-ingredient calculations
   */
  buildDose(dose: DoseInput): ISignatureBuilder {
    // Validate input
    if (!isValidDoseInput(dose)) {
      throw new Error('Invalid dose input');
    }

    // Store original dose and calculate ingredient breakdown
    super.buildDose(dose);
    
    // Calculate ingredient-specific doses for this total dose
    this.updateIngredientBreakdown(dose.value, dose.unit);
    
    // Add multi-ingredient specific audit entry
    this.addAuditEntry(`Multi-ingredient dose: ${dose.value} ${dose.unit} total volume`);
    this.addIngredientBreakdownToAudit();
    
    return this;
  }

  /**
   * Build multi-ingredient dose with explicit breakdown
   */
  buildMultiIngredientDose(multiIngredientDose: MultiIngredientDoseInput): IComplexRegimenBuilder {
    // Validate input
    if (!multiIngredientDose.totalDose || !isValidDoseInput(multiIngredientDose.totalDose)) {
      throw new Error('Invalid multi-ingredient dose input');
    }

    // Store the multi-ingredient dose configuration
    this.complexState.multiIngredientDoses.push(multiIngredientDose);
    this.showIngredientBreakdown = multiIngredientDose.displayBreakdown;

    // Process the total dose normally
    this.buildDose(multiIngredientDose.totalDose);

    // Override ingredient breakdown if provided
    if (multiIngredientDose.ingredientBreakdown) {
      this.ingredientBreakdown = multiIngredientDose.ingredientBreakdown.map(ing => ({
        name: ing.ingredientName,
        amount: ing.amount,
        unit: ing.unit,
        percentage: ing.percentage,
        display: `${ing.ingredientName} ${ing.amount}${ing.unit}`
      }));
    }

    this.addComplexAuditEntry(`Built multi-ingredient dose with ${this.ingredientBreakdown.length} components`);
    
    return this;
  }

  /**
   * Generate final FHIR-compliant instruction with ingredient breakdown
   */
  getResult(): SignatureInstruction[] {
    // Get base instruction from parent
    const instructions = super.getResult();
    
    // Enhanced formatting for multi-ingredient display
    if (this.showIngredientBreakdown && this.ingredientBreakdown.length > 1) {
      instructions[0] = this.enhanceInstructionWithIngredients(instructions[0]);
    }
    
    // Add ingredient-specific instructions
    const ingredientInstructions = this.getIngredientInstructions();
    if (ingredientInstructions.length > 0) {
      instructions[0].additionalInstructions = [
        ...(instructions[0].additionalInstructions || []),
        ...ingredientInstructions
      ];
      
      this.addAuditEntry(`Added ${ingredientInstructions.length} ingredient-specific instructions`);
    }
    
    return instructions;
  }

  /**
   * Override to provide multi-ingredient context formatting
   */
  protected createMedicationRequestContext(): MedicationRequestContext {
    const context = super.createMedicationRequestContext();
    
    // Add ingredient breakdown to context if available
    if (this.ingredientBreakdown.length > 1) {
      const ingredientSummary = this.ingredientBreakdown
        .map(ing => ing.display)
        .join(', ');
      
      // Append ingredient information to any existing special instructions
      const existingInstructions = context.specialInstructions || '';
      context.specialInstructions = existingInstructions 
        ? `${existingInstructions}; Contains: ${ingredientSummary}`
        : `Contains: ${ingredientSummary}`;
    }
    
    return context;
  }

  /**
   * Calculate ingredient breakdown based on total dose
   */
  private calculateIngredientBreakdown(): void {
    const ingredients = this.medication.ingredient || [];
    
    if (ingredients.length <= 1) {
      this.addAuditEntry('Single ingredient medication, no breakdown needed');
      return;
    }

    this.ingredientBreakdown = ingredients.map(ingredient => {
      // For multi-ingredient, we'll calculate per unit of denominator
      const ratio = ingredient.strengthRatio;
      const baseAmount = ratio ? ratio.numerator.value : 0;
      const baseUnit = ratio ? ratio.numerator.unit : 'mg';
      
      return {
        name: ingredient.name,
        amount: baseAmount,
        unit: baseUnit,
        display: `${ingredient.name} ${baseAmount}${baseUnit}`
      };
    });
    
    this.addAuditEntry(`Calculated breakdown for ${this.ingredientBreakdown.length} ingredients`);
  }

  /**
   * Update ingredient breakdown for specific dose
   */
  private updateIngredientBreakdown(totalDose: number, doseUnit: string): void {
    if (this.ingredientBreakdown.length <= 1) return;

    // Calculate the scaling factor based on dose
    // For volume-based dosing (mL, g), use dose directly
    // For tablet-based dosing, use dose as multiplier
    const isVolumeDose = ['ml', 'g', 'mg'].includes(doseUnit.toLowerCase());
    
    this.ingredientBreakdown = this.ingredientBreakdown.map(ingredient => {
      let scaledAmount: number;
      
      if (isVolumeDose) {
        // For volume doses, scale based on concentration
        const ratio = this.findIngredientRatio(ingredient.name);
        if (ratio) {
          // Calculate amount per dose volume
          const concentrationPerUnit = ratio.numerator.value / ratio.denominator.value;
          scaledAmount = concentrationPerUnit * totalDose;
        } else {
          scaledAmount = ingredient.amount * totalDose;
        }
      } else {
        // For tablet doses, multiply by number of tablets
        scaledAmount = ingredient.amount * totalDose;
      }
      
      return {
        ...ingredient,
        amount: scaledAmount,
        display: `${ingredient.name} ${scaledAmount.toFixed(1)}${ingredient.unit}`
      };
    });
  }

  /**
   * Find ingredient ratio by name
   */
  private findIngredientRatio(ingredientName: string) {
    const ingredient = this.medication.ingredient?.find(ing => ing.name === ingredientName);
    return ingredient?.strengthRatio;
  }

  /**
   * Enhance instruction text with ingredient breakdown
   */
  private enhanceInstructionWithIngredients(instruction: SignatureInstruction): SignatureInstruction {
    const ingredientList = this.ingredientBreakdown
      .map(ing => ing.display)
      .join(', ');
      
    // Find the dose portion in the text and enhance it
    const originalText = instruction.text;
    const enhancedText = `${originalText} (containing ${ingredientList})`;
    
    return {
      ...instruction,
      text: enhancedText
    };
  }

  /**
   * Get ingredient-specific instructions
   */
  private getIngredientInstructions(): Array<{text: string}> {
    const instructions: Array<{text: string}> = [];
    
    // Only add ingredient instructions if we have multiple ingredients
    if (this.ingredientBreakdown.length <= 1) {
      return instructions;
    }

    // Add ingredient information
    instructions.push({
      text: `This medication contains ${this.ingredientBreakdown.length} active ingredients`
    });

    // Add individual ingredient amounts
    this.ingredientBreakdown.forEach(ingredient => {
      instructions.push({
        text: `${ingredient.name}: ${ingredient.display}`
      });
    });

    // Add compounding note if applicable
    if (this.medication.type === 'compound') {
      instructions.push({
        text: 'Compounded medication - verify strength with pharmacy'
      });
    }
    
    return instructions;
  }

  /**
   * Add ingredient breakdown to audit trail
   */
  private addIngredientBreakdownToAudit(): void {
    if (this.ingredientBreakdown.length > 1) {
      this.ingredientBreakdown.forEach(ingredient => {
        this.addAuditEntry(`Ingredient: ${ingredient.display}`);
      });
    }
  }

  /**
   * Validate medication is appropriate for multi-ingredient builder
   */
  private validateMultiIngredientMedication(): void {
    const ingredients = this.medication.ingredient || [];
    
    if (ingredients.length <= 1) {
      console.warn(`MultiIngredientBuilder used for single-ingredient medication: ${this.medication.name}`);
    }
    
    // Check that all ingredients have valid strength ratios
    const invalidIngredients = ingredients.filter(ing => !ing.strengthRatio?.numerator?.value);
    if (invalidIngredients.length > 0) {
      console.warn(`Ingredients missing strength ratios: ${invalidIngredients.map(ing => ing.name).join(', ')}`);
    }
    
    this.addAuditEntry(`Validated multi-ingredient medication: ${ingredients.length} ingredients`);
  }

  // =============================================================================
  // IComplexRegimenBuilder Implementation (Basic implementations for interface compliance)
  // =============================================================================

  /**
   * Build sequential instructions for tapering schedules
   */
  buildSequentialInstructions(phases: TaperingPhase[]): IComplexRegimenBuilder {
    if (!phases.every(phase => isValidTaperingPhase(phase))) {
      throw new Error('Invalid tapering phases provided');
    }

    this.complexState.phases = phases;
    this.addComplexAuditEntry(`Added ${phases.length} tapering phases`);
    
    return this;
  }

  /**
   * Build conditional logic for complex scenarios
   */
  buildConditionalLogic(conditional: ConditionalInstruction): IComplexRegimenBuilder {
    this.complexState.conditionals.push(conditional);
    this.addComplexAuditEntry(`Added conditional instruction: ${conditional.condition}`);
    
    return this;
  }

  /**
   * Build relationships between instructions
   */
  buildRelationships(relationships: InstructionRelationship[]): IComplexRegimenBuilder {
    this.complexState.relationships = relationships;
    this.addComplexAuditEntry(`Added ${relationships.length} instruction relationships`);
    
    return this;
  }

  /**
   * Build dose ranges for PRN medications
   */
  buildDoseRange(doseRange: DoseRangeInput): IComplexRegimenBuilder {
    this.complexState.doseRanges.push(doseRange);
    this.addComplexAuditEntry(`Added dose range: ${doseRange.minValue}-${doseRange.maxValue} ${doseRange.unit}`);
    
    return this;
  }

  /**
   * Build frequency ranges for PRN medications
   */
  buildFrequencyRange(frequencyRange: FrequencyRangeInput): IComplexRegimenBuilder {
    this.complexState.frequencyRanges.push(frequencyRange);
    this.addComplexAuditEntry(`Added frequency range: every ${frequencyRange.minFrequency}-${frequencyRange.maxFrequency} ${frequencyRange.periodUnit}`);
    
    return this;
  }

  /**
   * Build maximum daily dose constraints
   */
  buildMaxDailyDoseConstraint(constraint: MaxDailyDoseConstraint): IComplexRegimenBuilder {
    this.complexState.maxDailyConstraints.push(constraint);
    this.addComplexAuditEntry(`Added max daily dose constraint: ${constraint.maxDosePerDay.value} ${constraint.maxDosePerDay.unit}`);
    
    return this;
  }

  /**
   * Generate complex regimen results with relationships
   */
  getComplexResult(): SignatureInstruction[] {
    // For MultiIngredientBuilder, complex result is same as regular result
    // unless we have tapering phases
    const baseInstructions = this.getResult();
    
    if (this.complexState.phases.length > 0) {
      // Implementation for tapering phases would go here
      // For now, return base instructions
      this.addComplexAuditEntry('Complex regimen with tapering phases not yet fully implemented');
    }
    
    return baseInstructions;
  }

  /**
   * Validate complex regimen constraints
   */
  validateComplexRegimen(): string[] {
    const errors: string[] = [];
    
    // Validate ingredient constraints
    if (this.ingredientBreakdown.length === 0) {
      errors.push('No ingredient breakdown available for multi-ingredient medication');
    }
    
    // Validate complex state if present
    if (this.complexState.phases.length > 0) {
      const invalidPhases = this.complexState.phases.filter(phase => !isValidTaperingPhase(phase));
      if (invalidPhases.length > 0) {
        errors.push(`Invalid tapering phases: ${invalidPhases.length}`);
      }
    }
    
    return errors;
  }

  /**
   * Get detailed explanation of complex regimen logic
   */
  explainComplexRegimen(): string {
    const baseExplanation = this.explain();
    
    let complexExplanation = `${baseExplanation}\n\n--- Multi-Ingredient Breakdown ---\n`;
    
    if (this.ingredientBreakdown.length > 1) {
      complexExplanation += `Ingredients (${this.ingredientBreakdown.length}):\n`;
      this.ingredientBreakdown.forEach((ingredient, index) => {
        complexExplanation += `  ${index + 1}. ${ingredient.display}\n`;
      });
    }
    
    if (this.complexState.phases.length > 0) {
      complexExplanation += `\nTapering Phases: ${this.complexState.phases.length}\n`;
    }
    
    if (this.complexState.complexAuditTrail.length > 0) {
      complexExplanation += `\nComplex Operations:\n`;
      this.complexState.complexAuditTrail.forEach(entry => {
        complexExplanation += `  - ${entry}\n`;
      });
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
      builderType: 'MultiIngredientBuilder',
      ingredientFeatures: {
        ingredientCount: this.ingredientBreakdown.length,
        showBreakdown: this.showIngredientBreakdown,
        compoundMedication: this.medication.type === 'compound'
      },
      ingredientBreakdown: this.ingredientBreakdown,
      complexState: this.complexState
    };
  }

  /**
   * Enhanced explanation with multi-ingredient capabilities
   */
  explain(): string {
    const baseExplanation = super.explain();
    
    if (this.ingredientBreakdown.length > 1) {
      const ingredientSummary = this.ingredientBreakdown
        .map(ing => ing.display)
        .join(', ');
        
      return `${baseExplanation}\n\n--- Multi-Ingredient Features ---\n` +
             `Ingredient count: ${this.ingredientBreakdown.length}\n` +
             `Breakdown display: ${this.showIngredientBreakdown ? 'Enabled' : 'Disabled'}\n` +
             `Ingredients: ${ingredientSummary}\n` +
             `Medication type: ${this.medication.type}`;
    }
    
    return baseExplanation;
  }
}