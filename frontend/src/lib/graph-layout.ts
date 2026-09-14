import { depthByTask, type DependencyGraph } from "@/lib/graph";

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 56;
const COLUMN_GAP = 60;
const ROW_GAP = 14;
const PADDING = 28;

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  column: number;
}

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  path: string;
  endX: number;
  endY: number;
}

export interface GraphLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  positions: Map<string, LayoutNode>;
}

/** Layered left-to-right layout with barycenter ordering to keep edges readable. */
export function layoutGraph(graph: DependencyGraph): GraphLayout {
  const depth = depthByTask(graph);
  const columns: string[][] = [];
  for (const id of graph.ids) {
    const column = depth.get(id) ?? 0;
    (columns[column] ??= []).push(id);
  }

  const order = new Map<string, number>();
  columns.forEach((column) => column.forEach((id, index) => order.set(id, index)));

  const barycenter = (id: string, neighbours: string[]): number => {
    const known = neighbours.filter((neighbour) => order.has(neighbour));
    if (known.length === 0) return order.get(id) ?? 0;
    return known.reduce((sum, neighbour) => sum + (order.get(neighbour) ?? 0), 0) / known.length;
  };

  for (let sweep = 0; sweep < 4; sweep += 1) {
    const forward = sweep % 2 === 0;
    const indices = forward
      ? columns.map((_, index) => index)
      : columns.map((_, index) => columns.length - 1 - index);

    for (const index of indices) {
      const column = columns[index];
      if (!column) continue;
      const weights = new Map(
        column.map((id) => [
          id,
          barycenter(
            id,
            forward ? (graph.prerequisites.get(id) ?? []) : (graph.dependents.get(id) ?? []),
          ),
        ]),
      );
      column.sort((a, b) => (weights.get(a) ?? 0) - (weights.get(b) ?? 0));
      column.forEach((id, position) => order.set(id, position));
    }
  }

  const tallest = Math.max(...columns.map((column) => column?.length ?? 0), 1);
  const contentHeight = tallest * NODE_HEIGHT + (tallest - 1) * ROW_GAP;

  const positions = new Map<string, LayoutNode>();
  const nodes: LayoutNode[] = [];

  columns.forEach((column, columnIndex) => {
    if (!column) return;
    const columnHeight = column.length * NODE_HEIGHT + (column.length - 1) * ROW_GAP;
    const offsetY = PADDING + (contentHeight - columnHeight) / 2;
    column.forEach((id, rowIndex) => {
      const node: LayoutNode = {
        id,
        column: columnIndex,
        x: PADDING + columnIndex * (NODE_WIDTH + COLUMN_GAP),
        y: offsetY + rowIndex * (NODE_HEIGHT + ROW_GAP),
      };
      positions.set(id, node);
      nodes.push(node);
    });
  });

  const edges: LayoutEdge[] = [];
  for (const [target, sources] of graph.prerequisites.entries()) {
    const to = positions.get(target);
    if (!to) continue;
    for (const source of sources) {
      const from = positions.get(source);
      if (!from) continue;
      const startX = from.x + NODE_WIDTH;
      const startY = from.y + NODE_HEIGHT / 2;
      const endX = to.x;
      const endY = to.y + NODE_HEIGHT / 2;
      const curve = Math.max(28, (endX - startX) / 2);
      edges.push({
        id: `${source}->${target}`,
        from: source,
        to: target,
        path: `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`,
        endX,
        endY,
      });
    }
  }

  return {
    nodes,
    edges,
    width: columns.length * NODE_WIDTH + Math.max(0, columns.length - 1) * COLUMN_GAP + PADDING * 2,
    height: contentHeight + PADDING * 2,
    positions,
  };
}
