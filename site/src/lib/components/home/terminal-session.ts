import recording from './terminal-recordings.json';

type Package = keyof typeof recording.install;
type NodeRequest = keyof typeof recording.node;
type Search = (typeof recording.search)[keyof typeof recording.search];

export type TerminalPrompt =
  { kind: 'install'; package: Package; tip: string } | { kind: 'search'; search: Search };

export interface TerminalOutput {
  text: string;
  prompt?: TerminalPrompt;
  nextCommand?: string;
  frames?: readonly { text: string; duration: number }[];
}

const searches = new Map(Object.entries(recording.search));
const information = new Map(Object.entries(recording.info));
const hashes = new Map(Object.entries(recording.environment.hashes));
const styles = new Map(Object.entries(recording.styles));

export function terminalRuns(text: string) {
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
const packages: readonly Package[] = ['ripgrep', 'ripgrep-all'];
const requests: readonly NodeRequest[] = ['20', '22', '20.0.0', '22.0.0'];

interface Environment {
  node: string;
  explicit: ReadonlySet<Package>;
}

// The recording starts with Node 20 selected and an existing omg.lock.
export class TerminalSession {
  #current: Environment = { node: recording.node['20'].version, explicit: new Set() };
  #lock = this.#current;
  #nodes = new Set([this.#current.node]);
  #showTip = true;

  run(input: string): TerminalOutput {
    const command = input.trim().split(/\s+/u).join(' ');
    switch (command) {
      case 'clear':
        return { text: '' };
      case 'help':
        return { text: recording.shellHelp };
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
        return { text: `v${this.#current.node}`, nextCommand: 'omg env check' };
      case 'omg env capture': {
        const mask =
          Number(this.#current.explicit.has('ripgrep')) +
          2 * Number(this.#current.explicit.has('ripgrep-all'));
        const hash = hashes.get(`${this.#current.node}:${mask}`);
        if (!hash) throw new Error('Missing recorded environment fingerprint');
        this.#lock = this.#current;
        return {
          nextCommand: 'omg env check',
          text: recording.environment.capture
            .replace('{hash}', hash)
            .replace(
              '{count}',
              String(recording.environment.basePackageCount + this.#current.explicit.size)
            ),
        };
      }
      case 'omg env check': {
        const text = this.#checkEnvironment();
        return {
          text,
          nextCommand: text === recording.environment.sync ? 'omg use node 22' : 'omg env capture',
        };
      }
    }

    const [program, verb, arg, ...options] = command.split(' ');
    if (program === 'omg' && arg) {
      if (verb === 'search' || verb === 's') {
        const search = searches.get([arg, ...options].join(' '));
        if (search)
          return {
            text: search.output + '\n\n' + recording.pickerPrompt,
            prompt: { kind: 'search', search },
          };
      }
      if (verb === 'info' && !options.length && information.has(arg))
        return { text: this.#info(arg), nextCommand: 'omg env check' };
      const pkg = packages.find(name => name === arg);
      if ((verb === 'install' || verb === 'i') && pkg && !options.length) {
        const tip = this.#showTip ? recording.confirmation.tip + '\n\n' : '';
        this.#showTip = false;
        return {
          text: tip + recording.confirmation.prompt,
          prompt: { kind: 'install', package: pkg, tip },
        };
      }
      if (verb === 'use' && arg === 'node' && options.length === 1) {
        const key = requests.find(name => name === options[0]);
        if (key) {
          const version = recording.node[key];
          const cached = this.#nodes.has(version.version);
          this.#nodes.add(version.version);
          this.#current = { ...this.#current, node: version.version };
          return {
            text: cached ? version.cached : version.first,
            nextCommand: 'node --version',
            frames: cached ? [] : version.frames,
          };
        }
      }
    }
    return { text: outsideRecording };
  }

  confirm(prompt: Extract<TerminalPrompt, { kind: 'install' }>, yes: boolean): TerminalOutput {
    if (!yes) return { text: prompt.tip + recording.confirmation.cancel };
    const pkg = prompt.package;
    const transaction = recording.install[pkg];
    const cached = this.#installed(pkg);
    if (!cached)
      this.#current = { ...this.#current, explicit: new Set([...this.#current.explicit, pkg]) };
    const lead = prompt.tip + recording.confirmation.yes + '\n\n';
    return {
      text: lead + (cached ? transaction.repeat : transaction.first),
      nextCommand: `omg info ${pkg}`,
      frames: cached
        ? []
        : transaction.frames.map(frame => ({ ...frame, text: lead + frame.text })),
    };
  }

  select(search: Search, index: number | null): TerminalOutput {
    const label = index === null ? undefined : search.choices[index];
    if (!label) return { text: search.output };
    const name = label.split(' ')[0] ?? '';
    return {
      text: [search.output, recording.picked.replace('{package}', label), this.#info(name)].join(
        '\n\n'
      ),
    };
  }

  #installed(pkg: Package) {
    // Arch installs ripgrep as a dependency of ripgrep-all. A repeat install leaves it implicit.
    return (
      this.#current.explicit.has(pkg) ||
      (pkg === 'ripgrep' && this.#current.explicit.has('ripgrep-all'))
    );
  }

  #info(name: string) {
    const pkg = packages.find(item => item === name);
    return pkg && this.#installed(pkg)
      ? recording.installedInfo[pkg]
      : (information.get(name) ?? outsideRecording);
  }

  #checkEnvironment() {
    const env = recording.environment;
    const differences = [];
    if (this.#current.node !== this.#lock.node)
      differences.push(
        env.versions.replace('{expected}', this.#lock.node).replace('{actual}', this.#current.node)
      );
    const added = packages.filter(
      name => this.#current.explicit.has(name) && !this.#lock.explicit.has(name)
    );
    if (added.length)
      differences.push(
        [env.extra, ...added.map(name => env.extraPackage.replace('{package}', name))].join('\n')
      );
    return differences.length
      ? [env.driftHead, ...differences].join('\n\n') + '\n' + env.driftError
      : env.sync;
  }
}
