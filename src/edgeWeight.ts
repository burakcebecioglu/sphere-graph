import type { SphereGraphEdge } from "./types";

/** Min/max weight across edges that define one (defaults 1..1). */
export function computeEdgeWeightRange(
  edges: readonly SphereGraphEdge[],
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  let found = false;
  for (const edge of edges) {
    if (edge.weight == null) continue;
    found = true;
    min = Math.min(min, edge.weight);
    max = Math.max(max, edge.weight);
  }
  if (!found) return { min: 1, max: 1 };
  return { min, max };
}

/** Map edge weight to SVG stroke-width in [minWidth, maxWidth]. */
export function edgeStrokeWidth(
  edge: SphereGraphEdge,
  range: { min: number; max: number },
  minWidth = 1.2,
  maxWidth = 4,
): number {
  const weight = edge.weight ?? range.min;
  if (range.max <= range.min) return (minWidth + maxWidth) / 2;
  const t = (weight - range.min) / (range.max - range.min);
  return minWidth + t * (maxWidth - minWidth);
}
