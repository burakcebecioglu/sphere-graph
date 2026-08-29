import type { SphereGraphNode } from "./types";

/** Score for how well a node matches a query (0 = no match). */
export function matchScore(node: SphereGraphNode, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let score = 0;
  if (node.id.toLowerCase().includes(q)) score = Math.max(score, 0.5);
  if (node.label.toLowerCase().includes(q)) score = Math.max(score, 1);
  if (node.description?.toLowerCase().includes(q)) score = Math.max(score, 0.85);
  if (node.group?.toLowerCase().includes(q)) score = Math.max(score, 0.6);
  if (node.tags?.some((tag) => tag.toLowerCase().includes(q))) score = Math.max(score, 0.75);
  return score;
}

/** Nodes matching `query`, sorted by match strength then label. */
export function searchNodes(
  nodes: readonly SphereGraphNode[],
  query: string,
): SphereGraphNode[] {
  const q = query.trim();
  if (!q) return [...nodes];

  return nodes
    .map((node) => ({ node, score: matchScore(node, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label))
    .map(({ node }) => node);
}

/** Set of node ids that match `query`. Empty set when query is blank. */
export function searchMatchIds(
  nodes: readonly SphereGraphNode[],
  query: string,
): Set<string> {
  if (!query.trim()) return new Set();
  return new Set(searchNodes(nodes, query).map((node) => node.id));
}
