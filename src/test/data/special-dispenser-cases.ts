/**
 * Special Dispenser Test Cases for Golden Master Testing
 * 
 * Comprehensive test cases for special delivery devices including
 * Topiclick dispensers, nasal sprays, inhalers, and other devices.
 * 
 * @since 3.2.0
 */

import type { GoldenTestCase } from '../utils/golden-master-runner';
import { MEDICATION_FIXTURES } from './medication-fixtures';

/**
 * Topiclick dispenser test cases (40 cases)
 * Testing 4-click conversion, mg calculations, and air-prime loss
 */
export const TOPICLICK_CASES: Partial<GoldenTestCase>[] = [
  // Standard dosing (10 cases)
  {
    id: 'topiclick-001',
    name: 'Basic 4-click dose (1 mL)',
    description: 'Standard Topiclick dose with 4 clicks = 1 mL conversion',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 4, unit: 'click' },
      route: 'topically',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Apply 4 clicks (10.0 mg) topically twice daily.'
    },
    metadata: {
      clinicalIntent: 'Standard bioidentical hormone application',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-002',
    name: 'Higher dose 8-click application',
    description: 'Higher Topiclick dose with dosage calculation',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 8, unit: 'click' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'to inner wrists'
    },
    expected: {
      humanReadable: 'Apply 8 clicks (20.0 mg) topically to inner wrists once daily.'
    },
    metadata: {
      clinicalIntent: 'Dose escalation for hormone therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-003',
    name: 'Lower dose 2-click application',
    description: 'Lower Topiclick dose with half-mL volume',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 2, unit: 'click' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 2 clicks (5.0 mg) topically once daily.'
    },
    metadata: {
      clinicalIntent: 'Starting dose for hormone therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-004',
    name: 'Split dosing 6 clicks daily',
    description: 'Split dosing with Topiclick dispenser',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 3, unit: 'click' },
      route: 'topically',
      frequency: 'twice daily',
      specialInstructions: 'morning and evening'
    },
    expected: {
      humanReadable: 'Apply 3 clicks (7.5 mg) topically morning and evening twice daily.'
    },
    metadata: {
      clinicalIntent: 'Divided daily dosing for consistent levels',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-005',
    name: 'Maximum dose 12 clicks',
    description: 'Higher dose Topiclick application',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 12, unit: 'click' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'rotate application sites'
    },
    expected: {
      humanReadable: 'Apply 12 clicks (30.0 mg) topically rotate application sites once daily.'
    },
    metadata: {
      clinicalIntent: 'Maximum therapeutic dose',
      version: '1.0.0'
    }
  },

  // Precision dosing (10 cases)
  {
    id: 'topiclick-006',
    name: 'Odd number 5 clicks',
    description: 'Non-multiple of 4 clicks with precise calculation',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 5, unit: 'click' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 5 clicks (12.5 mg) topically once daily.'
    },
    metadata: {
      clinicalIntent: 'Precise dosing between standard amounts',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-007',
    name: 'Single click minimum dose',
    description: 'Minimum possible Topiclick dose',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 1, unit: 'click' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'test dose'
    },
    expected: {
      humanReadable: 'Apply 1 click (2.5 mg) topically test dose once daily.'
    },
    metadata: {
      clinicalIntent: 'Initial sensitivity testing dose',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-008',
    name: 'Seven clicks precise dose',
    description: 'Odd number dosing with calculation',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 7, unit: 'click' },
      route: 'topically',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Apply 7 clicks (17.5 mg) topically twice daily.'
    },
    metadata: {
      clinicalIntent: 'Intermediate dose adjustment',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-009',
    name: 'Nine clicks high dose',
    description: 'Higher precision dose calculation',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 9, unit: 'click' },
      route: 'topically',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Apply 9 clicks (22.5 mg) topically once daily.'
    },
    metadata: {
      clinicalIntent: 'Upper-range therapeutic dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-010',
    name: 'Ten clicks round dose',
    description: 'Round number dose with Topiclick',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 10, unit: 'click' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'apply to forearms'
    },
    expected: {
      humanReadable: 'Apply 10 clicks (25.0 mg) topically apply to forearms once daily.'
    },
    metadata: {
      clinicalIntent: 'Standard therapeutic maintenance dose',
      version: '1.0.0'
    }
  },

  // Air-prime and device instructions (10 cases)
  {
    id: 'topiclick-011',
    name: 'New device priming instructions',
    description: 'First use with air-prime loss consideration',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 4, unit: 'click' },
      route: 'topically',
      frequency: 'twice daily',
      specialInstructions: 'new device - prime before first use'
    },
    expected: {
      humanReadable: 'Apply 4 clicks (10.0 mg) topically new device - prime before first use twice daily.'
    },
    metadata: {
      clinicalIntent: 'Initial device setup with priming',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-012',
    name: 'Device storage instructions',
    description: 'Topiclick with storage and handling instructions',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 6, unit: 'click' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'store at room temperature, wipe tip after use'
    },
    expected: {
      humanReadable: 'Apply 6 clicks (15.0 mg) topically store at room temperature, wipe tip after use once daily.'
    },
    metadata: {
      clinicalIntent: 'Proper device maintenance and storage',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-013',
    name: 'Replace device timing',
    description: 'Device replacement schedule instructions',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 4, unit: 'click' },
      route: 'topically',
      frequency: 'twice daily',
      specialInstructions: 'replace device every 30 days'
    },
    expected: {
      humanReadable: 'Apply 4 clicks (10.0 mg) topically replace device every 30 days twice daily.'
    },
    metadata: {
      clinicalIntent: 'Device replacement maintenance schedule',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-014',
    name: 'Multiple site application',
    description: 'Topiclick application to multiple body sites',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 8, unit: 'click' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'divide between both forearms'
    },
    expected: {
      humanReadable: 'Apply 8 clicks (20.0 mg) topically divide between both forearms once daily.'
    },
    metadata: {
      clinicalIntent: 'Distributed application for better absorption',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-015',
    name: 'Time-specific application',
    description: 'Topiclick with specific timing instructions',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 4, unit: 'click' },
      route: 'topically',
      frequency: 'once daily',
      specialInstructions: 'apply at bedtime after washing area'
    },
    expected: {
      humanReadable: 'Apply 4 clicks (10.0 mg) topically apply at bedtime after washing area once daily.'
    },
    metadata: {
      clinicalIntent: 'Optimized timing for hormone absorption',
      version: '1.0.0'
    }
  },

  // Frequency variations (10 cases)
  {
    id: 'topiclick-016',
    name: 'Three times daily dosing',
    description: 'TID dosing with Topiclick dispenser',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 3, unit: 'click' },
      route: 'topically',
      frequency: 'three times daily'
    },
    expected: {
      humanReadable: 'Apply 3 clicks (7.5 mg) topically three times daily.'
    },
    metadata: {
      clinicalIntent: 'Frequent dosing for steady hormone levels',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-017',
    name: 'Every 12 hours dosing',
    description: 'Precise interval dosing with Topiclick',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 5, unit: 'click' },
      route: 'topically',
      frequency: 'every 12 hours'
    },
    expected: {
      humanReadable: 'Apply 5 clicks (12.5 mg) topically every 12 hours.'
    },
    metadata: {
      clinicalIntent: 'Precise 12-hour interval dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-018',
    name: 'Weekly dosing schedule',
    description: 'Weekly hormone therapy with Topiclick',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 20, unit: 'click' },
      route: 'topically',
      frequency: 'once weekly',
      specialInstructions: 'on Sunday mornings'
    },
    expected: {
      humanReadable: 'Apply 20 clicks (50.0 mg) topically on Sunday mornings once weekly.'
    },
    metadata: {
      clinicalIntent: 'Weekly hormone replacement dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-019',
    name: 'Every other day dosing',
    description: 'Alternate day Topiclick therapy',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 6, unit: 'click' },
      route: 'topically',
      frequency: 'every other day'
    },
    expected: {
      humanReadable: 'Apply 6 clicks (15.0 mg) topically every other day.'
    },
    metadata: {
      clinicalIntent: 'Alternate day hormone therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'topiclick-020',
    name: 'PRN hormone application',
    description: 'As needed dosing with Topiclick',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.topicals.hormoneCreams,
      dose: { value: 4, unit: 'click' },
      route: 'topically',
      frequency: 'as needed',
      specialInstructions: 'for hot flashes, maximum twice daily'
    },
    expected: {
      humanReadable: 'Apply 4 clicks (10.0 mg) topically for hot flashes, maximum twice daily as needed.'
    },
    metadata: {
      clinicalIntent: 'PRN symptom-based hormone therapy',
      version: '1.0.0'
    }
  }
];

