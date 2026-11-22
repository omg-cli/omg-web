const INITIAL_COMPLETIONS = [
  'omg install ripgrep',
  'omg install fd',
  'omg install bat',
  'omg install ripgrep-git',
  'omg search ripgrep',
  'omg search ripgrep --no-aur',
  'omg use node 22',
  'omg use node 20',
  'omg use python 3.13',
  'omg use rust 1.86',
  'omg env check',
  'omg env capture',
  'omg doctor',
  'omg status',
  'omg run test',
  'omg list',
  'omg audit',
  'omg --help',
  'cat omg.lock',
  'node --version',
  'clear',
  'reset',
];

function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function buildRunSpans(runs) {
  return runs.map(run => {
    const span = document.createElement('span');
    span.textContent = run.text;
    if (run.style) span.style.cssText = run.style;
    return span;
  });
}

class OmgTerminal extends HTMLElement {
  #history = [];
  #position = 0;
  #draft = '';
  #session;
  #active;
  #output;
  #selected = 0;
  #pending = Promise.resolve();
  #completions = INITIAL_COMPLETIONS;
  #tabIndex = 0;
  #tabPrefix = '';
  #streamTimer = 0;
  #streamFlush = null;
  #runs;

  get input() {
    return this.querySelector('input');
  }
  get log() {
    return this.querySelector('[role=log]');
  }
  get ghost() {
    return this.querySelector('.ghost');
  }
  get confirmBar() {
    return this.querySelector('.confirm-actions');
  }
  get workbench() {
    return this.closest('.command-workbench') ?? this;
  }

  constructor() {
    super();
    this.addEventListener('input', () => {
      this.input.setCustomValidity('');
      this.#tabPrefix = '';
      this.#tabIndex = 0;
      this.#updateGhost();
    });
    this.addEventListener('submit', event => {
      event.preventDefault();
      const value = this.input.value.trim();
      this.input.value = '';
      this.#updateGhost();
      this.input.focus({ preventScroll: true });
      this.#enqueue(value);
    });
    this.addEventListener('keydown', event => this.#key(event));
    this.addEventListener('click', event => this.#click(event));
  }

  connectedCallback() {
    this.workbench.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const runBtn = target.closest('button[data-run]');
      if (runBtn && !this.#active) {
        const command = runBtn.getAttribute('data-run') ?? '';
        if (command) {
          this.input.value = '';
          this.#updateGhost();
          this.input.focus({ preventScroll: true });
          this.#enqueue(command);
        }
        return;
      }
      if (target.closest('button[data-reset]')) {
        this.#resetSession();
      }
    });
  }

  #enqueue(value) {
    this.#flushStream();
    // Preserve Enter presses made while the first command's module is loading.
    this.#pending = this.#pending
      .then(() => this.#submit(value))
      .catch(() => {
        this.#line('Could not load the terminal. Check your connection and try again.');
      });
  }

