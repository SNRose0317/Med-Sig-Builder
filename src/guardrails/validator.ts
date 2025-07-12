/**
 * Clinical Guardrails Validator
 * 
 * Service for loading, parsing, and validating clinical constraints
 * from the YAML schema. Provides methods to check medication doses,
 * routes, and other clinical safety rules.
 * 
 * @since 2.0.0
 */

import { parse } from 'yaml';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import {
  GuardrailsSchema,
  GuardrailValidationResult,
  GuardrailViolation,
  GuardrailWarning,
  MedicationConstraints,
  isGuardrailsSchema,
  DoseLimit,
  Contraindication,
  ClinicalOverride
} from './types';
import { Quantity } from '../types/MedicationProfile';
import { DoseInput } from '../lib/builders/ISignatureBuilder';

/**
 * JSON Schema for validating the YAML structure
 */
const GUARDRAILS_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['version', 'effective_date', 'approved_by', 'medications'],
  properties: {
    version: { type: 'string' },
    effective_date: { type: 'string' },
    approved_by: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'role', 'date'],
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          date: { type: 'string' }
        }
      }
    },
    medications: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          brand_names: { type: 'array', items: { type: 'string' } },
          dose_forms: { type: 'array', items: { type: 'string' } },
          max_daily_dose: { $ref: '#/definitions/doseLimit' },
          max_single_dose: { $ref: '#/definitions/quantity' },
          min_single_dose: { $ref: '#/definitions/quantity' },
          dose_step: { $ref: '#/definitions/quantity' },
          injection_sites: { type: 'array', items: { type: 'string' } },
          contraindications: {
            type: 'array',
            items: {
              type: 'object',
              required: ['condition', 'severity', 'message'],
              properties: {
                condition: { type: 'string' },
                severity: { enum: ['absolute', 'relative'] },
                message: { type: 'string' }
              }
            }
          },
          black_box_warnings: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  definitions: {
    quantity: {
      type: 'object',
      required: ['value', 'unit'],
      properties: {
        value: { type: 'number' },
        unit: { type: 'string' }
      }
    },
    doseLimit: {
      type: 'object',
      required: ['value', 'unit'],
      properties: {
        value: { type: 'number' },
        unit: { type: 'string' },
        populations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['condition', 'value', 'unit', 'reason'],
            properties: {
              condition: { type: 'string' },
              value: { type: 'number' },
              unit: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

/**
 * Patient context for evaluating population-specific rules
 */
export interface PatientContext {
  /** Patient age in years */
  age?: number;
  /** eGFR value for renal function */
  egfr?: number;
  /** Active conditions */
  conditions?: string[];
  /** Current medications */
  medications?: string[];
  /** Known allergies */
  allergies?: string[];
}

/**
 * Clinical Guardrails Validator Service
 */
export class GuardrailsValidator {
  private schema: GuardrailsSchema | null = null;
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
  }

  /**
   * Load and parse the guardrails schema from YAML
   * 
   * @param schemaPath - Path to schema.yaml file (optional)
   * @returns Loaded schema or throws error
   */
  loadSchema(schemaPath?: string): GuardrailsSchema {
    try {
      const filePath = schemaPath || path.join(__dirname, 'schema.yaml');
      const yamlContent = fs.readFileSync(filePath, 'utf8');
      const parsed = parse(yamlContent);

      // Validate against JSON schema
      const validate = this.ajv.compile(GUARDRAILS_JSON_SCHEMA);
      const valid = validate(parsed);

      if (!valid) {
        throw new Error(`Invalid guardrails schema: ${JSON.stringify(validate.errors)}`);
      }

      // Additional type checking
      if (!isGuardrailsSchema(parsed)) {
        throw new Error('Parsed YAML does not match GuardrailsSchema interface');
      }

      this.schema = parsed;
      return parsed;
    } catch (error) {
      throw new Error(`Failed to load guardrails schema: ${error}`);
    }
  }

  /**
   * Get the loaded schema
   */
  getSchema(): GuardrailsSchema {
    if (!this.schema) {
      this.loadSchema();
    }
    return this.schema!;
  }

  /**
   * Validate a medication dose against guardrails
   * 
   * @param medicationName - Medication name (generic or brand)
   * @param dose - Proposed dose
   * @param isDailyTotal - Whether this is a daily total vs single dose
   * @param patientContext - Patient-specific information
   * @param override - Clinical override if applicable
   * @returns Validation result
   */
  validateDose(
    medicationName: string,
    dose: DoseInput,
    isDailyTotal: boolean = false,
    patientContext?: PatientContext,
    override?: ClinicalOverride
  ): GuardrailValidationResult {
    const schema = this.getSchema();
    const errors: GuardrailViolation[] = [];
    const warnings: GuardrailWarning[] = [];

    // Find medication constraints (check generic name and brand names)
    const medicationKey = this.findMedicationKey(medicationName);
    if (!medicationKey) {
      warnings.push({
        type: 'unknown_medication',
        message: `No guardrails found for medication: ${medicationName}`,
        recommendation: 'Proceed with standard clinical judgment'
      });
      return { valid: true, warnings };
    }

    const constraints = schema.medications[medicationKey];

    // Check dose limits
    if (isDailyTotal && constraints.maxDailyDose) {
      const limit = this.getApplicableDoseLimit(constraints.maxDailyDose, patientContext);
      if (this.exceedsDoseLimit(dose, limit)) {
        errors.push({
          type: 'dose_limit',
          severity: 'error',
          message: `Daily dose ${dose.value} ${dose.unit} exceeds maximum ${limit.value} ${limit.unit}`,
          constraint: 'max_daily_dose',
          actualValue: dose,
          expectedValue: limit
        });
      }
    } else if (!isDailyTotal && constraints.maxSingleDose) {
      if (this.exceedsDoseLimit(dose, constraints.maxSingleDose)) {
        errors.push({
          type: 'dose_limit',
          severity: 'error',
          message: `Single dose ${dose.value} ${dose.unit} exceeds maximum ${constraints.maxSingleDose.value} ${constraints.maxSingleDose.unit}`,
          constraint: 'max_single_dose',
          actualValue: dose,
          expectedValue: constraints.maxSingleDose
        });
      }
    }

    // Check minimum dose
    if (constraints.minSingleDose && dose.value < constraints.minSingleDose.value) {
      warnings.push({
        type: 'subtherapeutic_dose',
        message: `Dose ${dose.value} ${dose.unit} is below minimum therapeutic dose ${constraints.minSingleDose.value} ${constraints.minSingleDose.unit}`,
        recommendation: 'Verify intentional low dose'
      });
    }

    // Check dose step
    if (constraints.doseStep) {
      const step = constraints.doseStep.value;
      if (dose.value % step !== 0) {
        warnings.push({
          type: 'dose_step',
          message: `Dose ${dose.value} ${dose.unit} is not a multiple of standard increment ${step} ${constraints.doseStep.unit}`,
          recommendation: `Consider adjusting to nearest ${step} ${constraints.doseStep.unit} increment`
        });
      }
    }

    // If there's an override and errors exist, convert errors to warnings
    if (override && errors.length > 0) {
      warnings.push({
        type: 'clinical_override',
        message: `Clinical override applied: ${override.reason}`,
        recommendation: `Prescribed by ${override.prescriber} on ${override.date}`
      });
      
      // Convert errors to warnings
      errors.forEach(error => {
        warnings.push({
          type: 'overridden_constraint',
          message: `OVERRIDDEN: ${error.message}`,
          recommendation: 'Original constraint overridden by clinical judgment'
        });
      });
      
      return { valid: true, warnings };
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate contraindications
   * 
   * @param medicationName - Medication name
   * @param patientContext - Patient context
   * @returns Validation result
   */
  validateContraindications(
    medicationName: string,
    patientContext: PatientContext
  ): GuardrailValidationResult {
    const schema = this.getSchema();
    const errors: GuardrailViolation[] = [];
    const warnings: GuardrailWarning[] = [];

    const medicationKey = this.findMedicationKey(medicationName);
    if (!medicationKey) {
      return { valid: true };
    }

    const constraints = schema.medications[medicationKey];
    if (!constraints.contraindications) {
      return { valid: true };
    }

    for (const contraindication of constraints.contraindications) {
      if (this.evaluateCondition(contraindication.condition, patientContext)) {
        const violation: GuardrailViolation = {
          type: 'contraindication',
          severity: contraindication.severity === 'absolute' ? 'error' : 'warning',
          message: contraindication.message,
          constraint: contraindication.condition
        };

        if (contraindication.severity === 'absolute') {
          errors.push(violation);
        } else {
          warnings.push({
            type: 'relative_contraindication',
            message: contraindication.message,
            recommendation: 'Use with caution and close monitoring'
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate injection volume constraints
   * 
   * @param route - Injection route (subcutaneous, intramuscular, etc.)
   * @param volume - Proposed volume
   * @param site - Specific injection site (optional)
   * @returns Validation result
   */
  validateInjectionVolume(
    route: string,
    volume: Quantity,
    site?: string
  ): GuardrailValidationResult {
    const schema = this.getSchema();
    const errors: GuardrailViolation[] = [];
    const warnings: GuardrailWarning[] = [];

    const routeKey = route.toLowerCase().replace(/\s+/g, '');
    const constraints = schema.injection_constraints[routeKey];

    if (!constraints) {
      return { valid: true };
    }

    let maxVolume: number | undefined;
    let maxUnit: string | undefined;

    // Determine applicable volume limit
    if (site && constraints.maxVolumePerSite?.sites?.[site]) {
      const siteLimit = constraints.maxVolumePerSite.sites[site];
      maxVolume = siteLimit.value;
      maxUnit = siteLimit.unit;
    } else if (constraints.maxVolumePerSite?.default) {
      maxVolume = constraints.maxVolumePerSite.default.value;
      maxUnit = constraints.maxVolumePerSite.default.unit;
    } else if (constraints.maxVolumePerSite?.value) {
      maxVolume = constraints.maxVolumePerSite.value;
      maxUnit = constraints.maxVolumePerSite.unit;
    }

    if (maxVolume && volume.value > maxVolume) {
      errors.push({
        type: 'route_constraint',
        severity: 'error',
        message: `Volume ${volume.value} ${volume.unit} exceeds maximum ${maxVolume} ${maxUnit} for ${route}${site ? ` (${site})` : ''}`,
        constraint: 'max_volume_per_site',
        actualValue: volume,
        expectedValue: { value: maxVolume, unit: maxUnit || 'mL' }
      });
    }

    // Add notes as warnings if present
    if (constraints.notes) {
      warnings.push({
        type: 'injection_note',
        message: constraints.notes
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Check for drug interactions
   * 
   * @param medications - List of medications to check
   * @returns Validation result
   */
  validateDrugInteractions(medications: string[]): GuardrailValidationResult {
    const schema = this.getSchema();
    const errors: GuardrailViolation[] = [];
    const warnings: GuardrailWarning[] = [];

    // Normalize medication names
    const normalizedMeds = medications.map(med => med.toLowerCase());

    for (const interaction of schema.drug_interactions) {
      // Check if medications match the drugs in the interaction
      const matchedDrugs: string[] = [];
      for (const drug of interaction.drugs) {
        const drugLower = drug.toLowerCase();
        const matched = normalizedMeds.some(med => {
          // Check exact match or partial match
          return med === drugLower || 
                 med.includes(drugLower) || 
                 drugLower.includes(med) ||
                 (drugLower.includes('_') && med.includes(drugLower.replace(/_/g, ' ')));
        });
        if (matched) {
          matchedDrugs.push(drug);
        }
      }

      if (matchedDrugs.length >= 2) {
        const violation: GuardrailViolation = {
          type: 'interaction',
          severity: interaction.severity === 'major' ? 'error' : 'warning',
          message: `Drug interaction: ${interaction.effect}`,
          constraint: `${matchedDrugs.join(' + ')} interaction`
        };

        if (interaction.severity === 'major') {
          errors.push(violation);
        } else {
          warnings.push({
            type: 'drug_interaction',
            message: `${interaction.severity} interaction: ${interaction.effect}`,
            recommendation: interaction.recommendation
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Find medication key in schema (handles brand names)
   */
  private findMedicationKey(medicationName: string): string | undefined {
    const schema = this.getSchema();
    const normalized = medicationName.toLowerCase();

    // Check direct match
    if (schema.medications[normalized]) {
      return normalized;
    }

    // Check brand names
    for (const [key, constraints] of Object.entries(schema.medications)) {
      if (constraints.brandNames) {
        const brandMatch = constraints.brandNames.some(
          brand => brand.toLowerCase() === normalized
        );
        if (brandMatch) {
          return key;
        }
      }
    }

    return undefined;
  }

  /**
   * Get applicable dose limit based on patient context
   */
  private getApplicableDoseLimit(
    doseLimit: DoseLimit,
    patientContext?: PatientContext
  ): Quantity {
    if (!patientContext || !doseLimit.populations) {
      return { value: doseLimit.value, unit: doseLimit.unit };
    }

    // Check population-specific limits
    for (const population of doseLimit.populations) {
      if (this.evaluateCondition(population.condition, patientContext)) {
        return { value: population.value, unit: population.unit };
      }
    }

    return { value: doseLimit.value, unit: doseLimit.unit };
  }

  /**
   * Check if dose exceeds limit (with unit conversion if needed)
   */
  private exceedsDoseLimit(dose: DoseInput, limit: Quantity): boolean {
    // Simple check when units match
    if (dose.unit === limit.unit) {
      return dose.value > limit.value;
    }

    // TODO: Implement unit conversion
    // For now, return false if units don't match
    return false;
  }

  /**
   * Evaluate a condition expression against patient context
   * 
   * @param condition - Condition expression (e.g., "age < 18", "egfr < 30")
   * @param context - Patient context
   * @returns Whether condition is met
   */
  private evaluateCondition(condition: string, context: PatientContext): boolean {
    // Simple evaluation for common conditions
    // In production, consider using a safe expression evaluator

    // Age conditions
    if (condition.includes('age') && context.age !== undefined) {
      const ageMatch = condition.match(/age\s*([<>]=?)\s*(\d+)/);
      if (ageMatch) {
        const operator = ageMatch[1];
        const value = parseInt(ageMatch[2]);
        switch (operator) {
          case '<': return context.age < value;
          case '<=': return context.age <= value;
          case '>': return context.age > value;
          case '>=': return context.age >= value;
        }
      }
    }

    // eGFR conditions
    if (condition.includes('egfr') && context.egfr !== undefined) {
      const egfrMatch = condition.match(/egfr\s*([<>]=?)\s*(\d+)/);
      if (egfrMatch) {
        const operator = egfrMatch[1];
        const value = parseInt(egfrMatch[2]);
        switch (operator) {
          case '<': return context.egfr < value;
          case '<=': return context.egfr <= value;
          case '>': return context.egfr > value;
          case '>=': return context.egfr >= value;
        }
      }

      // Handle range conditions (e.g., "egfr < 45 && egfr >= 30")
      const rangeMatch = condition.match(/egfr\s*<\s*(\d+)\s*&&\s*egfr\s*>=\s*(\d+)/);
      if (rangeMatch) {
        const upper = parseInt(rangeMatch[1]);
        const lower = parseInt(rangeMatch[2]);
        return context.egfr < upper && context.egfr >= lower;
      }
    }

    // Condition matching (exact match)
    if (context.conditions) {
      return context.conditions.some(c => c.toLowerCase() === condition.toLowerCase());
    }

    return false;
  }
}

// Export singleton instance
export const guardrailsValidator = new GuardrailsValidator();