// Consolidated reference data for medication signature builder

// Frequency Definitions
export interface Frequency {
  id: string;
  name: string;
  count: number;
  frequency?: number;
  period?: number;
  periodUnit: string;
  humanReadable: string;
  abbreviation?: string;
  fhirMapping: {
    frequency?: number;
    period?: number;
    periodUnit: string;
    [key: string]: any;
  };
}

export const frequencies: Record<string, Frequency> = {
  "Once Daily": {
    id: "freq-1",
    name: "Once Daily",
    count: 1,
    frequency: 1,
    period: 1,
    periodUnit: "d",
    humanReadable: "once daily",
    abbreviation: "QD",
    fhirMapping: {
      frequency: 1,
      period: 1,
      periodUnit: "d"
    }
  },
  "Twice Daily": {
    id: "freq-2",
    name: "Twice Daily",
    count: 2,
    frequency: 2,
    period: 1,
    periodUnit: "d",
    humanReadable: "twice daily",
    abbreviation: "BID",
    fhirMapping: {
      frequency: 2,
      period: 1,
      periodUnit: "d"
    }
  },
  "Three Times Daily": {
    id: "freq-3",
    name: "Three Times Daily",
    count: 3,
    frequency: 3,
    period: 1,
    periodUnit: "d",
    humanReadable: "three times daily",
    abbreviation: "TID",
    fhirMapping: {
      frequency: 3,
      period: 1,
      periodUnit: "d"
    }
  },
  "Four Times Daily": {
    id: "freq-4",
    name: "Four Times Daily",
    count: 4,
    frequency: 4,
    period: 1,
    periodUnit: "d",
    humanReadable: "four times daily",
    abbreviation: "QID",
    fhirMapping: {
      frequency: 4,
      period: 1,
      periodUnit: "d"
    }
  },
  "Every Other Day": {
    id: "freq-5",
    name: "Every Other Day",
    count: 1,
    frequency: 1,
    period: 2,
    periodUnit: "d",
    humanReadable: "every other day",
    abbreviation: "QOD",
    fhirMapping: {
      frequency: 1,
      period: 2,
      periodUnit: "d"
    }
  },
  "Once Per Week": {
    id: "freq-6",
    name: "Once Per Week",
    count: 1,
    frequency: 1,
    period: 1,
    periodUnit: "wk",
    humanReadable: "once weekly",
    abbreviation: "Q1W",
    fhirMapping: {
      frequency: 1,
      period: 1,
      periodUnit: "wk"
    }
  },
  "Twice Per Week": {
    id: "freq-7",
    name: "Twice Per Week",
    count: 2,
    frequency: 2,
    period: 1,
    periodUnit: "wk",
    humanReadable: "twice weekly",
    abbreviation: "BIW",
    fhirMapping: {
      frequency: 2,
      period: 1,
      periodUnit: "wk"
    }
  },
  "Three Times Per Week": {
    id: "freq-8",
    name: "Three Times Per Week",
    count: 3,
    frequency: 3,
    period: 1,
    periodUnit: "wk",
    humanReadable: "three times weekly",
    abbreviation: "TIW",
    fhirMapping: {
      frequency: 3,
      period: 1,
      periodUnit: "wk"
    }
  },
  "Four Times Per Week": {
    id: "freq-9",
    name: "Four Times Per Week",
    count: 4,
    frequency: 4,
    period: 1,
    periodUnit: "wk",
    humanReadable: "four times weekly",
    fhirMapping: {
      frequency: 4,
      period: 1,
      periodUnit: "wk"
    }
  },
  "Five Times Per Week": {
    id: "freq-10",
    name: "Five Times Per Week",
    count: 5,
    frequency: 5,
    period: 1,
    periodUnit: "wk",
    humanReadable: "five times weekly",
    fhirMapping: {
      frequency: 5,
      period: 1,
      periodUnit: "wk"
    }
  },
  "Six Times Per Week": {
    id: "freq-11",
    name: "Six Times Per Week",
    count: 6,
    frequency: 6,
    period: 1,
    periodUnit: "wk",
    humanReadable: "six times weekly",
    fhirMapping: {
      frequency: 6,
      period: 1,
      periodUnit: "wk"
    }
  },
  "Once Every Two Weeks": {
    id: "freq-12",
    name: "Once Every Two Weeks",
    count: 1,
    frequency: 1,
    period: 2,
    periodUnit: "wk",
    humanReadable: "once every two weeks",
    abbreviation: "Q2W",
    fhirMapping: {
      frequency: 1,
      period: 2,
      periodUnit: "wk"
    }
  },
  "Once Per Month": {
    id: "freq-13",
    name: "Once Per Month",
    count: 1,
    frequency: 1,
    period: 1,
    periodUnit: "mo",
    humanReadable: "once monthly",
    abbreviation: "Q1M",
    fhirMapping: {
      frequency: 1,
      period: 1,
      periodUnit: "mo"
    }
  },
  "Every 4 Hours As Needed": {
    id: "freq-14",
    name: "Every 4 Hours As Needed",
    count: 6,
    frequency: 1,
    period: 4,
    periodUnit: "h",
    humanReadable: "every 4 hours as needed",
    abbreviation: "Q4H PRN",
    fhirMapping: {
      frequency: 1,
      period: 4,
      periodUnit: "h",
      asNeeded: true
    }
  }
};

