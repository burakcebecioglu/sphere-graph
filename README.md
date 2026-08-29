# sphere-graph

A framework-agnostic sphere layout, plus a React SVG component, for
rendering dense node-link graphs without the "hairball" a force-directed
layout produces.

![sphere-graph demo — 3-chapter book graph with typed directed focus edges and incoming/outgoing detail panel](docs/sphere-graph-demo.png)

## Why

Force-directed layouts (d3-force and friends) work well for sparse graphs.
Once a graph gets dense enough — every node linking to several others — the
physics collapses everything into an unreadable clump in the middle, no
matter how much you tune charge/collision.

`sphere-graph` sidesteps the physics: it places every node on a sphere with
guaranteed angular spacing (a Fibonacci lattice, optionally split into one
longitude wedge per group), then renders it with a simple orbit camera. You
get visible gaps between nodes at any graph size, with no simulation to
tune, and edges are only drawn for the focused node — drawing all of them at
once is unreadable even with perfect spacing.

## Install

```bash
npm install sphere-graph
```

## Usage

```tsx
import { SphereGraph } from "sphere-graph";
import "sphere-graph/style.css";

const nodes = [
  { id: "a", label: "Opening", group: "ch1" },
  { id: "b", label: "Conflict", group: "ch1" },
  { id: "c", label: "Resolution", group: "ch2" },
];

const edges = [
  { source: "a", target: "b", kind: "sequential", directed: true },
  { source: "b", target: "c", kind: "cause", directed: true },
  { source: "c", target: "a", kind: "reference", directed: true },
];

function Graph() {
  return (
    <SphereGraph
      nodes={nodes}
      edges={edges}
      theme="system"
      groupColors={{ ch1: "#30d158", ch2: "#0a84ff" }}
      onNodeActivate={(node) => console.log("open", node.id)}
      renderDetail={(focus) =>
        focus ? (
          <div>
            <p>{focus.node.label}</p>
            <p>Outgoing: {focus.outgoing.length}</p>
            <p>Incoming: {focus.incoming.length}</p>
          </div>
        ) : (
          <p>Hover a node</p>
        )
      }
    />
  );
}
```

## Theming

Pass `theme="light" | "dark" | "system"` (default `system`). Chrome, canvas, edges, labels, and the detail panel follow that setting. Node fill colors still come from `groupColors`.

For a custom palette, override the `--sg-*` CSS variables on `.sphere-graph` (or a parent):

| Token | Role |
|---|---|
| `--sg-surface` / `--sg-surface-hover` | Panels and buttons |
| `--sg-canvas-inner` / `--sg-canvas-mid` / `--sg-canvas-outer` | SVG radial background |
| `--sg-orbit` / `--sg-edge` | Guide ring and focus edges |
| `--sg-node-stroke` / `--sg-node-stroke-focus` | Node outlines |
| `--sg-label` / `--sg-label-dim` | Label text |
| `--sg-ink` / `--sg-ink-muted` / `--sg-hairline` | Detail panel text and borders |

## API

### `<SphereGraph />`

| Prop | Type | Description |
|---|---|---|
| `nodes` | `SphereGraphNode[]` | `{ id, label, group?, weight? }` |
| `edges` | `SphereGraphEdge[]` | `{ source, target, kind?, directed? }` |
| `groupColors` | `Record<string, string>` | Color per `group` value |
| `defaultColor` | `string` | Fallback color for ungrouped/unmapped nodes |
| `theme` | `"light" \| "dark" \| "system"` | Appearance (default `system`) |
| `width` / `height` | `number` | SVG viewBox size (default `1100`×`780`) |
| `pinnedId` | `string \| null` | Controlled pinned node (pair with `onPinnedIdChange`) |
| `onPinnedIdChange` | `(id \| null) => void` | Fires when the user clicks to pin/unpin |
| `onNodeActivate` | `(node) => void` | Fires on double-click |
| `onFocusChange` | `(focus \| null) => void` | Fires whenever the hovered/pinned node changes |
| `renderDetail` | `(focus \| null) => ReactNode` | Renders the side panel; omit to hide it |

Interaction: drag to orbit, scroll to zoom, click a node to pin its focus,
double-click to activate it.

### Edge metadata

Edges accept optional semantic fields (all backward compatible):

| Field | Type | Description |
|---|---|---|
| `kind` | `string` | Free-form type, e.g. `"sequential"`, `"reference"`, `"cause"` |
| `directed` | `boolean` | When `true`, focus treats `source→target` as one-way (default `false`) |

When a node is focused, edges touching it are styled:

| Condition | Visual |
|---|---|
| default / `sequential` | solid line |
| `kind === "reference"` | dashed line |
| `directed === true` or `kind === "cause"` | arrow toward `target` |

### `SphereGraphFocus`

When a node is hovered or pinned, `onFocusChange` and `renderDetail` receive:

| Field | Type | Description |
|---|---|---|
| `node` | `SphereGraphNode` | The focused node |
| `neighbors` | `SphereGraphNode[]` | Union of linked nodes (backward compatible) |
| `outgoing` | `SphereGraphFocusLink[]` | Edges leaving the node (`{ edge, node }`) |
| `incoming` | `SphereGraphFocusLink[]` | Edges entering the node (`{ edge, node }`) |

### Layout primitives (no React required)

```ts
import {
  layoutOnSphere,
  project,
  computeDegree,
  buildAdjacency,
  buildOutgoing,
  buildIncoming,
  focusLinks,
  neighborsForFocus,
  edgesForFocus,
} from "sphere-graph";
```

Use these directly to render the graph with your own renderer (canvas,
WebGL, a different SVG structure, a server-side snapshot, etc).

- `layoutOnSphere(nodes)` — places `{ id, group? }[]` on the unit sphere.
- `project(nodes, camera)` — rotates + perspective-projects 3D points to 2D, sorted far-to-near.
- `computeDegree` / `buildAdjacency` — undirected weight and adjacency (unchanged).
- `buildOutgoing` / `buildIncoming` / `focusLinks` / `neighborsForFocus` — directed focus helpers.
- `edgesForFocus` — edges to draw for one focused node.

## Local development

```bash
npm install
npm run dev      # demo playground (book graph + random toggle; not published)
npm test         # vitest unit tests
npm run build    # emits dist/ (ESM + .d.ts + style.css)
```

The demo includes a 3-chapter book dataset with sequential, reference, and
cause edges to illustrate typed, directed knowledge graphs on a single sphere.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch model (`develop` → `main`),
worktree setup, and release process. CI runs on pushes and PRs to `main` and
`develop`. npm releases happen when a `vX.Y.Z` tag is pushed to `main`.

Release history: [CHANGELOG.md](CHANGELOG.md).

## License

MIT
