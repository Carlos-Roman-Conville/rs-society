export interface FixtureEntry<T = unknown> {
  readonly value: T;
  readonly fixture: boolean;
  readonly note: string;
}

export interface HouseholdSizeBand {
  readonly size: number;
  readonly share: number;
}

export interface AgeBand {
  readonly min: number;
  readonly max: number;
  readonly share: number;
}

export interface FixtureMechanics {
  readonly zero: number;
  readonly one: number;
  readonly pair: number;
  readonly indent: number;
}

export type FixtureMap = {
  readonly households_per_parish: FixtureEntry<number>;
  readonly mean_household_size: FixtureEntry<number>;
  readonly household_size_distribution: FixtureEntry<readonly HouseholdSizeBand[]>;
  readonly age_structure_five_year: FixtureEntry<readonly AgeBand[]>;
  readonly sex_ratio: FixtureEntry<number>;
  readonly ratio_unit: FixtureEntry<number>;
  readonly adult_age: FixtureEntry<number>;
  readonly cross_household_kin: FixtureEntry<number>;
  readonly grid_width: FixtureEntry<number>;
  readonly formed_at: FixtureEntry<number>;
  readonly default_seed: FixtureEntry<number>;
  readonly mechanics: FixtureEntry<FixtureMechanics>;
};

export interface ReferenceRow {
  readonly key: string;
  readonly value: unknown;
}

export interface ApportionRow {
  readonly share: number;
  readonly size?: number;
  readonly min?: number;
  readonly max?: number;
}

export interface FixturePerson {
  readonly id: string;
  sex: "male" | "female" | null;
  readonly age: number;
}

export interface HouseholdMember {
  readonly person: string;
  readonly relation: string;
}

export interface FixtureHousehold {
  readonly id: string;
  readonly residence: string;
  readonly formed_at: number;
  readonly members: readonly HouseholdMember[];
}

export interface KinEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: string;
}

export interface FixtureParcel {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
}

export interface WorkPost {
  readonly person: string;
  readonly parcel: string;
}

export interface GeneratedVillage {
  readonly label: "fixture";
  readonly seed: number;
  readonly sources: readonly string[];
  readonly provenance: Readonly<Record<string, string>>;
  readonly fixtures: FixtureMap;
  readonly parcels: readonly FixtureParcel[];
  readonly persons: readonly FixturePerson[];
  readonly households: readonly FixtureHousehold[];
  readonly kin: readonly KinEdge[];
  readonly posts: readonly WorkPost[];
}

export declare const FIXTURE: FixtureMap;
export declare const referencePath: URL;
export declare const villagePath: URL;
export declare function readReference(): ReferenceRow[];
export declare function apportion(total: number, rows: readonly ApportionRow[]): number[];
export declare function generateVillage(
  seed?: number,
  reference?: readonly ReferenceRow[],
): GeneratedVillage;
export declare function serialize(village: GeneratedVillage): string;
export declare function main(args: string[]): void;
