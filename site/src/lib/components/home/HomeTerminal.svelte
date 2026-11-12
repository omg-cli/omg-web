<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../Icon.svelte';
  import { terminalChoices, terminalExamples } from './terminal-examples';

  type Phase =
    | { kind: 'typing'; characters: number }
    | { kind: 'output'; lines: number }
    | { kind: 'complete' };
  let selected = $state<(typeof terminalChoices)[number]>('Packages');
  let example = $derived(terminalExamples[selected]);
  let phase = $state<Phase>({ kind: 'complete' });
  let paused = $state(false);
  let reducedMotion = $state(true);
  let hidden = $state(false);
  let mounted = $state(false);
  let command = $derived(
    phase.kind === 'typing' ? example.command.slice(0, phase.characters) : example.command
  );
  let lines = $derived(
    phase.kind === 'complete'
      ? example.output
      : phase.kind === 'output'
        ? example.output.slice(0, phase.lines)
        : []
  );
  let running = $derived(phase.kind !== 'complete' && !paused && !hidden);

  function replay(): void {
    paused = false;
    phase = reducedMotion ? { kind: 'complete' } : { kind: 'typing', characters: 0 };
  }

  function choose(choice: (typeof terminalChoices)[number]): void {
    selected = choice;
    replay();
  }

  onMount(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      reducedMotion = media.matches;
      if (reducedMotion) phase = { kind: 'complete' };
    };
    const syncVisibility = () => {
      hidden = document.hidden;
    };
    syncMotion();
    syncVisibility();
    mounted = true;
    replay();
    media.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      media.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  });

  $effect(() => {
    if (!mounted || reducedMotion || paused || hidden || phase.kind === 'complete') return;
    const current = phase;
    const demo = example;
    const delay = current.kind === 'typing' ? (current.characters === 0 ? 300 : 42) : 150;
    const timer = window.setTimeout(() => {
      if (current.kind === 'typing') {
        phase =
          current.characters < demo.command.length
            ? { kind: 'typing', characters: current.characters + 1 }
            : { kind: 'output', lines: 0 };
      } else {
        phase =
          current.lines < demo.output.length
            ? { kind: 'output', lines: current.lines + 1 }
            : { kind: 'complete' };
      }
    }, delay);
    return () => window.clearTimeout(timer);
  });
</script>

