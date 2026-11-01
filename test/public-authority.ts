import { resolve } from "node:path";
import ts from "typescript";

// The adapter contract is intentionally closed: new capabilities need boundary
// review. Facts are observations used by charter rules, never admission/election
// decisions. Kernel transaction snapshots are opaque adapter-owned state.
const participant = { id: "string", snapshot: "() => unknown", restore: "(snapshot: unknown) => void" };
const contracts: Record<string, Record<string, string>> = {
  ViewsPort: { ...participant, onCreated: "(orgId: OrgId) => void",
    onMerged: "(sourceId: OrgId, survivingId: OrgId) => void", onDissolved: "(orgId: OrgId) => void",
    closeBusiness: "(businessId: string) => void" },
  LedgerPort: { ...participant, balance: "(account: AccountId) => number",
    transfer: "(from: AccountId, to: AccountId, amount: number, reason: string) => void" },
  InventoryPort: { ...participant, quantity: "(account: AccountId, good: string) => number",
    transfer: "(from: AccountId, to: AccountId, good: string, quantity: number, reason: string) => void" },
  OrganisationFacts: { sponsors: "(person: PersonId, org: OrgId, t: number) => readonly PersonId[]",
    kinship: "(person: PersonId, member: PersonId, relation: string, t: number) => boolean",
    occupation: "(person: PersonId, port: string, occupation: string, t: number) => boolean",
    serviceHours: "(person: PersonId, org: OrgId, activity: string, from: number, to: number) => number" },
};

const root = resolve(import.meta.dirname, "..");
const publicEntry = resolve(root, "src/index.ts");
const fixtureEntry = resolve(root, "authority-fixture.ts");
// Synthetic exports preserve the negative control without changing the public barrel.
const fixtureExports = `
      export { collectiveChoice as renamedChoice } from "./src/choice.ts";
      interface HiddenPort { chooseMembers(): string[]; elect(): string }
      export function innocuous(options: { ports: { settlement: HiddenPort } }): void {}
      export class InnocuousStore {
        update(input: { views: { decide(): boolean } }): void {}
        static configure(views: { select(): string }): void {}
      }
    `;
let cachedProgram: ts.Program | undefined;

function getProgram(): ts.Program {
  if (cachedProgram) return cachedProgram;
  const config = ts.readConfigFile(resolve(root, "tsconfig.json"), ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, onError, create) => resolve(file) === fixtureEntry
    ? ts.createSourceFile(fixtureEntry, fixtureExports, language, true)
    : getSourceFile(file, language, onError, create);
  cachedProgram = ts.createProgram([publicEntry, fixtureEntry], options, host);
  return cachedProgram;
}

/** Resolve the barrel (including aliases/export-star), then inspect declared
 * function, constructor and public method parameters, including nested options.
 * The fixture entry lets the test prove that new authority is rejected.
 */
export function publicAuthority(target: "public" | "fixture" = "public"): { checked: string[]; violations: string[] } {
  const entry = target === "public" ? publicEntry : fixtureEntry;
  const program = getProgram();
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry)!;
  const checked: string[] = [], violations: string[] = [];
  const signatures = (type: ts.Type, path: string): void => {
    for (const signature of [...type.getCallSignatures(), ...type.getConstructSignatures()]) {
      checked.push(path);
      for (const parameter of signature.parameters) {
        const node = parameter.valueDeclaration ?? parameter.declarations?.[0] ?? source;
        inspect(checker.getTypeOfSymbolAtLocation(parameter, node), `${path}.${parameter.name}`, new Set());
      }
    }
  };
  const inspect = (raw: ts.Type, path: string, seen: Set<ts.Type>): void => {
    const type = checker.getNonNullableType(raw);
    if (seen.has(type)) return;
    seen.add(type);
    if (type.isUnionOrIntersection()) { for (const part of type.types) inspect(part, path, seen); return; }
    if (!(type.flags & ts.TypeFlags.Object)) return;
    if (checker.isArrayType(type) || checker.isTupleType(type)) {
      const element = checker.getIndexTypeOfType(type, ts.IndexKind.Number);
      if (element) inspect(element, `${path}[]`, seen);
      return;
    }
    const name = type.aliasSymbol?.name ?? type.getSymbol()?.name ?? "";
    const properties = type.getProperties();
    if (contracts[name] || /(?:ports?|views?|adapters?)/i.test(name) || /\.(?:ports?|views?|adapters?)$/i.test(path)) {
      const expected = contracts[name];
      if (!expected) { violations.push(`${path}: unreviewed adapter ${name}`); return; }
      const actual = Object.fromEntries(properties.map((property) => {
        const node = property.valueDeclaration ?? property.declarations?.[0] ?? source;
        const value = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, node));
        return [property.name, checker.typeToString(value, node, ts.TypeFormatFlags.NoTruncation)];
      }));
      if (JSON.stringify(Object.entries(actual).sort()) !== JSON.stringify(Object.entries(expected).sort())) {
        violations.push(`${path}: changed ${name} contract ${JSON.stringify(actual)}`);
      }
      return;
    }
    for (const property of properties) {
      const node = property.valueDeclaration ?? property.declarations?.[0];
      // Skip standard library and Kernel internals; neither is a Society adapter.
      if (!node || !resolve(node.getSourceFile().fileName).startsWith(resolve(root, "src"))
        && resolve(node.getSourceFile().fileName) !== entry) continue;
      inspect(checker.getTypeOfSymbolAtLocation(property, node), `${path}.${property.name}`, new Set(seen));
    }
  };
  for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(source)!)) {
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const node = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!node || !(symbol.flags & ts.SymbolFlags.Value)) continue;
    const type = checker.getTypeOfSymbolAtLocation(symbol, node);
    signatures(type, exported.name);
    for (const member of type.getProperties()) {
      const declaration = member.valueDeclaration ?? member.declarations?.[0];
      if (declaration) signatures(checker.getTypeOfSymbolAtLocation(member, declaration), `${exported.name}.${member.name}`);
    }
    for (const constructor of type.getConstructSignatures()) {
      for (const method of constructor.getReturnType().getProperties()) {
        const declaration = method.valueDeclaration ?? method.declarations?.[0];
        if (!declaration || method.name.startsWith("#") || ts.canHaveModifiers(declaration)
          && ts.getModifiers(declaration)?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword)) continue;
        signatures(checker.getTypeOfSymbolAtLocation(method, declaration), `${exported.name}.${method.name}`);
      }
    }
  }
  return { checked, violations };
}
