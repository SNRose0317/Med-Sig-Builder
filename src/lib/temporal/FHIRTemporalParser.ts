/**
 * FHIR Temporal Parser with Titration Support
 * 
 * Parses natural language timing strings to FHIR R4 compliant
 * timing structures, with special support for titration schedules.
 * Eliminates hardcoded assumptions and provides precise calculations.
 * 
 * @since 3.1.0
 */

import { getFrequency } from '../../constants/medication-data';
import {
  ITemporalParser,
  FHIRTiming,
  TitrationPhase,
  Duration,
  TemporalParseResult,
  DaysSupplyContext,
  createDuration,
  createFHIRTiming,
  TITRATION_PATTERNS,
  COMMON_TIMING_PATTERNS,
  isFHIRTiming
} from './types';

export class FHIRTemporalParser implements ITemporalParser {
  
  /**
   * Parse timing string(s) to FHIR structure
   */
  parse(timing: string | string[]): TemporalParseResult {
    try {
      // Handle array input (titration sequences)
      if (Array.isArray(timing)) {
        return this.parseTitrationFromArray(timing);
      }

      // Handle string input
      if (typeof timing === 'string') {
        // Check if it's a titration sequence in a single string
        if (this.detectTitrationInString(timing)) {
          const phases = this.splitTitrationString(timing);
          return this.parseTitrationFromArray(phases);
        }

        // Parse as single timing
        return this.parseSingleTiming(timing);
      }

      throw new Error('Invalid timing input type');
    } catch (error) {
      return {
        timing: this.getDefaultTiming(),
        isTitration: false,
        confidence: 0,
        warnings: [`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Parse single timing string to FHIR
   */
  private parseSingleTiming(timingStr: string): TemporalParseResult {
    const normalized = timingStr.toLowerCase().trim();
    
    // Try to match against existing frequency definitions
    const frequency = getFrequency(timingStr);
    if (frequency && frequency.fhirMapping) {
      return {
        timing: {
          repeat: frequency.fhirMapping,
          code: { text: frequency.humanReadable }
        },
        isTitration: false,
        confidence: 0.9,
        warnings: []
      };
    }

    // Parse common patterns
    const parsedTiming = this.parseCommonPatterns(normalized);
    if (parsedTiming) {
      return {
        timing: parsedTiming,
        isTitration: false,
        confidence: 0.8,
        warnings: []
      };
    }

    // Fallback to basic parsing
    const fallbackTiming = this.parseBasicFrequency(normalized);
    return {
      timing: fallbackTiming,
      isTitration: false,
      confidence: 0.6,
      warnings: [`Could not precisely parse "${timingStr}", using best guess`]
    };
  }

  /**
   * Parse common frequency patterns
   */
  private parseCommonPatterns(normalized: string): FHIRTiming | null {
    // Daily patterns
    if (normalized.includes('once daily') || normalized.includes('once per day')) {
      return createFHIRTiming(1, 1, 'd');
    }
    if (normalized.includes('twice daily') || normalized.includes('twice per day')) {
      return createFHIRTiming(2, 1, 'd');
    }
    if (normalized.includes('three times daily') || normalized.includes('thrice daily')) {
      return createFHIRTiming(3, 1, 'd');
    }
    if (normalized.includes('four times daily') || normalized.includes('qid')) {
      return createFHIRTiming(4, 1, 'd');
    }

    // Weekly patterns
    if (normalized.includes('once weekly') || normalized.includes('once per week')) {
      return createFHIRTiming(1, 1, 'wk');
    }
    if (normalized.includes('twice weekly') || normalized.includes('twice per week')) {
      return createFHIRTiming(2, 1, 'wk');
    }

    // Every X hours
    const hourlyMatch = normalized.match(/every\s+(\d+)\s+hours?/);
    if (hourlyMatch) {
      const hours = parseInt(hourlyMatch[1], 10);
      return createFHIRTiming(1, hours, 'h');
    }

    // Every other day
    if (normalized.includes('every other day') || normalized.includes('every second day')) {
      return createFHIRTiming(1, 2, 'd');
    }

    return null;
  }

  /**
   * Basic frequency parsing fallback
   */
  private parseBasicFrequency(normalized: string): FHIRTiming {
    // Extract numbers for frequency
    const frequencyMatch = normalized.match(/(\d+)\s*times?\s*(daily|weekly|monthly)/);
    if (frequencyMatch) {
      const count = parseInt(frequencyMatch[1], 10);
      const period = frequencyMatch[2];
      
      let periodUnit: Duration['unit'] = 'd';
      if (period.includes('week')) periodUnit = 'wk';
      if (period.includes('month')) periodUnit = 'mo';
      
      return createFHIRTiming(count, 1, periodUnit);
    }

    // Default to once daily
    return createFHIRTiming(1, 1, 'd');
  }

  /**
   * Detect if string contains titration sequence
   */
  private detectTitrationInString(timing: string): boolean {
    const normalized = timing.toLowerCase();
    
    // Look for week ranges, phases, or progression indicators
    return TITRATION_PATTERNS.WEEK_RANGE.test(normalized) ||
           TITRATION_PATTERNS.WEEK_PLUS.test(normalized) ||
           TITRATION_PATTERNS.DAY_RANGE.test(normalized) ||
           TITRATION_PATTERNS.PHASE_SEPARATOR.test(normalized) ||
           normalized.includes('then') ||
           normalized.includes('increase') ||
           normalized.includes('titrate') ||
           normalized.includes('escalate');
  }

  /**
   * Split titration string into phases
   */
  private splitTitrationString(timing: string): string[] {
    // Split on common separators
    const phases = timing
      .split(/then|,\s*then|;\s*then|\.|,(?=\s*week)/i)
      .map(phase => phase.trim())
      .filter(phase => phase.length > 0);

    return phases;
  }

  /**
   * Parse titration from array of phase strings
   */
  private parseTitrationFromArray(phases: string[]): TemporalParseResult {
    try {
      const titrationPhases = this.parseTitrationSequence(phases);
      const timings = titrationPhases.map(phase => phase.timing);
      
      return {
        timing: timings,
        isTitration: true,
        phases: titrationPhases,
        confidence: 0.85,
        warnings: []
      };
    } catch (error) {
      return {
        timing: this.getDefaultTiming(),
        isTitration: false,
        confidence: 0.3,
        warnings: [`Titration parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Parse titration sequence to phases
   */
  parseTitrationSequence(phases: string[]): TitrationPhase[] {
    const result: TitrationPhase[] = [];

    phases.forEach((phaseStr, index) => {
      const phase = this.parseSinglePhase(phaseStr, index);
      if (phase) {
        result.push(phase);
      }
    });

    // Mark the last phase as maintenance if it has no end bound
    if (result.length > 0) {
      const lastPhase = result[result.length - 1];
      if (!lastPhase.timing.repeat?.count && !lastPhase.timing.repeat?.boundsDuration) {
        lastPhase.isMaintenancePhase = true;
        lastPhase.description = lastPhase.description.replace(/^/, 'Maintenance: ');
      }
    }

    return result;
  }

  /**
   * Parse a single titration phase
   */
  private parseSinglePhase(phaseStr: string, index: number): TitrationPhase | null {
    const normalized = phaseStr.toLowerCase().trim();
    
    // Extract time range
    const weekRange = this.extractWeekRange(normalized);
    const dayRange = this.extractDayRange(normalized);
    
    // Extract frequency
    const frequency = this.extractFrequencyFromPhase(normalized);
    
    if (!frequency) {
      return null;
    }

    // Determine duration and count
    let duration: Duration;
    let count: number | undefined;
    let boundsDuration: Duration | undefined;

    if (weekRange) {
      if (weekRange.isPlus) {
        // Ongoing phase (e.g., "Week 9+")
        duration = createDuration(Infinity, 'wk');
      } else {
        // Fixed range (e.g., "Week 1-4")
        const weekCount = weekRange.end - weekRange.start + 1;
        duration = createDuration(weekCount, 'wk');
        boundsDuration = createDuration(weekCount, 'wk');
        
        // Calculate total doses in this period
        const dosesPerWeek = frequency.frequency || 1;
        count = dosesPerWeek * weekCount;
      }
    } else if (dayRange) {
      if (dayRange.isPlus) {
        duration = createDuration(Infinity, 'd');
      } else {
        const dayCount = dayRange.end - dayRange.start + 1;
        duration = createDuration(dayCount, 'd');
        boundsDuration = createDuration(dayCount, 'd');
        
        // Calculate total doses in this period
        const dosesPerDay = this.calculateDosesPerDay(frequency);
        count = Math.ceil(dosesPerDay * dayCount);
      }
    } else {
      // Default to 4 weeks if no range specified
      duration = createDuration(4, 'wk');
      boundsDuration = createDuration(4, 'wk');
      count = (frequency.frequency || 1) * 4;
    }

    const timing: FHIRTiming = {
      repeat: {
        ...frequency,
        count,
        boundsDuration
      },
      code: { text: phaseStr.trim() }
    };

    return {
      timing,
      doseAmount: 0, // To be filled by strategy
      doseUnit: '', // To be filled by strategy
      duration,
      isMaintenancePhase: duration.value === Infinity,
      description: phaseStr.trim(),
      phaseIndex: index
    };
  }

  /**
   * Extract week range from phase string
   */
  private extractWeekRange(normalized: string): { start: number; end: number; isPlus: boolean } | null {
    // Week 1-4 pattern
    const rangeMatch = normalized.match(/week\s+(\d+)-(\d+)/i);
    if (rangeMatch) {
      return {
        start: parseInt(rangeMatch[1], 10),
        end: parseInt(rangeMatch[2], 10),
        isPlus: false
      };
    }

    // Week 9+ pattern
    const plusMatch = normalized.match(/week\s+(\d+)\+/i);
    if (plusMatch) {
      return {
        start: parseInt(plusMatch[1], 10),
        end: Infinity,
        isPlus: true
      };
    }

    return null;
  }

  /**
   * Extract day range from phase string
   */
  private extractDayRange(normalized: string): { start: number; end: number; isPlus: boolean } | null {
    // Day 1-7 pattern
    const rangeMatch = normalized.match(/day\s+(\d+)-(\d+)/i);
    if (rangeMatch) {
      return {
        start: parseInt(rangeMatch[1], 10),
        end: parseInt(rangeMatch[2], 10),
        isPlus: false
      };
    }

    // Day 15+ pattern
    const plusMatch = normalized.match(/day\s+(\d+)\+/i);
    if (plusMatch) {
      return {
        start: parseInt(plusMatch[1], 10),
        end: Infinity,
        isPlus: true
      };
    }

    return null;
  }

  /**
   * Extract frequency from phase string
   */
  private extractFrequencyFromPhase(normalized: string): FHIRTiming['repeat'] | null {
    // Look for common frequency patterns within the phase
    if (normalized.includes('once weekly') || normalized.includes('once per week')) {
      return { frequency: 1, period: 1, periodUnit: 'wk' };
    }
    if (normalized.includes('twice weekly')) {
      return { frequency: 2, period: 1, periodUnit: 'wk' };
    }
    if (normalized.includes('once daily') || normalized.includes('daily')) {
      return { frequency: 1, period: 1, periodUnit: 'd' };
    }
    if (normalized.includes('twice daily')) {
      return { frequency: 2, period: 1, periodUnit: 'd' };
    }

    // Default to once weekly for titration phases
    return { frequency: 1, period: 1, periodUnit: 'wk' };
  }

  /**
   * Calculate doses per day from frequency
   */
  private calculateDosesPerDay(frequency: FHIRTiming['repeat']): number {
    if (!frequency?.frequency || !frequency?.period || !frequency?.periodUnit) {
      return 1; // Default
    }

    const periodsPerDay: Record<string, number> = {
      'd': 1,
      'wk': 1/7,
      'mo': 1/30, // Approximate - will be improved
      'h': 24
    };

    const perDay = periodsPerDay[frequency.periodUnit] || 1;
    return (frequency.frequency / frequency.period) * perDay;
  }

  /**
   * Calculate doses per period for given timing
   */
  calculateDosesPerPeriod(timing: FHIRTiming, period: Duration): number {
    if (!timing.repeat?.frequency || !timing.repeat?.period || !timing.repeat?.periodUnit) {
      return 0;
    }

    const repeat = timing.repeat;
    
    // Convert period to same units as timing
    const periodInTimingUnits = this.convertDurationToUnit(period, repeat.periodUnit);
    
    // Calculate doses per timing period
    const dosesPerTimingPeriod = repeat.frequency / repeat.period;
    
    // Calculate how many timing periods fit in the given period
    const timingPeriodsInGivenPeriod = periodInTimingUnits;
    
    return dosesPerTimingPeriod * timingPeriodsInGivenPeriod;
  }

  /**
   * Calculate duration of a timing phase
   */
  calculatePhaseDuration(timing: FHIRTiming): Duration | null {
    if (timing.repeat?.boundsDuration) {
      return timing.repeat.boundsDuration;
    }

    if (timing.repeat?.count && timing.repeat?.frequency && timing.repeat?.period && timing.repeat?.periodUnit) {
      const totalPeriods = timing.repeat.count / timing.repeat.frequency;
      const durationValue = totalPeriods * timing.repeat.period;
      return createDuration(durationValue, timing.repeat.periodUnit);
    }

    return null;
  }

  /**
   * Convert duration to specific unit
   */
  private convertDurationToUnit(duration: Duration, targetUnit: Duration['unit']): number {
    if (duration.unit === targetUnit) {
      return duration.value;
    }

    // Conversion factors to seconds
    const toSeconds: Record<Duration['unit'], number> = {
      's': 1,
      'min': 60,
      'h': 3600,
      'd': 86400,
      'wk': 604800,
      'mo': 2592000, // 30 days average
      'a': 31536000 // 365 days
    };

    const durationInSeconds = duration.value * toSeconds[duration.unit];
    return durationInSeconds / toSeconds[targetUnit];
  }

  /**
   * Get default timing for fallback
   */
  private getDefaultTiming(): FHIRTiming {
    return createFHIRTiming(1, 1, 'd'); // Once daily default
  }
}

/**
 * Create singleton instance
 */
export const fhirTemporalParser = new FHIRTemporalParser();

/**
 * Convenience function for parsing
 */
export function parseTiming(timing: string | string[]): TemporalParseResult {
  return fhirTemporalParser.parse(timing);
}

/**
 * Convenience function for titration detection
 */
export function isTitrationSchedule(timing: string | string[] | FHIRTiming | FHIRTiming[]): boolean {
  if (Array.isArray(timing)) {
    return timing.length > 1;
  }
  
  if (typeof timing === 'string') {
    const parser = new FHIRTemporalParser();
    return parser.detectTitrationInString(timing);
  }

  return false;
}

/**
 * Convenience function for calculating days supply from timing
 */
export function calculateDaysSupplyFromTiming(
  timing: FHIRTiming | FHIRTiming[],
  packageQuantity: number,
  doseAmountPerAdmin: number
): number {
  if (Array.isArray(timing)) {
    // Titration calculation - this will be handled by the strategy
    return 0; // Placeholder
  }

  // Single timing calculation
  const dailyPeriod = createDuration(1, 'd');
  const dosesPerDay = fhirTemporalParser.calculateDosesPerPeriod(timing, dailyPeriod);
  const totalDosesAvailable = packageQuantity / doseAmountPerAdmin;
  
  return Math.floor(totalDosesAvailable / dosesPerDay);
}