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
  }
};

export const routeOptions = Object.keys(routes).map(key => ({
  value: key,
  label: key
}));

export default routes;
