// @ts-check
import recording from './recordings.json' with { type: 'json' };

/** @typedef {keyof typeof recording.install} RecordedPackage */
/** @typedef {keyof typeof recording.node} NodeRequest */
/** @typedef {(typeof recording.search)[keyof typeof recording.search]} Search */
/** @typedef {'node' | 'python' | 'rust' | 'go' | 'bun' | 'zig'} RuntimeName */
/** @typedef {{name: string, version: string, source: 'Official' | 'AUR', repo: string, description: string, size: string, deps?: readonly string[], binary?: string, grade?: string}} CatalogPackage */
/** @typedef {{kind: 'install', package: string, tip: string, aur?: boolean} | {kind: 'search', search: Search}} TerminalPrompt */
/** @typedef {{text: string, prompt?: TerminalPrompt, stream?: boolean}} TerminalOutput */
/** @typedef {{node: string, explicit: ReadonlySet<string>, runtimes: Readonly<Record<RuntimeName, string | null>>}} Environment */
/** @typedef {{node: string, inSync: boolean, explicitCount: number, installedCount: number, dirty: boolean}} SessionState */

const searches = new Map(Object.entries(recording.search));
const information = new Map(Object.entries(recording.info));
const hashes = new Map(Object.entries(recording.environment.hashes));
const styles = new Map(Object.entries(recording.styles));

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const BOLD_RED = '\x1b[1;31m';
const BOLD_GREEN = '\x1b[1;32m';
const BOLD_YELLOW = '\x1b[1;33m';
const BOLD_BLUE = '\x1b[1;34m';
const BOLD_CYAN = '\x1b[1;36m';
const BOLD_WHITE = '\x1b[1;37m';
const DIM_WHITE = '\x1b[2;37m';
const OMG_BADGE = '\x1b[1;30;46m';
const BAR = '\x1b[1;38;2;122;162;247m';

/** @type {readonly CatalogPackage[]} */
const CATALOG = [
  {
    name: 'ripgrep',
    version: '15.2.0-1',
    source: 'Official',
    repo: 'extra',
    description: 'A search tool that combines the usability of ag with the raw speed of grep',
    size: '1.8 MiB',
    binary: 'rg',
  },
  {
    name: 'ripgrep-all',
    version: '0.10.10-3',
    source: 'Official',
    repo: 'extra',
    description: 'rga: ripgrep, but also search in PDFs, E-Books, Office documents, zip, tar.gz',
    size: '3.4 MiB',
    deps: ['ripgrep'],
    binary: 'rga',
  },
  {
    name: 'fd',
    version: '10.5.0-3',
    source: 'Official',
    repo: 'extra',
    description: 'Simple, fast and user-friendly alternative to find',
    size: '1.1 MiB',
    binary: 'fd',
  },
  {
    name: 'bat',
    version: '0.26.1-3',
    source: 'Official',
    repo: 'extra',
    description: 'Cat clone with syntax highlighting and git integration',
    size: '2.6 MiB',
    binary: 'bat',
  },
  {
    name: 'fzf',
    version: '0.62.0-1',
    source: 'Official',
    repo: 'extra',
    description: 'Command-line fuzzy finder',
    size: '1.5 MiB',
    binary: 'fzf',
  },
  {
    name: 'neovim',
    version: '0.11.1-1',
    source: 'Official',
    repo: 'extra',
    description: 'Fork of Vim aiming to improve user experience, plugins, and GUIs',
    size: '8.4 MiB',
    binary: 'nvim',
  },
  {
    name: 'hyperfine',
    version: '1.19.0-1',
    source: 'Official',
    repo: 'extra',
    description: 'A command-line benchmarking tool',
    size: '0.6 MiB',
    binary: 'hyperfine',
  },
  {
    name: 'eza',
    version: '0.21.1-1',
    source: 'Official',
    repo: 'extra',
    description: 'A modern replacement for ls (community fork of exa)',
    size: '0.9 MiB',
    binary: 'eza',
  },
  {
    name: 'zoxide',
    version: '0.9.8-1',
    source: 'Official',
    repo: 'extra',
    description: 'A smarter cd command for your terminal',
    size: '0.5 MiB',
    binary: 'zoxide',
  },
  {
    name: 'ripgrep-git',
    version: '15.1.0.r4.57c190d5-1',
    source: 'AUR',
    repo: 'AUR',
    description: 'Line-oriented search tool (built from upstream git main)',
    size: '1.9 MiB',
    binary: 'rg',
    grade: 'B (source build, Bubblewrap sandbox)',
  },
  {
    name: 'yay-bin',
    version: '12.5.0-1',
    source: 'AUR',
    repo: 'AUR',
    description: 'Yet another yogurt. Pacman wrapper and AUR helper written in go (precompiled)',
    size: '3.2 MiB',
    grade: 'B (prebuilt binary, Bubblewrap sandbox)',
  },
];

const catalogByName = new Map(CATALOG.map(pkg => [pkg.name, pkg]));

