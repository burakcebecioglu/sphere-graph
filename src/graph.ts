import type { SphereGraphEdge } from "./types";

/** Undirected degree (connection count) per node id, derived from edges. */
export function computeDegree(edges: readonly SphereGraphEdge[]): Map<string, number> {
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  return degree;
}

/** Undirected adjacency list, derived from edges. */
export function buildAdjacency(edges: readonly SphereGraphEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a)!.add(b);
  };
  for (const edge of edges) {
    link(edge.source, edge.target);
    link(edge.target, edge.source);
  }
  return adjacency;
}

/**
 * Edges touching `id` — the only edges worth drawing at once for a dense
 * graph; drawing every edge in a densely cross-linked graph is unreadable
 * regardless of how good the node layout is.
 */
export function edgesForFocus(
  edges: readonly SphereGraphEdge[],
  id: string,
): SphereGraphEdge[] {
  return edges.filter((edge) => edge.source === id || edge.target === id);
}
