/**
 * Immutable Value Objects for Medication Signature Builder
 * 
 * Provides type-safe, immutable value objects for doses, frequencies, and routes.
 * Uses branded types to prevent mixing incompatible units at compile time.
 * 
 * @since 2.0.0
 */

// ===== Branded Types =====

/**
 * Branded type for mass measurements (solid medications)
 */
export type Mass = {
  readonly _brand: 'Mass';
  readonly value: number;
  readonly unit: MassUnit;
};

/**
 * Branded type for volume measurements (liquid medications)
 */
export type Volume = {
  readonly _brand: 'Volume';
  readonly value: number;
  readonly unit: VolumeUnit;
};

/**
 * Branded type for count measurements (discrete units)
 */
export type Count = {
  readonly _brand: 'Count';
  readonly value: number;
  readonly unit: CountUnit;
};

/**
 * Valid mass units
 */
export type MassUnit = 'mcg' | 'mg' | 'g' | 'kg';

/**
 * Valid volume units
 */
export type VolumeUnit = 'mL' | 'L';

/**
 * Valid count units
 */
export type CountUnit = 'tablet' | 'capsule' | 'patch' | 'suppository' | 'click' | 'puff' | 'drop';

/**
 * All mass units as const array
 */
export const MASS_UNITS: readonly MassUnit[] = ['mcg', 'mg', 'g', 'kg'] as const;

/**
 * All volume units as const array
 */
export const VOLUME_UNITS: readonly VolumeUnit[] = ['mL', 'L'] as const;

/**
 * All count units as const array
 */
export const COUNT_UNITS: readonly CountUnit[] = ['tablet', 'capsule', 'patch', 'suppository', 'click', 'puff', 'drop'] as const;

/**
 * Factory function for creating Mass values
 */
export function mass(value: number, unit: MassUnit): Mass {
  if (value <= 0) {
    throw new Error('Mass value must be positive');
  }
  if (!MASS_UNITS.includes(unit)) {
    throw new Error(`Invalid mass unit: ${unit}`);
  }
  return { _brand: 'Mass', value, unit };
}

/**
 * Factory function for creating Volume values
 */
export function volume(value: number, unit: VolumeUnit): Volume {
  if (value <= 0) {
    throw new Error('Volume value must be positive');
  }
  if (!VOLUME_UNITS.includes(unit)) {
    throw new Error(`Invalid volume unit: ${unit}`);
  }
  return { _brand: 'Volume', value, unit };
}

/**
 * Factory function for creating Count values
 */
export function count(value: number, unit: CountUnit): Count {
  if (value <= 0) {
    throw new Error('Count value must be positive');
  }
  if (!COUNT_UNITS.includes(unit)) {
    throw new Error(`Invalid count unit: ${unit}`);
  }
  return { _brand: 'Count', value, unit };
}

/**
 * Type guard for Mass
 */
export function isMass(value: any): value is Mass {
  return value !== null && typeof value === 'object' && value._brand === 'Mass';
}

/**
 * Type guard for Volume
 */
export function isVolume(value: any): value is Volume {
  return value !== null && typeof value === 'object' && value._brand === 'Volume';
}

/**
 * Type guard for Count
 */
export function isCount(value: any): value is Count {
  return value !== null && typeof value === 'object' && value._brand === 'Count';
}

// ===== Dose Value Object =====

/**
 * JSON representation of a Dose
 */
export type DoseJSON = 
  | { type: 'mass'; value: number; unit: MassUnit }
  | { type: 'volume'; value: number; unit: VolumeUnit }
  | { type: 'count'; value: number; unit: CountUnit };

/**
 * Immutable Dose value object
 * 
 * Encapsulates a medication dose with type-safe units.
 * Prevents mixing mass/volume/count at compile and runtime.
 */
export class Dose {
  private constructor(
    private readonly branded: Mass | Volume | Count
  ) {}

  /**
   * Create a dose from mass measurement
   */
  static fromMass(value: number, unit: MassUnit): Dose {
    return new Dose(mass(value, unit));
  }

  /**
   * Create a dose from volume measurement
   */
  static fromVolume(value: number, unit: VolumeUnit): Dose {
    return new Dose(volume(value, unit));
  }

  /**
   * Create a dose from count measurement
   */
  static fromCount(value: number, unit: CountUnit): Dose {
    return new Dose(count(value, unit));
  }

  /**
   * Create a dose from a branded type
   */
  static fromBranded(branded: Mass | Volume | Count): Dose {
    return new Dose(branded);
  }

  /**
   * Get the numeric value
   */
  getValue(): number {
    return this.branded.value;
  }

  /**
   * Get the unit as a string
   */
  getUnit(): string {
    return this.branded.unit;
  }

  /**
   * Check if this is a mass dose
   */
  isMass(): boolean {
    return isMass(this.branded);
  }

  /**
   * Check if this is a volume dose
   */
  isVolume(): boolean {
    return isVolume(this.branded);
  }

  /**
   * Check if this is a count dose
   */
  isCount(): boolean {
    return isCount(this.branded);
  }

