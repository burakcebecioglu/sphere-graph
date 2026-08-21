import { useEffect, useMemo, useState } from "react";
import {
  SphereGraph,
  type SphereGraphEdge,
  type SphereGraphFocus,
  type SphereGraphNode,
  type SphereGraphTheme,
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

function useResolvedDark(theme: SphereGraphTheme): boolean {
  const [dark, setDark] = useState(() =>
    theme === "dark"
      ? true
      : theme === "light"
        ? false
        : typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    if (theme === "dark") {
      setDark(true);
      return;
    }
    if (theme === "light") {
      setDark(false);
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setDark(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);

  return dark;
}

export default function App() {
  const { nodes, edges } = useMemo(() => makeFakeGraph(40), []);
  const [lastActivated, setLastActivated] = useState<string | null>(null);
  const [theme, setTheme] = useState<SphereGraphTheme>("system");
  const dark = useResolvedDark(theme);

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
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "1.5rem",
        maxWidth: 1200,
        margin: "0 auto",
        minHeight: "100vh",
        background: dark ? "#000" : "#f5f5f7",
        color: dark ? "#f5f5f7" : "#1c1c1e",
      }}
    >
      <h1>sphere-graph demo</h1>
      <p>
        40 random nodes across two groups, random edges. Drag to orbit, scroll to zoom, click to
        pin, double-click to activate.
      </p>
      <p style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        Theme:
        {(["light", "dark", "system"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={theme === value}
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: 6,
              border: "1px solid currentColor",
              opacity: theme === value ? 1 : 0.65,
              fontWeight: theme === value ? 700 : 500,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {value}
          </button>
        ))}
      </p>
      {lastActivated && <p>Last activated: {lastActivated}</p>}
      <SphereGraph
        nodes={nodes}
        edges={edges}
        theme={theme}
        groupColors={{ left: "#30d158", right: "#0a84ff" }}
        onNodeActivate={(node) => setLastActivated(node.id)}
        renderDetail={renderDetail}
      />
    </div>
  );
}
