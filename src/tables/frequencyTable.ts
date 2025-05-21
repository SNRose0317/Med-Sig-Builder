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
  }
};

export const frequencyOptions = Object.keys(frequencies).map(key => ({
  value: key,
  label: key
}));

export default frequencies;
