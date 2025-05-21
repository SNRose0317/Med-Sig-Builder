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
  extension?: Array<{
    "us-controlled"?: boolean;
    schedule?: string;
    [key: string]: any;
  }>;
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
