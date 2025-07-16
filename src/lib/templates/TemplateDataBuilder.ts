import { TemplateData } from './types';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';

/**
 * Builds template data from MedicationRequestContext
 * Handles all the complex logic for dose formatting, pluralization, etc.
 */
export class TemplateDataBuilder {
  
  /**
   * Build template data for tablet/capsule medications
   */
  static forTablet(context: MedicationRequestContext): TemplateData {
    const { dose, route, frequency, specialInstructions } = context;
    
    return {
      verb: 'Take',
      doseText: dose ? this.formatTabletDose(dose.value, dose.unit) : '',
      doseValue: dose?.value,
      doseUnit: dose ? this.formatTabletUnit(dose.value, dose.unit) : '',
      route: this.formatRoute(route, 'tablet'),
      frequency: frequency?.toLowerCase() || '',
      specialInstructions: specialInstructions ? ` ${specialInstructions}` : ''
    };
  }

  /**
   * Build template data for liquid medications
   */
  static forLiquid(context: MedicationRequestContext): TemplateData {
    const { medication, dose, route, frequency, specialInstructions } = context;
    
    // Handle suspension shake instruction
    let liquidInstructions = specialInstructions || '';
    if (medication?.doseForm?.toLowerCase().includes('suspension')) {
      liquidInstructions = liquidInstructions ? 
        `${liquidInstructions} (shake well before use)` : 
        ' (shake well before use)';
    }
    
    return {
      verb: 'Take',
      doseValue: dose?.value,
      doseUnit: dose?.unit || '',
      dualDose: '', // Will be calculated by strategy if needed
      route: this.formatRoute(route, 'liquid'),
      frequency: frequency?.toLowerCase() || '',
      specialInstructions: liquidInstructions ? ` ${liquidInstructions}` : ''
    };
  }

  /**
   * Build template data for topical medications
   */
  static forTopical(context: MedicationRequestContext): TemplateData {
    const { dose, frequency, specialInstructions } = context;
    
    return {
      verb: 'Apply',
      doseText: dose ? `${dose.value} ${dose.unit}` : 'a thin layer',
      route: 'topically',
      site: '', // Site information not available in current context
      frequency: frequency?.toLowerCase() || '',
      specialInstructions: specialInstructions ? ` ${specialInstructions}` : ''
    };
  }

  /**
   * Build template data for injection medications
   */
  static forInjection(context: MedicationRequestContext): TemplateData {
    const { dose, route, frequency } = context;
    
    return {
      verb: 'Inject',
      doseValue: dose?.value,
      doseUnit: dose?.unit || '',
      dualDose: '', // Will be calculated by strategy if needed
      route: this.formatRoute(route, 'injection'),
      site: '', // Site information not available in current context
      frequency: frequency?.toLowerCase() || '',
      technique: '' // Technique information not available in current context
    };
  }

  /**
   * Build template data for testosterone cypionate specifically
   */
  static forTestosteroneCypionate(context: MedicationRequestContext): TemplateData {
    const { dose, frequency } = context;
    
    // Calculate dual dosing for testosterone cypionate
    let dualDose = '';
    if (dose) {
      if (dose.unit === 'mg') {
        // Assume 200mg/mL concentration (standard)
        const mlValue = (dose.value / 200).toFixed(2);
        dualDose = `, as ${mlValue} mL`;
      } else if (dose.unit === 'mL') {
        const mgValue = dose.value * 200;
        dualDose = `, as ${mgValue} mg`;
      }
    }
    
    return {
      verb: 'Inject',
      doseValue: dose?.value,
      doseUnit: dose?.unit || '',
      dualDose,
      route: 'intramuscularly',
      site: ' (rotate injection sites)',
      frequency: frequency?.toLowerCase() || '',
      technique: ''
    };
  }

  /**
   * Build template data for PRN (as needed) medications
   */
  static forPRN(context: MedicationRequestContext): TemplateData {
    const { dose, route, frequency, asNeeded, maxDosePerPeriod } = context;
    
    return {
      verb: 'Take',
      doseText: dose ? `${dose.value} ${dose.unit}` : '',
      route: this.formatRoute(route, 'prn'),
      frequencyText: frequency?.toLowerCase() || '',
      indication: asNeeded ? ` for ${asNeeded}` : '',
      maxDose: maxDosePerPeriod ? `. Do not exceed ${maxDosePerPeriod.dose.value} ${maxDosePerPeriod.dose.unit} in ${maxDosePerPeriod.period.value} ${maxDosePerPeriod.period.unit}` : ''
    };
  }

  /**
   * Build template data for default/fallback case
   */
  static forDefault(context: MedicationRequestContext): TemplateData {
    const { dose, route, frequency, specialInstructions } = context;
    
    return {
      verb: this.getDefaultVerb(route),
      doseText: dose ? `${dose.value} ${dose.unit}` : 'as directed',
      route: this.formatRoute(route, 'default'),
      frequency: frequency?.toLowerCase() || '',
      specialInstructions: specialInstructions ? ` ${specialInstructions}` : ''
    };
  }

  /**
   * Format tablet doses with proper fractions
   * CRITICAL: Never go below 1/4 tablet
   */
  private static formatTabletDose(value: number, unit: string): string {
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
        return `${whole} tablet${whole === 1 ? '' : 's'}`;
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
   * Format tablet unit for display
   */
  private static formatTabletUnit(value: number, unit: string): string {
    if (unit.toLowerCase() === 'tablet' || unit.toLowerCase() === 'tablets') {
      return value === 1 ? 'tablet' : 'tablets';
    }
    return unit;
  }

  /**
   * Format route based on medication type
   */
  private static formatRoute(route?: string, medicationType?: string): string {
    if (!route) {
      switch (medicationType) {
        case 'tablet':
        case 'liquid':
        case 'prn':
        case 'default':
          return 'by mouth';
        case 'injection':
          return 'intramuscularly';
        case 'topical':
          return 'topically';
        default:
          return 'by mouth';
      }
    }

    const routeLower = route.toLowerCase();
    
    // Map common route variations to standard forms
    const routeMap: Record<string, string> = {
      'oral': 'by mouth',
      'orally': 'by mouth',
      'po': 'by mouth',
      'im': 'intramuscularly',
      'intramuscular': 'intramuscularly',
      'sc': 'subcutaneously',
      'subcutaneous': 'subcutaneously',
      'sq': 'subcutaneously',
      'subq': 'subcutaneously',
      'topical': 'topically',
      'topically': 'topically'
    };

    return routeMap[routeLower] || route;
  }

  /**
   * Get default verb based on route
   */
  private static getDefaultVerb(route?: string): string {
    if (!route) return 'Take';

    const routeLower = route.toLowerCase();
    
    if (routeLower.includes('inject') || routeLower === 'im' || routeLower === 'sc' || routeLower === 'sq') {
      return 'Inject';
    }
    
    if (routeLower.includes('topical') || routeLower.includes('apply')) {
      return 'Apply';
    }
    
    return 'Take';
  }
}