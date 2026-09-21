/**
 * Typed model and deterministic layout for the handbook flow diagrams.
 *
 * Diagrams are authored as data, never as markup and never through a browser
 * drawing dependency: the site ships a strict content-security policy without
 * eval, and the client bundle has a hard size budget. Geometry is computed here,
 * at build time, so the same authored data always renders the same figure.
 *
 * Layout is a layered flow: a node's row comes from the longest path that reaches
 * it, so the reader always moves downwards, and nodes declared together share a
 * row. Every node sits in one column of a row, which keeps the figure narrow
 * enough for the article measure.
 */

/** Visual weight of one node. `signal` marks the path the reader should follow. */
type DocsDiagramTone = 'default' | 'signal' | 'muted' | 'danger';

/** One box in the figure. */
interface DocsDiagramNode {
  /** Kebab-case identifier, unique inside one diagram. */
  readonly id: string;
  /** Box label, at most {@link MAX_LABEL_LENGTH} characters. */
  readonly label: string;
  /** Optional second line, at most {@link MAX_DETAIL_LENGTH} characters. */
  readonly detail?: string;
  readonly tone?: DocsDiagramTone;
}

/** One directed connection between two nodes. */
interface DocsDiagramEdge {
  /** Source node id. */
  readonly from: string;
  /** Target node id. */
  readonly to: string;
  /** Optional connector label, at most {@link MAX_EDGE_LABEL_LENGTH} characters. */
  readonly label?: string;
  /** Dashed connectors mark fallbacks and optional paths. */
  readonly dashed?: boolean;
}

/** One complete figure: a titled set of nodes and the edges between them. */
export interface DocsDiagram {
  readonly title: string;
  readonly caption?: string;
  readonly nodes: readonly [DocsDiagramNode, ...DocsDiagramNode[]];
  readonly edges: readonly DocsDiagramEdge[];
}

/** A node with its resolved geometry, in SVG user units. */
interface LaidOutDiagramNode {
  readonly id: string;
  readonly label: string;
  readonly detail?: string;
  readonly tone: DocsDiagramTone;
  readonly row: number;
  readonly column: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** An edge with resolved path data and a label anchor. */
interface LaidOutDiagramEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string;
  readonly dashed: boolean;
  readonly path: string;
  readonly labelX: number;
  readonly labelY: number;
  /** Connector labels sit centred on downward edges and left-aligned on side routes. */
  readonly labelAnchor: 'middle' | 'start';
}

/** The complete figure geometry that the renderer draws. */
interface DiagramLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly LaidOutDiagramNode[];
  readonly edges: readonly LaidOutDiagramEdge[];
}

/** Box width. Three boxes plus gutters still fit the article measure. */
export const NODE_WIDTH = 200;
/** Box height without a second line. */
export const NODE_HEIGHT = 48;
/** Box height with a second line. */
export const NODE_HEIGHT_DETAIL = 64;
/** Vertical space between rows, which also carries the connectors. */
const ROW_GAP = 52;
/** Horizontal space between boxes in the same row. */
export const COLUMN_GAP = 40;
/** Radius of the rounded corners on elbow connectors. */
const CORNER_RADIUS = 10;
/** Distance between the outer box edge and a side-routed connector lane. */
export const LANE_OFFSET = 28;

/** Authored labels are guarded at build time so a box never overflows. */
const MAX_LABEL_LENGTH = 24;
const MAX_DETAIL_LENGTH = 30;
const MAX_EDGE_LABEL_LENGTH = 18;

const UNICODE_ELLIPSIS = '\u2026';

/**
 * Shrink a string to a character budget, preferring a word boundary.
 * Labels stay short by construction; this keeps a longer authored label from
 * overflowing its box instead of throwing at build time.
 */
function clampText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const cut = value.slice(0, limit - 1);
  const boundary = cut.lastIndexOf(' ');
  const head = boundary > limit / 2 ? cut.slice(0, boundary) : cut;
  return `${head.trimEnd()}${UNICODE_ELLIPSIS}`;
}

/**
 * Rows come from the longest path that reaches each node, so an edge moves the
 * reader downwards unless it closes a cycle. A cycle is broken at its last
 * authored node, which is then drawn as a side route instead of a backward hop.
 */
