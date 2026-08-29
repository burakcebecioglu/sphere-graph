import { describe, expect, it } from "vitest";
import {
  buildAdjacency,
  buildIncoming,
  buildOutgoing,
  computeDegree,
  edgesForFocus,
  edgesForFocusWithSecondHop,
  focusLinks,
  isDirected,
  neighborsForFocus,
} from "./graph";
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

describe("isDirected", () => {
  it("returns true only when directed is true", () => {
    expect(isDirected({ source: "a", target: "b" })).toBe(false);
    expect(isDirected({ source: "a", target: "b", directed: false })).toBe(false);
    expect(isDirected({ source: "a", target: "b", directed: true })).toBe(true);
  });
});

describe("buildOutgoing", () => {
  it("lists out-edges for directed edges on source only", () => {
    const edge: SphereGraphEdge = { source: "a", target: "b", directed: true };
    const outgoing = buildOutgoing([edge]);
    expect(outgoing.get("a")).toEqual([edge]);
    expect(outgoing.has("b")).toBe(false);
  });

  it("lists undirected edges on both endpoints", () => {
    const edge: SphereGraphEdge = { source: "a", target: "b" };
    const outgoing = buildOutgoing([edge]);
    expect(outgoing.get("a")).toEqual([edge]);
    expect(outgoing.get("b")).toEqual([edge]);
  });
});

describe("buildIncoming", () => {
  it("lists in-edges for directed edges on target only", () => {
    const edge: SphereGraphEdge = { source: "a", target: "b", directed: true };
    const incoming = buildIncoming([edge]);
    expect(incoming.get("b")).toEqual([edge]);
    expect(incoming.has("a")).toBe(false);
  });
});

describe("focusLinks", () => {
  it("splits directed edges into outgoing and incoming", () => {
    const edge: SphereGraphEdge = { source: "a", target: "b", directed: true };
    expect(focusLinks([edge], "a")).toEqual({ outgoing: [edge], incoming: [] });
    expect(focusLinks([edge], "b")).toEqual({ outgoing: [], incoming: [edge] });
  });

  it("treats undirected edges as both outgoing and incoming", () => {
    const edge: SphereGraphEdge = { source: "a", target: "b" };
    expect(focusLinks([edge], "a")).toEqual({ outgoing: [edge], incoming: [edge] });
  });
});

describe("neighborsForFocus", () => {
  it("returns neighbor ids respecting direction", () => {
    const edges: SphereGraphEdge[] = [
      { source: "a", target: "b", directed: true },
      { source: "a", target: "c" },
    ];
    expect(neighborsForFocus(edges, "a")).toEqual(new Set(["b", "c"]));
    expect(neighborsForFocus(edges, "b")).toEqual(new Set(["a"]));
    expect(neighborsForFocus(edges, "c")).toEqual(new Set(["a"]));
  });
});

describe("computeDegree with directed edges", () => {
  it("still counts both endpoints for directed edges", () => {
    const degree = computeDegree([{ source: "a", target: "b", directed: true }]);
    expect(degree.get("a")).toBe(1);
    expect(degree.get("b")).toBe(1);
  });
});

describe("edgesForFocusWithSecondHop", () => {
  it("includes second-hop edges not in first hop", () => {
    const edges: SphereGraphEdge[] = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ];
    const result = edgesForFocusWithSecondHop(edges, "a");
    expect(result.some(({ edge, hop }) => hop === 2 && edge.target === "c")).toBe(true);
  });
});
