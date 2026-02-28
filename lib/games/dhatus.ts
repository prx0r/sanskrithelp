import dhatusData from "@/data/dhatus.json";

export interface DerivedForm {
  form: string;
  devanagari: string;
  suffix: string;
  meaning: string;
  category: string;
}

export interface Dhatu {
  id: string;
  iast: string;
  devanagari: string;
  meaning: string;
  gana: number;
  derivedForms: DerivedForm[];
  derivesTo: string[];
}

export const dhatus = dhatusData as Dhatu[];

export function getDhatuById(id: string): Dhatu | undefined {
  return dhatus.find((d) => d.id === id);
}

export function getAllFormsForRoot(dhatu: Dhatu): string[] {
  const forms = [dhatu.iast];
  for (const df of dhatu.derivedForms || []) {
    if (df.form && !forms.includes(df.form)) forms.push(df.form);
  }
  for (const name of dhatu.derivesTo || []) {
    const n = name.replace(/^ā/, "a").toLowerCase();
    if (n && !forms.some((f) => f.toLowerCase() === n)) forms.push(name);
  }
  return forms;
}

export function isFormOfRoot(form: string, dhatu: Dhatu): boolean {
  const all = getAllFormsForRoot(dhatu);
  const normalized = form.trim().toLowerCase();
  return all.some((f) => f.toLowerCase() === normalized);
}
