/**
 * Titration Days Supply Strategy
 * 
 * Handles multi-phase dosing schedules where dose amounts change
 * over time (e.g., GLP-1 agonist dose escalation protocols).
 * 
 * @since 3.1.0
 */

import { DaysSupplyContext, TitrationPhase, isFHIRTiming } from '../../temporal/types';
import { FHIRTemporalParser } from '../../temporal/FHIRTemporalParser';
import { SpecificityLevel } from '../types';
import {
  IDaysSupplyStrategy,
  DaysSupplyResult,
  TitrationBreakdown,
  CalculationBreakdown,
  createDaysSupplyResult,
  CALCULATION_CONSTANTS,
  InvalidTitrationScheduleError
} from './types';
import { calculationUtils } from './CalculationUtils';

export class TitrationDaysSupplyStrategy implements IDaysSupplyStrategy {
  readonly specificity = SpecificityLevel.DOSE_FORM_AND_INGREDIENT;
  readonly id = 'titration-days-supply';
  readonly name = 'Titration Days Supply Calculator';
  
  private readonly temporalParser = new FHIRTemporalParser();

  /**
   * Determines if this strategy matches the given context
   */
  matches(context: DaysSupplyContext): boolean {
    // Check if timing is an array (multiple phases)
    if (Array.isArray(context.timing)) {
      return context.timing.length > 1;
    }

    // Check if timing is a titration sequence string
    if (typeof context.timing === 'string') {
      const parseResult = this.temporalParser.parse(context.timing);
      return parseResult.isTitration;
    }

    // Check if timing is array of FHIR timings
    if (Array.isArray(context.timing) && context.timing.every(isFHIRTiming)) {
      return context.timing.length > 1;
    }

    return false;
  }

  /**
   * Calculates days supply for titration schedule
   */
  calculate(context: DaysSupplyContext): DaysSupplyResult {
    const startTime = Date.now();

    try {
      // Validate inputs
      const validationErrors = calculationUtils.validateInputs(context);
      if (validationErrors.length > 0) {
        throw new InvalidTitrationScheduleError(
          `Invalid inputs: ${validationErrors.join(', ')}`,
          context
        );
      }

      // Parse titration phases
      const phases = this.parseTitrationPhases(context);
      if (phases.length === 0) {
        throw new InvalidTitrationScheduleError(
          'No valid titration phases found',
          context
        );
      }

      // Calculate days supply for each phase
      const result = this.calculateTitrationDaysSupply(context, phases);

      // Check performance
      const executionTime = Date.now() - startTime;
      const warnings = result.warnings || [];
      if (executionTime > CALCULATION_CONSTANTS.MAX_CALCULATION_TIME_MS) {
        warnings.push(`Calculation took ${executionTime}ms (exceeds ${CALCULATION_CONSTANTS.MAX_CALCULATION_TIME_MS}ms target)`);
      }

      return {
        ...result,
        warnings
      };

    } catch (error) {
      if (error instanceof InvalidTitrationScheduleError) {
        throw error;
      }

      throw new InvalidTitrationScheduleError(
        `Titration calculation failed: ${error.message}`,
        context
      );
    }
  }

  /**
   * Parse titration phases from context
   */
  private parseTitrationPhases(context: DaysSupplyContext): TitrationPhase[] {
    // Handle different timing input types
    if (Array.isArray(context.timing)) {
      if (typeof context.timing[0] === 'string') {
        // Array of strings
        const parseResult = this.temporalParser.parse(context.timing as string[]);
        return parseResult.phases || [];
      } else if (isFHIRTiming(context.timing[0])) {
        // Array of FHIR timings - convert to phases
        return this.convertFHIRTimingsToPhases(context.timing as any[], context);
      }
    }

    if (typeof context.timing === 'string') {
      // Single string with titration sequence
      const parseResult = this.temporalParser.parse(context.timing);
      return parseResult.phases || [];
    }

    return [];
  }

  /**
   * Convert FHIR timings to titration phases
   */
  private convertFHIRTimingsToPhases(timings: any[], context: DaysSupplyContext): TitrationPhase[] {
    return timings.map((timing, index) => {
      const duration = this.temporalParser.calculatePhaseDuration(timing);
      const isMaintenancePhase = !duration || duration.value === Infinity;

      return {
        timing,
        doseAmount: context.doseAmount, // Default, may be overridden
        doseUnit: context.doseUnit,
        duration: duration || { value: Infinity, unit: 'd' },
        isMaintenancePhase,
        description: timing.code?.text || `Phase ${index + 1}`,
        phaseIndex: index
      };
    });
  }

