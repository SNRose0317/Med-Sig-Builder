/**
 * Testosterone Cypionate Strategy
 * 
 * Highly specific strategy for testosterone cypionate injections
 * with dual dosing display (mg and mL).
 * 
 * @since 3.0.0
 */

import { IBaseStrategyWithMetadata, SpecificityLevel } from '../types';
import { MedicationRequestContext } from '../../../types/MedicationRequestContext';
import { SignatureInstruction } from '../../../types/SignatureInstruction';

export class TestosteroneCypionateStrategy implements IBaseStrategyWithMetadata {
  readonly specificity = SpecificityLevel.MEDICATION_ID;
  
  readonly metadata = {
    id: 'testosterone-cypionate-strategy',
    name: 'Testosterone Cypionate Strategy',
    description: 'Handles testosterone cypionate with dual dosing display',
    examples: ['Testosterone Cypionate 200mg/mL'],
    version: '1.0.0'
  };

  /**
   * Matches testosterone cypionate specifically
   */
  matches(context: MedicationRequestContext): boolean {
    const medId = context.medication?.id?.toLowerCase() || '';
    const medName = context.medication?.name?.toLowerCase() || '';
    
    return medId === 'testosterone-cypionate-200mg-ml' ||
           medName.includes('testosterone cypionate') ||
           medName.includes('depo-testosterone');
  }

  /**
   * Builds instruction with dual dosing for testosterone
   */
  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    const { medication, dose, route, frequency } = context;
    
    // Calculate volume from mg dose if needed
    let doseText = '';
    if (dose) {
      if (dose.unit === 'mg') {
        // Assume 200mg/mL concentration (standard)
        const mlValue = (dose.value / 200).toFixed(2);
        doseText = `${dose.value} mg, as ${mlValue} mL`;
      } else if (dose.unit === 'mL') {
        const mgValue = dose.value * 200;
        doseText = `${mgValue} mg, as ${dose.value} mL`;
      } else {
        doseText = `${dose.value} ${dose.unit}`;
      }
    }
    
    // Build instruction text
    const parts: string[] = ['Inject', doseText];
    
    // Route is always intramuscular for testosterone cypionate
    parts.push('intramuscularly');
    
    // Add injection site rotation instruction
    parts.push('(rotate injection sites)');
    
    // Add frequency - convert to lowercase
    if (frequency) {
      parts.push(frequency.toLowerCase());
    }
    
    const text = parts.filter(Boolean).join(' ') + '.';
    
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
      route: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '78421000',
          display: 'Intramuscular'
        }]
      },
      site: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '723979003',
          display: 'Structure of quadriceps femoris muscle and/or gluteus muscle'
        }]
      },
      method: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '422145002',
          display: 'Inject'
        }]
      },
      additionalInstruction: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '421769005',
          display: 'Rotate injection site'
        }],
        text: 'Rotate injection sites'
      }]
    };
  }

  /**
   * Explains the strategy's behavior
   */
  explain(): string {
    return 'Testosterone cypionate strategy: Provides dual dosing (mg/mL), enforces IM route, and includes injection site rotation';
  }

  /**
   * Builds timing for testosterone injections
   */
  private buildTiming(frequency?: string): SignatureInstruction['timing'] {
    if (!frequency) return undefined;

    // Common testosterone injection frequencies
    const timingMap: Record<string, any> = {
      'Once Weekly': {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'wk'
        }
      },
      'once weekly': {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'wk'
        }
      },
      'every week': {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'wk'
        }
      },
      'every 2 weeks': {
        repeat: {
          frequency: 1,
          period: 2,
          periodUnit: 'wk'
        }
      },
      'every 14 days': {
        repeat: {
          frequency: 1,
          period: 14,
          periodUnit: 'd'
        }
      },
      'weekly': {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'wk'
        }
      },
      'biweekly': {
        repeat: {
          frequency: 1,
          period: 2,
          periodUnit: 'wk'
        }
      }
    };

    return timingMap[frequency] || {
      code: {
        text: frequency
      }
    };
  }
}