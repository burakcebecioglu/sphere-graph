import type { SphereGraphEdge, SphereGraphNode } from "./types";

export interface GraphFilters {
  visibleGroups?: readonly string[];
  visibleEdgeKinds?: readonly string[];
}

/** Keep nodes whose `group` is listed, or all nodes when filter unset. Ungrouped nodes pass when `""` is included. */
export function filterNodesByGroup(
  nodes: readonly SphereGraphNode[],
  visibleGroups?: readonly string[],
): SphereGraphNode[] {
  if (!visibleGroups || visibleGroups.length === 0) return [...nodes];
  const allowed = new Set(visibleGroups);
  return nodes.filter((node) => allowed.has(node.group ?? ""));
}

/** Keep edges whose `kind` is listed; undirected edges without kind pass when filter unset. */
export function filterEdgesByKind(
  edges: readonly SphereGraphEdge[],
  visibleEdgeKinds?: readonly string[],
): SphereGraphEdge[] {
  if (!visibleEdgeKinds || visibleEdgeKinds.length === 0) return [...edges];
  const allowed = new Set(visibleEdgeKinds);
  return edges.filter((edge) => allowed.has(edge.kind ?? ""));
}

export function edgeMatchesKindFilter(
  edge: SphereGraphEdge,
  visibleEdgeKinds?: readonly string[],
): boolean {
  if (!visibleEdgeKinds || visibleEdgeKinds.length === 0) return true;
  return visibleEdgeKinds.includes(edge.kind ?? "");
}

export function nodeMatchesGroupFilter(
  node: SphereGraphNode,
  visibleGroups?: readonly string[],
): boolean {
  if (!visibleGroups || visibleGroups.length === 0) return true;
  return visibleGroups.includes(node.group ?? "");
}

/** Apply group + edge-kind filters and drop edges whose endpoints were removed. */
export function buildFilteredGraph(
  nodes: readonly SphereGraphNode[],
  edges: readonly SphereGraphEdge[],
  filters: GraphFilters = {},
): { nodes: SphereGraphNode[]; edges: SphereGraphEdge[] } {
  const filteredNodes = filterNodesByGroup(nodes, filters.visibleGroups);
  const nodeIds = new Set(filteredNodes.map((node) => node.id));
  const filteredEdges = filterEdgesByKind(edges, filters.visibleEdgeKinds).filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
  return { nodes: filteredNodes, edges: filteredEdges };
}
