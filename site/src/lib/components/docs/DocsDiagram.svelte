<script lang="ts">
  import type { DocsDiagram } from '../../docs/diagram';
  import { describeDiagram, layoutDiagram } from '../../docs/diagram';

  let { diagram }: { diagram: DocsDiagram } = $props();

  const layout = $derived(layoutDiagram(diagram));
  const description = $derived(describeDiagram(layout, diagram.title));
  const ids = $props.id();
  const titleId = `diagram-title-${ids}`;
  const descriptionId = `diagram-description-${ids}`;
  const arrowId = `diagram-arrow-${ids}`;
  const signalArrowId = `diagram-arrow-signal-${ids}`;
  const mutedArrowId = `diagram-arrow-muted-${ids}`;

  const tones = $derived(new Map(layout.nodes.map(node => [node.id, node.tone])));

  function markerFor(from: string, dashed: boolean): string {
    if (dashed) return `url(#${mutedArrowId})`;
    return tones.get(from) === 'signal' ? `url(#${signalArrowId})` : `url(#${arrowId})`;
  }
</script>

<figure class="diagram">
  <figcaption>
    <span class="diagram-title">{diagram.title}</span>
    {#if diagram.caption !== undefined}
      <span class="diagram-caption">{diagram.caption}</span>
    {/if}
  </figcaption>

  <div class="diagram-scroll">
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
      style={`min-width: ${layout.width}px;`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{diagram.title}</title>
      <desc id={descriptionId}>{description}</desc>
      <defs>
        <marker
          id={arrowId}
          class="arrow arrow-default"
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0.75 L 7 4 L 0 7.25 Z" />
        </marker>
        <marker
          id={signalArrowId}
          class="arrow arrow-signal"
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0.75 L 7 4 L 0 7.25 Z" />
        </marker>
        <marker
          id={mutedArrowId}
          class="arrow arrow-muted"
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0.75 L 7 4 L 0 7.25 Z" />
        </marker>
      </defs>

      {#each layout.edges as edge (`${edge.from}->${edge.to}`)}
        <path
          class="connector"
          class:dashed={edge.dashed}
          d={edge.path}
          marker-end={markerFor(edge.from, edge.dashed)}
        />
      {/each}

      {#each layout.nodes as node (node.id)}
        <g class={`node node-${node.tone}`}>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} />
          <text
            class="node-label"
            x={node.x + 14}
            y={node.detail === undefined ? node.y + node.height / 2 + 4 : node.y + 26}
          >
            {node.label}
          </text>
          {#if node.detail !== undefined}
            <text class="node-detail" x={node.x + 14} y={node.y + 43}>{node.detail}</text>
          {/if}
        </g>
      {/each}

      {#each layout.edges as edge (`label-${edge.from}->${edge.to}`)}
        {#if edge.label !== undefined}
          <text class="edge-label" x={edge.labelX} y={edge.labelY} text-anchor={edge.labelAnchor}>
            {edge.label}
          </text>
        {/if}
      {/each}
    </svg>
  </div>
</figure>

<style>
  .diagram {
    max-width: 46rem;
    margin: 1.75rem 0 0;
  }

  figcaption {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--rule);
  }

  .diagram-title {
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .diagram-caption {
    color: var(--ink-muted);
    font-size: 0.8125rem;
    line-height: 1.6;
  }

  .diagram-scroll {
    overflow-x: auto;
    padding: 1.25rem 0 0.25rem;
  }

  svg {
    display: block;
    height: auto;
    max-width: 100%;
  }

  .connector {
    fill: none;
    stroke: var(--rule-strong);
    stroke-width: 1.25;
  }

  .connector.dashed {
    stroke: var(--ink-muted);
    stroke-dasharray: 4 4;
  }

  .node rect {
    fill: var(--paper-raised);
    stroke: var(--rule-strong);
    stroke-width: 1;
  }

  .node-signal rect {
    stroke: var(--signal);
  }

  .node-muted rect {
    stroke: var(--rule);
    stroke-dasharray: 4 3;
    fill: transparent;
  }

  .node-danger rect {
    stroke: var(--danger);
  }

  .node-label {
    fill: var(--ink);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: -0.01em;
  }

  .node-detail {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 10px;
  }

  .edge-label {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 10px;
  }

  .arrow-default path {
    fill: var(--rule-strong);
  }

  .arrow-signal path {
    fill: var(--signal);
  }

  .arrow-muted path {
    fill: var(--ink-muted);
  }

  @media (min-width: 48rem) {
    .diagram-caption {
      max-width: 34rem;
    }
  }
</style>
