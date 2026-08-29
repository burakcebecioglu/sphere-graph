import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  SphereGraph,
  type SphereGraphEdge,
  type SphereGraphFocus,
  type SphereGraphFocusLink,
  type SphereGraphNode,
  type SphereGraphTheme,
} from "../src/index";
import "../src/sphere-graph.css";
import {
  bookEdges,
  bookGroupColors,
  bookGroupLabels,
  bookNodes,
} from "./bookGraph";

type Dataset = "book" | "random";

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

function LinkRow({
  link,
  direction,
  onSelect,
}: {
  link: SphereGraphFocusLink;
  direction: "out" | "in";
  onSelect: (id: string) => void;
}) {
  const arrow = direction === "out" ? "→" : "←";
  const kind = link.edge.kind ?? "default";
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(link.node.id)}
        style={{
          display: "flex",
          gap: "0.35rem",
          alignItems: "baseline",
          width: "100%",
          textAlign: "left",
          padding: "0.2rem 0",
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          font: "inherit",
        }}
      >
        <span aria-hidden>{arrow}</span>
        <span style={{ flex: 1 }}>{link.node.label}</span>
        <span
          style={{
            fontSize: "0.75rem",
            opacity: 0.7,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          [{kind}]
        </span>
      </button>
    </li>
  );
}

export default function App() {
  const [dataset, setDataset] = useState<Dataset>("book");
  const randomGraph = useMemo(() => makeFakeGraph(40), []);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [lastActivated, setLastActivated] = useState<string | null>(null);
  const [theme, setTheme] = useState<SphereGraphTheme>("system");
  const dark = useResolvedDark(theme);

  const nodes = dataset === "book" ? bookNodes : randomGraph.nodes;
  const edges = dataset === "book" ? bookEdges : randomGraph.edges;
  const groupColors =
    dataset === "book" ? bookGroupColors : { left: "#30d158", right: "#0a84ff" };

  useEffect(() => {
    setPinnedId(null);
  }, [dataset]);

  function renderDetail(focus: SphereGraphFocus | null) {
    if (!focus) return <p>Hover or click a node to explore connections.</p>;

    const chapter =
      focus.node.group && bookGroupLabels[focus.node.group]
        ? bookGroupLabels[focus.node.group]
        : focus.node.group;

    return (
      <div>
        <h3 style={{ marginTop: 0 }}>{focus.node.label}</h3>
        {chapter && (
          <p style={{ marginTop: "-0.25rem", fontSize: "0.85rem" }}>{chapter}</p>
        )}

        <h4 style={{ marginBottom: "0.25rem" }}>Outgoing ({focus.outgoing.length})</h4>
        {focus.outgoing.length === 0 ? (
          <p style={{ marginTop: 0 }}>None</p>
        ) : (
          <ul style={{ marginTop: 0, paddingLeft: "1.1rem" }}>
            {focus.outgoing.map((link) => (
              <LinkRow
                key={`out-${link.edge.source}-${link.edge.target}-${link.edge.kind ?? ""}`}
                link={link}
                direction="out"
                onSelect={setPinnedId}
              />
            ))}
          </ul>
        )}

        <h4 style={{ marginBottom: "0.25rem" }}>Incoming ({focus.incoming.length})</h4>
        {focus.incoming.length === 0 ? (
          <p style={{ marginTop: 0 }}>None</p>
        ) : (
          <ul style={{ marginTop: 0, paddingLeft: "1.1rem" }}>
            {focus.incoming.map((link) => (
              <LinkRow
                key={`in-${link.edge.source}-${link.edge.target}-${link.edge.kind ?? ""}`}
                link={link}
                direction="in"
                onSelect={setPinnedId}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }

  const buttonStyle = (active: boolean): CSSProperties => ({
    padding: "0.25rem 0.6rem",
    borderRadius: 6,
    border: "1px solid currentColor",
    opacity: active ? 1 : 0.65,
    fontWeight: active ? 700 : 500,
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
  });

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
        Chapters are groups on the sphere. Edge kinds show how nodes connect:{" "}
        <strong>sequential</strong> (solid), <strong>reference</strong> (dashed flashback),{" "}
        <strong>cause</strong> (arrow). Drag to orbit, scroll to zoom, click to pin, double-click
        to activate. Click a neighbor in the panel to jump focus.
      </p>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          Dataset:
          {(["book", "random"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDataset(value)}
              aria-pressed={dataset === value}
              style={buttonStyle(dataset === value)}
            >
              {value}
            </button>
          ))}
        </span>

        <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          Theme:
          {(["light", "dark", "system"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              style={buttonStyle(theme === value)}
            >
              {value}
            </button>
          ))}
        </span>
      </div>

      {dataset === "book" && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "0.75rem",
            fontSize: "0.85rem",
          }}
        >
          {Object.entries(bookGroupLabels).map(([key, label]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: bookGroupColors[key],
                }}
              />
              {label}
            </span>
          ))}
          <span style={{ opacity: 0.75 }}>
            Edges: solid = sequential · dashed = reference · arrow = directed/cause
          </span>
        </div>
      )}

      {lastActivated && <p>Last activated: {lastActivated}</p>}

      <SphereGraph
        nodes={nodes}
        edges={edges}
        theme={theme}
        groupColors={groupColors}
        pinnedId={pinnedId}
        onPinnedIdChange={setPinnedId}
        onNodeActivate={(node) => setLastActivated(node.id)}
        renderDetail={renderDetail}
      />
    </div>
  );
}
