import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

describe("course syllabus (structure as data)", () => {
  it("builder passes validation", () => {
    const out = execSync("python3 scripts/build_syllabus.py", { cwd: ROOT }).toString();
    expect(out).toMatch(/syllabus ok: 26 units/);
  });

  it("26 units across 6 phases with honest statuses", () => {
    const s = JSON.parse(readFileSync(resolve(ROOT, "public/memory/syllabus.json"), "utf8"));
    expect(s.id).toBe("matrka-course-v1");
    expect(s.units.length).toBe(26);
    const st = Object.groupBy(s.units, (u: any) => u.status);
    expect((st.live ?? []).length).toBeGreaterThan(5);
    expect((st.blocked ?? []).length).toBe(2);
    expect(st.blocked.map((u: any) => u.id).sort()).toEqual(["x01", "x02"]);
  });

  it("no content copied: units reference, and refs resolve", () => {
    const s = JSON.parse(readFileSync(resolve(ROOT, "public/memory/syllabus.json"), "utf8"));
    for (const u of s.units) {
      expect(u.sources.length, u.id).toBeGreaterThan(0);
      for (const src of u.sources) {
        const ref = src.ref.split("#")[0];
        if (["doc", "data", "audio"].includes(src.kind)) {
          expect(existsSync(resolve(ROOT, ref)), `${u.id}:${ref}`).toBe(true);
        }
      }
    }
  });

  it("generated index page lists all units; hub links it", () => {
    const html = readFileSync(resolve(ROOT, "public/memory/syllabus.html"), "utf8");
    expect(html.match(/<tr>/g)!.length).toBeGreaterThanOrEqual(26);
    expect(html).toContain("x02");
    const hub = readFileSync(resolve(ROOT, "app/memory/page.tsx"), "utf8");
    expect(hub).toContain("/memory/syllabus.html");
  });
});
