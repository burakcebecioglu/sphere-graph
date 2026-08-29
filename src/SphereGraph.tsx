import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { computeEdgeWeightRange, edgeStrokeWidth } from "./edgeWeight";
import { edgeMatchesKindFilter, nodeMatchesGroupFilter } from "./filter";
import {
  computeDegree,
  edgesForFocus,
  edgesForFocusWithSecondHop,
  focusLinks,
  neighborsForFocus,
} from "./graph";
import { layoutOnSphere } from "./layout";
import { project } from "./project";
import { sanitizeGraph } from "./sanitize";
import { searchMatchIds, searchNodes } from "./search";
import type { Projected2D, SphereGraphEdge, SphereGraphNode } from "./types";

export interface SphereGraphFocusLink {
  edge: SphereGraphEdge;
  node: SphereGraphNode;
}

export interface SphereGraphFocus {
  node: SphereGraphNode;
  neighbors: SphereGraphNode[];
  outgoing: SphereGraphFocusLink[];
  incoming: SphereGraphFocusLink[];
}

export type SphereGraphTheme = "light" | "dark" | "system";

export interface SphereGraphProps {
  nodes: SphereGraphNode[];
  edges: SphereGraphEdge[];
  groupColors?: Record<string, string>;
  defaultColor?: string;
  width?: number;
  height?: number;
  fitParent?: boolean;
  theme?: SphereGraphTheme;
  onNodeActivate?: (node: SphereGraphNode) => void;
  onFocusChange?: (focus: SphereGraphFocus | null) => void;
  renderDetail?: (focus: SphereGraphFocus | null) => ReactNode;
  pinnedId?: string | null;
  onPinnedIdChange?: (id: string | null) => void;
  initialPinnedId?: string | null;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearchMatchesChange?: (matches: SphereGraphNode[]) => void;
  showSearchBar?: boolean;
  visibleGroups?: string[];
  visibleEdgeKinds?: string[];
  showSecondHop?: boolean;
  renderNodeLabel?: (node: SphereGraphNode, projected: Projected2D) => ReactNode;
  renderNode?: (
    node: SphereGraphNode,
    projected: Projected2D,
    defaults: { radius: number; color: string; opacity: number; isFocus: boolean },
  ) => ReactNode;
  className?: string;
}

const DEFAULT_WIDTH = 1100;
const DEFAULT_HEIGHT = 780;
const DEFAULT_COLOR = "#6b7280";
const NODE_BASE_RADIUS = 12;
const FOCAL_LENGTH = 800;
const LABEL_LOD_NODE_THRESHOLD = 80;

type ProjectedNode = Projected2D & { source: SphereGraphNode };

