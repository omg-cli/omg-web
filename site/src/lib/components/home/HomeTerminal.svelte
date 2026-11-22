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
      <div class="transcript" role="log" aria-label="Terminal output" tabindex="0">
        <div class="entry seed">
          <p class="echo">$ omg search ripgrep</p>
          <pre><span class="dim">  │ Search</span>
  <b>ripgrep</b> <span class="version">15.2.0-1</span>  <span class="official"
              >&#x2139;&#xFE0E;</span
            > Official
  <b>ripgrep-all</b> <span class="version">0.10.10-3</span>  <span class="official"
              >&#x2139;&#xFE0E;</span
            > Official
  <b>ripgrep-all-git</b> <span class="version">0.10.10.462.g0f10fb9-1</span>  <span class="aur"
              >&#x26A0;&#xFE0E;</span
            > AUR
  <b>ripgrep-git</b> <span class="version">15.1.0.r4.57c190d5-1</span>  <span class="aur"
              >&#x26A0;&#xFE0E;</span
            > AUR
  <b>vim-ripgrep-git</b> <span class="version">r27.ec87af6-2</span>  <span class="aur"
              >&#x26A0;&#xFE0E;</span
            > AUR
  <b>rippedgrep</b> <span class="version">0.1.0-1</span>  <span class="aur">&#x26A0;&#xFE0E;</span
            > AUR
  <b>fuzzy</b> <span class="version">0.0.2-2</span>  <span class="aur">&#x26A0;&#xFE0E;</span> AUR
  <b>neovim-cmp-rg</b> <span class="version">1.3.8-1</span>  <span class="aur"
              >&#x26A0;&#xFE0E;</span
            > AUR
  <b>repgrep</b> <span class="version">0.17.1-1</span>  <span class="official"
              >&#x2139;&#xFE0E;</span
            > Official
<span class="dim">  (+15 more packages...)</span></pre>
        </div>
      </div>
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
      <p class="fallback"><a href="/docs/cli/">Read the command reference</a></p>
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
    display: flex;
    flex-direction: column;
    height: 34rem;
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
    flex-shrink: 0;
    padding-block: 0.875rem;
    border-bottom: 1px solid var(--terminal-rule);
  }
  h2 {
    scroll-margin-block-start: 5rem;
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.6;
  }
  h2::before {
    content: '';
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-right: 0.6rem;
    border-radius: 50%;
    background: var(--terminal-accent);
    vertical-align: 0.05em;
  }
  header span,
  .suggestions {
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  header > span {
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .transcript :global(.seed b) {
    color: var(--ansi-white);
  }
  .transcript :global(.seed .version) {
    color: var(--ansi-green);
  }
  .transcript :global(.seed .official) {
    color: var(--ansi-blue);
    font-weight: 700;
  }
  .transcript :global(.seed .aur) {
    color: var(--ansi-brown);
    font-weight: 700;
  }
  .transcript :global(.seed .dim) {
    opacity: 0.75;
  }
  omg-terminal {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
  .screen {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
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
    flex-shrink: 0;
    margin: 0 0 0.75rem;
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  .location span {
    color: var(--terminal-ink);
  }
  .transcript {
    flex: 1;
    min-height: 0;
    margin-bottom: 0.85rem;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-color: #666 var(--terminal-bg);
    font-size: clamp(0.8125rem, 1.2vw, 0.9375rem);
    line-height: 1.6;
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
    flex-shrink: 0;
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
    position: relative;
    flex-shrink: 0;
    border-top: 1px solid var(--terminal-rule);
  }
  summary {
    min-height: 2.75rem;
    padding-block: 0.75rem;
    color: var(--terminal-ink);
  }
  .command-list {
    position: absolute;
    right: 0;
    bottom: 100%;
    left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0 1rem;
    max-height: 18rem;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.75rem clamp(0.875rem, 3vw, 1.75rem);
    border: 1px solid var(--terminal-rule);
    background: var(--terminal-bg);
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
    font-size: 0.8125rem;
  }
  .fallback a {
    color: var(--terminal-ink);
  }
  omg-terminal:defined .fallback,
  omg-terminal:not(:defined) form {
    display: none;
  }
  omg-terminal:not(:defined) .suggestions {
    visibility: hidden;
  }
  @media (max-width: 40rem) {
    .command-workbench {
      height: clamp(19rem, calc(100dvh - 14.5rem), 32rem);
    }
  }
</style>
