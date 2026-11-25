import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSvelteKitRouteEntry, parseSource, resolveImport, ts } from './check-source-graph.mjs';

test('only framework route files are entry points inside the route tree', () => {
  for (const file of [
    '+page.svelte',
    '+page.ts',
    '+page.server.js',
    '+layout.svelte',
    '+layout.js',
    '+layout.server.ts',
    '+error.svelte',
    '+server.ts',
  ]) {
    assert.equal(isSvelteKitRouteEntry(`site/src/routes/[slug]/${file}`), true, file);
  }
  for (const file of ['page-view.ts', '+page.test.ts', '+page.svelte.ts', 'Widget.svelte']) {
    assert.equal(isSvelteKitRouteEntry(`site/src/routes/admin/${file}`), false, file);
  }
  assert.equal(isSvelteKitRouteEntry('site/src/lib/+page.ts'), false);
});

test('shares resolution of Svelte scripts, aliases and Vite query imports', () => {
  const route = 'site/src/routes/+page.svelte';
  const script = parseSource(
    route,
    `<script module>import '$lib/setup.js';</script>
     <script lang="ts">import data from './data.json?raw';</script>
     <p>Not JavaScript</p>`
  );
  const files = new Set(['site/src/lib/setup.ts', 'site/src/routes/data.json']);
  const imports = script.statements.filter(ts.isImportDeclaration);
  assert.deepEqual(
    imports.map(statement => resolveImport(route, statement.moduleSpecifier.text, files)),
    [...files]
  );
});
