import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Schema } from 'effect';
import { parse } from 'yaml';
import {
  decodeDocumentationMetadata,
  documentationMetadata,
} from '../src/lib/docs/markdown-document.ts';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const defaultManifest = fileURLToPath(
  new URL('../src/lib/docs/source-review.json', import.meta.url)
);
const defaultRegistry = fileURLToPath(new URL('../src/lib/docs/topics.ts', import.meta.url));
const Slug = Schema.Literals([
  'installation',
  'cli',
  'configuration',
  'runtimes',
  'workflows',
  'security',
  'troubleshooting',
  'architecture',
]);
const Commit = Schema.String.check(Schema.isPattern(/^[0-9a-f]{40}$/u));
const Day = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/u),
  Schema.makeFilter(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  })
);
const SourcePath = Schema.String.check(
  Schema.isPattern(/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/u),
  Schema.makeFilter(value => !value.split('/').some(segment => segment === '.' || segment === '..'))
);
const DocumentationPath = Schema.String.check(Schema.isPattern(/^docs\/[a-z0-9-]+\.md$/u));
const Manifest = Schema.Struct({
  schemaVersion: Schema.Literal(2),
  repository: Schema.Literal('omg-cli/omg'),
  scope: Schema.Literal('source-review'),
  execution: Schema.Literal('not-run'),
  release: Schema.Struct({
    version: Schema.String.check(Schema.isPattern(/^v\d+\.\d+\.\d+$/u)),
    commit: Commit,
    publishedAt: Day,
  }),
  reviewedAt: Day,
  topics: Schema.Array(
    Schema.Struct({
      slug: Slug,
      documentationPath: DocumentationPath,
      implementationPaths: Schema.Array(SourcePath).check(Schema.isMinLength(1)),
    })
  ).check(Schema.isMinLength(1)),
  guides: Schema.Array(
    Schema.Struct({
      href: Schema.String.check(Schema.isPattern(/^\/(?:docs|runtimes)\/[a-z0-9-]+\/$/u)),
      metadataPath: Schema.String.check(
        Schema.isPattern(/^src\/routes\/(?:docs|runtimes)\/[a-z0-9-]+\/\+page\.md$/u)
      ),
      documentationPath: DocumentationPath,
      implementationPaths: Schema.Array(SourcePath).check(Schema.isMinLength(1)),
    })
  ),
  sources: Schema.Array(
    Schema.Struct({
      path: SourcePath,
      gitBlob: Commit,
      sha256: Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/u)),
    })
  ).check(Schema.isMinLength(1)),
});
const Registry = Schema.Record(
  Schema.String,
  Schema.Struct({
    slug: Slug,
    source: Schema.Struct({
      repo: Schema.Literal('omg-cli/omg'),
      path: DocumentationPath,
      reviewedCommit: Commit,
      reviewedAt: Day,
    }),
  })
);

/** Read literal registry metadata without evaluating website modules. */
function topicRegistry(path) {
  const tree = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const bindings = new Map();
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer)
        bindings.set(declaration.name.text, declaration.initializer);
    }
  }
  function literal(node, visiting = new Set()) {
    if (!node) throw new Error('registry metadata is missing');
    if (
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node)
    )
      return literal(node.expression, visiting);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isIdentifier(node)) {
      if (visiting.has(node.text)) throw new Error('registry metadata has a circular reference');
      return literal(bindings.get(node.text), new Set([...visiting, node.text]));
    }
    if (ts.isObjectLiteralExpression(node))
      return Object.fromEntries(
        node.properties.map(property => {
          if (ts.isShorthandPropertyAssignment(property))
            return [property.name.text, literal(property.name, visiting)];
          if (
            ts.isPropertyAssignment(property) &&
            (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
          )
            return [property.name.text, literal(property.initializer, visiting)];
          throw new Error('registry metadata must use literal fields');
        })
      );
    throw new Error('registry metadata must use literal objects and strings');
  }
  return Schema.decodeUnknownSync(Registry)(literal(bindings.get('REGISTRY')));
}

function requireUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function authoredGuides(registryPath) {
  const routesDirectory = resolve(dirname(registryPath), '../../routes');
  const guides = new Map();
  for (const category of ['docs', 'runtimes']) {
    const directory = join(routesDirectory, category);
    if (!existsSync(directory)) continue;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const path = join(directory, entry.name, '+page.md');
      if (!existsSync(path)) continue;
      const href = `/${category}/${entry.name}/`;
      const source = readFileSync(path, 'utf8');
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(source);
      if (frontmatter === null) throw new Error(`missing guide frontmatter: ${href}`);
      guides.set(href, {
        metadataPath: `src/routes/${category}/${entry.name}/+page.md`,
        metadata: documentationMetadata(decodeDocumentationMetadata(parse(frontmatter[1]))),
      });
    }
  }
  return guides;
}

function integrity(manifest, registry, guides) {
  if (manifest.reviewedAt < manifest.release.publishedAt)
    throw new Error('source review date predates publication');
  requireUnique(
    manifest.sources.map(source => source.path),
    'source path'
  );
  requireUnique(
    manifest.topics.map(topic => topic.slug),
    'topic slug'
  );
  requireUnique(
    manifest.topics.map(topic => topic.documentationPath),
    'documentation path'
  );
  requireUnique(
    manifest.guides.map(guide => guide.href),
    'guide href'
  );
  requireUnique(
    manifest.guides.map(guide => guide.metadataPath),
    'guide metadata path'
  );
  const sources = new Set(manifest.sources.map(source => source.path));
  const referenced = new Set();
  function referenceSources(label, documentationPath, implementationPaths) {
    requireUnique(implementationPaths, `implementation path for ${label}`);
    if (implementationPaths.includes(documentationPath))
      throw new Error(`documentation cannot also be implementation evidence: ${label}`);
    for (const path of [documentationPath, ...implementationPaths]) {
      if (!sources.has(path)) throw new Error(`missing source evidence: ${label}: ${path}`);
      referenced.add(path);
    }
  }
  if (manifest.topics.length !== Object.keys(registry).length)
    throw new Error('manifest topics must match the registry');
  for (const topic of manifest.topics) {
    const entry = registry[topic.slug];
    if (
      !entry ||
      entry.slug !== topic.slug ||
      entry.source.repo !== manifest.repository ||
      entry.source.path !== topic.documentationPath ||
      entry.source.reviewedCommit !== manifest.release.commit ||
      entry.source.reviewedAt !== manifest.reviewedAt
    )
      throw new Error(`registry provenance does not match source review: ${topic.slug}`);
    referenceSources(topic.slug, topic.documentationPath, topic.implementationPaths);
  }
  if (manifest.guides.length !== guides.size)
    throw new Error('guide inventory does not match authored Markdown pages');
  for (const guide of manifest.guides) {
    const page = guides.get(guide.href);
    if (!page || page.metadataPath !== guide.metadataPath)
      throw new Error(`guide inventory does not match authored Markdown page: ${guide.href}`);
    const metadata = page.metadata;
    if (
      metadata.release !== manifest.release.version ||
      metadata.source.repo !== manifest.repository ||
      metadata.source.path !== guide.documentationPath ||
      metadata.source.reviewedCommit !== manifest.release.commit ||
      metadata.source.reviewedAt !== manifest.reviewedAt
    )
      throw new Error(`guide provenance does not match source review: ${guide.href}`);
    requireUnique(metadata.implementation, `frontmatter implementation path for ${guide.href}`);
    if (
      JSON.stringify(metadata.implementation.toSorted()) !==
      JSON.stringify(guide.implementationPaths.toSorted())
    )
      throw new Error(`guide implementation does not match source review: ${guide.href}`);
    referenceSources(guide.href, guide.documentationPath, guide.implementationPaths);
  }
  for (const path of sources)
    if (!referenced.has(path)) throw new Error(`unreferenced source evidence: ${path}`);
}

