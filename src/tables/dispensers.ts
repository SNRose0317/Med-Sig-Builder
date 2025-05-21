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

export default dispenserTypes;
