<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import {
    TerminalSession,
    terminalRuns,
    type TerminalOutput,
    type TerminalPrompt,
  } from './terminal-session';

  const session = new TerminalSession();
  const firstCommand = 'omg search ripgrep --no-aur';
  const initial = session.run(firstCommand);
  const firstResult =
    initial.prompt?.kind === 'search' ? session.select(initial.prompt.search, null) : initial;
  const suggestions = [
    'omg install ripgrep',
    'omg install ripgrep-all',
    'omg search ripgrep',
    'omg search ripgrep --no-aur',
    'omg search ripgrep-all',
    'omg use node 20',
    'node --version',
    'omg --help',
    'clear',
  ];
  const history = [firstCommand];
  const limit = 50;
  let position = history.length;
  let draft = '';
  let entries = $state.raw([{ command: firstCommand, text: firstResult.text }]);
  let command = $state('omg install ripgrep');
  let active = $state.raw<TerminalPrompt>();
  let selected = $state(0);
  let ready = $state(false);
  let busy = $state(false);
  let expanded = $state(false);
  let log: HTMLDivElement;
  let input = $state<HTMLInputElement>();
  let noButton = $state<HTMLButtonElement>();
  let picker = $state<HTMLDivElement>();
  let timer: ReturnType<typeof setTimeout>;

  onMount(() => {
    ready = true;
  });
  onDestroy(() => clearTimeout(timer));

  async function reveal() {
    await tick();
    if (!log) return;
    if (active?.kind === 'search') {
      const option = log.querySelector('[aria-selected="true"]');
      if (option) {
        const bounds = option.getBoundingClientRect();
        const viewport = log.getBoundingClientRect();
        if (bounds.bottom > viewport.bottom) log.scrollTop += bounds.bottom - viewport.bottom;
        else if (bounds.top < viewport.top) log.scrollTop += bounds.top - viewport.top;
      }
    } else log.scrollTop = log.scrollHeight;
  }

  function replaceOutput(text: string) {
    const last = entries.at(-1);
    if (last) entries = [...entries.slice(0, -1), { command: last.command, text }];
  }

  function show(result: TerminalOutput) {
    clearTimeout(timer);
    active = result.prompt;
    selected = 0;
    const frames = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? []
      : (result.frames ?? []);
    busy = frames.length > 0;
    function next(index: number) {
      const frame = frames[index];
      replaceOutput(frame?.text ?? result.text);
      void reveal();
      if (frame) timer = setTimeout(() => next(index + 1), frame.duration);
      else busy = false;
    }
    next(0);
    void tick().then(() => {
      if (active?.kind === 'install') noButton?.focus({ preventScroll: true });
      if (active?.kind === 'search') picker?.focus({ preventScroll: true });
    });
  }

  function run(value: string) {
    const submitted = value.trim();
    if (!submitted || active || busy) return;
    expanded = true;
    history.push(submitted);
    if (history.length > limit) history.shift();
    position = history.length;
    if (submitted === 'clear') {
      entries = [];
      return;
    }
    entries = [...entries.slice(1 - limit), { command: submitted, text: '' }];
    show(session.run(submitted));
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (active || busy) return;
    run(command);
    command = '';
    input?.focus({ preventScroll: true });
  }

  function answer(yes: boolean) {
    if (active?.kind !== 'install') return;
    show(session.confirm(active, yes));
    void tick().then(() => input?.focus({ preventScroll: true }));
  }

  function choose(index: number | null) {
    if (active?.kind !== 'search') return;
    show(session.select(active.search, index));
    void tick().then(() => input?.focus({ preventScroll: true }));
  }

  function confirmKey(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'y' || event.key.toLowerCase() === 'n') {
      event.preventDefault();
      answer(event.key.toLowerCase() === 'y');
    }
  }

  function chooseKey(event: KeyboardEvent) {
    if (active?.kind !== 'search') return;
    const count = active.search.choices.length;
    switch (event.key) {
      case 'ArrowUp':
        selected = (selected + count - 1) % count;
        break;
      case 'ArrowDown':
        selected = (selected + 1) % count;
        break;
      case 'Home':
        selected = 0;
        break;
      case 'End':
        selected = count - 1;
        break;
      case 'Escape':
        choose(null);
        break;
      case 'Enter':
      case ' ':
        choose(selected);
        break;
      default:
        return;
    }
    event.preventDefault();
    void reveal();
  }

  function recall(event: KeyboardEvent) {
    if (busy || event.isComposing || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (position === history.length) draft = command;
    position = Math.max(0, Math.min(history.length, position + (event.key === 'ArrowUp' ? -1 : 1)));
    command = history[position] ?? draft;
  }
</script>

<section class="command-workbench" aria-labelledby="terminal-title">
  <header>
    <h2 id="terminal-title">Try OMG</h2>
    <span class="system"><span>Simulated Arch Linux</span> · v0.1.224</span>
  </header>
  <div class="screen">
    <p class="location">demo@arch <span>~/project</span></p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access to scrollback) -->
    <div
      class="transcript"
      class:expanded
      bind:this={log}
      role="log"
      aria-busy={busy}
      aria-label="Terminal output"
      tabindex="0"
    >
      {#each entries as entry, index (index)}
        <div class="entry">
          <p class="echo"><span aria-hidden="true">$</span> {entry.command}</p>
          <pre>{#each terminalRuns(entry.text) as run, part (part)}<span style={run.style}
                >{run.text}</span
              >{/each}</pre>
        </div>
      {/each}
      {#if active?.kind === 'search'}
        <div
          bind:this={picker}
          class="picker"
          role="listbox"
          aria-label="Select a package for details"
          aria-activedescendant={'terminal-option-' + selected}
          tabindex="0"
          onkeydown={chooseKey}
        >
          {#each active.search.choices as label, index (label)}
            <button
              type="button"
              role="option"
              aria-selected={index === selected}
              id={'terminal-option-' + index}
              tabindex="-1"
              onclick={() => choose(index)}
            >
              <span aria-hidden="true">{index === selected ? '❯' : ' '}</span>
              {label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    <div class="prompt-area">
      {#if active?.kind === 'install'}
        <div class="response-controls" role="group" aria-label="Confirm installation">
          <button type="button" onclick={() => answer(true)} onkeydown={confirmKey}
            >Yes <kbd>Y</kbd></button
          >
          <button
            type="button"
            bind:this={noButton}
            onclick={() => answer(false)}
            onkeydown={confirmKey}>No <kbd>N</kbd></button
          >
        </div>
      {:else if active?.kind === 'search'}
        <div class="response-controls">
          <button type="button" onclick={() => choose(null)}>Back to prompt <kbd>Esc</kbd></button>
        </div>
      {:else}
        <form onsubmit={submit} class:pending={!ready} inert={!ready}>
          <label for="terminal-command"
            ><span aria-hidden="true">$</span><span class="sr-only">Terminal command</span></label
          >
          <input
            id="terminal-command"
            bind:this={input}
            bind:value={command}
            onkeydown={recall}
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            enterkeyhint="go"
            maxlength="160"
            placeholder="Type a command"
            readonly={busy}
          />
          <button type="submit" disabled={busy}>Run</button>
        </form>
      {/if}
      {#if !ready}<p class="fallback"><a href="/docs/cli/">Read the command reference</a></p>{/if}
    </div>
  </div>
  {#if ready}
    <div class="suggestions" role="group" aria-label="Run a suggested command">
      {#each ['omg env check', 'omg use node 22', 'omg env capture'] as suggestion (suggestion)}
        <button type="button" disabled={!!active || busy} onclick={() => run(suggestion)}
          >{suggestion}</button
        >
      {/each}
      <details>
        <summary>Commands</summary>
        <div class="command-list">
          {#each suggestions as suggestion (suggestion)}
            <button type="button" disabled={!!active || busy} onclick={() => run(suggestion)}
              >{suggestion}</button
            >
          {/each}
        </div>
      </details>
    </div>
  {/if}
</section>

<style>
  .command-workbench {
    --ansi-black: #111;
    --ansi-red: #f05b63;
    --ansi-green: #83cf78;
    --ansi-brown: #e5c06b;
    --ansi-blue: #7aa2f7;
    --ansi-magenta: #bf91e8;
    --ansi-cyan: #68c9cf;
    --ansi-white: #efefef;
    --terminal-bg: #171717;
    --terminal-ink: #ededed;
    --terminal-muted: #ababab;
    --terminal-rule: #383838;
    --terminal-accent: #ff936e;
    min-width: 0;
    border: 1px solid var(--rule-strong);
    border-radius: 7px;
    overflow: hidden;
    background: var(--terminal-bg);
    color: var(--terminal-ink);
  }
  header,
  .suggestions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding-inline: clamp(0.875rem, 3vw, 1.75rem);
  }
  header {
    justify-content: space-between;
    gap: 0.5rem 1rem;
    padding-block: 0.875rem;
    border-bottom: 1px solid var(--terminal-rule);
  }
  h2 {
    margin: 0;
    font-size: 1.375rem;
    font-weight: 650;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }
  .echo span,
  label {
    color: var(--terminal-accent);
  }
  .system,
  .suggestions summary {
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  .screen {
    padding: 1rem clamp(0.875rem, 3vw, 1.75rem);
  }
  .prompt-area {
    display: grid;
  }
  .prompt-area > * {
    grid-area: 1 / 1;
  }
  .pending {
    visibility: hidden;
  }
  .fallback {
    align-self: center;
    margin: 0;
  }
  @media (scripting: none) {
    .pending {
      display: none;
    }
  }
  .location,
  .transcript,
  label,
  input,
  .suggestions button {
    font-family: var(--font-mono);
  }
  .location {
    margin: 0 0 0.75rem;
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  .location span {
    margin-left: 0.25rem;
    color: var(--terminal-ink);
  }
  .transcript {
    height: 10rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-color: #666666 var(--terminal-bg);
    font-size: clamp(0.8125rem, 1.2vw, 0.9375rem);
    line-height: 1.6;
  }
  .transcript.expanded {
    height: clamp(16rem, 43dvh, 29rem);
  }
  .response-controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    border-top: 1px solid var(--terminal-rule);
  }
  .response-controls button,
  .picker button {
    border: 0;
    background: transparent;
    color: var(--terminal-ink);
    min-height: 2.75rem;
    font: inherit;
    text-align: left;
  }
  .response-controls button {
    padding-inline: 0.7rem;
    font-size: 0.875rem;
  }
  kbd {
    margin-left: 0.25rem;
    color: var(--terminal-muted);
    font-family: var(--font-mono);
  }
  .picker {
    margin-bottom: 0.25rem;
  }
  .picker button {
    display: block;
    width: 100%;
    min-height: 1.75rem;
    padding: 0 0 0 2ch;
    overflow-wrap: anywhere;
  }
  .picker button[aria-selected='true'] {
    color: #7aa2f7;
    font-weight: 700;
  }
  .picker button span {
    display: inline-block;
    width: 1ch;
  }
  .suggestions details {
    min-width: 0;
  }
  .suggestions details[open] {
    flex-basis: 100%;
  }
  .suggestions summary {
    cursor: pointer;
    padding-block: 0.8rem;
  }
  .command-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.2rem;
  }
  .command-workbench button:disabled {
    opacity: 0.55;
    cursor: default;
  }
  @media (max-width: 35rem) {
    .transcript:not(.expanded) {
      height: 8rem;
    }
  }
  .entry + .entry {
    margin-top: 0.75rem;
  }
  .echo,
  pre {
    margin: 0;
    font: inherit;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  pre {
    color: #d6d6d6;
  }
  form {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.25rem 0.2rem 0.75rem;
    border: 1px solid #777;
    border-radius: 6px;
  }
  form:focus-within {
    border-color: var(--terminal-accent);
  }
  input {
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    border: 0;
    background: transparent;
    color: var(--terminal-ink);
    caret-color: var(--terminal-accent);
    font-size: 1rem;
  }
  input::placeholder {
    color: var(--terminal-muted);
  }
  button {
    cursor: pointer;
  }
  form button {
    padding: 0.5rem 1rem;
    min-height: 2.75rem;
    border: 0;
    border-radius: 4px;
    background: var(--terminal-ink);
    color: var(--terminal-bg);
    font: 600 0.875rem var(--font-body);
  }
  form button:hover {
    background: var(--terminal-accent);
  }
  .suggestions {
    gap: 0 1rem;
    border-top: 1px solid var(--terminal-rule);
  }
  .suggestions button,
  .fallback a {
    color: var(--terminal-ink);
    text-decoration: underline;
    text-decoration-color: var(--terminal-muted);
    text-underline-offset: 0.25em;
  }
  .suggestions button {
    min-height: 2.75rem;
    padding: 0;
    border: 0;
    background: transparent;
    font-size: 0.8125rem;
  }
  .suggestions button:hover,
  .fallback a:hover {
    color: var(--terminal-accent);
  }
  .command-workbench :global(:focus-visible) {
    outline: 2px solid var(--terminal-accent);
    outline-offset: -2px;
  }
</style>