/** @type {Readonly<Record<Exclude<RuntimeName, 'node'>, {label: string, available: readonly string[], aliases: Readonly<Record<string, string>>, binary: string, archive: (v: string) => string}>>} */
const EXTRA_RUNTIMES = {
  python: {
    label: 'Python',
    available: ['3.13.3', '3.12.9', '3.11.12'],
    aliases: { 3.13: '3.13.3', 3.12: '3.12.9', 3.11: '3.11.12', latest: '3.13.3' },
    binary: 'python',
    archive: v => `cpython-${v}+20260918-x86_64-unknown-linux-gnu.tar.zst`,
  },
  rust: {
    label: 'Rust',
    available: ['1.86.0', '1.85.1'],
    aliases: { 1.86: '1.86.0', 1.85: '1.85.1', stable: '1.86.0', latest: '1.86.0' },
    binary: 'rustc',
    archive: v => `rust-${v}-x86_64-unknown-linux-gnu.tar.xz`,
  },
  go: {
    label: 'Go',
    available: ['1.24.2', '1.23.8'],
    aliases: { 1.24: '1.24.2', 1.23: '1.23.8', latest: '1.24.2' },
    binary: 'go',
    archive: v => `go${v}.linux-amd64.tar.gz`,
  },
  bun: {
    label: 'Bun',
    available: ['1.2.10', '1.2.5'],
    aliases: { 1.2: '1.2.10', latest: '1.2.10' },
    binary: 'bun',
    archive: v => `bun-linux-x64-v${v}.zip`,
  },
  zig: {
    label: 'Zig',
    available: ['0.14.0', '0.13.0'],
    aliases: { 0.14: '0.14.0', 0.13: '0.13.0', latest: '0.14.0' },
    binary: 'zig',
    archive: v => `zig-linux-x86_64-${v}.tar.xz`,
  },
};

/** @type {readonly string[]} */
export const COMPLETE_COMMANDS = [
  'omg install ripgrep',
  'omg install ripgrep-all',
  'omg install fd',
  'omg install bat',
  'omg install fzf',
  'omg install neovim',
  'omg install ripgrep-git',
  'omg install --dry-run ripgrep',
  'omg remove ripgrep',
  'omg remove fd',
  'omg search ripgrep',
  'omg search ripgrep --no-aur',
  'omg search fd',
  'omg search bat',
  'omg info ripgrep',
  'omg info fd',
  'omg info bat',
  'omg use node 22',
  'omg use node 20',
  'omg use python 3.13',
  'omg use rust 1.86',
  'omg use go 1.24',
  'omg use bun 1.2',
  'omg use zig 0.14',
  'omg list',
  'omg list node --available',
  'omg list python --available',
  'omg which node',
  'omg which python',
  'omg env check',
  'omg env capture',
  'omg doctor',
  'omg doctor --network',
  'omg status',
  'omg status --fast',
  'omg outdated',
  'omg run',
  'omg run test',
  'omg run build',
  'omg run lint',
  'omg audit',
  'omg --help',
  'omg --version',
  'node --version',
  'python --version',
  'rg --version',
  'cat omg.lock',
  'cat .node-version',
  'cat package.json',
  'ls',
  'ls -la',
  'pwd',
  'whoami',
  'clear',
  'reset',
  'help',
];

/** @param {string} text */
export function terminalRuns(text) {
  const [plain, ...parts] = text.split('\x1b[');
  return [
    { text: plain ?? '', style: undefined },
    ...parts.map(part => {
      const end = part.indexOf('m');
      return { style: styles.get(part.slice(0, end)), text: part.slice(end + 1) };
    }),
  ];
}

const outsideRecording =
  'This command is outside the recorded Arch session. Open Commands to see what you can run.';
/** @type {readonly RecordedPackage[]} */
const recordedPackages = ['ripgrep', 'ripgrep-all'];
/** @type {readonly NodeRequest[]} */
const nodeRequests = ['20', '22', '20.0.0', '22.0.0'];

/** @param {string} str */
function simpleHash(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const lo = (h1 >>> 0).toString(16).padStart(8, '0');
  const hi = (h2 >>> 0).toString(16).padStart(8, '0');
  return hi + lo;
}

/** @param {string} name @returns {name is RecordedPackage} */
function isRecordedPackage(name) {
  return recordedPackages.some(item => item === name);
}

/** @param {string} name @returns {name is Exclude<RuntimeName, 'node'>} */
function isExtraRuntime(name) {
  return Object.hasOwn(EXTRA_RUNTIMES, name);
}

