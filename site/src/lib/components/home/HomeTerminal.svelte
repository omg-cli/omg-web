<script lang="ts">
  const examples = [
    'omg install ripgrep',
    'omg install ripgrep-all',
    'omg search ripgrep',
    'omg search ripgrep --no-aur',
    'omg search ripgrep-all',
    'omg use node 20',
    'omg use node 22',
    'omg info ripgrep',
    'omg info ripgrep-all',
    'omg env check',
    'omg env capture',
    'node --version',
    'omg --help',
    'clear',
  ];
</script>

<svelte:head>
  <script type="module" async src="/terminal/prompt.js"></script>
  <link rel="modulepreload" href="/terminal/session.js" />
</svelte:head>

<section class="command-workbench" aria-labelledby="terminal-title">
  <header>
    <h2 id="terminal-title">Try OMG</h2>
    <span><span>Simulated Arch Linux</span> · v0.1.224</span>
  </header>
  <omg-terminal>
    <div class="screen">
      <p class="location">demo@arch <span>~/project</span></p>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access to scrollback) -->
      <div class="transcript" role="log" aria-label="Terminal output" tabindex="0"></div>
      <form method="dialog" autocomplete="off">
        <label for="terminal-command"
          ><span aria-hidden="true">$</span><span class="sr-only">Terminal command</span></label
        >
        <input
          id="terminal-command"
          spellcheck="false"
          autocapitalize="none"
          enterkeyhint="go"
          maxlength="160"
          placeholder="omg install ripgrep"
        />
        <button type="submit" aria-label="Run command">Enter ↵</button>
      </form>
      <p class="fallback">
        <code>$ omg search ripgrep</code><br /><a href="/docs/cli/">Read the command reference</a>
      </p>
    </div>
    <div class="suggestions">
      <span>Type a command and press Enter.</span>
      <details>
        <summary>Commands</summary>
        <div class="command-list">
          {#each examples as command (command)}
            <button type="button" data-command={command}>{command}</button>
          {/each}
        </div>
      </details>
    </div>
  </omg-terminal>
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
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    padding-inline: clamp(0.875rem, 3vw, 1.75rem);
  }
  header {
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
  header span,
  .suggestions {
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  omg-terminal {
    display: block;
  }
  .screen {
    padding: clamp(1rem, 3vw, 1.75rem);
  }
  .location,
  .transcript,
  label,
  input,
  .command-list button {
    font-family: var(--font-mono);
  }
  .location {
    margin: 0 0 0.75rem;
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  .location span {
    color: var(--terminal-ink);
  }
  .transcript {
    max-height: clamp(12rem, 38dvh, 26rem);
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-color: #666 var(--terminal-bg);
    font-size: clamp(0.8125rem, 1.2vw, 0.9375rem);
    line-height: 1.6;
  }
  .transcript:empty {
    display: none;
  }
  .transcript:not(:empty) {
    margin-bottom: 0.85rem;
  }
  .transcript :global(pre),
  .transcript :global(p) {
    margin: 0;
    font: inherit;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .transcript :global(.entry + .entry) {
    margin-top: 0.75rem;
  }
  .transcript :global(.echo),
  label {
    color: var(--terminal-accent);
  }
  .transcript :global([role='option']) {
    display: block;
    width: 100%;
    min-height: 2rem;
    border: 0;
    padding: 0.2rem 0.75rem;
    text-align: left;
    background: transparent;
    color: inherit;
    font: inherit;
    overflow-wrap: anywhere;
  }
  .transcript :global([aria-selected='true']) {
    color: var(--ansi-blue);
    font-weight: 700;
  }
  form {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0 0.25rem 0 0.75rem;
    border: 1px solid #777;
    border-radius: 5px;
  }
  form:global([hidden]) {
    display: none;
  }
  .transcript :global([data-cancel]) {
    padding: 0.4rem 0.75rem;
    min-height: 2.75rem;
    background: transparent;
    color: var(--terminal-muted);
    font: inherit;
    border: 0;
    cursor: pointer;
  }
  form:focus-within {
    border-color: var(--terminal-accent);
  }
  input {
    min-width: 0;
    width: 100%;
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
  button,
  summary {
    cursor: pointer;
  }
  form button {
    min-height: 2.75rem;
    padding: 0 0.75rem;
    color: var(--terminal-ink);
    font: inherit;
    font-size: 0.8125rem;
    border: 0;
    background: transparent;
  }
  .suggestions {
    border-top: 1px solid var(--terminal-rule);
  }
  .suggestions details[open] {
    flex-basis: 100%;
  }
  summary {
    min-height: 2.75rem;
    padding-block: 0.75rem;
    color: var(--terminal-ink);
  }
  .command-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1rem;
  }
  .command-list button {
    min-height: 2.75rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--terminal-ink);
    font-size: 0.8125rem;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  .command-workbench :global(:focus-visible) {
    outline: 2px solid var(--terminal-accent);
    outline-offset: -2px;
  }
  .fallback {
    margin: 0;
  }
  omg-terminal:defined .fallback,
  omg-terminal:not(:defined) form,
  omg-terminal:not(:defined) .suggestions {
    display: none;
  }
</style>
