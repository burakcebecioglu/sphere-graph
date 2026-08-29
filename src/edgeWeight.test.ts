import { describe, expect, it } from "vitest";
import { computeEdgeWeightRange, edgeStrokeWidth } from "./edgeWeight";
import type { SphereGraphEdge } from "./types";

describe("edgeStrokeWidth", () => {
  const edges: SphereGraphEdge[] = [
    { source: "a", target: "b", weight: 1 },
    { source: "b", target: "c", weight: 5 },
  ];
  const range = computeEdgeWeightRange(edges);

  it("maps min and max weights to stroke range", () => {
    expect(edgeStrokeWidth(edges[0]!, range)).toBeCloseTo(1.2);
    expect(edgeStrokeWidth(edges[1]!, range)).toBeCloseTo(4);
  });

  it("uses midpoint when all weights equal", () => {
    const flat = computeEdgeWeightRange([{ source: "a", target: "b", weight: 2 }]);
    expect(edgeStrokeWidth({ source: "a", target: "b", weight: 2 }, flat)).toBeCloseTo(2.6);
  });
});
