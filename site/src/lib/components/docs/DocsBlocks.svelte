<script lang="ts">
  import type { DocsBlock } from '../../docs/topic';
  import DocsDiagram from './DocsDiagram.svelte';
  import DocsCode from './DocsCode.svelte';

  let { block }: { block: DocsBlock } = $props();
  const titleId = $props.id();
</script>

{#snippet prose(text: string)}
  {#each text.split(/`([^`\n]+)`/u) as part, index (index)}{#if index % 2 === 1}<code>{part}</code
      >{:else}{part}{/if}{/each}
{/snippet}

{#if block.kind === 'paragraphs'}
  <div class="paragraphs">
    {#each block.paragraphs as paragraph, index (index)}
      <p>{@render prose(paragraph)}</p>
    {/each}
  </div>
{:else if block.kind === 'commands'}
  <section class="commands-block">
    <h3>{block.title}</h3>
    <DocsCode code={block.commands.join('\n')} />
  </section>
{:else if block.kind === 'steps'}
  <ol class="steps-block">
    {#each block.steps as step (step)}
      <li>
        <p>{@render prose(step.text)}</p>
        {#if step.command}
          <DocsCode code={step.command} />
        {/if}
      </li>
    {/each}
  </ol>
{:else if block.kind === 'table'}
  <section class="table-block">
    <h3 id={titleId}>{block.title}</h3>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access for horizontal scrolling) -->
    <div class="table-scroll" role="region" aria-labelledby={titleId} tabindex="0">
      <table>
        <thead>
          <tr>
            <th scope="col">{@render prose(block.columns[0])}</th>
            <th scope="col">{@render prose(block.columns[1])}</th>
          </tr>
        </thead>
        <tbody>
          {#each block.rows as row (row)}
            <tr>
              <td>{@render prose(row[0])}</td>
              <td>{@render prose(row[1])}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{:else if block.kind === 'bullets'}
  <ul class="bullets-block">
    {#each block.items as item, index (index)}
      <li>{@render prose(item)}</li>
    {/each}
  </ul>
{:else if block.kind === 'diagram'}
  <DocsDiagram diagram={block.diagram} />
{:else}
  <aside class="note note-{block.tone}">
    <p>{@render prose(block.text)}</p>
  </aside>
{/if}

<style>
  code {
    padding: 0.1em 0.35em;
    border: 1px solid var(--rule);
    border-radius: 4px;
    background: var(--paper-raised);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.84em;
    overflow-wrap: anywhere;
  }
  .paragraphs p {
    max-width: 44rem;
    margin: 1rem 0 0;
    color: var(--ink-body);
    line-height: 1.75;
    overflow-wrap: break-word;
  }

  h3 {
    margin: 2rem 0 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 1.0625rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .steps-block {
    margin: 1rem 0 0;
    padding: 0;
    padding-left: 1.25rem;
    color: var(--ink-body);
    line-height: 1.75;
  }

  .steps-block li {
    padding-block: 0.5rem;
    overflow-wrap: break-word;
  }

  .steps-block li::marker {
    color: var(--signal);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
  }

  .table-block {
    margin-top: 0.25rem;
  }

  .table-scroll {
    margin-top: 1rem;
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 34rem;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th,
  td {
    padding: 0.75rem 1rem 0.75rem 0;
    border-bottom: 1px solid var(--rule);
    text-align: left;
    vertical-align: top;
    line-height: 1.6;
  }

  th {
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--rule-strong);
  }

  td {
    color: var(--ink-body);
    overflow-wrap: break-word;
  }

  td:first-child {
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
  }

  .bullets-block {
    max-width: 44rem;
    margin: 1rem 0 0;
    padding: 0;
    padding-left: 1.25rem;
    color: var(--ink-body);
    line-height: 1.75;
  }

  .bullets-block li {
    padding-block: 0.375rem;
    overflow-wrap: break-word;
  }

  .bullets-block li::marker {
    color: var(--signal);
  }

  .note {
    max-width: 44rem;
    margin: 1.5rem 0 0;
    padding: 0.875rem 1.25rem;
    border-left: 2px solid var(--signal);
    border-radius: 0 6px 6px 0;
    background: var(--paper-raised);
  }

  .note p {
    margin: 0;
    color: var(--ink-body);
    font-size: 0.875rem;
    line-height: 1.7;
    overflow-wrap: break-word;
  }

  .note-warning {
    border-left-color: var(--danger);
  }
</style>
