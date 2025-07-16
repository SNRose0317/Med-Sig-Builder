import { TemplateEngine } from './TemplateEngine';
import { TemplateKey, TemplateData } from './types';

// Template definitions based on SNR-114 specifications
export const TEMPLATES = {
  'en-US': {
    ORAL_TABLET_TEMPLATE: `{verb} {doseText} {route} {frequency}{specialInstructions}.`,

    LIQUID_DOSE_TEMPLATE: `{verb} {doseValue} {doseUnit}{dualDose} {route} {frequency}{specialInstructions}.`,

    TOPICAL_APPLICATION_TEMPLATE: `{verb} {doseText} {route}{site} {frequency}{specialInstructions}.`,

    INJECTION_TEMPLATE: `{verb} {doseValue} {doseUnit}{dualDose} {route}{site} {frequency}{technique}.`,

    PRN_INSTRUCTION_TEMPLATE: `{verb} {doseText} {route} {frequencyText} as needed{indication}{maxDose}.`,

    DEFAULT_TEMPLATE: `{verb} {doseText} {route} {frequency}{specialInstructions}.`
  }
} as const;

// Additional specialized templates for complex scenarios
export const SPECIALIZED_TEMPLATES = {
  'en-US': {
    // Testosterone injection with reconstitution
    TESTOSTERONE_INJECTION_TEMPLATE: `{verb} {doseValue} {doseUnit}, as {dualDose}, {route} {frequency}. {technique, select,
      undefined {Rotate injection sites.}
      other {{technique}}
    }`,

    // Topiclick dispenser template
    TOPICLICK_APPLICATION_TEMPLATE: `{verb} {doseValue, plural,
      =1 {# click}
      other {# clicks}
    } {route}{site, select,
      undefined {}
      other { to {site}}
    } {frequency}{specialInstructions, select,
      undefined {}
      other { {specialInstructions}}
    }.`,

    // Compounded medication template
    COMPOUNDED_MEDICATION_TEMPLATE: `{verb} {doseValue} {doseUnit} of {medicationName} {route} {frequency}{specialInstructions, select,
      undefined {}
      other { {specialInstructions}}
    }. {compoundingInstructions, select,
      undefined {}
      other {Compounding notes: {compoundingInstructions}}
    }`,

    // Insulin injection template
    INSULIN_INJECTION_TEMPLATE: `{verb} {doseValue} {doseUnit, select,
      unit {{doseValue, plural, one {unit} other {units}}}
      other {{doseUnit}}
    } {route} {frequency}{mealTiming, select,
      undefined {}
      other { {mealTiming}}
    }{site, select,
      undefined {}
      other {. Rotate injection sites in {site}}
    }.`,

    // Inhaler template
    INHALER_TEMPLATE: `{verb} {doseValue, plural,
      =1 {# puff}
      other {# puffs}
    } {route} {frequency}{spacerInstructions, select,
      undefined {}
      other { {spacerInstructions}}
    }{rinseInstructions, select,
      undefined {}
      other { {rinseInstructions}}
    }.`,

    // Eye/Ear drops template
    DROPS_TEMPLATE: `{verb} {doseValue, plural,
      =1 {# drop}
      other {# drops}
    } {route}{site, select,
      undefined {}
      other { in {site}}
    } {frequency}{waitBetweenDrops, select,
      undefined {}
      other { {waitBetweenDrops}}
    }.`
  }
} as const;

// Factory function to create a configured template engine
export function createTemplateEngine(locale: string = 'en-US'): TemplateEngine {
  const engine = new TemplateEngine({ 
    locale,
    enablePerformanceLogging: process.env.NODE_ENV === 'development'
  });

  // Register all standard templates
  const standardTemplates = TEMPLATES[locale as keyof typeof TEMPLATES];
  if (standardTemplates) {
    Object.entries(standardTemplates).forEach(([key, template]) => {
      engine.registerTemplate(locale, key as TemplateKey, template);
    });
  }

  // Register specialized templates if available
  const specializedTemplates = SPECIALIZED_TEMPLATES[locale as keyof typeof SPECIALIZED_TEMPLATES];
  if (specializedTemplates) {
    Object.entries(specializedTemplates).forEach(([key, template]) => {
      // Note: These are not part of the main TemplateKey union but can be registered
      // for specialized use cases
      engine.registerTemplate(locale, key as string, template);
    });
  }

  return engine;
}