function git(clonePath, args) {
  return execFileSync('git', ['-C', clonePath, ...args], {
    maxBuffer: 16 * 1024 * 1024,
    timeout: 10_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function resolveCommit(clonePath, revision, label) {
  try {
    return Schema.decodeUnknownSync(Commit)(
      git(clonePath, ['rev-parse', '--verify', '--end-of-options', `${revision}^{commit}`])
        .toString('utf8')
        .trim()
    );
  } catch {
    throw new Error(`cannot resolve ${label} in the supplied clone: ${revision}`);
  }
}

/** Offline by default; explicit clones are read through Git objects, never the working tree. */
export function checkUpstreamReview(
  manifestPath = defaultManifest,
  registryPath = defaultRegistry,
  clonePath,
  revision
) {
  if (revision !== undefined && clonePath === undefined)
    throw new Error('--revision requires --clone <path>');
  const manifest = Schema.decodeUnknownSync(Manifest, { onExcessProperty: 'error' })(
    JSON.parse(readFileSync(manifestPath, 'utf8'))
  );
  integrity(manifest, topicRegistry(registryPath), authoredGuides(registryPath));
  const result = {
    topicCount: manifest.topics.length,
    guideCount: manifest.guides.length,
    sourceCount: manifest.sources.length,
  };
  if (clonePath === undefined) return result;
  const commit = resolveCommit(clonePath, manifest.release.commit, 'reviewed release commit');
  const tagCommit = resolveCommit(
    clonePath,
    `refs/tags/${manifest.release.version}`,
    'release tag'
  );
  if (tagCommit !== commit)
    throw new Error('release tag does not match the reviewed immutable commit');
  for (const source of manifest.sources) {
    let blob;
    let bytes;
    try {
      const object = `${commit}:${source.path}`;
      blob = git(clonePath, ['rev-parse', '--verify', object]).toString('utf8').trim();
      if (git(clonePath, ['cat-file', '-t', object]).toString('utf8').trim() !== 'blob')
        throw new Error('not a file');
      bytes = git(clonePath, ['show', object]);
    } catch {
      throw new Error(`source file does not exist at reviewed release: ${source.path}`);
    }
    if (
      blob !== source.gitBlob ||
      createHash('sha256').update(bytes).digest('hex') !== source.sha256
    )
      throw new Error(`source bytes do not match recorded evidence: ${source.path}`);
  }
  result.verifiedCommit = commit;
  if (revision === undefined) return result;
  const selected = resolveCommit(clonePath, revision, 'comparison revision');
  const changed = git(clonePath, [
    'diff',
    '--name-only',
    '-z',
    '--no-renames',
    commit,
    selected,
    '--',
    ...manifest.sources.map(source => source.path),
  ])
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
  if (changed.length > 0) {
    const changes = changed.map(path => {
      const topics = manifest.topics
        .filter(
          topic => topic.documentationPath === path || topic.implementationPaths.includes(path)
        )
        .map(topic => topic.slug);
      const guides = manifest.guides
        .filter(
          guide => guide.documentationPath === path || guide.implementationPaths.includes(path)
        )
        .map(guide => guide.href);
      const labels = [];
      if (topics.length > 0) labels.push(`topics: ${topics.join(', ')}`);
      if (guides.length > 0) labels.push(`guides: ${guides.join(', ')}`);
      return `  ${path} (${labels.join('; ')})`;
    });
    throw new Error(`revision ${revision} (${selected}) needs re-review:\n${changes.join('\n')}`);
  }
  result.revisionCommit = selected;
  return result;
}

function main(args) {
  const options = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (
      !['--clone', '--revision'].includes(name) ||
      !value ||
      value.startsWith('--') ||
      options.has(name)
    )
      throw new Error(
        'usage: node tools/check-upstream-review.mjs [--clone <path> [--revision <ref>]]'
      );
    options.set(name, value);
  }
  const result = checkUpstreamReview(
    defaultManifest,
    defaultRegistry,
    options.get('--clone'),
    options.get('--revision')
  );
  process.stdout.write(
    `[upstream-review] ${result.topicCount} topics, ${result.guideCount} guides, ${result.sourceCount} source records: offline integrity validated\n`
  );
  if (result.verifiedCommit)
    process.stdout.write(`[upstream-review] release blobs verified at ${result.verifiedCommit}\n`);
  if (result.revisionCommit)
    process.stdout.write(
      `[upstream-review] recorded source paths unchanged at ${result.revisionCommit}\n`
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `[upstream-review] ${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exitCode = 1;
  }
}
