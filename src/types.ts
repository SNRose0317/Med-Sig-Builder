export interface Medication {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  code: {
    coding: Array<{
      system?: string;
      code?: string;
      display: string;
    }>;
  };
  doseForm: string;
  totalVolume?: {
    value: number;
    unit: string;
  };
  packageInfo?: {
    quantity: number;     // Total number of units (e.g., 30 capsules, 10mL)
    unit: string;         // Unit of measurement (capsules, mL, etc.)
    packSize?: number;    // For medications that come in packs (e.g., pack of 10 capsules)
  };
  extension?: Array<{
    "us-controlled"?: boolean;
    schedule?: string;
    [key: string]: any;
  }>;
  dispenserInfo?: {
    type: string;               // "Topiclick", "Pump", "Oral Syringe", etc.
    unit: string;               // "click", "pump", "mL", etc.
    pluralUnit: string;         // "clicks", "pumps", "mL", etc.
    conversionRatio: number;    // 4 clicks = 1mL, 1 pump = 0.5mL, etc.
    maxAmountPerDose?: number;  // Optional maximum per single dose
  };
  ingredient: Array<{
    name: string;
    strengthRatio: {
      numerator: {
        value: number;
        unit: string;
      };
      denominator: {
        value: number;
        unit: string;
      };
    };
  }>;
  allowedRoutes?: string[];
  defaultRoute?: string;
  commonDosages?: Array<{
    value: number;
    unit: string;
    frequency?: string;
  }>;
  dosageConstraints?: {
    minDose?: {
      value: number;
      unit: string;
    };
    maxDose?: {
      value: number;
      unit: string;
    };
    step?: number;
  };
}
