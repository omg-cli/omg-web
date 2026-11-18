<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { TerminalSession } from './terminal-session';

  const session = new TerminalSession();
  const firstCommand = 'omg search ripgrep';
  const suggestions = ['omg env check', 'omg use node 22', 'omg env capture', 'help'];
  const history = [firstCommand];
  const historyLimit = 50;
  let position = history.length;
  let draft = '';
  let entries = $state.raw([{ command: firstCommand, output: session.run(firstCommand) }]);
  let command = $state('omg install ripgrep');
  let ready = $state(false);
  let log: HTMLDivElement;
  let input = $state<HTMLInputElement>();

  onMount(() => {
    ready = true;
  });

  async function run(value: string): Promise<void> {
    const submitted = value.trim();
    if (!submitted) return;
    if (submitted === 'clear') entries = [];
    else
      entries = [
        ...entries.slice(1 - historyLimit),
        { command: submitted, output: session.run(submitted) },
      ];
    history.push(submitted);
    if (history.length > historyLimit) history.shift();
    position = history.length;
    await tick();
    log.scrollTop = log.scrollHeight;
  }

  function submit(event: SubmitEvent): void {
    event.preventDefault();
    void run(command);
    command = '';
    input?.focus({ preventScroll: true });
  }

  function recall(event: KeyboardEvent): void {
    if (event.isComposing || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (position === history.length) draft = command;
    position = Math.max(0, Math.min(history.length, position + (event.key === 'ArrowUp' ? -1 : 1)));
    command = history[position] ?? draft;
  }
</script>

<section class="command-workbench" aria-labelledby="terminal-title">
  <header>
    <h2 id="terminal-title">Try OMG<span aria-hidden="true">/</span></h2>
    <span class="system">Simulated Arch Linux</span>
  </header>
  <div class="screen">
    <p class="location">dev@arch <span>~/project</span></p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access to scrollback) -->
    <div class="transcript" bind:this={log} role="log" aria-label="Terminal output" tabindex="0">
      {#each entries as entry (entry)}
        <div class="entry">
          <p class="echo"><span aria-hidden="true">$</span> {entry.command}</p>
          <pre>{entry.output}</pre>
        </div>
      {/each}
    </div>
    <div class="prompt-area">
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
        />
        <button type="submit">Run</button>
      </form>
      {#if !ready}
        <p class="fallback"><a href="/docs/cli/">Read the command reference</a></p>
      {/if}
    </div>
  </div>
  <div
    class="suggestions"
    class:pending={!ready}
    inert={!ready}
    role="group"
    aria-label="Run a suggested command"
  >
    <span>Try</span>
    {#each suggestions as suggestion (suggestion)}
      <button type="button" onclick={() => run(suggestion)}>{suggestion}</button>
    {/each}
  </div>
</section>

<style>
  .command-workbench {
    --terminal-bg: #171717;
    --terminal-ink: #ededed;
    --terminal-muted: #ababab;
    --terminal-rule: #383838;
    --terminal-accent: #ff936e;
    min-width: 0;
    border: 1px solid var(--rule-strong);
    border-radius: 12px;
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
  h2 span,
  .echo span,
  label {
    color: var(--terminal-accent);
  }
  .system,
  .suggestions > span {
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
    height: 8rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-color: #666666 var(--terminal-bg);
    font-size: clamp(0.8125rem, 1.2vw, 0.9375rem);
    line-height: 1.6;
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