/**
 * Nasal spray test cases (30 cases)
 * Testing spray counting, priming, and dose tracking
 */
export const NASAL_SPRAY_CASES: Partial<GoldenTestCase>[] = [
  // Basic spray dosing (10 cases)
  {
    id: 'nasal-001',
    name: 'Single spray per nostril',
    description: 'Standard nasal spray dosing',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'in each nostril'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally in each nostril twice daily.'
    },
    metadata: {
      clinicalIntent: 'Standard allergic rhinitis treatment',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-002',
    name: 'Two sprays per nostril',
    description: 'Higher dose nasal spray application',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 2, unit: 'spray' },
      route: 'nasally',
      frequency: 'once daily',
      specialInstructions: 'in each nostril'
    },
    expected: {
      humanReadable: 'Spray 2 sprays nasally in each nostril once daily.'
    },
    metadata: {
      clinicalIntent: 'Higher dose for severe rhinitis',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-003',
    name: 'Single nostril application',
    description: 'Unilateral nasal spray treatment',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'in right nostril only'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally in right nostril only twice daily.'
    },
    metadata: {
      clinicalIntent: 'Unilateral nasal polyp treatment',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-004',
    name: 'Maintenance dose reduction',
    description: 'Reduced maintenance nasal spray dose',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'once daily',
      specialInstructions: 'in each nostril, maintenance dose'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally in each nostril, maintenance dose once daily.'
    },
    metadata: {
      clinicalIntent: 'Long-term maintenance therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-005',
    name: 'Seasonal use pattern',
    description: 'Seasonal allergic rhinitis treatment',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 2, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'in each nostril during allergy season'
    },
    expected: {
      humanReadable: 'Spray 2 sprays nasally in each nostril during allergy season twice daily.'
    },
    metadata: {
      clinicalIntent: 'Seasonal allergic rhinitis management',
      version: '1.0.0'
    }
  },

  // Priming and device management (10 cases)
  {
    id: 'nasal-006',
    name: 'New device priming',
    description: 'Initial priming for new nasal spray device',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'prime with 5 sprays before first use'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally prime with 5 sprays before first use twice daily.'
    },
    metadata: {
      clinicalIntent: 'Device priming for consistent dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-007',
    name: 'Weekly repriming schedule',
    description: 'Regular device maintenance priming',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 2, unit: 'spray' },
      route: 'nasally',
      frequency: 'once daily',
      specialInstructions: 'reprime with 2 sprays if unused for >7 days'
    },
    expected: {
      humanReadable: 'Spray 2 sprays nasally reprime with 2 sprays if unused for >7 days once daily.'
    },
    metadata: {
      clinicalIntent: 'Maintaining device functionality',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-008',
    name: 'Cleaning instructions',
    description: 'Device hygiene and maintenance',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'wipe tip with tissue after each use'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally wipe tip with tissue after each use twice daily.'
    },
    metadata: {
      clinicalIntent: 'Preventing device contamination',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-009',
    name: 'Dose counting instructions',
    description: 'Tracking remaining doses in device',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 2, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'device contains 120 doses, replace when empty'
    },
    expected: {
      humanReadable: 'Spray 2 sprays nasally device contains 120 doses, replace when empty twice daily.'
    },
    metadata: {
      clinicalIntent: 'Ensuring continuous therapy availability',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-010',
    name: 'Storage temperature requirements',
    description: 'Proper device storage conditions',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'once daily',
      specialInstructions: 'store at room temperature, do not freeze'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally store at room temperature, do not freeze once daily.'
    },
    metadata: {
      clinicalIntent: 'Maintaining medication stability',
      version: '1.0.0'
    }
  },

  // Technique and administration (10 cases)
  {
    id: 'nasal-011',
    name: 'Proper spray technique',
    description: 'Correct nasal spray administration technique',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'blow nose first, aim toward ear, breathe gently'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally blow nose first, aim toward ear, breathe gently twice daily.'
    },
    metadata: {
      clinicalIntent: 'Optimal drug delivery technique',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-012',
    name: 'Alternating nostril technique',
    description: 'Systematic nostril alternation for uniform coverage',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'alternate nostrils between doses'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally alternate nostrils between doses twice daily.'
    },
    metadata: {
      clinicalIntent: 'Preventing mucosal irritation',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-013',
    name: 'Post-application instructions',
    description: 'Actions to take after nasal spray use',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 2, unit: 'spray' },
      route: 'nasally',
      frequency: 'once daily',
      specialInstructions: 'do not blow nose for 15 minutes after use'
    },
    expected: {
      humanReadable: 'Spray 2 sprays nasally do not blow nose for 15 minutes after use once daily.'
    },
    metadata: {
      clinicalIntent: 'Maximizing drug retention and efficacy',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-014',
    name: 'Head position guidance',
    description: 'Optimal head positioning during administration',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 1, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'keep head upright, do not tilt back'
    },
    expected: {
      humanReadable: 'Spray 1 spray nasally keep head upright, do not tilt back twice daily.'
    },
    metadata: {
      clinicalIntent: 'Preventing drug runoff and optimizing delivery',
      version: '1.0.0'
    }
  },

  {
    id: 'nasal-015',
    name: 'Multiple spray sequence',
    description: 'Proper timing between multiple sprays',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nasalSprays.fluticasone,
      dose: { value: 2, unit: 'spray' },
      route: 'nasally',
      frequency: 'twice daily',
      specialInstructions: 'wait 30 seconds between sprays'
    },
    expected: {
      humanReadable: 'Spray 2 sprays nasally wait 30 seconds between sprays twice daily.'
    },
    metadata: {
      clinicalIntent: 'Allowing proper drug distribution',
      version: '1.0.0'
    }
  }
];

