/**
 * Tablet Base Strategy
 * 
 * Handles oral solid medications (tablets, capsules) with
 * special support for fractional dosing and strength display.
 * 
 * @since 3.0.0
 */

import { IBaseStrategyWithMetadata, SpecificityLevel } from '../types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';

export class TabletStrategy implements IBaseStrategyWithMetadata {
  readonly specificity = SpecificityLevel.DOSE_FORM;
  
  readonly metadata = {
    id: 'tablet-strategy',
    name: 'Tablet Strategy',
    description: 'Handles oral solid medications with fractional dosing support',
    examples: ['Metformin 500mg', 'Atorvastatin 20mg', 'Levothyroxine 50mcg'],
    version: '1.0.0'
  };

  /**
   * Matches tablet and similar solid oral dose forms
   */
  matches(context: MedicationRequestContext): boolean {
    const doseForm = context.medication?.doseForm?.toLowerCase() || '';
    const solidForms = ['tablet', 'capsule', 'troche', 'odt'];
    return solidForms.includes(doseForm);
  }

  /**
   * Builds instruction with tablet-specific formatting
   */
  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    const { medication, dose, route, frequency } = context;
    
    // Build text with special tablet formatting
    const parts: string[] = ['Take'];
    
    // Format dose with fractional support
    if (dose) {
      const doseText = this.formatTabletDose(dose.value, dose.unit);
      parts.push(doseText);
    }
    
    // Add route if not oral (oral is implied for tablets)
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
          code: '26643006', // Oral route
          display: 'Oral'
        }]
      },
      method: medication?.doseForm === 'ODT' ? {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '421521009',
          display: 'Swallow - dosing instruction'
        }]
      } : undefined
    };
  }

  /**
   * Explains the strategy's behavior
   */
  explain(): string {
    return 'Tablet strategy: Handles oral solid medications with fractional dose support and proper pluralization';
  }

  /**
   * Formats tablet doses with proper fractions
   * CRITICAL: Never go below 1/4 tablet
   */
  private formatTabletDose(value: number, unit: string): string {
    // If unit is already 'tablet', format with fractions
    if (unit.toLowerCase() === 'tablet' || unit.toLowerCase() === 'tablets') {
      if (value < 0.25) return '1/4 tablet';
      if (value === 0.25) return '1/4 tablet';
      if (value === 0.5) return '1/2 tablet';
      if (value === 0.75) return '3/4 tablet';
      if (value === 1) return '1 tablet';
      if (value === 1.5) return '1 and 1/2 tablets';
      if (value === 2) return '2 tablets';
      if (value === 2.5) return '2 and 1/2 tablets';
      
      // For other values, format as decimal
      const whole = Math.floor(value);
      const fraction = value - whole;
      
      if (fraction === 0) {
        return `${whole} tablets`;
      } else if (fraction === 0.25) {
        return `${whole} and 1/4 tablets`;
      } else if (fraction === 0.5) {
        return `${whole} and 1/2 tablets`;
      } else if (fraction === 0.75) {
        return `${whole} and 3/4 tablets`;
      }
      
      return `${value} tablets`;
    }
    
    // For other units (mg, mcg, etc.), return as-is
    return `${value} ${unit}`;
  }

  /**
   * Builds FHIR timing from frequency string
   */
  private buildTiming(frequency?: string): SignatureInstruction['timing'] {
    if (!frequency) return undefined;

    // Map common frequencies to FHIR timing
    const timingMap: Record<string, any> = {
      'once daily': {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'd',
          when: ['MORN']
        }
      },
      'twice daily': {
        repeat: {
          frequency: 2,
          period: 1,
          periodUnit: 'd',
          when: ['MORN', 'EVE']
        }
      },
      'three times daily': {
        repeat: {
          frequency: 3,
          period: 1,
          periodUnit: 'd',
          when: ['MORN', 'AFT', 'EVE']
        }
      },
      'four times daily': {
        repeat: {
          frequency: 4,
          period: 1,
          periodUnit: 'd',
          when: ['MORN', 'NOON', 'AFT', 'EVE']
        }
      },
      'at bedtime': {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'd',
          when: ['HS']
        }
      },
      'every morning': {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'd',
          when: ['MORN']
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
      'tablet': '{tbl}',
      'tablets': '{tbl}',
      'capsule': '{capsule}',
      'capsules': '{capsule}',
      'mg': 'mg',
      'mcg': 'ug',
      'g': 'g'
    };

    return unitMap[unit.toLowerCase()] || unit;
  }
}