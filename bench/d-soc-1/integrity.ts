import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** COG-16 pattern: sorted relative paths plus LF-normalized contents, including
 * untracked sources. A Windows checkout and an LF checkout have the same hash. */
export function treeHash(root: string): string {
  const hash = createHash("sha256");
  function visit(directory: string, prefix: string) {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name), relative = `${prefix}${name}`;
      if (statSync(path).isDirectory()) visit(path, `${relative}/`);
      else hash.update(JSON.stringify([relative, readFileSync(path, "utf8").replace(/\r\n/g, "\n")]));
    }
  }
  visit(root, "");
  return hash.digest("hex");
}

/** Inputs outside src/ also affect this bench. Keep the generated report and
 * saved results out of their own fingerprint. */
export function studyInputHash(root = "."): string {
  const paths = ["package-lock.json", "data/fixtures/village/village.json",
    ...["beliefs", "fixtures", "host", "ledger", "models", "runner", "study"].map((name) => `bench/d-soc-1/${name}.ts`)];
  const hash = createHash("sha256");
  for (const path of paths.sort()) hash.update(JSON.stringify([path, readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n")]));
  return hash.digest("hex");
}

export const GATES = ["D1", "D2", "D3", "D3b", "D7"] as const;
export const VERDICTS = ["D1", "D2", "D3", "D3b", "D4", "D5", "D6", "D7"] as const;

/** Truthful FAIL verdicts are valid evidence; these integrity checks do not
 * turn a failed demonstration into acceptance. See REPORT and HANDOFF. */
export function reportErrors(report: string, currentHash: string): string[] {
  const errors: string[] = [];
  for (const id of VERDICTS) {
    if ([...report.matchAll(new RegExp(`^${id}: (PASS|FAIL) .+$`, "gm"))].length !== 1) errors.push(`Missing/duplicate verdict ${id}`);
  }
  if (report.match(/^Source SHA256: ([a-f0-9]{64})$/m)?.[1] !== currentHash) errors.push("Stale src/ hash");
  const count = Number(report.match(/^Seed count: (\d+)$/m)?.[1]);
  const seeds = report.match(/^Seeds: (.+)$/m)?.[1].split(", ").map(Number) ?? [];
  if (!(count >= 30) || seeds.length !== count || new Set(seeds).size !== count || seeds.some((s) => !Number.isSafeInteger(s))) errors.push("Invalid seed list/count");
  return errors;
}