  /**
   * Get the underlying branded type
   */
  getBranded(): Mass | Volume | Count {
    return this.branded;
  }

  /**
   * Check equality with another dose
   */
  equals(other: Dose): boolean {
    // Must be same type
    if (this.branded._brand !== other.branded._brand) {
      throw new Error('Cannot compare different dose types');
    }
    
    return this.branded.value === other.branded.value &&
           this.branded.unit === other.branded.unit;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): DoseJSON {
    if (isMass(this.branded)) {
      return { type: 'mass', value: this.branded.value, unit: this.branded.unit };
    } else if (isVolume(this.branded)) {
      return { type: 'volume', value: this.branded.value, unit: this.branded.unit };
    } else {
      return { type: 'count', value: this.branded.value, unit: this.branded.unit };
    }
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: DoseJSON): Dose {
    switch (json.type) {
      case 'mass':
        return Dose.fromMass(json.value, json.unit);
      case 'volume':
        return Dose.fromVolume(json.value, json.unit);
      case 'count':
        return Dose.fromCount(json.value, json.unit);
      default:
        throw new Error(`Unknown dose type: ${(json as any).type}`);
    }
  }
}

/**
 * Type guard for Dose
 */
export function isDose(value: any): value is Dose {
  return value instanceof Dose;
}

// ===== Frequency Value Object =====

/**
 * Period units for frequency
 */
export type PeriodUnit = 'hour' | 'day' | 'week' | 'month';

/**
 * When to take medication
 */
export type WhenTiming = 'morning' | 'noon' | 'evening' | 'bedtime';

/**
 * Regular frequency data
 */
interface RegularFrequency {
  type: 'regular';
  times: number;
  period: number;
  periodUnit: PeriodUnit;
  when?: WhenTiming[];
}

/**
 * PRN (as needed) frequency data
 */
interface PRNFrequency {
  type: 'prn';
  minInterval: number;
  intervalUnit: PeriodUnit;
  indication?: string;
  maxPerDay?: number;
}

/**
 * JSON representation of Frequency
 */
export type FrequencyJSON = RegularFrequency | PRNFrequency;

/**
 * Immutable Frequency value object
 * 
 * Represents how often a medication should be taken.
 * Supports both regular schedules and PRN (as needed).
 */
export class Frequency {
  private constructor(
    private readonly data: RegularFrequency | PRNFrequency
  ) {}

  /**
   * Create a regular frequency
   */
  static create(params: {
    times: number;
    period: number;
    periodUnit: PeriodUnit;
    when?: WhenTiming[];
  }): Frequency {
    if (params.times <= 0) {
      throw new Error('Times must be positive');
    }
    if (params.period <= 0) {
      throw new Error('Period must be positive');
    }
    if (!['hour', 'day', 'week', 'month'].includes(params.periodUnit)) {
      throw new Error(`Invalid period unit: ${params.periodUnit}`);
    }
    
    return new Frequency({
      type: 'regular',
      times: params.times,
      period: params.period,
      periodUnit: params.periodUnit,
      when: params.when
    });
  }

  /**
   * Create a PRN (as needed) frequency
   */
  static createPRN(params: {
    minInterval: number;
    intervalUnit: PeriodUnit;
    indication?: string;
    maxPerDay?: number;
  }): Frequency {
    if (params.minInterval <= 0) {
      throw new Error('Minimum interval must be positive');
    }
    if (!['hour', 'day', 'week', 'month'].includes(params.intervalUnit)) {
      throw new Error(`Invalid interval unit: ${params.intervalUnit}`);
    }
    
    return new Frequency({
      type: 'prn',
      minInterval: params.minInterval,
      intervalUnit: params.intervalUnit,
      indication: params.indication,
      maxPerDay: params.maxPerDay
    });
  }

  // Common frequency patterns
  static daily(): Frequency {
    return Frequency.create({ times: 1, period: 1, periodUnit: 'day' });
  }

  static twiceDaily(): Frequency {
    return Frequency.create({ times: 2, period: 1, periodUnit: 'day' });
  }

  static threeTimesDaily(): Frequency {
    return Frequency.create({ times: 3, period: 1, periodUnit: 'day' });
  }

  static fourTimesDaily(): Frequency {
    return Frequency.create({ times: 4, period: 1, periodUnit: 'day' });
  }

  static everyXHours(hours: number): Frequency {
    return Frequency.create({ times: 1, period: hours, periodUnit: 'hour' });
  }

  /**
   * Check if this is a PRN frequency
   */
  isPRN(): boolean {
    return this.data.type === 'prn';
  }

  /**
   * Get times per period (for regular frequencies)
   */
  getTimes(): number {
    if (this.data.type === 'regular') {
      return this.data.times;
    }
    throw new Error('Times not available for PRN frequency');
  }

  /**
   * Get period value
   */
  getPeriod(): number {
    if (this.data.type === 'regular') {
      return this.data.period;
    }
    throw new Error('Period not available for PRN frequency');
  }

