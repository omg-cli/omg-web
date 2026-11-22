import { describe, expect, it } from 'vitest';
import {
  TerminalSession,
  terminalRuns,
  type TerminalOutput,
} from '../../../../static/terminal/session.js';

function text(output: TerminalOutput) {
  return terminalRuns(output.text)
    .map(run => run.text)
    .join('');
}
function install(session: TerminalSession, name: string, confirm: boolean) {
  const { prompt } = session.run(`omg install ${name}`);
  if (prompt?.kind !== 'install') throw new Error('Expected an installation confirmation');
  return session.confirm(prompt, confirm);
}

describe('recorded Arch terminal session', () => {
  it('waits for consent, keeps cancellation clean and replays fresh and already-installed transactions', () => {
    const session = new TerminalSession();
    expect(text(session.run('omg install ripgrep'))).toContain(
      'Proceed with installation of 1 package(s)? (y/n) › no'
    );
    expect(text(install(session, 'ripgrep', false))).toContain('Installation cancelled');
    expect(text(session.run('omg env check'))).toContain('No drift detected');
    const first = install(session, 'ripgrep', true);
    expect(text(first)).toContain('✓ Resolved 1 official · 0 AUR');
    expect(text(first)).toContain('✓ 1 package installed\n    · ripgrep');
    expect(text(install(session, 'ripgrep', true))).toContain('✓ Nothing to do');
    expect(text(session.run('omg env check'))).toContain(
      'Extra Packages (not in lockfile):\n  + ripgrep'
    );
    expect(text(session.run('omg env capture'))).toContain('Hash: c9c26b47801a199c');
    expect(text(session.run('omg env check'))).toContain('No drift detected');
  });

  it('preserves the distinction between explicit installs and dependencies in the lockfile', () => {
    const session = new TerminalSession();
    install(session, 'ripgrep-all', true);
    expect(text(session.run('omg info ripgrep'))).toContain('Installed: yes');
    expect(text(install(session, 'ripgrep', true))).toContain('Nothing to do');
    const capture = text(session.run('omg env capture'));
    expect(capture).toContain('Hash: 4f0cb68eeeb825d7');
    expect(capture).toContain('Packages: 12');
  });

  it('uses the captured Node builds, distinguishes cold and cached selections and checks drift', () => {
    const session = new TerminalSession();
    expect(text(session.run('node --version'))).toBe('v20.20.2');
    expect(text(session.run('omg use node 22'))).toContain(
      'Downloading node-v22.23.5-linux-x64.tar.xz'
    );
    expect(text(session.run('node -v'))).toBe('v22.23.5');
    const check = text(session.run('omg env check'));
    expect(check).toContain('~ node (expected: 20.20.2, actual: 22.23.5)');
    expect(check).toContain('Error: Environment drift detected');
    expect(text(session.run('omg use node 22'))).toContain('Node.js 22.23.5 is already installed');
    expect(text(session.run('omg use node 20'))).toContain('Now using Node.js 20.20.2');
    expect(text(session.run('omg env check'))).toContain('No drift detected');
    expect(text(session.run('omg use node 20.0.0'))).toContain(
      'Node.js 20.0.0 installed successfully!'
    );
    expect(text(session.run('node -v'))).toBe('v20.0.0');
  });

  it('keeps official and AUR results distinct and opens the selected package details', () => {
    const session = new TerminalSession();
    const full = session.run('omg search ripgrep');
    expect(text(full)).toContain('⚠ AUR');
    const result = session.run('omg search ripgrep --no-aur');
    expect(text(result)).toContain('ℹ Official');
    expect(text(result)).not.toContain('⚠ AUR');
    if (result.prompt?.kind !== 'search') throw new Error('Expected package picker');
    expect(result.prompt.search.choices).toHaveLength(3);
    expect(text(session.select(result.prompt.search, 1))).toContain('Name: ripgrep-all');
    expect(text(session.select(result.prompt.search, null))).not.toContain('Select a package');
    expect(text(session.run('omg --help'))).toContain('Usage: omg [OPTIONS] <COMMAND>');
    expect(text(session.run('help'))).toContain('GNU bash');
    expect(text(session.run('omg install ripgrep && anything'))).toContain(
      'outside the recorded Arch session'
    );
    expect(text(session.run('omg env check'))).toContain('No drift detected');
  });

  it('supports extended packages, dry-run, AUR sandbox builds, runtimes, tasks, and shell inspection', () => {
    const session = new TerminalSession();
    expect(session.stateSummary().inSync).toBe(true);
    expect(text(session.run('rg --version'))).toContain('command not found');
    expect(text(session.run('omg install --dry-run ripgrep'))).toContain('No system changes made');
    expect(text(session.run('omg install -y fd'))).toContain('1 package installed');
    expect(text(session.run('fd --version'))).toContain('fd 10.5.0');
    expect(session.stateSummary().inSync).toBe(false);
    expect(text(session.run('omg env check'))).toContain('+ fd');
    expect(text(session.run('omg remove fd'))).toContain('1 package removed');
    expect(session.stateSummary().inSync).toBe(true);

    const aur = session.run('omg install ripgrep-git');
    expect(aur.prompt?.kind).toBe('install');
    expect(text(aur)).toContain('Bubblewrap');
    if (aur.prompt?.kind !== 'install') throw new Error('Expected AUR install prompt');
    expect(text(session.confirm(aur.prompt, true))).toContain('Bubblewrap sandbox build');

    expect(text(session.run('omg use rust 1.86'))).toContain('Now using Rust 1.86.0');
    expect(text(session.run('rustc --version'))).toContain('rustc 1.86.0');
    expect(text(session.run('omg list'))).toContain('*1.86.0');
    expect(text(session.run('omg which rust'))).toBe('1.86.0');
    expect(text(session.run('omg doctor --network'))).toContain('System is healthy');
    expect(text(session.run('omg status'))).toContain('packages installed');
    expect(text(session.run('omg run test'))).toContain('23 passed');
    expect(text(session.run('omg audit'))).toContain('Bubblewrap');
    expect(text(session.run('cat omg.lock'))).toContain('distro = "arch"');
  });
});
