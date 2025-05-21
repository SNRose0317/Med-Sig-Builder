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

export default verbMappings;
