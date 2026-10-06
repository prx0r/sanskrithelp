import type { Machine } from "./types";

/** Sanskrit constructicon v0: one worked machine proving the descent chain.
 *  Analysis below is Vidyut 0.4.0 output (cheda + kosha), not hand-written:
 *  Bavati -> lemma BU (√भू, Bhvadi, artha 'sattAyAm'), Kartari, Lat.
 *  Prakriya derivation STEPS are the documented next layer (vidyut-prakriya),
 *  not claimed here.
 */
export const SANSKRIT_MACHINES: Machine[] = [
  {
    id: "lat-3sg-parasmaipada",
    lang: "sanskrit",
    island: "bhu-island",
    meaning: "he/she/it is (present, third person, active voice)",
    form: "[DHĀTU] + Lat + 3sg + Parasmaipada → present stem + ti",
    slots: [{ name: "DHĀTU", constraint: "verb-root", required: true }],
    features: { lakara: "Lat", purusha: "prathama", vacana: "eka", prayoga: "Kartari" },
    examples: ["भवति"],
    connections: [],
    ucxn: null,
    ud: null,
    propbank: null,
  },
];

export const BHAVATI_DESCENT = {
  surface: "भवति",
  slp1: "Bavati",
  lemma: "BU",
  devaLemma: "√भू",
  gana: "Bhvadi",
  artha: "sattAyAm (being)",
  prayoga: "Kartari",
  lakara: "Lat (present)",
  analysis: "present · 3sg · parasmaipada",
  matrika: ["भ", "अ", "व", "अ", "त", "इ"],
  tool: "vidyut 0.4.0 cheda+kosha",
  next: "prakriya derivation steps (vidyut-prakriya) + Mātṛkā locus install per phoneme",
};