// Template testing utilities
export function validateTemplate(templateKey: TemplateKey, sampleData: Record<string, unknown>): boolean {
  try {
    const engine = createTemplateEngine();
    const result = engine.render(templateKey, sampleData as TemplateData);
    return !result.includes('[Template Error:');
  } catch {
    return false;
  }
}

// Template examples for documentation and testing
export const TEMPLATE_EXAMPLES = {
  ORAL_TABLET_TEMPLATE: [
    {
      data: { verb: 'Take', doseValue: 1, doseUnit: 'tablet', route: 'by mouth', frequency: 'twice daily' },
      expected: 'Take one tablet by mouth twice daily.'
    },
    {
      data: { verb: 'Take', doseValue: 0.5, doseUnit: 'tablet', route: 'by mouth', frequency: 'daily', specialInstructions: 'with food' },
      expected: 'Take half a tablet by mouth daily with food.'
    },
    {
      data: { verb: 'Take', doseValue: 2.5, doseUnit: 'tablet', route: 'by mouth', frequency: 'every 8 hours' },
      expected: 'Take 2.5 tablets by mouth every 8 hours.'
    }
  ],

  LIQUID_DOSE_TEMPLATE: [
    {
      data: { verb: 'Take', doseValue: 5, doseUnit: 'mL', route: 'by mouth', frequency: 'twice daily' },
      expected: 'Take 5 mL by mouth twice daily.'
    },
    {
      data: { verb: 'Take', doseValue: 10, doseUnit: 'mL', dualDose: '500 mg', route: 'by mouth', frequency: 'daily' },
      expected: 'Take 10 mL, as 500 mg, by mouth daily.'
    }
  ],

  INJECTION_TEMPLATE: [
    {
      data: { verb: 'Inject', doseValue: 0.5, doseUnit: 'mL', dualDose: '100 mg', route: 'intramuscularly', frequency: 'weekly' },
      expected: 'Inject 0.5 mL, as 100 mg, intramuscularly weekly.'
    },
    {
      data: { verb: 'Inject', doseValue: 1, doseUnit: 'mL', route: 'subcutaneously', site: 'abdomen', frequency: 'daily', technique: 'Rotate injection sites' },
      expected: 'Inject 1 mL subcutaneously into abdomen daily. Rotate injection sites.'
    }
  ],

  TOPICAL_APPLICATION_TEMPLATE: [
    {
      data: { verb: 'Apply', route: 'topically', frequency: 'twice daily' },
      expected: 'Apply a thin layer topically twice daily.'
    },
    {
      data: { verb: 'Apply', doseValue: 2, doseUnit: 'grams', route: 'topically', site: 'affected area', frequency: 'once daily' },
      expected: 'Apply 2 grams topically to affected area once daily.'
    }
  ],

  PRN_INSTRUCTION_TEMPLATE: [
    {
      data: { verb: 'Take', doseValue: 1, doseUnit: 'tablet', route: 'by mouth', frequency: 'every 4 hours' },
      expected: 'Take 1 tablet by mouth every 4 hours as needed.'
    },
    {
      data: { verb: 'Take', doseRange: '1-2 tablets', route: 'by mouth', frequencyRange: 'every 4-6 hours', indication: 'pain', maxDose: '8 tablets' },
      expected: 'Take 1-2 tablets by mouth every 4-6 hours as needed for pain. Do not exceed 8 tablets in 24 hours.'
    }
  ]
} as const;