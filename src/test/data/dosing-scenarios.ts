/**
 * Dosing Scenarios for Golden Master Testing
 * 
 * Comprehensive collection of dose inputs, routes, frequencies, and
 * special instructions for systematic testing coverage.
 * 
 * @since 3.1.0
 */

export interface DoseScenario {
  id: string;
  description: string;
  dose: {
    value: number;
    unit: string;
    maxValue?: number;
  };
  category: 'standard' | 'fractional' | 'range' | 'high' | 'low' | 'conversion';
}

export interface RouteScenario {
  id: string;
  route: string;
  category: 'oral' | 'topical' | 'injection' | 'other';
  applicableDoseForms: string[];
}

export interface FrequencyScenario {
  id: string;
  frequency: string;
  category: 'daily' | 'weekly' | 'asNeeded' | 'complex';
  description: string;
}

export interface SpecialInstructionScenario {
  id: string;
  instructions: string;
  category: 'timing' | 'location' | 'technique' | 'precaution';
  applicableRoutes: string[];
}

/**
 * Standard tablet dose scenarios
 */
export const TABLET_DOSE_SCENARIOS: DoseScenario[] = [
  // Whole tablets
  { id: 'tablet-1', description: '1 tablet', dose: { value: 1, unit: 'tablet' }, category: 'standard' },
  { id: 'tablet-2', description: '2 tablets', dose: { value: 2, unit: 'tablet' }, category: 'standard' },
  { id: 'tablet-3', description: '3 tablets', dose: { value: 3, unit: 'tablet' }, category: 'standard' },
  { id: 'tablet-4', description: '4 tablets', dose: { value: 4, unit: 'tablet' }, category: 'standard' },

  // Fractional tablets
  { id: 'tablet-quarter', description: '1/4 tablet', dose: { value: 0.25, unit: 'tablet' }, category: 'fractional' },
  { id: 'tablet-half', description: '1/2 tablet', dose: { value: 0.5, unit: 'tablet' }, category: 'fractional' },
  { id: 'tablet-three-quarter', description: '3/4 tablet', dose: { value: 0.75, unit: 'tablet' }, category: 'fractional' },
  { id: 'tablet-1.5', description: '1 1/2 tablets', dose: { value: 1.5, unit: 'tablet' }, category: 'fractional' },
  { id: 'tablet-2.5', description: '2 1/2 tablets', dose: { value: 2.5, unit: 'tablet' }, category: 'fractional' },

  // Range dosing
  { id: 'tablet-range-1-2', description: '1-2 tablets', dose: { value: 1, unit: 'tablet', maxValue: 2 }, category: 'range' },
  { id: 'tablet-range-2-3', description: '2-3 tablets', dose: { value: 2, unit: 'tablet', maxValue: 3 }, category: 'range' },
  { id: 'tablet-range-half-1', description: '1/2-1 tablet', dose: { value: 0.5, unit: 'tablet', maxValue: 1 }, category: 'range' }
];

/**
 * Capsule dose scenarios  
 */
export const CAPSULE_DOSE_SCENARIOS: DoseScenario[] = [
  { id: 'capsule-1', description: '1 capsule', dose: { value: 1, unit: 'capsule' }, category: 'standard' },
  { id: 'capsule-2', description: '2 capsules', dose: { value: 2, unit: 'capsule' }, category: 'standard' },
  { id: 'capsule-3', description: '3 capsules', dose: { value: 3, unit: 'capsule' }, category: 'standard' },
  { id: 'capsule-range-1-2', description: '1-2 capsules', dose: { value: 1, unit: 'capsule', maxValue: 2 }, category: 'range' }
];

/**
 * Liquid volume dose scenarios
 */
export const LIQUID_VOLUME_SCENARIOS: DoseScenario[] = [
  // Standard volumes
  { id: 'volume-1ml', description: '1 mL', dose: { value: 1, unit: 'mL' }, category: 'standard' },
  { id: 'volume-2.5ml', description: '2.5 mL', dose: { value: 2.5, unit: 'mL' }, category: 'standard' },
  { id: 'volume-5ml', description: '5 mL', dose: { value: 5, unit: 'mL' }, category: 'standard' },
  { id: 'volume-10ml', description: '10 mL', dose: { value: 10, unit: 'mL' }, category: 'standard' },
  { id: 'volume-15ml', description: '15 mL', dose: { value: 15, unit: 'mL' }, category: 'standard' },

  // Fractional volumes
  { id: 'volume-0.25ml', description: '0.25 mL', dose: { value: 0.25, unit: 'mL' }, category: 'fractional' },
  { id: 'volume-0.5ml', description: '0.5 mL', dose: { value: 0.5, unit: 'mL' }, category: 'fractional' },
  { id: 'volume-0.75ml', description: '0.75 mL', dose: { value: 0.75, unit: 'mL' }, category: 'fractional' },

  // High volumes
  { id: 'volume-20ml', description: '20 mL', dose: { value: 20, unit: 'mL' }, category: 'high' },
  { id: 'volume-30ml', description: '30 mL', dose: { value: 30, unit: 'mL' }, category: 'high' },

  // Very low pediatric volumes
  { id: 'volume-0.1ml', description: '0.1 mL', dose: { value: 0.1, unit: 'mL' }, category: 'low' },
  { id: 'volume-0.05ml', description: '0.05 mL', dose: { value: 0.05, unit: 'mL' }, category: 'low' }
];

