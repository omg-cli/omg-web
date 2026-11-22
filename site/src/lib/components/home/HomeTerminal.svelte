<script lang="ts">
  const quickRuns = [
    { label: 'Install ripgrep', command: 'omg install ripgrep' },
    { label: 'Node 22', command: 'omg use node 22' },
    { label: 'Check drift', command: 'omg env check' },
    { label: 'Doctor', command: 'omg doctor' },
    { label: 'Run tests', command: 'omg run test' },
    { label: 'omg.lock', command: 'cat omg.lock' },
  ] as const;

  const commandGroups = [
    {
      label: 'Packages',
      commands: [
        'omg install ripgrep',
        'omg install fd',
        'omg install ripgrep-git',
        'omg install --dry-run ripgrep',
        'omg remove ripgrep',
        'omg search ripgrep',
        'omg search ripgrep --no-aur',
        'omg search fd',
        'omg info ripgrep',
      ],
    },
    {
      label: 'Runtimes',
      commands: [
        'omg use node 22',
        'omg use node 20',
        'omg use python 3.13',
        'omg use rust 1.86',
        'omg use go 1.24',
        'omg list',
        'omg list node --available',
        'omg which node',
        'node --version',
      ],
    },
    {
      label: 'Environments & Tasks',
      commands: [
        'omg env check',
        'omg env capture',
        'omg doctor',
        'omg status',
        'omg run',
        'omg run test',
        'omg audit',
        'cat omg.lock',
      ],
    },
    {
      label: 'Shell',
      commands: ['ls -la', 'rg --version', 'omg --help', 'clear', 'reset'],
    },
  ] as const;
</script>

<svelte:head>
  <script type="module" async src="/terminal/prompt.js"></script>
  <link rel="modulepreload" href="/terminal/session.js" />
</svelte:head>

