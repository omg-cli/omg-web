/**
 * Curated architecture handbook. Reviewed against the omg-cli/omg implementation
 * and docs/architecture.md at the commit recorded in the topic registry.
 */
import type { DocsTopic } from '../topic';
import { docsTopicMeta } from '../topics';

export const architectureTopic: DocsTopic = {
  ...docsTopicMeta('architecture'),
  sections: [
    {
      id: 'binaries',
      heading: 'Two release binaries',
      blocks: [
        {
          kind: 'table',
          title: 'The OMG binaries and their roles',
          columns: ['Binary', 'Role'],
          rows: [
            [
              'omg',
              'The CLI handles arguments, package operations, policy, output, interactive views, and prompt counters',
            ],
            [
              'omgd',
              'The daemon maintains an in-memory package index, background status refresh, and caches',
            ],
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Current Linux and macOS release archives include both binaries. Archives from v0.1.222 and earlier omit omgd on non-Arch targets. The CLI talks to the daemon over a Unix socket when omgd is running. Bash and Zsh hooks provide prompt count helpers that read the fixed-size omg.status snapshot beside the socket. Separate omg ec/tc/oc/uc commands were added after v0.1.223.',
          ],
        },
      ],
    },
    {
      id: 'search-flow',
      heading: 'What happens on a search',
      blocks: [
        {
          kind: 'diagram',
          diagram: {
            title: 'Search request path',
            caption:
              'A running daemon answers from memory. Without one, the same query takes the direct backend path.',
            nodes: [
              { id: 'cli', label: 'omg search', detail: 'your command', tone: 'signal' },
              { id: 'daemon', label: 'omgd daemon', detail: 'only when running', tone: 'muted' },
              { id: 'direct', label: 'Direct backend', detail: 'no daemon needed', tone: 'muted' },
              { id: 'cache', label: 'Cache lookup', detail: 'in-memory hit or miss' },
              { id: 'index', label: 'In-memory index' },
              { id: 'official', label: 'Official repositories', detail: 'libalpm, APT, RPM' },
              { id: 'aur', label: 'AUR', detail: 'over HTTPS' },
            ],
            edges: [
              { from: 'cli', to: 'daemon', label: 'daemon running' },
              { from: 'cli', to: 'direct', label: 'no daemon', dashed: true },
              { from: 'daemon', to: 'cache' },
              { from: 'cache', to: 'index', label: 'cache miss' },
              { from: 'index', to: 'official' },
              { from: 'index', to: 'aur', label: 'AUR query' },
              { from: 'direct', to: 'official', dashed: true },
            ],
          },
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'A simple omg search or omg info call takes an optimized path. Search may query a running daemon; Debian package info can read the local APT database directly.',
            },
            {
              text: 'When a daemon answers, it checks its in-memory cache.',
            },
            {
              text: 'On a daemon cache miss, the daemon searches its in-memory package index and remote sources.',
            },
            { text: 'The daemon caches that result and returns it to the CLI.' },
            {
              text: 'If the daemon is unavailable, the CLI uses the same direct backend path. On Arch, official repositories and the AUR can be queried in parallel.',
            },
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'On Arch, OMG binds libalpm through direct FFI instead of invoking pacman for queries. Debian and Ubuntu read the native APT database. Fedora reads RPM data directly, with a subprocess fallback when the database format requires it. AUR requests use HTTPS. Fedora support does not establish RHEL compatibility.',
          ],
        },
      ],
    },
    {
      id: 'runtime-flow',
      heading: 'What happens on a runtime switch',
      blocks: [
        {
          kind: 'diagram',
          diagram: {
            title: 'Runtime switch path',
            caption:
              'Every step stays inside your own data directory, so no administrator password is involved.',
            nodes: [
              {
                id: 'detect',
                label: 'Detect the runtime',
                detail: 'node, python, rust',
                tone: 'signal',
              },
              { id: 'check', label: 'Version installed?', detail: 'checked in the data dir' },
              { id: 'download', label: 'Download release', detail: 'from the provider' },
              { id: 'verify', label: 'Check integrity data', detail: 'provider-specific' },
              { id: 'extract', label: 'Extract version', detail: 'versions/runtime/version' },
              { id: 'current', label: 'Update current link' },
              { id: 'hook', label: 'Project PATH updated', detail: 'by the shell hook' },
            ],
            edges: [
              { from: 'detect', to: 'check' },
              { from: 'check', to: 'download', label: 'missing' },
              { from: 'download', to: 'verify' },
              { from: 'verify', to: 'extract' },
              { from: 'extract', to: 'current' },
              { from: 'current', to: 'hook' },
            ],
          },
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'The CLI detects the runtime type and checks whether the requested version is installed.',
            },
            {
              text: 'If not, it downloads the release from its configured provider and checks the integrity data available for that provider.',
            },
            {
              text: 'The version is extracted under versions/runtime/version in the OMG data directory.',
            },
            {
              text: 'The current symlink records the selected version. When a project pin exists, the shell hook prepends that concrete version directory to PATH.',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Unknown runtime names fail explicitly. OMG does not invoke or download another version manager. A Node project pin can reuse a matching binary from an existing nvm directory. Pi installs through npm with lifecycle scripts disabled.',
        },
      ],
    },
    {
      id: 'caching',
      heading: 'Cache tiers',
      blocks: [
        {
          kind: 'table',
          title: 'From hottest to most durable',
          columns: ['Tier', 'What it holds'],
          rows: [
            [
              'In-memory',
              'Recent searches, package details, and system status shared by all CLI instances',
            ],
            [
              'Status snapshots',
              'Versioned JSON persisted with atomic writes for quick status and history-independent cache state',
            ],
            [
              'Binary status file',
              'Fixed-size omg.status counts read by Bash and Zsh hook helpers; separate CLI count commands with daemon and backend fallbacks were added after v0.1.223',
            ],
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Search indexes are rebuilt from the native package-manager databases rather than treated as durable authority, so deleting the persistent cache is always safe. Transaction history, audit logs, and runtime artifacts remain separate from status snapshots. Snapshots are written with a same-directory temporary file, fsync, and atomic rename.',
          ],
        },
        {
          kind: 'commands',
          title: 'The binary snapshot is a fixed record, not a summary',
          commands: [
            '# omg.status is exactly 32 bytes, laid out as:',
            '#   offset 0   4 bytes   magic 0x4F4D4753 ("OMGS")',
            '#   offset 4   4 bytes   format version',
            '#   offset 8  16 bytes   four u32 counts: total, explicit, orphan, updates',
            '#   offset 24  8 bytes   unix timestamp in seconds',
            '',
            '# Hook helpers accept the file only when its owner, size, format, and age pass',
            '# validation. When it is missing or stale, check current state with omg status.',
            'omg-ec   # explicitly installed packages in Bash or Zsh',
            'omg-uc   # updates available in Bash or Zsh',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'A snapshot can lag a package change between refreshes, so a prompt counter is not a transaction record. Use omg status for a fresh count and the native package tool when you need the authority.',
        },
      ],
    },
    {
      id: 'ipc',
      heading: 'IPC protocol',
      blocks: [
        {
          kind: 'bullets',
          items: [
            'Transport is a Unix domain socket with length-delimited framing.',
            'Messages use a compact binary serialization format chosen for low latency.',
            'Requests cover search, package info, system status, security audits, explicit package listings, and cache or health controls.',
            'A daemon cache hit returns the stored result. A miss searches the in-memory index and, when the command needs them, the native databases and remote sources.',
            'Without a running daemon, the CLI falls back to direct package-manager queries instead of failing.',
          ],
        },
        {
          kind: 'commands',
          title: 'What one call puts on the wire',
          commands: [
            '# frame = [ length ][ version prefix ][ bitcode payload ]',
            '#   both peers reject a version prefix they do not understand',
            '',
            '# 1. the CLI writes one request frame',
            '# 2. the daemon decodes it and routes it to a handler',
            '# 3. the daemon writes one response frame',
            '# 4. a decode error fails the call; it is never reported as an empty success',
            '',
            '# The socket path resolves from OMG_SOCKET_PATH, then $XDG_RUNTIME_DIR/omg.sock.',
            '# Without XDG_RUNTIME_DIR, Unix uses /run/user/$UID/omg.sock when available,',
            '# otherwise a validated private /tmp/omg-$UID directory or home fallback.',
            "# It will not use another user's socket when ownership checks fail.",
            'omg daemon-status',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'The socket stays on the local machine and carries no transport encryption or authentication beyond filesystem ownership. It is not a network interface.',
        },
      ],
    },
    {
      id: 'security-pipeline',
      heading: 'Security paths',
      blocks: [
        {
          kind: 'steps',
          steps: [
            { text: 'Runtime and self-update downloads verify expected SHA-256 digests.' },
            { text: 'AUR key preparation uses gpg to inspect and import required keys.' },
            {
              text: 'omg audit slsa verifies a Sigstore hashedrekord artifact signature and Rekor signed entry timestamp. It does not verify a Merkle inclusion proof or establish build provenance.',
            },
            {
              text: 'In v0.1.223, omg audit needs omgd and queries supported OSV ecosystems. Current main has a direct fallback and native Arch and Fedora advisory paths.',
            },
            {
              text: 'Arch installs and updates check policy.toml against prepared transactions. Native APT, DNF, and Homebrew mutations refuse explicit policy.',
            },
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Runtime operations stay inside the user data directory. System package operations can elevate through sudo when the native backend requires it. Sensitive writes use atomic replacement where implemented, and audited security events are appended to a hash-chained log.',
          ],
        },
      ],
    },
    {
      id: 'workers',
      heading: 'Background workers and shutdown',
      blocks: [
        {
          kind: 'bullets',
          items: [
            'A status refresh worker probes runtime versions, counts vulnerabilities, updates caches, and rewrites the binary status file and JSON snapshot.',
            'An optional ALSA scanner periodically fetches Arch security advisories and matches them against installed packages.',
            'On SIGINT or SIGTERM the daemon stops accepting connections, lets active requests finish, stops workers, and cleans up the socket.',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Because workers only maintain derived state, killing the daemon never corrupts package operations. Restart it with omg daemon and the caches repopulate on demand.',
          ],
        },
      ],
    },
  ],
};
