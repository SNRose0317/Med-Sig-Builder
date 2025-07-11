/**
 * Clinical Guardrails Type Definitions
 * 
 * TypeScript interfaces matching the YAML schema structure for
 * clinical constraints and safety rules.
 * 
 * @since 2.0.0
 */

import { Quantity } from '../types/MedicationProfile';

/**
 * Metadata for guardrails schema versioning and approval
 */
export interface GuardrailsMetadata {
  /** Schema version */
  version: string;
  /** Date when rules become effective */
  effectiveDate: string;
  /** List of approvers */
  approvedBy: Approver[];
}

/**
 * Clinical approver information
 */
export interface Approver {
  /** Approver name */
  name: string;
  /** Clinical role (e.g., "Clinical Reviewer", "Pharmacy Reviewer") */
  role: string;
  /** Approval date */
  date: string;
}

/**
 * Population-specific dose adjustment
 */
export interface PopulationDoseLimit {
  /** Condition expression (e.g., "age < 18", "egfr < 45") */
  condition: string;
  /** Adjusted dose value */
  value: number;
  /** Dose unit */
  unit: string;
  /** Clinical reason for adjustment */
  reason: string;
}

/**
 * Dose limit with population-specific adjustments
 */
export interface DoseLimit extends Quantity {
  /** Population-specific adjustments */
  populations?: PopulationDoseLimit[];
}

/**
 * Clinical contraindication
 */
export interface Contraindication {
  /** Condition that triggers contraindication */
  condition: string;
  /** Severity level */
  severity: 'absolute' | 'relative';
  /** User-facing message */
  message: string;
}

/**
 * Medication-specific constraints
 */
export interface MedicationConstraints {
  /** Brand names for this medication */
  brandNames?: string[];
  /** Allowed dose forms */
  doseForms?: string[];
  /** Maximum daily dose */
  maxDailyDose?: DoseLimit;
  /** Maximum single dose */
  maxSingleDose?: Quantity;
  /** Minimum single dose */
  minSingleDose?: Quantity;
  /** Dose step increment */
  doseStep?: Quantity;
  /** Allowed injection sites */
  injectionSites?: string[];
  /** Contraindications */
  contraindications?: Contraindication[];
  /** Black box warnings */
  blackBoxWarnings?: string[];
}

/**
 * Site-specific volume limits
 */
export interface SiteVolumeLimit {
  /** Volume value */
  value: number;
  /** Volume unit (typically mL) */
  unit: string;
}

/**
 * Injection route constraints
 */
export interface InjectionConstraints {
  /** Maximum volume per injection site */
  maxVolumePerSite?: {
    /** Default limit */
    value?: number;
    unit?: string;
    /** Default limit as object */
    default?: SiteVolumeLimit;
    /** Site-specific limits */
    sites?: Record<string, SiteVolumeLimit>;
  };
  /** Preferred injection sites */
  preferredSites?: string[];
  /** Clinical notes */
  notes?: string;
  /** Needle length recommendations */
  needleLengths?: Record<string, string>;
  /** Requires dilution flag */
  requiresDilution?: boolean;
  /** Maximum concentration */
  maxConcentration?: {
    default?: string;
  };
}

/**
 * Reconstitution special case
 */
export interface ReconstitutionSpecialCase {
  /** Medication name */
  medication: string;
  /** Required diluent */
  diluent: string;
  /** Beyond use date after reconstitution */
  beyondUseDate: string;
  /** Clinical notes */
  notes?: string;
  /** Concentration limit */
  concentrationLimit?: Quantity;
}

/**
 * Reconstitution rules
 */
export interface ReconstitutionRules {
  /** Default beyond use date */
  defaultBeyondUseDate: string;
  /** Refrigerated beyond use date */
  refrigeratedBeyondUseDate?: string;
  /** Special cases */
  specialCases?: ReconstitutionSpecialCase[];
}

/**
 * Hazardous drug handling
 */
export interface HazardousDrug {
  /** Medication name */
  medication: string;
  /** Required precautions */
  precautions: string[];
}

/**
 * Refrigerated medication storage
 */
export interface RefrigerationRequired {
  /** Medication name */
  medication: string;
  /** Storage temperature */
  storage: string;
  /** In-use stability */
  inUseStability?: string;
}

/**
 * Special handling requirements
 */
