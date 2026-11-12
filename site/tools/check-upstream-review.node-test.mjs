import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkUpstreamReview } from './check-upstream-review.mjs';

const directories = [];
const slugs = [
  'installation',
  'cli',
  'configuration',
  'runtimes',
  'workflows',
  'security',
  'troubleshooting',
  'architecture',
];
const script = fileURLToPath(new URL('./check-upstream-review.mjs', import.meta.url));

afterEach(() => {
  for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'omg-source-review-'));
  directories.push(root);
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  const put = (path, contents) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  };
  git('init', '--quiet');
  const paths = [
    ...slugs.map(slug => `docs/${slug}.md`),
    'src/cli/commands.rs',
    'src/guides/runtime.rs',
  ];
  for (const path of paths) put(path, `Reviewed ${path}\n`);
  git('add', '.');
  git(
    '-c',
    'user.name=Review Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    'commit',
    '--quiet',
    '-m',
    'released source'
  );
  git('tag', 'v0.1.224');
  const commit = git('rev-parse', 'HEAD');
  const manifest = {
    schemaVersion: 2,
    repository: 'omg-cli/omg',
    scope: 'source-review',
    execution: 'not-run',
    release: { version: 'v0.1.224', commit, publishedAt: '2026-09-23' },
    reviewedAt: '2026-11-11',
    topics: slugs.map(slug => ({
      slug,
      documentationPath: `docs/${slug}.md`,
      implementationPaths: ['src/cli/commands.rs'],
    })),
    guides: [
      {
        href: '/docs/fixture/',
        metadataPath: 'src/routes/docs/fixture/+page.md',
        documentationPath: 'docs/cli.md',
        implementationPaths: ['src/guides/runtime.rs'],
      },
    ],
    sources: paths.map(path => ({
      path,
      gitBlob: git('rev-parse', `${commit}:${path}`),
      sha256: createHash('sha256')
        .update(readFileSync(join(root, path)))
        .digest('hex'),
    })),
  };
  const manifestPath = join(root, 'review.json');
  const registryPath = join(root, 'site/src/lib/docs/topics.ts');
  const guidePath = 'site/src/routes/docs/fixture/+page.md';
  put(
    guidePath,
    `---\ntitle: Fixture guide\ndescription: Source-reviewed fixture\nnavLabel: Fixture\nsection: Guides\norder: 1\nrelease: v0.1.224\nsource:\n  repo: omg-cli/omg\n  path: docs/cli.md\n  reviewedCommit: ${commit}\n  reviewedAt: '2026-11-11'\nimplementation:\n  - src/guides/runtime.rs\n---\n\n# Fixture guide\n`
  );
  put(
    'site/src/lib/docs/topics.ts',
    `const reviewedCommit = '${commit}';\nconst reviewedAt = '2026-11-11';\nconst REGISTRY = {\n${slugs.map(slug => `${slug}: { slug: '${slug}', source: { repo: 'omg-cli/omg', path: 'docs/${slug}.md', reviewedCommit, reviewedAt } },`).join('\n')}\n} as const;\n`
  );
  const save = () => writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  save();
  return { root, git, put, manifest, manifestPath, registryPath, guidePath, save };
}

test('offline integrity checks require neither a clone nor network access', () => {
  const data = fixture();
  const result = checkUpstreamReview(data.manifestPath, data.registryPath);
  assert.equal(result.topicCount, 8);
  assert.equal(result.sourceCount, 10);
  assert.equal(result.guideCount, 1);
  assert.equal(result.verifiedCommit, undefined);
});

test('malformed source records and missing hashes fail the offline check', () => {
  const data = fixture();
  delete data.manifest.sources[0].sha256;
  data.save();
  assert.throws(() => checkUpstreamReview(data.manifestPath, data.registryPath), /sha256/u);
  data.put('review.json', '{invalid JSON');
  assert.throws(() => checkUpstreamReview(data.manifestPath, data.registryPath));
});

test('duplicate source and per-topic implementation paths fail integrity checks', () => {
  const data = fixture();
  data.manifest.sources.push(data.manifest.sources[0]);
  data.save();
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /duplicate source path/u
  );
  data.manifest.sources.pop();
  data.manifest.topics[0].implementationPaths.push('src/cli/commands.rs');
  data.save();
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /duplicate implementation path/u
  );
});

test('registry review date must agree with the manifest', () => {
  const data = fixture();
  data.manifest.reviewedAt = '2026-11-10';
  data.save();
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /registry provenance/u
  );
});

