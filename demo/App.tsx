import { useEffect, useMemo, useState } from "react";
import {
  SphereGraph,
  type SphereGraphEdge,
  type SphereGraphFocus,
  type SphereGraphFocusLink,
  type SphereGraphNode,
  type SphereGraphTheme,
} from "../src/index";
import "../src/sphere-graph.css";
import "./demo.css";
import {
  bookEdgeKinds,
  bookEdges,
  bookGroupColors,
  bookGroupLabels,
  bookNodes,
} from "./bookGraph";
import {
  citationEdges,
  citationGroupColors,
  citationGroupLabels,
  citationNodes,
} from "./citationGraph";

type Dataset = "book" | "citations" | "random";

const DATASET_LABELS: Record<Dataset, string> = {
  book: "Book",
  citations: "Citations",
  random: "Random (40)",
};

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

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="demo__control-group">
      <span className="demo__control-label">{label}</span>
      <div className="demo__segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option === "book" || option === "citations" || option === "random"
              ? DATASET_LABELS[option as Dataset]
              : option}
          </button>
        ))}
      </div>
    </div>
  );
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
  const kind = link.edge.kind ?? "default";
  const weight = link.edge.weight != null ? ` · w=${link.edge.weight}` : "";
  return (
    <li>
      <button type="button" className="demo__link-btn" onClick={() => onSelect(link.node.id)}>
        <span aria-hidden>{direction === "out" ? "→" : "←"}</span>
        <span className="demo__link-label">{link.node.label}</span>
        <span className="demo__link-meta">
          {kind}
          {weight}
        </span>
      </button>
    </li>
  );
}

