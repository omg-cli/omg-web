type LearningCategory = 'runtimes' | 'guides' | 'compare';

export interface LearningPageMeta {
  readonly slug: string;
  readonly category: LearningCategory;
  readonly title: string;
  readonly description: string;
  /** Date the authored page content changed, not the deployment date. */
  readonly modified: string;
}

export const LEARNING_CATEGORIES = {
  runtimes: {
    title: 'Language runtimes',
    description:
      'Install and switch Node.js, Bun, Python, Go, and Rust versions with OMG. Understand project pins, shell setup, and supported platforms.',
  },
  guides: {
    title: 'Developer workflow guides',
    description:
      'Run project tasks, move existing yay, nvm, or asdf projects to OMG, and capture supported development environments with practical guides.',
  },
  compare: {
    title: 'Compare developer tools',
    description:
      'Compare OMG with yay, mise, asdf, nvm, pyenv, and Volta using documented behavior, supported platforms, and explicit tradeoffs.',
  },
} as const;

export const LEARNING_PAGES = [
  {
    category: 'runtimes',
    slug: 'node',
    title: 'Manage Node.js versions with OMG',
    description:
      'Install Node.js in pure Rust without external subprocesses, verify official SHA-256 digests, switch project versions with .node-version or .nvmrc, and diagnose PATH conflicts.',
    modified: '2026-09-22',
  },
  {
    category: 'runtimes',
    slug: 'bun',
    title: 'Install and switch Bun versions',
    description:
      'Manage Bun versions with OMG, use .bun-version for a project, verify GitHub release checksums, and separate runtime management from Bun package dependencies.',
    modified: '2026-09-22',
  },
  {
    category: 'runtimes',
    slug: 'python',
    title: 'Manage Python versions and virtual environments',
    description:
      'Download precompiled standalone CPython with SHA-256 validation, detect pyproject.toml and .python-version pins, and isolate dependencies in virtual environments.',
    modified: '2026-09-22',
  },
  {
    category: 'runtimes',
    slug: 'go',
    title: 'Manage Go versions with OMG',
    description:
      'Install Go, switch project versions with go.mod or .go-version, understand GOROOT and GOPATH tools, and verify toolchains on Linux, macOS, and WSL.',
    modified: '2026-09-21',
  },
  {
    category: 'runtimes',
    slug: 'rust',
    title: 'Manage Rust toolchains with OMG',
    description:
      'Install Rust, switch between stable and nightly toolchains, use rust-toolchain.toml, and manage Cargo binaries alongside system packages.',
    modified: '2026-09-21',
  },
  {
    category: 'guides',
    slug: 'task-runner',
    title: 'Run project tasks across ecosystems with OMG',
    description:
      'Discover and run named tasks from Cargo, JavaScript, Python, Go Task, Ruby, Java, PHP, mise, and Make project files with omg run.',
    modified: '2026-09-22',
  },
  {
    category: 'guides',
    slug: 'migrate-from-yay',
    title: 'Migrate from yay to OMG on Arch Linux',
    description:
      'Map yay commands to OMG, understand the Bubblewrap build sandbox and security approval rules, and migrate safely while keeping pacman and yay installed.',
    modified: '2026-09-22',
  },
  {
    category: 'guides',
    slug: 'node-npm-pnpm',
    title: 'Use Node.js, npm, and pnpm with OMG',
    description:
      'Separate runtime selection from dependency installation. Use an OMG-managed Node.js with npm or pnpm and let the OMG task runner execute project scripts across tools.',
    modified: '2026-09-22',
  },
  {
    category: 'guides',
    slug: 'migrate-from-nvm',
    title: 'Move an nvm project to OMG',
    description:
      'Reuse existing .nvmrc files, compare the selected Node.js version and executable path, and test OMG without deleting your nvm setup.',
    modified: '2026-09-22',
  },
  {
    category: 'guides',
    slug: 'migrate-from-asdf',
    title: 'Move an asdf project to OMG',
    description:
      'Try OMG with your existing .tool-versions, compare the selected runtime and command path, and keep asdf until your project tests pass.',
    modified: '2026-09-22',
  },
  {
    category: 'guides',
    slug: 'reproducible-dev-environments',
    title: 'Capture and check development environments',
    description:
      'On Arch, Debian, or Ubuntu, record explicit package names and selected runtimes in omg.lock, then check for drift without installing software.',
    modified: '2026-09-22',
  },
  {
    category: 'compare',
    slug: 'omg-vs-yay',
    title: 'OMG vs yay: Arch Linux packages, sandboxed AUR builds, and system security',
    description:
      'Compare OMG and yay for Arch Linux package and AUR management: direct libalpm C bindings, pure-Rust PKGBUILD parsing, Bubblewrap build sandboxing, and runtime orchestration.',
    modified: '2026-09-22',
  },
  {
    category: 'compare',
    slug: 'omg-vs-mise',
    title: 'OMG vs mise: why choose OMG for package work?',
    description:
      'See where OMG earns its place beside mise: package investigation, audit evidence, and a reviewed AUR build path. Compare limits and try the workflow.',
    modified: '2026-09-22',
  },
  {
    category: 'compare',
    slug: 'omg-vs-asdf',
    title: 'OMG vs asdf: packages, runtimes, and project pins',
    description:
      'Compare OMG and asdf by architecture (direct PATH vs shell shims), configuration files (.tool-versions), and platform support. Includes verified tradeoffs.',
    modified: '2026-09-21',
  },
  {
    category: 'compare',
    slug: 'omg-vs-nvm',
    title: 'OMG vs nvm: Node.js versions and shell integration',
    description:
      'Compare OMG and nvm for Node.js runtime management. Understand compiled binary shell integration, .nvmrc compatibility, and multi-language support.',
    modified: '2026-09-21',
  },
  {
    category: 'compare',
    slug: 'omg-vs-pyenv',
    title: 'OMG vs pyenv: Python version switching and environments',
    description:
      'Compare OMG and pyenv for Python version management, .python-version support, virtual environment isolation, and direct PATH execution.',
    modified: '2026-09-21',
  },
  {
    category: 'compare',
    slug: 'omg-vs-volta',
    title: 'OMG vs Volta: moving a JavaScript toolchain',
    description:
      'Compare Node.js pin compatibility, package-manager behavior, OS package commands, and platform support before moving a Volta project to OMG.',
    modified: '2026-09-22',
  },
] as const satisfies readonly LearningPageMeta[];

export const learningHref = (page: LearningPageMeta): string => `/${page.category}/${page.slug}/`;