// Frequency lookup helper
const frequencyLookup = new Map<string, string>();
Object.keys(frequencies).forEach(key => {
  frequencyLookup.set(key.toLowerCase(), key);
});

// Add common aliases for frequencies
frequencyLookup.set('weekly', 'Once Per Week');
frequencyLookup.set('once weekly', 'Once Per Week');
frequencyLookup.set('every week', 'Once Per Week');
frequencyLookup.set('once per week', 'Once Per Week');
frequencyLookup.set('daily', 'Once Daily');
frequencyLookup.set('once daily', 'Once Daily');
frequencyLookup.set('every day', 'Once Daily');
frequencyLookup.set('bid', 'Twice Daily');
frequencyLookup.set('twice daily', 'Twice Daily');
frequencyLookup.set('tid', 'Three Times Daily');
frequencyLookup.set('three times daily', 'Three Times Daily');
frequencyLookup.set('qid', 'Four Times Daily');
frequencyLookup.set('four times daily', 'Four Times Daily');

// Helper function to get frequency by any case
export const getFrequency = (value: string): Frequency | undefined => {
  if (!value) return undefined;
  const normalizedKey = frequencyLookup.get(value.toLowerCase());
  return normalizedKey ? frequencies[normalizedKey] : undefined;
};

export const frequencyOptions = Object.keys(frequencies).map(key => ({
  value: key,
  label: key
}));

// Route Definitions
export interface Route {
  id: string;
  name: string;
  code: string;
  description: string;
  applicableForms: string[];
  humanReadable: string;
  fhirCode: string;
  requiresSpecialInstructions: boolean;
  specialInstructionsTemplate?: string;
  verbMap?: Record<string, string>;
}

