/**
 * Liquid Base Strategy
 * 
 * Handles liquid medications (solutions, suspensions, syrups)
 * with volume-based dosing and multi-ingredient support.
 * 
 * @since 3.0.0
 */

import { IBaseStrategyWithMetadata, SpecificityLevel } from '../types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';

export class LiquidStrategy implements IBaseStrategyWithMetadata {
  readonly specificity = SpecificityLevel.DOSE_FORM;
  
  readonly metadata = {
    id: 'liquid-strategy',
    name: 'Liquid Strategy',
    description: 'Handles liquid medications with volume-based dosing',
    examples: ['Amoxicillin suspension', 'Ibuprofen liquid', 'Cough syrup'],
    version: '1.0.0'
  };

  /**
   * Matches liquid dose forms
   */
  matches(context: MedicationRequestContext): boolean {
    const doseForm = context.medication?.doseForm?.toLowerCase() || '';
    const liquidForms = ['solution', 'suspension', 'syrup', 'elixir', 'liquid'];
    return liquidForms.some(form => doseForm.includes(form));
  }

  /**
   * Builds instruction for liquid medications
   */
  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    const { medication, dose, route, frequency } = context;
    
    // Determine if multi-ingredient
    const isMultiIngredient = this.isMultiIngredient(medication);
    
    // Build text
    const parts: string[] = ['Take'];
    
    // Format dose based on whether it's multi-ingredient
    if (dose) {
      let doseText = `${dose.value} ${dose.unit}`;
      
      // For multi-ingredient liquids, always use volume (mL)
      if (isMultiIngredient && dose.unit !== 'mL' && dose.unit !== 'L') {
        // Convert to mL if possible (would need strength ratio)
        doseText += ' (volume-based dosing required for multi-ingredient formulation)';
      }
      
      parts.push(doseText);
    }
    
    // Add route - for oral liquids, just say "by mouth"
    const routeLower = route?.toLowerCase() || '';
    if (routeLower === 'orally' || routeLower === 'oral' || !route) {
      parts.push('by mouth');
    } else {
      parts.push(`by ${route} route`);
    }
    
    // Add frequency - convert to lowercase
    if (frequency) {
      parts.push(frequency.toLowerCase());
    }
    
    // Add shake instruction for suspensions
    if (medication?.doseForm?.toLowerCase().includes('suspension')) {
      parts.push('(shake well before use)');
    }
    
    const text = parts.join(' ') + '.';
    
    // Build FHIR-compliant instruction
    return {
      text,
      timing: this.buildTiming(frequency),
      doseAndRate: dose ? [{
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type',
            code: 'ordered',
            display: 'Ordered'
          }]
        },
        doseQuantity: {
          value: dose.value,
          unit: dose.unit,
          system: 'http://unitsofmeasure.org',
          code: this.mapUnitCode(dose.unit)
        }
      }] : undefined,
      route: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: route === 'oral' || !route ? '26643006' : '0',
          display: route || 'Oral'
        }]
      },
      additionalInstruction: medication?.doseForm?.toLowerCase().includes('suspension') ? [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '129019007',
          display: 'Shake before using'
        }],
        text: 'Shake well before use'
      }] : undefined
    };
  }

  /**
   * Explains the strategy's behavior
   */
  explain(): string {
    return 'Liquid strategy: Handles volume-based dosing, multi-ingredient formulations, and adds shake instructions for suspensions';
  }

  /**
   * Determines if medication has multiple active ingredients
   */
  private isMultiIngredient(medication?: MedicationRequestContext['medication']): boolean {
    if (!medication?.ingredient || medication.ingredient.length <= 1) {
      return false;
    }
    
    // Count ingredients with valid strength data
    const activeIngredients = medication.ingredient.filter(ing => {
      // Has strength ratio (for liquids)
      if (ing.strengthRatio?.numerator?.value && ing.strengthRatio?.numerator?.unit) {
        return true;
      }
      return false;
    });
    
    return activeIngredients.length > 1;
  }

  /**
   * Builds FHIR timing from frequency string
   */
  private buildTiming(frequency?: string): SignatureInstruction['timing'] {
    if (!frequency) return undefined;

    // Common liquid medication frequencies
    const timingMap: Record<string, any> = {
      'every 4 hours': {
        repeat: {
          frequency: 6,
          period: 1,
          periodUnit: 'd'
        }
      },
      'every 6 hours': {
        repeat: {
          frequency: 4,
          period: 1,
          periodUnit: 'd'
        }
      },
      'every 8 hours': {
        repeat: {
          frequency: 3,
          period: 1,
          periodUnit: 'd'
        }
      },
      'twice daily': {
        repeat: {
          frequency: 2,
          period: 1,
          periodUnit: 'd'
        }
      },
      'three times daily': {
        repeat: {
          frequency: 3,
          period: 1,
          periodUnit: 'd'
        }
      },
      'every 4 hours while awake': {
        repeat: {
          frequency: 5,
          period: 1,
          periodUnit: 'd',
          when: ['MORN', 'AFT', 'EVE']
        }
      }
    };

    return timingMap[frequency] || {
      code: {
        text: frequency
      }
    };
  }

  /**
   * Maps unit strings to UCUM codes
   */
  private mapUnitCode(unit: string): string {
    const unitMap: Record<string, string> = {
      'ml': 'mL',
      'milliliter': 'mL',
      'milliliters': 'mL',
      'l': 'L',
      'liter': 'L',
      'liters': 'L',
      'tsp': '[tsp_us]',
      'teaspoon': '[tsp_us]',
      'tbsp': '[tbs_us]',
      'tablespoon': '[tbs_us]',
      'mg': 'mg',
      'mcg': 'ug',
      'g': 'g'
    };

    return unitMap[unit.toLowerCase()] || unit;
  }
}