export default function App() {
  const [dataset, setDataset] = useState<Dataset>("book");
  const randomGraph = useMemo(() => makeFakeGraph(40), []);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [lastActivated, setLastActivated] = useState<string | null>(null);
  const [theme, setTheme] = useState<SphereGraphTheme>("system");
  const [embedMode, setEmbedMode] = useState(false);
  const [showSecondHop, setShowSecondHop] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<string[] | undefined>(undefined);
  const [visibleEdgeKinds, setVisibleEdgeKinds] = useState<string[] | undefined>(undefined);
  const dark = useResolvedDark(theme);

  const nodes =
    dataset === "book" ? bookNodes : dataset === "citations" ? citationNodes : randomGraph.nodes;
  const edges =
    dataset === "book" ? bookEdges : dataset === "citations" ? citationEdges : randomGraph.edges;
  const groupColors =
    dataset === "book"
      ? bookGroupColors
      : dataset === "citations"
        ? citationGroupColors
        : { left: "#30d158", right: "#0a84ff" };
  const groupLabels =
    dataset === "book" ? bookGroupLabels : dataset === "citations" ? citationGroupLabels : null;
  const edgeKindOptions =
    dataset === "book"
      ? [...bookEdgeKinds]
      : dataset === "citations"
        ? ["citation", "reference"]
        : null;

  useEffect(() => {
    setPinnedId(null);
    setSearchQuery("");
    setVisibleGroups(undefined);
    setVisibleEdgeKinds(undefined);
  }, [dataset]);

  function toggleGroup(group: string) {
    setVisibleGroups((prev) => {
      const all = Object.keys(groupLabels ?? {});
      const current = prev ?? all;
      const next = current.includes(group)
        ? current.filter((g) => g !== group)
        : [...current, group];
      return next.length === all.length ? undefined : next;
    });
  }

  function toggleEdgeKind(kind: string) {
    setVisibleEdgeKinds((prev) => {
      const all = edgeKindOptions ?? [];
      const current = prev ?? all;
      const next = current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind];
      return next.length === all.length ? undefined : next;
    });
  }

  function renderDetail(focus: SphereGraphFocus | null) {
    if (!focus) {
      return <p>Hover or click a node to explore its incoming and outgoing links.</p>;
    }

    const chapter =
      focus.node.group && groupLabels?.[focus.node.group]
        ? groupLabels[focus.node.group]
        : focus.node.group;

    return (
      <div>
        <h3 className="demo__detail-title">{focus.node.label}</h3>
        {chapter && <p className="demo__detail-sub">{chapter}</p>}
        {focus.node.description && <p className="demo__detail-desc">{focus.node.description}</p>}
        {focus.node.tags && focus.node.tags.length > 0 && (
          <p className="demo__detail-tags">Tags: {focus.node.tags.join(", ")}</p>
        )}

        <h4 className="demo__detail-section">Outgoing ({focus.outgoing.length})</h4>
        {focus.outgoing.length === 0 ? (
          <p className="demo__detail-tags">None</p>
        ) : (
          <ul className="demo__link-list">
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

        <h4 className="demo__detail-section">Incoming ({focus.incoming.length})</h4>
        {focus.incoming.length === 0 ? (
          <p className="demo__detail-tags">None</p>
        ) : (
          <ul className="demo__link-list">
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

  const graphProps = {
    nodes,
    edges,
    theme,
    groupColors,
    fitParent: embedMode,
    showSecondHop,
    visibleGroups,
    visibleEdgeKinds,
    showSearchBar: true as const,
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    onSearchMatchesChange: (matches: SphereGraphNode[]) => setMatchCount(matches.length),
    pinnedId,
    onPinnedIdChange: setPinnedId,
    onNodeActivate: (node: SphereGraphNode) => setLastActivated(node.label),
    renderDetail,
  };

  return (
    <div className={`demo${dark ? " demo--dark" : ""}`}>
      <div className="demo__page">
        <header className="demo__header">
          <h1 className="demo__title">sphere-graph</h1>
          <p className="demo__lead">
            Explore dense knowledge graphs on a sphere — search, filter, and focus without the
            force-directed hairball. Drag to orbit, scroll to zoom, click to pin. Press{" "}
            <kbd>/</kbd> for search, <kbd>Tab</kbd> to cycle nodes, <kbd>Enter</kbd> to activate.
          </p>
        </header>

        <section className="demo__panel" aria-label="Controls">
          <h2 className="demo__panel-title">Controls</h2>
          <div className="demo__controls">
            <Segmented
              label="Dataset"
              value={dataset}
              options={["book", "citations", "random"] as const}
              onChange={setDataset}
            />
            <Segmented
              label="Theme"
              value={theme}
              options={["light", "dark", "system"] as const}
              onChange={setTheme}
            />
            <div className="demo__control-group">
              <span className="demo__control-label">Display</span>
              <div className="demo__toggle-row">
                <label className="demo__toggle">
                  <input
                    type="checkbox"
                    checked={embedMode}
                    onChange={(e) => setEmbedMode(e.target.checked)}
                  />
                  <span className="demo__toggle-text">
                    <strong>Dashboard embed</strong>
                    <span>
                      Uses <code>fitParent</code> — the graph fills a fixed container (height +
                      width), like a widget in your app
                    </span>
                  </span>
                </label>
                <label className="demo__toggle">
                  <input
                    type="checkbox"
                    checked={showSecondHop}
                    onChange={(e) => setShowSecondHop(e.target.checked)}
                  />
                  <span className="demo__toggle-text">
                    <strong>Second-hop neighbors</strong>
                    <span>Show neighbors-of-neighbors when a node is pinned</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {(groupLabels || edgeKindOptions) && (
          <section className="demo__panel" aria-label="Filters">
            <h2 className="demo__panel-title">Filters</h2>
            {groupLabels && (
              <div className="demo__control-group" style={{ marginBottom: edgeKindOptions ? "0.75rem" : 0 }}>
                <span className="demo__control-label">Groups</span>
                <div className="demo__filters">
                  {Object.entries(groupLabels).map(([key, label]) => {
                    const active = !visibleGroups || visibleGroups.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        className="demo__filter-chip"
                        aria-pressed={active}
                        onClick={() => toggleGroup(key)}
                      >
                        <span className="demo__swatch" style={{ background: groupColors[key] }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {edgeKindOptions && (
              <div className="demo__control-group">
                <span className="demo__control-label">Edge kinds</span>
                <div className="demo__filters">
                  {edgeKindOptions.map((kind) => {
                    const active = !visibleEdgeKinds || visibleEdgeKinds.includes(kind);
                    return (
                      <button
                        key={kind}
                        type="button"
                        className="demo__filter-chip"
                        aria-pressed={active}
                        onClick={() => toggleEdgeKind(kind)}
                      >
                        {kind}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {(searchQuery.trim() || lastActivated) && (
          <div className="demo__status" aria-live="polite">
            {searchQuery.trim() && (
              <span className="demo__status-item">
                Search: <strong>{matchCount}</strong> match{matchCount === 1 ? "" : "es"}
              </span>
            )}
            {lastActivated && (
              <span className="demo__status-item">
                Last activated: <strong>{lastActivated}</strong>
              </span>
            )}
          </div>
        )}

        {embedMode ? (
          <section className="demo__panel demo__embed" aria-label="Embedded graph preview">
            <div className="demo__embed-header">
              <h2>Dashboard widget preview</h2>
              <p>
                Drag the bottom edge to resize — the graph adapts to the container bounds
              </p>
            </div>
            <div className="demo__embed-frame">
              <SphereGraph {...graphProps} />
            </div>
          </section>
        ) : (
          <section className="demo__panel demo__graph-panel" aria-label="Graph">
            <SphereGraph {...graphProps} />
          </section>
        )}
      </div>
    </div>
  );
}
