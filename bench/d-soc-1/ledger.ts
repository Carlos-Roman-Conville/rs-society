import type { AccountId, ViewsPort } from "../../src/index.ts";
import { FIXTURES as F } from "./fixtures.ts";

export interface LedgerRow { from: string; to: string; amount: number; reason: string; before: number; after: number }

/** fixture Settlement/Economy port. Aliases make every person in a household
 * spend one shared purse; total() deliberately counts accounts only once. */
export function studyPorts(households: readonly { id: string; members: readonly { person: string }[] }[]) {
  const aliases = new Map(households.flatMap((h) => h.members.map((m) => [m.person, h.id] as const)));
  const account = (id: string) => aliases.get(id) ?? id;
  const balances = new Map<string, number>(households.map((h) => [h.id, F.economy.openingPurse]));
  balances.set("fixture.external", F.economy.externalOpening);
  const ledger = {
    id: "fixture.dsoc1.ledger", balances, rows: [] as LedgerRow[],
    balance(id: AccountId | string) { return this.balances.get(account(id)) ?? 0; },
    transfer(from: AccountId | string, to: AccountId | string, amount: number, reason: string) {
      const a = account(from), b = account(to), before = this.balance(a);
      if (!Number.isFinite(amount) || amount <= 0 || before < amount) throw new Error("Unfunded fixture transfer");
      this.balances.set(a, before - amount);
      this.balances.set(b, this.balance(b) + amount);
      this.rows.push({ from: a, to: b, amount, reason, before, after: this.balance(a) });
    },
    snapshot() { return structuredClone({ balances: this.balances, rows: this.rows }); },
    restore(value: unknown) { Object.assign(this, value); },
    total() { return [...this.balances.values()].reduce((a, b) => a + b, 0); },
  };
  const views: ViewsPort = { id: "fixture.dsoc1.views", onCreated() {}, onDissolved() {}, onMerged() {}, closeBusiness() {},
    snapshot() { return null; }, restore() {} };
  return { ledger, views, aliases };
}
