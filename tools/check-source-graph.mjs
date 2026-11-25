import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { posix } from 'node:path';

export const workspaceRoot = new URL('../', import.meta.url);
const requireFromSite = createRequire(new URL('site/package.json', workspaceRoot));
export const ts = requireFromSite('typescript');
const sourceExtensions = ['.js', '.mjs', '.svelte', '.ts'];
const sourceExtensionSet = new Set(sourceExtensions);

export async function allFiles(directory) {
  const entries = await readdir(new URL(`${directory}/`, workspaceRoot), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await allFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export function isSourceFile(path) {
  return sourceExtensionSet.has(posix.extname(path)) && !path.endsWith('.d.ts');
}

export function isTestFile(path) {
  return /\.(?:test|spec)\.[^.]+$/u.test(path);
}

export function isSvelteKitRouteEntry(path) {
  return (
    path.startsWith('site/src/routes/') &&
    /^\+(?:(?:page|layout)(?:\.server)?\.(?:js|ts)|(?:page|layout|error)\.svelte|server\.(?:js|ts))$/u.test(
      posix.basename(path)
    )
  );
}

export function parseSource(path, source) {
  const script = path.endsWith('.svelte')
    ? [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gu)]
        .map(match => match[1] ?? '')
        .join('\n')
    : source;
  const kind = path.endsWith('.js') || path.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  return ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true, kind);
}

export function resolveImport(importer, specifier, files) {
  let unresolved;
  const bareSpecifier = specifier.replace(/\?.*$/u, '');
  if (bareSpecifier.startsWith('$lib/')) {
    unresolved = `site/src/lib/${bareSpecifier.slice(5)}`;
  } else if (bareSpecifier.startsWith('.')) {
    unresolved = posix.normalize(posix.join(posix.dirname(importer), bareSpecifier));
  } else {
    return null;
  }

  const base = unresolved.replace(/\.(?:js|mjs)$/u, '');
  const candidates = [
    unresolved,
    base,
    ...sourceExtensions.map(suffix => `${base}${suffix}`),
    ...sourceExtensions.map(suffix => `${base}/index${suffix}`),
  ];
  return candidates.find(candidate => files.has(candidate)) ?? null;
}
