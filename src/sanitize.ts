import type { SphereGraphEdge, SphereGraphNode } from "./types";

const isDev = import.meta.env?.DEV === true;

function warn(message: string) {
  if (isDev) console.warn(`sphere-graph: ${message}`);
}

/** Drop duplicate node ids (first wins). */
export function sanitizeNodes(nodes: readonly SphereGraphNode[]): SphereGraphNode[] {
  const seen = new Set<string>();
  const out: SphereGraphNode[] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) {
      warn(`duplicate node id "${node.id}" skipped`);
      continue;
    }
    seen.add(node.id);
    out.push(node);
  }
  return out;
}

/** Drop edges referencing missing node ids. */
export function sanitizeEdges(
  edges: readonly SphereGraphEdge[],
  nodeIds: ReadonlySet<string>,
): SphereGraphEdge[] {
  return edges.filter((edge) => {
    if (!nodeIds.has(edge.source)) {
      warn(`edge source "${edge.source}" not found — skipped`);
      return false;
    }
    if (!nodeIds.has(edge.target)) {
      warn(`edge target "${edge.target}" not found — skipped`);
      return false;
    }
    return true;
  });
}

export function sanitizeGraph(
  nodes: readonly SphereGraphNode[],
  edges: readonly SphereGraphEdge[],
): { nodes: SphereGraphNode[]; edges: SphereGraphEdge[] } {
  const cleanNodes = sanitizeNodes(nodes);
  const nodeIds = new Set(cleanNodes.map((node) => node.id));
  const cleanEdges = sanitizeEdges(edges, nodeIds);
  return { nodes: cleanNodes, edges: cleanEdges };
}
