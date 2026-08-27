import { describe, expect, it } from "vitest";
import { buildAdjacency, computeDegree, edgesForFocus } from "./graph";
import type { SphereGraphEdge } from "./types";

describe("computeDegree", () => {
  it("returns an empty map for empty edges", () => {
    expect(computeDegree([]).size).toBe(0);
  });

  it("increments both endpoints for a single edge", () => {
    const degree = computeDegree([{ source: "a", target: "b" }]);
    expect(degree.get("a")).toBe(1);
    expect(degree.get("b")).toBe(1);
  });

  it("counts degree in a star graph", () => {
    const edges: SphereGraphEdge[] = [
      { source: "hub", target: "a" },
      { source: "hub", target: "b" },
      { source: "hub", target: "c" },
    ];
    const degree = computeDegree(edges);
    expect(degree.get("hub")).toBe(3);
    expect(degree.get("a")).toBe(1);
    expect(degree.get("b")).toBe(1);
    expect(degree.get("c")).toBe(1);
  });
});

describe("buildAdjacency", () => {
  it("links both directions for a single edge", () => {
    const adjacency = buildAdjacency([{ source: "a", target: "b" }]);
    expect(adjacency.get("a")).toEqual(new Set(["b"]));
    expect(adjacency.get("b")).toEqual(new Set(["a"]));
  });

  it("merges multiple edges into sets", () => {
    const adjacency = buildAdjacency([
      { source: "a", target: "b" },
      { source: "a", target: "c" },
    ]);
    expect(adjacency.get("a")).toEqual(new Set(["b", "c"]));
    expect(adjacency.get("b")).toEqual(new Set(["a"]));
    expect(adjacency.get("c")).toEqual(new Set(["a"]));
  });

  it("omits nodes with no edges", () => {
    const adjacency = buildAdjacency([{ source: "a", target: "b" }]);
    expect(adjacency.has("c")).toBe(false);
  });
});

describe("edgesForFocus", () => {
  const edges: SphereGraphEdge[] = [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
    { source: "c", target: "d" },
  ];

  it("returns only edges touching the focus id", () => {
    expect(edgesForFocus(edges, "b")).toEqual([
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ]);
  });

  it("returns edges for endpoint nodes in a chain", () => {
    expect(edgesForFocus(edges, "a")).toEqual([{ source: "a", target: "b" }]);
    expect(edgesForFocus(edges, "d")).toEqual([{ source: "c", target: "d" }]);
  });

  it("returns an empty array for an unknown id", () => {
    expect(edgesForFocus(edges, "missing")).toEqual([]);
  });
});