test('invalid release chronology is rejected', () => {
  const data = fixture();
  data.manifest.release.publishedAt = '2026-11-12';
  data.save();
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /predates publication/u
  );
});

test('clone verification reads released blobs and preserves dirty local files', () => {
  const data = fixture();
  data.put('src/cli/commands.rs', 'uncommitted local work\n');
  const before = data.git('status', '--porcelain');
  const result = checkUpstreamReview(data.manifestPath, data.registryPath, data.root);
  assert.equal(result.verifiedCommit, data.manifest.release.commit);
  assert.equal(data.git('status', '--porcelain'), before);
  assert.equal(
    readFileSync(join(data.root, 'src/cli/commands.rs'), 'utf8'),
    'uncommitted local work\n'
  );
});

test('implementation changes require re-review even when all documentation is unchanged', () => {
  const data = fixture();
  data.put('src/cli/commands.rs', 'changed implementation\n');
  data.git('add', 'src/cli/commands.rs');
  data.git(
    '-c',
    'user.name=Review Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    'commit',
    '--quiet',
    '-m',
    'behavior changed'
  );
  assert.equal(
    data.git('diff', '--name-only', data.manifest.release.commit, 'HEAD', '--', 'docs'),
    ''
  );
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath, data.root, 'HEAD'),
    /needs re-review:[\s\S]*src\/cli\/commands\.rs/u
  );
});

test('a clone check rejects mismatched hashes and a missing release tag', () => {
  const data = fixture();
  const original = data.manifest.sources[0].sha256;
  data.manifest.sources[0].sha256 = '0'.repeat(64);
  data.save();
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath, data.root),
    /source bytes do not match/u
  );
  data.manifest.sources[0].sha256 = original;
  data.save();
  data.git('tag', '--delete', 'v0.1.224');
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath, data.root),
    /release tag/u
  );
});

test('the reviewed release itself has no drift and revision requires an explicit clone', () => {
  const data = fixture();
  assert.equal(
    checkUpstreamReview(data.manifestPath, data.registryPath, data.root, 'v0.1.224').revisionCommit,
    data.manifest.release.commit
  );
  const result = spawnSync(process.execPath, [script, '--revision', 'HEAD'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--revision requires --clone/u);
});

test('native guide inventory rejects undeclared and missing Markdown pages', () => {
  const data = fixture();
  const content = readFileSync(join(data.root, data.guidePath), 'utf8');
  data.put('site/src/routes/runtimes/extra/+page.md', content);
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /guide inventory/u
  );
  rmSync(join(data.root, 'site/src/routes/runtimes/extra/+page.md'));
  rmSync(join(data.root, data.guidePath));
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /guide inventory/u
  );
});

test('native guide release and implementation metadata must match recorded evidence', () => {
  const data = fixture();
  const content = readFileSync(join(data.root, data.guidePath), 'utf8');
  data.put(data.guidePath, content.replace('v0.1.224', 'v0.1.225'));
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /guide provenance.*\/docs\/fixture\//u
  );
  data.put(data.guidePath, content.replace('src/guides/runtime.rs', 'src/cli/commands.rs'));
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath),
    /guide implementation.*\/docs\/fixture\//u
  );
});

test('native guide frontmatter rejects malformed YAML and missing implementation metadata', () => {
  const data = fixture();
  const content = readFileSync(join(data.root, data.guidePath), 'utf8');
  data.put(data.guidePath, content.replace('release: v0.1.224', 'release: [unclosed'));
  assert.throws(() => checkUpstreamReview(data.manifestPath, data.registryPath));
  data.put(data.guidePath, content.replace('implementation:', 'unrecorded:'));
  assert.throws(() => checkUpstreamReview(data.manifestPath, data.registryPath), /implementation/u);
});

test('a changed guide-only implementation reports its public href even without Markdown drift', () => {
  const data = fixture();
  data.put('src/guides/runtime.rs', 'changed runtime behavior\n');
  data.git('add', 'src/guides/runtime.rs');
  data.git(
    '-c',
    'user.name=Review Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    'commit',
    '--quiet',
    '-m',
    'guide implementation changed'
  );
  assert.equal(
    data.git('diff', '--name-only', data.manifest.release.commit, 'HEAD', '--', 'docs'),
    ''
  );
  assert.throws(
    () => checkUpstreamReview(data.manifestPath, data.registryPath, data.root, 'HEAD'),
    /src\/guides\/runtime\.rs.*guides: \/docs\/fixture\//u
  );
});