/**
 * Weight-based dose scenarios (mg, mcg, g)
 */
export const WEIGHT_DOSE_SCENARIOS: DoseScenario[] = [
  // Milligrams
  { id: 'weight-50mg', description: '50 mg', dose: { value: 50, unit: 'mg' }, category: 'standard' },
  { id: 'weight-100mg', description: '100 mg', dose: { value: 100, unit: 'mg' }, category: 'standard' },
  { id: 'weight-250mg', description: '250 mg', dose: { value: 250, unit: 'mg' }, category: 'standard' },
  { id: 'weight-500mg', description: '500 mg', dose: { value: 500, unit: 'mg' }, category: 'standard' },
  { id: 'weight-1000mg', description: '1000 mg', dose: { value: 1000, unit: 'mg' }, category: 'standard' },

  // Micrograms
  { id: 'weight-25mcg', description: '25 mcg', dose: { value: 25, unit: 'mcg' }, category: 'low' },
  { id: 'weight-50mcg', description: '50 mcg', dose: { value: 50, unit: 'mcg' }, category: 'low' },
  { id: 'weight-100mcg', description: '100 mcg', dose: { value: 100, unit: 'mcg' }, category: 'low' },
  { id: 'weight-200mcg', description: '200 mcg', dose: { value: 200, unit: 'mcg' }, category: 'low' },

  // Grams
  { id: 'weight-1g', description: '1 g', dose: { value: 1, unit: 'g' }, category: 'high' },
  { id: 'weight-2g', description: '2 g', dose: { value: 2, unit: 'g' }, category: 'high' },

  // Very low pediatric doses
  { id: 'weight-0.1mg', description: '0.1 mg', dose: { value: 0.1, unit: 'mg' }, category: 'low' },
  { id: 'weight-0.05mg', description: '0.05 mg', dose: { value: 0.05, unit: 'mg' }, category: 'low' },

  // Range dosing
  { id: 'weight-range-100-200mg', description: '100-200 mg', dose: { value: 100, unit: 'mg', maxValue: 200 }, category: 'range' },
  { id: 'weight-range-250-500mg', description: '250-500 mg', dose: { value: 250, unit: 'mg', maxValue: 500 }, category: 'range' }
];

/**
 * Unit-based dose scenarios (insulin, vitamins)
 */
export const UNIT_DOSE_SCENARIOS: DoseScenario[] = [
  // Insulin units
  { id: 'units-5', description: '5 units', dose: { value: 5, unit: 'units' }, category: 'standard' },
  { id: 'units-10', description: '10 units', dose: { value: 10, unit: 'units' }, category: 'standard' },
  { id: 'units-15', description: '15 units', dose: { value: 15, unit: 'units' }, category: 'standard' },
  { id: 'units-20', description: '20 units', dose: { value: 20, unit: 'units' }, category: 'standard' },
  { id: 'units-25', description: '25 units', dose: { value: 25, unit: 'units' }, category: 'standard' },

  // International units (vitamins)
  { id: 'iu-1000', description: '1000 IU', dose: { value: 1000, unit: 'IU' }, category: 'standard' },
  { id: 'iu-2000', description: '2000 IU', dose: { value: 2000, unit: 'IU' }, category: 'standard' },
  { id: 'iu-5000', description: '5000 IU', dose: { value: 5000, unit: 'IU' }, category: 'high' },
  { id: 'iu-50000', description: '50000 IU', dose: { value: 50000, unit: 'IU' }, category: 'high' }
];

/**
 * Topical dose scenarios (clicks, applications)
 */
