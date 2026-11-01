import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { mint, streams } from '@rex/kernel';

// DESIGN §3: synthetic initial conditions, NOT historical estimates or runtime mechanisms.
// Distribution rows are {size, share} and {min, max, share}; age bounds are inclusive.
export const FIXTURE = {
  households_per_parish: { value: 60, fixture: true, note: 'DESIGN §3: about 60 households.' },
  mean_household_size: { value: 4.2, fixture: true, note: 'Used only if the researched mean becomes null.' },
  household_size_distribution: { value: [
    { size: 1, share: 0.05 }, { size: 2, share: 0.15 }, { size: 3, share: 0.15 },
    { size: 4, share: 0.2 }, { size: 5, share: 0.2 }, { size: 6, share: 0.15 },
    { size: 7, share: 0.1 },
  ], fixture: true, note: 'Synthetic size weights; when unsourced, reconcile rounding to the researched mean.' },
  age_structure_five_year: { value: [
    { min: 0, max: 4, share: 0.16 }, { min: 5, max: 9, share: 0.16 },
    { min: 10, max: 14, share: 0.20 }, { min: 30, max: 34, share: 0.16 },
    { min: 35, max: 39, share: 0.16 }, { min: 40, max: 44, share: 0.16 },
  ], fixture: true, note: 'Synthetic five-year cohorts; deliberately not a reconstructed medieval pyramid.' },
  sex_ratio: { value: 100, fixture: true, note: 'Equal male/female counts, rounded to whole persons.' },
  ratio_unit: { value: 100, fixture: true, note: 'Reference sex_ratio unit: males per 100 females.' },
  adult_age: { value: 18, fixture: true, note: 'Fixture work eligibility and spouse-slot minimum age.' },
  cross_household_kin: { value: 6, fixture: true, note: 'Disjoint pairs of household heads are siblings; no inferred genealogy beyond those links.' },
  grid_width: { value: 12, fixture: true, note: 'Arbitrary unit grid; unique residence, work and meeting parcels.' },
  formed_at: { value: 0, fixture: true, note: 'Initial household snapshot on the fixture clock.' },
  default_seed: { value: 1, fixture: true, note: 'Default reproducible fixture seed.' },
  mechanics: { value: { zero: 0, one: 1, pair: 2, indent: 2 }, fixture: true,
    note: 'Algorithmic identities, pair cardinality and JSON indentation, not demographic parameters.' },
};

const { zero, one, pair, indent } = FIXTURE.mechanics.value;
export const referencePath = new URL('../data/fixtures/village/reference.json', import.meta.url);
export const villagePath = new URL('../data/fixtures/village/village.json', import.meta.url);
export const readReference = () => JSON.parse(readFileSync(referencePath, 'utf8'));