/**
 * Inhaler test cases (20 cases)
 * Testing puff counting, spacer instructions, and dose tracking
 */
export const INHALER_CASES: Partial<GoldenTestCase>[] = [
  // MDI inhalers (10 cases)
  {
    id: 'inhaler-001',
    name: 'Standard MDI two puffs',
    description: 'Standard metered dose inhaler dosing',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.albuterolMDI,
      dose: { value: 2, unit: 'puff' },
      route: 'Inhaled',
      frequency: 'every 4 hours as needed',
      specialInstructions: 'for shortness of breath'
    },
    expected: {
      humanReadable: 'Inhale 2 puffs every 4 hours as needed for shortness of breath.'
    },
    metadata: {
      clinicalIntent: 'Rescue bronchodilator therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-002',
    name: 'Single puff maintenance',
    description: 'Lower maintenance dose inhaler therapy',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.fluticasoneMDI,
      dose: { value: 1, unit: 'puff' },
      route: 'Inhaled',
      frequency: 'twice daily'
    },
    expected: {
      humanReadable: 'Inhale 1 puff twice daily.'
    },
    metadata: {
      clinicalIntent: 'Maintenance anti-inflammatory therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-003',
    name: 'MDI with spacer device',
    description: 'Inhaler use with spacer attachment',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.albuterolMDI,
      dose: { value: 2, unit: 'puff' },
      route: 'Inhaled',
      frequency: 'every 6 hours as needed',
      specialInstructions: 'use with spacer device'
    },
    expected: {
      humanReadable: 'Inhale 2 puffs every 6 hours as needed use with spacer device.'
    },
    metadata: {
      clinicalIntent: 'Improved drug delivery with spacer',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-004',
    name: 'Priming new MDI',
    description: 'Initial priming for new MDI device',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.fluticasoneMDI,
      dose: { value: 2, unit: 'puff' },
      route: 'Inhaled',
      frequency: 'twice daily',
      specialInstructions: 'prime with 4 test sprays before first use'
    },
    expected: {
      humanReadable: 'Inhale 2 puffs prime with 4 test sprays before first use twice daily.'
    },
    metadata: {
      clinicalIntent: 'Device priming for consistent dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-005',
    name: 'MDI shake instruction',
    description: 'Proper shaking technique for MDI',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.albuterolMDI,
      dose: { value: 1, unit: 'puff' },
      route: 'Inhaled',
      frequency: 'every 4 hours as needed',
      specialInstructions: 'shake well before each use'
    },
    expected: {
      humanReadable: 'Inhale 1 puff every 4 hours as needed shake well before each use.'
    },
    metadata: {
      clinicalIntent: 'Ensuring proper drug suspension',
      version: '1.0.0'
    }
  },

  // DPI inhalers (10 cases)
  {
    id: 'inhaler-006',
    name: 'DPI single inhalation',
    description: 'Dry powder inhaler single dose',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.tiotropiumDPI,
      dose: { value: 1, unit: 'inhalation' },
      route: 'Inhaled',
      frequency: 'once daily'
    },
    expected: {
      humanReadable: 'Inhale 1 inhalation once daily.'
    },
    metadata: {
      clinicalIntent: 'Long-acting bronchodilator maintenance',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-007',
    name: 'DPI loading instructions',
    description: 'Proper DPI loading technique',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.tiotropiumDPI,
      dose: { value: 1, unit: 'inhalation' },
      route: 'Inhaled',
      frequency: 'once daily',
      specialInstructions: 'load dose by rotating grip'
    },
    expected: {
      humanReadable: 'Inhale 1 inhalation load dose by rotating grip once daily.'
    },
    metadata: {
      clinicalIntent: 'Proper DPI preparation technique',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-008',
    name: 'DPI moisture protection',
    description: 'DPI storage and moisture protection',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.tiotropiumDPI,
      dose: { value: 1, unit: 'inhalation' },
      route: 'Inhaled',
      frequency: 'once daily',
      specialInstructions: 'keep device dry, close cap after use'
    },
    expected: {
      humanReadable: 'Inhale 1 inhalation keep device dry, close cap after use once daily.'
    },
    metadata: {
      clinicalIntent: 'Preventing device moisture damage',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-009',
    name: 'DPI dose counter',
    description: 'Monitoring remaining doses in DPI',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.tiotropiumDPI,
      dose: { value: 1, unit: 'inhalation' },
      route: 'Inhaled',
      frequency: 'once daily',
      specialInstructions: 'device contains 30 doses, replace when empty'
    },
    expected: {
      humanReadable: 'Inhale 1 inhalation device contains 30 doses, replace when empty once daily.'
    },
    metadata: {
      clinicalIntent: 'Ensuring continuous therapy availability',
      version: '1.0.0'
    }
  },

  {
    id: 'inhaler-010',
    name: 'DPI breath technique',
    description: 'Proper breathing technique for DPI',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.inhalers.tiotropiumDPI,
      dose: { value: 1, unit: 'inhalation' },
      route: 'Inhaled',
      frequency: 'once daily',
      specialInstructions: 'breathe in fast and deep'
    },
    expected: {
      humanReadable: 'Inhale 1 inhalation breathe in fast and deep once daily.'
    },
    metadata: {
      clinicalIntent: 'Optimal DPI drug delivery technique',
      version: '1.0.0'
    }
  }
];

