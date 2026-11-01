import { runStudy, CONDITIONS } from "./study.ts";
import type { Condition } from "./study.ts";

const seed = Number(process.argv[2]), condition = process.argv[3] as Condition;
if (!Number.isSafeInteger(seed) || !CONDITIONS.includes(condition)) throw new Error("Expected seed and study condition");
process.stdout.write(JSON.stringify(runStudy(seed, condition)));
