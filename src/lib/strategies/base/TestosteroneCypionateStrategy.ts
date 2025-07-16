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
import { createTemplateEngine } from '../../templates/templates';
import { TemplateDataBuilder } from '../../templates/TemplateDataBuilder';

export class TestosteroneCypionateStrategy implements IBaseStrategyWithMetadata {
  readonly specificity = SpecificityLevel.MEDICATION_ID;
  private templateEngine = createTemplateEngine();
  
  readonly metadata = {
    id: 'testosterone-cypionate-strategy',
    name: 'Testosterone Cypionate Strategy',
    description: 'Handles testosterone cypionate with dual dosing display using template engine',
    examples: ['Testosterone Cypionate 200mg/mL'],
    version: '2.0.0'
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
   * Builds instruction with dual dosing for testosterone using template engine
   */
  buildInstruction(context: MedicationRequestContext): SignatureInstruction {
    const { dose, frequency } = context;
    
    // Build template data with testosterone-specific dual dosing logic
    const templateData = TemplateDataBuilder.forTestosteroneCypionate(context);
    
    // Render text using template engine
    const text = this.templateEngine.render('INJECTION_TEMPLATE', templateData);
    
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
          unit: dose.unit
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
      additionalInstructions: [{
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
    return 'Testosterone cypionate strategy: Uses template engine for internationalization-ready instructions with dual dosing (mg/mL), enforces IM route, and includes injection site rotation';
  }

  /**
   * Builds timing for testosterone injections
   */
  private buildTiming(frequency?: string): SignatureInstruction['timing'] {
    if (!frequency) return undefined;

    // Common testosterone injection frequencies
    const timingMap: Record<string, { repeat: { frequency: number; period: number; periodUnit: string; when?: string[] } }> = {
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