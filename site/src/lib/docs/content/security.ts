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
            'In the published v0.1.223 release, omg audit scan requires a running omgd. It scans installed packages against supported OSV ecosystems; Fedora and macOS do not have configured OSV ecosystems in that release. The newer CLI checkout prefers the daemon but scans directly when it is unavailable. It uses Arch Linux security advisories on Arch, native DNF advisories on Fedora, and OSV for Debian and Ubuntu. Missing findings are not proof that a package is free of vulnerabilities. The scan prints findings but does not fail solely because it found them.',
          ],
        },
        {
          kind: 'commands',
          title: 'Scan and report',
          commands: [
            'omg audit',
            'omg audit scan',
            'omg audit log --severity error',
            'omg audit eol',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OSV requests use the shared HTTP client with a five-second connection timeout and a fifteen-second total timeout. The vulnerability scanner does not retry a failed request.',
        },
      ],
    },
    {
      id: 'verification',
      heading: 'Signature and provenance verification',
      blocks: [
        {
          kind: 'diagram',
          diagram: {
            title: 'How an artifact signature is checked',
            caption:
              'The check requires --certificate-identity and verifies the artifact signature against that expected signer. It does not establish a SLSA build level or software safety.',
            nodes: [
              { id: 'artifact', label: 'Downloaded artifact', detail: 'the file you hold' },
              { id: 'identity', label: 'Expected identity', detail: 'email or OIDC URI' },
              { id: 'digest', label: 'SHA-256 digest', detail: 'computed locally' },
              { id: 'rekor', label: 'Rekor inclusion', detail: 'signed entry timestamp' },
              { id: 'fulcio', label: 'Fulcio certificate', detail: 'chain checked' },
              {
                id: 'verified',
                label: 'Signature verified',
                detail: 'identity bound to expectation',
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
              { from: 'identity', to: 'verified', label: 'required' },
              { from: 'verified', to: 'limits', label: 'with limits', dashed: true },
            ],
          },
        },
        {
          kind: 'bullets',
          items: [
            'Runtime installers and self-update compare downloaded bytes with the expected SHA-256 digest when that digest is available.',
            'AUR key preparation invokes gpg to inspect and import keys required by a build.',
            'omg audit slsa verifies a Sigstore hashedrekord signature and its Rekor log inclusion.',
            'The verifier rejects a missing or empty `--certificate-identity`, even though the CLI parser accepts its omission. Set it to a trusted publisher email or OIDC URI obtained independently.',
            'The current hashedrekord check does not establish build provenance or assign a SLSA level. It is a standalone audit and does not gate installation.',
          ],
        },
        {
          kind: 'commands',
          title: 'Check provenance directly',
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
            'On Arch, OMG checks policy.toml against the prepared ALPM transaction, including dependencies. It rejects candidates below minimum_grade, disallowed AUR sources, packages below Verified when require_pgp is true, licenses outside allowed_licenses, and banned_packages. Native APT, DNF, and Homebrew install and upgrade paths refuse explicit policy because a separate precheck cannot guarantee the final native transaction.',
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
            'In v0.1.223, the CLI writes a CycloneDX 1.5 system-package SBOM on Arch. Debian and Ubuntu have an inventory path, but the command always enables vulnerability matching and fails because that release only matches Arch advisories. The newer checkout supports Arch, Debian, Ubuntu, and Fedora when inventory and advisory data are available. An inventory or advisory failure stops generation; Homebrew is unsupported. The separate enterprise audit export accepts soc2, iso27001, fedramp, hipaa, and pci-dss labels but writes a generic inventory bundle, not framework-specific controls.',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'On a supported backend, omg audit export --framework soc2 writes audit entries, a vulnerability scan, an SBOM, and a policy snapshot. In v0.1.223, Debian and Ubuntu fail at the required SBOM step. Other accepted framework names return an unimplemented error. The --period value is metadata, not a time-range filter. Export files are plaintext evidence and do not certify compliance.',
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