  /**
   * Calculate total days supply for titration schedule
   */
  private calculateTitrationDaysSupply(
    context: DaysSupplyContext,
    phases: TitrationPhase[]
  ): DaysSupplyResult {
    
    let remainingQuantity = context.packageQuantity;
    let totalDays = 0;
    const phaseBreakdowns: TitrationBreakdown['phases'] = [];
    const conversions: CalculationBreakdown['conversions'] = [];
    const warnings: string[] = [];

    // Process each phase sequentially
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      
      if (remainingQuantity <= 0) {
        warnings.push(`Supply exhausted before phase ${i + 1}: ${phase.description}`);
        break;
      }

      const phaseResult = this.calculatePhaseSupply(
        phase,
        remainingQuantity,
        context
      );

      phaseBreakdowns.push(phaseResult.breakdown);
      if (phaseResult.conversions) {
        conversions.push(...phaseResult.conversions);
      }

      if (phase.isMaintenancePhase) {
        // Maintenance phase continues indefinitely
        totalDays += phaseResult.additionalDays;
        remainingQuantity = 0; // All remaining medication consumed
        break;
      } else {
        // Fixed phase duration
        totalDays += phaseResult.phaseDays;
        remainingQuantity -= phaseResult.totalConsumption;
      }
    }

    // Create titration breakdown
    const titrationBreakdown: TitrationBreakdown = {
      phases: phaseBreakdowns,
      titrationConsumption: context.packageQuantity - remainingQuantity,
      titrationDays: totalDays,
      remainingQuantity: Math.max(0, remainingQuantity),
      maintenancePhase: this.getMaintenancePhaseInfo(phases, phaseBreakdowns)
    };

    // Create overall breakdown
    const breakdown: CalculationBreakdown = {
      packageQuantity: context.packageQuantity,
      packageUnit: context.packageUnit,
      doseAmount: context.doseAmount,
      doseUnit: context.doseUnit,
      dosesPerDay: 0, // Not applicable for titration
      consumptionPerDay: 0, // Varies by phase
      conversions,
      titrationBreakdown
    };

