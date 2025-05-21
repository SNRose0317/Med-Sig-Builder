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
    conversionRatio: number; // How many dispenser units equal 1 unit (e.g., 4 clicks = 1 mL)
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
      conversionRatio: 4 // 4 clicks = 1 mL
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

export default doseForms;
