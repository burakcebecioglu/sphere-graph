import type { SphereGraphEdge } from "./types";

/** Whether an edge is treated as one-way (source → target only). */
export function isDirected(edge: SphereGraphEdge): boolean {
  return edge.directed === true;
}

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

function pushEdge(map: Map<string, SphereGraphEdge[]>, id: string, edge: SphereGraphEdge) {
  if (!map.has(id)) map.set(id, []);
  map.get(id)!.push(edge);
}

/** Outgoing edges per node id (respects `directed`; undirected edges appear on both endpoints). */
export function buildOutgoing(edges: readonly SphereGraphEdge[]): Map<string, SphereGraphEdge[]> {
  const outgoing = new Map<string, SphereGraphEdge[]>();
  for (const edge of edges) {
    pushEdge(outgoing, edge.source, edge);
    if (!isDirected(edge)) pushEdge(outgoing, edge.target, edge);
  }
  return outgoing;
}

/** Incoming edges per node id (respects `directed`; undirected edges appear on both endpoints). */
export function buildIncoming(edges: readonly SphereGraphEdge[]): Map<string, SphereGraphEdge[]> {
  const incoming = new Map<string, SphereGraphEdge[]>();
  for (const edge of edges) {
    pushEdge(incoming, edge.target, edge);
    if (!isDirected(edge)) pushEdge(incoming, edge.source, edge);
  }
  return incoming;
}

/** Unique neighbor ids for a focused node (respects edge direction). */
export function neighborsForFocus(edges: readonly SphereGraphEdge[], id: string): Set<string> {
  const neighbors = new Set<string>();
  const { outgoing, incoming } = focusLinks(edges, id);
  for (const edge of outgoing) {
    if (edge.target !== id) neighbors.add(edge.target);
  }
  for (const edge of incoming) {
    if (edge.source !== id) neighbors.add(edge.source);
  }
  return neighbors;
}

/** Outgoing and incoming edges for a focused node. */
export function focusLinks(
  edges: readonly SphereGraphEdge[],
  id: string,
): { outgoing: SphereGraphEdge[]; incoming: SphereGraphEdge[] } {
  const outgoing = buildOutgoing(edges).get(id) ?? [];
  const incoming = buildIncoming(edges).get(id) ?? [];
  return { outgoing, incoming };
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
  const { outgoing, incoming } = focusLinks(edges, id);
  const seen = new Set<string>();
  const result: SphereGraphEdge[] = [];
  for (const edge of [...outgoing, ...incoming]) {
    const key = `${edge.source}->${edge.target}:${edge.kind ?? ""}:${edge.directed ?? false}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(edge);
  }
  return result;
}
