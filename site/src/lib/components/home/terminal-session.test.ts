import { describe, expect, it } from 'vitest';
import { TerminalSession } from './terminal-session';

describe('homepage terminal', () => {
  it('compares package and runtime changes against the last capture in this session', () => {
    const session = new TerminalSession();
    expect(session.run('omg search ripgrep --no-aur')).toBe(
      'ripgrep 15.2.0-1  Official\nripgrep-all 0.10.10-3  Official'
    );
    expect(session.run('omg install ripgrep')).toBe('Installed ripgrep 15.2.0-1');
    expect(session.run('omg install ripgrep')).toBe('ripgrep is already installed.');
    expect(session.run('omg env check')).toBe(
      'Environment drift detected\n  + ripgrep (extra package)'
    );
    expect(session.run('omg env capture')).toBe('Environment state saved to omg.lock');
    expect(session.run('omg use node 22')).toBe('Now using Node.js 22.0.0');
    expect(session.run('node -v')).toBe('v22.0.0');
    expect(session.run('omg env check')).toBe(
      'Environment drift detected\n  ~ node (expected: 20.0.0, actual: 22.0.0)'
    );
    expect(session.run('omg use node 20.0.0')).toBe('Now using Node.js 20.0.0');
    expect(session.run('omg env check')).toContain('no drift detected');
    expect(new TerminalSession().run('omg install ripgrep')).toBe('Installed ripgrep 15.2.0-1');
  });

  it('rejects unsupported operations without changing the machine', () => {
    const session = new TerminalSession();
    expect(session.run('omg install missing')).toContain('Package missing');
    expect(session.run('omg use node 21')).toContain('Available Node.js versions');
    expect(session.run('omg install ripgrep && anything')).toContain('Unknown demo command');
    expect(session.run('  omg   env check  ')).toContain('no drift detected');
  });
});