export interface SpecialHandling {
  /** Hazardous drugs requiring special precautions */
  hazardousDrugs?: HazardousDrug[];
  /** Light-sensitive medications */
  lightSensitive?: string[];
  /** Medications requiring refrigeration */
  refrigerationRequired?: RefrigerationRequired[];
  /** Medications that should not be shaken */
  doNotShake?: string[];
}

/**
 * Age-based fractional dosing rule
 */
export interface AgeFractionalRule {
  /** Minimum age in years */
  minAge: number;
  /** Maximum age in years */
  maxAge: number;
  /** Minimum allowed fraction */
  minFraction: number;
  /** Clinical reason */
  reason?: string;
}

/**
 * Fractional dosing rules
 */
export interface FractionalDosing {
  /** Tablet splitting rules */
  tabletSplitting?: {
    /** Allowed fractions (e.g., [0.5, 0.25]) */
    allowedFractions: number[];
    /** Formulations that cannot be split */
    notAllowed: string[];
  };
  /** Pediatric-specific rules */
  pediatricRules?: {
    /** Minimum tablet fraction by age */
    minTabletFraction?: {
      ageRanges: AgeFractionalRule[];
    };
  };
}

/**
 * Drug-drug interaction
 */
export interface DrugInteraction {
  /** Interacting drugs */
  drugs: string[];
  /** Severity level */
  severity: 'major' | 'moderate' | 'minor';
  /** Clinical effect */
  effect: string;
  /** Recommendation */
  recommendation: string;
}

/**
 * Clinical override documentation
 */
export interface OverrideTemplate {
  /** Required fields for override */
  requiredFields: string[];
  /** Example override documentation */
  example: string;
}

/**
 * Complete guardrails schema
 */
export interface GuardrailsSchema {
  /** Schema version */
  version: string;
  /** Effective date */
  effective_date: string;
  /** Approvers */
  approved_by: Approver[];
  /** Medication-specific constraints */
  medications: Record<string, MedicationConstraints>;
  /** Injection route constraints */
  injection_constraints: Record<string, InjectionConstraints>;
  /** Reconstitution rules */
  reconstitution_rules: ReconstitutionRules;
  /** Special handling requirements */
  special_handling: SpecialHandling;
  /** Fractional dosing rules */
  fractional_dosing: FractionalDosing;
  /** Drug interactions */
  drug_interactions: DrugInteraction[];
  /** Override documentation template */
  override_template: OverrideTemplate;
}

/**
 * Type guard for GuardrailsSchema
 */
export function isGuardrailsSchema(value: any): value is GuardrailsSchema {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.version === 'string' &&
    typeof value.effective_date === 'string' &&
    Array.isArray(value.approved_by) &&
    typeof value.medications === 'object'
  );
}

/**
 * Type guard for Contraindication
 */
export function isContraindication(value: any): value is Contraindication {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.condition === 'string' &&
    ['absolute', 'relative'].includes(value.severity) &&
    typeof value.message === 'string'
  );
}

/**
 * Type guard for DoseLimit
 */
export function isDoseLimit(value: any): value is DoseLimit {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.value === 'number' &&
    typeof value.unit === 'string'
  );
}

/**
 * Clinical override information
 */
export interface ClinicalOverride {
  /** Reason for override */
  reason: string;
  /** Prescriber name */
  prescriber: string;
  /** Override date */
  date: string;
  /** Patient-specific factors */
  patientSpecificFactors?: string[];
  /** Original constraint that was overridden */
  constraintOverridden: string;
}

/**
 * Validation result for guardrail checks
 */
export interface GuardrailValidationResult {
  /** Whether the check passed */
  valid: boolean;
  /** Validation errors if any */
  errors?: GuardrailViolation[];
  /** Warnings that don't prevent proceeding */
  warnings?: GuardrailWarning[];
}

/**
 * Guardrail violation details
 */
export interface GuardrailViolation {
  /** Type of violation */
  type: 'dose_limit' | 'contraindication' | 'interaction' | 'route_constraint';
  /** Severity level */
  severity: 'error' | 'warning';
  /** Human-readable message */
  message: string;
  /** Constraint that was violated */
  constraint: string;
  /** Actual value that violated the constraint */
  actualValue?: any;
  /** Expected/allowed value */
  expectedValue?: any;
}

/**
 * Guardrail warning (non-blocking)
 */
export interface GuardrailWarning {
  /** Warning type */
  type: string;
  /** Warning message */
  message: string;
  /** Recommendation */
  recommendation?: string;
}