export const TOPICAL_DOSE_SCENARIOS: DoseScenario[] = [
  // Topiclick doses
  { id: 'clicks-2', description: '2 clicks', dose: { value: 2, unit: 'click' }, category: 'standard' },
  { id: 'clicks-4', description: '4 clicks', dose: { value: 4, unit: 'click' }, category: 'standard' },
  { id: 'clicks-6', description: '6 clicks', dose: { value: 6, unit: 'click' }, category: 'standard' },
  { id: 'clicks-8', description: '8 clicks', dose: { value: 8, unit: 'click' }, category: 'standard' },
  { id: 'clicks-12', description: '12 clicks', dose: { value: 12, unit: 'click' }, category: 'high' },

  // Standard applications
  { id: 'application-1', description: '1 application', dose: { value: 1, unit: 'application' }, category: 'standard' },
  { id: 'application-2', description: '2 applications', dose: { value: 2, unit: 'application' }, category: 'standard' },

  // Pea-sized, rice-sized amounts
  { id: 'pea-sized', description: 'pea-sized amount', dose: { value: 1, unit: 'pea-sized amount' }, category: 'standard' },
  { id: 'rice-sized', description: 'rice-sized amount', dose: { value: 1, unit: 'rice-sized amount' }, category: 'standard' }
];

/**
 * Route scenarios organized by category
 */
export const ROUTE_SCENARIOS: RouteScenario[] = [
  // Oral routes
  { id: 'route-by-mouth', route: 'Orally', category: 'oral', applicableDoseForms: ['tablet', 'capsule', 'solution', 'suspension'] },
  { id: 'route-orally', route: 'orally', category: 'oral', applicableDoseForms: ['tablet', 'capsule', 'solution', 'suspension'] },
  { id: 'route-po', route: 'PO', category: 'oral', applicableDoseForms: ['tablet', 'capsule', 'solution', 'suspension'] },
  { id: 'route-sublingual', route: 'sublingually', category: 'oral', applicableDoseForms: ['tablet', 'solution'] },

  // Topical routes
  { id: 'route-topically', route: 'topically', category: 'topical', applicableDoseForms: ['cream', 'ointment', 'gel'] },
  { id: 'route-affected-area', route: 'to affected area', category: 'topical', applicableDoseForms: ['cream', 'ointment', 'gel'] },
  { id: 'route-to-skin', route: 'to skin', category: 'topical', applicableDoseForms: ['cream', 'ointment', 'gel'] },

  // Injection routes
  { id: 'route-im', route: 'intramuscularly', category: 'injection', applicableDoseForms: ['injection'] },
  { id: 'route-subq', route: 'subcutaneously', category: 'injection', applicableDoseForms: ['injection'] },
  { id: 'route-iv', route: 'intravenously', category: 'injection', applicableDoseForms: ['injection'] },
  { id: 'route-sc', route: 'SC', category: 'injection', applicableDoseForms: ['injection'] },

  // Other routes
  { id: 'route-rectally', route: 'rectally', category: 'other', applicableDoseForms: ['suppository'] },
  { id: 'route-inhaled', route: 'by inhalation', category: 'other', applicableDoseForms: ['inhaler'] }
];

/**
 * Frequency scenarios
 */
export const FREQUENCY_SCENARIOS: FrequencyScenario[] = [
  // Daily frequencies
  { id: 'freq-daily', frequency: 'once daily', category: 'daily', description: 'Once per day' },
  { id: 'freq-bid', frequency: 'twice daily', category: 'daily', description: 'Twice per day' },
  { id: 'freq-tid', frequency: 'three times daily', category: 'daily', description: 'Three times per day' },
  { id: 'freq-qid', frequency: 'four times daily', category: 'daily', description: 'Four times per day' },
  { id: 'freq-q6h', frequency: 'every 6 hours', category: 'daily', description: 'Every 6 hours' },
  { id: 'freq-q8h', frequency: 'every 8 hours', category: 'daily', description: 'Every 8 hours' },
  { id: 'freq-q12h', frequency: 'every 12 hours', category: 'daily', description: 'Every 12 hours' },

  // Weekly frequencies
  { id: 'freq-weekly', frequency: 'once weekly', category: 'weekly', description: 'Once per week' },
  { id: 'freq-biweekly', frequency: 'twice weekly', category: 'weekly', description: 'Twice per week' },
  { id: 'freq-q2weeks', frequency: 'every 2 weeks', category: 'weekly', description: 'Every 2 weeks' },

  // As needed
  { id: 'freq-prn-4h', frequency: 'every 4 hours as needed', category: 'asNeeded', description: 'As needed, max every 4 hours' },
  { id: 'freq-prn-6h', frequency: 'every 6 hours as needed', category: 'asNeeded', description: 'As needed, max every 6 hours' },
  { id: 'freq-prn-pain', frequency: 'as needed for pain', category: 'asNeeded', description: 'As needed for pain' },

  // Complex schedules
  { id: 'freq-am', frequency: 'every morning', category: 'complex', description: 'Once daily in morning' },
  { id: 'freq-bedtime', frequency: 'at bedtime', category: 'complex', description: 'Once daily at bedtime' },
  { id: 'freq-meals', frequency: 'with meals', category: 'complex', description: 'Three times daily with meals' }
];

