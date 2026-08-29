import { describe, expect, it } from "vitest";
import {
  buildFilteredGraph,
  filterEdgesByKind,
  filterNodesByGroup,
  nodeMatchesGroupFilter,
} from "./filter";
import type { SphereGraphEdge, SphereGraphNode } from "./types";

const nodes: SphereGraphNode[] = [
  { id: "a", label: "A", group: "ch1" },
  { id: "b", label: "B", group: "ch2" },
];

const edges: SphereGraphEdge[] = [
  { source: "a", target: "b", kind: "reference" },
  { source: "b", target: "a", kind: "sequential", directed: true },
];

describe("filterNodesByGroup", () => {
  it("returns all nodes when filter unset", () => {
    expect(filterNodesByGroup(nodes)).toHaveLength(2);
  });

  it("keeps only listed groups", () => {
    expect(filterNodesByGroup(nodes, ["ch1"]).map((n) => n.id)).toEqual(["a"]);
  });
});

describe("filterEdgesByKind", () => {
  it("keeps edges matching kind", () => {
    expect(filterEdgesByKind(edges, ["reference"])).toHaveLength(1);
  });
});

describe("buildFilteredGraph", () => {
  it("drops edges with missing endpoints after group filter", () => {
    const { nodes: n, edges: e } = buildFilteredGraph(nodes, edges, { visibleGroups: ["ch1"] });
    expect(n).toHaveLength(1);
    expect(e).toHaveLength(0);
  });
});

describe("nodeMatchesGroupFilter", () => {
  it("treats ungrouped as empty string", () => {
    expect(nodeMatchesGroupFilter({ id: "x", label: "X" }, ["", "ch1"])).toBe(true);
  });
});
