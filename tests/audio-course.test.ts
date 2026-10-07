import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const AUDIO = resolve(ROOT, "public/memory/audio");

describe("curriculum doc (verbatim)", () => {
  const src = readFileSync(resolve(ROOT, "docs/visions/awesomecurriculum.md"), "utf8");

  it("is saved word-for-word with script, checkpoints, audios", () => {
    expect(src).toMatch(/Checkpoint 1: can I navigate the Mātṛkā body without the recording/);
    expect(src).toMatch(/Now pronounce the phoneme once/);
    expect(src).toMatch(/Audio 19/);
    expect(src).toMatch(/MĀTṚKĀ gives ADDRESS/);
  });

  it("is indexed as core curriculum", () => {
    const idx = readFileSync(resolve(ROOT, "docs/visions/VISION-INDEX.md"), "utf8");
    expect(idx).toContain("awesomecurriculum.md");
  });
});

describe("transcripts beside the audio", () => {
  const files = ["cycle_night1_a_aa.mp3", "cycle_vowels.mp3", "cycle_consonants.mp3",
    "cycle_full_starter.mp3", "track1-installation.mp3", "night1_guided_circuit.mp3"];

  it("every shipped audio file is documented", () => {
    const t = readFileSync(resolve(AUDIO, "TRANSCRIPTS.md"), "utf8");
    for (const f of files) {
      expect(existsSync(resolve(AUDIO, f)), f).toBe(true);
      expect(t, f).toContain(f);
    }
  });

  it("flags the apparatus-loci and missing-vowel gaps honestly", () => {
    const t = readFileSync(resolve(AUDIO, "TRANSCRIPTS.md"), "utf8");
    expect(t).toMatch(/APPARATUS/);
    expect(t).toMatch(/ḷ/);
    expect(t).toMatch(/espeak/);
  });

  it("audio page links the transcripts", () => {
    const page = readFileSync(resolve(ROOT, "app/memory/audio/page.tsx"), "utf8");
    expect(page).toContain("TRANSCRIPTS.md");
  });
});

describe("audio course scope", () => {
  it("maps Audios 00-19 to build method with voice doctrine", () => {
    const s = readFileSync(resolve(ROOT, "docs/visions/audio-course-scope.md"), "utf8");
    expect(s).toMatch(/Audio 00–19/);
    expect(s).toMatch(/18–19/);
    expect(s).toMatch(/Pair template/);
    expect(s).toMatch(/Human recordings only/);
  });
});

describe("padoux theory base", () => {
  const src = readFileSync(resolve(ROOT, "docs/padoux.md"), "utf8");

  it("covers all four deep-read chapters with page refs", () => {
    for (const marker of ["nādānta", "sāmānādhikaraṇya", "AHAM", "ṣaḍadhvan", "anusamdhāna", "divyadeha"]) {
      expect(src, marker).toContain(marker);
    }
    expect(src).toMatch(/\(p\.\d+\)/);
  });

  it("keeps quotes short and carries honesty constraints", () => {
    expect(src).toContain("Honesty constraints");
    expect(src).toMatch(/CHOSEN recension|chosen recension/i);
    expect(src).toMatch(/hygiene-only|modern apparatus/);
  });

  it("wires findings to curriculum elements", () => {
    for (const el of ["Checkpoint 3", "Audio 14", "Wheel II", "Night protocol", "Text Mode"]) {
      expect(src, el).toContain(el);
    }
  });
});