export const routes: Record<string, Route> = {
  "Intramuscularly": {
    id: "route-1",
    name: "Intramuscularly",
    code: "IM",
    description: "Injection into muscle tissue",
    applicableForms: ["Vial", "Pen", "Solution"],
    humanReadable: "intramuscularly",
    fhirCode: "IM",
    requiresSpecialInstructions: true,
    specialInstructionsTemplate: "Inject {dose} {route} into {site} {frequency}."
  },
  "Intranasal": {
    id: "route-2",
    name: "Intranasal",
    code: "NAS",
    description: "Administration into the nose",
    applicableForms: ["Nasal Spray", "Solution"],
    humanReadable: "into each nostril",
    fhirCode: "NAS",
    requiresSpecialInstructions: false
  },
  "On Scalp": {
    id: "route-3",
    name: "On Scalp",
    code: "SCALP",
    description: "Application to the scalp",
    applicableForms: ["Shampoo", "Solution", "Foam"],
    humanReadable: "to scalp",
    fhirCode: "SCALP",
    requiresSpecialInstructions: false
  },
  "Orally": {
    id: "route-4",
    name: "Orally",
    code: "PO",
    description: "Administration by mouth",
    applicableForms: ["Tablet", "Capsule", "Solution", "ODT"],
    humanReadable: "by mouth",
    fhirCode: "PO",
    requiresSpecialInstructions: false,
    verbMap: {
      "Tablet": "Take",
      "Capsule": "Take",
      "Solution": "Take",
      "ODT": "Dissolve"
    }
  },
  "Rectally": {
    id: "route-5",
    name: "Rectally",
    code: "PR",
    description: "Administration into the rectum",
    applicableForms: ["Rectal Suppository", "Cream"],
    humanReadable: "rectally",
    fhirCode: "PR",
    requiresSpecialInstructions: false
  },
  "Subcutaneous": {
    id: "route-6",
    name: "Subcutaneous",
    code: "SC",
    description: "Injection under the skin",
    applicableForms: ["Vial", "Pen", "Solution"],
    humanReadable: "subcutaneously",
    fhirCode: "SUBCUT",
    requiresSpecialInstructions: true,
    specialInstructionsTemplate: "Inject {dose} {route} {frequency}."
  },
  "Sublingually": {
    id: "route-7",
    name: "Sublingually",
    code: "SL",
    description: "Administration under the tongue",
    applicableForms: ["Tablet"],
    humanReadable: "under the tongue",
    fhirCode: "SL",
    requiresSpecialInstructions: false
  },
  "Topically": {
    id: "route-8",
    name: "Topically",
    code: "TOP",
    description: "Application to skin surface",
    applicableForms: ["Cream", "Gel", "Solution", "Foam", "Patch"],
    humanReadable: "topically",
    fhirCode: "TOP",
    requiresSpecialInstructions: true,
    specialInstructionsTemplate: "Apply {dose} {route} {frequency}."
  },
  "Transdermal": {
    id: "route-9",
    name: "Transdermal",
    code: "TD",
    description: "Administration through the skin",
    applicableForms: ["Patch", "Gel"],
    humanReadable: "to skin",
    fhirCode: "TRNSDRM",
    requiresSpecialInstructions: true,
    specialInstructionsTemplate: "Apply {dose} {route} {frequency}."
  },
  "Vaginally": {
    id: "route-10",
    name: "Vaginally",
    code: "PV",
    description: "Administration into the vagina",
    applicableForms: ["Cream", "Gel", "Tablet"],
    humanReadable: "vaginally",
    fhirCode: "PV",
    requiresSpecialInstructions: false
  },
  "Inhaled": {
    id: "route-11",
    name: "Inhaled",
    code: "INHAL",
    description: "Administration by inhalation",
    applicableForms: ["Inhaler", "Nebulizer", "Solution"],
    humanReadable: "by inhalation",
    fhirCode: "INHAL",
    requiresSpecialInstructions: false,
    verbMap: {
      "Inhaler": "Inhale",
      "Nebulizer": "Inhale",
      "Solution": "Inhale"
    }
  }
};

export const routeOptions = Object.keys(routes).map(key => ({
  value: key,
  label: key
}));

// Route lookup helper
const routeLookup = new Map<string, string>();
Object.keys(routes).forEach(key => {
  routeLookup.set(key.toLowerCase(), key);
});

// Helper function to get route by any case
export const getRoute = (value: string): Route | undefined => {
  if (!value) return undefined;
  const normalizedKey = routeLookup.get(value.toLowerCase());
  return normalizedKey ? routes[normalizedKey] : undefined;
};

// Dose Form Definitions
export interface DoseForm {
  id: string;
  name: string;
  isCountable: boolean;
  defaultUnit: string;
  pluralUnit: string;
  applicableRoutes: string[];
  defaultRoute: string;
  verb: string;
  hasSpecialDispenser?: boolean;
  dispenserConversion?: {
    dispenserUnit: string;
    dispenserPluralUnit: string;
    conversionRatio: number;
  };
}