<div class="command-workbench">
  <div class="workbench-toolbar">
    <div class="terminal-title">
      <Icon name="terminal" size={16} /><span>dev@arch: ~/project</span>
    </div>
    <span class="shell-label">Arch Linux · x86_64</span>
  </div>
  <div class="workbench-content">
    <div class="example-switcher" role="group" aria-label="Choose a command example">
      {#each terminalChoices as choice (choice)}
        <button
          type="button"
          aria-label={choice}
          aria-pressed={selected === choice}
          onclick={() => choose(choice)}
          ><span>{choice}</span><code>{terminalExamples[choice].command}</code></button
        >
      {/each}
    </div>
    <div class="terminal-screen">
      <div class="terminal-body">
        <div aria-hidden="true">
          <p class="terminal-comment"># {example.context}</p>
          <p class="command">
            <span class="prompt">$</span><code
              >{command}<span
                class="caret"
                class:blinking={running && phase.kind === 'typing'}
                class:invisible={phase.kind !== 'typing'}
              ></span></code
            >
          </p>
          <div class="terminal-output">
            {#each lines as line, index (`${selected}-${index}`)}<p
                class:success={line.startsWith('✓')}
                class:output-heading={index === 0}
              >
                {line || ' '}
              </p>{/each}
          </div>
          {#if phase.kind === 'complete'}<p class="next-prompt">
              <span class="prompt">$</span><span class="idle-caret"></span>
            </p>{/if}
        </div>
        <pre class="sr-only" aria-live="polite" aria-atomic="true">{example.command +
            '\n' +
            example.output.join('\n')}</pre>
      </div>
      <div class="playback-bar">
        <p>Example output · {reducedMotion ? 'Motion reduced' : 'Arch Linux demo'}</p>
        <div class="playback-controls">
          {#if !reducedMotion && phase.kind !== 'complete'}<button
              type="button"
              aria-label={paused ? 'Resume terminal demo' : 'Pause terminal demo'}
              title={paused ? 'Resume demo' : 'Pause demo'}
              onclick={() => (paused = !paused)}
              ><Icon name={paused ? 'play' : 'pause'} size={15} /></button
            >{/if}
          <button
            type="button"
            aria-label="Replay terminal demo"
            title="Replay demo"
            disabled={!mounted || reducedMotion}
            onclick={replay}><Icon name="replay" size={15} /></button
          >
        </div>
      </div>
      <a class="terminal-guide" href={example.href}>{example.link}<Icon name="right" size={16} /></a
      >
    </div>
  </div>
</div>

<style>
  .command-workbench {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--rule-strong);
    border-radius: 12px;
    background: var(--paper-raised);
  }
  .workbench-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1.25rem;
    border-bottom: 1px solid var(--rule);
  }
  .terminal-title {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--ink);
  }
  .shell-label {
    font-size: 0.75rem;
    color: var(--ink-muted);
    white-space: nowrap;
  }
  .workbench-content {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
  }
  .example-switcher {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.5rem;
  }
  .example-switcher button {
    display: grid;
    gap: 0.5rem;
    width: 100%;
    min-height: 5.5rem;
    padding: 1rem;
    text-align: left;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--ink-muted);
    cursor: pointer;
  }
  .example-switcher button span {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .example-switcher button code {
    color: var(--ink-muted);
    font-size: 0.6875rem;
    line-height: 1.6;
  }
  .example-switcher button:hover {
    background: var(--paper);
    color: var(--ink);
  }
  .example-switcher button[aria-pressed='true'] {
    background: var(--paper);
    border-color: var(--rule);
    color: var(--signal);
  }
  .terminal-screen {
    min-width: 0;
    background: #171717;
    color: #ededed;
  }
  .terminal-screen :global(:focus-visible) {
    outline-color: #ff936e;
    outline-offset: -4px;
  }
  .terminal-body {
    height: 17rem;
    overflow-y: auto;
    padding: 1.5rem 2rem;
    scrollbar-color: #666666 #171717;
  }
  .terminal-body p {
    margin: 0;
  }
  .terminal-comment {
    min-height: 2.5rem;
    color: #ababab;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.7;
  }
  .command {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    min-height: 1.5rem;
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    overflow-wrap: anywhere;
    color: #ffffff;
  }
  .prompt {
    color: #ff936e;
    font-family: var(--font-mono);
  }
  .caret,
  .idle-caret {
    display: inline-block;
    width: 0.5em;
    height: 1.1em;
    margin-left: 0.2rem;
    vertical-align: -0.15em;
    background: #ff936e;
  }
  .invisible {
    visibility: hidden;
  }
  .blinking {
    animation: cursor-blink 900ms step-end infinite;
  }
  .terminal-output {
    margin-top: 1rem;
    color: #d6d6d6;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.85;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .terminal-output .success,
  .terminal-output .output-heading {
    color: #a9cfff;
  }
  .next-prompt {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding-top: 1rem;
  }
  .playback-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem 0 2rem;
    min-height: 2.75rem;
  }
  .playback-bar > p {
    margin: 0;
    color: #ababab;
    font-size: 0.6875rem;
  }
  .playback-controls {
    display: flex;
  }
  .playback-controls button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 2.75rem;
    height: 2.75rem;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #cccccc;
    cursor: pointer;
  }
  .playback-controls button:hover {
    background: #303030;
    color: #ffffff;
  }
  .playback-controls button:disabled {
    opacity: 0.4;
    cursor: default;
    background: transparent;
  }
  .terminal-guide {
    display: flex;
    min-height: 3rem;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 2rem;
    border-top: 1px solid #383838;
    color: #ededed;
    font-size: 0.75rem;
    text-decoration: none;
  }
  .terminal-guide:hover {
    background: #252525;
    color: #ff936e;
  }
  @keyframes cursor-blink {
    50% {
      opacity: 0;
    }
  }
  @media (max-width: 55rem) {
    .workbench-content {
      grid-template-columns: 14rem minmax(0, 1fr);
    }
    .terminal-body {
      padding-inline: 1.25rem;
    }
  }
  @media (max-width: 40rem) {
    .workbench-content {
      grid-template-columns: 1fr;
    }
    .example-switcher {
      flex-direction: row;
      gap: 0.25rem;
      padding: 0.4rem;
    }
    .example-switcher button {
      display: block;
      min-height: 2.75rem;
      width: auto;
      flex: 1;
      padding: 0.65rem 0.35rem;
      text-align: center;
    }
    .example-switcher button span {
      font-size: 0.75rem;
    }
    .example-switcher button code {
      display: none;
    }
    .terminal-body {
      height: 18rem;
      padding: 1.25rem;
    }
    .workbench-toolbar {
      padding: 0.875rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .terminal-title,
    .shell-label {
      font-size: 0.6875rem;
    }
    .playback-bar {
      padding-left: 1.25rem;
    }
    .terminal-guide {
      padding-inline: 1.25rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .blinking {
      animation: none;
    }
  }
</style>