/**
 * Special instruction scenarios
 */
export const SPECIAL_INSTRUCTION_SCENARIOS: SpecialInstructionScenario[] = [
  // Timing instructions
  { id: 'instr-with-food', instructions: 'with food', category: 'timing', applicableRoutes: ['oral'] },
  { id: 'instr-without-food', instructions: 'on empty stomach', category: 'timing', applicableRoutes: ['oral'] },
  { id: 'instr-before-meals', instructions: '30 minutes before meals', category: 'timing', applicableRoutes: ['oral'] },
  { id: 'instr-after-meals', instructions: 'after meals', category: 'timing', applicableRoutes: ['oral'] },
  { id: 'instr-bedtime', instructions: 'at bedtime', category: 'timing', applicableRoutes: ['oral'] },

  // Location instructions
  { id: 'instr-rotate-sites', instructions: 'rotate injection sites', category: 'location', applicableRoutes: ['injection'] },
  { id: 'instr-thigh', instructions: 'into thigh', category: 'location', applicableRoutes: ['injection'] },
  { id: 'instr-abdomen', instructions: 'into abdomen', category: 'location', applicableRoutes: ['injection'] },
  { id: 'instr-upper-arm', instructions: 'into upper arm', category: 'location', applicableRoutes: ['injection'] },
  { id: 'instr-affected-area', instructions: 'to affected area only', category: 'location', applicableRoutes: ['topical'] },

  // Technique instructions
  { id: 'instr-shake-well', instructions: 'shake well before use', category: 'technique', applicableRoutes: ['oral'] },
  { id: 'instr-rub-in', instructions: 'rub in thoroughly', category: 'technique', applicableRoutes: ['topical'] },
  { id: 'instr-thin-layer', instructions: 'apply thin layer', category: 'technique', applicableRoutes: ['topical'] },
  { id: 'instr-topiclick', instructions: 'using Topiclick dispenser', category: 'technique', applicableRoutes: ['topical'] },

  // Precautions
  { id: 'instr-do-not-crush', instructions: 'do not crush or chew', category: 'precaution', applicableRoutes: ['oral'] },
  { id: 'instr-refrigerate', instructions: 'refrigerate after opening', category: 'precaution', applicableRoutes: ['oral'] },
  { id: 'instr-avoid-eyes', instructions: 'avoid contact with eyes', category: 'precaution', applicableRoutes: ['topical'] },
  { id: 'instr-wash-hands', instructions: 'wash hands after application', category: 'precaution', applicableRoutes: ['topical'] }
];

/**
 * Get all dose scenarios by category
 */
export function getDoseScenariosByCategory(category: string): DoseScenario[] {
  const allScenarios = [
    ...TABLET_DOSE_SCENARIOS,
    ...CAPSULE_DOSE_SCENARIOS,
    ...LIQUID_VOLUME_SCENARIOS,
    ...WEIGHT_DOSE_SCENARIOS,
    ...UNIT_DOSE_SCENARIOS,
    ...TOPICAL_DOSE_SCENARIOS
  ];
  
  return allScenarios.filter(scenario => scenario.category === category);
}

/**
 * Get route scenarios for specific dose form
 */
export function getRouteScenarios(doseForm: string): RouteScenario[] {
  return ROUTE_SCENARIOS.filter(route => 
    route.applicableDoseForms.includes(doseForm.toLowerCase())
  );
}

/**
 * Get compatible special instructions for route
 */
export function getSpecialInstructions(route: string): SpecialInstructionScenario[] {
  const routeCategory = ROUTE_SCENARIOS.find(r => r.route === route)?.category || 'other';
  return SPECIAL_INSTRUCTION_SCENARIOS.filter(instr => 
    instr.applicableRoutes.includes(routeCategory)
  );
}

/**
 * All scenario collections
 */
export const DOSING_SCENARIOS = {
  doses: {
    tablets: TABLET_DOSE_SCENARIOS,
    capsules: CAPSULE_DOSE_SCENARIOS,
    volumes: LIQUID_VOLUME_SCENARIOS,
    weights: WEIGHT_DOSE_SCENARIOS,
    units: UNIT_DOSE_SCENARIOS,
    topicals: TOPICAL_DOSE_SCENARIOS
  },
  routes: ROUTE_SCENARIOS,
  frequencies: FREQUENCY_SCENARIOS,
  specialInstructions: SPECIAL_INSTRUCTION_SCENARIOS
};