  /**
   * Get period unit
   */
  getPeriodUnit(): PeriodUnit {
    if (this.data.type === 'regular') {
      return this.data.periodUnit;
    }
    return this.data.intervalUnit;
  }

  /**
   * Get when timings
   */
  getWhen(): WhenTiming[] | undefined {
    if (this.data.type === 'regular') {
      return this.data.when;
    }
    return undefined;
  }

  /**
   * Get minimum interval (for PRN)
   */
  getMinInterval(): number {
    if (this.data.type === 'prn') {
      return this.data.minInterval;
    }
    throw new Error('Min interval not available for regular frequency');
  }

  /**
   * Get indication (for PRN)
   */
  getIndication(): string | undefined {
    if (this.data.type === 'prn') {
      return this.data.indication;
    }
    return undefined;
  }

  /**
   * Check equality
   */
  equals(other: Frequency): boolean {
    if (this.data.type !== other.data.type) {
      return false;
    }
    
    if (this.data.type === 'regular' && other.data.type === 'regular') {
      return this.data.times === other.data.times &&
             this.data.period === other.data.period &&
             this.data.periodUnit === other.data.periodUnit &&
             JSON.stringify(this.data.when) === JSON.stringify(other.data.when);
    }
    
    if (this.data.type === 'prn' && other.data.type === 'prn') {
      return this.data.minInterval === other.data.minInterval &&
             this.data.intervalUnit === other.data.intervalUnit &&
             this.data.indication === other.data.indication &&
             this.data.maxPerDay === other.data.maxPerDay;
    }
    
    return false;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): FrequencyJSON {
    return { ...this.data };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: FrequencyJSON): Frequency {
    if (json.type === 'regular') {
      return Frequency.create({
        times: json.times,
        period: json.period,
        periodUnit: json.periodUnit,
        when: json.when
      });
    } else {
      return Frequency.createPRN({
        minInterval: json.minInterval,
        intervalUnit: json.intervalUnit,
        indication: json.indication,
        maxPerDay: json.maxPerDay
      });
    }
  }
}

/**
 * Type guard for Frequency
 */
export function isFrequency(value: any): value is Frequency {
  return value instanceof Frequency;
}

// ===== Route Value Object =====

/**
 * Route verbs based on administration method
 */
export const ROUTE_VERBS = {
  Take: ['by mouth', 'orally', 'with water', 'with food'],
  Apply: ['topically', 'to skin', 'to affected area', 'externally'],
  Inject: ['subcutaneously', 'intramuscularly', 'subcutaneous', 'intramuscular'],
  Infuse: ['intravenously', 'via IV', 'IV'],
  Place: ['sublingually', 'under tongue', 'buccally', 'in cheek'],
  Insert: ['rectally', 'vaginally', 'per rectum'],
  Inhale: ['by inhalation', 'inhaled', 'via nebulizer'],
  Instill: ['in eye', 'in ear', 'ophthalmic', 'otic']
} as const;

/**
 * JSON representation of Route
 */
export interface RouteJSON {
  value: string;
  verb: string;
}

/**
 * Immutable Route value object
 * 
 * Represents how a medication is administered,
 * including the appropriate verb for instructions.
 */
export class Route {
  private readonly value: string;
  private readonly verb: string;

  private constructor(value: string, verb: string) {
    this.value = value;
    this.verb = verb;
  }

  /**
   * Create a route with automatic verb determination
   */
  static create(route: string): Route {
    const trimmed = route.trim();
    if (!trimmed) {
      throw new Error('Route cannot be empty');
    }
    
    const verb = Route.determineVerb(trimmed);
    return new Route(trimmed, verb);
  }

  /**
   * Determine the appropriate verb for a route
   */
  private static determineVerb(route: string): string {
    const lowerRoute = route.toLowerCase();
    
    for (const [verb, patterns] of Object.entries(ROUTE_VERBS)) {
      if (patterns.some(pattern => lowerRoute.includes(pattern))) {
        return verb;
      }
    }
    
    // Default verb for unknown routes
    return 'Administer';
  }

  // Common route factories
  static oral(): Route {
    return Route.create('by mouth');
  }

  static sublingual(): Route {
    return Route.create('sublingually');
  }

  static topical(): Route {
    return Route.create('topically');
  }

  static subcutaneous(): Route {
    return Route.create('subcutaneously');
  }

  static intramuscular(): Route {
    return Route.create('intramuscularly');
  }

  static intravenous(): Route {
    return Route.create('intravenously');
  }

  static rectal(): Route {
    return Route.create('rectally');
  }

  static inhaled(): Route {
    return Route.create('by inhalation');
  }

  /**
   * Get the route value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get the verb for this route
   */
  getVerb(): string {
    return this.verb;
  }

  /**
   * Check equality
   */
  equals(other: Route): boolean {
    return this.value === other.value && this.verb === other.verb;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): RouteJSON {
    return {
      value: this.value,
      verb: this.verb
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: RouteJSON): Route {
    return new Route(json.value, json.verb);
  }
}

/**
 * Type guard for Route
 */
export function isRoute(value: any): value is Route {
  return value instanceof Route;
}