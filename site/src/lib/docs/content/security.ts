/**
 * Curated security handbook. Reviewed against the omg-cli/omg implementation and
 * docs/security.md at the commit recorded in the topic registry.
 */
import type { DocsTopic } from '../topic';
import { docsTopicMeta } from '../topics';

export const securityTopic: DocsTopic = {
  ...docsTopicMeta('security'),
  sections: [
    {
      id: 'grades',
      heading: 'Security grades',
      blocks: [
        {
          kind: 'table',
          title: 'How OMG classifies packages',
          columns: ['Grade', 'Classification'],
          rows: [
            ['Locked', 'Reserved for provenance evidence. Automatic grading does not assign it'],
            ['Verified', 'Official repository metadata identifies the package'],
            ['Community', 'AUR and other nonofficial package sources'],
            ['Risk', 'The configured vulnerability scanner found a known vulnerability'],
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'The grade order is Risk, Community, Verified, then Locked. Current automatic grading returns Risk, Community, or Verified. A package name alone never grants Locked status.',
        },
      ],
    },
    {
      id: 'scanning',
      heading: 'Vulnerability scanning',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'In v0.1.224, omg audit scan prefers a running omgd and falls back to direct package-backend scanning when the daemon is unavailable. It uses Arch Linux advisories on Arch, native DNF advisories on Fedora, and OSV on Debian and Ubuntu. Effective Homebrew finding coverage has not been verified. A scan with no findings is not proof that every package is safe. Findings are reported without failing by default; use omg audit scan --fail-on-findings for a nonzero exit when vulnerabilities are found.',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Scan coverage depends on the advisory source and its freshness. This website has not verified continuously up-to-date production CVE ingestion. GitHub security commits are a record of code changes, not a live vulnerability-database status check.',
        },
        {
          kind: 'commands',
          title: 'Scan and report',
          commands: [
            'omg audit',
            'omg audit scan --fail-on-findings',
            'omg audit log --severity error',
            'omg audit eol',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OSV requests use the shared HTTP client with a five-second connection timeout and a fifteen-second total timeout. The vulnerability scanner does not retry a failed request.',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'For CI, distinguish a completed scan with findings from a scanner failure. --fail-on-findings makes findings fail the command; inventory or advisory errors also fail rather than becoming an empty successful scan. Review the reported coverage and advisory source.',
        },
      ],
    },
    {
      id: 'verification',
      heading: 'Artifact signature verification',
      blocks: [
        {
          kind: 'diagram',
          diagram: {
            title: 'How an artifact signature is checked',
            caption:
              'A successful check ties the file you hold to the signing identity you specified. It is not a build-level or safety verdict.',
            nodes: [
              { id: 'artifact', label: 'Downloaded artifact', detail: 'the file you hold' },
              { id: 'identity', label: 'Expected identity', detail: 'email or OIDC URI' },
              { id: 'digest', label: 'SHA-256 digest', detail: 'computed locally' },
              { id: 'rekor', label: 'Rekor SET', detail: 'signed entry timestamp' },
              { id: 'fulcio', label: 'Fulcio certificate', detail: 'chain checked' },
              {
                id: 'verified',
                label: 'Signature verified',
                detail: 'identity is bound',
                tone: 'signal',
              },
              {
                id: 'limits',
                label: 'Not a SLSA level',
                detail: 'nor proof of safety',
                tone: 'muted',
              },
            ],
            edges: [
              { from: 'artifact', to: 'digest' },
              { from: 'digest', to: 'rekor' },
              { from: 'rekor', to: 'fulcio' },
              { from: 'fulcio', to: 'verified' },
              { from: 'identity', to: 'verified', label: 'must match' },
              { from: 'verified', to: 'limits', label: 'with limits', dashed: true },
            ],
          },
        },
        {
          kind: 'bullets',
          items: [
            'Runtime installers and self-update compare downloaded bytes with the expected SHA-256 digest when that digest is available.',
            'AUR key preparation invokes gpg to inspect and import keys required by a build.',
            'omg audit slsa verifies a Sigstore hashedrekord artifact signature and Rekor signed entry timestamp (SET) against the pinned log key. It does not independently verify a Merkle inclusion proof or checkpoint.',
            'Supply an independently trusted publisher email or OIDC URI with `--certificate-identity`. The v0.1.224 parser requires this option; choosing an identity from the untrusted artifact itself does not establish trust.',
            'The current hashedrekord check does not establish build provenance or assign a SLSA level. It is a standalone audit and does not gate installation.',
          ],
        },
        {
          kind: 'commands',
          title: 'Verify a downloaded artifact',
          commands: [
            'omg audit slsa artifacts/package.pkg.tar.zst --certificate-identity "$EXPECTED_SIGNER_IDENTITY"',
          ],
        },
      ],
    },
    {
      id: 'policy',
      heading: 'Policy enforcement',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'On Arch, OMG checks policy.toml against the prepared ALPM transaction, including dependencies. It rejects candidates below minimum_grade, disallowed AUR sources, packages below Verified when require_pgp is true, licenses outside allowed_licenses, and banned_packages. Native APT, DNF, and Homebrew installs and upgrades refuse an explicit policy because a separate precheck cannot guarantee their final transactions.',
          ],
        },
        {
          kind: 'commands',
          title: 'Inspect the active policy',
          commands: ['omg audit policy'],
        },
      ],
    },
    {
      id: 'sbom',
      heading: 'SBOM generation and compliance',
      blocks: [
        {
          kind: 'commands',
          title: 'Generate and export evidence',
          commands: [
            'omg audit sbom -o sbom.json',
            'omg audit log --export audit.csv',
            'omg audit export --framework soc2 --output ./audit-evidence',
            'omg enterprise audit-export --framework soc2 --period 2026-Q1',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'In v0.1.224, the CLI writes a CycloneDX 1.5 system-package SBOM on Arch, Debian, Ubuntu, and Fedora when inventory and advisory data are available; Homebrew is unsupported. The SBOM contains installed package identities and matched findings, not application dependency graphs. An inventory or advisory failure stops default generation. If the installed inventory changes during collection, generation also fails rather than combining inconsistent snapshots.',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'omg audit export --framework soc2 writes an audit log, vulnerability scan, SBOM, and policy snapshot on a supported backend. Failure to collect a required component stops the export. Other accepted framework names return an unimplemented error. --period is metadata, not a time-range filter. The separate enterprise audit-export writes a generic inventory bundle for its accepted framework labels. These plaintext files are evidence to review, not compliance certification.',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Use omg audit sbom --inventory-only -o inventory.json when you need package inventory without advisory matching. v0.1.224 labels that omission in the SBOM; the result cannot be read as a clean vulnerability scan. Inventory failures still stop generation. The default command requires advisory matching.',
        },
      ],
    },
    {
      id: 'licenses',
      heading: 'License review and vulnerability fixes',
      blocks: [
        {
          kind: 'commands',
          title: 'Review installed package licenses on Arch',
          commands: [
            'omg audit licenses',
            'omg audit licenses --check-policy',
            'omg audit fix --dry-run',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'The installed-package license report and automatic vulnerability fix require the Arch backend. On Debian, Ubuntu, Fedora, and macOS they return an unsupported-backend error. In v0.1.224, --check-policy evaluates the complete installed Arch inventory and exits nonzero on violations, even when --filter narrows the displayed report. A successful check only establishes that the configured local license restrictions were satisfied. omg audit fix upgrades affected Arch packages when updates are available; review the dry run first.',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'For machine-readable license output, use omg audit licenses --format json or --format csv. Add --check-policy when the command must also enforce the configured allowed-license list. Review the full policy before relying on the exit status.',
        },
      ],
    },
    {
      id: 'secrets',
      heading: 'Secret scanning',
      blocks: [
        {
          kind: 'table',
          title: 'Detected credential families',
          columns: ['Credential type', 'Severity'],
          rows: [
            ['AWS access and secret keys', 'Critical'],
            ['GitHub and GitLab tokens', 'Critical'],
            ['Private keys', 'Critical'],
            ['Stripe live keys', 'Critical'],
            ['Slack tokens and Google API keys', 'High'],
            ['NPM tokens', 'High'],
            ['JWT and generic API keys or passwords', 'Medium'],
          ],
        },
        {
          kind: 'commands',
          title: 'Scan a project',
          commands: ['omg audit secrets', 'omg audit secrets -p /path/to/project'],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'The scanner skips placeholder-shaped values such as your_api_key_here, example_token, and template variables. Markdown and text files are still scanned, so realistic example credentials can trigger findings.',
        },
      ],
    },
    {
      id: 'audit-log',
      heading: 'Tamper-evident audit log',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Package changes, security scan summaries, policy rejections, and daemon lifecycle events are appended to audit/audit.jsonl under the OMG data directory. Editing a retained entry breaks its hash chain. The local chain cannot prove that an attacker with filesystem access did not delete or truncate entries.',
          ],
        },
        {
          kind: 'commands',
          title: 'Review and prove integrity',
          commands: ['omg audit log --limit 50', 'omg audit verify'],
        },
        {
          kind: 'commands',
          title: 'How each entry is linked',
          commands: [
            '# entry N carries both the previous entry hash and its own:',
            '#   "prev_hash": hash(entry N-1)',
            '#   "hash":      sha256(canonical fields + prev_hash)',
            '',
            '# Writers read the last hash under a lock, so two concurrent processes',
            '# cannot fork the chain, and a writer that starts after another one has',
            '# appended keeps the linkage correct instead of reusing a stale value.',
            '',
            '# verify recomputes the linkage and reports the first entry that does not match',
            'omg audit verify',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Chain verification proves internal consistency, not authorship or completeness. Anyone who can rewrite the file can recompute the chain, so treat it as local tamper evidence rather than an independently anchored record.',
        },
      ],
    },
    {
      id: 'telemetry',
      heading: 'Telemetry is opt-in',
      blocks: [
        {
          kind: 'bullets',
          items: [
            'Runtime telemetry is disabled by default and activates only after you explicitly enable it.',
            'Installer tracking asks for consent, defaults to no, and can be skipped permanently with OMG_NO_TELEMETRY=1.',
            'At runtime, OMG_TELEMETRY=0 or OMG_DISABLE_TELEMETRY=1 also disables collection.',
            'Collected telemetry never includes package names, search queries, file paths, arguments, or error output.',
            'Events are queued locally in your data directory and sent only over HTTPS, and network failures never fail the command you ran.',
          ],
        },
        {
          kind: 'commands',
          title: 'Manage telemetry and export local data',
          commands: ['omg privacy status', 'omg privacy opt-out', 'omg privacy export'],
        },
      ],
    },
  ],
};