<section class="command-workbench" aria-labelledby="terminal-title">
  <header>
    <div class="title-group">
      <h2 id="terminal-title">Try OMG</h2>
      <div class="live-status" aria-live="polite">
        <span class="pill" data-status-node>node 20.20.2</span>
        <span class="pill lock-pill" data-status-lock>omg.lock synced</span>
      </div>
    </div>
    <div class="header-meta">
      <button type="button" class="reset-btn" data-reset hidden>Reset</button>
      <span class="env-label"><span>Simulated Arch Linux</span> · v0.1.224</span>
    </div>
  </header>
  <div class="quick-bar" aria-label="Quick example commands">
    <span class="quick-label">Try:</span>
    {#each quickRuns as item (item.command)}
      <button type="button" class="quick-btn" data-run={item.command} title={`Run: ${item.command}`}
        >{item.label}</button
      >
    {/each}
  </div>
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
        <div class="prompt-field">
          <span class="ghost" aria-hidden="true"></span>
          <input
            id="terminal-command"
            spellcheck="false"
            autocapitalize="none"
            enterkeyhint="go"
            maxlength="160"
            placeholder="omg install ripgrep"
          />
        </div>
        <span class="confirm-actions" hidden>
          <button type="button" class="confirm-yes" data-confirm="y">Yes (y)</button>
          <button type="button" class="confirm-no" data-confirm="n">No (n)</button>
        </span>
        <button type="submit" aria-label="Run command">Enter ↵</button>
      </form>
      <p class="fallback"><a href="/docs/cli/">Read the command reference</a></p>
    </div>
    <div class="suggestions">
      <span class="hint">Tab to complete · ↑↓ history · Ctrl+L clear</span>
      <details>
        <summary>Commands</summary>
        <div class="command-list">
          {#each commandGroups as group (group.label)}
            <div class="command-group">
              <p class="group-title">{group.label}</p>
              <div class="group-items">
                {#each group.commands as command (command)}
                  <button type="button" data-command={command}>{command}</button>
                {/each}
              </div>
            </div>
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
    --terminal-surface: #222222;
    --terminal-ink: #ededed;
    --terminal-muted: #ababab;
    --terminal-rule: #333333;
    --terminal-accent: #ff936e;
    display: flex;
    flex-direction: column;
    height: 35rem;
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
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem 0.75rem;
    padding-inline: clamp(0.875rem, 2.5vw, 1.5rem);
  }
  header {
    flex-shrink: 0;
    padding-block: 0.7rem;
    border-bottom: 1px solid var(--terminal-rule);
  }
  .title-group,
  .header-meta,
  .live-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem 0.75rem;
  }
  h2 {
    scroll-margin-block-start: 5rem;
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.5;
  }
  h2::before {
    content: '';
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-right: 0.5rem;
    border-radius: 50%;
    background: var(--terminal-accent);
    vertical-align: 0.05em;
  }
  .pill {
    padding: 0.15rem 0.45rem;
    border: 1px solid var(--terminal-rule);
    border-radius: 4px;
    background: var(--terminal-surface);
    color: var(--terminal-muted);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    line-height: 1.4;
    white-space: nowrap;
  }
  .lock-pill {
    color: var(--ansi-green);
  }
  .lock-pill:global(.is-drift) {
    border-color: var(--terminal-accent);
    color: var(--terminal-accent);
  }
  .reset-btn {
    padding: 0.2rem 0.5rem;
    border: 1px solid var(--terminal-rule);
    border-radius: 4px;
    background: transparent;
    color: var(--terminal-muted);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    cursor: pointer;
  }
  .reset-btn:hover {
    border-color: var(--terminal-accent);
    color: var(--terminal-ink);
  }
  .reset-btn[hidden] {
    display: none;
  }
  .env-label {
    color: var(--terminal-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .quick-bar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem clamp(0.875rem, 2.5vw, 1.5rem);
    border-bottom: 1px solid var(--terminal-rule);
    background: #141414;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .quick-bar::-webkit-scrollbar {
    display: none;
  }
  .quick-label {
    color: var(--terminal-muted);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    flex-shrink: 0;
  }
  .quick-btn {
    flex-shrink: 0;
    padding: 0.25rem 0.55rem;
    border: 1px solid var(--terminal-rule);
    border-radius: 4px;
    background: var(--terminal-surface);
    color: var(--terminal-ink);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.4;
    cursor: pointer;
    white-space: nowrap;
  }
  .quick-btn:hover:not(:disabled) {
    border-color: var(--terminal-accent);
    color: var(--terminal-accent);
  }
  .quick-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .suggestions {
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  .hint {
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
  .transcript :global(.seed .dim),
  .transcript :global(.reset-note) {
    color: var(--terminal-muted);
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
    padding: clamp(0.85rem, 2.5vw, 1.35rem) clamp(0.875rem, 2.5vw, 1.5rem);
  }
  .location,
  .transcript,
  label,
  input,
  .ghost,
  .command-list button {
    font-family: var(--font-mono);
  }
  .location {
    flex-shrink: 0;
    margin: 0 0 0.6rem;
    color: var(--terminal-muted);
    font-size: 0.8125rem;
  }
  .location span {
    color: var(--terminal-ink);
  }
  .transcript {
    flex: 1;
    min-height: 0;
    margin-bottom: 0.75rem;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-color: #666 var(--terminal-bg);
    font-size: clamp(0.8125rem, 1.15vw, 0.875rem);
    line-height: 1.58;
  }
  .transcript :global(pre),
  .transcript :global(p) {
    margin: 0;
    font: inherit;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .transcript :global(.entry + .entry) {
    margin-top: 0.85rem;
  }
  .transcript :global(.echo),
  label {
    color: var(--terminal-accent);
  }
  .transcript :global([role='listbox']) {
    margin-top: 0.5rem;
    padding: 0.25rem 0;
    border-left: 2px solid var(--terminal-rule);
  }
  .transcript :global([role='option']) {
    display: block;
    width: 100%;
    min-height: 2rem;
    border: 0;
    padding: 0.25rem 0.75rem;
    text-align: left;
    background: transparent;
    color: var(--terminal-muted);
    font: inherit;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .transcript :global([role='option']:hover) {
    color: var(--terminal-ink);
  }
  .transcript :global([aria-selected='true']) {
    background: var(--terminal-surface);
    color: var(--ansi-blue);
    font-weight: 700;
  }
  .transcript :global([aria-selected='true']::before) {
    content: '❯ ';
    color: var(--terminal-accent);
  }
  form {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.25rem 0 0.75rem;
    border: 1px solid #555;
    border-radius: 5px;
    background: #121212;
  }
  form:global([hidden]) {
    display: none;
  }
  .prompt-field {
    position: relative;
    min-width: 0;
    display: grid;
    align-items: center;
  }
  .ghost {
    grid-area: 1 / 1;
    overflow: hidden;
    white-space: pre;
    font-size: 1rem;
    pointer-events: none;
    user-select: none;
  }
  .ghost :global(.ghost-typed) {
    visibility: hidden;
  }
  .ghost :global(.ghost-rest) {
    color: #666;
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
    box-shadow: 0 0 0 1px var(--terminal-accent);
  }
  input {
    grid-area: 1 / 1;
    min-width: 0;
    width: 100%;
    min-height: 2.75rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--terminal-ink);
    caret-color: var(--terminal-accent);
    font-size: 1rem;
  }
  input::placeholder {
    color: #777;
  }
  input:focus,
  input:focus-visible {
    outline: none;
  }
  button,
  summary {
    cursor: pointer;
  }
  .confirm-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .confirm-actions[hidden] {
    display: none;
  }
  .confirm-yes,
  .confirm-no {
    min-height: 2rem;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .confirm-yes {
    border: 1px solid var(--terminal-accent);
    background: var(--terminal-accent);
    color: #171717;
    font-weight: 600;
  }
  .confirm-no {
    border: 1px solid var(--terminal-rule);
    background: transparent;
    color: var(--terminal-muted);
  }
  form button[type='submit'] {
    min-height: 2.75rem;
    padding: 0 0.7rem;
    color: var(--terminal-ink);
    font: inherit;
    font-size: 0.8125rem;
    border: 0;
    background: transparent;
  }
  form button[type='submit']:hover {
    color: var(--terminal-accent);
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
    z-index: 5;
    display: grid;
    gap: 0.85rem;
    max-height: 20rem;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.85rem clamp(0.875rem, 2.5vw, 1.5rem);
    border-top: 1px solid var(--terminal-rule);
    background: #141414;
  }
  .group-title {
    margin: 0 0 0.25rem;
    color: var(--terminal-muted);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .group-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1rem;
  }
  .command-list button {
    min-height: 2.25rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--terminal-ink);
    font-size: 0.8125rem;
    text-decoration: underline;
    text-decoration-color: var(--terminal-rule);
    text-underline-offset: 0.22em;
  }
  .command-list button:hover:not(:disabled) {
    color: var(--terminal-accent);
    text-decoration-color: currentColor;
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
  @media (max-width: 30rem) {
    .confirm-actions {
      display: none;
    }
  }
  @media (max-width: 40rem) {
    .command-workbench {
      height: clamp(19rem, calc(100dvh - 14.5rem), 32rem);
    }
    .live-status {
      display: none;
    }
    .hint {
      display: none;
    }
  }
  @media (max-width: 40rem) and (max-height: 40rem) {
    .quick-bar {
      display: none;
    }
  }
</style>