    return createDaysSupplyResult(
      totalDays,
      'Multi-phase titration calculation',
      breakdown,
      CALCULATION_CONSTANTS.HIGH_CONFIDENCE,
      warnings
    );
  }

  /**
   * Calculate supply for a single phase
   */
  private calculatePhaseSupply(
    phase: TitrationPhase,
    availableQuantity: number,
    context: DaysSupplyContext
  ): {
    breakdown: TitrationBreakdown['phases'][0];
    conversions?: CalculationBreakdown['conversions'];
    phaseDays: number;
    totalConsumption: number;
    additionalDays: number;
  } {
    
    const timing = phase.timing.repeat;
    if (!timing?.frequency || !timing?.period || !timing?.periodUnit) {
      throw new InvalidTitrationScheduleError(
        `Invalid timing in phase: ${phase.description}`,
        context
      );
    }

    // Calculate doses per day for this phase
    const dosesPerDay = calculationUtils.calculateDosesPerDay(
      timing.frequency,
      timing.period,
      timing.periodUnit
    );

    // Get effective dose amount (may be different per phase)
    const effectiveDoseAmount = this.getEffectiveDoseAmount(phase, context);

    // Calculate consumption per day with conversions
    const consumptionResult = calculationUtils.calculateConsumptionPerDay(
      effectiveDoseAmount,
      phase.doseUnit,
      context.packageUnit,
      dosesPerDay,
      context.medication || {}
    );

    let phaseDays = 0;
    let totalConsumption = 0;
    let additionalDays = 0;

    if (phase.isMaintenancePhase) {
      // Maintenance phase: use all remaining medication
      additionalDays = Math.floor(availableQuantity / consumptionResult.consumptionPerDay);
      totalConsumption = availableQuantity;
      phaseDays = 0; // Not counted in phase calculation
    } else {
      // Fixed phase: calculate based on duration or count
      phaseDays = this.calculatePhaseDurationInDays(phase);
      
      if (timing.count) {
        // Count-based phase
        const dosesInPhase = timing.count;
        totalConsumption = dosesInPhase * effectiveDoseAmount;
        
        // Apply conversions to total consumption
        if (consumptionResult.conversions.length > 0) {
          const conversionFactor = consumptionResult.conversions[0].factor;
          totalConsumption *= conversionFactor;
        }
      } else {
        // Duration-based phase
        totalConsumption = consumptionResult.consumptionPerDay * phaseDays;
      }

      // Check if we have enough medication for the full phase
      if (totalConsumption > availableQuantity) {
        phaseDays = Math.floor(availableQuantity / consumptionResult.consumptionPerDay);
        totalConsumption = availableQuantity;
      }
    }

    const breakdown: TitrationBreakdown['phases'][0] = {
      phaseIndex: phase.phaseIndex,
      description: phase.description,
      doseAmount: effectiveDoseAmount,
      doseUnit: phase.doseUnit,
      dosesInPhase: phase.isMaintenancePhase ? 0 : (timing.count || dosesPerDay * phaseDays),
      totalConsumption,
      phaseDurationDays: phaseDays
    };

    return {
      breakdown,
      conversions: consumptionResult.conversions,
      phaseDays,
      totalConsumption,
      additionalDays
    };
  }

  /**
   * Get effective dose amount for a phase (may vary by phase)
   */
  private getEffectiveDoseAmount(phase: TitrationPhase, context: DaysSupplyContext): number {
    // If phase has specific dose amount, use it
    if (phase.doseAmount > 0) {
      return phase.doseAmount;
    }

    // Otherwise use context dose
    return context.doseAmount;
  }

  /**
   * Calculate phase duration in days
   */
  private calculatePhaseDurationInDays(phase: TitrationPhase): number {
    if (phase.duration.value === Infinity) {
      return 0; // Maintenance phase
    }

    return calculationUtils.convertDurationToDays(
      phase.duration.value,
      phase.duration.unit
    );
  }

  /**
   * Get maintenance phase information
   */
  private getMaintenancePhaseInfo(
    phases: TitrationPhase[],
    breakdowns: TitrationBreakdown['phases']
  ): TitrationBreakdown['maintenancePhase'] | undefined {
    
    const maintenancePhase = phases.find(p => p.isMaintenancePhase);
    if (!maintenancePhase) {
      return undefined;
    }

    const maintenanceBreakdown = breakdowns.find(b => 
      b.phaseIndex === maintenancePhase.phaseIndex
    );

    if (!maintenanceBreakdown) {
      return undefined;
    }

    const timing = maintenancePhase.timing.repeat!;
    const dosesPerDay = calculationUtils.calculateDosesPerDay(
      timing.frequency!,
      timing.period!,
      timing.periodUnit!
    );

    return {
      doseAmount: maintenanceBreakdown.doseAmount,
      dosesPerDay,
      consumptionPerDay: maintenanceBreakdown.totalConsumption / 
                         (maintenanceBreakdown.phaseDurationDays || 1),
      additionalDays: maintenanceBreakdown.phaseDurationDays
    };
  }

  /**
   * Explains the strategy's behavior
   */
  explain(): string {
    return `Calculates days supply for multi-phase titration schedules where dose amounts ` +
           `change over time. Handles dose escalation protocols common in GLP-1 agonists, ` +
           `insulin therapy, and other medications requiring gradual dose increases. ` +
           `Accounts for each phase's duration, dose amount, and frequency to provide ` +
           `accurate total medication supply duration.`;
  }
}

/**
 * Example usage and test cases for titration calculation
 */
export const TITRATION_EXAMPLES = {
  GLP1_AGONIST: {
    description: 'GLP-1 agonist dose escalation (Ozempic/Wegovy pattern)',
    phases: [
      'Week 1-4: Inject 12.5 units once weekly',
      'Week 5-8: Inject 25 units once weekly',
      'Week 9+: Inject 50 units once weekly'
    ],
    expectedCalculation: {
      week1to4: { doses: 4, unitsPerDose: 12.5, totalUnits: 50 },
      week5to8: { doses: 4, unitsPerDose: 25, totalUnits: 100 },
      titrationTotal: 150,
      maintenanceUnitsPerWeek: 50
    }
  },
  
  INSULIN_TITRATION: {
    description: 'Insulin dose titration protocol',
    phases: [
      'Week 1-2: Inject 10 units once daily',
      'Week 3-4: Inject 15 units once daily',
      'Week 5+: Inject 20 units once daily'
    ],
    expectedCalculation: {
      week1to2: { doses: 14, unitsPerDose: 10, totalUnits: 140 },
      week3to4: { doses: 14, unitsPerDose: 15, totalUnits: 210 },
      titrationTotal: 350,
      maintenanceUnitsPerDay: 20
    }
  }
} as const;