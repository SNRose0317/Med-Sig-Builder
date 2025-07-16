/**
 * Strength Display Modifier
 * 
 * Adds medication strength information to dose instructions
 * for better clarity (e.g., "2 tablets (1000 mg)").
 * 
 * @since 3.0.0
 */

import { IModifierStrategyWithMetadata } from '../types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';

export class StrengthDisplayModifier implements IModifierStrategyWithMetadata {
  readonly priority = 20; // After dose conversions but before final formatting
  
  readonly metadata = {
    id: 'strength-display-modifier',
    name: 'Strength Display Modifier',
    description: 'Adds medication strength to countable dose units',
    examples: ['2 tablets (1000 mg)', '1 capsule (20 mg)'],
    version: '1.0.0'
  };

  /**
   * Applies to solid dose forms with countable units
   */
  appliesTo(context: MedicationRequestContext): boolean {
    const { medication, dose } = context;
    
    if (!medication || !dose) return false;
    
    // Check if it's a countable unit
    const countableUnits = ['tablet', 'tablets', 'capsule', 'capsules', 'patch', 'patches'];
    const hasCountableUnit = countableUnits.includes(dose.unit.toLowerCase());
    
    // Check if we have strength information
    const hasStrength = medication.ingredient?.[0]?.strengthRatio?.numerator?.value;
    
    // Don't apply if strength is already in the text
    const doseIsStrength = ['mg', 'mcg', 'g'].includes(dose.unit.toLowerCase());
    
    return hasCountableUnit && hasStrength && !doseIsStrength;
  }

  /**
   * Modifies instruction to add strength display
   */
  modify(
    instruction: SignatureInstruction,
    context: MedicationRequestContext
  ): SignatureInstruction {
    const { medication, dose } = context;
    
    if (!medication?.ingredient?.[0]?.strengthRatio || !dose || !instruction.text) {
      return instruction;
    }
    
    const strengthRatio = medication.ingredient[0].strengthRatio;
    const strengthPerUnit = strengthRatio.numerator.value / strengthRatio.denominator.value;
    const totalStrength = dose.value * strengthPerUnit;
    const strengthUnit = strengthRatio.numerator.unit;
    
    // Find dose in text and add strength
    let modifiedText = instruction.text;
    
    // Pattern to match dose with unit (e.g., "2 tablets", "1 capsule")
    // Need to be careful about plural forms
    const unitPattern = dose.unit.replace(/s$/, '') + 's?'; // Handle plural
    const dosePattern = new RegExp(
      `(${dose.value}\\s+(?:and\\s+\\d+/\\d+\\s+)?${unitPattern})(?!\\s*\\()`,
      'gi'
    );
    
    // Add strength in parentheses
    modifiedText = modifiedText.replace(
      dosePattern,
      `$1 (${totalStrength} ${strengthUnit})`
    );
    
    return {
      ...instruction,
      text: modifiedText
    };
  }

  /**
   * Explains the modifier's behavior
   */
  explain(): string {
    return 'Strength display modifier: Adds total medication strength for countable dose units';
  }
}