export function SphereGraph({
  nodes: rawNodes,
  edges: rawEdges,
  groupColors = {},
  defaultColor = DEFAULT_COLOR,
  width: widthProp = DEFAULT_WIDTH,
  height: heightProp = DEFAULT_HEIGHT,
  fitParent = false,
  theme = "system",
  onNodeActivate,
  onFocusChange,
  renderDetail,
  pinnedId: pinnedIdProp,
  onPinnedIdChange,
  initialPinnedId = null,
  searchQuery: searchQueryProp,
  onSearchQueryChange,
  onSearchMatchesChange,
  showSearchBar = false,
  visibleGroups,
  visibleEdgeKinds,
  showSecondHop = false,
  renderNodeLabel,
  renderNode,
  className,
}: SphereGraphProps) {
  const { nodes, edges } = useMemo(
    () => sanitizeGraph(rawNodes, rawEdges),
    [rawNodes, rawEdges],
  );

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const degree = useMemo(() => computeDegree(edges), [edges]);
  const edgeWeightRange = useMemo(() => computeEdgeWeightRange(edges), [edges]);
  const laidOut = useMemo(() => layoutOnSphere(nodes), [nodes]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastJumpQuery = useRef("");
  const [fitSize, setFitSize] = useState({ width: widthProp, height: heightProp });
  const width = fitParent ? fitSize.width : widthProp;
  const height = fitParent ? fitSize.height : heightProp;

  const [internalSearch, setInternalSearch] = useState("");
  const isSearchControlled = searchQueryProp !== undefined;
  const searchQuery = isSearchControlled ? searchQueryProp : internalSearch;
  const searchMatches = useMemo(() => searchMatchIds(nodes, searchQuery), [nodes, searchQuery]);
  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!onSearchMatchesChange) return;
    onSearchMatchesChange(nodes.filter((n) => searchMatches.has(n.id)));
  }, [nodes, searchMatches, onSearchMatchesChange]);

  useEffect(() => {
    if (!fitParent || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w > 0 && h > 0) setFitSize({ width: Math.round(w), height: Math.round(h) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitParent]);

  const [yaw, setYaw] = useState(0.55);
  const [pitch, setPitch] = useState(-0.25);
  const [distance, setDistance] = useState(3.2);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedInternal, setSelectedInternal] = useState<string | null>(initialPinnedId);
  const [keyboardIndex, setKeyboardIndex] = useState(0);
  const [neighborIndex, setNeighborIndex] = useState(0);
  const isPinnedControlled = onPinnedIdChange !== undefined;
  const selected = isPinnedControlled ? (pinnedIdProp ?? null) : selectedInternal;
  const focusId = hovered ?? selected;

  const projected = useMemo(
    () => project(laidOut, { yaw, pitch, distance, width, height, focal: FOCAL_LENGTH }),
    [laidOut, yaw, pitch, distance, width, height],
  ) as ProjectedNode[];
  const projectedById = useMemo(() => new Map(projected.map((p) => [p.id, p])), [projected]);

  const focusNeighborIds = useMemo(
    () => (focusId ? neighborsForFocus(edges, focusId) : null),
    [focusId, edges],
  );

  const focus: SphereGraphFocus | null = useMemo(() => {
    if (!focusId) return null;
    const node = nodesById.get(focusId);
    if (!node) return null;
    const { outgoing: outEdges, incoming: inEdges } = focusLinks(edges, focusId);
    const outgoing = outEdges
      .map((edge) => {
        const linked = nodesById.get(edge.target);
        return linked ? { edge, node: linked } : null;
      })
      .filter((link): link is SphereGraphFocusLink => Boolean(link));
    const incoming = inEdges
      .map((edge) => {
        const linked = nodesById.get(edge.source);
        return linked ? { edge, node: linked } : null;
      })
      .filter((link): link is SphereGraphFocusLink => Boolean(link));
    const neighborIds = neighborsForFocus(edges, focusId);
    const neighbors = [...neighborIds]
      .map((id) => nodesById.get(id))
      .filter((n): n is SphereGraphNode => Boolean(n));
    return { node, neighbors, outgoing, incoming };
  }, [focusId, nodesById, edges]);

  useEffect(() => {
    onFocusChange?.(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      lastJumpQuery.current = "";
      return;
    }
    if (q === lastJumpQuery.current) return;
    lastJumpQuery.current = q;
    const first = searchNodes(nodes, q)[0];
    if (!first) return;
    setSelected(first.id);
    setHovered(null);
    setAutoSpin(false);
    const p = projectedById.get(first.id);
    if (p) {
      const cx = width / 2;
      const dx = (p.x - cx) / cx;
      if (Math.abs(dx) > 0.2) setYaw((y) => y + dx * 0.12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, nodes]);

  const visibleEdgeList = useMemo(() => {
    if (!focusId) return [];
    const raw = showSecondHop
      ? edgesForFocusWithSecondHop(edges, focusId)
      : edgesForFocus(edges, focusId).map((edge) => ({ edge, hop: 1 as const }));
    return raw.filter(({ edge }) => edgeMatchesKindFilter(edge, visibleEdgeKinds));
  }, [focusId, edges, showSecondHop, visibleEdgeKinds]);

  const navigableNodeIds = useMemo(() => projected.map((p) => p.id), [projected]);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    yaw: number;
    pitch: number;
    moved: boolean;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [autoSpin, setAutoSpin] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!autoSpin || reduceMotion) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setYaw((y) => y + dt * 0.18);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin, reduceMotion]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setAutoSpin(false);
      setDistance((d) => Math.min(5.5, Math.max(2.2, d + e.deltaY * 0.0025)));
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && showSearchBar) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        setSelected(null);
        setHovered(null);
        return;
      }
      if (e.key === "Enter" && focusId) {
        const node = nodesById.get(focusId);
        if (node) onNodeActivate?.(node);
        return;
      }
      if (navigableNodeIds.length === 0) return;
      if (e.key === "Tab") {
        e.preventDefault();
        setAutoSpin(false);
        const delta = e.shiftKey ? -1 : 1;
        const next = (keyboardIndex + delta + navigableNodeIds.length) % navigableNodeIds.length;
        setKeyboardIndex(next);
        setSelected(navigableNodeIds[next]!);
        setHovered(null);
        return;
      }
      if (
        (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") &&
        focusId &&
        focus &&
        focus.neighbors.length > 0
      ) {
        e.preventDefault();
        setAutoSpin(false);
        const ids = focus.neighbors.map((n) => n.id).sort();
        const currentIdx = ids.indexOf(focusId);
        const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
        const base = currentIdx >= 0 ? currentIdx : neighborIndex;
        const next = (base + delta + ids.length) % ids.length;
        setNeighborIndex(next);
        setSelected(ids[next]!);
        setHovered(null);
      }
    };
    root.addEventListener("keydown", handleKeyDown);
    return () => root.removeEventListener("keydown", handleKeyDown);
  }, [focusId, focus, keyboardIndex, neighborIndex, navigableNodeIds, nodesById, onNodeActivate, showSearchBar]);

  function setSelected(id: string | null) {
    if (isPinnedControlled) onPinnedIdChange?.(id);
    else setSelectedInternal(id);
    if (id) {
      const idx = navigableNodeIds.indexOf(id);
      if (idx >= 0) setKeyboardIndex(idx);
    }
  }

  function setSearchQuery(value: string) {
    if (!isSearchControlled) setInternalSearch(value);
    onSearchQueryChange?.(value);
  }

  function resetView() {
    setYaw(0.55);
    setPitch(-0.25);
    setDistance(3.2);
    setSelected(null);
    setHovered(null);
    setAutoSpin(!reduceMotion);
  }

  function edgeClassName(edge: SphereGraphEdge, hop: 1 | 2): string {
    const classes = ["sphere-graph__edge"];
    if (hop === 2) classes.push("sphere-graph__edge--second-hop");
    if (edge.kind === "reference") classes.push("sphere-graph__edge--reference");
    if (edge.directed === true || edge.kind === "cause") classes.push("sphere-graph__edge--directed");
    return classes.join(" ");
  }

  const empty = nodes.length === 0;

  return (
    <div
      ref={rootRef}
      className={["sphere-graph", fitParent ? "sphere-graph--fit" : "", className]
        .filter(Boolean)
        .join(" ")}
      data-theme={theme}
      tabIndex={0}
      role="application"
      aria-label="Sphere graph viewer"
    >
      <div className="sphere-graph__toolbar">
        {showSearchBar && (
          <input
            ref={searchInputRef}
            type="search"
            className="sphere-graph__search"
            placeholder="Search nodes… (/ to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search nodes"
          />
        )}
        <button type="button" className="sphere-graph__reset" onClick={resetView}>
          Reset view
        </button>
      </div>
      <div
        className={`sphere-graph__body${renderDetail ? "" : " sphere-graph__body--no-detail"}`}
      >
        {empty ? (
          <div className="sphere-graph__empty" role="status">
            No nodes to display.
          </div>
        ) : (
          <div
            className="sphere-graph__canvas"
            ref={fitParent ? containerRef : undefined}
          >
            <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="sphere-graph__svg"
            onPointerDown={(e) => {
              setAutoSpin(false);
              (e.target as Element).setPointerCapture?.(e.pointerId);
              dragRef.current = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                yaw,
                pitch,
                moved: false,
              };
            }}
            onPointerMove={(e) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== e.pointerId) return;
              const dx = e.clientX - drag.startX;
              const dy = e.clientY - drag.startY;
              if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
              setYaw(drag.yaw + dx * 0.008);
              setPitch(Math.max(-1.2, Math.min(1.2, drag.pitch + dy * 0.008)));
            }}
            onPointerUp={(e) => {
              if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
            }}
            onPointerCancel={(e) => {
              if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
            }}
          >
            <defs>
              <marker id="sg-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L8,4 L0,8 Z" className="sphere-graph__edge-arrow" />
              </marker>
            </defs>
            <ellipse className="sphere-graph__orbit" cx={width / 2} cy={height / 2} rx={Math.min(width, height) * 0.32} ry={Math.min(width, height) * 0.32} />
            {visibleEdgeList.map(({ edge, hop }) => {
              const a = projectedById.get(edge.source);
              const b = projectedById.get(edge.target);
              if (!a || !b) return null;
              return (
                <line
                  key={`${edge.source}->${edge.target}:${edge.kind ?? ""}:${hop}`}
                  className={edgeClassName(edge, hop)}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  strokeWidth={edgeStrokeWidth(edge, edgeWeightRange)}
                />
              );
            })}
            {projected.map((p) => {
              const node = p.source;
              if (!nodeMatchesGroupFilter(node, visibleGroups)) return null;
              const isFocus = focusId === node.id;
              const isNeighbor = focusNeighborIds?.has(node.id) ?? false;
              const isSearchMatch = !isSearching || searchMatches.has(node.id);
              const weight = node.weight ?? degree.get(node.id) ?? 0;
              const radius = (NODE_BASE_RADIUS + Math.min(weight, 10) * 0.7) * Math.min(Math.max(p.scale, 0.55), 1.4);
              let opacity = Math.min(1, 0.55 + p.scale * 0.4);
              if (isSearching && !isSearchMatch && !isFocus && !isNeighbor) opacity = 0.12;
              else if (focusId && !isFocus && !isNeighbor) opacity = 0.2;
              const color = groupColors[node.group ?? ""] ?? defaultColor;
              const showLbl =
                (nodes.length <= LABEL_LOD_NODE_THRESHOLD || p.scale >= 0.65 || isFocus) &&
                (isFocus || isNeighbor || !focusId);
              const nodeHandlers = {
                onPointerEnter: (e: ReactPointerEvent) => {
                  e.stopPropagation();
                  setHovered(node.id);
                },
                onPointerLeave: () => setHovered(null),
                onClick: (e: ReactMouseEvent) => {
                  e.stopPropagation();
                  if (dragRef.current?.moved) return;
                  setSelected(node.id);
                  setAutoSpin(false);
                },
                onDoubleClick: (e: ReactMouseEvent) => {
                  e.stopPropagation();
                  onNodeActivate?.(node);
                },
              };
              const a11y = {
                role: "button" as const,
                "aria-label": `${node.label}${node.group ? `, ${node.group}` : ""}`,
                "aria-pressed": isFocus,
              };
              if (renderNode) {
                return (
                  <g key={node.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} {...nodeHandlers} {...a11y}>
                    {renderNode(node, p, { radius, color, opacity, isFocus })}
                  </g>
                );
              }
              return (
                <g key={node.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} {...nodeHandlers} {...a11y}>
                  <circle
                    className={
                      isFocus ? "sphere-graph__node sphere-graph__node--focus"
                      : isSearching && isSearchMatch ? "sphere-graph__node sphere-graph__node--match"
                      : "sphere-graph__node"
                    }
                    r={isFocus ? radius * 1.2 : radius}
                    fill={color}
                    opacity={opacity}
                  />
                  {showLbl &&
                    (renderNodeLabel ? (
                      renderNodeLabel(node, p)
                    ) : (
                      <text className="sphere-graph__label" y={radius + 14} textAnchor="middle" fontSize={11} fontWeight={isFocus ? 700 : 500}>
                        {node.label}
                      </text>
                    ))}
                </g>
              );
            })}
          </svg>
          </div>
        )}
        {renderDetail && (
          <aside className="sphere-graph__detail" aria-live="polite">
            {renderDetail(focus)}
          </aside>
        )}
      </div>
    </div>
  );
}
