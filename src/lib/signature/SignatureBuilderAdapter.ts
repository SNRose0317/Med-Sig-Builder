/**
 * Signature Builder Adapter
 * 
 * Provides backward compatibility with the existing signature.ts API
 * while using the new strategy-based dispatcher system internally.
 * 
 * @since 3.0.0
 */

import { Medication } from '../../types';
import { MedicationRequestContext } from '../../types/MedicationRequestContext';
import { SignatureResult, DoseInput } from '../signature';
import { StrategyDispatcher } from '../dispatcher/StrategyDispatcher';
import { StrategyRegistry } from '../registry/StrategyRegistry';

// Import all strategies
import { 
  DefaultStrategy,
  TabletStrategy,
  LiquidStrategy,
  TestosteroneCypionateStrategy
} from '../strategies/base';
import {
  TopiclickModifier,
  StrengthDisplayModifier
} from '../strategies/modifiers';

/**
 * Singleton registry instance
 */
let globalRegistry: StrategyRegistry | null = null;

/**
 * Gets or creates the global strategy registry
 */
function getGlobalRegistry(): StrategyRegistry {
  if (!globalRegistry) {
    globalRegistry = new StrategyRegistry();
    
    // Register all base strategies
    globalRegistry.registerBase('default', new DefaultStrategy());
    globalRegistry.registerBase('tablet', new TabletStrategy());
    globalRegistry.registerBase('liquid', new LiquidStrategy());
    globalRegistry.registerBase('testosterone-cypionate', new TestosteroneCypionateStrategy());
    
    // Register all modifiers
    globalRegistry.registerModifier('topiclick', new TopiclickModifier());
    globalRegistry.registerModifier('strength-display', new StrengthDisplayModifier());
  }
  
  return globalRegistry;
}

/**
 * Generates a medication signature using the new strategy system
 * while maintaining backward compatibility with the old API.
 * 
 * @param medication - Medication profile
 * @param dose - Dose information
 * @param routeName - Route of administration
 * @param frequencyName - Frequency of administration
 * @param specialInstructions - Additional instructions
 * @returns SignatureResult with humanReadable and fhirRepresentation
 */
export function generateSignature(
  medication: Medication,
  dose: DoseInput,
  routeName: string,
  frequencyName: string,
  specialInstructions?: string
): SignatureResult {
  // Create context for the new system
  const context: MedicationRequestContext = {
    id: `sig-${Date.now()}`,
    timestamp: new Date().toISOString(),
    patient: { id: 'unknown', age: 0 }, // Placeholder since we don't have patient context
    medication: {
      id: medication.id,
      name: medication.name,
      type: medication.type as 'medication' | 'supplement' | 'compound',
      isActive: medication.isActive,
      code: medication.code,
      doseForm: medication.doseForm,
      ingredient: medication.ingredient,
      packageInfo: medication.packageInfo,
      dispenserInfo: medication.dispenserInfo
    },
    dose: {
      value: dose.value,
      unit: dose.unit
    },
    route: routeName,
    frequency: frequencyName,
    specialInstructions
  };
  
  // Get registry and dispatcher
  const registry = getGlobalRegistry();
  const dispatcher = new StrategyDispatcher(registry);
  
  try {
    // Dispatch to generate instruction
    const instruction = dispatcher.dispatch(context);
    
    // Convert to legacy format
    const humanReadable = specialInstructions 
      ? instruction.text.replace(/\.$/, ` ${specialInstructions}.`)
      : instruction.text;
    
    // Build legacy FHIR representation
    const fhirRepresentation = {
      dosageInstruction: {
        route: routeName,
        doseAndRate: instruction.doseAndRate?.[0] ? {
          doseQuantity: {
            value: instruction.doseAndRate[0].doseQuantity?.value || dose.value,
            unit: instruction.doseAndRate[0].doseQuantity?.unit || dose.unit
          }
        } : {
          doseQuantity: {
            value: dose.value,
            unit: dose.unit
          }
        },
        timing: instruction.timing ? {
          repeat: instruction.timing.repeat || {}
        } : {
          repeat: {}
        },
        ...(specialInstructions && {
          additionalInstructions: {
            text: specialInstructions
          }
        })
      }
    };
    
    return {
      humanReadable,
      fhirRepresentation
    };
    
  } catch (error) {
    // Fallback to basic formatting if strategy system fails
    console.error('Strategy dispatch failed, using fallback:', error);
    
    const fallbackText = `Take ${dose.value} ${dose.unit} by ${routeName} route ${frequencyName}${
      specialInstructions ? ` ${specialInstructions}` : ''
    }.`;
    
    return {
      humanReadable: fallbackText,
      fhirRepresentation: {
        dosageInstruction: {
          route: routeName,
          doseAndRate: {
            doseQuantity: {
              value: dose.value,
              unit: dose.unit
            }
          },
          timing: {
            repeat: {}
          },
          ...(specialInstructions && {
            additionalInstructions: {
              text: specialInstructions
            }
          })
        }
      }
    };
  }
}

/**
 * Resets the global registry (useful for testing)
 */
export function resetGlobalRegistry(): void {
  globalRegistry = null;
}

/**
 * Gets the current registry for introspection
 */
export function getRegistry(): StrategyRegistry {
  return getGlobalRegistry();
}

/**
 * Exports from the original signature.ts that we're maintaining compatibility with
 */
export { 
  isMultiIngredient,
  getStrengthMode,
  getDenominatorUnit,
  getDispensingUnit,
  validateDose
} from '../signature';