import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const specifiers = /(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*)["']([^"']+)["']/g;
const forbidden = /mind\.belief|source_credibility|grievance|unrest|rebellion|legitimacy/;

describe("fence (DESIGN §0, codex/RULES.md 2, 6, 8)", () => {
  const sources = files(root).filter((f) => /\.(ts|tsx|js|mjs)$/.test(f));

  it("has sources to check", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it("src imports only @rex/kernel or relative paths", () => {
    const bad: string[] = [];
    for (const file of sources) {
      for (const m of readFileSync(file, "utf8").matchAll(specifiers)) {
        const spec = m[1]!;
        if (spec !== "@rex/kernel" && !spec.startsWith("@rex/kernel/") && !spec.startsWith(".")) bad.push(`${file}: ${spec}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("src never uses Math.random or Date.now", () => {
    const bad = sources.filter((f) => /Math\.random|Date\.now/.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });

  it("src never names a belief read or a rebellion meter", () => {
    const bad = sources.filter((f) => forbidden.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
});
