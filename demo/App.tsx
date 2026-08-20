import { useMemo, useState } from "react";
import {
  SphereGraph,
  type SphereGraphEdge,
  type SphereGraphFocus,
  type SphereGraphNode,
} from "../src/index";
import "../src/sphere-graph.css";

function makeFakeGraph(count: number): { nodes: SphereGraphNode[]; edges: SphereGraphEdge[] } {
  const nodes: SphereGraphNode[] = Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    label: `N${i}`,
    group: i % 2 === 0 ? "left" : "right",
  }));
  const edges: SphereGraphEdge[] = [];
  for (let i = 0; i < count; i++) {
    const linkCount = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < linkCount; j++) {
      const target = Math.floor(Math.random() * count);
      if (target !== i) edges.push({ source: `n${i}`, target: `n${target}` });
    }
  }
  return { nodes, edges };
}

export default function App() {
  const { nodes, edges } = useMemo(() => makeFakeGraph(40), []);
  const [lastActivated, setLastActivated] = useState<string | null>(null);

  function renderDetail(focus: SphereGraphFocus | null) {
    if (!focus) return <p>Hover or click a node.</p>;
    return (
      <div>
        <h3>{focus.node.label}</h3>
        <p>{focus.neighbors.length} connections</p>
        <ul>
          {focus.neighbors.map((n) => (
            <li key={n.id}>{n.label}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      <h1>sphere-graph demo</h1>
      <p>
        40 random nodes across two groups, random edges. Drag to orbit, scroll to zoom, click to
        pin, double-click to activate.
      </p>
      {lastActivated && <p>Last activated: {lastActivated}</p>}
      <SphereGraph
        nodes={nodes}
        edges={edges}
        groupColors={{ left: "#2a9d59", right: "#1a4fd6" }}
        onNodeActivate={(node) => setLastActivated(node.id)}
        renderDetail={renderDetail}
      />
    </div>
  );
}
