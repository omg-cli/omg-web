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
  <div class="example-switcher" role="group" aria-label="Choose a command example">
    {#each terminalChoices as choice (choice)}
      <button type="button" aria-pressed={selected === choice} onclick={() => choose(choice)}
        >{choice}</button
      >
    {/each}
  </div>
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
  <a class="terminal-guide" href={example.href}>{example.link}<Icon name="right" size={16} /></a>
</div>

<style>
  .command-workbench {
    align-self: center;
    min-width: 0;
    overflow: hidden;
    border-radius: 12px;
    background: #20251f;
    color: #eff2e9;
    box-shadow: 0 14px 32px rgb(30 40 20 / 0.12);
  }
  .workbench-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.35rem;
    border-bottom: 1px solid #3c4338;
  }
  .terminal-title {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: #c5cdbd;
  }
  .shell-label {
    font-size: 0.625rem;
    color: #a5b09b;
    white-space: nowrap;
  }
  .example-switcher {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem 1rem 0;
    background: #272d25;
  }
  .example-switcher button {
    min-height: 2.75rem;
    padding: 0.6rem 0.85rem;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #b8c2ad;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .example-switcher button:hover {
    color: #ffffff;
    background: #333b2e;
  }
  .example-switcher button[aria-pressed='true'] {
    color: #ffffff;
    border-bottom-color: #f29768;
  }
  button:focus-visible,
  a:focus-visible {
    outline-color: #f29768;
    outline-offset: -4px;
  }
  .terminal-body {
    height: 19rem;
    overflow-y: auto;
    padding: 1.5rem;
    scrollbar-color: #606d56 #20251f;
  }
  .terminal-body p {
    margin: 0;
  }
  .terminal-comment {
    min-height: 2.5rem;
    color: #a5b09b;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
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
    font-size: clamp(0.75rem, 1.1vw, 0.9375rem);
    overflow-wrap: anywhere;
    color: #efb185;
  }
  .prompt {
    color: #a7bf8d;
    font-family: var(--font-mono);
  }
  .caret,
  .idle-caret {
    display: inline-block;
    width: 0.5em;
    height: 1.1em;
    margin-left: 0.2rem;
    vertical-align: -0.15em;
    background: #a7bf8d;
  }
  .invisible {
    visibility: hidden;
  }
  .blinking {
    animation: cursor-blink 900ms step-end infinite;
  }
  .terminal-output {
    margin-top: 1rem;
    color: #d4ddca;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.85;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .terminal-output .success {
    color: #b4d695;
  }
  .terminal-output .output-heading {
    color: #c0d1dd;
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
    padding: 0 1rem 0 1.5rem;
    min-height: 2.75rem;
  }
  .playback-bar > p {
    margin: 0;
    color: #a5b09b;
    font-size: 0.625rem;
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
    color: #c5cdbd;
    cursor: pointer;
  }
  .playback-controls button:hover {
    background: #333b2e;
    color: #ffffff;
  }
  .playback-controls button:disabled {
    opacity: 0.4;
    cursor: default;
    background: transparent;
  }
  .terminal-guide {
    display: flex;
    min-height: 3.25rem;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-top: 1px solid #3c4338;
    color: #dce5d2;
    font-size: 0.75rem;
    text-decoration: none;
  }
  .terminal-guide:hover {
    background: #30392b;
    color: #ffffff;
  }
  @keyframes cursor-blink {
    50% {
      opacity: 0;
    }
  }
  @media (max-width: 30rem) {
    .terminal-body {
      padding: 1.25rem;
      height: 20rem;
    }
    .workbench-toolbar {
      padding: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .terminal-title {
      font-size: 0.625rem;
    }
    .example-switcher {
      padding-inline: 0.5rem;
    }
    .example-switcher button {
      padding-inline: 0.65rem;
      font-size: 0.6875rem;
    }
    .playback-bar {
      padding-left: 1.25rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .blinking {
      animation: none;
    }
  }
</style>
