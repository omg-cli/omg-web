import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'start',
      heading: 'Install Rust toolchains without rustup',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG implements a native Rust toolchain manager in pure Rust without shell wrappers or an external rustup dependency. It downloads official release manifests and component archives directly from static.rust-lang.org, verifies SHA-256 digests against the upstream manifest, and stages components safely before publishing them to your local versions tree.',
            'Supported targets include Linux x86_64 and Apple Silicon macOS. Supported channels include stable, beta, nightly, and exact compiler versions.',
          ],
        },
        {
          kind: 'commands',
          title: 'Install the stable Rust toolchain and inspect it',
          commands: ['omg use rust stable', 'omg list rust', 'omg which rust'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Running omg use rust installs the toolchain if missing, updates the current symlink, and reports the active compiler. When shell integration is enabled, the shell hook prepends that toolchain’s bin directory to PATH upon entering a directory with a matching pin.',
          ],
        },
        {
          kind: 'commands',
          title: 'Verify rustc and cargo at a fresh shell prompt',
          commands: ['rustc --version', 'cargo --version', 'which -a rustc'],
        },
      ],
    },
    {
      id: 'project',
      heading: 'Pin toolchains with rust-toolchain.toml',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'When you enter a project directory, OMG scans for toolchain pins in order: rust-toolchain, rust-toolchain.toml, and then universal .tool-versions. The parser extracts the channel, profile, components, and targets declared in the toolchain table.',
          ],
        },
        {
          kind: 'commands',
          title: 'Example rust-toolchain.toml configuration',
          commands: ['[toolchain]', 'channel = "stable"', 'components = ["clippy", "rustfmt"]'],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OMG manages the Rust compiler, Cargo, and standard components. Dependency locking and crate resolution remain with Cargo.lock. Always keep Cargo.lock committed for binary applications.',
        },
      ],
    },
    {
      id: 'mutations',
      heading: 'Serialized mutations and integrity locking',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Toolchain operations within an OMG data directory are serialized by an internal mutation lock (.mutation.lock). Only one update, installation, or removal can run at a time. The lock releases automatically when the process exits. Do not remove the lock file manually; its presence alone does not mean an operation is active.',
            'Incremental component additions must match the installed toolchain’s recorded compiler release. If upstream manifests change, OMG rejects mismatched component additions until the toolchain is refreshed.',
          ],
        },
        {
          kind: 'commands',
          title: 'Inspect available upstream channels and installed toolchains',
          commands: ['omg list rust --available', 'omg list rust'],
        },
      ],
    },
    {
      id: 'packages',
      heading: 'Precompiled developer tools versus Cargo compilation',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Many popular terminal utilities (ripgrep, bat, fd, eza, starship) are written in Rust. Compiling them from crates.io with cargo install consumes significant CPU time and requires building dependencies from source.',
            'With OMG, you can install precompiled and cryptographically verified binaries directly using your native package manager (omg install ripgrep) or from OMG’s curated tool registry (omg tool install starship), avoiding repetitive compilation overhead.',
          ],
        },
        {
          kind: 'commands',
          title: 'Install precompiled Rust developer utilities',
          commands: ['omg install ripgrep', 'omg tool install starship', 'rg --version'],
        },
      ],
    },
    {
      id: 'troubleshooting',
      heading: 'When commands resolve to an existing rustup installation',
      blocks: [
        {
          kind: 'commands',
          title: 'Check binary resolution across PATH',
          commands: ['omg which rust', 'which -a rustc', 'which -a cargo'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'If you have an existing rustup setup (~/.cargo/bin), inspect your shell profile to ensure OMG hooks take precedence. You can leave rustup files on disk while evaluating OMG.',
            'Consult the runtime handbook for complete toolchain lifecycle options, component targets, and host platform support.',
          ],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG runtime handbook', href: '/docs/runtimes/' },
    { title: 'The Rust Reference: Toolchains', href: 'https://doc.rust-lang.org/' },
    { title: 'The Cargo Book', href: 'https://doc.rust-lang.org/cargo/' },
  ],
  related: ['/docs/runtimes/', '/runtimes/go/', '/compare/omg-vs-mise/'],
};