export const doseForms: Record<string, DoseForm> = {
  "Capsule": {
    id: "doseform-1",
    name: "Capsule",
    isCountable: true,
    defaultUnit: "capsule",
    pluralUnit: "capsules",
    applicableRoutes: ["Orally"],
    defaultRoute: "Orally",
    verb: "Take"
  },
  "Cream": {
    id: "doseform-2",
    name: "Cream",
    isCountable: false,
    defaultUnit: "application",
    pluralUnit: "applications",
    applicableRoutes: ["Topically", "Rectally", "Vaginally"],
    defaultRoute: "Topically",
    verb: "Apply",
    hasSpecialDispenser: true,
    dispenserConversion: {
      dispenserUnit: "click",
      dispenserPluralUnit: "clicks",
      conversionRatio: 4
    }
  },
  "Dropper": {
    id: "doseform-3",
    name: "Dropper",
    isCountable: true,
    defaultUnit: "drop",
    pluralUnit: "drops",
    applicableRoutes: ["Orally", "Topically"],
    defaultRoute: "Orally",
    verb: "Place"
  },
  "Foam": {
    id: "doseform-4",
    name: "Foam",
    isCountable: false,
    defaultUnit: "application",
    pluralUnit: "applications",
    applicableRoutes: ["Topically", "On Scalp"],
    defaultRoute: "Topically",
    verb: "Apply"
  },
  "Gel": {
    id: "doseform-5",
    name: "Gel",
    isCountable: false,
    defaultUnit: "application",
    pluralUnit: "applications",
    applicableRoutes: ["Topically", "Vaginally"],
    defaultRoute: "Topically",
    verb: "Apply"
  },
  "Nasal Spray": {
    id: "doseform-6",
    name: "Nasal Spray",
    isCountable: true,
    defaultUnit: "spray",
    pluralUnit: "sprays",
    applicableRoutes: ["Intranasal"],
    defaultRoute: "Intranasal",
    verb: "Spray"
  },
  "ODT": {
    id: "doseform-7",
    name: "ODT",
    isCountable: true,
    defaultUnit: "tablet",
    pluralUnit: "tablets",
    applicableRoutes: ["Orally"],
    defaultRoute: "Orally",
    verb: "Dissolve"
  },
  "Patch": {
    id: "doseform-8",
    name: "Patch",
    isCountable: true,
    defaultUnit: "patch",
    pluralUnit: "patches",
    applicableRoutes: ["Transdermal"],
    defaultRoute: "Transdermal",
    verb: "Apply"
  },
  "Pen": {
    id: "doseform-9",
    name: "Pen",
    isCountable: false,
    defaultUnit: "unit",
    pluralUnit: "units",
    applicableRoutes: ["Subcutaneous", "Intramuscularly"],
    defaultRoute: "Subcutaneous",
    verb: "Inject"
  },
  "Rectal Suppository": {
    id: "doseform-10",
    name: "Rectal Suppository",
    isCountable: true,
    defaultUnit: "suppository",
    pluralUnit: "suppositories",
    applicableRoutes: ["Rectally"],
    defaultRoute: "Rectally",
    verb: "Insert"
  },
  "Shampoo": {
    id: "doseform-11",
    name: "Shampoo",
    isCountable: false,
    defaultUnit: "application",
    pluralUnit: "applications",
    applicableRoutes: ["On Scalp"],
    defaultRoute: "On Scalp",
    verb: "Apply"
  },
  "Solution": {
    id: "doseform-12",
    name: "Solution",
    isCountable: false,
    defaultUnit: "mL",
    pluralUnit: "mL",
    applicableRoutes: ["Orally", "Topically", "Intramuscularly", "Subcutaneous"],
    defaultRoute: "Orally",
    verb: "Take"
  },
  "Spray": {
    id: "doseform-13",
    name: "Spray",
    isCountable: true,
    defaultUnit: "spray",
    pluralUnit: "sprays",
    applicableRoutes: ["Topically", "Intranasal"],
    defaultRoute: "Topically",
    verb: "Apply"
  },
  "Tablet": {
    id: "doseform-14",
    name: "Tablet",
    isCountable: true,
    defaultUnit: "tablet",
    pluralUnit: "tablets",
    applicableRoutes: ["Orally", "Sublingually"],
    defaultRoute: "Orally",
    verb: "Take"
  },
  "Vial": {
    id: "doseform-15",
    name: "Vial",
    isCountable: false,
    defaultUnit: "mL",
    pluralUnit: "mL",
    applicableRoutes: ["Intramuscularly", "Subcutaneous"],
    defaultRoute: "Intramuscularly",
    verb: "Inject"
  }
};

export const doseFormOptions = Object.keys(doseForms).map(key => ({
  value: key,
  label: key
}));

// Verb Mapping
export interface VerbMapping {
  doseForm: string;
  route: string;
  verb: string;
}

