/**
 * Default Base Strategy
 * 
 * Fallback strategy that handles any medication when no more
 * specific strategy matches. Uses simple formatting rules.
 * 
 * @since 3.0.0
 */

import { IBaseStrategyWithMetadata, SpecificityLevel } from '../types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';
import { getVerb } from '../../../constants/medication-data';

export class DefaultStrategy implements IBaseStrategyWithMetadata {
  readonly specificity = SpecificityLevel.DEFAULT;
  
  readonly metadata = {
    id: 'default-strategy',
    name: 'Default Strategy',
    description: 'Fallback strategy for simple medication instructions',
    version: '1.0.0'
  };

  /**
   * Always matches as the fallback strategy
   */
  matches(context: MedicationRequestContext): boolean {
    // Default strategy always matches
    return true;
  }

  /**
   * Builds a simple instruction using basic formatting
   */
  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    const { medication, dose, route, frequency } = context;
    
    // Get appropriate verb based on dose form and route
    const verb = getVerb(medication?.doseForm || 'Tablet', route || 'oral');
    
    // Build basic text
    const parts: string[] = [verb];
    
    // Add dose
    if (dose) {
      parts.push(`${dose.value} ${dose.unit}`);
    }
    
    // Add route - convert to human readable
    if (route) {
      const routeLower = route.toLowerCase();
      if (routeLower === 'orally' || routeLower === 'oral') {
        parts.push('by mouth');
      } else if (routeLower === 'intramuscularly' || routeLower === 'intramuscular') {
        parts.push('intramuscularly');
      } else if (routeLower === 'topically' || routeLower === 'topical') {
        parts.push('topically');
      } else {
        parts.push(`by ${route} route`);
      }
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
          code: dose.unit
        }
      }] : undefined,
      route: route ? {
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.getRouteCode(route),
          display: route
        }]
      } : undefined
    };
  }

  /**
   * Explains the strategy's behavior
   */
  explain(): string {
    return 'Default strategy: Applies basic formatting rules for any medication';
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
      'four times daily': {
        repeat: {
          frequency: 4,
          period: 1,
          periodUnit: 'd'
        }
      },
      'every 4 hours': {
        repeat: {
          frequency: 1,
          period: 4,
          periodUnit: 'h'
        }
      },
      'every 6 hours': {
        repeat: {
          frequency: 1,
          period: 6,
          periodUnit: 'h'
        }
      },
      'every 8 hours': {
        repeat: {
          frequency: 1,
          period: 8,
          periodUnit: 'h'
        }
      },
      'every 12 hours': {
        repeat: {
          frequency: 1,
          period: 12,
          periodUnit: 'h'
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
   * Maps route names to SNOMED codes
   */
  private getRouteCode(route: string): string {
    const routeCodes: Record<string, string> = {
      'oral': '26643006',
      'intramuscular': '78421000',
      'subcutaneous': '34206005',
      'intravenous': '47625008',
      'topical': '6064005',
      'rectal': '37161004',
      'vaginal': '16857009',
      'nasal': '46713006',
      'inhalation': '18679011',
      'ophthalmic': '54485002',
      'otic': '10547007'
    };

    return routeCodes[route.toLowerCase()] || '0'; // Unknown route
  }
}