// The recording starts with Node 20 selected, Python 3.12 available, and an existing omg.lock.
export class TerminalSession {
  /** @type {Environment} */
  #current = {
    node: recording.node['20'].version,
    explicit: new Set(),
    runtimes: {
      node: recording.node['20'].version,
      python: '3.12.9',
      rust: null,
      go: null,
      bun: null,
      zig: null,
    },
  };
  /** @type {Environment} */
  #lock = this.#current;
  #nodes = new Set([this.#current.node]);
  /** @type {Map<string, Set<string>>} */
  #installedRuntimes = new Map([
    ['node', this.#nodes],
    ['python', new Set(['3.12.9'])],
    ['rust', new Set()],
    ['go', new Set()],
    ['bun', new Set()],
    ['zig', new Set()],
  ]);
  #showTip = true;
  #commandsRun = 0;

  /** @returns {SessionState} */
  stateSummary() {
    return {
      node: this.#current.node,
      inSync: !this.#hasDrift(),
      explicitCount: recording.environment.basePackageCount + this.#current.explicit.size,
      installedCount: 164 + this.#current.explicit.size,
      dirty: this.#commandsRun > 0,
    };
  }

  /** @param {string} input @returns {TerminalOutput} */
  run(input) {
    const command = input.trim().split(/\s+/u).join(' ');
    if (command && command !== 'clear') this.#commandsRun++;

    // Reject shell chaining / pipes so the contract for unsupported shell syntax stays clear.
    if (/[;&|`$<>]/u.test(command)) return { text: outsideRecording };

    switch (command) {
      case 'clear':
        return { text: '' };
      case 'help':
        return { text: recording.shellHelp };
      case 'pwd':
        return { text: '/home/demo/project' };
      case 'whoami':
        return { text: 'demo' };
      case 'ls':
        return {
          text: `${BLUE}src/${RESET}  Makefile  omg.lock  package.json`,
        };
      case 'ls -la':
      case 'ls -a':
      case 'll':
        return {
          text: [
            `${DIM}total 24${RESET}`,
            `-rw-r--r-- 1 demo demo    3 Nov 22 00:00 .node-version`,
            `-rw-r--r-- 1 demo demo  214 Nov 22 00:00 Makefile`,
            `-rw-r--r-- 1 demo demo  418 Nov 22 00:00 omg.lock`,
            `-rw-r--r-- 1 demo demo  312 Nov 22 00:00 package.json`,
            `drwxr-xr-x 2 demo demo   60 Nov 22 00:00 ${BLUE}src/${RESET}`,
          ].join('\n'),
        };
      case 'cat .node-version':
        return { text: this.#current.node.split('.')[0] ?? '20' };
      case 'cat package.json':
        return {
          text: [
            '{',
            '  "name": "demo-app",',
            '  "version": "1.0.0",',
            '  "scripts": {',
            '    "test": "vitest run",',
            '    "build": "vite build",',
            '    "lint": "oxlint src"',
            '  }',
            '}',
          ].join('\n'),
        };
      case 'cat omg.lock':
        return { text: this.#renderLockfile() };
      case 'omg':
        return { text: recording.bare };
      case 'omg help':
      case 'omg -h':
      case 'omg --help':
        return { text: recording.help };
      case 'omg -V':
      case 'omg --version':
        return { text: `omg ${recording.release}` };
      case 'node -v':
      case 'node --version':
        return { text: `v${this.#current.node}` };
      case 'python -V':
      case 'python --version':
      case 'python3 --version':
        return { text: `Python ${this.#current.runtimes.python ?? '3.12.9'}` };
      case 'rustc --version':
      case 'rustc -V':
        return this.#current.runtimes.rust
          ? { text: `rustc ${this.#current.runtimes.rust} (omg-managed)` }
          : {
              text: `bash: rustc: command not found\n${DIM}Tip: run \`omg use rust 1.86\`${RESET}`,
            };
      case 'go version':
        return this.#current.runtimes.go
          ? { text: `go version go${this.#current.runtimes.go} linux/amd64` }
          : { text: `bash: go: command not found\n${DIM}Tip: run \`omg use go 1.24\`${RESET}` };
      case 'bun -v':
      case 'bun --version':
        return this.#current.runtimes.bun
          ? { text: this.#current.runtimes.bun }
          : { text: `bash: bun: command not found\n${DIM}Tip: run \`omg use bun 1.2\`${RESET}` };
      case 'zig version':
        return this.#current.runtimes.zig
          ? { text: this.#current.runtimes.zig }
          : { text: `bash: zig: command not found\n${DIM}Tip: run \`omg use zig 0.14\`${RESET}` };
      case 'rg --version':
      case 'rg -V':
        return this.#installed('ripgrep') || this.#installed('ripgrep-git')
          ? { text: 'ripgrep 15.2.0\n-SIMD -AVX (compiled)\n+SIMD +AVX (runtime)' }
          : {
              text: `bash: rg: command not found\n${DIM}Tip: run \`omg install ripgrep\`${RESET}`,
            };
      case 'fd --version':
      case 'fd -V':
        return this.#installed('fd')
          ? { text: 'fd 10.5.0' }
          : { text: `bash: fd: command not found\n${DIM}Tip: run \`omg install fd\`${RESET}` };
      case 'bat --version':
      case 'bat -V':
        return this.#installed('bat')
          ? { text: 'bat 0.26.1' }
          : { text: `bash: bat: command not found\n${DIM}Tip: run \`omg install bat\`${RESET}` };
      case 'omg env capture':
        return this.#captureEnvironment();
      case 'omg env check':
        return { text: this.#checkEnvironment(), stream: true };
      case 'omg doctor':
        return { text: this.#doctor(false, false), stream: true };
      case 'omg doctor --network':
        return { text: this.#doctor(true, false), stream: true };
      case 'omg doctor --eol':
        return { text: this.#doctor(false, true), stream: true };
      case 'omg status':
        return { text: this.#status(false), stream: true };
      case 'omg status --fast':
        return { text: this.#status(true), stream: true };
      case 'omg outdated':
        return { text: this.#outdated(), stream: true };
      case 'omg audit':
        return { text: this.#audit(), stream: true };
      case 'omg list':
      case 'omg ls':
        return { text: this.#listRuntimes() };
      case 'omg run':
      case 'omg run --list':
      case 'omg run -l':
        return { text: this.#listTasks() };
    }

    const [program, verb, ...rest] = command.split(' ');
    if (program !== 'omg' || !verb) return { text: outsideRecording };

    if (verb === 'search' || verb === 's') return this.#handleSearch(rest);
    if (verb === 'info') return this.#handleInfo(rest);
    if (verb === 'install' || verb === 'i') return this.#handleInstall(rest);
    if (verb === 'remove' || verb === 'r') return this.#handleRemove(rest);
    if (verb === 'use') return this.#handleUse(rest);
    if (verb === 'list' || verb === 'ls') return this.#handleList(rest);
    if (verb === 'which') return this.#handleWhich(rest);
    if (verb === 'run') return this.#handleRun(rest);

    return { text: outsideRecording };
  }

  /** @param {Extract<TerminalPrompt, {kind: 'install'}>} prompt @param {boolean} yes @returns {TerminalOutput} */
  confirm(prompt, yes) {
    if (!yes) return { text: prompt.tip + recording.confirmation.cancel };
    const pkg = prompt.package;
    const lead = prompt.tip + recording.confirmation.yes + '\n\n';
    if (isRecordedPackage(pkg)) {
      const transaction = recording.install[pkg];
      const cached = this.#installed(pkg);
      if (!cached)
        this.#current = { ...this.#current, explicit: new Set([...this.#current.explicit, pkg]) };
      return {
        text: lead + (cached ? transaction.repeat : transaction.first),
        stream: true,
      };
    }
    return {
      text: lead + this.#installCatalogPackage(pkg),
      stream: true,
    };
  }

  /** @param {Search} search @param {number | null} index @returns {TerminalOutput} */
  select(search, index) {
    const label = index === null ? undefined : search.choices[index];
    if (!label) return { text: search.output };
    const name = label.split(' ')[0] ?? '';
    return {
      text: [search.output, recording.picked.replace('{package}', label), this.#info(name)].join(
        '\n\n'
      ),
    };
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleSearch(args) {
    if (args.length === 0) return { text: outsideRecording };
    const fullKey = args.join(' ');
    const recorded = searches.get(fullKey);
    if (recorded) {
      return {
        text: recorded.output + '\n\n' + recording.pickerPrompt,
        prompt: { kind: 'search', search: recorded },
      };
    }
    const noAur = args.includes('--no-aur');
    const terms = args.filter(a => a !== '--no-aur');
    if (terms.length !== 1) return { text: outsideRecording };
    const query = (terms[0] ?? '').toLowerCase();
    const matches = CATALOG.filter(
      pkg =>
        (!noAur || pkg.source === 'Official') &&
        (pkg.name.includes(query) || pkg.description.toLowerCase().includes(query))
    );
    if (matches.length === 0) {
      return {
        text: [
          `  ${BAR}│${RESET} ${BOLD_BLUE}Search${RESET}`,
          `    ${DIM}${query}${RESET}`,
          `  ${DIM}No packages found matching "${query}". Try: ripgrep, fd, bat, fzf, neovim${RESET}`,
        ].join('\n'),
      };
    }
    const lines = [
      `  ${BAR}│${RESET} ${BOLD_BLUE}Search${RESET}`,
      `    ${DIM}${query}${RESET}`,
      ...matches.map(pkg => {
        const badge =
          pkg.source === 'AUR' ? `${BOLD_YELLOW}⚠${RESET} AUR` : `${BOLD_BLUE}ℹ${RESET} Official`;
        return `  ${BOLD_WHITE}${pkg.name}${RESET} ${GREEN}${pkg.version}${RESET}  ${badge}`;
      }),
    ];
    const search = {
      output: lines.join('\n'),
      choices: matches.map(pkg => `${pkg.name} ${pkg.version} (${pkg.source})`),
    };
    return {
      text: search.output + '\n\n' + recording.pickerPrompt,
      prompt: { kind: 'search', search },
    };
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleInfo(args) {
    if (args.length !== 1) return { text: outsideRecording };
    const name = args[0] ?? '';
    if (information.has(name) || catalogByName.has(name)) return { text: this.#info(name) };
    return { text: outsideRecording };
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleInstall(args) {
    const dryRun = args.includes('--dry-run');
    const autoYes = args.includes('-y') || args.includes('--yes');
    const names = args.filter(a => a !== '--dry-run' && a !== '-y' && a !== '--yes');
    if (names.length !== 1) return { text: outsideRecording };
    const name = names[0] ?? '';
    const pkg = catalogByName.get(name);
    if (!pkg) {
      return {
        text: `${BOLD_RED}✗${RESET} Package '${name}' not found in the simulated Arch index.\n${DIM}Available: ${CATALOG.map(p => p.name).join(', ')}${RESET}`,
      };
    }
    if (dryRun) {
      const badge =
        pkg.source === 'AUR'
          ? `${YELLOW}AUR (Bubblewrap sandbox, no network during build)${RESET}`
          : `${BLUE}Official repository (${pkg.repo})${RESET}`;
      const status = this.#installed(name) ? 'already installed' : `install (${pkg.size})`;
      return {
        text: [
          `  ${BAR}│${RESET} ${BOLD_BLUE}Install preview${RESET} ${DIM}(--dry-run)${RESET}`,
          `    ${BOLD_WHITE}${pkg.name}${RESET} ${GREEN}${pkg.version}${RESET}`,
          `  ${DIM_WHITE}   Source${RESET}: ${badge}`,
          `  ${DIM_WHITE}   Action${RESET}: ${status}`,
          pkg.grade ? `  ${DIM_WHITE}    Grade${RESET}: ${GREEN}${pkg.grade}${RESET}` : null,
          `  ${DIM}No system changes made.${RESET}`,
        ]
          .filter(Boolean)
          .join('\n'),
      };
    }
    if (autoYes) {
      if (isRecordedPackage(name)) {
        const transaction = recording.install[name];
        const cached = this.#installed(name);
        if (!cached)
          this.#current = {
            ...this.#current,
            explicit: new Set([...this.#current.explicit, name]),
          };
        return { text: cached ? transaction.repeat : transaction.first, stream: true };
      }
      return { text: this.#installCatalogPackage(name), stream: true };
    }
    if (isRecordedPackage(name) && !dryRun) {
      const tip = this.#showTip ? recording.confirmation.tip + '\n\n' : '';
      this.#showTip = false;
      return {
        text: tip + recording.confirmation.prompt,
        prompt: { kind: 'install', package: name, tip },
      };
    }
    const tip = this.#showTip ? recording.confirmation.tip + '\n\n' : '';
    this.#showTip = false;
    const aurNotice =
      pkg.source === 'AUR'
        ? `${YELLOW}⚠${RESET} AUR source build: ${BOLD_WHITE}${pkg.name}${RESET} ${DIM}(Grade ${pkg.grade})${RESET}\n` +
          `  ${DIM}Build runs inside Bubblewrap with private /home and no build network.${RESET}\n\n`
        : '';
    return {
      text: tip + aurNotice + recording.confirmation.prompt,
      prompt: { kind: 'install', package: name, tip: tip + aurNotice, aur: pkg.source === 'AUR' },
    };
  }

  /** @param {string} name */
  #installCatalogPackage(name) {
    const pkg = catalogByName.get(name);
    if (!pkg) return outsideRecording;
    if (this.#installed(name)) {
      return [
        `  ${BAR}│${RESET} ${BOLD_BLUE}Install${RESET}`,
        `    ${DIM}1 package${RESET}`,
        `${BOLD_GREEN}✓${RESET} ${BOLD}Nothing to do${RESET} ${DIM}(${name} ${pkg.version} is already installed)${RESET}`,
      ].join('\n');
    }
    this.#current = { ...this.#current, explicit: new Set([...this.#current.explicit, name]) };
    if (pkg.source === 'AUR') {
      return [
        `  ${BAR}│${RESET} ${BOLD_BLUE}Install${RESET}`,
        `    ${DIM}1 AUR package${RESET}`,
        `${BOLD_GREEN}✓${RESET} ${DIM}Resolved${RESET} 0 official · 1 AUR`,
        `  ${BOLD_GREEN}✓${RESET} Fetch PKGBUILD & verify SHA-256 ${DIM}· 0s${RESET}`,
        `  ${BOLD_GREEN}✓${RESET} Bubblewrap sandbox build (isolated /home, no network) ${DIM}· 2s${RESET}`,
        `  ${BOLD_GREEN}✓${RESET} Install built archive via ALPM ${DIM}· 0s${RESET}`,
        `  ${BOLD_GREEN}✓${RESET} ${BOLD}1 package installed${RESET}`,
        `    ${DIM}·${RESET} ${CYAN}${pkg.name}${RESET} ${DIM}${pkg.version}${RESET}`,
      ].join('\n');
    }
    return [
      `  ${BAR}│${RESET} ${BOLD_BLUE}Install${RESET}`,
      `    ${DIM}1 package${RESET}`,
      `${BOLD_GREEN}✓${RESET} ${DIM}Resolved${RESET} 1 official · 0 AUR`,
      `  ${BOLD_GREEN}✓${RESET} Download (${pkg.size}) ${DIM}· 0s${RESET}`,
      `  ${BOLD_GREEN}✓${RESET} Verify PGP signature & ALPM transaction ${DIM}· 0s${RESET}`,
      `  ${BOLD_GREEN}✓${RESET} ${BOLD}1 package installed${RESET}`,
      `    ${DIM}·${RESET} ${CYAN}${pkg.name}${RESET} ${DIM}${pkg.version}${RESET}`,
    ].join('\n');
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleRemove(args) {
    if (args.length !== 1) return { text: outsideRecording };
    const name = args[0] ?? '';
    if (!this.#current.explicit.has(name)) {
      return {
        text: `${YELLOW}⚠${RESET} Package '${name}' is not explicitly installed in this session.`,
      };
    }
    const next = new Set(this.#current.explicit);
    next.delete(name);
    this.#current = { ...this.#current, explicit: next };
    return {
      text: [
        `  ${BAR}│${RESET} ${BOLD_BLUE}Remove${RESET}`,
        `    ${DIM}1 package${RESET}`,
        `  ${BOLD_GREEN}✓${RESET} ALPM transaction ${DIM}· 0s${RESET}`,
        `  ${BOLD_GREEN}✓${RESET} ${BOLD}1 package removed${RESET}`,
        `    ${DIM}·${RESET} ${CYAN}${name}${RESET}`,
      ].join('\n'),
      stream: true,
    };
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleUse(args) {
    if (args.length !== 2) return { text: outsideRecording };
    const [runtime, requested] = args;
    if (!runtime || !requested) return { text: outsideRecording };
    if (runtime === 'node') {
      const key = nodeRequests.find(name => name === requested);
      if (!key) {
        return {
          text: `${BOLD_RED}✗${RESET} Node.js version '${requested}' is not in this simulation.\n${DIM}Try: omg use node 22  or  omg use node 20${RESET}`,
        };
      }
      const version = recording.node[key];
      const cached = this.#nodes.has(version.version);
      this.#nodes.add(version.version);
      this.#current = {
        ...this.#current,
        node: version.version,
        runtimes: { ...this.#current.runtimes, node: version.version },
      };
      return {
        text: cached ? version.cached : version.first,
        stream: !cached,
      };
    }
    if (isExtraRuntime(runtime)) {
      const spec = EXTRA_RUNTIMES[runtime];
      const resolved =
        spec.aliases[requested] ?? (spec.available.includes(requested) ? requested : null);
      if (!resolved) {
        return {
          text: `${BOLD_RED}✗${RESET} ${spec.label} version '${requested}' not found.\n${DIM}Available: ${spec.available.join(', ')}${RESET}`,
        };
      }
      const installed = this.#installedRuntimes.get(runtime) ?? new Set();
      const cached = installed.has(resolved);
      installed.add(resolved);
      this.#installedRuntimes.set(runtime, installed);
      this.#current = {
        ...this.#current,
        runtimes: { ...this.#current.runtimes, [runtime]: resolved },
      };
      if (cached) {
        return {
          text: [
            `${OMG_BADGE} OMG ${RESET} ${BOLD}Switching ${runtime} to version ${resolved}${RESET}`,
            `${GREEN}✓${RESET} ${spec.label} ${YELLOW}${resolved}${RESET} is already installed`,
            `${GREEN}✓${RESET} Now using ${BOLD_CYAN}${spec.label}${RESET} ${YELLOW}${resolved}${RESET}`,
          ].join('\n'),
        };
      }
      const archive = spec.archive(resolved);
      return {
        text: [
          `${OMG_BADGE} OMG ${RESET} ${BOLD}Switching ${runtime} to version ${requested}${RESET}`,
          '',
          `${BOLD_CYAN}OMG${RESET} Installing ${spec.label} ${YELLOW}${resolved}${RESET}...`,
          `${BLUE}→${RESET} Downloading ${archive}...`,
          `  ${BOLD_GREEN}✓${RESET} Verified SHA-256 checksum ${DIM}· 0s${RESET}`,
          `${BLUE}→${RESET} Extracting to ~/.local/share/omg/versions/${runtime}/${resolved}...`,
          `  ${BOLD_GREEN}✓${RESET} Ready ${DIM}· 1s${RESET}`,
          `${GREEN}✓${RESET} ${BOLD_CYAN}${spec.label}${RESET} ${YELLOW}${resolved}${RESET} installed successfully!`,
          `${GREEN}✓${RESET} Now using ${BOLD_CYAN}${spec.label}${RESET} ${YELLOW}${resolved}${RESET}`,
        ].join('\n'),
        stream: true,
      };
    }
    return { text: outsideRecording };
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleList(args) {
    const available = args.includes('--available') || args.includes('-A');
    const names = args.filter(a => a !== '--available' && a !== '-A');
    if (names.length === 0) return { text: this.#listRuntimes() };
    if (names.length !== 1) return { text: outsideRecording };
    const runtime = names[0] ?? '';
    if (runtime === 'node') {
      const items = available ? ['22.23.5', '22.0.0', '20.20.2', '20.0.0'] : [...this.#nodes];
      const lines = [
        `${OMG_BADGE} OMG ${RESET} ${BOLD}Node.js ${available ? 'available' : 'installed'} versions${RESET}`,
        '',
        ...items.map(v => {
          const active = v === this.#current.node;
          const marker = active ? `${GREEN}*${RESET}` : ' ';
          const tag = this.#nodes.has(v)
            ? active
              ? ` ${CYAN}(active)${RESET}`
              : ` ${DIM}(installed)${RESET}`
            : '';
          return `  ${marker} ${active ? BOLD_WHITE : ''}${v}${RESET}${tag}`;
        }),
      ];
      return { text: lines.join('\n') };
    }
    if (isExtraRuntime(runtime)) {
      const spec = EXTRA_RUNTIMES[runtime];
      const installed = this.#installedRuntimes.get(runtime) ?? new Set();
      const items = available ? [...spec.available] : [...installed];
      if (items.length === 0) {
        return {
          text: `${OMG_BADGE} OMG ${RESET} ${BOLD}${spec.label}${RESET}\n  ${DIM}No versions installed. Run \`omg use ${runtime} ${spec.available[0]}\`${RESET}`,
        };
      }
      const activeVer = this.#current.runtimes[runtime];
      const lines = [
        `${OMG_BADGE} OMG ${RESET} ${BOLD}${spec.label} ${available ? 'available' : 'installed'} versions${RESET}`,
        '',
        ...items.map(v => {
          const active = v === activeVer;
          const marker = active ? `${GREEN}*${RESET}` : ' ';
          const tag = installed.has(v)
            ? active
              ? ` ${CYAN}(active)${RESET}`
              : ` ${DIM}(installed)${RESET}`
            : '';
          return `  ${marker} ${active ? BOLD_WHITE : ''}${v}${RESET}${tag}`;
        }),
      ];
      return { text: lines.join('\n') };
    }
    return { text: outsideRecording };
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleWhich(args) {
    if (args.length !== 1) return { text: outsideRecording };
    const rt = args[0] ?? '';
    if (rt === 'node') return { text: this.#current.node };
    if (isExtraRuntime(rt)) {
      const active = this.#current.runtimes[rt];
      return active
        ? { text: active }
        : { text: `${YELLOW}⚠${RESET} No ${EXTRA_RUNTIMES[rt].label} version selected.` };
    }
    return { text: outsideRecording };
  }

  /** @param {string[]} args @returns {TerminalOutput} */
  #handleRun(args) {
    if (args.length !== 1) return { text: outsideRecording };
    const task = args[0] ?? '';
    const nodeVer = this.#current.node;
    if (task === 'test') {
      return {
        text: [
          `${OMG_BADGE} OMG ${RESET} ${BOLD}run test${RESET} ${DIM}(package.json · node ${nodeVer})${RESET}`,
          `  ${DIM}$ vitest run${RESET}`,
          '',
          `  ${BOLD_GREEN}✓${RESET} src/parser.test.ts ${DIM}(14 tests) 11ms${RESET}`,
          `  ${BOLD_GREEN}✓${RESET} src/lockfile.test.ts ${DIM}(9 tests) 7ms${RESET}`,
          '',
          `  ${BOLD_GREEN}✓${RESET} ${BOLD}23 passed${RESET} ${DIM}(18ms)${RESET}`,
        ].join('\n'),
        stream: true,
      };
    }
    if (task === 'build') {
      return {
        text: [
          `${OMG_BADGE} OMG ${RESET} ${BOLD}run build${RESET} ${DIM}(package.json · node ${nodeVer})${RESET}`,
          `  ${DIM}$ vite build${RESET}`,
          `  dist/index.html    ${DIM}0.48 kB │ gzip: 0.31 kB${RESET}`,
          `  dist/assets/app.js ${DIM}18.24 kB │ gzip: 6.42 kB${RESET}`,
          `  ${BOLD_GREEN}✓${RESET} ${BOLD}built in 240ms${RESET}`,
        ].join('\n'),
        stream: true,
      };
    }
    if (task === 'lint') {
      return {
        text: [
          `${OMG_BADGE} OMG ${RESET} ${BOLD}run lint${RESET} ${DIM}(package.json · node ${nodeVer})${RESET}`,
          `  ${DIM}$ oxlint src${RESET}`,
          `  ${BOLD_GREEN}✓${RESET} Found 0 warnings and 0 errors ${DIM}(28ms)${RESET}`,
        ].join('\n'),
        stream: true,
      };
    }
    return {
      text: `${BOLD_RED}✗${RESET} Task '${task}' not found.\n${DIM}Available tasks: test, build, lint (run \`omg run --list\`)${RESET}`,
    };
  }

  /** @returns {string} */
  #listRuntimes() {
    /** @type {RuntimeName[]} */
    const names = ['node', 'python', 'rust', 'go', 'bun', 'zig'];
    const lines = [`${OMG_BADGE} OMG ${RESET} ${BOLD}Installed runtime versions${RESET}`, ''];
    for (const rt of names) {
      const versions = [...(this.#installedRuntimes.get(rt) ?? [])];
      if (versions.length === 0) continue;
      const active = this.#current.runtimes[rt];
      const formatted = versions
        .map(v => (v === active ? `${GREEN}*${v}${RESET}` : `${DIM}${v}${RESET}`))
        .join(', ');
      lines.push(`  ${BOLD_WHITE}${rt.padEnd(8)}${RESET} ${formatted}`);
    }
    lines.push('', `${DIM}Run \`omg list <runtime> --available\` or \`omg use rust 1.86\`${RESET}`);
    return lines.join('\n');
  }

  /** @returns {string} */
  #listTasks() {
    return [
      `${OMG_BADGE} OMG ${RESET} ${BOLD}Discovered project tasks${RESET} ${DIM}(~/project)${RESET}`,
      '',
      `  ${BOLD_CYAN}test${RESET}   ${DIM}package.json${RESET}  vitest run`,
      `  ${BOLD_CYAN}build${RESET}  ${DIM}package.json${RESET}  vite build`,
      `  ${BOLD_CYAN}lint${RESET}   ${DIM}package.json${RESET}  oxlint src`,
      '',
      `${DIM}Run with: omg run test${RESET}`,
    ].join('\n');
  }

  /** @param {boolean} network @param {boolean} eol */
  #doctor(network, eol) {
    const count = 164 + this.#current.explicit.size;
    const lines = [
      `${OMG_BADGE} OMG Doctor ${RESET} ${DIM}Checking system health...${RESET}`,
      '',
      `  ${BOLD_GREEN}✓${RESET} Arch Linux detected (x86_64)`,
      `  ${BOLD_GREEN}✓${RESET} ALPM local database (/var/lib/pacman/local, ${count} packages verified)`,
      `  ${BOLD_GREEN}✓${RESET} pacman configuration (/etc/pacman.conf, core + extra repos)`,
      `  ${BOLD_GREEN}✓${RESET} Bubblewrap sandbox available (/usr/bin/bwrap)`,
      `  ${BOLD_GREEN}✓${RESET} Shell hook active (direct PATH, zero shims) · node ${YELLOW}${this.#current.node}${RESET}`,
      `  ${BOLD_GREEN}✓${RESET} Lockfile omg.lock ${this.#hasDrift() ? `${YELLOW}(drift detected — run omg env check)${RESET}` : `${GREEN}(in sync)${RESET}`}`,
    ];
    if (network) {
      lines.push(`  ${BOLD_GREEN}✓${RESET} Mirror & AUR RPC connectivity (42ms)`);
    }
    if (eol) {
      lines.push(
        `  ${BOLD_GREEN}✓${RESET} Node.js ${this.#current.node} — Active LTS`,
        `  ${BOLD_GREEN}✓${RESET} Python ${this.#current.runtimes.python} — Security support`
      );
    }
    lines.push('', `${BOLD_GREEN}✓${RESET} ${BOLD}System is healthy.${RESET}`);
    return lines.join('\n');
  }

  /** @param {boolean} fast */
  #status(fast) {
    const explicit = recording.environment.basePackageCount + this.#current.explicit.size;
    const total = 164 + this.#current.explicit.size;
    const lines = [
      `  ${BAR}│${RESET} ${BOLD_BLUE}Status${RESET}`,
      `  ${BOLD_WHITE}${total}${RESET} packages installed · ${BOLD_WHITE}${explicit}${RESET} explicit`,
      `  ${DIM_WHITE}   Runtime${RESET}: node ${YELLOW}${this.#current.node}${RESET}, python ${YELLOW}${this.#current.runtimes.python}${RESET}`,
      `  ${DIM_WHITE}  Lockfile${RESET}: ${this.#hasDrift() ? `${YELLOW}drift detected${RESET}` : `${GREEN}in sync${RESET}`}`,
    ];
    if (fast) {
      lines.push(
        '',
        `  ${DIM}Updates and orphans skipped (--fast). Run \`omg status\` for a full check.${RESET}`
      );
    } else {
      lines.push(`  ${DIM_WHITE}   Updates${RESET}: ${GREEN}0 outdated${RESET} · 0 orphans`);
    }
    return lines.join('\n');
  }

  #outdated() {
    return [
      `  ${BOLD_BLUE}ℹ${RESET} Checking official repos and managed runtimes...`,
      '',
      `  ${BOLD_GREEN}✓${RESET} ${BOLD}Everything is up to date!${RESET}`,
    ].join('\n');
  }

  #audit() {
    const aurInstalled = [...this.#current.explicit].filter(
      name => catalogByName.get(name)?.source === 'AUR'
    );
    return [
      `  ${BAR}│${RESET} ${BOLD_BLUE}Security Audit${RESET} ${DIM}(local environment)${RESET}`,
      `  ${BOLD_GREEN}✓${RESET} Official ALPM packages verified against Arch keyring`,
      `  ${BOLD_GREEN}✓${RESET} Managed runtimes SHA-256 verified at activation`,
      `  ${BOLD_GREEN}✓${RESET} AUR build isolation: Bubblewrap (private /home, no build network)`,
      aurInstalled.length
        ? `  ${YELLOW}⚠${RESET} ${aurInstalled.length} AUR package(s) installed: ${aurInstalled.join(', ')}`
        : `  ${BOLD_GREEN}✓${RESET} 0 unreviewed AUR packages installed`,
    ].join('\n');
  }

  #captureEnvironment() {
    const onlyRecorded = [...this.#current.explicit].every(isRecordedPackage);
    const sameExtraRuntimes =
      this.#current.runtimes.python === '3.12.9' &&
      !this.#current.runtimes.rust &&
      !this.#current.runtimes.go &&
      !this.#current.runtimes.bun &&
      !this.#current.runtimes.zig;
    let hash;
    if (onlyRecorded && sameExtraRuntimes) {
      const mask =
        Number(this.#current.explicit.has('ripgrep')) +
        2 * Number(this.#current.explicit.has('ripgrep-all'));
      hash = hashes.get(`${this.#current.node}:${mask}`);
    }
    hash ??= simpleHash(
      JSON.stringify({
        node: this.#current.node,
        runtimes: this.#current.runtimes,
        explicit: [...this.#current.explicit].toSorted(),
      })
    );
    this.#lock = {
      node: this.#current.node,
      explicit: new Set(this.#current.explicit),
      runtimes: { ...this.#current.runtimes },
    };
    return {
      text: recording.environment.capture
        .replace('{hash}', hash)
        .replace(
          '{count}',
          String(recording.environment.basePackageCount + this.#current.explicit.size)
        ),
    };
  }

  #renderLockfile() {
    const explicit = ['base', 'curl', 'gh', 'git', 'jq', ...[...this.#lock.explicit].toSorted()];
    /** @type {RuntimeName[]} */
    const rtNames = ['node', 'python', 'rust', 'go', 'bun', 'zig'];
    const rtLines = rtNames
      .filter(rt => this.#lock.runtimes[rt])
      .map(rt => `${rt} = "${this.#lock.runtimes[rt]}"`);
    return [
      `${DIM}# omg.lock — captured by omg ${recording.release}${RESET}`,
      '[platform]',
      'distro = "arch"',
      'arch = "x86_64"',
      '',
      '[runtimes]',
      ...rtLines,
      '',
      '[packages]',
      `explicit = [${explicit.map(p => `"${p}"`).join(', ')}]`,
    ].join('\n');
  }

  /** @param {string} pkg */
  #installed(pkg) {
    // Arch installs ripgrep as a dependency of ripgrep-all. A repeat install leaves it implicit.
    return (
      this.#current.explicit.has(pkg) ||
      (pkg === 'ripgrep' && this.#current.explicit.has('ripgrep-all'))
    );
  }

  /** @param {string} name */
  #info(name) {
    if (isRecordedPackage(name) && this.#installed(name)) return recording.installedInfo[name];
    const recorded = information.get(name);
    if (recorded) return recorded;
    const pkg = catalogByName.get(name);
    if (!pkg) return outsideRecording;
    const installedText = this.#installed(name) ? `${GREEN}yes${RESET}` : 'no';
    const sourceLine =
      pkg.source === 'AUR'
        ? `${YELLOW}AUR (community)${RESET}`
        : `Official repository (${pkg.repo})`;
    return [
      `  ${BAR}│${RESET} ${BOLD_BLUE}Info${RESET}`,
      `    ${DIM}${pkg.name}${RESET}`,
      `  ${DIM_WHITE}        Name${RESET}: ${BOLD_WHITE}${pkg.name}${RESET}`,
      `  ${DIM_WHITE}     Version${RESET}: ${GREEN}${pkg.version}${RESET}`,
      `  ${DIM_WHITE}      Source${RESET}: ${sourceLine}`,
      `  ${DIM_WHITE}   Installed${RESET}: ${installedText}`,
      `  ${DIM_WHITE}        Size${RESET}: ${pkg.size}`,
      pkg.grade ? `  ${DIM_WHITE}       Grade${RESET}: ${GREEN}${pkg.grade}${RESET}` : null,
      `  ${DIM_WHITE} Description${RESET}: ${pkg.description}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  #hasDrift() {
    if (this.#current.node !== this.#lock.node) return true;
    /** @type {RuntimeName[]} */
    const extraRts = ['python', 'rust', 'go', 'bun', 'zig'];
    for (const rt of extraRts) {
      if (this.#current.runtimes[rt] !== this.#lock.runtimes[rt]) return true;
    }
    for (const pkg of this.#current.explicit) {
      if (!this.#lock.explicit.has(pkg)) return true;
    }
    for (const pkg of this.#lock.explicit) {
      if (!this.#current.explicit.has(pkg)) return true;
    }
    return false;
  }

  #checkEnvironment() {
    const env = recording.environment;
    const differences = [];
    /** @type {string[]} */
    const versionLines = [];
    if (this.#current.node !== this.#lock.node) {
      versionLines.push(
        env.versions.replace('{expected}', this.#lock.node).replace('{actual}', this.#current.node)
      );
    }
    /** @type {Exclude<RuntimeName, 'node'>[]} */
    const extraRts = ['python', 'rust', 'go', 'bun', 'zig'];
    for (const rt of extraRts) {
      if (this.#current.runtimes[rt] !== this.#lock.runtimes[rt]) {
        const exp = this.#lock.runtimes[rt] ?? 'none';
        const act = this.#current.runtimes[rt] ?? 'none';
        const prefix = versionLines.length ? '' : `${YELLOW}Version Mismatches:${RESET}\n`;
        versionLines.push(
          `${prefix}  ~ ${rt} (expected: ${GREEN}${exp}${RESET}, actual: ${RED}${act}${RESET})`
        );
      }
    }
    if (versionLines.length) differences.push(versionLines.join('\n'));

    const added = [...this.#current.explicit].filter(name => !this.#lock.explicit.has(name));
    if (added.length) {
      differences.push(
        [env.extra, ...added.map(name => env.extraPackage.replace('{package}', name))].join('\n')
      );
    }
    const missing = [...this.#lock.explicit].filter(name => !this.#current.explicit.has(name));
    if (missing.length) {
      differences.push(
        [
          `${RED}Missing Packages (in lockfile):${RESET}`,
          ...missing.map(name => `  - ${name}`),
        ].join('\n')
      );
    }
    return differences.length
      ? [env.driftHead, ...differences].join('\n\n') + '\n' + env.driftError
      : env.sync;
  }
}
