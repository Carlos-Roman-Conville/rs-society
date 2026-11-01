import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIXTURES as F } from "./fixtures.ts";
import { renderReport } from "./report.ts";
import { CONDITIONS } from "./study.ts";
import type { Condition, StudyResult } from "./study.ts";

const controller = new AbortController();
function worker(seed: number, condition: Condition): Promise<StudyResult> {
  return new Promise((resolve, reject) => execFile(process.execPath,
    ["--import", "tsx", fileURLToPath(new URL("./worker.ts", import.meta.url)), String(seed), condition],
    { cwd: fileURLToPath(new URL("../../", import.meta.url)), maxBuffer: 16 * 1024 * 1024, windowsHide: true, signal: controller.signal },
    (error, stdout, stderr) => {
      if (error) reject(new Error(`${seed}/${condition}: ${stderr || error.message}`));
      else { try { resolve(JSON.parse(stdout) as StudyResult); } catch (failure) { reject(failure); } }
    }));
}

// Four isolated simulation processes, not agents. Fixed result slots preserve
// seed/condition order independent of OS completion order. No partial report is
// published if a worker throws, and no parameter changes follow a failed gate.
const jobs = F.calendar.seeds.flatMap((seed) => CONDITIONS.map((condition) => ({ seed, condition })));
const results: StudyResult[] = new Array(jobs.length);
let next = 0, completed = 0;
try { await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < jobs.length) {
    const index = next++, job = jobs[index];
    results[index] = await worker(job.seed, job.condition);
    console.log(`${++completed}/${jobs.length}: seed ${job.seed} ${job.condition}; foundings=${results[index].foundings}`);
  }
})); } catch (error) { controller.abort(); throw error; }
writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify(results, null, 2) + "\n");
const report = renderReport(results);
writeFileSync(new URL("./REPORT.md", import.meta.url), report);
console.log(report.split("\n").filter((line) => /^D\d/.test(line)).join("\n"));