function resolveRows(diagram: DocsDiagram): Map<string, number> {
  const rows = new Map<string, number>(diagram.nodes.map(node => [node.id, 0]));
  const outgoing = new Map<string, string[]>(diagram.nodes.map(node => [node.id, []]));
  const pending = new Map<string, number>(diagram.nodes.map(node => [node.id, 0]));

  for (const edge of diagram.edges) {
    outgoing.get(edge.from)?.push(edge.to);
    pending.set(edge.to, (pending.get(edge.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const node of diagram.nodes) {
    if ((pending.get(node.id) ?? 0) === 0) queue.push(node.id);
  }

  const settle = (id: string): void => {
    for (const target of outgoing.get(id) ?? []) {
      rows.set(target, Math.max(rows.get(target) ?? 0, (rows.get(id) ?? 0) + 1));
      const remaining = (pending.get(target) ?? 0) - 1;
      pending.set(target, remaining);
      if (remaining === 0) queue.push(target);
    }
  };

  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined || visited.has(id)) continue;
    visited.add(id);
    settle(id);
  }

  // A node that only a cycle reaches keeps the row its resolvable sources allow.
  for (const node of diagram.nodes) {
    if (!visited.has(node.id)) settle(node.id);
  }

  return rows;
}

/** Nodes grouped into rows, with the row count the renderer needs for spacing. */
interface RowGrouping {
  readonly rowCount: number;
  readonly rows: readonly (readonly DocsDiagramNode[])[];
}

/** Group nodes by row, keeping the authored order inside each row. */
function groupByRow(diagram: DocsDiagram, rows: Map<string, number>): RowGrouping {
  let rowCount = 0;
  for (const row of rows.values()) rowCount = Math.max(rowCount, row + 1);
  const buckets = new Map<number, DocsDiagramNode[]>();
  for (const node of diagram.nodes) {
    const index = rows.get(node.id) ?? 0;
    const bucket = buckets.get(index);
    if (bucket === undefined) buckets.set(index, [node]);
    else bucket.push(node);
  }
  const ordered: DocsDiagramNode[][] = [];
  for (let index = 0; index < rowCount; index += 1) ordered.push(buckets.get(index) ?? []);
  return { rowCount, rows: ordered };
}

/** Validate the authored figure and fail the build with an actionable message. */
function assertDiagramIsRenderable(diagram: DocsDiagram): void {
  const seen = new Set<string>();
  for (const node of diagram.nodes) {
    if (node.id.length === 0)
      throw new Error(`diagram "${diagram.title}" has a node without an id`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(node.id)) {
      throw new Error(`diagram "${diagram.title}" node id "${node.id}" is not kebab-case`);
    }
    if (seen.has(node.id)) {
      throw new Error(`diagram "${diagram.title}" repeats node id "${node.id}"`);
    }
    seen.add(node.id);
    if (node.label.length > MAX_LABEL_LENGTH) {
      throw new Error(
        `diagram "${diagram.title}" label "${node.label}" exceeds ${MAX_LABEL_LENGTH} characters`
      );
    }
    if (node.detail !== undefined && node.detail.length > MAX_DETAIL_LENGTH) {
      throw new Error(
        `diagram "${diagram.title}" detail "${node.detail}" exceeds ${MAX_DETAIL_LENGTH} characters`
      );
    }
  }

  const edgeKeys = new Set<string>();
  for (const edge of diagram.edges) {
    if (!seen.has(edge.from) || !seen.has(edge.to)) {
      throw new Error(
        `diagram "${diagram.title}" edge "${edge.from}" to "${edge.to}" names an unknown node`
      );
    }
    if (edge.from === edge.to) {
      throw new Error(`diagram "${diagram.title}" edge "${edge.from}" points at itself`);
    }
    const key = `${edge.from}->${edge.to}`;
    if (edgeKeys.has(key)) {
      throw new Error(`diagram "${diagram.title}" repeats edge "${edge.from}" to "${edge.to}"`);
    }
    edgeKeys.add(key);
    if (edge.label !== undefined && edge.label.length > MAX_EDGE_LABEL_LENGTH) {
      throw new Error(
        `diagram "${diagram.title}" edge label "${edge.label}" exceeds ${MAX_EDGE_LABEL_LENGTH} characters`
      );
    }
  }
}

/** A connector's resolved endpoints plus the lanes it may route through. */
interface ConnectorGeometry {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly laneX: number;
  readonly laneY: number;
}

/** A downward elbow: straight when the boxes align, rounded otherwise. */
function forwardPath(geometry: ConnectorGeometry): string {
  const { startX, startY, endX, endY } = geometry;
  if (Math.abs(startX - endX) < 1) return `M ${startX} ${startY} V ${endY}`;
  const span = endY - startY;
  const direction = endX > startX ? 1 : -1;
  const radius = Math.min(CORNER_RADIUS, Math.abs(endX - startX) / 2, span / 4);
  const middle = startY + span / 2;
  return [
    `M ${startX} ${startY}`,
    `V ${middle - radius}`,
    `Q ${startX} ${middle} ${startX + radius * direction} ${middle}`,
    `H ${endX - radius * direction}`,
    `Q ${endX} ${middle} ${endX} ${middle + radius}`,
    `V ${endY}`,
  ].join(' ');
}

/** A route that leaves and returns on the right side, below or above. */
function sidePath(geometry: ConnectorGeometry): string {
  const { startX, startY, endX, endY, laneX } = geometry;
  const direction = endY >= startY ? 1 : -1;
  const reach = laneX - Math.max(startX, endX);
  const drop = Math.abs(endY - startY);
  const radius = Math.max(0, Math.min(CORNER_RADIUS, reach, drop / 2));
  return [
    `M ${startX} ${startY}`,
    `H ${laneX - radius}`,
    `Q ${laneX} ${startY} ${laneX} ${startY + radius * direction}`,
    `V ${endY - radius * direction}`,
    `Q ${laneX} ${endY} ${laneX - radius} ${endY}`,
    `H ${endX}`,
  ].join(' ');
}

/**
 * A route that drops under the whole figure and comes back up.
 *
 * The row assignment follows the longest path, so two connected boxes never share
 * a row and this branch stays unused. It remains as a guard: if a future layout
 * change ever puts connected boxes side by side, the connector still renders
 * instead of collapsing into a zero-length line.
 */
function underPath(geometry: ConnectorGeometry): string {
  const { startX, startY, endX, endY, laneY } = geometry;
  const horizontal = endX > startX ? 1 : -1;
  return [
    `M ${startX} ${startY}`,
    `V ${laneY - CORNER_RADIUS}`,
    `Q ${startX} ${laneY} ${startX + CORNER_RADIUS * horizontal} ${laneY}`,
    `H ${endX - CORNER_RADIUS * horizontal}`,
    `Q ${endX} ${laneY} ${endX} ${laneY - CORNER_RADIUS}`,
    `V ${endY}`,
  ].join(' ');
}

/** Placement of one box inside the figure. */
interface NodePlacement {
  readonly row: number;
  readonly column: number;
  readonly x: number;
  readonly y: number;
  readonly height: number;
}

/** Build one box, adding the optional second line only when the author wrote one. */
function toLaidOutNode(node: DocsDiagramNode, placement: NodePlacement): LaidOutDiagramNode {
  const box = {
    id: node.id,
    label: clampText(node.label, MAX_LABEL_LENGTH),
    tone: node.tone ?? 'default',
    row: placement.row,
    column: placement.column,
    x: placement.x,
    y: placement.y,
    width: NODE_WIDTH,
    height: placement.height,
  };
  if (node.detail === undefined) return box;
  return { ...box, detail: clampText(node.detail, MAX_DETAIL_LENGTH) };
}

/** Build one connector, adding the optional label only when the author wrote one. */
function toLaidOutEdge(
  edge: DocsDiagramEdge,
  geometry: ConnectorGeometry,
  forwards: boolean,
  sameRow: boolean
): LaidOutDiagramEdge {
  const connector: Omit<LaidOutDiagramEdge, 'label'> = {
    from: edge.from,
    to: edge.to,
    dashed: edge.dashed ?? false,
    path: sameRow ? underPath(geometry) : forwards ? forwardPath(geometry) : sidePath(geometry),
    labelX: forwards ? (geometry.startX + geometry.endX) / 2 : geometry.startX + 14,
    labelY: forwards ? (geometry.startY + geometry.endY) / 2 - 8 : geometry.startY - 8,
    labelAnchor: forwards ? 'middle' : 'start',
  };
  if (edge.label === undefined) return connector;
  return { ...connector, label: clampText(edge.label, MAX_EDGE_LABEL_LENGTH) };
}

/**
 * Resolve every box and connector into drawable geometry.
 *
 * The layout is a pure function of the authored figure, so the server-rendered
 * markup and any later client render agree without a measurement pass.
 */
export function layoutDiagram(diagram: DocsDiagram): DiagramLayout {
  assertDiagramIsRenderable(diagram);

  const rowsById = resolveRows(diagram);
  const grouped = groupByRow(diagram, rowsById);
  const rowHeights = grouped.rows.map(row =>
    row.reduce(
      (tallest, node) =>
        Math.max(tallest, node.detail === undefined ? NODE_HEIGHT : NODE_HEIGHT_DETAIL),
      NODE_HEIGHT
    )
  );

  let contentWidth = 0;
  for (const row of grouped.rows) {
    if (row.length === 0) continue;
    contentWidth = Math.max(contentWidth, row.length * NODE_WIDTH + (row.length - 1) * COLUMN_GAP);
  }

  const rowOf = (id: string): number => rowsById.get(id) ?? 0;
  const needsSideLane = diagram.edges.some(edge => rowOf(edge.to) <= rowOf(edge.from));
  const needsUnderLane = diagram.edges.some(edge => rowOf(edge.to) === rowOf(edge.from));
  const laneWidth = needsSideLane ? LANE_OFFSET * 2 : 0;
  const width = contentWidth + laneWidth;

  const rowTops: number[] = [];
  let cursor = 0;
  for (const height of rowHeights) {
    rowTops.push(cursor);
    cursor += height + ROW_GAP;
  }
  const contentHeight = cursor - ROW_GAP;

  const nodes: LaidOutDiagramNode[] = [];
  const nodeById = new Map<string, LaidOutDiagramNode>();
  grouped.rows.forEach((row, rowIndex) => {
    const rowWidth = row.length * NODE_WIDTH + Math.max(0, row.length - 1) * COLUMN_GAP;
    const startX = (contentWidth - rowWidth) / 2;
    const rowTop = rowTops[rowIndex] ?? 0;
    const rowHeight = rowHeights[rowIndex] ?? NODE_HEIGHT;
    row.forEach((node, column) => {
      const height = node.detail === undefined ? NODE_HEIGHT : NODE_HEIGHT_DETAIL;
      const laidOut = toLaidOutNode(node, {
        row: rowIndex,
        column,
        x: startX + column * (NODE_WIDTH + COLUMN_GAP),
        y: rowTop + (rowHeight - height) / 2,
        height,
      });
      nodes.push(laidOut);
      nodeById.set(node.id, laidOut);
    });
  });

  const laneX = contentWidth + LANE_OFFSET;
  const laneY = contentHeight + LANE_OFFSET;
  const edges: LaidOutDiagramEdge[] = [];
  for (const edge of diagram.edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (from === undefined || to === undefined) continue;
    const forwards = to.row > from.row;
    const sameRow = to.row === from.row;
    const geometry: ConnectorGeometry = forwards
      ? {
          startX: from.x + from.width / 2,
          startY: from.y + from.height,
          endX: to.x + to.width / 2,
          endY: to.y,
          laneX,
          laneY,
        }
      : {
          startX: from.x + from.width,
          startY: from.y + from.height / 2,
          endX: to.x + to.width,
          endY: to.y + to.height / 2,
          laneX,
          laneY,
        };
    edges.push(toLaidOutEdge(edge, geometry, forwards, sameRow));
  }

  const height = needsUnderLane ? laneY + LANE_OFFSET : contentHeight;
  return { width, height, nodes, edges };
}

/**
 * Describe a laid-out figure in words for assistive technology.
 *
 * The renderer pairs this with the figure title, so a screen reader receives the
 * reading order and every connection instead of an unlabelled image.
 */
export function describeDiagram(layout: DiagramLayout, title: string): string {
  const labels = new Map(layout.nodes.map(node => [node.id, node.label]));
  const ordered = layout.nodes
    .toSorted((left, right) => left.row - right.row || left.column - right.column)
    .map(node => (node.detail === undefined ? node.label : `${node.label} (${node.detail})`));
  const connections = layout.edges.map(edge => {
    const from = labels.get(edge.from) ?? edge.from;
    const to = labels.get(edge.to) ?? edge.to;
    return edge.label === undefined ? `${from} to ${to}` : `${from} to ${to} (${edge.label})`;
  });
  const steps = `Steps in reading order: ${ordered.join('; ')}.`;
  const links = connections.length === 0 ? '' : ` Connections: ${connections.join('; ')}.`;
  return `${title}. ${steps}${links}`;
}
