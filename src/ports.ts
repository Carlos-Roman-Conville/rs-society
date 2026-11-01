import type { Participant } from "@rex/kernel";
import type { OrgId, PersonId } from "./types.ts";

export type AccountId = OrgId | PersonId;

/** DESIGN §2.3: adapters own balances, rows and command cursors. Snapshots must
 * be detached; restore must not throw. Transfers are synchronous and either
 * succeed or throw. The store includes each adapter in its Kernel transaction.
 */
export interface LedgerPort extends Participant {
  balance(account: AccountId): number;
  transfer(from: AccountId, to: AccountId, amount: number, reason: string): void;
}

export interface InventoryPort extends Participant {
  quantity(account: AccountId, good: string): number;
  transfer(from: AccountId, to: AccountId, good: string, quantity: number, reason: string): void;
}

/** Notifications carry Society identities, never membership/leadership commands
 * from views. onMerged repoints businesses and resource views to the survivor;
 * it must not invent a second actor. Views own any settlement of resource claims.
 */
export interface ViewsPort extends Participant {
  onCreated(orgId: OrgId): void;
  onMerged(sourceId: OrgId, survivingId: OrgId): void;
  onDissolved(orgId: OrgId): void;
  closeBusiness(businessId: string): void;
}

/** Read-only host facts, queried at attempt/due time, not copied from intentions. */
export interface OrganisationFacts {
  sponsors?(person: PersonId, org: OrgId, t: number): readonly PersonId[];
  kinship?(person: PersonId, member: PersonId, relation: string, t: number): boolean;
  occupation?(person: PersonId, port: string, occupation: string, t: number): boolean;
  serviceHours?(person: PersonId, org: OrgId, activity: string, from: number, to: number): number;
}