  #click(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('button');
    if (button) {
      if (button.dataset.command && !this.#active) {
        this.input.value = button.dataset.command;
        const details = button.closest('details');
        if (details) details.open = false;
        this.#updateGhost();
        this.input.focus();
      } else if (button.dataset.confirm && this.#active?.kind === 'install') {
        this.#flushStream();
        this.input.value = '';
        this.#updateGhost();
        this.#show(this.#session.confirm(this.#active, button.dataset.confirm === 'y'));
      } else if (button.hasAttribute('data-option')) {
        this.#choose(Number(button.dataset.option));
      } else if (button.hasAttribute('data-cancel')) {
        this.#choose(null);
      }
      return;
    }
    if (
      !this.#active &&
      target.closest('.screen') &&
      !target.closest('a, summary, details, input, [role=listbox]') &&
      !window.getSelection()?.toString()
    ) {
      this.input.focus({ preventScroll: true });
    }
  }

  #line(text) {
    const line = document.createElement('p');
    line.textContent = text;
    this.log.append(line);
    this.log.scrollTop = this.log.scrollHeight;
  }

  #flushStream() {
    if (this.#streamTimer) {
      window.clearTimeout(this.#streamTimer);
      this.#streamTimer = 0;
    }
    if (this.#streamFlush) {
      const flush = this.#streamFlush;
      this.#streamFlush = null;
      flush();
    }
  }

  #resetSession() {
    this.#flushStream();
    this.#active = undefined;
    this.#session = undefined;
    this.#history = [];
    this.#position = 0;
    this.#draft = '';
    this.input.value = '';
    this.input.form.hidden = false;
    this.input.placeholder = 'omg install ripgrep';
    this.input.setAttribute('aria-label', 'Terminal command');
    if (this.confirmBar) this.confirmBar.hidden = true;
    for (const button of this.workbench.querySelectorAll('[data-command], [data-run]')) {
      button.disabled = false;
    }
    this.log.replaceChildren();
    const note = document.createElement('p');
    note.className = 'reset-note';
    note.textContent =
      'Session reset to clean Arch Linux environment (node 20.20.2, omg.lock in sync).';
    this.log.append(note);
    this.#updateStatus({ node: '20.20.2', inSync: true, dirty: false });
    this.#updateGhost();
    this.input.focus({ preventScroll: true });
  }

  async #submit(value) {
    if (this.#active?.kind === 'install') {
      if (!/^(?:y(?:es)?|n(?:o)?)?$/i.test(value)) {
        this.input.value = value;
        this.input.setCustomValidity('Enter y or n.');
        this.input.reportValidity();
        return;
      }
      this.#show(this.#session.confirm(this.#active, /^y/i.test(value)));
      return;
    }
    if (!value || this.#active) return;
    if (value === 'reset') {
      this.#resetSession();
      return;
    }
    this.#history.push(value);
    if (this.#history.length > 50) this.#history.shift();
    this.#position = this.#history.length;
    if (value === 'clear') {
      this.log.replaceChildren();
      return;
    }
    const entry = document.createElement('div');
    entry.className = 'entry';
    const echo = document.createElement('p');
    echo.className = 'echo';
    echo.textContent = '$ ' + value;
    this.#output = document.createElement('pre');
    entry.append(echo, this.#output);
    this.log.append(entry);
    while (this.log.childElementCount > 50) this.log.firstElementChild.remove();
    const engine = await import('./session.js');
    this.#session ??= new engine.TerminalSession();
    this.#runs = engine.terminalRuns;
    if (Array.isArray(engine.COMPLETE_COMMANDS)) this.#completions = engine.COMPLETE_COMMANDS;
    this.#show(this.#session.run(value));
  }

  #show(result) {
    this.#flushStream();
    this.#active = result.prompt;
    const outputEl = this.#output;
    const shouldStream =
      result.stream === true &&
      !result.prompt &&
      !prefersReducedMotion() &&
      result.text.includes('\n');

    if (shouldStream) {
      const lines = result.text.split('\n');
      let shown = 0;
      const renderSlice = count => {
        const partial = lines.slice(0, count).join('\n');
        outputEl.replaceChildren(...buildRunSpans(this.#runs(partial)));
        this.log.scrollTop = this.log.scrollHeight;
      };
      this.#streamFlush = () => renderSlice(lines.length);
      const step = () => {
        shown = Math.min(lines.length, shown + 1);
        renderSlice(shown);
        if (shown < lines.length) {
          this.#streamTimer = window.setTimeout(step, 16);
        } else {
          this.#streamTimer = 0;
          this.#streamFlush = null;
        }
      };
      step();
    } else {
      outputEl.replaceChildren(...buildRunSpans(this.#runs(result.text)));
    }

    const search = this.#active?.kind === 'search';
    const confirm = this.#active?.kind === 'install';
    this.input.form.hidden = search;
    if (this.confirmBar) this.confirmBar.hidden = !confirm;
    this.input.placeholder = confirm ? 'y or n (default: n)' : 'omg install ripgrep';
    this.input.setAttribute('aria-label', confirm ? 'Installation response' : 'Terminal command');
    for (const button of this.workbench.querySelectorAll('[data-command], [data-run]')) {
      button.disabled = Boolean(this.#active);
    }
    if (this.#session?.stateSummary) this.#updateStatus(this.#session.stateSummary());
    this.#updateGhost();
    if (search) this.#picker(this.#active.search.choices);
    else {
      this.log.scrollTop = this.log.scrollHeight;
      this.input.focus({ preventScroll: true });
    }
  }

  #updateStatus(state) {
    const nodeEl = this.workbench.querySelector('[data-status-node]');
    if (nodeEl) nodeEl.textContent = `node ${state.node}`;
    const lockEl = this.workbench.querySelector('[data-status-lock]');
    if (lockEl) {
      lockEl.textContent = state.inSync ? 'omg.lock synced' : 'omg.lock drift';
      lockEl.classList.toggle('is-drift', !state.inSync);
    }
    const resetBtn = this.workbench.querySelector('[data-reset]');
    if (resetBtn) resetBtn.hidden = !state.dirty;
  }

  #bestCompletion(prefix) {
    if (!prefix || this.#active) return '';
    const lower = prefix.toLowerCase();
    return (
      this.#completions.find(
        cmd => cmd.toLowerCase().startsWith(lower) && cmd.length > prefix.length
      ) ?? ''
    );
  }

  #updateGhost() {
    const ghost = this.ghost;
    if (!ghost) return;
    const value = this.input.value;
    const match = this.#bestCompletion(value);
    if (!match) {
      ghost.textContent = '';
      return;
    }
    // Preserve exact typed characters as invisible prefix so suffix aligns pixel-perfectly.
    const typed = document.createElement('span');
    typed.className = 'ghost-typed';
    typed.textContent = value;
    const rest = document.createElement('span');
    rest.className = 'ghost-rest';
    rest.textContent = match.slice(value.length);
    ghost.replaceChildren(typed, rest);
  }

  #picker(choices) {
    this.#selected = 0;
    const picker = document.createElement('div');
    picker.setAttribute('role', 'listbox');
    picker.setAttribute('aria-label', 'Select a package for details');
    picker.tabIndex = 0;
    for (const [index, label] of choices.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.tabIndex = -1;
      button.id = 'terminal-option-' + index;
      button.dataset.option = String(index);
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(index === 0));
      button.textContent = label;
      picker.append(button);
    }
    const back = document.createElement('button');
    back.type = 'button';
    back.dataset.cancel = '';
    back.textContent = 'Back to prompt (Esc)';
    this.log.append(picker, back);
    picker.setAttribute('aria-activedescendant', picker.firstElementChild.id);
    picker.focus({ preventScroll: true });
    this.#reveal(picker.firstElementChild);
  }

  #reveal(option) {
    const bounds = option.getBoundingClientRect();
    const log = this.log.getBoundingClientRect();
    if (bounds.bottom > log.bottom) this.log.scrollTop += bounds.bottom - log.bottom;
    if (bounds.top < log.top) this.log.scrollTop += bounds.top - log.top;
  }

  #choose(index) {
    if (this.#active?.kind !== 'search') return;
    this.log.querySelector('[role=listbox]')?.remove();
    this.log.querySelector('[data-cancel]')?.remove();
    this.#show(this.#session.select(this.#active.search, index));
  }

  #key(event) {
    if (event.isComposing) return;
    if (event.ctrlKey && !event.metaKey && !event.altKey) {
      if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        this.#flushStream();
        if (!this.#active) this.log.replaceChildren();
        return;
      }
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        this.#flushStream();
        if (this.#active?.kind === 'search') {
          this.#choose(null);
          return;
        }
        if (this.#active?.kind === 'install') {
          this.input.value = '';
          this.#show(this.#session.confirm(this.#active, false));
          return;
        }
        if (this.input.value) {
          this.#line(`$ ${this.input.value}^C`);
          this.input.value = '';
          this.#updateGhost();
        }
        return;
      }
    }

    if (this.#active?.kind === 'search' && event.target.closest('[role=listbox]')) {
      const picker = this.log.querySelector('[role=listbox]');
      const count = picker.children.length;
      switch (event.key) {
        case 'ArrowDown':
          this.#selected = (this.#selected + 1) % count;
          break;
        case 'ArrowUp':
          this.#selected = (this.#selected + count - 1) % count;
          break;
        case 'Home':
          this.#selected = 0;
          break;
        case 'End':
          this.#selected = count - 1;
          break;
        case 'Escape':
          event.preventDefault();
          this.#choose(null);
          return;
        case 'Enter':
        case ' ':
          event.preventDefault();
          this.#choose(this.#selected);
          return;
        default:
          return;
      }
      event.preventDefault();
      const option = picker.children[this.#selected];
      for (const item of picker.children)
        item.setAttribute('aria-selected', String(item === option));
      picker.setAttribute('aria-activedescendant', option.id);
      this.#reveal(option);
      return;
    }

    if (event.target !== this.input) return;
    this.input.setCustomValidity('');

    if (this.#active?.kind === 'install' && event.key === 'Escape') {
      event.preventDefault();
      this.input.value = '';
      this.#show(this.#session.confirm(this.#active, false));
      return;
    }

    if (!this.#active && event.key === 'Tab') {
      const base = this.#tabPrefix || this.input.value;
      const lower = base.toLowerCase();
      const matches = this.#completions.filter(cmd => cmd.toLowerCase().startsWith(lower));
      if (matches.length > 0) {
        event.preventDefault();
        if (!this.#tabPrefix) {
          this.#tabPrefix = base;
          this.#tabIndex = 0;
        }
        this.input.value = matches[this.#tabIndex % matches.length] ?? base;
        this.#tabIndex = (this.#tabIndex + 1) % matches.length;
        this.#updateGhost();
        return;
      }
    }

    if (
      !this.#active &&
      event.key === 'ArrowRight' &&
      this.input.selectionStart === this.input.value.length &&
      this.input.selectionEnd === this.input.value.length
    ) {
      const match = this.#bestCompletion(this.input.value);
      if (match) {
        event.preventDefault();
        this.input.value = match;
        this.#updateGhost();
        return;
      }
    }

    if (this.#active || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (this.#position === this.#history.length) this.#draft = this.input.value;
    this.#position = Math.max(
      0,
      Math.min(this.#history.length, this.#position + (event.key === 'ArrowUp' ? -1 : 1))
    );
    this.input.value = this.#history[this.#position] ?? this.#draft;
    this.#updateGhost();
  }
}
if (!customElements.get('omg-terminal')) customElements.define('omg-terminal', OmgTerminal);
