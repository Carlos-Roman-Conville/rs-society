import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { mintId } from '../src/types.ts';
import {
  FIXTURE,
  apportion,
  generateVillage,
  readReference,
  serialize,
  villagePath,
  type AgeBand,
  type FixtureEntry,
  type HouseholdSizeBand,
} from '../scripts/build-village.mjs';

// All numeric expectations/seeds here are fixture (test only); tolerance is the task's 10% gate.
const village = generateVillage();
const reference = readReference();
const fixtureFallback = FIXTURE as Readonly<Record<string, FixtureEntry>>;
const value = (key: string): unknown =>
  reference.find(row => row.key === key)?.value ?? fixtureFallback[key].value;
const people = new Map(village.persons.map(person => [person.id, person]));
const edgeKey = (from: string, to: string, relation: string) => `${from}/${to}/${relation}`;
const edges = new Set(village.kin.map(edge => edgeKey(edge.from, edge.to, edge.relation)));

describe('DESIGN §3 fixture village', () => {
  it('conserves household counts, size distribution and the researched mean', () => {
    expect(village.households).toHaveLength(value('households_per_parish') as number);
    const mean = reference.find(row => row.key === 'mean_household_size')!.value;
    if (mean !== null && typeof mean === 'number') {
      expect(Math.abs(village.persons.length / village.households.length - mean) / mean).toBeLessThanOrEqual(0.1);
    }
    const sizes = value('household_size_distribution') as readonly HouseholdSizeBand[];
    const counts = apportion(village.households.length, sizes);
    // Synthetic rounding reconciliation may move households between bins, by the population correction at most.
    const rawPopulation = counts.reduce((n, count, i) => n + count * sizes[i].size, 0);
    const changes = sizes.reduce(
      (n: number, row: HouseholdSizeBand, i: number) =>
        n + Math.abs(counts[i]! - village.households.filter(h => h.members.length === row.size).length),
      0,
    );
    expect(changes).toBeLessThanOrEqual(2 * Math.abs(rawPopulation - village.persons.length));
    for (const h of village.households) expect(sizes.some((row: HouseholdSizeBand) => row.size === h.members.length)).toBe(true);
  });

  it('apportions age structure and sex ratio from their declared inputs', () => {
    const bands = value('age_structure_five_year') as readonly AgeBand[];
    const counts = apportion(village.persons.length, bands);
    bands.forEach((band: AgeBand, i: number) =>
      expect(village.persons.filter(p => p.age >= band.min && p.age <= band.max)).toHaveLength(counts[i]),
    );
    const sexRatio = value('sex_ratio') as number;
    const males = Math.round(village.persons.length * sexRatio / (sexRatio + FIXTURE.ratio_unit.value));
    expect(village.persons.filter(p => p.sex === 'male')).toHaveLength(males);
    expect(village.persons.filter(p => p.sex === 'female')).toHaveLength(village.persons.length - males);
    // Non-null reference rows override fallback fixtures rather than merely appearing in metadata.
    const modified = reference.map(row => row.key === 'sex_ratio' ? { ...row, value: 200 } : row);
    const changed = generateVillage(1, modified);
    expect(changed.persons.filter(p => p.sex === 'male')).toHaveLength(Math.round(changed.persons.length * 200 / 300));
    expect(changed.provenance.sex_ratio).toBe('reference.sex_ratio');
  });

  it('every head/spouse pair is male+female', () => {
    for (const seed of [1, 2, 3]) {
      for (const ratio of [100, 200]) {
        const inputs = reference.map(row => row.key === 'sex_ratio' ? { ...row, value: ratio } : row);
        const generated = generateVillage(seed, inputs);
        const persons = new Map(generated.persons.map(person => [person.id, person]));
        let couples = 0;
        for (const household of generated.households) {
          const spouse = household.members.find(member => member.relation === 'spouse');
          if (!spouse) continue;
          const head = household.members.find(member => member.relation === 'head')!;
          expect([persons.get(head.person)!.sex, persons.get(spouse.person)!.sex].sort()).toEqual(['female', 'male']);
          couples++;
        }
        expect(couples).toBe(55);
        expect(generated.persons.filter(person => person.sex === 'male')).toHaveLength(
          Math.round(generated.persons.length * ratio / (ratio + FIXTURE.ratio_unit.value)));
      }
    }
    const impossible = reference.map(row => row.key === 'sex_ratio' ? { ...row, value: 0 } : row);
    expect(() => generateVillage(1, impossible)).toThrow('Sex ratio cannot supply');
  });

  it('puts each minted person in exactly one household with one unique residence', () => {
    const members = village.households.flatMap(h => h.members.map(m => m.person));
    expect([...members].sort()).toEqual(village.persons.map(p => p.id).sort());
    expect(new Set(members).size).toBe(members.length);
    village.persons.forEach((p, i) => expect(p.id).toBe(mintId({ person: i }, 'person').id));
    village.households.forEach((h, i) => {
      expect(h.id).toBe(mintId({ household: i }, 'household').id);
      expect(h.formed_at).toBe(FIXTURE.formed_at.value);
      expect(village.parcels.filter(p => p.id === h.residence && p.kind === 'residence')).toHaveLength(1);
    });
    expect(new Set(village.households.map(h => h.residence)).size).toBe(village.households.length);
    expect(village.parcels.filter(p => p.kind === 'residence')).toHaveLength(village.households.length);
  });

  it('records symmetric spouse/sibling and inverse parent/child edges with older parents', () => {
    expect(edges.size).toBe(village.kin.length);
    for (const edge of village.kin) {
      expect(people.has(edge.from) && people.has(edge.to)).toBe(true);
      expect(edge.from).not.toBe(edge.to);
      const inverse = edge.relation === 'parent' ? 'child' : edge.relation === 'child' ? 'parent' : edge.relation;
      expect(edges.has(edgeKey(edge.to, edge.from, inverse))).toBe(true);
      if (edge.relation === 'parent') expect(people.get(edge.from)!.age).toBeGreaterThan(people.get(edge.to)!.age);
    }
    for (const h of village.households) {
      const head = h.members.find(m => m.relation === 'head')!;
      const spouse = h.members.find(m => m.relation === 'spouse');
      if (spouse) expect(edges.has(edgeKey(head.person, spouse.person, 'spouse'))).toBe(true);
      const children = h.members.filter(m => m.relation === 'child');
      for (const child of children) {
        expect(edges.has(edgeKey(head.person, child.person, 'parent'))).toBe(true);
        if (spouse) expect(edges.has(edgeKey(spouse.person, child.person, 'parent'))).toBe(true);
        for (const other of children.filter(m => m !== child)) expect(edges.has(edgeKey(child.person, other.person, 'sibling'))).toBe(true);
      }
    }
    const home = new Map(village.households.flatMap(h => h.members.map(m => [m.person, h.id])));
    expect(village.kin.filter(e => home.get(e.from) !== home.get(e.to))).toHaveLength(2 * FIXTURE.cross_household_kin.value);
  });

  it('assigns every adult a work post and labels every unique grid parcel as fixture', () => {
    expect(village.posts.map(p => p.person)).toEqual(village.persons.filter(p => p.age >= FIXTURE.adult_age.value).map(p => p.id));
    for (const post of village.posts) expect(village.parcels.find(p => p.id === post.parcel)?.kind).toBe('work');
    expect(village.parcels.filter(p => p.kind === 'work')).toHaveLength(village.posts.length);
    expect(village.parcels.filter(p => p.kind === 'church/meeting')).toHaveLength(1);
    expect(new Set(village.parcels.map(p => `${p.x},${p.y}`)).size).toBe(village.parcels.length);
    for (const parcel of village.parcels) {
      expect(parcel.label).toBe('fixture');
      expect(Number.isInteger(parcel.x) && Number.isInteger(parcel.y)).toBe(true);
    }
    expect(village.label).toBe('fixture');
    expect(serialize(village)).not.toMatch(/organi[sz]ation/i);
  });

  it('reproduces committed bytes and changes substantive data for another seed', () => {
    expect(serialize(generateVillage(1))).toBe(serialize(village));
    expect(serialize(village)).toBe(readFileSync(villagePath, 'utf8').replace(/\r\n/g, '\n'));
    const alternate = generateVillage(2);
    expect(alternate.persons).not.toEqual(village.persons);
    expect(serialize(alternate)).toBe(serialize(generateVillage(2)));
  });

  it('keeps every unsourced numeric literal in the labelled FIXTURE block', () => {
    const source = readFileSync(new URL('../scripts/build-village.mjs', import.meta.url), 'utf8');
    const ast = ts.createSourceFile('build-village.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    let fixture: ts.Node | undefined;
    const outside: string[] = [];
    function visit(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'FIXTURE') fixture = node.initializer;
      if (ts.isNumericLiteral(node) && !(fixture && node.pos >= fixture.pos && node.end <= fixture.end)) outside.push(node.getText(ast));
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(outside).toEqual([]);
    for (const entry of Object.values(FIXTURE)) {
      expect(entry.fixture).toBe(true);
      expect(entry.note.length).toBeGreaterThan(0);
    }
    for (const key of village.sources) {
      const row = reference.find(row => row.key === key);
      expect(row).toBeDefined();
      expect(village.provenance[key]).toBe(`${row!.value === null ? 'FIXTURE' : 'reference'}.${key}`);
    }
  }, 60_000);

  it('--check never writes for matching, differing or missing files and rejects invalid seeds', () => {
    const root = mkdtempSync(fileURLToPath(new URL('../.village-test-', import.meta.url)));
    try {
      mkdirSync(join(root, 'scripts'));
      mkdirSync(join(root, 'data/fixtures/village'), { recursive: true });
      const script = join(root, 'scripts/build-village.mjs');
      const output = join(root, 'data/fixtures/village/village.json');
      writeFileSync(script, readFileSync(new URL('../scripts/build-village.mjs', import.meta.url)));
      writeFileSync(join(root, 'data/fixtures/village/reference.json'), JSON.stringify(reference));
      const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
      expect(run('--check').status).toBe(1);
      expect(existsSync(output)).toBe(false);
      expect(run().status).toBe(0);
      const original = readFileSync(output, 'utf8');
      expect(run('--check').status).toBe(0);
      expect(run('--seed', '2', '--check').status).toBe(1);
      expect(readFileSync(output, 'utf8')).toBe(original);
      writeFileSync(output, original.replace(/\n/g, '\r\n'));
      expect(run('--check').status).toBe(0);
      expect(readFileSync(output, 'utf8')).toBe(original.replace(/\n/g, '\r\n'));
      writeFileSync(output, 'stale');
      expect(run('--check').status).toBe(1);
      expect(readFileSync(output, 'utf8')).toBe('stale');
      for (const seed of ['-1', 'NaN', '1.5', '9007199254740992']) expect(run('--seed', seed).status).toBe(1);
      expect(run('--seed', '2').status).toBe(0);
      expect(readFileSync(output, 'utf8')).toBe(serialize(generateVillage(2)));
    } finally {
      const workspace = fileURLToPath(new URL('../', import.meta.url));
      if (dirname(resolve(root)) !== resolve(workspace)) throw new Error('Temporary directory outside workspace');
      rmSync(root, { recursive: true, force: true });
    }
  });
});
