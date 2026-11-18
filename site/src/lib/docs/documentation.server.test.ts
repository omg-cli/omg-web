import { describe, expect, it } from 'vitest';
import { SITE_ORIGIN } from '../../../../shared/public-site';
import { documentationEntries } from './documentation.server';

const RELEASE_SOURCE =
  'https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/';
const runtimeNames = [
  'node',
  'bun',
  'python',
  'go',
  'rust',
  'ruby',
  'java',
  'deno',
  'pi',
  'zig',
  'dotnet',
  'erlang',
  'php',
  'swift',
];
const handbookNames = [
  'installation',
  'cli',
  'configuration',
  'runtimes',
  'workflows',
  'security',
  'troubleshooting',
  'architecture',
];
const operationalNames = [
  'getting-started',
  'packages',
  'shell',
  'daemon',
  'environments',
  'tasks',
  'containers',
  'tools',
  'updates',
];

async function documentAt(href: string) {
  const document = (await documentationEntries()).find(entry => entry.href === href);
  if (document === undefined) throw new Error(`Missing exported documentation: ${href}`);
  return document;
}

async function markdownAt(href: string) {
  return (await documentAt(href)).markdown;
}

describe('assembled documentation catalog and agent exports', () => {
  it('makes all fourteen runtime providers and nine operational guides discoverable', async () => {
    const entries = await documentationEntries();
    expect(entries).toHaveLength(43);
    expect(entries.filter(entry => entry.category === 'Handbook')).toHaveLength(8);
    expect(entries.filter(entry => entry.category === 'Runtime guides')).toHaveLength(14);
    expect(entries.filter(entry => entry.release === 'v0.1.224')).toHaveLength(26);
    for (const runtime of runtimeNames) {
      expect(await documentAt(`/runtimes/${runtime}/`)).toMatchObject({
        category: 'Runtime guides',
        markdownHref: `/markdown/runtimes/${runtime}/`,
      });
    }
    for (const name of [...handbookNames, ...operationalNames]) {
      const document = await documentAt(`/docs/${name}/`);
      expect(document.release).toBe('v0.1.224');
      expect(document.sections.length).toBeGreaterThan(0);
    }
    expect(await documentAt('/guides/task-runner/')).toBeDefined();
    expect(await documentAt('/guides/reproducible-dev-environments/')).toBeDefined();
    expect(await documentAt('/compare/omg-vs-volta/')).toBeDefined();
  });

  it('gives every reader URL a unique canonical Markdown export with real content', async () => {
    const entries = await documentationEntries();
    expect(new Set(entries.map(entry => entry.href)).size).toBe(entries.length);
    expect(new Set(entries.map(entry => entry.markdownHref)).size).toBe(entries.length);
    for (const entry of entries) {
      expect(entry.href).toMatch(/^\/(docs|runtimes|guides|compare)\/[a-z0-9-]+\/$/u);
      expect(entry.markdownHref).toBe(`/markdown${entry.href}`);
      expect(entry.markdown.startsWith(`# ${entry.title}\n`)).toBe(true);
      expect(entry.markdown).toContain(`Canonical: ${SITE_ORIGIN}${entry.href}`);
      expect(entry.markdown).not.toMatch(/^---\r?\n/u);
      expect(entry.sections.length).toBeGreaterThan(0);
      expect(new Set(entry.sections.map(section => section.id)).size).toBe(entry.sections.length);
      for (const section of entry.sections) {
        expect(entry.markdown).toContain(`## ${section.title}`);
      }
    }
  });

  it('pins released references to reviewed source instead of a moving branch', async () => {
    const released = (await documentationEntries()).filter(entry => entry.release !== null);
    expect(released.length).toBeGreaterThan(0);
    for (const entry of released) {
      expect(entry.release).toBe('v0.1.224');
      expect(entry.updated).toBe('2026-11-11');
      expect(entry.markdown).toContain('Release baseline: v0.1.224');
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources) {
        expect(source.href.startsWith(RELEASE_SOURCE)).toBe(true);
        expect(entry.markdown).toContain(`](${source.href})`);
      }
    }
  });

  it('preserves paragraphs, commands, tables, diagrams, steps, bullets, and notes', async () => {
    const cli = await markdownAt('/docs/cli/');
    expect(cli).toContain('This reference targets v0.1.224.');
    expect(cli).toContain('```sh\nomg --help\nomg --all-commands --help');
    expect(cli).toContain('| Option | Effect |');
    expect(cli).toContain('| --all-commands | Include advanced commands in top-level help |');
    expect(cli).toContain('### A safe first pass');
    expect(cli).toContain('| Step | Detail |');
    expect(cli).toContain('| omg search <query> | find the package |');
    expect(cli).toContain('Connections: omg --help to omg search <query>;');
    const installation = await markdownAt('/docs/installation/');
    expect(installation).toContain('1. Enable the shell hook');
    expect(installation).toContain('   ```sh\n   echo');
    expect(installation).toContain('omg --version && omg doctor');
    const security = await markdownAt('/docs/security/');
    expect(security).toContain('- Runtime telemetry is disabled by default');
    expect(security).toContain('> The grade order is Risk, Community, Verified, then Locked.');
    const learning = await markdownAt('/guides/node-npm-pnpm/');
    expect(learning).toContain('| Layer | Responsibility |');
    expect(learning).toContain('pnpm install --frozen-lockfile');
    expect(learning).toContain('## Related pages');
  });

  it('exports native Markdown instructions and implementation evidence', async () => {
    const java = await documentAt('/runtimes/java/');
    expect(java.markdown).toContain('```sh\nomg list java --available');
    expect(java.markdown).toContain('## Set JAVA_HOME when your build needs it');
    expect(java.markdown).toMatch(/\|\s*Invalid Java version\s*\|/u);
    expect(
      java.sources.some(source => source.href === `${RELEASE_SOURCE}src/runtimes/java.rs`)
    ).toBe(true);
    expect(java.markdown).toContain(`](${RELEASE_SOURCE}src/hooks/mod.rs)`);
  });

  it('describes shipped APT 7 archives and daemon-free audit rather than future features', async () => {
    const installation = await markdownAt('/docs/installation/');
    expect(installation).toContain('Debian 13 and Ubuntu 26.04 use the APT 7');
    expect(installation).toContain('`debian-trixie` release pair, published in v0.1.224');
    expect(installation).not.toContain('installation cannot complete there');
    const security = await markdownAt('/docs/security/');
    expect(security).toContain('falls back to direct package-backend scanning');
    expect(security).toContain('omg audit scan --fail-on-findings');
    expect(security).toContain('omg audit sbom --inventory-only');
    expect(security).toContain('on Arch, Debian, Ubuntu, and Fedora');
    expect(security).toContain('--check-policy evaluates the complete installed Arch inventory');
    expect(security).toContain('exits nonzero on violations');
    expect(security).not.toContain('This option is not in v0.1.223');
    const cli = await markdownAt('/docs/cli/');
    expect(cli).toContain('The default file is Dockerfile; an explicit -f path must be relative');
    expect(cli).toContain(
      'Existing Dockerfile.omg is not overwritten; remote installers are checksum-pinned'
    );
    expect(cli).not.toContain('the default path is rejected');
  });

  it('preserves corrected pin precedence and full runtime/tool inventory scope', async () => {
    const runtimes = await markdownAt('/docs/runtimes/');
    expect(runtimes).toContain('.node-version, .nvmrc, .tool-versions, then package.json');
    expect(runtimes).not.toContain('.node-version, .nvmrc, package.json, then .tool-versions');
    const inventory = await markdownAt('/guides/reproducible-dev-environments/');
    expect(inventory).toContain('probes every supported OMG runtime and registry tool');
    expect(inventory).toContain(
      'It does not record system package versions or application dependencies'
    );
    expect(inventory).not.toContain('captures seven runtimes');
    expect(inventory).not.toContain('omg use node lts && npm ci');
    const python = await markdownAt('/runtimes/python/');
    expect(python).toContain('validated Astral uv download catalog');
    expect(python).toContain('Exact historical versions absent from that catalog');
  });

  it('keeps automation and recovery caveats visible in agent-readable exports', async () => {
    const cli = await markdownAt('/docs/cli/');
    expect(cli).toContain('Exit status and automation contracts in v0.1.224');
    expect(cli).toContain('v0.1.224 can report validation issues and still exit successfully');
    expect(cli).toContain('omg env export --source-target <platform>');
    expect(cli).toContain('omg env plan --target <platform>');
    expect(cli).toContain('omg ec / tc / oc / uc');
    const configuration = await markdownAt('/docs/configuration/');
    expect(configuration).toContain('OMG_CACHE_DIR');
    expect(configuration).toContain('OMG_NO_UPDATE_CHECK=1');
    expect(configuration).toContain('ignores caller-supplied OMG storage');
    const recovery = await markdownAt('/docs/troubleshooting/');
    expect(recovery).toContain(
      'Reading malformed history fails and leaves the original file in place'
    );
    expect(recovery).toContain('When a later transaction is recorded');
  });

  it.each([
    { name: 'ruby', facts: ['ubuntu-22.04', 'does not compile Ruby', 'SHA-256 digest'] },
    {
      name: 'java',
      facts: ['feature-level selection', 'not an exact security-update or build pin'],
    },
    { name: 'deno', facts: ['GNU', '.sha256sum', 'JavaScript and TypeScript runtime'] },
    {
      name: 'pi',
      facts: ['coding-agent tool', 'npm must already be available', 'explicitly unsupported'],
    },
    {
      name: 'zig',
      facts: ['ziglang.org/download/index.json', "excludes the index's `master` entry"],
    },
    { name: 'dotnet', facts: ['Microsoft .NET SDK', 'SHA-512', 'end-of-life'] },
    {
      name: 'erlang',
      facts: ['Ubuntu builds', 'Install -minimal', 'source-commit hash is not an archive checksum'],
    },
    {
      name: 'php',
      facts: ['rolling channel', 'refreshes the rolling channel', 'refuses macOS installation'],
    },
    {
      name: 'swift',
      facts: ['Ubuntu 22.04 or 24.04', 'macOS are rejected', 'Sequoia-OpenPGP', '`pgp` feature'],
    },
  ])('retains provider-specific applicability in the $name guide', async ({ name, facts }) => {
    const markdown = await markdownAt(`/runtimes/${name}/`);
    for (const fact of facts) expect(markdown).toContain(fact);
  });
});
