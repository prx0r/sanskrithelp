import { describe, expect, it } from "vitest";

import {
  morphTransferSkillId,
  parseSkillId,
  phonemeProductionSkillId,
  sandhiBoundarySkillId,
  verseReverseSkillId,
} from "./skills";

describe("canonical skill IDs", () => {
  it("creates stable morph, phoneme, verse, and sandhi IDs", () => {
    expect(morphTransferSkillId("√gam", "ṇic")).toBe("root:√gam.operator:ṇic.operatorTransfer");
    expect(phonemeProductionSkillId("dantya", 1, 1, 0)).toBe(
      "phoneme:dantya.1.1.0.production",
    );
    expect(verseReverseSkillId("asato-ma-sad-gamaya")).toBe(
      "verse:asato-ma-sad-gamaya.reverseParse",
    );
    expect(sandhiBoundarySkillId("sat", "gamaya")).toBe(
      "sandhi:sat__plus__gamaya.reverseParse",
    );
  });

  it("preserves Sanskrit identity while rejecting malformed IDs", () => {
    expect(parseSkillId("root:√gam.operator:ṇic.operatorTransfer")).toMatchObject({
      kind: "root",
      dimension: "operatorTransfer",
    });
    expect(parseSkillId("root:√gam.operator:ṇic")).toBeNull();
    expect(parseSkillId("root:√gam..transfer")).toBeNull();
    expect(parseSkillId("root:√gam.operator:ṇic.transfer.extra")).toBeNull();
    expect(parseSkillId("unknown:gam.transfer")).toBeNull();
  });

  it("normalizes sandhi inputs without changing their teaching identity", () => {
    expect(sandhiBoundarySkillId("  Sat ", "Gamaya!")).toBe(
      "sandhi:sat__plus__gamaya.reverseParse",
    );
  });
});
