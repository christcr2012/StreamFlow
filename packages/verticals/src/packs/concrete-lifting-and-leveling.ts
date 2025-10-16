// packages/verticals/src/packs/concrete-lifting-and-leveling.ts
import type { VerticalPack, EstimateResult } from "../index";
let FORMS: any = { estimate: { title: 'Concrete Lifting & Leveling (placeholder)', type: 'object', properties: {} } };
let PRICEBOOK: any = { skus: {} };
let est: any = { estimate: (inputs: Record<string, any>) => ({ total: 0, lines: [], warnings: ['placeholder'] }) };
try {
  // Prefer real assets if available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FORMS = require("../../../verticals/concrete-lifting-and-leveling/FORMS.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PRICEBOOK = require("../../../verticals/concrete-lifting-and-leveling/PRICEBOOK.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  est = require("../../../estimators/concrete-lifting-and-leveling.ts");
} catch {}

export const pack: VerticalPack = {
  key: "concrete-lifting-and-leveling",
  getForm(formKey: string) { return FORMS[formKey] || FORMS["estimate"]; },
  getPriceBook() { return PRICEBOOK; },
  estimate(inputs: Record<string, any>): EstimateResult { return est.estimate(inputs); }
};