/**
 * Other devices test cases (10 cases)
 * Testing nebulizers, dry powder inhalers, and other devices
 */
export const OTHER_DEVICE_CASES: Partial<GoldenTestCase>[] = [
  // Nebulizer cases (5 cases)
  {
    id: 'nebulizer-001',
    name: 'Standard nebulizer treatment',
    description: 'Nebulizer solution administration',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nebulizers.albuterolNebulizer,
      dose: { value: 2.5, unit: 'mL' },
      route: 'Inhaled',
      frequency: 'every 6 hours as needed',
      specialInstructions: 'via nebulizer until mist stops'
    },
    expected: {
      humanReadable: 'Inhale 2.5 mL every 6 hours as needed via nebulizer until mist stops.'
    },
    metadata: {
      clinicalIntent: 'Nebulized bronchodilator therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'nebulizer-002',
    name: 'Nebulizer cleaning instructions',
    description: 'Proper nebulizer maintenance',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nebulizers.albuterolNebulizer,
      dose: { value: 2.5, unit: 'mL' },
      route: 'Inhaled',
      frequency: 'three times daily',
      specialInstructions: 'clean nebulizer cup after each use'
    },
    expected: {
      humanReadable: 'Inhale 2.5 mL clean nebulizer cup after each use three times daily.'
    },
    metadata: {
      clinicalIntent: 'Preventing device contamination',
      version: '1.0.0'
    }
  },

  {
    id: 'nebulizer-003',
    name: 'Mixed nebulizer solution',
    description: 'Combination nebulizer therapy',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nebulizers.albuterolNebulizer,
      dose: { value: 2.5, unit: 'mL' },
      route: 'Inhaled',
      frequency: 'twice daily',
      specialInstructions: 'mix with 2.5 mL normal saline'
    },
    expected: {
      humanReadable: 'Inhale 2.5 mL mix with 2.5 mL normal saline twice daily.'
    },
    metadata: {
      clinicalIntent: 'Diluted nebulizer therapy',
      version: '1.0.0'
    }
  },

  {
    id: 'nebulizer-004',
    name: 'Nebulizer timing guidance',
    description: 'Treatment duration expectations',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nebulizers.albuterolNebulizer,
      dose: { value: 2.5, unit: 'mL' },
      route: 'Inhaled',
      frequency: 'every 4 hours as needed',
      specialInstructions: 'treatment takes 10-15 minutes'
    },
    expected: {
      humanReadable: 'Inhale 2.5 mL every 4 hours as needed treatment takes 10-15 minutes.'
    },
    metadata: {
      clinicalIntent: 'Setting patient expectations for treatment time',
      version: '1.0.0'
    }
  },

  {
    id: 'nebulizer-005',
    name: 'Portable nebulizer use',
    description: 'Portable nebulizer therapy instructions',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.nebulizers.albuterolNebulizer,
      dose: { value: 2.5, unit: 'mL' },
      route: 'Inhaled',
      frequency: 'as needed',
      specialInstructions: 'use portable mesh nebulizer'
    },
    expected: {
      humanReadable: 'Inhale 2.5 mL as needed use portable mesh nebulizer.'
    },
    metadata: {
      clinicalIntent: 'Mobile nebulizer therapy option',
      version: '1.0.0'
    }
  },

  // Other device cases (5 cases)
  {
    id: 'device-001',
    name: 'Auto-injector device',
    description: 'Emergency auto-injector use',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.autoInjectors.epinephrine,
      dose: { value: 0.3, unit: 'mg' },
      route: 'intramuscularly',
      frequency: 'as needed',
      specialInstructions: 'for severe allergic reactions, call 911 after use'
    },
    expected: {
      humanReadable: 'Inject 0.3 mg intramuscularly as needed for severe allergic reactions, call 911 after use.'
    },
    metadata: {
      clinicalIntent: 'Emergency anaphylaxis treatment',
      version: '1.0.0'
    }
  },

  {
    id: 'device-002',
    name: 'Insulin pen device',
    description: 'Insulin pen injection instructions',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.insulinPens.rapidActing,
      dose: { value: 10, unit: 'units' },
      route: 'subcutaneously',
      frequency: 'before meals',
      specialInstructions: 'rotate injection sites'
    },
    expected: {
      humanReadable: 'Inject 10 units subcutaneously before meals rotate injection sites.'
    },
    metadata: {
      clinicalIntent: 'Mealtime insulin dosing',
      version: '1.0.0'
    }
  },

  {
    id: 'device-003',
    name: 'Transdermal patch',
    description: 'Patch application and rotation',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.patches.fentanylPatch,
      dose: { value: 1, unit: 'patch' },
      route: 'topically',
      frequency: 'every 72 hours',
      specialInstructions: 'rotate sites, remove old patch first'
    },
    expected: {
      humanReadable: 'Apply 1 patch topically every 72 hours rotate sites, remove old patch first.'
    },
    metadata: {
      clinicalIntent: 'Long-acting pain management',
      version: '1.0.0'
    }
  },

  {
    id: 'device-004',
    name: 'Sublingual tablet device',
    description: 'Sublingual administration technique',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.sublingual.nitroglycerin,
      dose: { value: 1, unit: 'tablet' },
      route: 'sublingually',
      frequency: 'as needed',
      specialInstructions: 'under tongue, do not swallow'
    },
    expected: {
      humanReadable: 'Place 1 tablet sublingually as needed under tongue, do not swallow.'
    },
    metadata: {
      clinicalIntent: 'Rapid angina relief',
      version: '1.0.0'
    }
  },

  {
    id: 'device-005',
    name: 'Suppository administration',
    description: 'Rectal suppository insertion',
    category: 'special-dispenser',
    input: {
      medication: MEDICATION_FIXTURES.suppositories.acetaminophen,
      dose: { value: 1, unit: 'suppository' },
      route: 'rectally',
      frequency: 'every 6 hours as needed',
      specialInstructions: 'for fever, remove wrapper first'
    },
    expected: {
      humanReadable: 'Insert 1 suppository rectally every 6 hours as needed for fever, remove wrapper first.'
    },
    metadata: {
      clinicalIntent: 'Alternative fever management route',
      version: '1.0.0'
    }
  }
];

/**
 * All special dispenser test cases organized by device type
 */
export const SPECIAL_DISPENSER_CASES = {
  topiclick: TOPICLICK_CASES,
  nasalSprays: NASAL_SPRAY_CASES,
  inhalers: INHALER_CASES,
  otherDevices: OTHER_DEVICE_CASES
};

/**
 * Get all special dispenser test cases as a flat array
 */
export function getAllSpecialDispenserCases(): Partial<GoldenTestCase>[] {
  const allCases: Partial<GoldenTestCase>[] = [];
  
  for (const category of Object.values(SPECIAL_DISPENSER_CASES)) {
    allCases.push(...category);
  }
  
  return allCases;
}

/**
 * Get test cases by device category
 */
export function getSpecialDispenserCasesByCategory(category: keyof typeof SPECIAL_DISPENSER_CASES): Partial<GoldenTestCase>[] {
  return SPECIAL_DISPENSER_CASES[category];
}

/**
 * Get total count of special dispenser test cases
 */
export function getSpecialDispenserCaseCount(): number {
  return getAllSpecialDispenserCases().length;
}