/**
 * Arch demonstration fixtures, not command execution or a live recording.
 * Output shapes match omg/src/cli/packages/search.rs, cli/runtimes.rs,
 * runtimes/common.rs, and cli/env.rs. Package versions come from the local
 * Arch repository snapshot; runtime and environment values are illustrative.
 */
export const terminalExamples = {
  Packages: {
    command: 'omg search ripgrep --no-aur',
    context: 'Search the Arch repositories.',
    output: [
      '  | Search',
      '    ripgrep',
      '',
      '  ripgrep 15.2.0-1  Official',
      '  ripgrep-all 0.10.10-3  Official',
    ],
    href: '/docs/cli/',
    link: 'Explore package commands',
  },
  Runtimes: {
    command: 'omg use node 22.0.0',
    context: 'Switch to an already-installed Node.js version.',
    output: [
      'OMG Switching node to version 22.0.0',
      '',
      '✓ Now using Node.js 22.0.0',
      '  PATH: /home/dev/.local/share/omg/versions/node/current/bin',
    ],
    href: '/docs/runtimes/',
    link: 'Explore runtime commands',
  },
  Environments: {
    command: 'omg env check',
    context: 'Compare this Arch setup with its existing omg.lock.',
    output: [
      'Checking for environment drift...',
      '',
      '✓ Environment is in sync',
      '',
      'Environment Status',
      '  Lockfile: omg.lock',
      '  Status: No drift detected',
    ],
    href: '/docs/cli/',
    link: 'Explore environment commands',
  },
};

export const terminalChoices = ['Packages', 'Runtimes', 'Environments'] as const;
