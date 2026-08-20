import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { buildAdjacency, computeDegree, edgesForFocus } from "./graph";
import { layoutOnSphere } from "./layout";
import { project } from "./project";
import type { SphereGraphEdge, SphereGraphNode } from "./types";

export interface SphereGraphFocus {
  node: SphereGraphNode;
  /** Undirected neighbors of `node`, derived from `edges`. */
  neighbors: SphereGraphNode[];
}

export interface SphereGraphProps {
  nodes: SphereGraphNode[];
  edges: SphereGraphEdge[];
  /** Color per `group` value. Nodes whose group has no entry use `defaultColor`. */
  groupColors?: Record<string, string>;
  defaultColor?: string;
  /** SVG viewBox size. */
  width?: number;
  height?: number;
  /** Fires on double-click — typically "open this node". */
  onNodeActivate?: (node: SphereGraphNode) => void;
  /** Fires whenever the hovered-or-pinned node changes. */
  onFocusChange?: (focus: SphereGraphFocus | null) => void;
  /** Renders the side panel content for the current focus (or `null` when nothing is focused). */
  renderDetail?: (focus: SphereGraphFocus | null) => ReactNode;
  className?: string;
}

const DEFAULT_WIDTH = 1100;
const DEFAULT_HEIGHT = 780;
const DEFAULT_COLOR = "#6b7280";
const NODE_BASE_RADIUS = 12;
const FOCAL_LENGTH = 800;

/**
 * A 3D knowledge-graph viewer. Nodes are placed with sphere packing
 * (guaranteed gaps) instead of a force simulation, and edges are drawn only
 * for the focused node — drawing every edge in a densely cross-linked graph
 * is unreadable no matter how good the node layout is.
 */
export function SphereGraph({
  nodes,
  edges,
  groupColors = {},
  defaultColor = DEFAULT_COLOR,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  onNodeActivate,
  onFocusChange,
  renderDetail,
  className,
}: SphereGraphProps) {
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const degree = useMemo(() => computeDegree(edges), [edges]);
  const adjacency = useMemo(() => buildAdjacency(edges), [edges]);
  const laidOut = useMemo(() => layoutOnSphere(nodes), [nodes]);

  const [yaw, setYaw] = useState(0.55);
  const [pitch, setPitch] = useState(-0.25);
  const [distance, setDistance] = useState(3.2);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const focusId = hovered ?? selected;

  const projected = useMemo(
    () => project(laidOut, { yaw, pitch, distance, width, height, focal: FOCAL_LENGTH }),
    [laidOut, yaw, pitch, distance, width, height],
  );
  const projectedById = useMemo(() => new Map(projected.map((p) => [p.id, p])), [projected]);

  const focusNeighborIds = useMemo(
    () => (focusId ? adjacency.get(focusId) ?? new Set<string>() : null),
    [focusId, adjacency],
  );

  const focus: SphereGraphFocus | null = useMemo(() => {
    if (!focusId) return null;
    const node = nodesById.get(focusId);
    if (!node) return null;
    const neighbors = [...(focusNeighborIds ?? [])]
      .map((id) => nodesById.get(id))
      .filter((n): n is SphereGraphNode => Boolean(n));
    return { node, neighbors };
  }, [focusId, nodesById, focusNeighborIds]);

  useEffect(() => {
    onFocusChange?.(focus);
    // `onFocusChange` is intentionally excluded: consumers that don't
    // memoize it would otherwise retrigger this effect every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const visibleEdges = useMemo(
    () => (focusId ? edgesForFocus(edges, focusId) : []),
    [focusId, edges],
  );

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    yaw: number;
    pitch: number;
    moved: boolean;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Slow idle spin so depth reads clearly without requiring interaction.
  const [autoSpin, setAutoSpin] = useState(true);
  useEffect(() => {
    if (!autoSpin) return;
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
  }, [autoSpin]);

  // React registers onWheel as a passive listener, so e.preventDefault()
  // throws instead of stopping page scroll. Attach a real, non-passive
  // listener instead.
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

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
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
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    setYaw(drag.yaw + dx * 0.008);
    setPitch(Math.max(-1.2, Math.min(1.2, drag.pitch + dy * 0.008)));
  }

  function handlePointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  function resetView() {
    setYaw(0.55);
    setPitch(-0.25);
    setDistance(3.2);
    setSelected(null);
    setHovered(null);
    setAutoSpin(true);
  }

  return (
    <div className={["sphere-graph", className].filter(Boolean).join(" ")}>
      <div className="sphere-graph__toolbar">
        <button type="button" className="sphere-graph__reset" onClick={resetView}>
          Reset view
        </button>
      </div>
      <div className={`sphere-graph__body${renderDetail ? "" : " sphere-graph__body--no-detail"}`}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="sphere-graph__svg"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={Math.min(width, height) * 0.32}
            ry={Math.min(width, height) * 0.32}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth={1}
          />

          {visibleEdges.map((edge) => {
            const a = projectedById.get(edge.source);
            const b = projectedById.get(edge.target);
            if (!a || !b) return null;
            return (
              <line
                key={`${edge.source}->${edge.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#6a6a6a"
                strokeWidth={1.6}
                opacity={0.85}
              />
            );
          })}

          {projected.map((p) => {
            const node = p.source;
            const isFocus = focusId === node.id;
            const isNeighbor = focusNeighborIds?.has(node.id) ?? false;
            const dimmed = Boolean(focusId) && !isFocus && !isNeighbor;
            const weight = node.weight ?? degree.get(node.id) ?? 0;
            const radius =
              (NODE_BASE_RADIUS + Math.min(weight, 10) * 0.7) *
              Math.min(Math.max(p.scale, 0.55), 1.4);
            const opacity = dimmed ? 0.2 : Math.min(1, 0.55 + p.scale * 0.4);
            const color = groupColors[node.group ?? ""] ?? defaultColor;

            return (
              <g
                key={node.id}
                transform={`translate(${p.x},${p.y})`}
                onPointerEnter={(e) => {
                  e.stopPropagation();
                  setHovered(node.id);
                }}
                onPointerLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragRef.current?.moved) return;
                  setSelected(node.id);
                  setAutoSpin(false);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onNodeActivate?.(node);
                }}
                style={{ cursor: "pointer" }}
              >
                <circle
                  r={isFocus ? radius * 1.2 : radius}
                  fill={color}
                  opacity={opacity}
                  stroke={isFocus ? "#111" : "#fff"}
                  strokeWidth={isFocus ? 2.5 : 1.5}
                />
                {(isFocus || isNeighbor || !focusId) && (
                  <text
                    y={radius + 14}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={isFocus ? 700 : 500}
                    fill={dimmed ? "#bbb" : "#222"}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {renderDetail && (
          <aside className="sphere-graph__detail" aria-live="polite">
            {renderDetail(focus)}
          </aside>
        )}
      </div>
    </div>
  );
}
