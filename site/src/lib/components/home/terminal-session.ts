// Official package versions from the Arch snapshot used by the homepage demo.
const packages = new Map([
  ['ripgrep', '15.2.0-1'],
  ['ripgrep-all', '0.10.10-3'],
]);

const help = [
  'omg search <name>       Search the demo package index',
  'omg install <name>      Install ripgrep or ripgrep-all',
  'omg use node <20|22>    Switch the active Node.js version',
  'node --version          Print the active version',
  'omg env check           Compare this machine with omg.lock',
  'omg env capture         Save this machine to omg.lock',
  'clear                   Clear the transcript',
].join('\n');

interface Environment {
  readonly packages: readonly string[];
  readonly node: string;
}

export class TerminalSession {
  #current: Environment = { packages: [], node: '20.0.0' };
  #lockfile = this.#current;

  run(input: string): string {
    const words = input.trim().split(/\s+/u);
    switch (words.join(' ')) {
      case 'omg':
      case 'help':
      case 'omg --help':
      case 'omg help':
        return help;
      case 'node -v':
      case 'node --version':
        return `v${this.#current.node}`;
      case 'omg env capture':
        this.#lockfile = this.#current;
        return 'Environment state saved to omg.lock';
      case 'omg env check':
        return this.#checkEnvironment();
    }

    const [program, operation, argument, option] = words;
    if (program === 'omg' && argument && words.length <= 4) {
      if (operation === 'search' && (!option || option === '--no-aur')) {
        const matches = [];
        for (const [name, version] of packages) {
          if (name.includes(argument)) matches.push(`${name} ${version}  Official`);
        }
        return matches.length ? matches.join('\n') : 'No matching packages in the demo index.';
      }
      if (operation === 'install' && !option) {
        const version = packages.get(argument);
        if (!version) return 'Package missing from the demo index. Try omg search ripgrep.';
        if (this.#current.packages.includes(argument)) return `${argument} is already installed.`;
        this.#current = { ...this.#current, packages: [...this.#current.packages, argument] };
        return `Installed ${argument} ${version}`;
      }
      if (operation === 'use' && argument === 'node') {
        const node = ['20.0.0', '22.0.0'].find(v => v === option || v.split('.')[0] === option);
        if (!node) return 'Available Node.js versions in this demo: 20 and 22.';
        this.#current = { ...this.#current, node };
        return `Now using Node.js ${node}`;
      }
    }
    return 'Unknown demo command. Type help to see the available commands.';
  }

  #checkEnvironment(): string {
    const differences = [];
    if (this.#current.node !== this.#lockfile.node) {
      differences.push(
        `  ~ node (expected: ${this.#lockfile.node}, actual: ${this.#current.node})`
      );
    }
    for (const name of this.#current.packages) {
      if (!this.#lockfile.packages.includes(name)) differences.push(`  + ${name} (extra package)`);
    }
    return differences.length
      ? ['Environment drift detected', ...differences].join('\n')
      : 'Environment is in sync\n  omg.lock: no drift detected';
  }
}
