import { describe, expect, it, vi } from "vitest";
import { sanitizeEdges, sanitizeGraph, sanitizeNodes } from "./sanitize";
import type { SphereGraphEdge, SphereGraphNode } from "./types";

describe("sanitizeNodes", () => {
  it("drops duplicate ids", () => {
    const nodes: SphereGraphNode[] = [
      { id: "a", label: "A" },
      { id: "a", label: "A2" },
    ];
    expect(sanitizeNodes(nodes)).toHaveLength(1);
  });
});

describe("sanitizeEdges", () => {
  it("drops edges with missing endpoints", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const edges: SphereGraphEdge[] = [{ source: "a", target: "missing" }];
    expect(sanitizeEdges(edges, new Set(["a"]))).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("sanitizeGraph", () => {
  it("returns clean nodes and edges", () => {
    const { nodes, edges } = sanitizeGraph(
      [{ id: "a", label: "A" }],
      [{ source: "a", target: "b" }],
    );
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
  });
});
