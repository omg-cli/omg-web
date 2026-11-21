import { readFile } from 'node:fs/promises';
import {
  allFiles,
  isSourceFile,
  isSvelteKitRouteEntry,
  isTestFile,
  parseSource,
  resolveImport,
  ts,
  workspaceRoot,
} from './check-source-graph.mjs';

const productionRoots = ['shared', 'site/src', 'workers/api/src'];
const consumerRoots = ['site/e2e', 'site/tests', 'site/tools', 'workers/api/tests'];
const consumerEntryFiles = ['site/alchemy.run.ts', 'tools/check-source-policy.mjs'];
const frameworkEntries = new Set([
  'site/src/hooks.server.ts',
  'site/src/params.ts',
  'workers/api/src/worker.ts',
]);

function hasModifier(statement, kind) {
  return (statement.modifiers ?? []).some(modifier => modifier.kind === kind);
}

function exportedNames(sourceFile) {
  const names = new Set();
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      names.add('default');
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) names.add(element.name.text);
      }
      continue;
    }
    if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;
    if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
      names.add('default');
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
      continue;
    }
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      names.add(statement.name.text);
    }
  }
  return names;
}

const sourceFiles = (await Promise.all(productionRoots.map(allFiles))).flat().filter(isSourceFile);
const productionFiles = sourceFiles.filter(path => !isTestFile(path));
const files = new Set([
  ...sourceFiles,
  ...(await Promise.all(consumerRoots.map(allFiles))).flat().filter(isSourceFile),
  ...consumerEntryFiles,
]);
const syntaxTrees = new Map();
const exportsByFile = new Map();
const usedByFile = new Map([...files].map(path => [path, new Set()]));

for (const path of files) {
  const source = await readFile(new URL(path, workspaceRoot), 'utf8');
  const sourceFile = parseSource(path, source);
  syntaxTrees.set(path, sourceFile);
  exportsByFile.set(path, exportedNames(sourceFile));
}

function markAllUsed(target) {
  const used = usedByFile.get(target);
  if (used === undefined) return;
  for (const name of exportsByFile.get(target) ?? []) used.add(name);
}

for (const [path, sourceFile] of syntaxTrees) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
    const moduleSpecifier = statement.moduleSpecifier;
    if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue;
    const target = resolveImport(path, moduleSpecifier.text, files);
    if (target === null) continue;
    const used = usedByFile.get(target);
    if (used === undefined) continue;

    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (!clause) continue;
      if (clause.name) used.add('default');
      const bindings = clause.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) {
        markAllUsed(target);
      } else if (bindings) {
        for (const element of bindings.elements) {
          used.add((element.propertyName ?? element.name).text);
        }
      }
    } else if (!statement.exportClause) {
      markAllUsed(target);
    } else if (ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        used.add((element.propertyName ?? element.name).text);
      }
    }
  }

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteral(argument)) {
        const target = resolveImport(path, argument.text, files);
        if (target !== null) markAllUsed(target);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

const violations = [];
for (const path of productionFiles) {
  if (frameworkEntries.has(path) || isSvelteKitRouteEntry(path)) continue;
  const used = usedByFile.get(path) ?? new Set();
  const unused = [...(exportsByFile.get(path) ?? [])].filter(name => !used.has(name)).toSorted();
  if (unused.length > 0) violations.push({ path, unused });
}

for (const violation of violations.toSorted((left, right) => left.path.localeCompare(right.path))) {
  process.stderr.write(
    `[unused-exports] ${violation.path}: ${violation.unused.join(', ')} has no repository caller\n`
  );
}

if (violations.length > 0) process.exitCode = 1;
else
  process.stdout.write(`[unused-exports] verified ${productionFiles.length} production modules\n`);
