/**
 * Topiclick Modifier Strategy
 * 
 * Modifies instructions for medications using the Topiclick
 * dispenser system (4 clicks = 1 mL conversion).
 * 
 * @since 3.0.0
 */

import { IModifierStrategyWithMetadata } from '../types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';

export class TopiclickModifier implements IModifierStrategyWithMetadata {
  readonly priority = 10; // Early priority to modify dose display
  
  readonly metadata = {
    id: 'topiclick-modifier',
    name: 'Topiclick Modifier',
    description: 'Handles Topiclick dispenser conversion (4 clicks = 1 mL)',
    examples: ['Estradiol cream with Topiclick'],
    version: '1.0.0'
  };

  /**
   * Applies to medications with Topiclick dispenser
   */
  appliesTo(context: MedicationRequestContext): boolean {
    const medication = context.medication;
    
    // Check if it's a cream/gel with Topiclick dispenser
    if (!medication) return false;
    
    const isDoseForm = ['cream', 'gel'].includes(
      medication.doseForm?.toLowerCase() || ''
    );
    
    const hasTopiclick = medication.dispenserInfo?.type === 'Topiclick' ||
                        medication.name?.toLowerCase().includes('topiclick');
    
    return isDoseForm && hasTopiclick;
  }

  /**
   * Modifies instruction to handle click conversions
   */
  modify(
    instruction: SignatureInstruction,
    context: MedicationRequestContext
  ): SignatureInstruction {
    const { dose, medication } = context;
    
    if (!dose || !instruction.text) return instruction;
    
    // Handle click unit conversion in text
    let modifiedText = instruction.text;
    
    if (dose.unit === 'click' || dose.unit === 'clicks') {
      // Calculate mL equivalent
      const mlValue = dose.value / 4;
      const unitText = dose.value === 1 ? 'click' : 'clicks';
      
      // Calculate mg if we have strength ratio
      if (medication?.ingredient?.[0]?.strengthRatio) {
        const strengthRatio = medication.ingredient[0].strengthRatio;
        const mgPerMl = strengthRatio.numerator.value / strengthRatio.denominator.value;
        const mgValue = mlValue * mgPerMl;
        
        // Replace dose in text with click + mg display
        const dosePattern = new RegExp(`${dose.value}\\s*${dose.unit}`, 'i');
        modifiedText = modifiedText.replace(
          dosePattern,
          `${dose.value} ${unitText} (${mgValue.toFixed(1)} ${strengthRatio.numerator.unit})`
        );
      } else {
        // Just show clicks and mL
        const dosePattern = new RegExp(`${dose.value}\\s*${dose.unit}`, 'i');
        modifiedText = modifiedText.replace(
          dosePattern,
          `${dose.value} ${unitText} (${mlValue} mL)`
        );
      }
    }
    
    // Add Topiclick instruction if not already present
    if (!modifiedText.includes('Topiclick')) {
      modifiedText = modifiedText.replace(
        /\.$/, 
        ' using Topiclick dispenser.'
      );
    }
    
    // Return modified instruction
    return {
      ...instruction,
      text: modifiedText,
      additionalInstructions: [
        ...(instruction.additionalInstructions || []),
        {
          text: 'Each click dispenses 0.25 mL'
        }
      ]
    };
  }

  /**
   * Explains the modifier's behavior
   */
  explain(): string {
    return 'Topiclick modifier: Converts click doses to mL/mg equivalents and adds dispenser instructions';
  }
}