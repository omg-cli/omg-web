class OmgTerminal extends HTMLElement {
  #history = [];
  #position = 0;
  #draft = '';
  #session;
  #active;
  #output;
  #selected = 0;
  #pending = Promise.resolve();

  get input() {
    return this.querySelector('input');
  }
  get log() {
    return this.querySelector('[role=log]');
  }

  constructor() {
    super();
    this.addEventListener('input', () => this.input.setCustomValidity(''));
    this.addEventListener('submit', event => {
      event.preventDefault();
      const value = this.input.value.trim();
      this.input.value = '';
      this.input.focus({ preventScroll: true });
      // Preserve Enter presses made while the first command's module is loading.
      this.#pending = this.#pending
        .then(() => this.#submit(value))
        .catch(() => {
          this.#line('Could not load the terminal. Check your connection and try again.');
        });
    });
    this.addEventListener('keydown', event => this.#key(event));
    this.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.command && !this.#active) {
        this.input.value = button.dataset.command;
        button.closest('details').open = false;
        this.input.focus();
      } else if (button.hasAttribute('data-option')) {
        this.#choose(Number(button.dataset.option));
      } else if (button.hasAttribute('data-cancel')) this.#choose(null);
    });
  }

  #line(text) {
    const line = document.createElement('p');
    line.textContent = text;
    this.log.append(line);
    this.log.scrollTop = this.log.scrollHeight;
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
    this.#show(this.#session.run(value));
  }

  #runs;
  #show(result) {
    this.#active = result.prompt;
    this.#output.replaceChildren(
      ...this.#runs(result.text).map(run => {
        const span = document.createElement('span');
        span.textContent = run.text;
        if (run.style) span.style.cssText = run.style;
        return span;
      })
    );
    const search = this.#active?.kind === 'search';
    const confirm = this.#active?.kind === 'install';
    this.input.form.hidden = search;
    this.input.placeholder = confirm ? 'y or n (default: n)' : 'omg install ripgrep';
    this.input.setAttribute('aria-label', confirm ? 'Installation response' : 'Terminal command');
    for (const button of this.querySelectorAll('[data-command]')) button.disabled = !!this.#active;
    if (search) this.#picker(this.#active.search.choices);
    else {
      this.log.scrollTop = this.log.scrollHeight;
      this.input.focus({ preventScroll: true });
    }
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
    this.log.querySelector('[role=listbox]').remove();
    this.log.querySelector('[data-cancel]').remove();
    this.#show(this.#session.select(this.#active.search, index));
  }

  #key(event) {
    if (event.isComposing) return;
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
    if (this.#active || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (this.#position === this.#history.length) this.#draft = this.input.value;
    this.#position = Math.max(
      0,
      Math.min(this.#history.length, this.#position + (event.key === 'ArrowUp' ? -1 : 1))
    );
    this.input.value = this.#history[this.#position] ?? this.#draft;
  }
}
if (!customElements.get('omg-terminal')) customElements.define('omg-terminal', OmgTerminal);
