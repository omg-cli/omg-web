import { describe, expect, it } from 'vitest';
import type { DocsDiagram } from './diagram';
import {
  COLUMN_GAP,
  LANE_OFFSET,
  NODE_HEIGHT,
  NODE_HEIGHT_DETAIL,
  NODE_WIDTH,
  describeDiagram,
  layoutDiagram,
} from './diagram';

const pipeline: DocsDiagram = {
  title: 'Request path',
  caption: 'A cache miss reaches the backend.',
  nodes: [
    { id: 'shell', label: 'Shell', detail: 'your prompt', tone: 'signal' },
    { id: 'cli', label: 'omg CLI' },
    { id: 'daemon', label: 'omgd daemon' },
    { id: 'backend', label: 'Package backend' },
  ],
  edges: [
    { from: 'shell', to: 'cli' },
    { from: 'cli', to: 'daemon', label: 'socket' },
    { from: 'daemon', to: 'backend', label: 'cache miss' },
    { from: 'cli', to: 'backend', label: 'fallback', dashed: true },
  ],
};

/** A two-node cycle: the retry path has to leave and re-enter on the side. */
const fallback: DocsDiagram = {
  title: 'Fallback',
  nodes: [
    { id: 'first', label: 'First' },
    { id: 'second', label: 'Second' },
  ],
  edges: [
    { from: 'first', to: 'second' },
    { from: 'second', to: 'first', label: 'retry', dashed: true },
  ],
};

describe('layoutDiagram', () => {
  it('places a chain in reading order, one row per hop', () => {
    const layout = layoutDiagram(pipeline);
    const byId = new Map(layout.nodes.map(node => [node.id, node]));

    expect(byId.get('shell')?.row).toBe(0);
    expect(byId.get('cli')?.row).toBe(1);
    expect(byId.get('daemon')?.row).toBe(2);
    expect(byId.get('backend')?.row).toBe(3);

    const shell = byId.get('shell');
    const cli = byId.get('cli');
    expect(shell).toBeDefined();
    expect(cli).toBeDefined();
    if (shell === undefined || cli === undefined) return;
    expect(shell.y + shell.height).toBeLessThanOrEqual(cli.y);
  });

  it('is deterministic for the same authored figure', () => {
    expect(layoutDiagram(pipeline)).toEqual(layoutDiagram(pipeline));
  });

  it('gives every node the shared box width and a detail-aware height', () => {
    const layout = layoutDiagram(pipeline);
    for (const node of layout.nodes) {
      expect(node.width).toBe(NODE_WIDTH);
      expect(node.height).toBe(node.detail === undefined ? NODE_HEIGHT : NODE_HEIGHT_DETAIL);
    }
  });

  it('spreads nodes that share a row and keeps them inside the figure', () => {
    const layout = layoutDiagram({
      title: 'Fan out',
      nodes: [
        { id: 'start', label: 'Start' },
        { id: 'left', label: 'Left' },
        { id: 'right', label: 'Right' },
      ],
      edges: [
        { from: 'start', to: 'left' },
        { from: 'start', to: 'right' },
      ],
    });
    const byId = new Map(layout.nodes.map(node => [node.id, node]));
    const left = byId.get('left');
    const right = byId.get('right');
    expect(left?.row).toBe(1);
    expect(right?.row).toBe(1);
    if (left === undefined || right === undefined) return;
    expect(right.x - left.x).toBe(NODE_WIDTH + COLUMN_GAP);
    expect(right.x + right.width).toBeLessThanOrEqual(layout.width);
  });

  it('routes a cycle return beside the boxes and widens the figure for it', () => {
    const layout = layoutDiagram(fallback);
    const sideEdge = layout.edges.find(edge => edge.labelAnchor === 'start');
    expect(sideEdge).toBeDefined();
    expect(layout.width).toBe(NODE_WIDTH + LANE_OFFSET * 2);
    for (const node of layout.nodes) expect(node.x + node.width).toBeLessThanOrEqual(NODE_WIDTH);
  });

  it('keeps every connector between two different rows', () => {
    for (const diagram of [pipeline, fallback]) {
      const layout = layoutDiagram(diagram);
      const rowById = new Map(layout.nodes.map(node => [node.id, node.row]));
      for (const edge of layout.edges) {
        // Row assignment follows the longest path, so an edge moves downwards
        // unless a cycle forced the side route. Nothing may land inside one row.
        expect(rowById.get(edge.from)).not.toBe(rowById.get(edge.to));
      }
    }
  });

  it('rejects an edge that names an unknown node', () => {
    expect(() =>
      layoutDiagram({
        title: 'Broken',
        nodes: [{ id: 'only', label: 'Only' }],
        edges: [{ from: 'only', to: 'missing' }],
      })
    ).toThrow(/names an unknown node/u);
  });

  it('rejects a repeated node id', () => {
    expect(() =>
      layoutDiagram({
        title: 'Broken',
        nodes: [
          { id: 'same', label: 'One' },
          { id: 'same', label: 'Two' },
        ],
        edges: [],
      })
    ).toThrow(/repeats node id/u);
  });

  it('rejects a label that would overflow its box at the maximum font size', () => {
    expect(() =>
      layoutDiagram({
        title: 'Broken',
        nodes: [{ id: 'wide', label: 'a label that is far too long for one box' }],
        edges: [],
      })
    ).toThrow(/exceeds 24 characters/u);
  });

  it('rejects a self-referencing edge', () => {
    expect(() =>
      layoutDiagram({
        title: 'Broken',
        nodes: [{ id: 'loop', label: 'Loop' }],
        edges: [{ from: 'loop', to: 'loop' }],
      })
    ).toThrow(/points at itself/u);
  });
});

describe('describeDiagram', () => {
  it('states the reading order and every connection', () => {
    const description = describeDiagram(layoutDiagram(pipeline), pipeline.title);
    expect(description).toContain('Shell (your prompt)');
    expect(description).toContain('omg CLI to omgd daemon (socket)');
    expect(description).toContain('Request path.');
  });
});