export const verbMappings: VerbMapping[] = [
  // Tablets
  { doseForm: "Tablet", route: "Orally", verb: "Take" },
  { doseForm: "Tablet", route: "Sublingually", verb: "Place" },
  
  // Capsules
  { doseForm: "Capsule", route: "Orally", verb: "Take" },
  
  // Liquid forms
  { doseForm: "Solution", route: "Orally", verb: "Take" },
  { doseForm: "Solution", route: "Subcutaneous", verb: "Inject" },
  { doseForm: "Solution", route: "Intramuscularly", verb: "Inject" },
  { doseForm: "Solution", route: "Topically", verb: "Apply" },
  
  // Vials
  { doseForm: "Vial", route: "Subcutaneous", verb: "Inject" },
  { doseForm: "Vial", route: "Intramuscularly", verb: "Inject" },
  
  // Pen
  { doseForm: "Pen", route: "Subcutaneous", verb: "Inject" },
  { doseForm: "Pen", route: "Intramuscularly", verb: "Inject" },
  
  // Topical forms
  { doseForm: "Cream", route: "Topically", verb: "Apply" },
  { doseForm: "Cream", route: "Rectally", verb: "Insert" },
  { doseForm: "Cream", route: "Vaginally", verb: "Insert" },
  { doseForm: "Gel", route: "Topically", verb: "Apply" },
  { doseForm: "Gel", route: "Vaginally", verb: "Insert" },
  { doseForm: "Foam", route: "Topically", verb: "Apply" },
  { doseForm: "Foam", route: "On Scalp", verb: "Apply" },
  
  // Specialized forms
  { doseForm: "Patch", route: "Transdermal", verb: "Apply" },
  { doseForm: "Nasal Spray", route: "Intranasal", verb: "Spray" },
  { doseForm: "Spray", route: "Topically", verb: "Apply" },
  { doseForm: "Spray", route: "Intranasal", verb: "Spray" },
  { doseForm: "ODT", route: "Orally", verb: "Dissolve" },
  { doseForm: "Rectal Suppository", route: "Rectally", verb: "Insert" },
  { doseForm: "Shampoo", route: "On Scalp", verb: "Apply" },
  { doseForm: "Dropper", route: "Orally", verb: "Place" },
  { doseForm: "Dropper", route: "Topically", verb: "Apply" }
];

export function getVerb(doseForm: string, route: string): string {
  const mapping = verbMappings.find(
    m => m.doseForm === doseForm && m.route === route
  );
  
  // Return the mapped verb or a default if no specific mapping exists
  return mapping ? mapping.verb : "Take";
}

// Dispenser Type Definitions
export interface DispenserType {
  id: string;
  name: string;
  defaultUnit: string;
  pluralUnit: string;
  defaultConversionRatio: number;
  applicableDoseForms: string[];
  maxAmountPerDose?: number;
}

export const dispenserTypes: Record<string, DispenserType> = {
  "Topiclick": {
    id: "disp-1",
    name: "Topiclick",
    defaultUnit: "click",
    pluralUnit: "clicks",
    defaultConversionRatio: 4,  // 4 clicks = 1mL
    applicableDoseForms: ["Cream", "Gel"]
  },
  "Pump": {
    id: "disp-2",
    name: "Pump Dispenser",
    defaultUnit: "pump",
    pluralUnit: "pumps",
    defaultConversionRatio: 0.67,  // 1 pump ≈ 1.5mL
    applicableDoseForms: ["Cream", "Gel", "Foam", "Solution"]
  },
  "Dropper": {
    id: "disp-3",
    name: "Dropper",
    defaultUnit: "drop",
    pluralUnit: "drops",
    defaultConversionRatio: 20,  // 20 drops ≈ 1mL
    applicableDoseForms: ["Solution"]
  },
  "Oral Syringe": {
    id: "disp-4",
    name: "Oral Syringe",
    defaultUnit: "mL",
    pluralUnit: "mL",
    defaultConversionRatio: 1,
    applicableDoseForms: ["Solution"]
  },
  "Inhaler": {
    id: "disp-5",
    name: "Inhaler",
    defaultUnit: "puff",
    pluralUnit: "puffs",
    defaultConversionRatio: 1,
    applicableDoseForms: ["Spray"]
  }
};

export const dispenserOptions = Object.keys(dispenserTypes).map(key => ({
  value: key,
  label: key
}));