// Largest-remainder apportionment conserves population/households; ties follow reference row order.
export function apportion(total, rows) {
  if (!Number.isSafeInteger(total) || total < zero || !rows.length ||
      rows.some(row => !Number.isFinite(row.share) || row.share < zero)) throw new Error('Invalid distribution');
  const sum = rows.reduce((n, row) => n + row.share, zero);
  if (sum <= zero) throw new Error('Empty distribution');
  const quotas = rows.map(row => total * row.share / sum);
  const counts = quotas.map(Math.floor);
  const order = quotas.map((q, i) => ({ i, remainder: q - counts[i] }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const spare = total - counts.reduce((a, b) => a + b, zero);
  for (const { i } of order.slice(zero, spare)) counts[i] += one;
  return counts;
}

export function generateVillage(seed = FIXTURE.default_seed.value, reference = readReference()) {
  if (!Number.isSafeInteger(seed) || seed < zero) throw new Error('Seed must be a nonnegative safe integer');
  const sources = [];
  const provenance = {};
  function value(key) {
    const row = reference.find(row => row.key === key);
    if (!row) throw new Error(`Missing reference key: ${key}`);
    sources.push(key);
    provenance[key] = row.value === null ? `FIXTURE.${key}` : `reference.${key}`;
    return row.value === null ? FIXTURE[key].value : row.value;
  }
  const count = value('households_per_parish');
  const mean = value('mean_household_size');
  const sizes = value('household_size_distribution');
  const ages = value('age_structure_five_year');
  const ratio = value('sex_ratio');
  if (!Number.isSafeInteger(count) || count <= zero || !Number.isFinite(mean) || mean < one ||
      !Number.isFinite(ratio) || ratio < zero || sizes.some(r => !Number.isSafeInteger(r.size) || r.size < one) ||
      ages.some(r => !Number.isSafeInteger(r.min) || !Number.isSafeInteger(r.max) || r.min < zero || r.max < r.min)) {
    throw new Error('Invalid reference demographics');
  }
  const rng = streams(seed).get('fixture.village.initialisation', 'village');
  const shuffle = list => list.map(item => ({ item, rank: rng() }))
    .sort((a, b) => a.rank - b.rank).map(row => row.item);
  let householdSizes = apportion(count, sizes).flatMap((n, i) => Array(n).fill(sizes[i].size));
  // DESIGN §3: only the synthetic size distribution is adjusted to match the sourced mean.
  if (provenance.household_size_distribution.startsWith('FIXTURE.')) {
    const target = Math.round(count * mean);
    let population = householdSizes.reduce((a, b) => a + b, zero);
    const min = Math.min(...sizes.map(row => row.size));
    const max = Math.max(...sizes.map(row => row.size));
    if (target < count * min || target > count * max) throw new Error('Mean outside fixture size support');
    while (population !== target) {
      const direction = Math.sign(target - population);
      const i = householdSizes.findIndex(size => direction > zero ? size < max : size > min);
      householdSizes[i] += direction;
      population += direction;
    }
  }
  householdSizes = shuffle(householdSizes);
  const population = householdSizes.reduce((a, b) => a + b, zero);
  const ageList = shuffle(apportion(population, ages).flatMap((n, i) =>
    Array.from({ length: n }, () => ages[i].min + Math.floor(rng() * (ages[i].max - ages[i].min + one)))));
  const males = Math.round(population * ratio / (ratio + FIXTURE.ratio_unit.value));
  const sexes = shuffle([...Array(males).fill('male'), ...Array(population - males).fill('female')]);
  let counters = {};
  function id(kind) { const result = mint(counters, kind); counters = result.counters; return result.id; }
  const persons = ageList.map((age, i) => ({ id: id('person'), sex: sexes[i], age }));
  // Eldest people fill parent/spouse slots first; younger residual members become children.
  // Relations are relative to the head; adults too old to be children are unrelated co-residents.
  const available = [...persons].sort((a, b) => b.age - a.age);
  const parcels = [];
  function parcel(kind) {
    const i = parcels.length;
    const record = { id: id('parcel'), kind, label: 'fixture', x: i % FIXTURE.grid_width.value,
      y: Math.floor(i / FIXTURE.grid_width.value) };
    parcels.push(record);
    return record.id;
  }
  const households = householdSizes.map(size => {
    const members = [{ person: available.shift().id, relation: 'head' }];
    if (size > one && available[zero]?.age >= FIXTURE.adult_age.value) {
      members.push({ person: available.shift().id, relation: 'spouse' });
    }
    return { id: id('household'), residence: parcel('residence'), formed_at: FIXTURE.formed_at.value, members };
  });
  const byId = new Map(persons.map(person => [person.id, person]));
  const kin = [];
  function link(from, to, relation, inverse = relation) {
    kin.push({ from, to, relation }, { from: to, to: from, relation: inverse });
  }
  households.forEach((household, i) => {
    const parents = [...household.members];
    if (parents.length === pair) link(parents[zero].person, parents[one].person, 'spouse');
    const children = [];
    while (household.members.length < householdSizes[i]) {
      const person = available.shift();
      const isChild = parents.every(parent => byId.get(parent.person).age > person.age);
      household.members.push({ person: person.id, relation: isChild ? 'child' : 'other' });
      if (isChild) {
        for (const parent of parents) link(parent.person, person.id, 'parent', 'child');
        for (const sibling of children) link(sibling, person.id, 'sibling');
        children.push(person.id);
      }
    }
  });
  for (let i = zero; i < Math.min(FIXTURE.cross_household_kin.value, Math.floor(count / pair)); i += one) {
    link(households[i * pair].members[zero].person, households[i * pair + one].members[zero].person, 'sibling');
  }
  const posts = persons.filter(person => person.age >= FIXTURE.adult_age.value)
    .map(person => ({ person: person.id, parcel: parcel('work') }));
  parcel('church/meeting');
  return { label: 'fixture', seed, sources, provenance, fixtures: FIXTURE, parcels, persons, households, kin, posts };
}

export const serialize = village => `${JSON.stringify(village, null, indent)}\n`;

export function main(args) {
  let seed = FIXTURE.default_seed.value;
  let check = false;
  while (args.length) {
    const arg = args.shift();
    if (arg === '--check') check = true;
    else if (arg === '--seed' && args.length && /^\d+$/.test(args[zero])) seed = Number(args.shift());
    else throw new Error('Usage: node scripts/build-village.mjs [--seed N] [--check]');
  }
  const json = serialize(generateVillage(seed));
  if (check) {
    let committed;
    // Git may check out text as CRLF on Windows; compare canonical repository newlines.
    try { committed = readFileSync(villagePath, 'utf8').replace(/\r\n/g, '\n'); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (committed !== json) throw new Error('village.json is missing or differs; regenerate with the requested seed');
  } else writeFileSync(villagePath, json);
}

if (process.argv[one] && import.meta.url === pathToFileURL(process.argv[one]).href) {
  try { main(process.argv.slice(pair)); } catch (error) {
    console.error(error.message);
    process.exitCode = one;
  }
}
